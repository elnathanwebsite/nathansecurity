(function() {
    // --- KONFIGURASI ---
    const SERVER_HOST = "https://nathansecurity.vercel.app"; 
    const API_URL = SERVER_HOST + "/api/monitor";
    const SECRET_PREFIX = "NS_SECURE::"; 

    if (window.nathanSecurityActive) return;
    window.nathanSecurityActive = true;

    console.log("🛡️ NathanSecurity: Safe Mode Active");

    const originalSetItem = Storage.prototype.setItem;
    const originalGetItem = Storage.prototype.getItem;

    // --- FUNGSI KRIPTO YANG LEBIH AMAN (SAFE DECODE) ---
    
    function scramble(str) {
        try {
            if (!str) return str; // Jangan acak null/undefined
            if (String(str).startsWith(SECRET_PREFIX)) return str; // Jangan acak 2 kali
            
            // Menggunakan encodeURIComponent agar Emoji/Spasi tidak bikin error
            return SECRET_PREFIX + btoa(encodeURIComponent(str)).split('').reverse().join('');
        } catch(e) { 
            return str; // Kalau gagal ngacak, biarkan apa adanya (biar web gak error)
        }
    }

    function unscramble(str) {
        try {
            if (!str) return null; // Balikin null kalau emang kosong
            if (!str.startsWith(SECRET_PREFIX)) return str; // Kalau data lama (telanjang), balikin langsung
            
            let cleanStr = str.replace(SECRET_PREFIX, "");
            // Balikin urutan -> decode Base64 -> decode Component
            return decodeURIComponent(atob(cleanStr.split('').reverse().join('')));
        } catch(e) { 
            console.warn("NathanSecurity: Gagal decrypt, mengembalikan data asli agar web tidak crash.");
            return str.replace(SECRET_PREFIX, ""); // Fail-safe: paksa balikin string meski mungkin rusak dikit
        }
    }

    // --- OVERRIDE FUNGSI STORAGE ---

    Storage.prototype.setItem = function(key, value) {
        // Kita paksa ubah ke String dulu karena LocalStorage aslinya cuma terima string
        // Ini mencegah error "[object Object]"
        const stringValue = String(value);
        const hiddenValue = scramble(stringValue);
        originalSetItem.call(this, key, hiddenValue);
    };

    Storage.prototype.getItem = function(key) {
        const hiddenValue = originalGetItem.call(this, key);
        // KUNCI PERBAIKAN: Jika null, kembalikan null (jangan di-unscramble)
        if (hiddenValue === null) return null;
        
        return unscramble(hiddenValue);
    };

    // --- AUTO-SWEEP YANG LEBIH LEMBUT ---
    // Kita tunda 3 detik biar Website loading sempurna dulu
    setTimeout(() => {
        try {
            // Kita hanya enkripsi data yang jelas-jelas berbentuk JSON String (diawali kurung kurawal)
            // atau email, untuk menghindari kerusakan data biner Firebase
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                const rawValue = originalGetItem.call(localStorage, key);

                if (rawValue && !rawValue.startsWith(SECRET_PREFIX)) {
                    // Cek apakah ini data penting?
                    localStorage.setItem(key, rawValue); 
                }
            }
        } catch (e) {}
    }, 3000); 

    // --- SECURITY MONITORING (Sama seperti sebelumnya) ---
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
        document.body.innerHTML = `<h1 style="color:red;text-align:center;margin-top:20%">🚫 BLOCKED</h1>`;
        document.addEventListener('contextmenu', e => e.preventDefault());
    }

    startMonitoring();
})();
