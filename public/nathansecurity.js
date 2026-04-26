(function() {
    'use strict';

    // ==========================================
    // 🏛️ ROMAN GLADIATOR SECURITY (GHOST MODE)
    // ==========================================
    const LEGION_CONFIG = {
        API_URL: "https://nathansecurity.vercel.app/api/monitor",
        LEGION_PREFIX: "ROMAN_CIPHER_V2::",
        HEARTBEAT_INTERVAL: 15000
    };

    // Mencegah eksekusi ganda
    if (window.__RomanLegionActive) return;
    window.__RomanLegionActive = true;

    // ==========================================
    // 🛡️ FITUR 1: MATIKAN KLIK KANAN (100% AMAN)
    // ==========================================
    // Menggunakan capture: true agar mencegah sebelum sampai ke kode lain
    // Menggunakan setTimeout agar pelaporan ke server tidak mengganggu performa
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault(); // Matikan klik kanan
        setTimeout(() => reportToServer("CONTEXT_MENU_BLOCKED"), 0); // Lapor diam-diam
    }, true);

    // ==========================================
    // 🕵️ FITUR 2: PENCEGAHAN INSPECT (TANPA MERUSAK)
    // ==========================================
    let devToolsOpen = false;

    // Blokir shortcut keyboard (F12, Ctrl+Shift+I, Ctrl+U)
    document.addEventListener('keydown', function(e) {
        if (e.key === 'F12' || 
           (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) ||
           (e.ctrlKey && (e.key === 'U' || e.key === 'u'))) {
            e.preventDefault();
            setTimeout(() => reportToServer("DEVTOOLS_SHORTCUT"), 0);
        }
    }, true);

    // Deteksi Devtools terbuka (Hanya lapor, tidak merusak apapun)
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

    // Jebakan Console (Tidak menampilkan apapun, hanya mencatat)
    const origConsoleClear = console.clear;
    console.clear = () => reportToServer("CONSOLE_CLEAR");

    // ==========================================
    // 📡 FUNGSI PELAPORAN SERVER (BACKGROUND)
    // ==========================================
    function reportToServer(reason) {
        // Menggunakan fetch asli bawaan browser, dibungkus catch kosong 
        // agar jika server offline, TIDAK AKAN menimbulkan error di console website
        window.fetch(LEGION_CONFIG.API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                action: "hide_data", 
                data: `ALERT:${reason}_FP:${getLegionFingerprint()}` 
            })
        }).catch(() => {});
    }

    // ==========================================
    // 🔐 FITUR 3: ENKRIPSI STORAGE (XOR CIPHER)
    // ==========================================
    const CRYPTO_SALT = "SPQR_Imperator_Maximus_Caesar";
    
    function generateDynamicKey() {
        let hash = 0;
        const str = getLegionFingerprint() + CRYPTO_SALT + new Date().getUTCDate();
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
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
            const key = generateDynamicKey();
            const xored = xorCipher(str, key);
            const encoded = btoa(unescape(encodeURIComponent(xored)));
            const decoy = Array.from({length: 8}, () => Math.floor(Math.random() * 16).toString(16)).join('');
            return LEGION_CONFIG.LEGION_PREFIX + decoy + key + encoded.split('').reverse().join('');
        } catch(e) { return LEGION_CONFIG.LEGION_PREFIX + "ERR_" + btoa(data); }
    }

    function gladiatorDecrypt(data) {
        try {
            if (!data || typeof data !== 'string' || !data.startsWith(LEGION_CONFIG.LEGION_PREFIX)) return data;
            let cleanStr = data.replace(LEGION_CONFIG.LEGION_PREFIX, "").substring(16); 
            const reversedEncoded = cleanStr.split('').reverse().join('');
            const decoded = decodeURIComponent(escape(atob(reversedEncoded)));
            const keyPart = data.replace(LEGION_CONFIG.LEGION_PREFIX, "").substring(8, 16);
            return xorCipher(decoded, keyPart);
        } catch(e) { return data; }
    }

    // ==========================================
    // 🆔 FITUR 4: FINGERPRINTING (SIDIK JARI BROWSER)
    // ==========================================
    function getLegionFingerprint() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.textBaseline = "top";
        ctx.font = "14px 'Arial'";
        ctx.fillText("SPQR_2024", 2, 2);
        const components = [
            navigator.userAgent, navigator.language,
            screen.width + 'x' + screen.height, new Date().getTimezoneOffset(), 
            navigator.hardwareConcurrency || 'NA', canvas.toDataURL()
        ];
        let hash = 0;
        const str = components.join('|');
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash = hash & hash;
        }
        return Math.abs(hash).toString(36);
    }

    // ==========================================
    // 🏹 FITUR 5: INTERCEPTOR JARINGAN (FETCH & XHR)
    // ==========================================
    const originalFetch = window.fetch;
    window.fetch = async function(url, options = {}) {
        if (!options.headers) options.headers = {};
        if (options.headers instanceof Headers) {
            options.headers.append('X-Legion-Fingerprint', getLegionFingerprint());
        } else {
            options.headers['X-Legion-Fingerprint'] = getLegionFingerprint();
        }
        return originalFetch.apply(this, arguments);
    };

    const originalXHROpen = XMLHttpRequest.prototype.open;
    const originalSetHeader = XMLHttpRequest.prototype.setRequestHeader;
    
    XMLHttpRequest.prototype.setRequestHeader = function(name, value) {
        if (name.toLowerCase() === 'content-type' && !this.__legionFlag) {
            this.__legionFlag = true;
            originalSetHeader.call(this, 'X-Legion-Fingerprint', getLegionFingerprint());
        }
        return originalSetHeader.call(this, name, value);
    };

    // ==========================================
    // 🗡️ FITUR 6: AUTO-ENKRIPSI LOCALSTORAGE/SESSIONSTORAGE
    // ==========================================
    const SENSITIVE_PATTERNS = [
        /@gmail\.com/i, /@yahoo\.com/i, /@outlook\.com/i, /user[_-]?token/i, 
        /api[_-]?key/i, /access[_-]?token/i, /password/i, /\bemail\b/i, /\bphone\b/i
    ];

    function isDataSensitive(data) {
        if (typeof data !== 'string') return false;
        try { return SENSITIVE_PATTERNS.some(p => p.test(JSON.parse(data))); } 
        catch (e) { return SENSITIVE_PATTERNS.some(p => p.test(data)); }
    }

    // Hook LocalStorage
    const origLS_set = Storage.prototype.setItem;
    const origLS_get = Storage.prototype.getItem;
    
    Storage.prototype.setItem = function(key, value) {
        if (isDataSensitive(value)) origLS_set.call(this, key, gladiatorEncrypt(value));
        else origLS_set.call(this, key, value);
    };

    Storage.prototype.getItem = function(key) {
        const raw = origLS_get.call(this, key);
        return (raw && raw.startsWith(LEGION_CONFIG.LEGION_PREFIX)) ? gladiatorDecrypt(raw) : raw;
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
        return (raw && raw.startsWith(LEGION_CONFIG.LEGION_PREFIX)) ? gladiatorDecrypt(raw) : raw;
    };

    // Scan data lama yang belum terenkripsi (berjalan diam-diam)
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
    // 👁️ FITUR 7: ANTI XSS INJECTION (MUTATION OBSERVER)
    // ==========================================
    const observer = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.nodeName === 'SCRIPT' && !node.src && node.textContent) {
                    const content = node.textContent.toLowerCase();
                    if (content.includes('document.cookie') || content.includes('eval(')) {
                        node.remove(); // Hancurkan script jahat
                        reportToServer("XSS_BLOCKED");
                    }
                }
            });
        });
    });
    
    // Jalankan observer setelah DOM siap
    if (document.documentElement) observer.observe(document.documentElement, { childList: true, subtree: true });
    else window.addEventListener('DOMContentLoaded', () => observer.observe(document.documentElement, { childList: true, subtree: true }));

    // ==========================================
    // 💓 FITUR 8: HEARTBEAT KE SERVER PYTHON
    // ==========================================
    let isCondemned = false;

    async function imperatorHeartbeat() {
        if (isCondemned) return;
        try {
            const res = await originalFetch(LEGION_CONFIG.API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json", "X-Legion-Fingerprint": getLegionFingerprint() },
                body: JSON.stringify({ path: window.location.pathname, fingerprint: getLegionFingerprint() })
            });
            const data = await res.json();
            
            // HANYA SERVER YANG BERHAK MENGHANCURKAN HALAMAN
            if (data.status === "blocked" || data.status === "executed") {
                isCondemned = true;
                showExecutionScreen(data.latin || "NEGATVM EST", data.formation || data.method);
            }
        } catch (e) {}
    }

    imperatorHeartbeat();
    setInterval(imperatorHeartbeat, LEGION_CONFIG.HEARTBEAT_INTERVAL);

    // ==========================================
    // 🩸 FITUR VISUAL (HANYA DIAKTIFKAN OLEH SERVER)
    // ==========================================
    function showExecutionScreen(latinText, reason) {
        window.stop(); 
        document.documentElement.innerHTML = ''; 
        
        const style = document.createElement('style');
        style.textContent = `
            @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700&display=swap');
            body { margin:0; padding:0; background:#000; color:#8a0303; font-family:'Cinzel',serif; display:flex; flex-direction:column; justify-content:center; align-items:center; height:100vh; overflow:hidden; }
            .sword { font-size:100px; animation: drop 1s ease-out forwards; }
            @keyframes drop { from { transform: translateY(-200px) rotate(-45deg); opacity:0; } to { transform: translateY(0) rotate(0deg); opacity:1; } }
            h1 { font-size:3em; text-transform:uppercase; letter-spacing:5px; margin:20px 0; text-shadow: 0 0 20px rgba(138,3,3,0.8); }
            p { color:#555; font-size:1.2em; letter-spacing:2px; }
            .reason { color:#d4af37; margin-top:30px; font-size:0.9em; border:1px solid #333; padding:15px; background:rgba(0,0,0,0.8); }
        `;
        document.head.appendChild(style);
        document.body.innerHTML = `
            <div class="sword">⚔️</div>
            <h1>CONDEMNATVS</h1>
            <p>${latinText}</p>
            <div class="reason">[ ${reason} ]</div>
        `;
    }

})();
