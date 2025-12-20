(function() {
    // --- KONFIGURASI ---
    const SERVER_HOST = "https://nathansecurity.vercel.app"; 
    const API_URL = SERVER_HOST + "/api/monitor";
    const SECRET_PREFIX = "NS_SECURE::"; 

    // Mencegah script jalan dobel
    if (window.nathanSecurityActive) return;
    window.nathanSecurityActive = true;

    // ============================================================
    // BAGIAN 1: LOGIKA PENERJEMAH (ENCRYPT & DECRYPT)
    // ============================================================
    
    const originalSetItem = Storage.prototype.setItem;
    const originalGetItem = Storage.prototype.getItem;

    // FUNGSI 1: MENGACAK (Untuk disimpan ke Storage)
    function encryptData(str) {
        try {
            const safeStr = String(str);
            // Kalau sudah teracak, jangan diacak lagi
            if (safeStr.startsWith(SECRET_PREFIX)) return safeStr;
            // Rumus: Prefix + Base64 + Dibalik (Reverse)
            return SECRET_PREFIX + btoa(encodeURIComponent(safeStr)).split('').reverse().join('');
        } catch(e) { return str; }
    }

    // FUNGSI 2: MENERJEMAHKAN BALIK (Untuk dibaca Website)
    function decryptData(str) {
        try {
            // Kalau datanya kosong atau bukan enkripsi kita, balikin aslinya (Biar web gak error)
            if (!str || typeof str !== 'string') return str;
            if (!str.startsWith(SECRET_PREFIX)) return str; 

            // Bongkar sandinya
            let cleanStr = str.replace(SECRET_PREFIX, "");
            return decodeURIComponent(atob(cleanStr.split('').reverse().join('')));
        } catch(e) { 
            // Kalau gagal bongkar, kembalikan null biar aman
            return str; 
        }
    }

    // ============================================================
    // BAGIAN 2: PEMBAJAKAN LOCAL STORAGE (HOOKS)
    // ============================================================

    // A. SAAT WEBSITE MAU MENYIMPAN DATA
    // Kita gatot (cegat), kita acak dulu, baru simpan.
    Storage.prototype.setItem = function(key, value) {
        const hiddenValue = encryptData(value);
        originalSetItem.call(this, key, hiddenValue);
    };

    // B. SAAT WEBSITE MAU MEMBACA DATA (INI KUNCI BIAR PROFIL TAMPIL!)
    // Kita ambil data acak dari storage, kita terjemahkan, baru kasih ke website.
    Storage.prototype.getItem = function(key) {
        const hiddenValue = originalGetItem.call(this, key);
        // Website menerima data BERSIH, padahal di storage datanya KOTOR
        return decryptData(hiddenValue);
    };

    console.log("🛡️ NathanSecurity: Translator Mode Active");

    // ============================================================
    // BAGIAN 3: OPERASI "SAPU BERSIH" (BACKGROUND AUTO-ENCRYPT)
    // ============================================================
    // Tugas: Cari data lama (Firebase dll) yang belum teracak, lalu acak diam-diam.
    
    setTimeout(() => {
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                // Ambil data MENTAH (bypass fungsi getItem kita biar tau aslinya)
                const rawValue = originalGetItem.call(localStorage, key);

                // Jika nemu data yang masih telanjang (Gak ada awalan NS_SECURE)
                if (rawValue && !String(rawValue).startsWith(SECRET_PREFIX)) {
                    // Kita Enkripsi dan Simpan Ulang
                    const secureValue = encryptData(rawValue);
                    originalSetItem.call(localStorage, key, secureValue);
                    console.log(`🧹 Mengamankan data lama: ${key}`);
                }
            }
        } catch (e) {}
    }, 2500); // Jalan 2.5 detik setelah web loading

    // ============================================================
    // BAGIAN 4: SECURITY (BLOKIR IP SPAM)
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
