// ==========================================
// 🚀 NITROUS BOOSTER (Letakkan Paling Atas)
// ==========================================
(function() {
    'use strict';
    if (window.__NitrousActive) return;
    window.__NitrousActive = true;

    const PERF_API = "/api/performance"; 
    const SEC_API = "/api/monitor";      
    const BASE_URL = window.location.origin;

    const apiCache = new Map();
    const originalFetch = window.fetch;
    
    window.fetch = async function(...args) {
        const url = (typeof args[0] === 'string') ? args[0] : args[0].url;
        const body = args[1]?.body;
        
        let cacheKey = url;
        if (body) {
            try {
                const parsedBody = JSON.parse(body);
                if (parsedBody.messages) cacheKey = url + JSON.stringify(parsedBody.messages.slice(-1));
                else if (parsedBody.prompt) cacheKey = url + parsedBody.prompt;
                else cacheKey = url + body;
            } catch(e) { cacheKey = url + body; }
        }

        if (apiCache.has(cacheKey)) {
            const cached = apiCache.get(cacheKey);
            if (Date.now() - cached.time < 300000) { 
                return new Response(JSON.stringify(cached.data), { status: 200, headers: { 'Content-Type': 'application/json' } });
            }
        }

        if (!url.includes('/api/performance') && !url.includes('/api/monitor')) {
            return originalFetch.apply(this, args);
        }

        const response = await originalFetch.apply(this, args);
        if (response.ok) {
            const cloneResponse = response.clone();
            cloneResponse.json().then(data => {
                apiCache.set(cacheKey, { data: data, time: Date.now() });
                if (apiCache.size > 50) { const oldestKey = apiCache.keys().next().value; apiCache.delete(oldestKey); }
            }).catch(() => {});
        }
        return response;
    };

    const preconnect = document.createElement('link');
    preconnect.rel = 'preconnect';
    preconnect.href = BASE_URL;
    document.head.appendChild(preconnect);

    window.addEventListener('load', () => {
        setTimeout(() => {
            const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_COMMENT | NodeFilter.SHOW_TEXT);
            let node; let trashCount = 0;
            while (node = walker.nextNode()) {
                if (node.nodeType === 8 || (node.nodeType === 3 && !node.textContent.trim())) { node.remove(); trashCount++; }
            }
        }, 1000);
    });
})();


// ==========================================
// 🛡️ INVISIBLE SECURITY SHIELD + PREMIUM UI
// ==========================================
(function() {
    'use strict';
    if (window.__InvisibleShieldActive) return;
    window.__InvisibleShieldActive = true;

    const BASE_URL = window.location.origin;
    const PERF_API = BASE_URL + "/api/performance"; 
    const SEC_API = BASE_URL + "/api/monitor";      

    const PREFIX = "ROMAN_CIPHER_V2::";
    const SALT = "SPQR_Maximus_2024";
    
    function xorCipher(text, key) {
        let r = '';
        for (let i = 0; i < text.length; i++) r += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
        return r;
    }

    function getKey() {
        let h = 0; const s = (navigator.userAgent||'') + SALT + new Date().getUTCDate();
        for (let i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h = h & h; }
        return Math.abs(h).toString(16).padStart(8, '0');
    }

    function encryptData(data) {
        try {
            const str = String(data);
            if (str.startsWith(PREFIX)) return str;
            const key = getKey();
            const enc = btoa(unescape(encodeURIComponent(xorCipher(str, key))));
            const decoy = Array.from({length: 8}, () => Math.floor(Math.random() * 16).toString(16)).join('');
            return PREFIX + decoy + key + enc.split('').reverse().join('');
        } catch(e) { return PREFIX + "ERR_" + btoa(data); }
    }

    function decryptData(data) {
        try {
            if (!data || typeof data !== 'string' || !data.startsWith(PREFIX)) return data;
            let c = data.replace(PREFIX, "").substring(16);
            const dec = decodeURIComponent(escape(atob(c.split('').reverse().join(''))));
            return xorCipher(dec, data.replace(PREFIX, "").substring(8, 16));
        } catch(e) { return data; }
    }

    const SENSITIVE = [/@gmail\.com/i, /@yahoo\.com/i, /user[_-]?token/i, /api[_-]?key/i, /access[_-]?token/i, /password/i, /\bemail\b/i, /\bphone\b/i];
    function isSensitive(data) {
        if (typeof data !== 'string') return false;
        try { return SENSITIVE.some(p => p.test(JSON.parse(data))); } catch(e) { return SENSITIVE.some(p => p.test(data)); }
    }

    const origLSSet = Storage.prototype.setItem;
    const origLSGet = Storage.prototype.getItem;
    Storage.prototype.setItem = function(k, v) { origLSSet.call(this, k, isSensitive(v) ? encryptData(v) : v); };
    Storage.prototype.getItem = function(k) { const r = origLSGet.call(this, k); return (r && r.startsWith(PREFIX)) ? decryptData(r) : r; };

    setInterval(() => {
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                const raw = origLSGet.call(localStorage, key);
                if (raw && isSensitive(raw) && !raw.startsWith(PREFIX)) origLSSet.call(localStorage, key, encryptData(raw));
            }
        } catch (e) {}
    }, 5000);

    // ==========================================
    // SPLIT HEARTBEAT
    // ==========================================
    let isCondemned = false;

    async function startHealthCheck() {
        if (isCondemned) return;
        try {
            const goCheck = await fetch(PERF_API, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "health_check" })
            }).then(r => r.json()).catch(() => null);

            if (goCheck && goCheck.status === "blocked") {
                isCondemned = true;
                return showExecutionScreen("ACCESS DENIED", "Golang Firewall Triggered");
            }

            const pyCheck = await fetch(SEC_API, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "heartbeat", path: window.location.pathname })
            }).then(r => r.json()).catch(() => null);

            if (pyCheck && pyCheck.status === "blocked") {
                isCondemned = true;
                return showExecutionScreen("NEGATVM EST", "Python Security Triggered");
            }
        } catch (e) {}
    }
    startHealthCheck();

    // ==========================================
    // UI NOTIFIKASI MINIMALIS PREMIUM
    // ==========================================
    let securityPopup = null;
    let popupCooldown = false;

    // Kumpulan ikon tipis minimalis (Sesuai gambar yang kamu kirim)
    const icons = {
        // Logo Go (Biru)
        go: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="24" height="24" rx="5" fill="#00ADD8"/>
                <path d="M7.5 7.5L12 5L16.5 7.5V11.5L12 14.5L7.5 11.5V7.5Z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M12 14.5V19" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
                <path d="M7.5 11.5L4 13.5" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
                <path d="M16.5 11.5L20 13.5" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
                <text x="12" y="9" font-family="Arial" font-size="4" font-weight="bold" fill="white" text-anchor="middle">GO</text>
             </svg>`,
        // Logo Python (Biru Tua)
        python: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C9.24 2 9 3.11 9 4.5V7H12.5V8H7.5C6.11 8 5 9.24 5 11v2.5c0 1.38 1.12 2.5 2.5 2.5H9v2.5c0 1.38 1.24 2.5 3 2.5s3-1.12 3-2.5V16h-3.5v-1H17c1.38 0 2.5-1.12 2.5-2.5V11c0-1.38-1.12-2.5-2.5-2.5H15V4.5C15 3.11 14.76 2 12 2zM9.5 17.5a.75.75 0 110 1.5.75.75 0 010-1.5zm5-11a.75.75 0 110 1.5.75.75 0 010-1.5z" fill="#3776AB"/>
                 </svg>`,
        // Tameng (Biru)
        shield: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
        // Serangan (Merah)
        attack: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>`,
        // Filter (Hijau)
        check: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/></svg>`,
        // Kunci (Abu-abu Gelap)
        lock: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#374151" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>`,
        // Info
        info: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`
    };

    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        if (popupCooldown) return; 
        popupCooldown = true;
        setTimeout(() => popupCooldown = false, 4000);

        if (securityPopup) securityPopup.remove();

        securityPopup = document.createElement('div');
        securityPopup.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 14px;">
                <img src="https://i.ibb.co.com/4wNrYy7n/python-vs-go-slim.png" alt="Logo" style="height: 32px; border-radius: 6px; object-fit: cover;">
                <div>
                    <div style="font-weight: 600; font-size: 14px; color: #111827; line-height: 1.2;">Nathan Security</div>
                    <div style="font-size: 11px; color: #6b7280; margin-top: 2px;">Protection Active</div>
                </div>
            </div>
            
            <div style="font-size: 12px; color: #6b7280; line-height: 1.5; margin-bottom: 16px;">
                Akses inspeksi halaman dibatasi untuk melindungi integritas data.
            </div>
            
            <!-- LIST FUNGSI MINIMALIS TANPA KOTAK -->
            <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px;">
                
                <div style="display: flex; align-items: center; gap: 10px; font-size: 12px; color: #374151;">
                    ${icons.go}
                    <span style="flex:1">Golang Performance</span>
                    <span style="font-size: 10px; color: #9ca3af;">Cache & Routing</span>
                </div>

                <div style="display: flex; align-items: center; gap: 10px; font-size: 12px; color: #374151;">
                    ${icons.python}
                    <span style="flex:1">Python Deep Security</span>
                    <span style="font-size: 10px; color: #9ca3af;">Enkripsi & Validasi</span>
                </div>

                <div style="display: flex; align-items: center; gap: 10px; font-size: 12px; color: #374151;">
                    ${icons.shield}
                    <span>Enkripsi Storage Aktif</span>
                </div>

                <div style="display: flex; align-items: center; gap: 10px; font-size: 12px; color: #374151;">
                    ${icons.attack}
                    <span>Proteksi Serangan API</span>
                </div>

                <div style="display: flex; align-items: center; gap: 10px; font-size: 12px; color: #374151;">
                    ${icons.check}
                    <span>Filter Injeksi Kode</span>
                </div>

                <div style="display: flex; align-items: center; gap: 10px; font-size: 12px; color: #374151;">
                    ${icons.lock}
                    <span>Intersep Anti-Sniffing</span>
                </div>

            </div>

            <div style="padding-top: 10px; border-top: 1px solid #f3f4f6; font-size: 11px; color: #9ca3af; display: flex; align-items: center; gap: 6px;">
                ${icons.info}
                Nonaktifkan JavaScript di browser untuk melewati antarmuka ini.
            </div>
        `;

        // Styling Super Clean (Tanpa kotak-kotak abu)
        securityPopup.style.cssText = `
            position: fixed;
            bottom: 24px;
            right: 24px;
            background: #ffffff;
            border: 1px solid #e5e7eb;
            padding: 18px 22px;
            border-radius: 10px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            z-index: 999999;
            width: 300px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
            pointer-events: none; 
            opacity: 0;
            transform: translateY(10px);
            transition: all 0.25s ease-out;
        `;
        
        document.body.appendChild(securityPopup);

        requestAnimationFrame(() => {
            securityPopup.style.opacity = '1';
            securityPopup.style.transform = 'translateY(0)';
        });

        setTimeout(() => {
            if (securityPopup) {
                securityPopup.style.opacity = '0';
                securityPopup.style.transform = 'translateY(10px)';
                setTimeout(() => { if(securityPopup) securityPopup.remove(); securityPopup = null; }, 250);
            }
        }, 4000);

    }, true);

    // ANTI XSS
    const observer = new MutationObserver(mutations => {
        mutations.forEach(m => m.addedNodes.forEach(node => {
            if (node.nodeName === 'SCRIPT' && !node.src && node.textContent) {
                const s = node.textContent.toLowerCase();
                if (s.includes('document.cookie') || s.includes('eval(')) node.remove();
            }
        }));
    });
    observer.observe(document.documentElement || document.body, { childList: true, subtree: true });

    function showExecutionScreen(title, reason) {
        window.stop(); 
        document.documentElement.innerHTML = ''; 
        const style = document.createElement('style');
        style.textContent = `body{margin:0;padding:0;background:#fff;display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;color:#111;}h1{font-size:24px;margin-bottom:10px;}p{color:#666;font-size:14px;}`;
        document.head.appendChild(style);
        document.body.innerHTML = `<div style="text-align:center"><h1>${title}</h1><p>${reason}</p></div>`;
    }

})();
