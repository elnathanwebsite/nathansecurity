from http.server import BaseHTTPRequestHandler
import json
import os
import time
from upstash_redis import Redis

# Koneksi Database
redis = Redis(
    url=os.environ.get("UPSTASH_REDIS_REST_URL"),
    token=os.environ.get("UPSTASH_REDIS_REST_TOKEN")
)

# KONFIGURASI KEAMANAN
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
            
            client_ip = self.headers.get('x-forwarded-for', 'unknown').split(',')[0]
            current_path = body.get('path', '/')
            
            # 1. CEK STATUS BLOKIR
            if redis.get(f"block:{client_ip}"):
                self.respond_blocked(client_ip)
                return

            # 2. LOGIKA ANTI-SPAM
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

            # 4. IZINKAN
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"status": "allowed"}).encode())

        except Exception as e:
            print(f"Error: {str(e)}")
            self.send_response(500)
            self.end_headers()

    def respond_blocked(self, ip):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps({"status": "blocked", "ip": ip}).encode())
