(async function() {
    // ⚠️ PENTING: GANTI 'nathansecurity.vercel.app' DI BAWAH INI DENGAN DOMAIN VERCEL ANDA YANG ASLI!
    const API_ENDPOINT = "https://nathansecurity.vercel.app/api/monitor"; 

    // Mencegah script berjalan ganda
    if (window.nathanSecurityActive) return;
    window.nathanSecurityActive = true;

    try {
        const response = await fetch(API_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                path: window.location.pathname,
                host: window.location.hostname
            })
        });

        const data = await response.json();

        if (data.status === "blocked") {
            // LANGKAH 1: MATIKAN PAKSA LOADING WEB ASLI
            try { window.stop(); } catch(e){}

            // LANGKAH 2: HAPUS TOTAL SELURUH TAMPILAN WEBSITE
            // Layar akan jadi kosong seketika
            document.documentElement.innerHTML = '';
            document.documentElement.style.backgroundColor = "#000";

            // LANGKAH 3: TAMPILKAN PESAN "REFRESH BRUTAL"
            document.body.innerHTML = `
                <div style="
                    height: 100vh; display: flex; flex-direction: column; 
                    justify-content: center; align-items: center; 
                    font-family: 'Courier New', monospace; color: #ff3333; text-align: center;
                    background-color: #000;
                ">
                    <h1 style="font-size: 3rem; margin: 0;">🚫 AKSES DIBLOKIR</h1>
                    
                    <div style="
                        margin-top: 30px; padding: 20px; border: 2px solid #ff3333; 
                        color: white; background: #1a0000; border-radius: 10px;
                    ">
                        <h2 style="margin:0; text-transform: uppercase;">Pelanggaran Terdeteksi</h2>
                        <p style="font-size: 1.2rem; margin-top: 10px; color: #ffaaaa;">
                            Anda melakukan <b>REFRESH BRUTAL</b> (Spamming).
                        </p>
                    </div>

                    <p style="color: #666; margin-top: 20px;">IP Address: ${data.ip}</p>
                    <p style="color: #444; font-size: 0.8rem;">
                        Block Expiry: 60 Minutes<br>
                        Powered by NathanSecurity
                    </p>
                </div>
            `;
            
            // Matikan fungsi klik kanan dan scroll agar user tidak bisa apa-apa
            document.body.style.overflow = 'hidden';
            document.addEventListener('contextmenu', event => event.preventDefault());
        }

    } catch (e) {
        // Silent fail: Jika server down, biarkan web asli jalan normal
    }
})();
