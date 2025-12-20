(async function() {
    // GANTI LINK INI SETELAH DEPLOY KE VERCEL
    // Contoh: "https://nathansecurity.vercel.app/api/monitor"
    const API_ENDPOINT = "/api/monitor"; 

    // Mencegah script berjalan ganda
    if (window.nathanSecurityActive) return;
    window.nathanSecurityActive = true;

    try {
        const response = await fetch(API_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                path: window.location.pathname, // Kirim path halaman saat ini
                host: window.location.hostname
            })
        });

        const data = await response.json();

        if (data.status === "blocked") {
            // TAMPILAN MODAL BLOKIR (Sangat Mengintimidasi)
            document.documentElement.innerHTML = '';
            document.documentElement.style.backgroundColor = "#0a0a0a";
            
            const warningHTML = `
                <div style="
                    height: 100vh; display: flex; flex-direction: column; 
                    justify-content: center; align-items: center; 
                    font-family: 'Courier New', monospace; color: #ff3333; text-align: center;
                ">
                    <h1 style="font-size: 4rem; margin: 0;">🚫 403 FORBIDDEN</h1>
                    <h2 style="color: white; margin-top: 20px;">IP ADDRESS BLOCKED</h2>
                    <p style="color: #666; margin-top: 10px;">IP: ${data.ip}</p>
                    <div style="
                        margin-top: 30px; padding: 15px; border: 1px solid #ff3333; 
                        color: #ff3333; font-weight: bold; letter-spacing: 2px;
                    ">
                        SECURITY VIOLATION DETECTED
                    </div>
                    <p style="color: #444; margin-top: 20px; font-size: 0.8rem;">
                        Block Expiry: 60 Minutes<br>
                        Powered by NathanSecurity
                    </p>
                </div>
            `;
            
            document.body.innerHTML = warningHTML;
            
            // Matikan fungsi klik kanan dan scroll
            document.addEventListener('contextmenu', event => event.preventDefault());
            document.body.style.overflow = 'hidden';
            
            // Hentikan proses loading web asli
            window.stop();
        }

    } catch (e) {
        // Jika API down, web klien tetap jalan normal (Silent Fail)
        console.warn("NathanSecurity: System Offline");
    }
})();