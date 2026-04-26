from http.server import BaseHTTPRequestHandler
import json
import os
import base64
import re
import time
import hashlib
from upstash_redis import Redis
from cryptography.fernet import Fernet
from datetime import datetime

# ============================================
# ⚔️ ROMAN LEGION SECURITY FORTRESS ⚔️
# "Senatus Populusque Romanus Security"
# ============================================

redis = Redis(
    url=os.environ.get("UPSTASH_REDIS_REST_URL"),
    token=os.environ.get("UPSTASH_REDIS_REST_TOKEN")
)

encrypt_key = os.environ.get("ENCRYPTION_KEY")
if not encrypt_key:
    encrypt_key = Fernet.generate_key()
cipher_suite = Fernet(encrypt_key)

# ============================================
# 🏛️ ROMAN FORMATION CONFIGURATION
# ============================================

LEGION_CONFIG = {
    # Velites (Light Infantry) - First Contact
    "velites": {
        "request_size_limit": 10000,
        "suspicious_headers": ["x-attack", "x-forwarded-for: 0.0.0.0"],
        "block_time": 7200,  # 2 hours
    },
    
    # Hastati (Heavy Infantry) - Rate Limiting
    "hastati": {
        "refresh_limit": 3,
        "refresh_window": 8,
        "block_time": 14400,  # 4 hours
        "escalation_multiplier": 3,
    },
    
    # Principes (Veterans) - Path Scanning
    "principes": {
        "scan_limit": 2,
        "scan_window": 10,
        "block_time": 28800,  # 8 hours
    },
    
    # Triarii (Elite Reserve) - Final Defense
    "triarii": {
        "rapid_fire_threshold": 10,
        "rapid_fire_window": 3,
        "permanent_block_threshold": 5,
        "block_time": 86400,  # 24 hours
    },
    
    # Testudo (Tortoise Formation) - Flood Protection
    "testudo": {
        "global_limit": 1000,
        "global_window": 60,
        "block_time": 60,
    },
    
    # Scorpio (Siege Weapon) - Active Defense
    "scorpio": {
        "counter_measure": True,
        "tarpit_delay": 5,
        "honeypot_trigger": "/admin", "/login", "/wp-admin", "/.env", "/config"
    },
    
    # Ballista (Heavy Siege) - Pattern Detection
    "ballista": {
        "sql_pattern": r'(?i)(union|select|insert|update|delete|drop|alter|exec|execute|xp_|sp_)',
        "xss_pattern": r'(?i)(<script|javascript:|onerror|onload|eval\(|document\.)',
        "path_traversal": r'(\.\./|\.\.\\|%2e%2e)',
        "command_injection": r'(?i)(;|\||`|\$\(|&&|>|<)(\s*)(rm|wget|curl|bash|sh|nc|ncat)',
        "block_time": 604800,  # 7 days
    },
    
    # Siege Tower (Torre) - Advanced Fingerprinting
    "torre": {
        "fingerprint_window": 3600,
        "fingerprint_limit": 3,
        "block_time": 43200,  # 12 hours
    }
}

# ============================================
# 📜 ROMAN WAR LOG KEYS
# ============================================

KEYS = {
    "block_list": "legion:blocks",
    "permanent_ban": "legion:permanent_ban",
    "attack_log": "legion:attack_log",
    "encryption_log": "legion:encryption_log",
    "threat_intel": "legion:threat_intel",
    "fingerprint_db": "legion:fingerprints",
    "global_counter": "legion:global_counter",
    "honor_roll": "legion:honor_roll",  # Clean users
    "casualties": "legion:casualties",   # Blocked attempts
    "formation_status": "legion:formation",
}

# ============================================
# 🛡️ ROMAN LEGION HANDLER
# ============================================

class RomanLegionHandler(BaseHTTPRequestHandler):
    
    def do_OPTIONS(self):
        """⚠️ Velites - First Contact Response"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, X-Legion-ID')
        self.send_header('X-Legion-Status', 'STANDING')
        self.end_headers()

    def do_POST(self):
        """⚔️ MAIN LEGION COMMAND CENTER ⚔️"""
        
        start_time = time.time()
        client_info = self.extract_client_intelligence()
        
        try:
            # 🏛️ CHECK PERMANENT BAN FIRST
            if self.check_permanent_ban(client_info['ip']):
                self.log_casualty(client_info, "PERMANENT_BAN", "Senatus decree executed")
                self.respond_executed(client_info['ip'], "CONDEMNED_BY_SENATE")
                return

            # 🛡️ TESTUDO - Global Flood Protection
            if not self.testudo_formation():
                self.log_casualty(client_info, "FLOOD_ATTACK", "Testudo formation engaged")
                self.respond_under_siege()
                return

            # 🎯 SCORPIO - Honeypot Detection
            if self.check_honeypot(client_info):
                self.permanent_ban(client_info['ip'])
                self.log_casualty(client_info, "HONEYPOT_TRIGGERED", "Scorpio fired")
                self.respond_executed(client_info['ip'], "SCORPIO_STRIKE")
                return

            # 📊 Content Length Check
            content_length = int(self.headers.get('Content-Length', 0))
            
            if content_length > LEGION_CONFIG['velites']['request_size_limit']:
                self.block_and_log(client_info, "VELITES", "Oversized payload rejected", 
                                  LEGION_CONFIG['velites']['block_time'])
                return

            # 📜 Parse Request Body
            body = json.loads(self.rfile.read(content_length)) if content_length > 0 else {}
            action = body.get('action', '')
            payload = body.get('data', '')

            # ⚔️ BALLISTA - Malicious Payload Detection
            if self.ballista_inspection(payload, action):
                self.permanent_ban(client_info['ip'])
                self.log_casualty(client_info, "MALICIOUS_PAYLOAD", "Ballista siege fired")
                self.respond_executed(client_info['ip'], "BALLISTA_STRIKE")
                return

            # ============================================
            # 📨 ENCRYPTION OPERATIONS (PROTECTED)
            # ============================================
            
            if action == 'hide_data':
                self.velites_hide_data(client_info, payload)
                return

            if action in ['encrypt', 'decrypt']:
                self.triarii_crypto_operation(client_info, action, payload)
                return

            # ============================================
            # ⚔️ COMBAT FORMATIONS (RATE LIMITING)
            # ============================================

            # 🛡️ Check Current Block Status
            if self.is_blocked(client_info['ip']):
                remaining = self.get_block_remaining(client_info['ip'])
                self.log_casualty(client_info, "BLOCKED_ATTEMPT", f"Still serving sentence: {remaining}s")
                self.respond_blocked(client_info['ip'], remaining)
                return

            # 🗡️ HASTATI - Refresh Rate Limiting
            if self.hastati_formation(client_info):
                self.log_casualty(client_info, "SPAM_REFRESH", "Hastati repelled attacker")
                return

            # 🛡️ PRINCIPES - Path Scanning Detection
            if self.principes_formation(client_info, body):
                self.log_casualty(client_info, "PATH_SCANNING", "Principes intercepted scout")
                return

            # 🏰 TORRE - Fingerprint Correlation
            if self.torre_formation(client_info):
                self.log_casualty(client_info, "FINGERPRINT_CORRELATION", "Siege tower spotted infiltrator")
                return

            # ⚔️ TRIARII - Rapid Fire Detection
            if self.triarii_formation(client_info):
                self.log_casualty(client_info, "RAPID_FIRE", "Triarii engaged elite defense")
                return

            # ============================================
            # 🏆 SURVIVED ALL FORMATIONS
            # ============================================
            
            self.add_to_honor_roll(client_info)
            processing_time = (time.time() - start_time) * 1000
            
            self.send_json_response({
                "status": "allowed",
                "legion": "ROMAN",
                "clearance": self.get_clearance_level(client_info),
                "processing_ms": round(processing_time, 2),
                "message": "Ave! You have passed the Legion's inspection."
            })

        except json.JSONDecodeError:
            self.block_and_log(client_info, "VELITES", "Malformed JSON payload", 3600)
        except Exception as e:
            self.send_response(500)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('X-Legion-Error', str(e))
            self.end_headers()
            self.wfile.write(json.dumps({"error": "Legion internal error"}).encode())

    # ============================================
    # 🛡️ ROMAN FORMATIONS (DEFENSE LAYERS)
    # ============================================

    def testudo_formation(self):
        """🐢 Testudo - Global flood protection"""
        current = redis.incr(KEYS['global_counter'])
        if current == 1:
            redis.expire(KEYS['global_counter'], LEGION_CONFIG['testudo']['global_window'])
        
        return current <= LEGION_CONFIG['testudo']['global_limit']

    def check_honeypot(self, client_info):
        """🎯 Scorpio - Honeypot detection"""
        path = self.path.lower()
        honeypots = LEGION_CONFIG['scorpio']['honeypot_trigger']
        
        for trap in honeypots:
            if trap.lower() in path:
                return True
        return False

    def ballista_inspection(self, payload, action):
        """🏹 Ballista - Malicious payload detection"""
        if not payload:
            return False
            
        payload_str = str(payload).lower()
        config = LEGION_CONFIG['ballista']
        
        patterns = [
            ('SQL_INJECTION', config['sql_pattern']),
            ('XSS_ATTACK', config['xss_pattern']),
            ('PATH_TRAVERSAL', config['path_traversal']),
            ('COMMAND_INJECTION', config['command_injection']),
        ]
        
        for attack_type, pattern in patterns:
            if re.search(pattern, payload_str):
                self.log_threat_intel(attack_type, payload_str[:200])
                return True
        
        return False

    def hastati_formation(self, client_info):
        """🗡️ Hastati - Rate limiting"""
        ip = client_info['ip']
        path = client_info['path']
        config = LEGION_CONFIG['hastati']
        
        key = f"hastati:{ip}:{path}"
        count = redis.incr(key)
        
        if count == 1:
            redis.expire(key, config['refresh_window'])
        
        if count > config['refresh_limit']:
            # Escalation based on offense count
            offense_key = f"offense:{ip}"
            offense_count = redis.incr(offense_key)
            redis.expire(offense_key, 86400)
            
            block_time = config['block_time'] * (offense_count ** config['escalation_multiplier'])
            block_time = min(block_time, 604800)  # Cap at 7 days
            
            self.block_ip(ip, block_time, f"HASTATI:Offense#{offense_count}")
            return True
        
        return False

    def principes_formation(self, client_info, body):
        """🛡️ Principes - Path scanning detection"""
        ip = client_info['ip']
        path = body.get('path', client_info['path'])
        config = LEGION_CONFIG['principes']
        
        key = f"principes:{ip}"
        redis.sadd(key, path)
        redis.expire(key, config['scan_window'])
        
        unique_paths = redis.scard(key)
        
        if unique_paths > config['scan_limit']:
            self.block_ip(ip, config['block_time'], "PRINCIPES:PathScanning")
            return True
        
        return False

    def torre_formation(self, client_info):
        """🏰 Torre - Fingerprint correlation"""
        fingerprint = client_info['fingerprint']
        ip = client_info['ip']
        config = LEGION_CONFIG['torre']
        
        # Log fingerprint
        fp_key = f"torre:fp:{fingerprint}"
        redis.sadd(fp_key, ip)
        redis.expire(fp_key, config['fingerprint_window'])
        
        # Check if this fingerprint has multiple IPs
        associated_ips = redis.scard(fp_key)
        
        if associated_ips > config['fingerprint_limit']:
            # Ban all associated IPs
            all_ips = redis.smembers(fp_key)
            for banned_ip in all_ips:
                self.permanent_ban(banned_ip)
            return True
        
        # Also check if IP has multiple fingerprints
        ip_fp_key = f"torre:ip:{ip}"
        redis.sadd(ip_fp_key, fingerprint)
        redis.expire(ip_fp_key, config['fingerprint_window'])
        
        if redis.scard(ip_fp_key) > config['fingerprint_limit']:
            self.permanent_ban(ip)
            return True
        
        return False

    def triarii_formation(self, client_info):
        """⚔️ Triarii - Rapid fire / elite defense"""
        ip = client_info['ip']
        config = LEGION_CONFIG['triarii']
        
        # Rapid fire detection
        rapid_key = f"triarii:rapid:{ip}"
        count = redis.incr(rapid_key)
        redis.expire(rapid_key, config['rapid_fire_window'])
        
        if count > config['rapid_fire_threshold']:
            self.block_ip(ip, config['block_time'], "TRIARIII:RapidFire")
            return True
        
        # Check for permanent ban threshold
        total_blocks_key = f"triarii:total:{ip}"
        total_blocks = redis.incrby(total_blocks_key, 0)
        
        if total_blocks >= config['permanent_block_threshold']:
            self.permanent_ban(ip)
            return True
        
        return False

    # ============================================
    # 🔐 CRYPTO OPERATIONS (MILITARY GRADE)
    # ============================================

    def velites_hide_data(self, client_info, payload):
        """🥷 Velites - Visual obfuscation"""
        payload_str = str(payload)
        
        # Log the attempt
        self.log_encryption_attempt(client_info, payload_str)
        
        # Multi-layer obfuscation
        encoded = base64.b64encode(payload_str.encode()).decode()
        reversed_encoded = encoded[::-1]
        
        # Add decoy layers
        layer1 = "ROMAN_CIPHER_V2::"
        layer2 = hashlib.md5(str(time.time()).encode()).hexdigest()[:8]
        layer3 = "::"
        
        hidden_result = f"{layer1}{layer2}{layer3}{reversed_encoded}"
        
        self.send_json_response({
            "status": "success",
            "result": hidden_result,
            "classification": "OBFUSCATED",
            "clearance_required": "LEGIONARY"
        })

    def triarii_crypto_operation(self, client_info, action, payload):
        """🔐 Triarii - Military grade encryption"""
        
        # Rate limit crypto operations separately
        crypto_key = f"crypto:limit:{client_info['ip']}"
        crypto_count = redis.incr(crypto_key)
        redis.expire(crypto_key, 60)
        
        if crypto_count > 30:
            self.block_ip(client_info['ip'], 3600, "CRYPTO_ABUSE")
            return
        
        result = ""
        operation = ""
        
        if action == 'encrypt':
            if isinstance(payload, (dict, list)):
                payload = json.dumps(payload)
            
            # Double encryption layer
            first_pass = cipher_suite.encrypt(str(payload).encode())
            second_pass = cipher_suite.encrypt(first_pass)
            result = second_pass.decode()
            operation = "DOUBLE_ENCRYPTED"
            
        elif action == 'decrypt':
            # Double decryption layer
            first_pass = cipher_suite.decrypt(payload.encode())
            second_pass = cipher_suite.decrypt(first_pass)
            result = second_pass.decode()
            operation = "DOUBLE_DECRYPTED"
        
        self.log_crypto_operation(client_info, action, operation)
        
        self.send_json_response({
            "status": "success",
            "result": result,
            "operation": operation,
            "clearance_required": "CENTURION",
            "timestamp": int(time.time())
        })

    # ============================================
    # 🚫 BLOCKING MECHANISMS
    # ============================================

    def block_ip(self, ip, duration, reason):
        """🔒 Block IP with reason tracking"""
        block_key = f"block:{ip}"
        redis.setex(block_key, duration, json.dumps({
            "reason": reason,
            "timestamp": int(time.time()),
            "duration": duration
        }))
        
        # Add to block history
        history_key = f"history:{ip}"
        redis.lpush(history_key, json.dumps({
            "reason": reason,
            "timestamp": int(time.time())
        }))
        redis.ltrim(history_key, 0, 49)
        
        # Increment total blocks for this IP
        total_key = f"triarii:total:{ip}"
        redis.incr(total_key)
        redis.expire(total_key, 86400)

    def permanent_ban(self, ip):
        """💀 Permanent ban - Senate decree"""
        redis.sadd(KEYS['permanent_ban'], ip)
        
        # Also set a very long block
        self.block_ip(ip, 31536000, "SENATUS_DECRETE:PERMANENT")

    def is_blocked(self, ip):
        """🔍 Check if IP is blocked"""
        return redis.exists(f"block:{ip}")

    def get_block_remaining(self, ip):
        """⏱️ Get remaining block time"""
        return redis.ttl(f"block:{ip}")

    def check_permanent_ban(self, ip):
        """💀 Check permanent ban list"""
        return redis.sismember(KEYS['permanent_ban'], ip)

    def block_and_log(self, client_info, formation, message, duration):
        """📋 Block and log in one operation"""
        self.block_ip(client_info['ip'], duration, f"{formation}:{message}")
        self.log_casualty(client_info, formation, message)
        self.respond_blocked(client_info['ip'], duration, formation)

    # ============================================
    # 📜 LOGGING & INTELLIGENCE
    # ============================================

    def extract_client_intelligence(self):
        """🕵️ Extract maximum intelligence from request"""
        ip = self.headers.get('x-forwarded-for', 'unknown').split(',')[0].strip()
        user_agent = self.headers.get('user-agent', 'unknown')
        accept_language = self.headers.get('accept-language', 'unknown')
        path = self.path
        
        # Create fingerprint from multiple factors
        fingerprint_data = f"{user_agent}|{accept_language}|{self.headers.get('accept', '')}"
        fingerprint = hashlib.sha256(fingerprint_data.encode()).hexdigest()[:32]
        
        return {
            'ip': ip,
            'user_agent': user_agent,
            'accept_language': accept_language,
            'path': path,
            'fingerprint': fingerprint,
            'timestamp': int(time.time())
        }

    def log_encryption_attempt(self, client_info, data):
        """📋 Log encryption attempts with classification"""
        data_type = self.classify_data(data)
        data_str = str(data).lower()
        
        log_entry = {
            "timestamp": client_info['timestamp'],
            "ip": client_info['ip'],
            "fingerprint": client_info['fingerprint'],
            "data_type": data_type,
            "data_preview": data_str[:50] + "..." if len(data_str) > 50 else data_str,
            "risk_level": self.calculate_risk_level(data_type, data_str)
        }
        
        redis.lpush(KEYS['encryption_log'], json.dumps(log_entry))
        redis.ltrim(KEYS['encryption_log'], 0, 499)

    def classify_data(self, data):
        """🔍 Classify data type"""
        data_str = str(data).lower()
        
        patterns = [
            ('email', r'[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}'),
            ('phone', r'\+?[0-9\s\-]{10,}'),
            ('uuid', r'^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$'),
            ('jwt', r'^eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*$'),
            ('credit_card', r'\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b'),
            ('ssn', r'\b\d{3}-\d{2}-\d{4}\b'),
            ('ipv4', r'\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b'),
            ('api_key', r'(?i)(api[_-]?key|secret[_-]?key|access[_-]?token)[:\s=]\S+'),
            ('password', r'(?i)(password|passwd|pwd)[:\s=]\S+'),
            ('private_key', r'-----BEGIN (RSA |DSA |EC )?PRIVATE KEY-----'),
        ]
        
        for data_type, pattern in patterns:
            if re.search(pattern, data_str, re.I):
                return data_type
        
        if len(data_str) > 100:
            return "long_payload"
        if len(data_str) > 50:
            return "medium_string"
        
        return "unknown"

    def calculate_risk_level(self, data_type, data_str):
        """⚠️ Calculate risk level"""
        high_risk = ['credit_card', 'ssn', 'password', 'private_key', 'api_key']
        medium_risk = ['email', 'phone', 'jwt', 'ipv4']
        
        if data_type in high_risk:
            return "CRITICAL"
        if data_type in medium_risk:
            return "HIGH"
        if data_type in ['long_payload']:
            return "MEDIUM"
        return "LOW"

    def log_crypto_operation(self, client_info, action, operation):
        """📋 Log crypto operations"""
        log_entry = {
            "timestamp": client_info['timestamp'],
            "ip": client_info['ip'],
            "fingerprint": client_info['fingerprint'],
            "action": action,
            "operation": operation
        }
        redis.lpush(KEYS['encryption_log'], json.dumps(log_entry))
        redis.ltrim(KEYS['encryption_log'], 0, 499)

    def log_casualty(self, client_info, attack_type, message):
        """💀 Log blocked attempts as casualties"""
        log_entry = {
            "timestamp": client_info['timestamp'],
            "ip": client_info['ip'],
            "fingerprint": client_info['fingerprint'],
            "attack_type": attack_type,
            "message": message,
            "path": client_info['path']
        }
        redis.lpush(KEYS['casualties'], json.dumps(log_entry))
        redis.ltrim(KEYS['casualties'], 0, 999)
        
        # Increment total casualties
        redis.incr("legion:total_casualties")

    def log_threat_intel(self, attack_type, payload_preview):
        """📜 Log threat intelligence"""
        log_entry = {
            "timestamp": int(time.time()),
            "attack_type": attack_type,
            "payload_preview": payload_preview[:100],
            "severity": "CRITICAL"
        }
        redis.lpush(KEYS['threat_intel'], json.dumps(log_entry))
        redis.ltrim(KEYS['threat_intel'], 0, 199)

    def add_to_honor_roll(self, client_info):
        """🏆 Add clean users to honor roll"""
        honor_key = f"honor:{client_info['ip']}"
        count = redis.incr(honor_key)
        redis.expire(honor_key, 86400)
        
        if count >= 10:
            redis.sadd(KEYS['honor_roll'], client_info['ip'])

    def get_clearance_level(self, client_info):
        """🎖️ Get clearance level based on history"""
        ip = client_info['ip']
        
        if redis.sismember(KEYS['honor_roll'], ip):
            return "SENATOR"
        
        honor_count = redis.get(f"honor:{ip}")
        if honor_count and int(honor_count) >= 5:
            return "CENTURION"
        
        return "LEGIONARY"

    # ============================================
    # 📨 RESPONSE METHODS
    # ============================================

    def send_json_response(self, data):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('X-Legion-Version', '2.0-IMPERIAL')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

    def respond_blocked(self, ip, remaining=None, formation="UNKNOWN"):
        """🚫 Blocked response"""
        response = {
            "status": "blocked",
            "ip": ip,
            "formation": formation,
            "message": "The Roman Legion has denied you passage.",
            "latin": "NEGATVM EST"
        }
        
        if remaining:
            response["sentence_remaining_seconds"] = remaining
            response["release_time"] = int(time.time()) + remaining
        
        self.send_json_response(response)

    def respond_executed(self, ip, method):
        """💀 Permanent ban response"""
        self.send_json_response({
            "status": "executed",
            "ip": ip,
            "method": method,
            "message": "You have been permanently condemned by the Roman Senate.",
            "latin": "SENATVS POPVLVSQVE ROMANVS TE DAMNAT",
            "appeal": "None. The decision is final."
        })

    def respond_under_siege(self):
        """🏰 Under siege response"""
        self.send_response(503)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Retry-After', '60')
        self.end_headers()
        self.wfile.write(json.dumps({
            "status": "under_siege",
            "message": "Rome is under attack. The Testudo formation has been deployed.",
            "latin": "TESTVDO FORMATIO ACTA EST",
            "retry_after": 60
        }).encode())


# Use this handler
handler = RomanLegionHandler
