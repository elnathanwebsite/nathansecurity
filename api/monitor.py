from http.server import BaseHTTPRequestHandler
import json
import os
import time
import re
import base64
import hashlib
from upstash_redis import Redis
from cryptography.fernet import Fernet

# ============================================
# ⚙️ SETUP KONEKSI
# ============================================
redis = Redis(
    url=os.environ.get("UPSTASH_REDIS_REST_URL"),
    token=os.environ.get("UPSTASH_REDIS_REST_TOKEN")
)

encrypt_key = os.environ.get("ENCRYPTION_KEY")
if not encrypt_key:
    encrypt_key = Fernet.generate_key()
cipher_suite = Fernet(encrypt_key)

# Pola racun yang 100% pasti jahat
MALICIOUS_PATTERNS = [
    (r'(?i)(union\s+select|insert\s+into\s|drop\s+table)', 'SQL_INJECTION'),
    (r'(?i)(<script.*?>|javascript:\s*|onerror\s*=)', 'XSS_ATTACK'),
    (r'(\.\./|\.\.\\|%2e%2e)', 'PATH_TRAVERSAL'),
    (r'(?i)(;\s*rm\s|;\s*wget\s|;\s*curl\s|`sleep\s)', 'CMD_INJECTION')
]

class handler(BaseHTTPRequestHandler):
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        # WAJIB: Izinkan header API LLM/AI agar tidak kena CORS Error
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Api-Key')
        self.end_headers()

    def do_POST(self):
        try:
            client_ip = self.headers.get('x-forwarded-for', 'unknown').split(',')[0].strip()
            
            # 1. CEK BANNED IP
            if redis.exists(f"ban:{client_ip}"):
                return self.respond_banned(client_ip)

            content_length = int(self.headers.get('Content-Length', 0))
            if content_length > 50000: # Batas 50KB untuk request LLM/API
                self.ban_ip(client_ip, 3600, "OVERSIZED_PAYLOAD")
                return self.respond_banned(client_ip)

            body = json.loads(self.rfile.read(content_length)) if content_length > 0 else {}
            action = body.get('action', '')
            payload = body.get('data', '')

            # 2. ANTI RACUN (SQLi / XSS)
            if payload and self.contains_malicious_payload(payload):
                self.ban_ip(client_ip, 86400, "MALICIOUS_PAYLOAD")
                return self.respond_banned(client_ip)

            # ==========================================
            # A. FITUR KEAMANAN (DIPROTEKSI RATE LIMIT + TURBO CACHE)
            # ==========================================
            if action == 'hide_data':
                if not self.check_limit(f"sec:{client_ip}", 10, 60):
                    self.ban_ip(client_ip, 1800, "SECURITY_SPAM")
                    return self.respond_banned(client_ip)
                    
                # TURBO DB: Cek cache berdasarkan hash payload
                cache_key = f"cache:hide:{hashlib.md5(str(payload).encode()).hexdigest()}"
                cached_result = redis.get(cache_key)
                
                if cached_result:
                    result = cached_result
                    is_boosted = True
                else:
                    encoded = base64.b64encode(str(payload).encode()).decode()
                    result = "ROMAN_CIPHER_V2::" + encoded[::-1]
                    redis.setex(cache_key, 3600, result) # Simpan 1 jam
                    is_boosted = False
                    
                return self.send_json({"status": "success", "result": result, "boosted": is_boosted})

            if action in ['encrypt', 'decrypt']:
                if not self.check_limit(f"sec:{client_ip}", 20, 60):
                    self.ban_ip(client_ip, 3600, "CRYPTO_ABUSE")
                    return self.respond_banned(client_ip)
                
                # TURBO DB: Cek cache berdasarkan hash aksi + payload
                cache_key = f"cache:crypto:{hashlib.md5((action+str(payload)).encode()).hexdigest()}"
                cached_result = redis.get(cache_key)
                
                if cached_result:
                    result = cached_result
                    is_boosted = True
                else:
                    if action == 'encrypt':
                        p = json.dumps(payload) if isinstance(payload, (dict, list)) else str(payload)
                        result = cipher_suite.encrypt(cipher_suite.encrypt(p.encode())).decode()
                    else:
                        result = cipher_suite.decrypt(cipher_suite.decrypt(payload.encode())).decode()
                    redis.setex(cache_key, 1800, result) # Simpan 30 menit
                    is_boosted = False
                    
                return self.send_json({"status": "success", "result": result, "boosted": is_boosted})

            # ==========================================
            # B. REQUEST API / LLM NORMAL (LOLOS TANPA GANDELAN)
            # ==========================================
            # Jika action kosong atau action API lainnya, langsung izinkan.
            # Tidak ada rate limit, tidak ada pencekakan yang bikin LLM error.
            return self.send_json({"status": "allowed"})

        except json.JSONDecodeError:
            return self.send_error_res(400, "BAD_REQUEST")
        except Exception as e:
            return self.send_error_res(500, "SERVER_ERROR")

    # ==========================================
    # UTILITAS
    # ==========================================
    def contains_malicious_payload(self, payload):
        payload_str = str(payload)
        for pattern, _ in MALICIOUS_PATTERNS:
            if re.search(pattern, payload_str): return True
        return False

    def check_limit(self, key, limit, window):
        count = redis.incr(key)
        if count == 1: redis.expire(key, window)
        return count <= limit

    def ban_ip(self, ip, duration, reason):
        redis.setex(f"ban:{ip}", duration, reason)

    def send_json(self, data):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

    def respond_banned(self, ip):
        ttl = redis.ttl(f"ban:{ip}")
        self.send_json({"status": "blocked", "ip": ip, "retry_after": ttl})

    def send_error_res(self, code, msg):
        self.send_response(code)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps({"status": msg}).encode())
