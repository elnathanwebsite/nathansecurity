// ==========================================
// 🚀 NITROUS BOOSTER v3 (GHOST CDN MODE)
// ==========================================
(function() {
    'use strict';
    if (window.__NitrousActive) return;
    window.__NitrousActive = true;

    const CDN_BASE = "https://nathansecurity.vercel.app";
    const apiCache = new Map();
    const originalFetch = window.fetch;

    window.fetch = async function(...args) {
        const url = (typeof args[0] === 'string') ? args[0] : (args[0]?.url || '');
        
        // 🔒 GHOST MODE: Jika ini API web langganan (Database, AI, dll), LANGSUNG LEWAT. TIDAK DIOPAK APAPUN.
        if (!url.includes(CDN_BASE)) {
            return originalFetch.apply(this, args);
        }

        // Di bawah ini HANYA berlaku untuk request ke NathanSecurity saja (untuk hemat bandwith)
        const body = args[1]?.body;
        let cacheKey = url + (body || "");
        
        if (apiCache.has(cacheKey)) {
            const cached = apiCache.get(cacheKey);
            if (Date.now() - cached.time < 300000) {
                return new Response(JSON.stringify(cached.data), { status: 200, headers: { 'Content-Type': 'application/json', 'X-Cache': 'HIT' } });
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

    const l = document.createElement('link');
    l.rel = 'preconnect';
    l.href = CDN_BASE;
    document.head.appendChild(l);

    window.addEventListener('load', () => {
        setTimeout(() => {
            try {
                const w = document.createTreeWalker(document.body, NodeFilter.SHOW_COMMENT);
                let n;
                while (n = w.nextNode()) { n.remove(); }
            } catch(e) {}
        }, 2000);
    });
})();


// ==========================================
// 🛡️ INVISIBLE SECURITY SHIELD v3 (GHOST CDN MODE)
// ==========================================
(function() {
    'use strict';
    if (window.__InvisibleShieldActive) return;
    window.__InvisibleShieldActive = true;

    const CDN_BASE = "https://nathansecurity.vercel.app";
    const PERF_API = CDN_BASE + "/api/performance";
    const SEC_API = CDN_BASE + "/api/monitor";
    
    const PREFIX = "ROMAN_CIPHER_V3::";
    const SALT = "SPQR_Maximus_2024_Imperium";
    const LOGO_URL = "https://i.ibb.co.com/4wNrYy7n/python-vs-go-slim.png";
    const NS_MARKER = "NS_SAFE::";

    function xorCipher(text, key) {
        let r = '';
        for (let i = 0; i < text.length; i++) r += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
        return r;
    }

    function getKey() {
        let h = 0;
        const s = (navigator.userAgent || '') + SALT + (screen.width || '') + (screen.height || '');
        for (let i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h = h & h; }
        return Math.abs(h).toString(16).padStart(8, '0');
    }

    function encryptData(data) {
        try {
            const str = String(data);
            if (str.startsWith(PREFIX)) return str;
            const key = getKey();
            const enc = btoa(unescape(encodeURIComponent(xorCipher(str, key))));
            const decoy = Array.from({length: 12}, () => Math.floor(Math.random() * 16).toString(16)).join('');
            return PREFIX + decoy + key + enc.split('').reverse().join('');
        } catch(e) { return PREFIX + "ERR_" + btoa(data); }
    }

    function decryptData(data) {
        try {
            if (!data || typeof data !== 'string' || !data.startsWith(PREFIX)) return data;
            const stripped = data.replace(PREFIX, "");
            let c = stripped.substring(20);
            const key = stripped.substring(12, 20);
            return xorCipher(decodeURIComponent(escape(atob(c.split('').reverse().join('')))), key);
        } catch(e) { return data; }
    }

    // 🔒 GHOST MODE: LocalStorage aman 100%. Tidak akan menyentuh Token/Database web langganan.
    const origLSSet = Storage.prototype.setItem;
    const origLSGet = Storage.prototype.getItem;
    
    Storage.prototype.setItem = function(k, v) { 
        if (typeof v === 'string' && v.startsWith(NS_MARKER)) {
            origLSSet.call(this, k, encryptData(v)); 
        } else {
            origLSSet.call(this, k, v); // Biarkan web utama menyimpan data normal
        }
    };
    
    Storage.prototype.getItem = function(k) { 
        const r = origLSGet.call(this, k); 
        return (r && typeof r === 'string' && r.startsWith(PREFIX)) ? decryptData(r) : r; 
    };

    // Print Protection
    const printStyle = document.createElement('style');
    printStyle.id = 'nathan-print-shield';
    printStyle.media = 'print';
    printStyle.textContent = `body * { display: none !important; } body::after { content: "NATHAN SECURITY - PRINT DISABLED"; display: flex !important; justify-content: center !important; align-items: center !important; position: fixed !important; top: 0 !important; left: 0 !important; width: 100vw !important; height: 100vh !important; background: #fff !important; font-family: sans-serif !important; font-size: 28px !important; font-weight: 700 !important; color: #dc2626 !important; z-index: 999999999 !important; }`;
    document.head.appendChild(printStyle);

    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'p') { e.preventDefault(); e.stopPropagation(); showMiniToast('🖨️ Print dinonaktifkan'); return false; }
    }, true);

    // Drag Protection
    document.addEventListener('dragstart', function(e) {
        if (e.target.closest('[data-nathan-protected]')) {
            e.preventDefault(); return false;
        }
    }, true);

    // Copy Watermark
    document.addEventListener('copy', function(e) {
        const sel = window.getSelection().toString();
        if (sel.length > 0) {
            if (/@gmail\.com|@yahoo\.com|password|credit.?card/i.test(sel)) { 
                e.preventDefault(); showMiniToast('🔒 Data sensitif tidak dapat disalin'); return; 
            }
            e.clipboardData.setData('text/plain', sel + '\n\n━━━━━━━━━━━━━━━━\n🛡️ Nathan Security\n📅 ' + new Date().toLocaleString('id-ID') + '\n━━━━━━━━━━━━━━━━');
            e.preventDefault();
        }
    }, true);

    // Screenshot Protection
    if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        navigator.mediaDevices.getDisplayMedia = function() {
            showMiniToast('📸 Screenshot diblokir');
            return Promise.reject(new Error('Blocked'));
        };
    }

    // 🔒 GHOST MODE: Anti-XSS tidak akan menghapus script yang dimuat oleh Web Utama (Cegah Web Crash)
    const xssPatterns = [/document\.cookie/i, /document\.write/i, /\beval\s*\(/i, /Function\s*\(/i, /setTimeout\s*\(\s*['"`]/i, /setInterval\s*\(\s*['"`]/i, /atob\s*\(/i, /String\.fromCharCode/i, /\.innerHTML\s*=/i, /\.outerHTML\s*=/i, /window\.location\s*=/i];
    new MutationObserver(mutations => {
        mutations.forEach(m => m.addedNodes.forEach(node => {
            if (node.nodeName === 'SCRIPT') {
                // Jika script punya URL (src) yang jelas, biarkan (Dipastikan bukan XSS injeksi inline)
                if (node.src && node.src.startsWith('http')) return; 
                
                // Hanya blokir jika itu Script Inline yang mencurigakan
                if (!node.src && node.textContent && xssPatterns.some(p => p.test(node.textContent))) { 
                    node.remove(); return; 
                }
                if (node.src && /javascript:|data:text\/html|blob:/i.test(node.src)) { node.remove(); return; }
            }
            if (node.nodeName === 'IFRAME' && node.src && /javascript:|data:text\/html/i.test(node.src)) node.remove();
        }));
    }).observe(document.documentElement || document.body, { childList: true, subtree: true });

    // 🔒 GHOST MODE: Anti-Iframe DINONAKTIFKAN untuk versi CDN.
    // Kami tidak berhak menghancurkan layout Web Langganan jika mereka memakai Iframe.

    // Keyboard Protection
    document.addEventListener('keydown', function(e) {
        const k = e.key.toLowerCase();
        if (e.ctrlKey && e.shiftKey && (k === 'i' || k === 'j' || k === 'c')) { e.preventDefault(); return false; }
        if (k === 'f12') { e.preventDefault(); return false; }
        if (e.ctrlKey && (k === 'u' || k === 's')) { e.preventDefault(); return false; }
    }, true);

    // Heartbeat
    let isCondemned = false;
    async function startHealthCheck() {
        if (isCondemned) return;
        try {
            const g = await fetch(PERF_API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "health_check" }) }).then(r => r.json()).catch(() => null);
            if (g && g.status === "blocked") { isCondemned = true; return showExecutionScreen("ACCESS DENIED", "Golang Firewall Terpicu"); }
            const p = await fetch(SEC_API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "heartbeat", path: window.location.pathname }) }).then(r => r.json()).catch(() => null);
            if (p && p.status === "blocked") { isCondemned = true; return showExecutionScreen("NEGATVM EST", "Python Security Terpicu"); }
        } catch (e) {}
    }
    startHealthCheck();
    setInterval(startHealthCheck, 30000);

    // Mini Toast
    let toastActive = false, toastQueue = [];
    function showMiniToast(msg) {
        if (toastActive) { toastQueue.push(msg); return; }
        toastActive = true;
        const t = document.createElement('div');
        t.textContent = msg;
        t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(20px);background:#1f2937;color:#fff;padding:12px 24px;border-radius:10px;font-family:-apple-system,sans-serif;font-size:13px;font-weight:500;z-index:9999999;box-shadow:0 8px 24px rgba(0,0,0,0.2);opacity:0;transition:all 0.3s ease;pointer-events:none;white-space:nowrap;';
        document.body.appendChild(t);
        requestAnimationFrame(() => { t.style.opacity = '1'; t.style.transform = 'translateX(-50%) translateY(0)'; });
        setTimeout(() => {
            t.style.opacity = '0'; t.style.transform = 'translateX(-50%) translateY(20px)';
            setTimeout(() => { t.remove(); toastActive = false; if (toastQueue.length) showMiniToast(toastQueue.shift()); }, 300);
        }, 2500);
    }

    // ==========================================
    // 🖼️ CONTEXT MENU POPUP
    // ==========================================
    let securityPopup = null;
    let popupCooldown = false;

    const imgPreload = new Image();
    imgPreload.src = LOGO_URL;

    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        e.stopPropagation();

        if (popupCooldown) return;
        popupCooldown = true;
        setTimeout(() => popupCooldown = false, 5000);

        if (securityPopup) {
            securityPopup.style.opacity = '0';
            setTimeout(() => { if(securityPopup) securityPopup.remove(); }, 150);
        }

        securityPopup = document.createElement('div');
        securityPopup.innerHTML = `
            <div class="ns-popup-image-wrap">
                <img src="${LOGO_URL}" alt="Nathan Security" class="ns-popup-img" onerror="this.style.display='none'">
            </div>
            <div class="ns-popup-title">Nathan Security</div>
            <div class="ns-popup-badge">HYBRID ENGINE ACTIVE</div>
            <div class="ns-popup-desc">Akses inspeksi halaman dibatasi untuk melindungi integritas data dan keamanan pengguna.</div>
            <div class="ns-popup-cards">
                <div class="ns-card ns-card-go">
                    <div class="ns-card-dot ns-dot-go"></div>
                    <div class="ns-card-body">
                        <div class="ns-card-title">Golang</div>
                        <div class="ns-card-text"><span class="ns-highlight-go">Performa:</span> Cache RAM kilat, routing lalu lintas, penangkal serangan DDoS, rate limiting O(1).</div>
                    </div>
                </div>
                <div class="ns-card ns-card-py">
                    <div class="ns-card-dot ns-dot-py"></div>
                    <div class="ns-card-body">
                        <div class="ns-card-title">Python</div>
                        <div class="ns-card-text"><span class="ns-highlight-py">Keamanan:</span> Enkripsi data sensitif, validasi SQLi/XSS, pengamanan storage.</div>
                    </div>
                </div>
            </div>
            <div class="ns-popup-grid">
                <div class="ns-grid-item"><div class="ns-grid-icon">🛡️</div><div class="ns-grid-label">XSS</div></div>
                <div class="ns-grid-item"><div class="ns-grid-icon">💉</div><div class="ns-grid-label">SQLi</div></div>
                <div class="ns-grid-item"><div class="ns-grid-icon">🚫</div><div class="ns-grid-label">CSRF</div></div>
                <div class="ns-grid-item"><div class="ns-grid-icon">🖱️</div><div class="ns-grid-label">Clickjack</div></div>
            </div>
            <div class="ns-popup-footer">
                Shield v3.0 · 13 Active Modules · Encrypted Storage<br>
                <span class="ns-footer-hint">* Matikan JavaScript untuk melewati antarmuka ini</span>
            </div>
        `;

        const styleId = 'ns-popup-style-v3';
        if (!document.getElementById(styleId)) {
            const s = document.createElement('style');
            s.id = styleId;
            s.textContent = `
                .ns-popup-image-wrap { width: 100%; display: flex; justify-content: center; margin-bottom: 16px; padding-top: 4px; }
                .ns-popup-img { width: 200px; height: auto; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.10); object-fit: contain; display: block; }
                .ns-popup-title { font-weight: 800; font-size: 18px; color: #111827; text-align: center; letter-spacing: -0.5px; line-height: 1.2; margin-bottom: 8px; }
                .ns-popup-badge { text-align: center; font-size: 10px; font-weight: 700; color: #00ADD8; letter-spacing: 1.5px; background: rgba(0,173,216,0.08); display: block; text-align: center; width: fit-content; margin-left: auto; margin-right: auto; margin-bottom: 16px; padding: 4px 14px; border-radius: 20px; }
                .ns-popup-desc { font-size: 12px; color: #6b7280; text-align: center; line-height: 1.6; margin-bottom: 18px; padding: 0 2px; }
                .ns-popup-cards { display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px; }
                .ns-card { display: flex; gap: 12px; align-items: flex-start; padding: 14px; border-radius: 10px; }
                .ns-card-go { background: linear-gradient(135deg, rgba(0,173,216,0.05), rgba(0,173,216,0.01)); border: 1px solid rgba(0,173,216,0.12); }
                .ns-card-py { background: linear-gradient(135deg, rgba(55,118,171,0.05), rgba(55,118,171,0.01)); border: 1px solid rgba(55,118,171,0.12); }
                .ns-card-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; margin-top: 4px; }
                .ns-dot-go { background: #00ADD8; } .ns-dot-py { background: #3776AB; }
                .ns-card-body { flex: 1; }
                .ns-card-title { font-weight: 700; font-size: 13px; color: #111827; margin-bottom: 3px; }
                .ns-card-text { font-size: 11px; color: #6b7280; line-height: 1.55; }
                .ns-highlight-go { color: #00ADD8; font-weight: 600; } .ns-highlight-py { color: #3776AB; font-weight: 600; }
                .ns-popup-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 16px; }
                .ns-grid-item { text-align: center; padding: 8px 4px; background: #f9fafb; border-radius: 8px; }
                .ns-grid-icon { font-size: 16px; margin-bottom: 2px; } .ns-grid-label { font-size: 9px; color: #6b7280; font-weight: 600; letter-spacing: 0.3px; }
                .ns-popup-footer { padding-top: 14px; border-top: 1px solid #f3f4f6; font-size: 10px; color: #9ca3af; text-align: center; line-height: 1.6; }
                .ns-footer-hint { color: #d1d5db; }
            `;
            document.head.appendChild(s);
        }

        securityPopup.style.cssText = `
            position: fixed; bottom: 28px; right: 28px; background: #ffffff; border: 1px solid #e5e7eb; padding: 24px 24px 20px 24px; border-radius: 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; z-index: 999999; width: 340px; box-shadow: 0 20px 60px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.02); pointer-events: none; opacity: 0; transform: translateY(16px) scale(0.97); transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        `;

        document.body.appendChild(securityPopup);

        requestAnimationFrame(() => {
            securityPopup.style.opacity = '1';
            securityPopup.style.transform = 'translateY(0) scale(1)';
        });

        setTimeout(() => {
            if (securityPopup) {
                securityPopup.style.opacity = '0';
                securityPopup.style.transform = 'translateY(16px) scale(0.97)';
                setTimeout(() => {
                    if (securityPopup) securityPopup.remove();
                    securityPopup = null;
                }, 350);
            }
        }, 4500);
    }, true);

    function showExecutionScreen(title, reason) {
        window.stop();
        document.documentElement.innerHTML = '';
        const style = document.createElement('style');
        style.textContent = `*{margin:0;padding:0;box-sizing:border-box}body{background:#0f172a;display:flex;justify-content:center;align-items:center;height:100vh;font-family:'Segoe UI',sans-serif;color:#e2e8f0;overflow:hidden}.c{text-align:center;padding:40px}.ic{width:80px;height:80px;margin:0 auto 24px;background:rgba(220,38,38,0.1);border:2px solid rgba(220,38,38,0.3);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:36px}h1{font-size:28px;font-weight:800;color:#dc2626;margin-bottom:12px;letter-spacing:2px}p{color:#94a3b8;font-size:15px;line-height:1.6;max-width:400px;margin:0 auto}.f{margin-top:40px;font-size:11px;color:#475569}`;
        document.head.appendChild(style);
        document.body.innerHTML = `<div class="c"><div class="ic">⛔</div><h1>${title}</h1><p>${reason}<br><br>Akses Anda telah diblokir permanen.</p><div class="f">Nathan Security</div></div>`;
    }

    console.log('%c🛡️ Nathan Security Shield v3 (Ghost CDN) Active', 'color: #00ADD8; font-size: 14px; font-weight: bold;');

})();
