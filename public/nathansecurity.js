(function() {
    // --- KONFIGURASI PUSAT ---
    // Script ini akan selalu menghubungi server Vercel Anda
    const SERVER_HOST = "https://nathansecurity.vercel.app"; 
    const API_URL = SERVER_HOST + "/api/monitor";

    // Mencegah script berjalan ganda
    if (window.nathanSecurityActive) return;
    window.nathanSecurityActive = true;

    // ============================================================
    // BAGIAN 1: SISTEM KEAMANAN OTOMATIS (CCTV)
    // ============================================================
    async function startMonitoring() {
        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    path: window.location.pathname, // Halaman apa yang dibuka
                    host: window.location.hostname  // Website siapa yang pakai
                })
            });

            const data = await response.json();

            // JIKA DIBLOKIR OLEH SERVER
            if (data.status === "blocked") {
                executeBlock(data.ip);
            }

        } catch (e) {
            console.warn("NathanSecurity: Server unreachable, skipping checks.");
        }
    }

    // Fungsi Eksekusi Hukuman (Layar Hitam)
    function executeBlock(ip) {
        try { window.stop(); } catch(e){} // Matikan loading
        
        // Hapus tampilan website asli
        document.documentElement.innerHTML = '';
        document.documentElement.style.backgroundColor = "#000";

        // Tampilkan Pesan Seram
        document.body.innerHTML = `
            <div style="
                height: 100vh; display: flex; flex-direction: column; 
                justify-content: center; align-items: center; 
                font-family: 'Courier New', monospace; color: #ff3333; text-align: center;
                background-color: #000; z-index: 999999; position: fixed; top: 0; left: 0; width: 100%;
            ">
                <h1 style="font-size: 3rem; margin: 0;">🚫 AKSES DIBLOKIR</h1>
                <div style="margin-top: 30px; padding: 20px; border: 2px solid #ff3333; color: white; background: #1a0000; border-radius: 10px;">
                    <h2 style="margin:0; text-transform: uppercase;">Pelanggaran Terdeteksi</h2>
                    <p style="font-size: 1.2rem; margin-top: 10px; color: #ffaaaa;">
                        Sistem mendeteksi aktivitas mencurigakan (Spam/Scanning).
                    </p>
                </div>
                <p style="color: #666; margin-top: 20px;">IP Address: ${ip || 'Unknown'}</p>
                <p style="color: #444; font-size: 0.8rem;">Protected by NathanSecurity</p>
            </div>
        `;
        
        // Matikan Klik Kanan & Keyboard
        document.addEventListener('contextmenu', event => event.preventDefault());
        document.onkeydown = function(e) { return false; }
    }

    // Jalankan monitoring sekarang juga!
    startMonitoring();


    // ============================================================
    // BAGIAN 2: ALAT ENKRIPSI (UNTUK DIGUNAKAN KLIEN)
    // ============================================================
    // Ini membuat variabel global 'NathanSecurity' yang bisa dipakai orang
    window.NathanSecurity = {
        
        // Fungsi Simpan Data Aman (Encrypt)
        save: async function(key, data) {
            try {
                const res = await fetch(API_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "encrypt", data: data })
                });
                const json = await res.json();
                if (json.status === "success") {
                    localStorage.setItem(key, json.result);
                    console.log(`[NathanSecurity] Data '${key}' diamankan.`);
                    return true;
                }
            } catch (e) {
                console.error("[NathanSecurity] Gagal menyimpan:", e);
                return false;
            }
        },

        // Fungsi Baca Data Aman (Decrypt)
        load: async function(key) {
            const encrypted = localStorage.getItem(key);
            if (!encrypted) return null;
            try {
                const res = await fetch(API_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "decrypt", data: encrypted })
                });
                const json = await res.json();
                if (json.status === "success") {
                    return json.result;
                }
            } catch (e) {
                console.error("[NathanSecurity] Gagal membaca:", e);
                return null;
            }
        }
    };

    console.log("🛡️ NathanSecurity Loaded & Active");

})();
