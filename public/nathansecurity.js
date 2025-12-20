(function() {
    // --- KONFIGURASI ---
    const SERVER_HOST = "https://nathansecurity.vercel.app"; 
    const API_URL = SERVER_HOST + "/api/monitor";
    const SECRET_PREFIX = "NS_SECURE::"; 

    // Singleton Pattern (Biar gak jalan dobel)
    if (window.nathanSecurityActive) return;
    window.nathanSecurityActive = true;

    // ============================================================
    // BAGIAN 1: INTELLIGENT STEALTH MODE (ANTI-CRASH)
    // ============================================================
    
    const originalSetItem = Storage.prototype.setItem;
    const originalGetItem = Storage.prototype.getItem;

    // Fungsi Pengacak (Hanya mengacak jika belum diacak)
    function scramble(str) {
        try {
            const safeStr = String(str);
            if (safeStr.startsWith(SECRET_PREFIX)) return safeStr;
            // Enkripsi Base64 + Reverse
            return SECRET_PREFIX + btoa(encodeURIComponent(safeStr)).split('').reverse().join('');
        } catch(e) { return str; }
    }

    // Fungsi Pemulih (KUNCI ANTI-CRASH DISINI!)
    function unscramble(str) {
        try {
            if (!str) return str;
            
            // CEK DULU: Apakah ini data terenkripsi buatan kita?
            if (!String(str).startsWith(SECRET_PREFIX)) {
                // JIKA TIDAK: Berarti ini data lama atau Firebase loading duluan.
                // KEMBALIKAN APA ADANYA biar website tidak error!
                return str; 
            }

            // JIKA YA: Baru kita bongkar sandinya
            let cleanStr = str.replace(SECRET_PREFIX, "");
            return decodeURIComponent(atob(cleanStr.split('').reverse().join('')));
        } catch(e) { 
            // Fail-safe: Jika gagal decode, kembalikan aslinya.
            return str; 
        }
    }

    // A. PEMBAJAKAN FUNGSI SIMPAN
    // Setiap kali website mau nyimpen data baru, KITA PAKSA ENKRIPSI.
    Storage.prototype.setItem = function(key, value) {
        const hiddenValue = scramble(String(value));
        originalSetItem.call(this, key, hiddenValue);
    };

    // B. PEMBAJAKAN FUNGSI AMBIL
    // Setiap kali website minta data, kita cek dulu statusnya.
    Storage.prototype.getItem = function(key) {
        const storedValue = originalGetItem.call(this, key);
        return unscramble(storedValue);
    };

    console.log("🛡️ NathanSecurity: Hybrid Stealth Mode Active");

    // ============================================================
    // BAGIAN 2: OPERASI SAPU BERSIH (BACKGROUND TASK)
    // ============================================================
    // Karena kita membiarkan data lama terbaca (biar gak crash),
    // Kita perlu "Sapu Bersih" pelan-pelan agar semuanya jadi terenkripsi.
    
    // Tunggu 2 detik (biar web loading selesai), lalu mulai menyapu
    setTimeout(() => {
        try {
            // Loop semua data di LocalStorage
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                const rawValue = originalGetItem.call(localStorage, key);

                // Jika nemu data yang masih telanjang (Gak ada awalan NS_SECURE)
                if (rawValue && !String(rawValue).startsWith(SECRET_PREFIX)) {
                    // KITA TIMPA DENGAN VERSI TERENKRIPSI
                    // Panggil setItem kita yang sudah dimodifikasi di atas
                    localStorage.setItem(key, rawValue);
                    console.log(`🧹 Mengamankan data tertinggal: ${key}`);
                }
            }
        } catch (e) {
            // Silent error biar user gak tau
        }
    }, 2000);

    // ============================================================
    // BAGIAN 3: SISTEM KEAMANAN (BLOKIR IP)
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
        document.body.innerHTML = `
            <div style="
                position:fixed;top:0;left:0;width:100%;height:100vh;background:#000;color:red;
                display:flex;justify-content:center;align-items:center;flex-direction:column;
                font-family:monospace;z-index:9999;text-align:center;
            ">
                <h1 style="font-size:3rem;margin:0;">🚫 ACCESS DENIED</h1>
                <p>IP: ${ip}</p>
                <small>Protected by NathanSecurity</small>
            </div>`;
        document.addEventListener('contextmenu', e => e.preventDefault());
    }

    startMonitoring();
})();
