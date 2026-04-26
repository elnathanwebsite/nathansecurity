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
                // Khusus API LLM, cache berdasarkan prompt/input terakhir saja supaya akurat
                if (parsedBody.messages) {
                    cacheKey = url + JSON.stringify(parsedBody.messages.slice(-1));
                } else if (parsedBody.prompt) {
                    cacheKey = url + parsedBody.prompt;
                } else {
                    cacheKey = url + body;
                }
            } catch(e) {
                cacheKey = url + body;
            }
        }

        // Kalau sudah pernah ditanyakan dalam 5 menit terakhir, kembalikan dari memori!
        if (apiCache.has(cacheKey)) {
            const cached = apiCache.get(cacheKey);
            if (Date.now() - cached.time < 300000) { 
                return new Response(JSON.stringify(cached.data), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }

        // Kalau belum ada, lakukan fetch asli
        const response = await originalFetch.apply(this, args);
        
        // Simpan hasilnya ke memori untuk request selanjutnya
        if (response.ok) {
            const cloneResponse = response.clone();
            cloneResponse.json().then(data => {
                apiCache.set(cacheKey, { data: data, time: Date.now() });
                if (apiCache.size > 50) { // Batasi max 50 cache biar RAM HP tidak bocor
                    const oldestKey = apiCache.keys().next().value;
                    apiCache.delete(oldestKey);
                }
            }).catch(() => {});
        }
        return response;
    };

    // 2. PRECONNECT AGRESIF (Mempercepat sambungan pertama ke API)
    const apiHost = window.location.origin; // Otomatis ambil domain website kamu
    const preconnect = document.createElement('link');
    preconnect.rel = 'preconnect';
    preconnect.href = apiHost;
    document.head.appendChild(preconnect);

    // 3. DOM CRUNCHER (Menghapus sampah HTML tersembunyi saat web selesai loading)
    window.addEventListener('load', () => {
        setTimeout(() => {
            const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_COMMENT | NodeFilter.SHOW_TEXT);
            let node;
            let trashCount = 0;
            while (node = walker.nextNode()) {
                // Hapus komentar HTML <!-- --> dan spasi kosong berlebih
                if (node.nodeType === 8 || (node.nodeType === 3 && !node.textContent.trim())) {
                    node.remove();
                    trashCount++;
                }
            }
            if(trashCount > 0) console.log(`%c🧹 DOM CRUNCHER: Membuang ${trashCount} sampah tersembunyi.`, "color: green;");
        }, 1000);
    });
})();


// ==========================================
// 🛡️ INVISIBLE SECURITY SHIELD
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

    // Daftar kata yang dianggap sensitif
    const SENSITIVE = [/@gmail\.com/i, /@yahoo\.com/i, /user[_-]?token/i, /api[_-]?key/i, /access[_-]?token/i, /password/i, /\bemail\b/i, /\bphone\b/i];
    
    function isSensitive(data) {
        if (typeof data !== 'string') return false;
        try { return SENSITIVE.some(p => p.test(JSON.parse(data))); } catch(e) { return SENSITIVE.some(p => p.test(data)); }
    }

    // Hook LocalStorage & SessionStorage
    const origLSSet = Storage.prototype.setItem;
    const origLSGet = Storage.prototype.getItem;
    Storage.prototype.setItem = function(k, v) { origLSSet.call(this, k, isSensitive(v) ? encryptData(v) : v); };
    Storage.prototype.getItem = function(k) { const r = origLSGet.call(this, k); return (r && r.startsWith(PREFIX)) ? decryptData(r) : r; };

    // Pindai data lama yang belum terenkripsi tiap 5 detik
    setInterval(() => {
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                const raw = origLSGet.call(localStorage, key);
                if (raw && isSensitive(raw) && !raw.startsWith(PREFIX)) origLSSet.call(localStorage, key, encryptData(raw));
            }
        } catch (e) {}
    }, 5000);

    // 2. ANTI KLIK KANAN (Super Aman, 1 baris)
    document.addEventListener('contextmenu', e => e.preventDefault(), true);

    // 3. ANTI XSS INJEKSI (Menghapus script jahat yang disuntikkan)
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
