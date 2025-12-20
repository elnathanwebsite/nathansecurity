from http.server import BaseHTTPRequestHandler
import json
import os
import base64
from upstash_redis import Redis
from cryptography.fernet import Fernet
import re

redis = Redis(
    url=os.environ.get("UPSTASH_REDIS_REST_URL"),
    token=os.environ.get("UPSTASH_REDIS_REST_TOKEN")
)

encrypt_key = os.environ.get("ENCRYPTION_KEY")
if not encrypt_key:
    encrypt_key = Fernet.generate_key()
cipher_suite = Fernet(encrypt_key)

BLOCK_DURATION = 3600  
REFRESH_LIMIT = 5      
SCAN_LIMIT = 2         


ENCRYPTION_LOG_KEY = "encryption_log"

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
            
            action = body.get('action') 
            
         
            # FITUR 1: HIDE DATA / "HASHING VISUAL"
            if action == 'hide_data':
                payload = str(body.get('data', ''))
                
         
                self.log_encryption_attempt(payload)
                
                encoded = base64.b64encode(payload.encode()).decode()
                hidden_result = "NS_SECURE::" + encoded[::-1]
                
                self.send_json_response({"status": "success", "result": hidden_result})
                return

          
            # FITUR 2: ENKRIPSI MILITER (FERNET)
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

            client_ip = self.headers.get('x-forwarded-for', 'unknown').split(',')[0]
            current_path = body.get('path', '/')

            if redis.get(f"block:{client_ip}"):
                self.respond_blocked(client_ip)
                return

            refresh_key = f"count:{client_ip}:{current_path}"
            count = redis.incr(refresh_key)
            if count == 1:
                redis.expire(refresh_key, 10)
            
            if count > REFRESH_LIMIT:
                redis.setex(f"block:{client_ip}", BLOCK_DURATION, "reason:spam_refresh")
                self.respond_blocked(client_ip)
                return

            scan_key = f"scan:{client_ip}"
            redis.sadd(scan_key, current_path)
            redis.expire(scan_key, 10)
            
            if redis.scard(scan_key) > SCAN_LIMIT:
                redis.setex(f"block:{client_ip}", BLOCK_DURATION, "reason:path_scanning")
                self.respond_blocked(client_ip)
                return

            self.send_json_response({"status": "allowed"})

        except Exception as e:
            self.send_response(500)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())

    def send_json_response(self, data):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

    def respond_blocked(self, ip):
        self.send_json_response({"status": "blocked", "ip": ip})
    def log_encryption_attempt(self, data):
        """Menganalisis data dan mencatat jenisnya ke Redis."""
        data_type = "unknown"
        data_str = str(data).lower()

        if re.search(r'[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}', data_str):
            data_type = "email"
        elif re.search(r'\+?[0-9\s\-]+', data_str):
            data_type = "phone"
        elif re.search(r'^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$', data_str, re.I):
            data_type = "uuid"
        elif re.search(r'^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$', data_str):
            data_type = "jwt_token"
        elif len(data_str) > 50 and not data_str.isalpha():
            data_type = "long_string_or_id"

        log_entry = {
            "timestamp": int(os.time()),
            "client_ip": self.headers.get('x-forwarded-for', 'unknown').split(',')[0],
            "data_type": data_type,
            "data_preview": data_str[:50] + "..." if len(data_str) > 50 else data_str
        }
        redis.lpush(ENCRYPTION_LOG_KEY, json.dumps(log_entry))
        redis.ltrim(ENCRYPTION_LOG_KEY, 0, 99) 
