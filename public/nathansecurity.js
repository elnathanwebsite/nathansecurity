(function() {
    'use strict';

    // ==========================================
    // 🏛️ ROMAN GLADIATOR SECURITY CONFIGURATION
    // ==========================================
    const LEGION_CONFIG = {
        API_URL: "https://nathansecurity.vercel.app/api/monitor",
        LEGION_PREFIX: "ROMAN_CIPHER_V2::",
        HEARTBEAT_INTERVAL: 15000, // Cek ke server setiap 15 detik
        DEBUG_TRAP_INTERVAL: 4000,
        MAX_CONSOLE_WARNINGS: 3,
        BLOOD_RED: "#8a0303",
        LEGION_GOLD: "#d4af37"
    };

    // 🛡️ MENCEGAH EKSEKUSI GANDA
    if (window.__RomanLegionActive) {
        console.error("%c⚠️ GLADIATOR SUDAH BERDIRI DI POSISI ⚠️", "color: red; font-size: 20px; font-weight: bold;");
        return;
    }
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

            let cleanStr = data.replace(LEGION_CONFIG.LEGION_PREFIX, "");
            cleanStr = cleanStr.substring(16); // Hapus decoy hash (8) + dynamic key (8)
            
            const reversedEncoded = cleanStr.split('').reverse().join('');
            const decoded = decodeURIComponent(escape(atob(reversedEncoded)));
            
            // Ambil key dari string asli
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
            navigator.userAgent,
            navigator.language,
            screen.width + 'x' + screen.height + 'x' + screen.colorDepth,
            new Date().getTimezoneOffset(),
            navigator.hardwareConcurrency || 'NA',
            canvasData
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
    // 🛡️ TESTUDO FORMATION (ANTI-TAMPER / DEVTOOLS)
    // ==========================================
    let devToolsOpen = false;
    let warningCount = 0;

    // Cegah Klik Kanan
    document.addEventListener('contextmenu', e => {
        e.preventDefault();
        showConsoleWarning("Senatus tidak mengizinkan inspeksi area ini!");
    });

    // Cegah Shortcut DevTools
    document.addEventListener('keydown', e => {
        // F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
        if (e.key === 'F12' || 
           (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j')) ||
           (e.ctrlKey && (e.key === 'U' || e.key === 'u'))) {
            e.preventDefault();
            triggerSelfDestruct("MENGAKSES SENJATA TERLARANG");
        }
    });

    // Deteksi DevTools via ukuran window
    setInterval(() => {
        const widthThreshold = window.outerWidth - window.innerWidth > 160;
        const heightThreshold = window.outerHeight - window.innerHeight > 160;
        if ((widthThreshold || heightThreshold) && !devToolsOpen) {
            devToolsOpen = true;
            triggerSelfDestruct("DEVTOOLS TERDETEKSI");
        } else if (!widthThreshold && !heightThreshold) {
            devToolsOpen = false;
        }
    }, 1000);

    // Jebakan Console (Debugger Trap)
    setInterval(() => {
        if (devToolsOpen) {
            // console.log('%c', `
            //     font-size: 1px;
            //     padding: 1000px 1000px;
            //     background: url('https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Roman_Sword.jpg/800px-Roman_Sword.jpg') no-repeat;
            // `);
        }
    }, LEGION_CONFIG.DEBUG_TRAP_INTERVAL);

    function showConsoleWarning(msg) {
        warningCount++;
        console.log(`%c⚠️ PERINGATAN LEGION #${warningCount} ⚠️`, "color: red; font-size: 24px; font-weight: bold; background: black; padding: 10px;");
        console.log(`%c${msg}`, "color: yellow; font-size: 16px; background: black;");
        console.log('%cJika ini kesalahan, segera tutup console ini.', "color: white; background: #333; padding: 5px;");
        
        if (warningCount >= LEGION_CONFIG.MAX_CONSOLE_WARNINGS) {
            triggerSelfDestruct("MELANGGAR BATAS PERINGATAN CONSUL");
        }
    }

    // Override Console agar tidak bisa di-clear
    const originalConsole = {
        log: console.log,
        clear: console.clear,
        warn: console.warn
    };
    console.clear = () => showConsoleWarning("Tidak bisa menghapus jejak di wilayah Roma!");
    console.log = function() {
        if (arguments[0] && typeof arguments[0] === 'string' && arguments[0].includes('%c')) {
            originalConsole.log.apply(console, arguments);
            return;
        }
        // Biarkan log normal jalan, tapi kita tahu mereka nge-log
    };

    // ==========================================
    // 🏹 INTERCEPTOR NETWORK (BALLISTA & SCORPIO)
    // ==========================================
    const originalFetch = window.fetch;
    const originalXHROpen = XMLHttpRequest.prototype.open;

    // Intercept Fetch
    window.fetch = async function(url, options = {}) {
        addLegionHeaders(options);
        return originalFetch.apply(this, arguments);
    };

    // Intercept XHR
    XMLHttpRequest.prototype.open = function(method, url) {
        this.addEventListener('readystatechange', function() {
            if (this.readyState === 1) { // OPENED
                // Tidak bisa langsung set header di XHR open, tapi kita bisa track URL
            }
        });
        return originalXHROpen.apply(this, arguments);
    };

    // Override setRequestHeader XHR untuk menyisipkan header Legion
    const originalSetHeader = XMLHttpRequest.prototype.setRequestHeader;
    XMLHttpRequest.prototype.setRequestHeader = function(name, value) {
        if (name.toLowerCase() === 'content-type' && !this.__legionInfected) {
            this.__legionInfected = true;
            originalSetHeader.call(this, 'X-Legion-Fingerprint', getLegionFingerprint());
            originalSetHeader.call(this, 'X-Legion-Clearance', 'GLADIATOR');
        }
        return originalSetHeader.call(this, name, value);
    };

    function addLegionHeaders(options) {
        if (!options.headers) options.headers = {};
        if (options.headers instanceof Headers) {
            options.headers.append('X-Legion-Fingerprint', getLegionFingerprint());
            options.headers.append('X-Legion-Clearance', 'GLADIATOR');
        } else {
            options.headers['X-Legion-Fingerprint'] = getLegionFingerprint();
            options.headers['X-Legion-Clearance'] = 'GLADIATOR';
        }
    }

    // ==========================================
    // 🗡️ HOOKING STORAGE (PRINCIPES GUARD)
    // ==========================================
    const SENSITIVE_PATTERNS = [
        /@gmail\.com/i, /@yahoo\.com/i, /@outlook\.com/i, /@hotmail\.com/i,
        /user[_-]?token/i, /api[_-]?key/i, /access[_-]?token/i, /refresh[_-]?token/i, 
        /secret/i, /password/i, /\bemail\b/i, /\bphone\b/i, /\baddress\b/i,
        /credit[_-]?card/i, /cvv/i, /ssn/i, /nip/i, /rek/i, /saldo/i
    ];

    function isDataSensitive(data) {
        if (typeof data !== 'string') return false;
        try {
            const parsed = JSON.parse(data);
            return scanObjectRecursive(parsed);
        } catch (e) {
            return SENSITIVE_PATTERNS.some(p => p.test(data));
        }
    }

    function scanObjectRecursive(obj) {
        if (typeof obj === 'string') return SENSITIVE_PATTERNS.some(p => p.test(obj));
        if (typeof obj === 'object' && obj !== null) {
            for (let key in obj) {
                if (SENSITIVE_PATTERNS.some(p => p.test(key)) || scanObjectRecursive(obj[key])) return true;
            }
        }
        return false;
    }

    // Hook LocalStorage
    const origLS_set = Storage.prototype.setItem;
    const origLS_get = Storage.prototype.getItem;
    
    Storage.prototype.setItem = function(key, value) {
        if (isDataSensitive(value)) {
            originalConsole.log(`%c🛡️ PRINCIPES: Data sensitif terdeteksi di [${key}]. Mengamankan...`, "color: orange;");
            origLS_set.call(this, key, gladiatorEncrypt(value));
        } else {
            origLS_set.call(this, key, value);
        }
    };

    Storage.prototype.getItem = function(key) {
        const raw = origLS_get.call(this, key);
        if (raw && typeof raw === 'string' && raw.startsWith(LEGION_CONFIG.LEGION_PREFIX)) {
            return gladiatorDecrypt(raw);
        }
        return raw;
    };

    // Hook SessionStorage
    const origSS_set = sessionStorage.setItem;
    const origSS_get = sessionStorage.getItem;

    sessionStorage.setItem = function(key, value) {
        if (isDataSensitive(value)) {
            origSS_set.call(this, key, gladiatorEncrypt(value));
        } else {
            origSS_set.call(this, key, value);
        }
    };

    sessionStorage.getItem = function(key) {
        const raw = origSS_get.call(this, key);
        if (raw && typeof raw === 'string' && raw.startsWith(LEGION_CONFIG.LEGION_PREFIX)) {
            return gladiatorDecrypt(raw);
        }
        return raw;
    };

    // Pemindaian berkala untuk data lama yang belum terenkripsi
    setInterval(() => {
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                const raw = origLS_get.call(localStorage, key);
                if (raw && isDataSensitive(raw) && !raw.startsWith(LEGION_CONFIG.LEGION_PREFIX)) {
                    origLS_set.call(localStorage, key, gladiatorEncrypt(raw));
                }
            }
            for (let i = 0; i < sessionStorage.length; i++) {
                const key = sessionStorage.key(i);
                const raw = origSS_get.call(sessionStorage, key);
                if (raw && isDataSensitive(raw) && !raw.startsWith(LEGION_CONFIG.LEGION_PREFIX)) {
                    origSS_set.call(sessionStorage, key, gladiatorEncrypt(raw));
                }
            }
        } catch (e) {}
    }, 5000);

    // ==========================================
    // 🛡️ DOM MUTATION OBSERVER (MELINDUNGI DARI XSS INJEKSI)
    // ==========================================
    const observer = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeName === 'SCRIPT' && !node.src && node.textContent) {
                        // Deteksi script inline yang mencurigakan
                        const scriptContent = node.textContent.toLowerCase();
                        if (scriptContent.includes('document.cookie') || 
                            scriptContent.includes('eval(') || 
                            scriptContent.includes('innerhtml') && scriptContent.includes('<script')) {
                            node.remove(); // Hapus script jahat langsung
                            triggerSelfDestruct("XSS INJECTION DETECTED");
                        }
                    }
                });
            }
        });
    });
    observer.observe(document.documentElement || document.body, { childList: true, subtree: true });

    // ==========================================
    // ⚔️ PROTOCOL HEARTBEAT KE SERVER (IMPERATOR COMMS)
    // ==========================================
    let isCondemned = false;

    async function imperatorHeartbeat() {
        if (isCondemned) return;

        try {
            const payload = {
                action: "heartbeat",
                path: window.location.pathname,
                fingerprint: getLegionFingerprint(),
                userAgent: navigator.userAgent
            };

            const res = await originalFetch(LEGION_CONFIG.API_URL, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "X-Legion-Fingerprint": getLegionFingerprint()
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            handleLegionCommand(data);
        } catch (e) {
            // Jika server mati, tetap berjaga tapi tidak block user
            originalConsole.log("%c⚠️ Komunikasi dengan Senatus terputus.", "color: gray;");
        }
    }

    function handleLegionCommand(response) {
        if (response.status === "allowed") {
            // Clear sailing, update UI jika perlu
            document.title = (document.title.startsWith("[✓] ") ? "" : "[✓] ") + document.title;
        } 
        else if (response.status === "blocked") {
            isCondemned = true;
            clearInterval(heartbeatInterval);
            showExecutionScreen(response.latin || "NEGATVM EST", `Formation: ${response.formation}`);
        } 
        else if (response.status === "executed") {
            isCondemned = true;
            clearInterval(heartbeatInterval);
            showExecutionScreen("SENATVS POPVLVSQVE ROMANVS TE DAMNAT", `Method: ${response.method}`);
            triggerSelfDestruct("DIPERINTAHKAN OLEH SENATUS");
        } 
        else if (response.status === "under_siege") {
            showSiegeWarning();
        }
    }

    // Mulai Heartbeat
    imperatorHeartbeat();
    const heartbeatInterval = setInterval(imperatorHeartbeat, LEGION_CONFIG.HEARTBEAT_INTERVAL);

    // ==========================================
    // 🩸 VISUAL EFEK (THE COLOSSEUM EXPERIENCE)
    // ==========================================
    function showExecutionScreen(latinText, reason) {
        window.stop(); // Hentikan semua loading
        document.documentElement.innerHTML = ''; // Hancurkan DOM
        
        const style = document.createElement('style');
        style.textContent = `
            @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700&display=swap');
            body { 
                margin: 0; padding: 0; background: #000; color: #8a0303; 
                font-family: 'Cinzel', serif; display: flex; flex-direction: column; 
                justify-content: center; align-items: center; height: 100vh; 
                overflow: hidden; user-select: none;
            }
            .sword { font-size: 100px; animation: drop 1s ease-out forwards; }
            @keyframes drop { from { transform: translateY(-200px) rotate(-45deg); opacity: 0; } to { transform: translateY(0) rotate(0deg); opacity: 1; } }
            h1 { font-size: 3em; text-transform: uppercase; letter-spacing: 5px; margin: 20px 0; text-shadow: 0 0 20px rgba(138, 3, 3, 0.8); animation: flicker 2s infinite alternate; }
            @keyframes flicker { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
            p { color: #555; font-size: 1.2em; letter-spacing: 2px; }
            .reason { color: #d4af37; margin-top: 30px; font-size: 0.9em; border: 1px solid #333; padding: 15px; background: rgba(0,0,0,0.8); }
        `;
        document.head.appendChild(style);
        
        document.body.innerHTML = `
            <div class="sword">⚔️</div>
            <h1>CONDEMNATVS</h1>
            <p>${latinText}</p>
            <div class="reason">[ ${reason} ]<br>Akses ditolak secara permanen oleh sistem.</div>
        `;
    }

    function showSiegeWarning() {
        let banner = document.getElementById('roman-siege-banner');
        if (!banner) {
            banner = document.createElement('div');
            banner.id = 'roman-siege-banner';
            banner.style.cssText = `
                position: fixed; top: 0; left: 0; width: 100%; background: rgba(212, 175, 55, 0.9);
                color: black; text-align: center; padding: 10px; font-weight: bold; z-index: 999999;
                font-family: sans-serif; transform: translateY(-100%); transition: transform 0.5s;
            `;
            document.body.prepend(banner);
            setTimeout(() => banner.style.transform = 'translateY(0)', 10);
            setTimeout(() => {
                banner.style.transform = 'translateY(-100%)';
                setTimeout(() => banner.remove(), 500);
            }, 4000);
        }
        banner.textContent = "⚠️ TESTUDO FORMATION ACTIVE: Server sedang diserang, beberapa fitur mungkin terganggu.";
    }

    function triggerSelfDestruct(reason) {
        originalConsole.log(`%c💀 SELF DESTRUCT AKTIF 💀`, "color: black; background: red; font-size: 30px; padding: 20px;");
        originalConsole.log(`cAlasan: ${reason}`, "color: white; background: black;");
        
        // Lapor ke backend bahwa user ini jahat
        originalFetch(LEGION_CONFIG.API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                action: "hide_data", 
                data: `ALERT_CLIENT_TAMPER:${reason}_FP:${getLegionFingerprint()}` 
            })
        });

        // Bersihkan semua jejak sensitif milik kita (bukan milik app)
        // for(let i=0; i<localStorage.length; i++) { ... } // Biarkan data app tetap ada, cuma kacaukan tampilan
        
        // Efek visual penghancuran
        document.body.style.filter = "blur(5px) hue-rotate(90deg)";
        document.body.style.pointerEvents = "none";
        
        setTimeout(() => {
            document.body.style.filter = "none";
            // Biarkan app jalan, tapi mereka sudah di-flag di server
        }, 2000);
    }

    console.log("%c⚔️ ROMAN LEGION SECURITY ACTIVATED ⚔️", "color: #d4af37; font-size: 24px; font-weight: bold; background: #222; padding: 15px; border: 2px solid #d4af37;");
    console.log("%cAve! Wilayah ini dilindungi oleh Senatus Populusque Romanus.", "color: white; font-size: 14px; background: #111; padding: 5px;");

})();
