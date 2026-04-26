from http.server import BaseHTTPRequestHandler
import json
import os
import re
import base64
import hashlib
import time
from cryptography.fernet import Fernet

# ============================================
# ⚙️ SETUP IN-MEMORY (TANPA DATABASE)
# ============================================
# Data hanya tersimpan selama server Vercel masih hidup (biasanya beberapa menit)
banned_ips = {}    # Format: {"ip_address": expiry_timestamp}
rate_limits = {}  # Format: {"ip_address": [timestamp1, timestamp2]}
data_cache = {}   # Format: {"key": {"data": "...", "expires": timestamp}}

encrypt_key = os.environ.get("ENCRYPTION_KEY")
if not encrypt_key:
    encrypt_key = Fernet.generate_key()
cipher_suite = Fernet(encrypt_key)

# Pola racun
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
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Api-Key')
        self.end_headers()

    def do_POST(self):
        try:
            client_ip = self.headers.get('x-forwarded-for', 'unknown').split(',')[0].strip()
            now = time.time()
            
            # 1. CEK BANNED IP (In-Memory)
            if client_ip in banned_ips:
                if now < banned_ips[client_ip]:
                    return self.respond_banned(client_ip, int(banned_ips[client_ip] - now))
                else:
                    del banned_ips[client_ip] # Waktu ban habis, hapus dari memori

            content_length = int(self.headers.get('Content-Length', 0))
            if content_length > 50000: 
                banned_ips[client_ip] = now + 3600
                return self.respond_banned(client_ip, 3600)

            body = json.loads(self.rfile.read(content_length)) if content_length > 0 else {}
            action = body.get('action', '')
            payload = body.get('data', '')

            # 2. ANTI RACUN (SQLi / XSS)
            if payload and self.contains_malicious_payload(payload):
                banned_ips[client_ip] = now + 86400
                return self.respond_banned(client_ip, 86400)

            # ==========================================
            # A. FITUR KEAMANAN
            # ==========================================
            if action == 'hide_data':
                if not self.check_limit(client_ip, 10, 60):
                    banned_ips[client_ip] = now + 1800
                    return self.respond_banned(client_ip, 1800)
                    
                cache_key = f"cache:hide:{hashlib.md5(str(payload).encode()).hexdigest()}"
                cached_result = self.get_cache(cache_key)
                
                if cached_result:
                    return self.send_json({"status": "success", "result": cached_result, "boosted": True})
                else:
                    encoded = base64.b64encode(str(payload).encode()).decode()
                    result = "ROMAN_CIPHER_V2::" + encoded[::-1]
                    self.set_cache(cache_key, result, 3600)
                    return self.send_json({"status": "success", "result": result, "boosted": False})

            if action in ['encrypt', 'decrypt']:
                if not self.check_limit(client_ip, 20, 60):
                    banned_ips[client_ip] = now + 3600
                    return self.respond_banned(client_ip, 3600)
                
                cache_key = f"cache:crypto:{hashlib.md5((action+str(payload)).encode()).hexdigest()}"
                cached_result = self.get_cache(cache_key)
                
                if cached_result:
                    return self.send_json({"status": "success", "result": cached_result, "boosted": True})
                else:
                    if action == 'encrypt':
                        p = json.dumps(payload) if isinstance(payload, (dict, list)) else str(payload)
                        result = cipher_suite.encrypt(cipher_suite.encrypt(p.encode())).decode()
                    else:
                        result = cipher_suite.decrypt(cipher_suite.decrypt(payload.encode())).decode()
                    self.set_cache(cache_key, result, 1800)
                    return self.send_json({"status": "success", "result": result, "boosted": False})

            # ==========================================
            # B. REQUEST API / LLM NORMAL
            # ==========================================
            return self.send_json({"status": "allowed"})

        except json.JSONDecodeError:
            return self.send_error_res(400, "BAD_REQUEST")
        except Exception as e:
            print(f"ERROR: {str(e)}")
            return self.send_error_res(500, "SERVER_ERROR")

    # ==========================================
    # UTILITAS IN-MEMORY
    # ==========================================
    def contains_malicious_payload(self, payload):
        payload_str = str(payload)
        for pattern, _ in MALICIOUS_PATTERNS:
            if re.search(pattern, payload_str): return True
        return False

    def check_limit(self, ip, limit, window):
        now = time.time()
        if ip not in rate_limits:
            rate_limits[ip] = []
        
        # Hanya simpan request dalam window waktu (misal 60 detik terakhir)
        rate_limits[ip] = [t for t in rate_limits[ip] if now - t < window]
        rate_limits[ip].append(now)
        
        return len(rate_limits[ip]) <= limit

    def set_cache(self, key, data, ttl):
        data_cache[key] = {
            "data": data,
            "expires": time.time() + ttl
        }

    def get_cache(self, key):
        if key in data_cache:
            if time.time() < data_cache[key]["expires"]:
                return data_cache[key]["data"]
            else:
                del data_cache[key] # Cache expired, hapus
        return None

    def respond_banned(self, ip, retry_after):
        self.send_json({"status": "blocked", "ip": ip, "retry_after": retry_after})

    def send_json(self, data):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

    def send_error_res(self, code, msg):
        self.send_response(code)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps({"status": msg}).encode())
