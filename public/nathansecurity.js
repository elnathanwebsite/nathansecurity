(function() {
    // --- KONFIGURASI ---
    const SERVER_HOST = "https://nathansecurity.vercel.app"; 
    const API_URL = SERVER_HOST + "/api/monitor";
    const SECRET_PREFIX = "NS_SECURE::"; 

    if (window.nathanSecurityActive) return;
    window.nathanSecurityActive = true;

    // ============================================================
    // BAGIAN 1: STEALTH MODE (YANG DIPERBAIKI)
    // ============================================================
    
    const originalSetItem = Storage.prototype.setItem;
    const originalGetItem = Storage.prototype.getItem;

    // Fungsi Acak (Encode)
    function scramble(str) {
        try {
            // Pastikan input adalah string
            const safeStr = String(str);
            if (safeStr.startsWith(SECRET_PREFIX)) return safeStr;
            // Gunakan Base64 standar (lebih stabil untuk Firebase)
            return SECRET_PREFIX + btoa(safeStr).split('').reverse().join('');
        } catch(e) { return str; }
    }

    // Fungsi Pulihkan (Decode)
    function unscramble(str) {
        try {
            if (!str || typeof str !== 'string') return str;
            if (!str.startsWith(SECRET_PREFIX)) return str; 

            // Coba pulihkan
            let cleanStr = str.replace(SECRET_PREFIX, "");
            let decoded = atob(cleanStr.split('').reverse().join(''));
            return decoded;
        } catch(e) { 
            // PENTING: Jika gagal decode, kembalikan null agar website TIDAK CRASH
            console.warn("NathanSecurity: Gagal memulihkan data, mereset...", e);
            return null; 
        }
    }

    // A. BAJAK FUNGSI SIMPAN
    Storage.prototype.setItem = function(key, value) {
        try {
            const hiddenValue = scramble(value);
            originalSetItem.call(this, key, hiddenValue);
        } catch (e) {
            // Fallback: Jika error, simpan biasa saja daripada data hilang
            originalSetItem.call(this, key, value);
        }
    };

    // B. BAJAK FUNGSI AMBIL (KUNCI PERBAIKAN WEBSITE ANDA)
    Storage.prototype.getItem = function(key) {
        const hiddenValue = originalGetItem.call(this, key);
        // Kita terjemahkan balik sebelum dikasih ke Website
        return unscramble(hiddenValue);
    };

    console.log("🔒 Stealth Mode: Active & Stable");

    // ============================================================
    // BAGIAN 1.5: SAPU BERSIH (AUTO-FIX FIREBASE)
    // ============================================================
    // Kita jalankan agak lambat (3 detik) biar Firebase login dulu dengan tenang
    setTimeout(() => {
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                const rawValue = originalGetItem.call(localStorage, key);

                if (rawValue && !rawValue.startsWith(SECRET_PREFIX)) {
                    // Enkripsi data yang tertinggal
                    localStorage.setItem(key, rawValue); 
                }
            }
        } catch (e) {}
    }, 3000); 

    // ============================================================
    // BAGIAN 2: SECURITY MODE (BLOKIR)
    // ============================================================
    async function startMonitoring() {
        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    path: window.location.pathname,
                    host: window.location.hostname 
                })
            });
            const data = await response.json();
            if (data.status === "blocked") executeBlock(data.ip);
        } catch (e) {}
    }

    function executeBlock(ip) {
        try { window.stop(); } catch(e){}
        document.documentElement.innerHTML = '';
        document.documentElement.style.backgroundColor = "#000";
        document.body.innerHTML = `<div style="color:red; text-align:center; margin-top: 20%; font-family: sans-serif;"><h1>🚫 ACCESS DENIED</h1><p>IP: ${ip}</p></div>`;
        document.addEventListener('contextmenu', e => e.preventDefault());
    }

    startMonitoring();
})();
