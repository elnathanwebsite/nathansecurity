from http.server import BaseHTTPRequestHandler
import json
import os
import base64
from upstash_redis import Redis
from cryptography.fernet import Fernet

# --- 1. KONEKSI DATABASE (UPSTASH) ---
redis = Redis(
    url=os.environ.get("UPSTASH_REDIS_REST_URL"),
    token=os.environ.get("UPSTASH_REDIS_REST_TOKEN")
)

# --- 2. SETUP KUNCI ENKRIPSI (FERNET) ---
# Digunakan untuk pengamanan tingkat tinggi
encrypt_key = os.environ.get("ENCRYPTION_KEY")
if not encrypt_key:
    encrypt_key = Fernet.generate_key()
cipher_suite = Fernet(encrypt_key)

# --- 3. KONFIGURASI KEAMANAN ---
BLOCK_DURATION = 3600  # 1 Jam
REFRESH_LIMIT = 5      # Max refresh 5x
SCAN_LIMIT = 2         # Max scan 2x

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        # Mengatur Header agar bisa diakses dari domain mana saja (CORS)
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_POST(self):
        try:
            content_length = int(self.headers['Content-Length'])
            body = json.loads(self.rfile.read(content_length))
            
            action = body.get('action') 
            
            # ==========================================
            # FITUR 1: HIDE DATA / "HASHING VISUAL"
            # ==========================================
            # Ini yang Anda minta untuk menyembunyikan Email/Firebase
            # Kita gunakan Base64 Terbalik (Reversible) agar Website tidak error
            if action == 'hide_data':
                payload = str(body.get('data', ''))
                
                # Langkah 1: Ubah ke format Base64
                encoded = base64.b64encode(payload.encode()).decode()
                # Langkah 2: Balik urutan hurufnya (Reverse) biar tidak terbaca manusia
                # Langkah 3: Tambahkan stempel "NS_SECURE::"
                hidden_result = "NS_SECURE::" + encoded[::-1]
                
                self.send_json_response({"status": "success", "result": hidden_result})
                return

            # ==========================================
            # FITUR 2: ENKRIPSI MILITER (FERNET)
            # ==========================================
            # Gunakan ini jika ingin keamanan level bank (Data tidak bisa dibaca tanpa kunci server)
            if action in ['encrypt', 'decrypt']:
                payload = body.get('data')
                result = ""
                
                if action == 'encrypt':
                    if isinstance(payload, dict) or isinstance(payload, list):
                        payload = json.dumps(payload)
                    encrypted_bytes = cipher_suite.encrypt(str(payload).encode())
                    result = encrypted_bytes.decode()
                    
                elif action == 'decrypt':
                    decrypted_bytes = cipher_suite.decrypt(payload.encode())
                    result = decrypted_bytes.decode()

                self.send_json_response({"status": "success", "result": result})
                return

            # ==========================================
            # FITUR 3: KEAMANAN (BLOKIR IP SPAM)
            # ==========================================
            client_ip = self.headers.get('x-forwarded-for', 'unknown').split(',')[0]
            current_path = body.get('path', '/')

            # 1. Cek Daftar Blokir
            if redis.get(f"block:{client_ip}"):
                self.respond_blocked(client_ip)
                return

            # 2. Logika Anti-Spam Refresh
            refresh_key = f"count:{client_ip}:{current_path}"
            count = redis.incr(refresh_key)
            if count == 1:
                redis.expire(refresh_key, 10)
            
            if count > REFRESH_LIMIT:
                redis.setex(f"block:{client_ip}", BLOCK_DURATION, "reason:spam_refresh")
                self.respond_blocked(client_ip)
                return

            # 3. Logika Anti-Scanning
            scan_key = f"scan:{client_ip}"
            redis.sadd(scan_key, current_path)
            redis.expire(scan_key, 10)
            
            if redis.scard(scan_key) > SCAN_LIMIT:
                redis.setex(f"block:{client_ip}", BLOCK_DURATION, "reason:path_scanning")
                self.respond_blocked(client_ip)
                return

            # 4. Jika Aman
            self.send_json_response({"status": "allowed"})

        except Exception as e:
            # Error Handling
            self.send_response(500)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())

    # --- FUNGSI BANTUAN (HELPER) ---
    def send_json_response(self, data):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

    def respond_blocked(self, ip):
        self.send_json_response({"status": "blocked", "ip": ip})
