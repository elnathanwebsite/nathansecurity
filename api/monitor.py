from http.server import BaseHTTPRequestHandler
import json
import os
import re
import base64
import hashlib
import time
import random
from cryptography.fernet import Fernet

# ============================================
# ⚙️ SETUP IN-MEMORY (TANPA DATABASE)
# ============================================
banned_ips = {}    # Format: {"ip_address": expiry_timestamp}
rate_limits = {}  # Format: {"ip_address": [timestamp1, timestamp2]}
data_cache = {}   # Format: {"key": {"data": "...", "expires": timestamp}}

# Generate/Load Key
encrypt_key = os.environ.get("ENCRYPTION_KEY")
if not encrypt_key:
    # Generate a stable key for the session if not provided (Prevent errors on restart)
    encrypt_key = Fernet.generate_key() 
cipher_suite = Fernet(encrypt_key)

# ============================================
# 🛡️ ANTI-HACKING & ANI-SCANNER MATRIX
# ============================================

# 1. Daftar User-Agent Kali Linux & Tools (Signature Scanner)
KALI_TOOLS_SIGNATURES = [
    'nmap', 'nikto', 'sqlmap', 'dirbuster', 'gobuster', 'hydra', 'medusa', 
    'metasploit', 'burpcollaborator', 'burpsuite', 'owasp', 'zap', 'w3af', 
    'acunetix', 'appscan', 'netsparker', 'skipfish', 'wkito', 'python-requests'
]

# 2. Pola Payload Racun (Diperluas)
MALICIOUS_PATTERNS = [
    (r'(?i)(union\s+select|insert\s+into\s|drop\s+table|exec\s*\()', 'SQL_INJECTION'),
    (r'(?i)(<script.*?>|javascript:\s*|onerror\s*=|fromcharcode)', 'XSS_ATTACK'),
    (r'(\.\./|\.\.\\|%2e%2e|etc/passwd|windows/win.ini)', 'PATH_TRAVERSAL'),
    (r'(?i)(;\s*rm\s|;\s*wget\s|;\s*curl\s|`sleep\s|nc -e|/bin/sh)', 'CMD_INJECTION'),
    (r'(?i)(base64_decode|eval\s*\(|assert\s*\(|passthru\()', 'PHP_BACKDOOR'),
    (r'(?i)(/admin|/config|/\.git|/env|/phpmyadmin)', 'DIR_SCAN')
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
            user_agent = self.headers.get('User-Agent', '').lower()
            now = time.time()
            
            # --- STEP 1: FINGERPRINT KILL SWITCH (Cek User-Agent) ---
            if any(tool in user_agent for tool in KALI_TOOLS_SIGNATURES):
                banned_ips[client_ip] = now + 86400 * 7  # Ban 7 Hari langsung
                return self.respond_banned(client_ip, 604800, reason="MALICIOUS_UA")

            # --- STEP 2: CHECK BANNED IP (In-Memory) ---
            if client_ip in banned_ips:
                if now < banned_ips[client_ip]['expiry']:
                    return self.respond_banned(client_ip, int(banned_ips[client_ip]['expiry'] - now))
                else:
                    del banned_ips[client_ip] # Waktu ban habis

            content_length = int(self.headers.get('Content-Length', 0))
            
            # Anti-Flood: Tolak request terlalu besar (sering dipakai scanner untuk crash server)
            if content_length > 100000: # 100KB Limit
                banned_ips[client_ip] = {'expiry': now + 3600, 'reason': 'OVERSIZE'}
                return self.respond_banned(client_ip, 3600)

            # Parse Body
            try:
                body = json.loads(self.rfile.read(content_length)) if content_length > 0 else {}
            except:
                # Scanner sering kirim data rusak, langsung ban sementara
                rate_limits[client_ip] = rate_limits.get(client_ip, []) + [now]
                return self.send_error_res(400, "BAD_JSON")

            action = body.get('action', '')
            payload = body.get('data', '')

            # --- STEP 3: ANTI RACUN & SCANNER BEHAVIOR ---
            if payload:
                is_malicious = False
                payload_str = str(payload).lower()
                
                # Cek Pola Regex
                for pattern, _ in MALICIOUS_PATTERNS:
                    if re.search(pattern, payload_str):
                        is_malicious = True
                        break
                
                # Cek Karakter Aneh (Ciri khas encoder/fuzzer)
                if re.search(r'[\x00-\x1F\x7F-\x9F]', payload_str): 
                    is_malicious = True

                if is_malicious:
                    banned_ips[client_ip] = {'expiry': now + 86400, 'reason': 'MALICIOUS_PAYLOAD'}
                    return self.respond_banned(client_ip, 86400)

            # --- STEP 4: RATE LIMITING (Anti Brute Force) ---
            # Batasan sangat ketat untuk path mencurigakan
            limit = 10 if action == 'hide_data' else 20
            window = 60
            
            if not self.check_limit(client_ip, limit, window):
                banned_ips[client_ip] = {'expiry': now + 1800, 'reason': 'RATE_LIMIT'}
                return self.respond_banned(client_ip, 1800)

            # ==========================================
            # A. FITUR KEAMANAN (LOGIC UTAMA)
            # ==========================================
            if action == 'hide_data':
                # Double Encryption Logic
                cache_key = f"cache:hide:{hashlib.md5(str(payload).encode()).hexdigest()}"
                cached_result = self.get_cache(cache_key)
                
                if cached_result:
                    return self.send_json({"status": "success", "result": cached_result, "boosted": True})
                else:
                    # Reverse Base64 + Salt
                    encoded = base64.b64encode(str(payload).encode()).decode()
                    salt = hashlib.sha256(str(time.time()).encode()).hexdigest()[:8]
                    result = f"ROMAN_CIPHER_V3::{salt}::{encoded[::-1]}"
                    self.set_cache(cache_key, result, 3600)
                    return self.send_json({"status": "success", "result": result, "boosted": False})

            if action in ['encrypt', 'decrypt']:
                cache_key = f"cache:crypto:{hashlib.md5((action+str(payload)).encode()).hexdigest()}"
                cached_result = self.get_cache(cache_key)
                
                if cached_result:
                    return self.send_json({"status": "success", "result": cached_result, "boosted": True})
                else:
                    try:
                        if action == 'encrypt':
                            p = json.dumps(payload) if isinstance(payload, (dict, list)) else str(payload)
                            # Triple Encryption Layer
                            layer1 = cipher_suite.encrypt(p.encode())
                            layer2 = cipher_suite.encrypt(layer1)
                            result = base64.b64encode(layer2).decode()
                        else:
                            # Triple Decryption Layer
                            layer2 = base64.b64decode(payload.encode())
                            layer1 = cipher_suite.decrypt(layer2)
                            result = cipher_suite.decrypt(layer1).decode()
                        self.set_cache(cache_key, result, 1800)
                        return self.send_json({"status": "success", "result": result, "boosted": False})
                    except Exception as e:
                        return self.send_error_res(400, "DECRYPTION_FAILED")

            # ==========================================
            # B. REQUEST NORMAL / UNKNOWN
            # ==========================================
            # Jika action tidak dikenali tapi lolos filter, berikan respons data palsu (Tar Pit)
            # ini akan bikin scanner bingung karena kaya dapet data valid tapi isinya sampah
            if random.random() > 0.8:
                 fake_data = {"status": "success", "data": "Scanning detected but IP ignored. Keep trying.", "server_time": time.time()}
                 return self.send_json(fake_data)

            return self.send_json({"status": "allowed"})

        except Exception as e:
            print(f"SYSTEM ERROR: {str(e)}")
            # Jangan berikan detail error ke scanner
            return self.send_error_res(500, "INTERNAL_ERROR")

    # ==========================================
    # UTILITAS & LOGIKA BANTUAN
    # ==========================================
    def check_limit(self, ip, limit, window):
        now = time.time()
        if ip not in rate_limits:
            rate_limits[ip] = []
        
        # Bersihkan request lama
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
                del data_cache[key]
        return None

    def respond_banned(self, ip, retry_after, reason="UNKNOWN"):
        # Mengirim header yang menyebabkan scanner berhenti
        self.send_response(403)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Retry-After', str(retry_after))
        self.end_headers()
        
        # Pesan respons untuk mengecoh attacker
        response = {
            "status": "blocked",
            "ip": ip, 
            "retry_after": retry_after,
            "reason": reason,
            "message": "Your IP has been flagged by the Defense Matrix."
        }
        self.wfile.write(json.dumps(response).encode())

    def send_json(self, data):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        # Header tambahan untuk membingungkan scanner sederhana
        self.send_header('X-Powered-By', 'CustomDefense/1.0') 
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

    def send_error_res(self, code, msg):
        self.send_response(code)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps({"status": msg}).encode())
