(function() {
    // --- KONFIGURASI PUSAT ---
    const SERVER_HOST = "https://nathansecurity.vercel.app"; 
    const API_URL = SERVER_HOST + "/api/monitor";
    const SECRET_PREFIX = "NS_SECURE::"; // Prefix rahasia kita

    // Mencegah script berjalan ganda
    if (window.nathanSecurityActive) return;
    window.nathanSecurityActive = true;

    console.log("🛡️ NathanSecurity: System Active (Stealth + Protection Mode)");

    // ============================================================
    // BAGIAN 1: FITUR "STEALTH MODE" (MENYEMBUNYIKAN DATA)
    // ============================================================
    
    const originalSetItem = Storage.prototype.setItem;
    const originalGetItem = Storage.prototype.getItem;

    // Fungsi Pengacak (Scrambler)
    function scramble(str) {
        try {
            // Jangan acak lagi kalau sudah teracak
            if (str.startsWith(SECRET_PREFIX)) return str;
            return SECRET_PREFIX + btoa(encodeURIComponent(str)).split('').reverse().join('');
        } catch(e) { return str; }
    }

    // Fungsi Pemulih (Unscrambler)
    function unscramble(str) {
        try {
            if (!str || !str.startsWith(SECRET_PREFIX)) return str; 
            let cleanStr = str.replace(SECRET_PREFIX, "");
            return decodeURIComponent(atob(cleanStr.split('').reverse().join('')));
        } catch(e) { return str; }
    }

    // A. BAJAK FUNGSI SIMPAN
    Storage.prototype.setItem = function(key, value) {
        const hiddenValue = scramble(String(value));
        originalSetItem.call(this, key, hiddenValue);
    };

    // B. BAJAK FUNGSI AMBIL
    Storage.prototype.getItem = function(key) {
        const hiddenValue = originalGetItem.call(this, key);
        return unscramble(hiddenValue);
    };

    console.log("🔒 LocalStorage Obfuscation: ENABLED");

    // ============================================================
    // BAGIAN 1.5: FITUR "SAPU BERSIH" (SOLUSI FIREBASE)
    // ============================================================
    // Ini bagian PENTING yang belum ada di kode Anda sebelumnya.
    // Script ini akan menunggu 1.5 detik, lalu mengecek apakah ada data 'telanjang'.
    // Jika ada, langsung diacak paksa!
    
    setTimeout(() => {
        try {
            console.log("🧹 NathanSecurity: Menyapu data lama...");
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                // Kita ambil pakai originalGetItem biar tau wujud aslinya
                const rawValue = originalGetItem.call(localStorage, key);

                // Jika datanya ada TAPI tidak punya awalan rahasia kita...
                if (rawValue && !rawValue.startsWith(SECRET_PREFIX)) {
                    // ...Simpan ulang (otomatis kena acak oleh fungsi setItem kita)
                    localStorage.setItem(key, rawValue); 
                    console.log(`   -> Data '${key}' berhasil diamankan.`);
                }
            }
        } catch (e) {
            console.error("Gagal menyapu data:", e);
        }
    }, 1500); 


    // ============================================================
    // BAGIAN 2: FITUR "SECURITY MODE" (BLOKIR IP SPAM)
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

            if (data.status === "blocked") {
                executeBlock(data.ip);
            }

        } catch (e) {
            console.warn("NathanSecurity: Server check skipped.");
        }
    }

    // FUNGSI LAYAR HITAM
    function executeBlock(ip) {
        try { window.stop(); } catch(e){}
        
        document.documentElement.innerHTML = '';
        document.documentElement.style.backgroundColor = "#000";

        document.body.innerHTML = `
            <div style="
                position: fixed; top: 0; left: 0; width: 100%; height: 100vh;
                display: flex; flex-direction: column; 
                justify-content: center; align-items: center; 
                background-color: #050000; z-index: 2147483647;
                font-family: 'Courier New', monospace; text-align: center;
            ">
                <h1 style="font-size: 3.5rem; color: #ff0000; margin-bottom: 10px; text-shadow: 0 0 10px #ff0000;">
                    🚫 ACCESS DENIED
                </h1>
                <div style="border: 1px solid #330000; background: #1a0000; padding: 20px; border-radius: 8px; max-width: 500px;">
                    <h3 style="color: #ffcccc; margin: 0 0 10px 0;">Suspicious Activity</h3>
                    <p style="color: #ff6666; font-size: 1rem;">
                        Sistem mendeteksi perilaku tidak wajar (Spam/Scanning).
                    </p>
                </div>
                <div style="margin-top: 30px; color: #444; font-size: 0.8rem;">
                    <p>IP Address: <span style="color: #666;">${ip || 'Hidden'}</span></p>
                    <p>Protected by <b>NathanSecurity</b></p>
                </div>
            </div>
        `;

        document.addEventListener('contextmenu', event => event.preventDefault());
        document.onkeydown = function(e) { return false; }
    }

    startMonitoring();

})();
