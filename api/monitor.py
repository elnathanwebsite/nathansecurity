from http.server import BaseHTTPRequestHandler
import json
import os
from upstash_redis import Redis
from cryptography.fernet import Fernet

# --- 1. KONEKSI DATABASE (UPSTASH) ---
redis = Redis(
    url=os.environ.get("UPSTASH_REDIS_REST_URL"),
    token=os.environ.get("UPSTASH_REDIS_REST_TOKEN")
)

# --- 2. SETUP KUNCI ENKRIPSI ---
# Ambil kunci dari Vercel. Jika tidak ada, buat kunci sementara (agar tidak error saat tes)
encrypt_key = os.environ.get("ENCRYPTION_KEY")
if not encrypt_key:
    # Fallback key (JANGAN DIPAKAI DI PRODUKSI, WAJIB SET DI VERCEL)
    encrypt_key = Fernet.generate_key()
cipher_suite = Fernet(encrypt_key)

# --- 3. KONFIGURASI KEAMANAN ---
BLOCK_DURATION = 3600  # 1 Jam
REFRESH_LIMIT = 5      # Max refresh 5x
SCAN_LIMIT = 2         # Max scan 2x

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_POST(self):
        try:
            content_length = int(self.headers['Content-Length'])
            body = json.loads(self.rfile.read(content_length))
            
            # Cek apakah ini permintaan ENKRIPSI atau MONITORING biasa?
            action = body.get('action') 
            
            # ==========================================
            # MODE A: FITUR PENYEMBUNYIAN DATA (ENKRIPSI)
            # ==========================================
            if action in ['encrypt', 'decrypt']:
                payload = body.get('data')
                result = ""
                
                if action == 'encrypt':
                    # Ubah data asli -> Kode Acak
                    if isinstance(payload, dict) or isinstance(payload, list):
                        payload = json.dumps(payload) # Handle jika data berupa JSON Object
                    encrypted_bytes = cipher_suite.encrypt(str(payload).encode())
                    result = encrypted_bytes.decode()
                    
                elif action == 'decrypt':
                    # Ubah Kode Acak -> Data Asli
                    decrypted_bytes = cipher_suite.decrypt(payload.encode())
                    result = decrypted_bytes.decode()

                # Kirim hasil enkripsi/dekripsi balik ke browser
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "success", "result": result}).encode())
                return

            # ==========================================
            # MODE B: FITUR KEAMANAN (MONITORING & BLOCKING)
            # ==========================================
            client_ip = self.headers.get('x-forwarded-for', 'unknown').split(',')[0]
            current_path = body.get('path', '/')

            # 1. CEK APAKAH SUDAH DIBLOKIR?
            if redis.get(f"block:{client_ip}"):
                self.respond_blocked(client_ip)
                return

            # 2. LOGIKA ANTI-SPAM REFRESH
            refresh_key = f"count:{client_ip}:{current_path}"
            count = redis.incr(refresh_key)
            if count == 1:
                redis.expire(refresh_key, 10)
            
            if count > REFRESH_LIMIT:
                redis.setex(f"block:{client_ip}", BLOCK_DURATION, "reason:spam_refresh")
                self.respond_blocked(client_ip)
                return

            # 3. LOGIKA ANTI-SCANNING
            scan_key = f"scan:{client_ip}"
            redis.sadd(scan_key, current_path)
            redis.expire(scan_key, 10)
            
            if redis.scard(scan_key) > SCAN_LIMIT:
                redis.setex(f"block:{client_ip}", BLOCK_DURATION, "reason:path_scanning")
                self.respond_blocked(client_ip)
                return

            # 4. JIKA AMAN
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"status": "allowed"}).encode())

        except Exception as e:
            # Error Handling (biar server gak crash total)
            print(f"Server Error: {str(e)}")
            self.send_response(500)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())

    def respond_blocked(self, ip):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps({"status": "blocked", "ip": ip}).encode())
