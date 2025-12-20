(function() {
    // === KONFIGURASI ===
    const API_URL = "https://nathansecurity.vercel.app/api/monitor";
    const SECRET_PREFIX = "NS_AES::"; 
    // GANTI KUNCI INI JADI APA SAJA (INI PASSWORD GUDANG ANDA)
    const ENCRYPTION_KEY = "NATHAN_SUPER_SECRET_KEY_2025"; 

    if (window.nathanSecurityActive) return;
    window.nathanSecurityActive = true;

    const originalSetItem = Storage.prototype.setItem;
    const originalGetItem = Storage.prototype.getItem;

    // --- ALGORITMA ENKRIPSI KUAT (XOR CIPHER) ---
    // Hacker tidak bisa baca ini kalau tidak tahu ENCRYPTION_KEY di atas.
    
    function cipher(text, key) {
        let result = "";
        for (let i = 0; i < text.length; i++) {
            // Mengacak karakter menggunakan matematika XOR dengan kunci
            result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
        }
        return result;
    }

    // 1. KUNCI DATA (Encrypt)
    function lock(data) {
        try {
            const str = String(data);
            if (str.startsWith(SECRET_PREFIX)) return str;
            // Langkah 1: Acak pakai Key
            const encrypted = cipher(str, ENCRYPTION_KEY);
            // Langkah 2: Bungkus Base64 biar bisa disimpan
            return SECRET_PREFIX + btoa(encrypted);
        } catch (e) { return data; }
    }

    // 2. BUKA DATA (Decrypt)
    function unlock(data) {
        try {
            if (!data) return null;
            if (!String(data).startsWith(SECRET_PREFIX)) return data;

            const raw = data.replace(SECRET_PREFIX, "");
            // Langkah 1: Buka bungkus Base64
            const decodedBase64 = atob(raw);
            // Langkah 2: Susun ulang pakai Key
            return cipher(decodedBase64, ENCRYPTION_KEY);
        } catch (e) { return data; }
    }

    // --- PEMBAJAKAN GUDANG ---
    Storage.prototype.setItem = function(key, value) {
        originalSetItem.call(this, key, lock(value));
    };

    Storage.prototype.getItem = function(key) {
        return unlock(originalGetItem.call(this, key));
    };

    // --- SAPU BERSIH ---
    setInterval(() => {
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                const raw = originalGetItem.call(localStorage, key);
                if (raw && !String(raw).startsWith(SECRET_PREFIX)) {
                    localStorage.setItem(key, raw);
                }
            }
        } catch(e) {}
    }, 2000);

    // --- BLOKIR IP ---
    async function startMonitoring() {
        try {
            const res = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ path: window.location.pathname, host: window.location.hostname })
            });
            const data = await res.json();
            if (data.status === "blocked") {
                document.body.innerHTML = '<h1 style="color:red;text-align:center;margin-top:20%">🚫 BLOCKED</h1>';
                window.stop();
            }
        } catch (e) {}
    }
    startMonitoring();
})();
