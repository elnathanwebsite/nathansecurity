(function() {
    // --- KONFIGURASI ---
    const CONFIG = {
        API_URL: "https://nathansecurity.vercel.app/api/monitor", // Ganti dengan domain Anda
        SECRET_PREFIX: "NS_SECURE::",
        // --- PENINGKATAN PERFORMA: Timeout untuk API call (dalam milidetik) ---
        API_TIMEOUT: a1 // Nilai asli: 500
    };

    // --- SIMBOLISASI NILAI NUMERIK ---
    // a1, b2, c3, dll. adalah variabel yang menyimpan nilai numerik asli.
    // Ini untuk membuat kode lebih sulit dibaca dan dipahami.
    const a1 = 500; // Timeout API dalam milidetik
    const b2 = 10000; // Interval sweep otomatis dalam milidetik (10 detik)
    const c3 = 50; // Batas panjang untuk data non-sensitif (nama)
    const d4 = 8; // Bagian pertama dari UUID
    const e4 = 4; // Bagian kedua, ketiga, dan keempat dari UUID
    const f4 = 12; // Bagian kelima dari UUID
    const g3 = 3; // Jumlah bagian dalam JWT
    const h10 = 10; // Panjang minimal untuk data yang dianggap non-sensitif

    if (window.nathanSecurityActive) return;
    window.nathanSecurityActive = true;

    // ============================================================
    // BAGIAN 1: SISTEM "TRANSLATOR GHAIB" (INTI SOLUSI ANDA)
    // ============================================================

    const originalSetItem = Storage.prototype.setItem;
    const originalGetItem = Storage.prototype.getItem;

    // --- LOGIKA CERDAS: Heuristic yang dioptimalkan untuk kecepatan ---
    function shouldEncryptData(value) {
        const valueStr = String(value);

        // --- ATURAN: JANGAN Enkripsi (Data Non-Sensitif) ---
        // Cek ini dulu karena paling cepat untuk diuji.
        if (valueStr.length > c3 && !valueStr.match(/[a-zA-Z]/)) return false;

        // Pola token/JWT/UUID sangat spesifik dan cepat untuk diuji.
        const jwtPattern = new RegExp('^[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+$');
        if (jwtPattern.test(valueStr)) return false;

        const uuidPattern = new RegExp('^[a-f0-9]{' + d4 + '}-[a-f0-9]{' + e4 + '}-[a-f0-9]{' + e4 + '}-[a-f0-9]{' + e4 + '}-[a-f0-9]{' + f4 + '}$', 'i');
        if (uuidPattern.test(valueStr)) return false;

        // --- ATURAN: HARUS Enkripsi (Data Sensitif) ---
        // Pola ini juga dioptimalkan.
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (emailPattern.test(valueStr)) return true;

        const phonePattern = /^\+?[0-9\s\-]+$/;
        if (phonePattern.test(valueStr)) return true;

        if (valueStr.length < c3 && valueStr.match(/^[a-zA-Z\s]+$/)) return true;

        const urlWithCredsPattern = /^(https?:\/\/)?[^\s\/:]+:[^\s\/@]+@/i;
        if (urlWithCredsPattern.test(valueStr)) return true;

        // --- DEFAULT: Jika ragu, lebih baik JANGAN enkripsi.
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
            return data; // Jika gagal, kembalikan aslinya biar web gak crash
        }
    }

    // 2. Fungsi Mengacak (Biar Hacker Pusing) - SEKARANG MENGGUNAKAN API dengan TIMEOUT
    function encrypt(data) {
        try {
            const str = String(data);
            if (str.startsWith(CONFIG.SECRET_PREFIX)) return str;

            // --- PENINGKATAN PERFORMA: Gunakan XMLHttpRequest dengan TIMEOUT ---
            const xhr = new XMLHttpRequest();
            xhr.open("POST", CONFIG.API_URL, false); // Sinkron, tapi dengan timeout
            xhr.timeout = CONFIG.API_TIMEOUT; // Set timeout
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.send(JSON.stringify({ action: "hide_data", data: str }));

            if (xhr.status === 200) {
                const response = JSON.parse(xhr.responseText);
                if (response.status === "success") {
                    return response.result;
                }
            }
            
            // --- Fallback: Jika API gagal atau timeout, gunakan enkripsi lokal ---
            console.warn("API enkripsi tidak tersedia atau lambat, menggunakan enkripsi lokal.");
            return CONFIG.SECRET_PREFIX + btoa(encodeURIComponent(str)).split('').reverse().join('');
            
        } catch(e) {
            // --- Fallback: Jika error lain, gunakan enkripsi lokal ---
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
    }, b2); // Cek setiap 10 detik

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

// =================================================================
// CATATAN DETAIL KODE
// =================================================================

// Baris 3: Mendefinisikan objek konfigurasi utama yang berisi pengaturan skrip.
// Baris 23: Menyimpan referensi asli dari metode 'setItem' di 'localStorage' untuk digunakan nanti.
// Baris 24: Menyimpan referensi asli dari metode 'getItem' di 'localStorage' untuk digunakan nanti.
// Baris 31: Mendefinisikan fungsi utama untuk menentukan apakah suatu nilai data harus dienkripsi.
// Baris 36: Aturan pertama: Jangan enkripsi jika data panjang dan tidak mengandung huruf (kemungkinan token/ID).
// Baris 40: Aturan kedua: Jangan enkripsi jika cocok dengan pola JWT (JSON Web Token).
// Baris 44: Aturan ketiga: Jangan enkripsi jika cocok dengan pola UUID (Universally Unique Identifier).
// Baris 48: Aturan keempat: HARUS enkripsi jika cocok dengan pola alamat email.
// Baris 51: Aturan kelima: HARUS enkripsi jika cocok dengan pola nomor telepon.
// Baris 54: Aturan keenam: HARUS enkripsi jika data pendek dan hanya berisi huruf (kemungkinan nama).
// Baris 58: Aturan ketujuh: HARUS enkripsi jika cocok dengan pola URL yang mengandung kredensial (user:pass).
// Baris 68: Mendefinisikan fungsi 'decrypt' yang mengubah data terenkripsi kembali ke bentuk aslinya.
// Baris 78: Mendefinisikan fungsi 'encrypt' yang mengirim data ke API server untuk dienkripsi.
// Baris 88: Mem-bajak (hook) metode 'setItem' untuk memeriksa dan mengenkripsi data sebelum disimpan.
// Baris 97: Mem-bajak (hook) metode 'getItem' untuk mendekripsi data sebelum dikembalikan ke aplikasi.
// Baris 110: Mendefinisikan interval waktu (10 detik) untuk memindai ulang semua data di 'localStorage'.
// Baris 114: Jika data sensitif ditemukan yang belum dienkripsi, skrip akan mengenkripsinya kembali.
// Baris 120: Mendefinisikan fungsi untuk memeriksa apakah akses ke halaman web diblokir oleh server keamanan.
