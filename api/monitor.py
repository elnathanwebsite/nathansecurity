from http.server import BaseHTTPRequestHandler
import json
import os
import time
from upstash_redis import Redis

# Koneksi Database (Wajib via Environment Variable untuk keamanan)
redis = Redis(
    url=os.environ.get("UPSTASH_REDIS_REST_URL"),
    token=os.environ.get("UPSTASH_REDIS_REST_TOKEN")
)

# KONFIGURASI KEAMANAN
BLOCK_DURATION = 3600  # 1 Jam (dalam detik)
REFRESH_LIMIT = 5      # Max refresh di halaman sama dalam 10 detik
SCAN_LIMIT = 2         # Max ganti-ganti halaman (pencarian acak) dalam 10 detik

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        # Mengizinkan akses dari semua website (CORS)
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_POST(self):
        try:
            # 1. Baca Data dari Klien
            content_length = int(self.headers['Content-Length'])
            body = json.loads(self.rfile.read(content_length))
            
            client_ip = self.headers.get('x-forwarded-for', 'unknown').split(',')[0]
            current_path = body.get('path', '/') # URL yang sedang dibuka
            
            # 2. CEK STATUS BLOKIR
            if redis.get(f"block:{client_ip}"):
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "blocked", "ip": client_ip}).encode())
                return

            # 3. LOGIKA 1: ANTI-SPAM REFRESH (Halaman Sama)
            # Key unik kombinasi IP + Path
            refresh_key = f"count:{client_ip}:{current_path}"
            # Increment counter
            count = redis.incr(refresh_key)
            # Jika baru pertama kali, set expire 10 detik
            if count == 1:
                redis.expire(refresh_key, 10)
            
            if count > REFRESH_LIMIT:
                # BLOKIR 1 JAM
                redis.setex(f"block:{client_ip}", BLOCK_DURATION, "reason:spam_refresh")
                self.respond_blocked(client_ip)
                return

            # 4. LOGIKA 2: ANTI-SCANNING / PENCARIAN ACAK (Path Berbeda)
            # Kita gunakan Redis SET untuk menyimpan path unik yang dikunjungi
            scan_key = f"scan:{client_ip}"
            redis.sadd(scan_key, current_path)
            redis.expire(scan_key, 10) # Reset tracking setiap 10 detik
            
            # Hitung jumlah path unik yang dibuka
            unique_paths = redis.scard(scan_key)
            
            if unique_paths > SCAN_LIMIT:
                # Jika user membuka lebih dari 2 halaman BERBEDA dalam 10 detik
                # (Indikasi bot atau orang iseng mencari celah)
                redis.setex(f"block:{client_ip}", BLOCK_DURATION, "reason:path_scanning")
                self.respond_blocked(client_ip)
                return

            # 5. JIKE AMAN
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"status": "allowed"}).encode())

        except Exception as e:
            # Fail-safe: Jika server error, jangan blokir user
            self.send_response(500)
            self.end_headers()

    def respond_blocked(self, ip):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps({"status": "blocked", "ip": ip}).encode())