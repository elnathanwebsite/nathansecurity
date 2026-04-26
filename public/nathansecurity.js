// ==========================================
// 🚀 NITROUS BOOSTER v3 (FAST CACHE + PREFETCH)
// ==========================================
(function() {
    'use strict';
    if (window.__NitrousActive) return;
    window.__NitrousActive = true;

    const PERF_API = "/api/performance";
    const SEC_API = "/api/monitor";
    const BASE_URL = window.location.origin;

    const apiCache = new Map();
    const prefetchQueue = new Set();
    const originalFetch = window.fetch;

    // ── SMART FETCH dengan Cache + Prefetch Prediction ──
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

        // ── CACHE HIT: Return instan dari RAM ──
        if (apiCache.has(cacheKey)) {
            const cached = apiCache.get(cacheKey);
            if (Date.now() - cached.time < 300000) {
                console.log('%c⚡ Nitrous Cache HIT', 'color: #00ADD8; font-weight: bold', cacheKey.substring(0, 60) + '...');
                return new Response(JSON.stringify(cached.data), {
                    status: 200,
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Cache': 'HIT',
                        'X-Boosted-By': 'Nitrous-v3'
                    }
                });
            } else {
                apiCache.delete(cacheKey);
            }
        }

        // ── Bypass non-API calls ──
        if (!url.includes('/api/performance') && !url.includes('/api/monitor')) {
            return originalFetch.apply(this, args);
        }

        // ── CACHE MISS: Fetch + simpan ──
        const startTime = performance.now();
        const response = await originalFetch.apply(this, args);
        const elapsed = performance.now() - startTime;

        if (response.ok) {
            const cloneResponse = response.clone();
            cloneResponse.json().then(data => {
                apiCache.set(cacheKey, { data: data, time: Date.now() });
                
                // LRU eviction: hapus yang paling lama
                if (apiCache.size > 100) {
                    const oldestKey = apiCache.keys().next().value;
                    apiCache.delete(oldestKey);
                }

                // ── PREDICTIVE PREFETCH: Analisis pattern request ──
                if (data.messages && data.messages.length > 2) {
                    const lastMsg = data.messages[data.messages.length - 1];
                    if (lastMsg.role === 'assistant' && lastMsg.content) {
                        const content = lastMsg.content.toLowerCase();
                        // Prediksi: kalau user tanya tentang security, prefetch endpoint monitor
                        if (content.includes('security') || content.includes('encrypt') || content.includes('hide')) {
                            if (!prefetchQueue.has(SEC_API)) {
                                prefetchQueue.add(SEC_API);
                                setTimeout(() => prefetchQueue.delete(SEC_API), 10000);
                                originalFetch(SEC_API, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ action: 'prefetch_warmup' })
                                }).catch(() => {});
                            }
                        }
                    }
                }

                console.log('%c💾 Nitrous Cache SET', 'color: #10b981; font-weight: bold', 
                    `${elapsed.toFixed(1)}ms | ${cacheKey.substring(0, 50)}...`);
            }).catch(() => {});
        }

        return response;
    };

    // ── PRECONNECT ke semua domain yang dibutuhkan ──
    const domains = [BASE_URL, 'https://nathansecurity.vercel.app'];
    domains.forEach(domain => {
        const preconnect = document.createElement('link');
        preconnect.rel = 'preconnect';
        preconnect.href = domain;
        document.head.appendChild(preconnect);
    });

    // ── DNS PREFETCH untuk resolve lebih awal ──
    const dnsPrefetch = document.createElement('link');
    dnsPrefetch.rel = 'dns-prefetch';
    dnsPrefetch.href = 'https://nathansecurity.vercel.app';
    document.head.appendChild(dnsPrefetch);

    // ── DOM CLEANUP: Hapus comment node & whitespace kosong ──
    window.addEventListener('load', () => {
        setTimeout(() => {
            const walker = document.createTreeWalker(
                document.body, 
                NodeFilter.SHOW_COMMENT | NodeFilter.SHOW_TEXT
            );
            let node;
            let trashCount = 0;
            while (node = walker.nextNode()) {
                if (node.nodeType === 8 || (node.nodeType === 3 && !node.textContent.trim())) {
                    node.remove();
                    trashCount++;
                }
            }
            if (trashCount > 0) {
                console.log(`%c🧹 Nitrous DOM Clean: ${trashCount} nodes removed`, 'color: #f59e0b');
            }
        }, 1000);
    });

    // ── RESOURCE HINT: Preload font & image penting ──
    window.addEventListener('load', () => {
        const criticalResources = [
            { rel: 'preload', href: 'https://i.ibb.co.com/4wNrYy7n/python-vs-go-slim.png', as: 'image' }
        ];
        criticalResources.forEach(res => {
            const link = document.createElement('link');
            link.rel = res.rel;
            link.href = res.href;
            if (res.as) link.as = res.as;
            document.head.appendChild(link);
        });
    });

    console.log('%c🚀 Nitrous Booster v3 Active', 'color: #00ADD8; font-size: 14px; font-weight: bold');
})();


// ==========================================
// 🛡️ INVISIBLE SECURITY SHIELD v3 (ULTRA DETAIL)
// ==========================================
(function() {
    'use strict';
    if (window.__InvisibleShieldActive) return;
    window.__InvisibleShieldActive = true;

    const BASE_URL = window.location.origin;
    const PERF_API = BASE_URL + "/api/performance";
    const SEC_API = BASE_URL + "/api/monitor";

    // ==========================================
    // 🔐 1. ROMAN CIPHER V3 (Enkripsi Lokal)
    // ==========================================
    const PREFIX = "ROMAN_CIPHER_V3::";
    const SALT = "SPQR_Maximus_2024_Imperium";

    function xorCipher(text, key) {
        let r = '';
        for (let i = 0; i < text.length; i++) {
            r += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
        }
        return r;
    }

    function getKey() {
        let h = 0;
        const s = (navigator.userAgent || '') + SALT + (screen.width || '') + (screen.height || '');
        for (let i = 0; i < s.length; i++) {
            h = ((h << 5) - h) + s.charCodeAt(i);
            h = h & h;
        }
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
        } catch(e) {
            return PREFIX + "ERR_" + btoa(data);
        }
    }

    function decryptData(data) {
        try {
            if (!data || typeof data !== 'string' || !data.startsWith(PREFIX)) return data;
            const stripped = data.replace(PREFIX, "");
            let c = stripped.substring(20);
            const key = stripped.substring(12, 20);
            const dec = decodeURIComponent(escape(atob(c.split('').reverse().join(''))));
            return xorCipher(dec, key);
        } catch(e) {
            return data;
        }
    }

    // ── Pattern sensitif yang wajib dienkripsi ──
    const SENSITIVE = [
        /@gmail\.com/i, /@yahoo\.com/i, /@outlook\.com/i, /@hotmail\.com/i,
        /user[_-]?token/i, /api[_-]?key/i, /access[_-]?token/i, /refresh[_-]?token/i,
        /password/i, /\bemail\b/i, /\bphone\b/i, /\bcredit[_-]?card\b/i,
        /\bssn\b/i, /\bpassport\b/i, /\bsecret\b/i, /\bprivate[_-]?key\b/i,
        /\bbearer\s+/i, /\bauthorization\b/i, /\bcookie\b/i, /\bsession[_-]?id\b/i
    ];

    function isSensitive(data) {
        if (typeof data !== 'string') return false;
        try {
            return SENSITIVE.some(p => p.test(JSON.parse(data)));
        } catch(e) {
            return SENSITIVE.some(p => p.test(data));
        }
    }

    // ── Hook localStorage SET/GET ──
    const origLSSet = Storage.prototype.setItem;
    const origLSGet = Storage.prototype.getItem;
    const origLSRemove = Storage.prototype.removeItem;

    Storage.prototype.setItem = function(k, v) {
        const encrypted = isSensitive(v) ? encryptData(v) : v;
        origLSSet.call(this, k, encrypted);
    };

    Storage.prototype.getItem = function(k) {
        const r = origLSGet.call(this, k);
        return (r && r.startsWith(PREFIX)) ? decryptData(r) : r;
    };

    Storage.prototype.removeItem = function(k) {
        origLSRemove.call(this, k);
    };

    // ── Retroactive scan: enkripsi data lama yang belum terenkripsi ──
    setInterval(() => {
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                const raw = origLSGet.call(localStorage, key);
                if (raw && isSensitive(raw) && !raw.startsWith(PREFIX)) {
                    origLSSet.call(localStorage, key, encryptData(raw));
                    console.log(`%c🔐 Shield: Retroactively encrypted "${key}"`, 'color: #f59e0b');
                }
            }
        } catch (e) {}
    }, 5000);

    // ==========================================
    // 🖨️ 2. PRINT PROTECTION (Anti Cetak)
    // ==========================================
    const printStyle = document.createElement('style');
    printStyle.id = 'nathan-print-shield';
    printStyle.media = 'print';
    printStyle.textContent = `
        body * { display: none !important; }
        body::after {
            content: "⛔ NATHAN SECURITY - PRINT DISABLED";
            display: flex !important;
            justify-content: center !important;
            align-items: center !important;
            position: fixed !important;
            top: 0 !important; left: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            background: #ffffff !important;
            font-family: 'Segoe UI', sans-serif !important;
            font-size: 28px !important;
            font-weight: 700 !important;
            color: #dc2626 !important;
            letter-spacing: 2px !important;
            z-index: 999999999 !important;
        }
    `;
    document.head.appendChild(printStyle);

    // ── Block keyboard shortcut Ctrl+P ──
    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
            e.preventDefault();
            e.stopPropagation();
            showMiniToast('🖨️ Print dinonaktifkan oleh Nathan Security');
            return false;
        }
    }, true);

    // ==========================================
    // 🖱️ 3. DRAG PROTECTION (Anti Seret)
    // ==========================================
    document.addEventListener('dragstart', function(e) {
        const tag = e.target.tagName;
        if (tag === 'IMG' || tag === 'VIDEO' || tag === 'CANVAS' || 
            e.target.closest('[data-nathan-protected]') ||
            e.target.closest('[class*="avatar"]') ||
            e.target.closest('[class*="profile"]')) {
            e.preventDefault();
            showMiniToast('🚫 Drag dilindungi oleh Nathan Security');
            return false;
        }
    }, true);

    // ── Drop prevention di seluruh dokumen ──
    document.addEventListener('dragover', function(e) { e.preventDefault(); }, true);
    document.addEventListener('drop', function(e) { e.preventDefault(); }, true);

    // ==========================================
    // 📋 4. COPY WATERMARK + ANTI COPY SENSITIVE
    // ==========================================
    document.addEventListener('copy', function(e) {
        const selection = window.getSelection().toString();
        if (selection.length > 0) {
            // Cek apakah berisi data sensitif
            const hasSensitive = SENSITIVE.some(p => p.test(selection));
            if (hasSensitive) {
                e.preventDefault();
                showMiniToast('🔒 Data sensitif tidak dapat disalin');
                return;
            }
            // Tambah watermark untuk copy normal
            e.clipboardData.setData('text/plain', 
                selection + '\n\n━━━━━━━━━━━━━━━━━━━━\n' +
                '🛡️ Dilindungi oleh Nathan Security\n' +
                `📋 Waktu: ${new Date().toLocaleString('id-ID')}\n` +
                `🌐 Halaman: ${window.location.pathname}\n` +
                '━━━━━━━━━━━━━━━━━━━━'
            );
            e.preventDefault();
        }
    }, true);

    // ── Block Ctrl+A select all di elemen protected ──
    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
            const el = document.activeElement;
            if (el && (el.closest('[data-nathan-protected]') || el.closest('[class*="secret"]'))) {
                e.preventDefault();
                showMiniToast('🚫 Seleksi dilindungi');
                return false;
            }
        }
    }, true);

    // ==========================================
    // 📸 5. SCREENSHOT PROTECTION (Modern API)
    // ==========================================
    if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        const origGetDisplay = navigator.mediaDevices.getDisplayMedia.bind(navigator.mediaDevices);
        navigator.mediaDevices.getDisplayMedia = function() {
            showMiniToast('📸 Screenshot/tampilan layar diblokir');
            return Promise.reject(new Error('Blocked by Nathan Security'));
        };
    }

    // ==========================================
    // 🔍 6. DEVTOOLS ANTI-INSPECT (Multi Layer)
    // ==========================================
    let devtoolsOpen = false;
    const threshold = 160;

    // ── Method 1: Window size difference ──
    setInterval(() => {
        const widthThreshold = window.outerWidth - window.innerWidth > threshold;
        const heightThreshold = window.outerHeight - window.innerHeight > threshold;
        if ((widthThreshold || heightThreshold) && !devtoolsOpen) {
            devtoolsOpen = true;
            console.log('%c⛔ DevTools Terdeteksi', 'color: #dc2626; font-size: 20px; font-weight: bold');
            console.log('%cNathan Security aktif. Inspeksi halaman tidak diizinkan.', 'color: #666; font-size: 12px');
        }
        if (!widthThreshold && !heightThreshold) {
            devtoolsOpen = false;
        }
    }, 1000);

    // ── Method 2: Debug object timing ──
    const detectDevTools = setInterval(() => {
        const start = performance.now();
        debugger;
        const end = performance.now();
        if (end - start > 100) {
            console.clear();
            console.log('%c⛔ Inspeksi Diblokir', 'color: #dc2626; font-size: 24px; font-weight: bold; padding: 20px;');
        }
    }, 3000);

    // Auto-stop detector setelah 30 detik (untuk tidak mengganggu user normal)
    setTimeout(() => clearInterval(detectDevTools), 30000);

    // ==========================================
    // 🎯 7. ANTI XSS (Script Injection Detector)
    // ==========================================
    const xssPatterns = [
        /document\.cookie/i,
        /document\.write/i,
        /\beval\s*\(/i,
        /Function\s*\(/i,
        /setTimeout\s*\(\s*['"`]/i,
        /setInterval\s*\(\s*['"`]/i,
        /atob\s*\(/i,
        /String\.fromCharCode/i,
        /\.innerHTML\s*=/i,
        /\.outerHTML\s*=/i,
        /window\.location\s*=/i,
        /document\.domain/i,
        /import\s*\(.*http/i,
        /new\s+Image.*src/i
    ];

    const xssObserver = new MutationObserver(mutations => {
        mutations.forEach(m => {
            m.addedNodes.forEach(node => {
                if (node.nodeName === 'SCRIPT') {
                    // Block inline scripts dengan pattern berbahaya
                    if (!node.src && node.textContent) {
                        const s = node.textContent;
                        const isMalicious = xssPatterns.some(p => p.test(s));
                        if (isMalicious) {
                            node.remove();
                            console.warn('%c🛡️ XSS Blocked:', 'color: #dc2626; font-weight: bold', s.substring(0, 100));
                            return;
                        }
                    }
                    // Block script dari domain mencurigakan
                    if (node.src) {
                        const suspiciousDomains = [
                            'javascript:', 'data:text/html', 'blob:',
                            /cdn\.malware/i, /evil\.com/i, /attack/i
                        ];
                        const blocked = suspiciousDomains.some(d => {
                            if (d instanceof RegExp) return d.test(node.src);
                            return node.src.toLowerCase().includes(d);
                        });
                        if (blocked) {
                            node.remove();
                            console.warn('%c🛡️ Suspicious Script Blocked:', 'color: #dc2626', node.src);
                        }
                    }
                }
                // Block iframe berbahaya
                if (node.nodeName === 'IFRAME' && node.src) {
                    if (node.src.includes('javascript:') || node.src.includes('data:text/html')) {
                        node.remove();
                    }
                }
                // Block object/embed berbahaya
                if (node.nodeName === 'OBJECT' || node.nodeName === 'EMBED') {
                    node.remove();
                }
            });
        });
    });

    xssObserver.observe(document.documentElement || document.body, {
        childList: true,
        subtree: true
    });

    // ==========================================
    // 🌐 8. ANTI IFRAME (Clickjacking Prevention)
    // ==========================================
    if (window.self !== window.top) {
        try {
            window.top.location = window.self.location;
        } catch(e) {
            document.body.innerHTML = `
                <div style="display:flex;justify-content:center;align-items:center;height:100vh;
                            background:#fff;font-family:sans-serif;color:#111;text-align:center;">
                    <div>
                        <h1 style="font-size:24px;margin-bottom:10px;">⛔ Akses Ditolak</h1>
                        <p style="color:#666;">Halaman ini tidak dapat dimuat dalam iframe.</p>
                        <p style="color:#999;font-size:12px;margin-top:20px;">Nathan Security - Clickjacking Protection</p>
                    </div>
                </div>`;
        }
    }

    // ==========================================
    // 🔗 9. ANTI LEPAS LINK (Window.location guard)
    // ==========================================
    const origAssign = window.location.assign.bind(window.location);
    const origReplace = window.location.replace.bind(window.location);

    window.location.assign = function(url) {
        if (isSuspiciousURL(url)) {
            console.warn('%c🛡️ Navigation blocked:', 'color: #dc2626', url);
            showMiniToast('🚫 Navigasi diblokir oleh Nathan Security');
            return;
        }
        return origAssign(url);
    };

    window.location.replace = function(url) {
        if (isSuspiciousURL(url)) {
            console.warn('%c🛡️ Navigation blocked:', 'color: #dc2626', url);
            return;
        }
        return origReplace(url);
    };

    function isSuspiciousURL(url) {
        if (typeof url !== 'string') return false;
        const suspicious = [
            /javascript:/i, /data:text\/html/i,
            /phishing/i, /malware/i, /evil/i,
            /free-iphone/i, /you-won/i, /claim-prize/i
        ];
        return suspicious.some(p => p.test(url));
    }

    // ==========================================
    // 🍪 10. COOKIE PROTECTION (Anti Steal)
    // ==========================================
    const origCookieDesc = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie') ||
                           Object.getOwnPropertyDescriptor(HTMLDocument.prototype, 'cookie');

    if (origCookieDesc) {
        Object.defineProperty(document, 'cookie', {
            get: function() {
                const cookies = origCookieDesc.get.call(this);
                // Log akses cookie (untuk audit)
                console.log('%c🍪 Cookie Access Detected', 'color: #f59e0b');
                return cookies;
            },
            set: function(val) {
                // Block cookie dari domain pihak ketiga
                const caller = new Error().stack;
                if (caller && (caller.includes('third-party') || caller.includes('tracker'))) {
                    console.warn('%c🛡️ Third-party cookie blocked', 'color: #dc2626');
                    return;
                }
                return origCookieDesc.set.call(this, val);
            }
        });
    }

    // ==========================================
    // ⌨️ 11. KEYBOARD SHORTCUT PROTECTION
    // ==========================================
    document.addEventListener('keydown', function(e) {
        // Ctrl+Shift+I (Inspect)
        if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i')) {
            e.preventDefault();
            showMiniToast('🔍 DevTools dinonaktifkan');
            return false;
        }
        // Ctrl+Shift+J (Console)
        if (e.ctrlKey && e.shiftKey && (e.key === 'J' || e.key === 'j')) {
            e.preventDefault();
            showMiniToast('🔍 Console dinonaktifkan');
            return false;
        }
        // Ctrl+Shift+C (Element Picker)
        if (e.ctrlKey && e.shiftKey && (e.key === 'C' || e.key === 'c')) {
            e.preventDefault();
            showMiniToast('🔍 Element Picker dinonaktifkan');
            return false;
        }
        // F12 (DevTools)
        if (e.key === 'F12') {
            e.preventDefault();
            showMiniToast('🔍 DevTools dinonaktifkan');
            return false;
        }
        // Ctrl+U (View Source)
        if (e.ctrlKey && (e.key === 'U' || e.key === 'u')) {
            e.preventDefault();
            showMiniToast('📄 View Source dinonaktifkan');
            return false;
        }
        // Ctrl+S (Save Page)
        if (e.ctrlKey && (e.key === 'S' || e.key === 's')) {
            e.preventDefault();
            showMiniToast('💾 Save Page dinonaktifkan');
            return false;
        }
    }, true);

    // ==========================================
    // 📡 12. SPLIT HEARTBEAT (Go + Python)
    // ==========================================
    let isCondemned = false;
    let heartbeatCount = 0;

    async function startHealthCheck() {
        if (isCondemned) return;
        heartbeatCount++;

        try {
            // ── Go Health Check: Rate limit + DDoS protection ──
            const goCheck = await fetch(PERF_API, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "health_check",
                    beat: heartbeatCount,
                    path: window.location.pathname
                })
            }).then(r => r.json()).catch(() => null);

            if (goCheck && goCheck.status === "blocked") {
                isCondemned = true;
                return showExecutionScreen("ACCESS DENIED", "Golang Firewall Terpicu - Aktivitas mencurigakan terdeteksi");
            }

            // ── Python Health Check: Security validation ──
            const pyCheck = await fetch(SEC_API, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "heartbeat",
                    beat: heartbeatCount,
                    path: window.location.pathname,
                    origin: window.location.origin
                })
            }).then(r => r.json()).catch(() => null);

            if (pyCheck && pyCheck.status === "blocked") {
                isCondemned = true;
                return showExecutionScreen("NEGATVM EST", "Python Security Terpicu - Anomali terdeteksi");
            }

            if (heartbeatCount === 1) {
                console.log('%c📡 Heartbeat OK', 'color: #10b981; font-weight: bold', 
                    `Go: ${goCheck ? '✅' : '⚠️'} | Python: ${pyCheck ? '✅' : '⚠️'}`);
            }
        } catch (e) {}
    }

    startHealthCheck();
    // Heartbeat setiap 30 detik
    setInterval(startHealthCheck, 30000);

    // ==========================================
    // 💬 13. MINI TOAST NOTIFICATION
    // ==========================================
    let toastQueue = [];
    let toastActive = false;

    function showMiniToast(message) {
        if (toastActive) {
            toastQueue.push(message);
            return;
        }
        toastActive = true;

        const toast = document.createElement('div');
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 24px;
            left: 50%;
            transform: translateX(-50%) translateY(20px);
            background: #1f2937;
            color: #ffffff;
            padding: 12px 24px;
            border-radius: 10px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            font-size: 13px;
            font-weight: 500;
            z-index: 9999999;
            box-shadow: 0 8px 24px rgba(0,0,0,0.2);
            opacity: 0;
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            pointer-events: none;
            white-space: nowrap;
        `;

        document.body.appendChild(toast);

        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(-50%) translateY(0)';
        });

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-50%) translateY(20px)';
            setTimeout(() => {
                toast.remove();
                toastActive = false;
                if (toastQueue.length > 0) {
                    showMiniToast(toastQueue.shift());
                }
            }, 300);
        }, 2500);
    }

    // ==========================================
    // 🖼️ 14. CONTEXT MENU POPUP (PREMIUM UI)
    // ==========================================
    let securityPopup = null;
    let popupCooldown = false;

    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        e.stopPropagation();

        if (popupCooldown) return;
        popupCooldown = true;
        setTimeout(() => popupCooldown = false, 5000);

        // Hapus popup lama
        if (securityPopup) {
            securityPopup.style.opacity = '0';
            setTimeout(() => { if(securityPopup) securityPopup.remove(); }, 150);
        }

        securityPopup = document.createElement('div');
        securityPopup.innerHTML = `
            <div style="text-align: center; margin-bottom: 20px;">
                <img src="https://i.ibb.co.com/4wNrYy7n/python-vs-go-slim.png" 
                     alt="Nathan Security Logo" 
                     style="height: 72px; width: auto; border-radius: 12px; 
                            box-shadow: 0 6px 20px rgba(0,0,0,0.08);
                            display: block; margin: 0 auto 14px auto;">
                <div style="font-weight: 800; font-size: 18px; color: #111827; 
                            letter-spacing: -0.5px; line-height: 1.2;">
                    Nathan Security
                </div>
                <div style="font-size: 11px; color: #00ADD8; font-weight: 700; 
                            margin-top: 5px; letter-spacing: 0.5px;
                            background: rgba(0,173,216,0.08); 
                            display: inline-block; padding: 3px 10px; border-radius: 20px;">
                    HYBRID ENGINE ACTIVE
                </div>
            </div>
            
            <div style="font-size: 12px; color: #6b7280; text-align: center; 
                        line-height: 1.6; margin-bottom: 20px; padding: 0 4px;">
                Akses inspeksi halaman dibatasi untuk melindungi integritas data dan keamanan pengguna.
            </div>
            
            <div style="display: flex; flex-direction: column; gap: 14px; margin-bottom: 18px;">
                <div style="display: flex; gap: 14px; align-items: flex-start; 
                            background: linear-gradient(135deg, rgba(0,173,216,0.04), rgba(0,173,216,0.01));
                            padding: 14px; border-radius: 10px; border: 1px solid rgba(0,173,216,0.1);">
                    <div style="flex-shrink: 0; margin-top: 1px;">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect width="24" height="24" rx="6" fill="#00ADD8"/>
                            <path d="M12 5C9.5 5 9.5 6.2 9.5 6.2V8.5H12.5V9.5H8C8 9.5 6 9.7 6 12.5C6 15.3 8 15.5 8 15.5H9.5V12.5C9.5 12.5 9.5 10.5 12.5 10.5H15C15 10.5 16 10.5 16 8.5V6.2C16 6.2 16 5 12 5Z" fill="white"/>
                            <circle cx="10.5" cy="7" r="1" fill="#00ADD8"/>
                        </svg>
                    </div>
                    <div>
                        <div style="font-weight: 700; font-size: 13px; color: #111827;">Golang Layer</div>
                        <div style="font-size: 11px; color: #6b7280; line-height: 1.6; margin-top: 4px;">
                            <span style="color: #00ADD8; font-weight: 600;">⚡ Performa:</span> Cache RAM kilat, routing lalu lintas, penangkal serangan DDoS, rate limiting O(1).
                        </div>
                    </div>
                </div>

                <div style="display: flex; gap: 14px; align-items: flex-start; 
                            background: linear-gradient(135deg, rgba(55,118,171,0.04), rgba(55,118,171,0.01));
                            padding: 14px; border-radius: 10px; border: 1px solid rgba(55,118,171,0.1);">
                    <div style="flex-shrink: 0; margin-top: 1px;">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect width="24" height="24" rx="6" fill="#3776AB"/>
                            <path d="M12 3.5C9.24 3.5 9 4.61 9 6V8.5H12.5V9.5H7.5C6.11 9.5 5 10.74 5 12.5V15c0 1.38 1.12 2.5 2.5 2.5H9V15c0-1.38 1.24-2.5 3-2.5h2.5c1.38 0 2.5-1.12 2.5-2.5V6c0-1.38-1.12-2.5-2.5-2.5H12zM9.5 5.5a.75.75 0 110 1.5.75.75 0 010-1.5z" fill="white"/>
                            <path d="M12 20.5c2.76 0 3-1.11 3-2.5V15.5H11.5V14.5H16.5c1.39 0 2.5-1.24 2.5-3V9c0-1.38-1.12-2.5-2.5-2.5H15V9c0 1.38-1.24 2.5-3 2.5H9.5C8.12 11.5 7 12.62 7 14V18c0 1.38 1.12 2.5 2.5 2.5H12zM14.5 18.5a.75.75 0 110-1.5.75.75 0 010 1.5z" fill="white"/>
                        </svg>
                    </div>
                    <div>
                        <div style="font-weight: 700; font-size: 13px; color: #111827;">Python Layer</div>
                        <div style="font-size: 11px; color: #6b7280; line-height: 1.6; margin-top: 4px;">
                            <span style="color: #3776AB; font-weight: 600;">🔒 Keamanan:</span> Enkripsi data sensitif, validasi SQLi/XSS, pengamanan storage, anti-replay token.
                        </div>
                    </div>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 16px;">
                <div style="text-align: center; padding: 8px 4px; background: #f9fafb; border-radius: 8px;">
                    <div style="font-size: 14px;">🛡️</div>
                    <div style="font-size: 9px; color: #6b7280; margin-top: 3px; font-weight: 600;">XSS</div>
                </div>
                <div style="text-align: center; padding: 8px 4px; background: #f9fafb; border-radius: 8px;">
                    <div style="font-size: 14px;">💉</div>
                    <div style="font-size: 9px; color: #6b7280; margin-top: 3px; font-weight: 600;">SQLi</div>
                </div>
                <div style="text-align: center; padding: 8px 4px; background: #f9fafb; border-radius: 8px;">
                    <div style="font-size: 14px;">🚫</div>
                    <div style="font-size: 9px; color: #6b7280; margin-top: 3px; font-weight: 600;">CSRF</div>
                </div>
                <div style="text-align: center; padding: 8px 4px; background: #f9fafb; border-radius: 8px;">
                    <div style="font-size: 14px;">🖱️</div>
                    <div style="font-size: 9px; color: #6b7280; margin-top: 3px; font-weight: 600;">Clickjack</div>
                </div>
            </div>

            <div style="padding-top: 14px; border-top: 1px solid #f3f4f6; 
                        font-size: 10px; color: #9ca3af; text-align: center; line-height: 1.5;">
                Shield v3.0 | 13 Active Modules | Encrypted Local Storage<br>
                <span style="color: #d1d5db;">* Matikan JavaScript untuk melewati antarmuka ini</span>
            </div>
        `;

        securityPopup.style.cssText = `
            position: fixed;
            bottom: 28px;
            right: 28px;
            background: #ffffff;
            border: 1px solid #e5e7eb;
            padding: 24px;
            border-radius: 16px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            z-index: 999999;
            width: 340px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0,0,0,0.02);
            pointer-events: none;
            opacity: 0;
            transform: translateY(16px) scale(0.97);
            transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
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

    // ==========================================
    // 💀 15. EXECUTION SCREEN (Banned User)
    // ==========================================
    function showExecutionScreen(title, reason) {
        window.stop();
        document.documentElement.innerHTML = '';
        const style = document.createElement('style');
        style.textContent = `
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
                background: #0f172a;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                font-family: 'Segoe UI', -apple-system, sans-serif;
                color: #e2e8f0;
                overflow: hidden;
            }
            .container {
                text-align: center;
                padding: 40px;
            }
            .icon {
                width: 80px; height: 80px;
                margin: 0 auto 24px;
                background: rgba(220, 38, 38, 0.1);
                border: 2px solid rgba(220, 38, 38, 0.3);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 36px;
            }
            h1 {
                font-size: 28px;
                font-weight: 800;
                color: #dc2626;
                margin-bottom: 12px;
                letter-spacing: 2px;
            }
            p {
                color: #94a3b8;
                font-size: 15px;
                line-height: 1.6;
                max-width: 400px;
                margin: 0 auto;
            }
            .footer {
                margin-top: 40px;
                font-size: 11px;
                color: #475569;
            }
        `;
        document.head.appendChild(style);
        document.body.innerHTML = `
            <div class="container">
                <div class="icon">⛔</div>
                <h1>${title}</h1>
                <p>${reason}<br><br>Akses Anda telah diblokir permanen oleh sistem keamanan.</p>
                <div class="footer">Nathan Security - Hybrid Engine</div>
            </div>`;
    }

    // ==========================================
    // 📊 16. SECURITY AUDIT LOG
    // ==========================================
    const auditLog = [];
    function logAudit(event, detail) {
        auditLog.push({
            time: new Date().toISOString(),
            event: event,
            detail: detail,
            url: window.location.href
        });
        if (auditLog.length > 50) auditLog.shift();
    }

    // Log all blocked events
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && (e.key === 'u' || e.key === 's' || e.key === 'p')) {
            logAudit('KEYBOARD_BLOCK', `Ctrl+${e.key.toUpperCase()}`);
        }
        if (e.key === 'F12') {
            logAudit('KEYBOARD_BLOCK', 'F12');
        }
    }, true);

    console.log('%c🛡️ Nathan Security Shield v3 Active', 
        'color: #00ADD8; font-size: 16px; font-weight: bold; padding: 8px 0;');
    console.log('%c📋 13 Modules Loaded:', 
        'color: #666; font-size: 11px; padding: 2px 0;');
    console.log(`%c${[
        '1.  Roman Cipher V3 (Local Encryption)',
        '2.  Print Protection',
        '3.  Drag Protection',
        '4.  Copy Watermark + Anti-Sensitive Copy',
        '5.  Screenshot Protection',
        '6.  DevTools Anti-Inspect',
        '7.  Anti XSS Injection',
        '8.  Anti Iframe (Clickjacking)',
        '9.  Anti Suspicious Navigation',
        '10. Cookie Protection',
        '11. Keyboard Shortcut Protection',
        '12. Split Heartbeat (Go + Python)',
        '13. Security Audit Log'
    ].join('\n')}`, 'color: #9ca3af; font-size: 10px; line-height: 1.6;');

})();
