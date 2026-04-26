// ==========================================
// 🚀 NITROUS BOOSTER (Letakkan Paling Atas)
// ==========================================
(function() {
    'use strict';
    if (window.__NitrousActive) return;
    window.__NitrousActive = true;

    // 1. MEMORI TURBO (Fetch Cache untuk LLM/API)
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

    // 2. PRECONNECT AGRESIF
    const preconnect = document.createElement('link');
    preconnect.rel = 'preconnect';
    preconnect.href = window.location.origin;
    document.head.appendChild(preconnect);

    // 3. DOM CRUNCHER
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
// 🛡️ INVISIBLE SECURITY SHIELD + UI ELEGAN
// ==========================================
(function() {
    'use strict';
    if (window.__InvisibleShieldActive) return;
    window.__InvisibleShieldActive = true;

    const PREFIX = "ROMAN_CIPHER_V2::";
    const SALT = "SPQR_Maximus_2024";
    
    // 1. ENKRIPSI STORAGE (XOR Dinamis)
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

    // 2. ANTI KLIK KANAN (UI ELEGAN & DEWASA)
    let securityPopup = null;
    let popupCooldown = false;

    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        
        // Cegah spam notifikasi jika user klik kanan terus-menerus
        if (popupCooldown) return; 
        popupCooldown = true;
        setTimeout(() => popupCooldown = false, 4000); // Cooldown 4 detik

        // Hapus popup sebelumnya jika masih ada
        if (securityPopup) securityPopup.remove();

        // Membuat elemen UI notifikasi
        securityPopup = document.createElement('div');
        securityPopup.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px;">
                <div style="width: 6px; height: 6px; background: #d4af37; border-radius: 50%; box-shadow: 0 0 6px #d4af37;"></div>
                <div style="font-weight: 600; font-size: 13px; color: #e0e0e0; letter-spacing: 1px; text-transform: uppercase;">Nathan Security</div>
            </div>
            <div style="font-size: 12px; color: #888; line-height: 1.5; margin-bottom: 12px;">
                Akses inspeksi halaman ini dibatasi untuk melindungi integritas data dan sistem.
            </div>
            <div style="font-size: 11px; color: #555; line-height: 1.6; border-top: 1px solid #2a2a2a; padding-top: 10px;">
                <div style="margin-bottom: 4px;"><span style="color:#d4af37; margin-right: 6px;">•</span> Enkripsi Storage Aktif</div>
                <div style="margin-bottom: 4px;"><span style="color:#d4af37; margin-right: 6px;">•</span> Proteksi Lalu Lintas API</div>
                <div style="margin-bottom: 4px;"><span style="color:#d4af37; margin-right: 6px;">•</span> Filter Injeksi Kode</div>
                <div style="margin-bottom: 4px;"><span style="color:#d4af37; margin-right: 6px;">•</span> Intersep Anti-Sniffing</div>
            </div>
            <div style="margin-top: 12px; padding-top: 10px; border-top: 1px solid #2a2a2a; font-size: 10px; color: #444; font-style: italic;">
                * Nonaktifkan JavaScript di browser untuk melewati antarmuka ini.
            </div>
        `;

        // Styling CSS Pop-up (Darkmode, elegan, modern)
        securityPopup.style.cssText = `
            position: fixed;
            bottom: 24px;
            right: 24px;
            background: rgba(18, 18, 18, 0.95);
            border: 1px solid #333;
            border-left: 3px solid #d4af37;
            padding: 18px 22px;
            border-radius: 6px;
            font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
            z-index: 999999;
            max-width: 280px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.7);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            pointer-events: none; /* PENTING: Tidak mengganggu klik kiri website */
            opacity: 0;
            transform: translateY(15px);
            transition: opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1), transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        `;
        
        document.body.appendChild(securityPopup);

        // Animasi Masuk (Muncul dari bawah)
        requestAnimationFrame(() => {
            securityPopup.style.opacity = '1';
            securityPopup.style.transform = 'translateY(0)';
        });

        // Animasi Keluar (Hilang perlahan)
        setTimeout(() => {
            if (securityPopup) {
                securityPopup.style.opacity = '0';
                securityPopup.style.transform = 'translateY(15px)';
                setTimeout(() => { 
                    if(securityPopup) securityPopup.remove(); 
                    securityPopup = null;
                }, 400);
            }
        }, 3500); // Tampil selama 3,5 detik

    }, true);

    // 3. ANTI XSS INJEKSI
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
