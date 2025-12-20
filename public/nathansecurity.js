(function() {
    // --- KONFIGURASI ---
    const CONFIG = {
        API_URL: "https://nathansecurity.vercel.app/api/monitor", // Ganti dengan domain Anda
        SECRET_PREFIX: "NS_SECURE::"
    };

    if (window.nathanSecurityActive) return;
    window.nathanSecurityActive = true;

    // ============================================================
    // BAGIAN 1: SISTEM "TRANSLATOR GHAIB" (INTI SOLUSI ANDA)
    // ============================================================

    const originalSetItem = Storage.prototype.setItem;
    const originalGetItem = Storage.prototype.getItem;

    // --- LOGIKA CERDAS: Heuristic untuk menentukan apakah data harus dienkripsi ---
    function shouldEncryptKey(key, value) {
        const keyLower = key.toLowerCase();
        const valueStr = String(value);

        // --- ATURAN: JANGAN Enkripsi (Data Non-Sensitif) ---
        // 1. Kunci yang jelas bukan data sensitif
        const nonSensitiveKeys = ['theme', 'language', 'color', 'preference', 'setting', 'cart', 'id', 'session', 'config'];
        if (nonSensitiveKeys.some(k => keyLower.includes(k))) {
            return false;
        }

        // 2. Nilai yang terlihat seperti token (JWT, dll.)
        const jwtPattern = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;
        if (jwtPattern.test(valueStr)) {
            return false;
        }

        // 3. Nilai yang sangat panjang dan acak (kemungkinan token atau ID)
        if (valueStr.length > 50 && !valueStr.match(/[a-zA-Z]/)) {
            return false;
        }

        // --- ATURAN: HARUS Enkripsi (Data Sensitif) ---
        // 1. Kunci yang jelas adalah data sensitif
        const sensitiveKeys = ['password', 'pass', 'secret', 'token', 'auth', 'email', 'user', 'name', 'phone', 'address', 'login'];
        if (sensitiveKeys.some(k => keyLower.includes(k))) {
            return true;
        }

        // 2. Nilai yang terlihat seperti alamat email
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (emailPattern.test(valueStr)) {
            return true;
        }

        // 3. Nilai yang terlihat seperti nama (sederhana, alfabet)
        if (valueStr.length < 50 && valueStr.match(/^[a-zA-Z\s]+$/)) {
            return true;
        }

        // 4. Nilai yang terlihat seperti nomor telepon
        const phonePattern = /^\+?[0-9\s\-]+$/;
        if (phonePattern.test(valueStr)) {
            return true;
        }

        // --- DEFAULT: Jika ragu, lebih baik JANGAN enkripsi.
        // Lebih baik biarkan data non-sensitif terbuka daripada merusak website dengan mengenkripsi data yang dibutuhkan.
        // Auto-sweep akan menangani data sensitif yang terlewat.
        return false;
    }

    // 1. Fungsi Menerjemahkan (Biar Website Gak Error/Blank) - TETAP SAMA
    function decrypt(data) {
        try {
            if (!data) return null;
            if (!String(data).startsWith(CONFIG.SECRET_PREFIX)) return data;

            const cleanStr = data.replace(CONFIG.SECRET_PREFIX, "");
            return decodeURIComponent(atob(cleanStr.split('').reverse().join('')));
        } catch(e) {
            return data;
        }
    }

    // 2. Fungsi Mengacak (Biar Hacker Pusing) - SEKARANG MENGGUNAKAN API
    function encrypt(data) {
        try {
            const str = String(data);
            if (str.startsWith(CONFIG.SECRET_PREFIX)) return str;

            const xhr = new XMLHttpRequest();
            xhr.open("POST", CONFIG.API_URL, false); // Sinkron
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.send(JSON.stringify({ action: "hide_data", data: str }));

            if (xhr.status === 200) {
                const response = JSON.parse(xhr.responseText);
                if (response.status === "success") {
                    return response.result;
                }
            }
            
            // Fallback: Jika API down, gunakan enkripsi lokal
            console.warn("API enkripsi tidak tersedia, menggunakan enkripsi lokal.");
            return CONFIG.SECRET_PREFIX + btoa(encodeURIComponent(str)).split('').reverse().join('');
            
        } catch(e) {
            // Fallback: Jika error lain, gunakan enkripsi lokal
            console.warn("Error saat mengenkripsi, menggunakan enkripsi lokal.");
            return CONFIG.SECRET_PREFIX + btoa(encodeURIComponent(str)).split('').reverse().join('');
        }
    }

    // Saat Website mau SIMPAN data
    // Kita cegat -> Kita analisis -> Baru lakukan enkripsi (jika perlu)
    Storage.prototype.setItem = function(key, value) {
        if (!shouldEncryptKey(key, value)) {
            originalSetItem.call(this, key, value);
            return;
        }

        const secureValue = encrypt(value);
        originalSetItem.call(this, key, secureValue);
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
    // Skrip ini akan berjalan terus menerus setiap 5 detik.
    // Jika dia nemu data sensitif yang belum dienkripsi, dia akan langsung mengacak!
    
    setInterval(() => {
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                // Ambil data MENTAH (bypass translator)
                const rawValue = originalGetItem.call(localStorage, key);

                // Jika data mentah sensitif DAN data yang disimpan saat ini belum dienkripsi...
                if (rawValue && shouldEncryptKey(key, rawValue) && !String(rawValue).startsWith(CONFIG.SECRET_PREFIX)) {
                    // Timpa dengan versi aman
                    localStorage.setItem(key, rawValue); 
                }
            }
        } catch (e) {}
    }, 5000); // Cek setiap 5 detik

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
