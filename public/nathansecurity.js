(function() {
    // --- KONFIGURASI ---
    const API_URL = "https://nathansecurity.vercel.app/api/monitor"; // Ganti dengan domain Anda
    const SECRET_PREFIX = "NS_SECURE::"; 

    if (window.nathanSecurityActive) return;
    window.nathanSecurityActive = true;

    // ============================================================
    // BAGIAN 1: SISTEM "TRANSLATOR GHAIB" (INTI SOLUSI ANDA)
    // ============================================================
    // Ini yang bikin frontend tetap bisa baca data, tapi hacker melihat sampah.

    const originalSetItem = Storage.prototype.setItem;
    const originalGetItem = Storage.prototype.getItem;

    // --- PEMBAJAKAN (INTERCEPTOR) ---

    // 1. Fungsi Menerjemahkan (Biar Website Gak Error/Blank) - TETAP SAMA
    function decrypt(data) {
        try {
            if (!data) return null;
            if (!String(data).startsWith(SECRET_PREFIX)) return data; // Kalau belum diacak, balikin aslinya

            // Bongkar sandinya agar bisa dibaca Website
            const cleanStr = data.replace(SECRET_PREFIX, "");
            return decodeURIComponent(atob(cleanStr.split('').reverse().join('')));
        } catch(e) { 
            return data; // Kalau gagal, kembalikan aslinya biar web gak crash
        }
    }

    // 2. Fungsi Mengacak (Biar Hacker Pusing) - SEKARANG MENGGUNAKAN API
    function encrypt(data) {
        try {
            const str = String(data);
            if (str.startsWith(SECRET_PREFIX)) return str; // Jangan acak 2 kali

            // --- Logika Baru: Panggil API Python untuk mengacak data ---
            const xhr = new XMLHttpRequest();
            xhr.open("POST", API_URL, false); // false membuat request menjadi SINKRON
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.send(JSON.stringify({ action: "hide_data", data: str }));

            if (xhr.status === 200) {
                const response = JSON.parse(xhr.responseText);
                if (response.status === "success") {
                    return response.result; // Kembalikan hasil dari server
                }
            }
            
            // --- Fallback: Jika API gagal, gunakan metode lama ---
            console.warn("Gagal menghubungi API enkripsi, menggunakan enkripsi lokal.");
            return SECRET_PREFIX + btoa(encodeURIComponent(str)).split('').reverse().join('');
            
        } catch(e) {
            // --- Fallback: Jika terjadi error lain, gunakan metode lama ---
            console.warn("Error saat mengenkripsi via API, menggunakan enkripsi lokal.");
            return SECRET_PREFIX + btoa(encodeURIComponent(str)).split('').reverse().join('');
        }
    }

    // Saat Website mau SIMPAN data (misal: simpan token login)
    // Kita cegat -> Kita acak via API -> Baru masukin gudang
    Storage.prototype.setItem = function(key, value) {
        const secureValue = encrypt(value);
        originalSetItem.call(this, key, secureValue);
    };

    // Saat Website mau TAMPILKAN data (misal: nama user di pojok kanan)
    // Kita ambil dari gudang (yang diacak) -> Kita terjemahkan -> Kasih ke website
    Storage.prototype.getItem = function(key) {
        const rawValue = originalGetItem.call(this, key);
        return decrypt(rawValue);
    };

    // ============================================================
    // BAGIAN 2: SAPU BERSIH OTOMATIS (AUTO-SWEEP)
    // ============================================================
    // Ini solusi jika Anda malas mengatur urutan script.
    // Script ini akan berjalan terus menerus setiap 2 detik.
    // Kalau dia nemu data "Telanjang" (misal dari Firebase), dia langsung acak!
    
    setInterval(() => {
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                // Ambil data MENTAH (bypass translator)
                const rawValue = originalGetItem.call(localStorage, key);

                // Kalau ketemu data yang belum ada tulisan NS_SECURE...
                if (rawValue && !String(rawValue).startsWith(SECRET_PREFIX)) {
                    // Timpa dengan versi aman (menggunakan fungsi encrypt yang baru)
                    localStorage.setItem(key, rawValue); 
                }
            }
        } catch (e) {}
    }, 2000); // Cek setiap 2 detik

    // ============================================================
    // BAGIAN 3: SISTEM BLOKIR (SECURITY)
    // ============================================================
    async function startMonitoring() {
        try {
            const res = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ path: window.location.pathname, host: window.location.hostname })
            });
            const data = await res.json();
            if (data.status === "blocked") {
                document.documentElement.innerHTML = '';
                document.documentElement.style.backgroundColor = 'black';
                document.body.innerHTML = '<h1 style="color:red;text-align:center;margin-top:20%">🚫 BLOCKED</h1>';
                window.stop();
            }
        } catch (e) {}
    }
    startMonitoring();

})();
