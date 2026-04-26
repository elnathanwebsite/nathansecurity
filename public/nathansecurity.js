(function() {
    'use strict';

    // ==========================================
    // 🏛️ ROMAN GLADIATOR SECURITY CONFIGURATION
    // ==========================================
    const LEGION_CONFIG = {
        API_URL: "https://nathansecurity.vercel.app/api/monitor",
        LEGION_PREFIX: "ROMAN_CIPHER_V2::",
        HEARTBEAT_INTERVAL: 15000, 
        MAX_CONSOLE_WARNINGS: 3
    };

    if (window.__RomanLegionActive) return;
    window.__RomanLegionActive = true;

    // ==========================================
    // 🗡️ SENJATA RAHASIA VELITES (ENKRIPSI LOKAL)
    // ==========================================
    const CRYPTO_SALT = "SPQR_Imperator_Maximus_Caesar_Augustus";
    
    function generateDynamicKey() {
        const fingerprint = getLegionFingerprint();
        let hash = 0;
        const str = fingerprint + CRYPTO_SALT + new Date().getUTCDate();
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16).padStart(8, '0');
    }

    function xorCipher(text, key) {
        let result = '';
        for (let i = 0; i < text.length; i++) {
            result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
        }
        return result;
    }

    function gladiatorEncrypt(data) {
        try {
            const str = String(data);
            if (str.startsWith(LEGION_CONFIG.LEGION_PREFIX)) return str;
            const dynamicKey = generateDynamicKey();
            const xored = xorCipher(str, dynamicKey);
            const encoded = btoa(unescape(encodeURIComponent(xored)));
            const decoyHash = Array.from({length: 8}, () => Math.floor(Math.random() * 16).toString(16)).join('');
            return LEGION_CONFIG.LEGION_PREFIX + decoyHash + dynamicKey + encoded.split('').reverse().join('');
        } catch(e) {
            return LEGION_CONFIG.LEGION_PREFIX + "ERR_" + btoa(data);
        }
    }

    function gladiatorDecrypt(data) {
        try {
            if (!data || typeof data !== 'string') return data;
            if (!data.startsWith(LEGION_CONFIG.LEGION_PREFIX)) return data;
            let cleanStr = data.replace(LEGION_CONFIG.LEGION_PREFIX, "").substring(16); 
            const reversedEncoded = cleanStr.split('').reverse().join('');
            const decoded = decodeURIComponent(escape(atob(reversedEncoded)));
            const keyPart = data.replace(LEGION_CONFIG.LEGION_PREFIX, "").substring(8, 16);
            return xorCipher(decoded, keyPart);
        } catch(e) {
            return data;
        }
    }

    // ==========================================
    // 🔍 INTELIJEN PASUKAN (FINGERPRINTING)
    // ==========================================
    function getLegionFingerprint() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.textBaseline = "top";
        ctx.font = "14px 'Arial'";
        ctx.fillText("SPQR_GLADIATOR_2024", 2, 2);
        const canvasData = canvas.toDataURL();
        const components = [
            navigator.userAgent, navigator.language,
            screen.width + 'x' + screen.height + 'x' + screen.colorDepth,
            new Date().getTimezoneOffset(), navigator.hardwareConcurrency || 'NA', canvasData
        ];
        let hash = 0;
        const str = components.join('|');
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(36);
    }

    // ==========================================
    // 🛡️ TESTUDO FORMATION (ANTI-TAMPER YANG AMAN)
    // ==========================================
    let devToolsOpen = false;
    let warningCount = 0;

    // Cegah Klik Kanan -> Tampilkan peringatan visual sesaat, JANGAN matikan fungsi klik!
    document.addEventListener('contextmenu', e => {
        e.preventDefault();
        showWarningPopup("🚫 AREA TERLARANG LEGION!");
        reportToServer("CONTEXT_MENU_BLOCKED");
    });

    // Cegah Shortcut DevTools
    document.addEventListener('keydown', e => {
        if (e.key === 'F12' || 
           (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j')) ||
           (e.ctrlKey && (e.key === 'U' || e.key === 'u'))) {
            e.preventDefault();
            showWarningPopup("⚔️ SENJATA TERLARANG DETECTED!");
            reportToServer("DEVTOOLS_SHORTCUT_BLOCKED");
        }
    });

    // Deteksi Devtools terbuka (Hanya melaporkan, tidak merusak)
    setInterval(() => {
        const widthThreshold = window.outerWidth - window.innerWidth > 160;
        const heightThreshold = window.outerHeight - window.innerHeight > 160;
        if ((widthThreshold || heightThreshold) && !devToolsOpen) {
            devToolsOpen = true;
            reportToServer("DEVTOOLS_OPENED");
        } else if (!widthThreshold && !heightThreshold) {
            devToolsOpen = false;
        }
    }, 1000);

    // Override Console (Hanya untuk menghitung, tidak membunuh fungsi)
    const originalConsole = { log: console.log, clear: console.clear };
    console.clear = () => {
        showWarningPopup("🧹 TIDAK BISA MENGHAPUS JEJAK!");
        reportToServer("CONSOLE_CLEAR_BLOCKED");
    };

    // ==========================================
    // 🎨 FUNGSI VISUAL AMAN (TIDAK MEMBUNUH KLIK)
    // ==========================================
    function showWarningPopup(msg) {
        warningCount++;
        // Buat elemen visual
        const popup = document.createElement('div');
        popup.innerText = msg;
        popup.style.cssText = `
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            background: rgba(0,0,0,0.95); color: #d4af37; padding: 20px 40px; 
            font-size: 20px; font-weight: bold; z-index: 999999; 
            border: 2px solid #d4af37; border-radius: 8px; font-family: sans-serif;
            pointer-events: none; /* <-- RAHASIA KUNCI: Tidak akan mengganggu klik di bawahnya! */
            animation: romanFadeOut 2s forwards;
            text-align: center;
        `;
        
        // Tambahkan animasi CSS jika belum ada
        if (!document.getElementById('roman-anim-style')) {
            const style = document.createElement('style');
            style.id = 'roman-anim-style';
            style.textContent = `@keyframes romanFadeOut { 0% {opacity:1; transform: translate(-50%, -50%) scale(1);} 100% {opacity:0; transform: translate(-50%, -60%) scale(0.8);} }`;
            document.head.appendChild(style);
        }

        document.body.appendChild(popup);
        setTimeout(() => popup.remove(), 2000); // Hilang sendiri dalam 2 detik

        // Kalau sudah terlalu sering, minta server untuk BAN
        if (warningCount >= LEGION_CONFIG.MAX_CONSOLE_WARNINGS) {
            reportToServer("MAX_WARNING_EXCEEDED_AUTO_BAN");
            warningCount = 0; // Reset biar nggak spam
        }
    }

    // ==========================================
    // 📡 PELAPORAN KE SERVER (MENGHINDARI SELF DESTRUCT)
    // ==========================================
    function reportToServer(reason) {
        // Gunakan fetch asli, jangan yang sudah di-hook, biar nggak loop
        const originalFetch = window.fetch;
        originalFetch(LEGION_CONFIG.API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                action: "hide_data", 
                data: `ALERT_CLIENT_TAMPER:${reason}_FP:${getLegionFingerprint()}` 
            })
        }).catch(() => {}); // Kalau server mati, diamkan saja
    }

    // ==========================================
    // 🏹 INTERCEPTOR NETWORK (BALLISTA & SCORPIO)
    // ==========================================
    const originalFetchHook = window.fetch;
    window.fetch = async function(url, options = {}) {
        addLegionHeaders(options);
        return originalFetchHook.apply(this, arguments);
    };

    const originalXHROpen = XMLHttpRequest.prototype.open;
    const originalSetHeader = XMLHttpRequest.prototype.setRequestHeader;
    
    XMLHttpRequest.prototype.setRequestHeader = function(name, value) {
        if (name.toLowerCase() === 'content-type' && !this.__legionInfected) {
            this.__legionInfected = true;
            originalSetHeader.call(this, 'X-Legion-Fingerprint', getLegionFingerprint());
        }
        return originalSetHeader.call(this, name, value);
    };

    function addLegionHeaders(options) {
        if (!options.headers) options.headers = {};
        if (options.headers instanceof Headers) {
            options.headers.append('X-Legion-Fingerprint', getLegionFingerprint());
        } else {
            options.headers['X-Legion-Fingerprint'] = getLegionFingerprint();
        }
    }

    // ==========================================
    // 🗡️ HOOKING STORAGE (PRINCIPES GUARD)
    // ==========================================
    const SENSITIVE_PATTERNS = [
        /@gmail\.com/i, /@yahoo\.com/i, /@outlook\.com/i, /user[_-]?token/i, 
        /api[_-]?key/i, /access[_-]?token/i, /password/i, /\bemail\b/i, /\bphone\b/i
    ];

    function isDataSensitive(data) {
        if (typeof data !== 'string') return false;
        try {
            return SENSITIVE_PATTERNS.some(p => p.test(JSON.parse(data)));
        } catch (e) {
            return SENSITIVE_PATTERNS.some(p => p.test(data));
        }
    }

    const origLS_set = Storage.prototype.setItem;
    const origLS_get = Storage.prototype.getItem;
    
    Storage.prototype.setItem = function(key, value) {
        if (isDataSensitive(value)) origLS_set.call(this, key, gladiatorEncrypt(value));
        else origLS_set.call(this, key, value);
    };

    Storage.prototype.getItem = function(key) {
        const raw = origLS_get.call(this, key);
        if (raw && typeof raw === 'string' && raw.startsWith(LEGION_CONFIG.LEGION_PREFIX)) return gladiatorDecrypt(raw);
        return raw;
    };

    // Hook SessionStorage
    const origSS_set = sessionStorage.setItem;
    const origSS_get = sessionStorage.getItem;
    sessionStorage.setItem = function(key, value) {
        if (isDataSensitive(value)) origSS_set.call(this, key, gladiatorEncrypt(value));
        else origSS_set.call(this, key, value);
    };
    sessionStorage.getItem = function(key) {
        const raw = origSS_get.call(this, key);
        if (raw && typeof raw === 'string' && raw.startsWith(LEGION_CONFIG.LEGION_PREFIX)) return gladiatorDecrypt(raw);
        return raw;
    };

    // Pemindaian berkala data lama
    setInterval(() => {
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                const raw = origLS_get.call(localStorage, key);
                if (raw && isDataSensitive(raw) && !raw.startsWith(LEGION_CONFIG.LEGION_PREFIX)) {
                    origLS_set.call(localStorage, key, gladiatorEncrypt(raw));
                }
            }
        } catch (e) {}
    }, 5000);

    // ==========================================
    // 👁️ DOM MUTATION OBSERVER (ANTI XSS)
    // ==========================================
    const observer = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.nodeName === 'SCRIPT' && !node.src && node.textContent) {
                    const scriptContent = node.textContent.toLowerCase();
                    if (scriptContent.includes('document.cookie') || scriptContent.includes('eval(')) {
                        node.remove(); 
                        reportToServer("XSS_INJECTION_BLOCKED");
                    }
                }
            });
        });
    });
    observer.observe(document.documentElement || document.body, { childList: true, subtree: true });

    // ==========================================
    // ⚔️ PROTOCOL HEARTBEAT KE SERVER
    // ==========================================
    let isCondemned = false;

    async function imperatorHeartbeat() {
        if (isCondemned) return;
        try {
            const res = await originalFetchHook(LEGION_CONFIG.API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json", "X-Legion-Fingerprint": getLegionFingerprint() },
                body: JSON.stringify({ path: window.location.pathname, fingerprint: getLegionFingerprint() })
            });
            const data = await res.json();
            handleLegionCommand(data);
        } catch (e) {}
    }

    function handleLegionCommand(response) {
        if (response.status === "blocked" || response.status === "executed") {
            isCondemned = true;
            clearInterval(heartbeatInterval);
            // Hanya server yang berhak menghancurkan DOM, Bukan karena klik kanan!
            showExecutionScreen(response.latin || "NEGATVM EST", response.formation || response.method);
        } 
        else if (response.status === "under_siege") {
            showSiegeWarning();
        }
    }

    imperatorHeartbeat();
    const heartbeatInterval = setInterval(imperatorHeartbeat, LEGION_CONFIG.HEARTBEAT_INTERVAL);

    // ==========================================
    // 🩸 VISUAL EFEK (HANYA DIKENDALIKAN SERVER)
    // ==========================================
    function showExecutionScreen(latinText, reason) {
        window.stop(); 
        document.documentElement.innerHTML = ''; 
        
        const style = document.createElement('style');
        style.textContent = `
            @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700&display=swap');
            body { margin: 0; padding: 0; background: #000; color: #8a0303; font-family: 'Cinzel', serif; display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh; overflow: hidden; }
            .sword { font-size: 100px; animation: drop 1s ease-out forwards; }
            @keyframes drop { from { transform: translateY(-200px) rotate(-45deg); opacity: 0; } to { transform: translateY(0) rotate(0deg); opacity: 1; } }
            h1 { font-size: 3em; text-transform: uppercase; letter-spacing: 5px; margin: 20px 0; text-shadow: 0 0 20px rgba(138, 3, 3, 0.8); }
            p { color: #555; font-size: 1.2em; letter-spacing: 2px; }
            .reason { color: #d4af37; margin-top: 30px; font-size: 0.9em; border: 1px solid #333; padding: 15px; background: rgba(0,0,0,0.8); }
        `;
        document.head.appendChild(style);
        document.body.innerHTML = `
            <div class="sword">⚔️</div>
            <h1>CONDEMNATVS</h1>
            <p>${latinText}</p>
            <div class="reason">[ ${reason} ]</div>
        `;
    }

    function showSiegeWarning() {
        let banner = document.getElementById('roman-siege-banner');
        if (!banner) {
            banner = document.createElement('div');
            banner.id = 'roman-siege-banner';
            banner.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; background: rgba(212, 175, 55, 0.9); color: black; text-align: center; padding: 10px; font-weight: bold; z-index: 999998; font-family: sans-serif; pointer-events: none;`; // pointer-events none biar nggak ganggu klik
            document.body.prepend(banner);
            setTimeout(() => banner.remove(), 4000);
        }
        banner.textContent = "⚠️ TESTUDO ACTIVE: Server sedang diserang.";
    }

})();
