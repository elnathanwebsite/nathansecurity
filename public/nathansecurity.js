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

    // --- LOGIKA CERDAS: Heuristic yang lebih General (Fokus pada Value) ---
    function shouldEncryptData(value) {
        const valueStr = String(value);

        // --- ATURAN: JANGAN Enkripsi (Data Non-Sensitif) ---
        // 1. Nilai yang terlihat seperti Token (JWT, dll.)
        const jwtPattern = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;
        if (jwtPattern.test(valueStr)) {
            return false;
        }

        // 2. Nilai yang terlihat seperti ID unik (UUID)
        const uuidPattern = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
        if (uuidPattern.test(valueStr)) {
            return false;
        }

        // 3. Nilai yang sangat panjang dan acak (kemungkinan token, ID, atau hash)
        if (valueStr.length > 50 && !valueStr.match(/[a-zA-Z]/)) {
            return false;
        }

        // 4. Nilai yang jelas bukan string (boolean, number, null, dll.)
        if (typeof value !== 'string') {
            return false;
        }

        // --- ATURAN: HARUS Enkripsi (Data Sensitif) ---
        // 1. Nilai yang terlihat seperti alamat email
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (emailPattern.test(valueStr)) {
            return true;
        }

        // 2. Nilai yang terlihat seperti nomor telepon
        const phonePattern = /^\+?[0-9\s\-]+$/;
        if (phonePattern.test(valueStr)) {
            return true;
        }

        // 3. Nilai yang terlihat seperti nama (sederhana, alfabet dan spasi)
        if (valueStr.length < 50 && valueStr.match(/^[a-zA-Z\s]+$/)) {
            return true;
        }

        // 4. Nilai yang terlihat seperti URL dengan kredensial (misal: user:pass)
        const urlWithCredsPattern = /^(https?:\/\/)?[^\s\/:]+:[^\s\/@]+@/i;
        if (urlWithCredsPattern.test(valueStr)) {
            return true;
        }

        // --- DEFAULT: Jika ragu, lebih baik JANGAN enkripsi.
        // Lebih baik biarkan data non-sensitif terbuka daripada merusak website.
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
    // Skrip ini akan berjalan terus menerus setiap 5 detik.
    // Jika dia nemu data sensitif yang belum dienkripsi, dia akan langsung mengacak!
    
    setInterval(() => {
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                // Ambil data MENTAH (bypass translator)
                const rawValue = originalGetItem.call(localStorage, key);

                // Jika data mentah sensitif DAN data yang disimpan saat ini belum dienkripsi...
                if (rawValue && shouldEncryptData(rawValue) && !String(rawValue).startsWith(CONFIG.SECRET_PREFIX)) {
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
