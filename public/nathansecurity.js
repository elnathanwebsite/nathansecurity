(function() {
    // --- KONFIGURASI ---
    const CONFIG = {
        API_URL: "https://nathansecurity.vercel.app/api/monitor", // Ganti dengan domain Anda
        SECRET_PREFIX: "NS_SECURE::",
        API_TIMEOUT: 500 // Timeout API dalam milidetik
    };

    if (window.nathanSecurityActive) return;
    window.nathanSecurityActive = true;

    // ============================================================
    // BAGIAN 1: SISTEM "TRANSLATOR GHAIB" (INTI SOLUSI ANDA)
    // ============================================================

    const originalSetItem = Storage.prototype.setItem;
    const originalGetItem = Storage.prototype.getItem;

    // --- LOGIKA DETEKSI UMUM: Pola sensitif inti yang tidak boleh diabaikan ---
    const CORE_SENSITIVE_PATTERNS = [
        /@gmail\.com/i, /@yahoo\.com/i, /@outlook\.com/i, // Pola email umum
        /user_token/i, /api_token/i, /access_token/i, /refresh_token/i, // Pola token
        /password/i, /email/i, /name/i, /phone/i, /address/i // Pola kata kunci umum
    ];

    // --- Fungsi Pembantu: Memeriksa apakah sebuah nilai string mengandung pola sensitif ---
    function containsSensitivePattern(valueStr) {
        return CORE_SENSITIVE_PATTERNS.some(pattern => pattern.test(valueStr));
    }

    // --- Fungsi Pembantu: Memeriksa secara rekursif apakah objek atau array mengandung data sensitif ---
    function hasSensitiveDataRecursively(data) {
        if (typeof data === 'string') {
            return containsSensitivePattern(data);
        }
        if (typeof data === 'object' && data !== null) {
            for (const key in data) {
                if (hasSensitiveDataRecursively(data[key])) {
                    return true;
                }
            }
        }
        return false;
    }

    // --- LOGIKA UTAMA: Menentukan apakah data harus dienkripsi ---
    function shouldEncryptData(value) {
        // Jika nilai bukan string, jangan enkripsi (untuk menghindari error)
        if (typeof value !== 'string') {
            return false;
        }

        const valueStr = value;

        try {
            // Coba parsing JSON untuk memeriksa struktur dalamnya
            const parsedValue = JSON.parse(valueStr);
            // Jika berhasil di-parse, periksa secara rekursif
            return hasSensitiveDataRecursively(parsedValue);
        } catch (e) {
            // Jika bukan JSON, periksa stringnya secara langsung
            return containsSensitivePattern(valueStr);
        }
    }

    // 1. Fungsi Menerjemahkan (Biar Website Gak Error/Blank) - TETAP SAMA
    function decrypt(data) {
        try {
            if (!data) return null;
            if (!String(data).startsWith(CONFIG.SECRET_PREFIX)) return data;

            const cleanStr = data.replace(CONFIG.SECRET_PREFIX, "");
            return decodeURIComponent(atob(cleanStr.split('').reverse().join('')));
        } catch(e) {
            return data; // Jika gagal, kembalikan aslinya biar web gak crash
        }
    }

    // 2. Fungsi Mengacak (Biar Hacker Pusing) - SEKARANG MENGGUNAKAN API dengan TIMEOUT
    function encrypt(data) {
        try {
            const str = String(data);
            if (str.startsWith(CONFIG.SECRET_PREFIX)) return str;

            // --- PENINGKATAN PERFORMA: Gunakan Base64 lokal untuk kecepatan ---
            return CONFIG.SECRET_PREFIX + btoa(encodeURIComponent(str)).split('').reverse().join('');
            
        } catch(e) {
            // Fallback terakhir jika Base64 gagal (sangat jarang terjadi)
            return CONFIG.SECRET_PREFIX + btoa(encodeURIComponent(str)).split('').reverse().join('');
        }
    }

    // Saat Website mau SIMPAN data
    // Kita cegat -> Kita analisis isi datanya -> Baru lakukan enkripsi (jika perlu)
    Storage.prototype.setItem = function(key, value) {
        // Jika nilai data sensitif, enkripsi. Jika tidak, simpan aslinya.
        if (shouldEncryptData(value)) {
            const secureValue = encrypt(value);
            originalSetItem.call(this, key, secureValue);
        } else {
            originalSetItem.call(this, key, value);
        }
    };

    // Saat Website mau TAMPILKAN data
    // Kita ambil dari gudang (yang diacak) -> Kita terjemahkan -> Kasih ke website
    Storage.prototype.getItem = function(key) {
        const rawValue = originalGetItem.call(this, key);
        return decrypt(rawValue);
    };

    // ============================================================
    // BAGIAN 2: SAPU BERSIH OTOMATIS (AUTO-SWEEP - KEAMANAN CADANGAN)
    // ============================================================
    // PENINGKATAN PERFORMA: Kurangi frekuensi sweep dari 5 detik menjadi 10 detik.
    // Ini mengurangi beban CPU dan I/O pada browser.
    setInterval(() => {
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                const rawValue = originalGetItem.call(localStorage, key);

                // Jika data mentah sensitif DAN data yang disimpan saat ini belum dienkripsi...
                if (rawValue && shouldEncryptData(rawValue) && !String(rawValue).startsWith(CONFIG.SECRET_PREFIX)) {
                    // Timpa dengan versi aman
                    localStorage.setItem(key, rawValue); 
                }
            }
        } catch (e) {}
    }, 10000); // Cek setiap 10 detik

    // ============================================================
    // BAGIAN 3: SISTEM BLOKIR (SECURITY)
    // ============================================================
    async function startMonitoring() {
        try {
            const res = await fetch(CONFIG.API_URL, {
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
