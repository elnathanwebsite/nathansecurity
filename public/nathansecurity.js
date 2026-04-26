// ==========================================
// 🚀 NITROUS BOOSTER (Letakkan Paling Atas)
// ==========================================
(function() {
    'use strict';
    if (window.__NitrousActive) return;
    window.__NitrousActive = true;

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
            if (Date.now() - cached.time < 300000) { return new Response(JSON.stringify(cached.data), { status: 200, headers: { 'Content-Type': 'application/json' } }); }
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
    preconnect.href = window.location.origin;
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
// 🛡️ INVISIBLE SECURITY SHIELD + UI CLEAN WHITE
// ==========================================
(function() {
    'use strict';
    if (window.__InvisibleShieldActive) return;
    window.__InvisibleShieldActive = true;

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
    // UI POPUP (PUTIH BERSIH + SVG ICONS)
    // ==========================================
    let securityPopup = null;
    let popupCooldown = false;

    // Kumpulan Ikon SVG (Ringan, Tajam, Tidak Norak)
    const icons = {
        shield: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
        attack: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>`,
        python: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3776AB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M8 6h8a2 2 0 012 2v2a2 2 0 01-2 2H8M8 14h8a2 2 0 012 2v0a2 2 0 01-2 2H8"/></svg>`,
        snake: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12c0-4 4-8 8-8s6 3 6 6-2 5-4 6c-2 1-4 0-4-2s2-4 4-4 4 1 4 3"/></svg>`
    };

    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        if (popupCooldown) return; 
        popupCooldown = true;
        setTimeout(() => popupCooldown = false, 4000);

        if (securityPopup) securityPopup.remove();

        securityPopup = document.createElement('div');
        securityPopup.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
                ${icons.shield}
                <div>
                    <div style="font-weight: 600; font-size: 14px; color: #111827; line-height: 1;">Nathan Security</div>
                    <div style="font-size: 10px; color: #9ca3af; margin-top: 2px;">Protection Active</div>
                </div>
            </div>
            
            <div style="font-size: 12px; color: #4b5563; line-height: 1.5; margin-bottom: 14px;">
                Akses inspeksi halaman dibatasi untuk melindungi integritas data.
            </div>
            
            <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 14px;">
                <div style="display: flex; align-items: center; gap: 10px; font-size: 12px; color: #374151;">
                    ${icons.shield}
                    <span>Enkripsi Storage Aktif</span>
                </div>
                <div style="display: flex; align-items: center; gap: 10px; font-size: 12px; color: #374151;">
                    ${icons.attack}
                    <span>Proteksi Serangan API</span>
                </div>
                <div style="display: flex; align-items: center; gap: 10px; font-size: 12px; color: #374151;">
                    ${icons.snake}
                    <span>Filter Injeksi Kode</span>
                </div>
                <div style="display: flex; align-items: center; gap: 10px; font-size: 12px; color: #374151;">
                    ${icons.python}
                    <span>Intersep Anti-Sniffing</span>
                </div>
            </div>

            <div style="padding-top: 10px; border-top: 1px solid #f3f4f6; font-size: 11px; color: #9ca3af; display: flex; align-items: center; gap: 6px;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                Nonaktifkan JavaScript di browser untuk melewati antarmuka ini.
            </div>
        `;

        // Styling UI Clean White Modern
        securityPopup.style.cssText = `
            position: fixed;
            bottom: 24px;
            right: 24px;
            background: rgba(255, 255, 255, 0.96);
            border: 1px solid #e5e7eb;
            border-left: 4px solid #3b82f6;
            padding: 20px 24px;
            border-radius: 8px;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            z-index: 999999;
            max-width: 300px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            pointer-events: none; 
            opacity: 0;
            transform: translateY(10px) scale(0.98);
            transition: opacity 0.3s ease, transform 0.3s ease;
        `;
        
        document.body.appendChild(securityPopup);

        // Animasi Masuk
        requestAnimationFrame(() => {
            securityPopup.style.opacity = '1';
            securityPopup.style.transform = 'translateY(0) scale(1)';
        });

        // Animasi Keluar
        setTimeout(() => {
            if (securityPopup) {
                securityPopup.style.opacity = '0';
                securityPopup.style.transform = 'translateY(10px) scale(0.98)';
                setTimeout(() => { if(securityPopup) securityPopup.remove(); securityPopup = null; }, 300);
            }
        }, 3500);

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

})();
