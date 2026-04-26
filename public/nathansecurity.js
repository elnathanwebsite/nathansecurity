// ==========================================
// 🚀 NITROUS BOOSTER
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
        if (!url.includes('/api/performance') && !url.includes('/api/monitor')) return originalFetch.apply(this, args);
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
// 🛡️ INVISIBLE SECURITY SHIELD + UI GAMBAR BESAR
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

    let isCondemned = false;
    async function startHealthCheck() {
        if (isCondemned) return;
        try {
            const goCheck = await fetch(PERF_API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "health_check" }) }).then(r => r.json()).catch(() => null);
            if (goCheck && goCheck.status === "blocked") { isCondemned = true; return showExecutionScreen("ACCESS DENIED", "Golang Firewall Triggered"); }
            const pyCheck = await fetch(SEC_API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "heartbeat", path: window.location.pathname }) }).then(r => r.json()).catch(() => null);
            if (pyCheck && pyCheck.status === "blocked") { isCondemned = true; return showExecutionScreen("NEGATVM EST", "Python Security Triggered"); }
        } catch (e) {}
    }
    startHealthCheck();

    // ==========================================
    // UI POP UP TERBARU
    // ==========================================
    let securityPopup = null;
    let popupCooldown = false;

    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        if (popupCooldown) return; 
        popupCooldown = true;
        setTimeout(() => popupCooldown = false, 4000);

        if (securityPopup) securityPopup.remove();

        securityPopup = document.createElement('div');
        securityPopup.innerHTML = `
            <div style="text-align: center; margin-bottom: 16px; border-bottom: 1px solid #f3f4f6; padding-bottom: 14px;">
                <img src="https://i.ibb.co.com/4wNrYy7n/python-vs-go-slim.png" alt="Logo" style="height: 60px; width: auto; border-radius: 8px; object-fit: contain;">
                <div style="margin-top: 8px; font-weight: 600; font-size: 14px; color: #111827;">Nathan Security</div>
                <div style="font-size: 11px; color: #6b7280;">Hybrid Engine Active</div>
            </div>
            
            <div style="font-size: 12px; color: #6b7280; text-align: center; line-height: 1.4; margin-bottom: 16px;">
                Akses inspeksi halaman dibatasi untuk melindungi integritas data.
            </div>
            
            <div style="display: flex; flex-direction: column; gap: 14px; margin-bottom: 16px;">
                
                <div style="display: flex; gap: 12px;">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Gopher_Front_View.png/120px-Gopher_Front_View.png" alt="Go" style="width: 24px; height: 24px; object-fit: contain; margin-top: 1px;">
                    <div>
                        <div style="font-weight: 600; font-size: 13px; color: #00ADD8;">Golang (Performance)</div>
                        <div style="font-size: 11px; color: #6b7280; line-height: 1.5;">Cache RAM kilat, routing lalu lintas, dan penangkal serangan DDoS.</div>
                    </div>
                </div>

                <div style="display: flex; gap: 12px;">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Python-logo-notext.svg/110px-Python-logo-notext.svg.png" alt="Python" style="width: 24px; height: 24px; object-fit: contain; margin-top: 1px;">
                    <div>
                        <div style="font-weight: 600; font-size: 13px; color: #3776AB;">Python (Security)</div>
                        <div style="font-size: 11px; color: #6b7280; line-height: 1.5;">Enkripsi data sensitif, validasi SQLi/XSS, dan pengamanan storage.</div>
                    </div>
                </div>

            </div>

            <div style="padding-top: 10px; border-top: 1px solid #f3f4f6; font-size: 11px; color: #9ca3af; text-align: center;">
                * Nonaktifkan JavaScript di browser untuk melewati antarmuka ini.
            </div>
        `;

        securityPopup.style.cssText = `
            position: fixed;
            bottom: 24px;
            right: 24px;
            background: #ffffff;
            border: 1px solid #e5e7eb;
            padding: 20px 24px;
            border-radius: 12px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            z-index: 999999;
            width: 320px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
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
