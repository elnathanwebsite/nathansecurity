// ==========================================
// 🚀 NITROUS WEBSITE BOOSTER (Letakkan Paling Atas)
// ==========================================
(function() {
    'use strict';
    if (window.__NitrousActive) return;
    window.__NitrousActive = true;

    // 1. MEMORI TURBO (Fetch Cache)
    // Kalau user nanya ke API/LLM hal yang sama, langsung kasih jawaban dari memori (0 milidetik!)
    const apiCache = new Map();
    const originalFetch = window.fetch;
    
    window.fetch = async function(...args) {
        const url = (typeof args[0] === 'string') ? args[0] : args[0].url;
        const body = args[1]?.body;
        
        // Buat ID unik dari URL + Body (Supaya cache akurat)
        let cacheKey = url;
        if (body) {
            try {
                const parsedBody = JSON.parse(body);
                // Khusus LLM, cache berdasarkan prompt terakhir
                cacheKey = url + JSON.stringify(parsedBody.messages?.slice(-1) || parsedBody); 
            } catch(e) {
                cacheKey = url + body;
            }
        }

        // Cek apakah sudah pernah ditanyakan dalam 5 menit terakhir?
        if (apiCache.has(cacheKey)) {
            const cached = apiCache.get(cacheKey);
            if (Date.now() - cached.time < 300000) { // 5 menit
                console.log("%c🚀 NITROUS: Data disuntik dari Memori (0ms)!", "color: cyan; font-weight: bold;");
                return new Response(JSON.stringify(cached.data), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }

        // Kalau belum ada di cache, lakukan fetch asli
        const response = await originalFetch.apply(this, args);
        
        // Intercept dan simpan hasilnya ke memori (Hanya yang berhasil)
        if (response.ok) {
            const cloneResponse = response.clone();
            cloneResponse.json().then(data => {
                apiCache.set(cacheKey, { data: data, time: Date.now() });
                // Bersihkan memori jika sudah terlalu penuh (max 50 item)
                if (apiCache.size > 50) {
                    const oldestKey = apiCache.keys().next().value;
                    apiCache.delete(oldestKey);
                }
            }).catch(() => {});
        }

        return response;
    };

    // 2. BLOKIR LALU LINTAS SAMPAH (Resource Blocker)
    // Memblokir tracker, iklan, dan analytics yang bikin web berat
    const blockedDomains = ["doubleclick.net", "googlesyndication.com", "facebook.net/plugins", "analytics.google.com"];
    const originalAddEventListener = EventTarget.prototype.addEventListener;
    
    // 3. PRECONNECT AGRESIF
    // Memaksa browser langsung "nyambung" ke server API sebelum user klik
    const apiHost = "https://nathansecurity.vercel.app"; // Ganti dengan host API LLM kamu jika beda
    if (!document.querySelector(`link[rel='preconnect'][href='${apiHost}']`)) {
        const preconnect = document.createElement('link');
        preconnect.rel = 'preconnect';
        preconnect.href = apiHost;
        preconnect.crossOrigin = 'anonymous';
        document.head.appendChild(preconnect);
    }

    // 4. DOM CRUNCHER (Menghapus node kosong yang bikin rendering lambat)
    window.addEventListener('load', () => {
        setTimeout(() => {
            const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_COMMENT | NodeFilter.SHOW_TEXT);
            let node;
            let trashCount = 0;
            while (node = walker.nextNode()) {
                if (node.nodeType === 8 || (node.nodeType === 3 && !node.textContent.trim())) {
                    node.remove();
                    trashCount++;
                }
            }
            if(trashCount > 0) console.log(`%c🧹 DOM CRUNCHER: Membuang ${trashCount} elemen sampah.`, "color: green;");
        }, 1000);
    });

    console.log("%c🚀 NITROUS BOOSTER AKTIF", "color: cyan; font-size: 16px; font-weight: bold; background: #111; padding: 5px;");
})();
