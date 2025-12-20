(function() {
    // --- KONFIGURASI ---
    const CONFIG = {
        API_URL: "https://nathansecurity.vercel.app/api/monitor", // Ganti dengan domain Anda
        SECRET_PREFIX: "NS_SECURE::",
        API_TIMEOUT: a1 // Nilai asli: 500
    };

    // --- SIMBOLISASI NILAI NUMERIK ---
    const a1 = 500; // Timeout API dalam milidetik
    const b2 = 10000; // Interval sweep otomatis dalam milidetik (10 detik)

    if (window.nathanSecurityActive) return;
    window.nathanSecurityActive = true;

    // ============================================================
    // BAGIAN 1: SISTEM "TRANSLATOR GHAIB" (INTI SOLUSI ANDA)
    // ============================================================

    const originalSetItem = Storage.prototype.setItem;
    const originalGetItem = Storage.prototype.getItem;

    // --- LOGIKA SEDERHANA: Enkripsi SEMUA data yang bukan string kosong ---
    function isStringAndNotEmpty(value) {
        return typeof value === 'string' && value.length > 0;
    }

    function shouldEncryptData(value) {
        return isStringAndNotEmpty(value);
    }

    // 1. Fungsi Menerjemahkan (Biar Website Gak Error/Blank)
    function isDataEncrypted(data) {
        return data && String(data).startsWith(CONFIG.SECRET_PREFIX);
    }

    function decodeEncryptedString(encryptedStr) {
        try {
            const cleanStr = encryptedStr.replace(CONFIG.SECRET_PREFIX, "");
            return decodeURIComponent(atob(cleanStr.split('').reverse().join('')));
        } catch(e) {
            return encryptedStr; // Jika gagal, kembalikan aslinya biar web gak crash
        }
    }

    function decrypt(data) {
        if (!isDataEncrypted(data)) {
            return data;
        }
        return decodeEncryptedString(data);
    }

    // 2. Fungsi Mengacak (Biar Hacker Pusing) - SEKARANG MENGGUNAKAN API dengan TIMEOUT
    function prepareDataForEncryption(str) {
        return String(str);
    }

    function sendToApiForEncryption(str) {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", CONFIG.API_URL, false); // Sinkron, tapi dengan timeout
        xhr.timeout = CONFIG.API_TIMEOUT; // Set timeout
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.send(JSON.stringify({ action: "hide_data", data: str }));
        return xhr;
    }

    function handleApiResponse(xhr) {
        if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText);
            if (response.status === "success") {
                return response.result;
            }
        }
        return null;
    }

    function useLocalFallback(str) {
        console.warn("API enkripsi tidak tersedia atau lambat, menggunakan enkripsi lokal.");
        return CONFIG.SECRET_PREFIX + btoa(encodeURIComponent(str)).split('').reverse().join('');
    }

    function encrypt(data) {
        const str = prepareDataForEncryption(data);
        if (str.startsWith(CONFIG.SECRET_PREFIX)) {
            return str;
        }

        const xhr = sendToApiForEncryption(str);
        const apiResult = handleApiResponse(xhr);

        if (apiResult) {
            return apiResult;
        }

        return useLocalFallback(str);
    }

    // Saat Website mau SIMPAN data
    // Kita cegat -> Kita analisis isi datanya -> Baru lakukan enkripsi (jika perlu)
    function processAndStoreData(key, value) {
        if (shouldEncryptData(value)) {
            const secureValue = encrypt(value);
            originalSetItem.call(this, key, secureValue);
        } else {
            originalSetItem.call(this, key, value);
        }
    }

    Storage.prototype.setItem = function(key, value) {
        processAndStoreData.call(this, key, value);
    };

    // Saat Website mau TAMPILKAN data
    // Kita ambil dari gudang (yang diacak) -> Kita terjemahkan -> Kasih ke website
    function retrieveAndDecryptData(key) {
        const rawValue = originalGetItem.call(this, key);
        return decrypt(rawValue);
    }

    Storage.prototype.getItem = function(key) {
        return retrieveAndDecryptData.call(this, key);
    };

    // ============================================================
    // BAGIAN 2: SAPU BERSIH OTOMATIS (AUTO-SWEEP - KEAMANAN CADANGAN)
    // ============================================================
    function performAutoSweep() {
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                const rawValue = originalGetItem.call(localStorage, key);

                if (rawValue && shouldEncryptData(rawValue) && !isDataEncrypted(rawValue)) {
                    localStorage.setItem(key, rawValue); 
                }
            }
        } catch (e) {}
    }

    setInterval(performAutoSweep, b2); // Cek setiap 10 detik

    // ============================================================
    // BAGIAN 3: SISTEM BLOKIR (SECURITY)
    // ============================================================
    async function monitorSecurityStatus() {
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

    monitorSecurityStatus();

})();
