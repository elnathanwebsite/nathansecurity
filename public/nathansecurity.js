(function() {
    // --- KONFIGURASI PUSAT ---
    // Ganti domain ini jika nanti Anda punya domain custom sendiri
    const SERVER_HOST = "https://nathansecurity.vercel.app"; 
    const API_URL = SERVER_HOST + "/api/monitor";

    // Mencegah script berjalan ganda (Singleton)
    if (window.nathanSecurityActive) return;
    window.nathanSecurityActive = true;

    console.log("🛡️ NathanSecurity: System Active (Stealth + Protection Mode)");

    // ============================================================
    // BAGIAN 1: FITUR "STEALTH MODE" (MENYEMBUNYIKAN DATA)
    // ============================================================
    // Fitur ini membajak LocalStorage browser agar datanya terlihat acak
    
    const originalSetItem = Storage.prototype.setItem;
    const originalGetItem = Storage.prototype.getItem;

    // Fungsi Pengacak (Scrambler) - Ringan & Cepat
    function scramble(str) {
        try {
            // Menambahkan tanda 'NS::' dan mengacak text base64
            return "NS::" + btoa(encodeURIComponent(str)).split('').reverse().join('');
        } catch(e) { return str; }
    }

    // Fungsi Pemulih (Unscrambler)
    function unscramble(str) {
        try {
            // Cek apakah data ini dienkripsi oleh kita?
            if (!str || !str.startsWith("NS::")) return str; 
            
            // Jika ya, kembalikan ke bentuk asal
            let cleanStr = str.replace("NS::", "");
            return decodeURIComponent(atob(cleanStr.split('').reverse().join('')));
        } catch(e) { return str; }
    }

    // A. PEMBAJAKAN FUNGSI SIMPAN (Saat website mau simpan data)
    Storage.prototype.setItem = function(key, value) {
        // Data asli langsung diacak sebelum masuk memori browser
        const hiddenValue = scramble(String(value));
        originalSetItem.call(this, key, hiddenValue);
    };

    // B. PEMBAJAKAN FUNGSI AMBIL (Saat website butuh datanya kembali)
    Storage.prototype.getItem = function(key) {
        const hiddenValue = originalGetItem.call(this, key);
        // Pulihkan data acak menjadi data asli agar website tidak error
        return unscramble(hiddenValue);
    };

    console.log("🔒 LocalStorage Obfuscation: ENABLED");


    // ============================================================
    // BAGIAN 2: FITUR "SECURITY MODE" (BLOKIR IP SPAM)
    // ============================================================
    // Fitur ini menghubungi Python di Vercel untuk cek status IP
    
    async function startMonitoring() {
        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    path: window.location.pathname, // Halaman yang dibuka
                    host: window.location.hostname  // Website klien
                })
            });

            const data = await response.json();

            // JIKA STATUS DIBLOKIR -> EKSEKUSI MATI
            if (data.status === "blocked") {
                executeBlock(data.ip);
            }

        } catch (e) {
            // Fail-safe: Jika server Vercel down, website klien tetap jalan normal
            console.warn("NathanSecurity: Server check skipped.");
        }
    }

    // FUNGSI LAYAR HITAM (BLOCK SCREEN)
    function executeBlock(ip) {
        try { window.stop(); } catch(e){} // Paksa berhenti loading
        
        // Hapus seluruh tampilan website asli
        document.documentElement.innerHTML = '';
        document.documentElement.style.backgroundColor = "#000";

        // Tampilkan Pesan Peringatan
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
                    <h3 style="color: #ffcccc; margin: 0 0 10px 0; text-transform: uppercase;">
                        Suspicious Activity Detected
                    </h3>
                    <p style="color: #ff6666; font-size: 1rem;">
                        Sistem mendeteksi perilaku Spam Refresh atau Scanning dari perangkat Anda.
                        Akses diblokir sementara demi keamanan.
                    </p>
                </div>

                <div style="margin-top: 30px; color: #444; font-size: 0.8rem;">
                    <p>IP Address: <span style="color: #666;">${ip || 'Hidden'}</span></p>
                    <p>Protected by <b>NathanSecurity</b></p>
                </div>
            </div>
        `;

        // Matikan Klik Kanan
        document.addEventListener('contextmenu', event => event.preventDefault());
        
        // Matikan Keyboard (F12, Ctrl+U, dll)
        document.onkeydown = function(e) {
            return false;
        }
    }

    // JALANKAN PENGECEKAN KEAMANAN SEKARANG
    startMonitoring();

})();
