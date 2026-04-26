// ==========================================
// 🛡️ NATHAN SECURITY v3 - CDN FINAL MASTERPIECE
// ==========================================
(function() {
    'use strict';
    if (window.__NathanFinalActive) return;
    window.__NathanFinalActive = true;

    // ==========================================
    // FASE 1: BERJALAN LANGSUNG (Aman, tidak ganggu sistem)
    // ==========================================
    
    // 1. Blokir Inspect Element & View Source
    document.addEventListener('keydown', function(e) {
        const k = e.key.toLowerCase();
        if (k === 'f12') { e.preventDefault(); return false; }
        if (e.ctrlKey && (k === 'u' || k === 's')) { e.preventDefault(); return false; }
        if (e.ctrlKey && e.shiftKey && (k === 'i' || k === 'j' || k === 'c')) { e.preventDefault(); return false; }
    }, true);

    // 2. Blokir Klik Kanan langsung (tanpa popup dulu)
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
    }, true);

    // 3. Preconnect ke server NathanSecurity
    const l = document.createElement('link');
    l.rel = 'preconnect';
    l.href = 'https://nathansecurity.vercel.app';
    document.head.appendChild(l);


    // ==========================================
    // FASE 2: BERJALAN SETIAP WEB SELESAI LOAD (Aman 100%)
    // ==========================================
    window.addEventListener('load', function() {
        
        // Tunggu 1.5 detik setelah web selesai load, memastikan database & iframe sudah tampil semua
        setTimeout(function() {

            // A. Pasang Popup Klik Kanan (Kita override event sekarang)
            const LOGO_URL = "https://i.ibb.co.com/4wNrYy7n/python-vs-go-slim.png";
            const imgPreload = new Image();
            imgPreload.src = LOGO_URL;
            let popupCooldown = false;

            document.addEventListener('contextmenu', function(e) {
                e.preventDefault();
                e.stopPropagation();
                if (popupCooldown) return;
                popupCooldown = true;
                setTimeout(() => popupCooldown = false, 5000);

                // Hapus popup lama jika ada
                const oldPopup = document.getElementById('ns-sec-popup');
                if (oldPopup) oldPopup.remove();

                const securityPopup = document.createElement('div');
                securityPopup.id = 'ns-sec-popup';
                securityPopup.innerHTML = `
                    <div style="width:100%;display:flex;justify-content:center;margin-bottom:16px;"><img src="${LOGO_URL}" alt="Nathan Security" style="width:200px;border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,0.10);" onerror="this.style.display='none'"></div>
                    <div style="font-weight:800;font-size:18px;color:#111827;text-align:center;margin-bottom:8px;">Nathan Security</div>
                    <div style="text-align:center;font-size:10px;font-weight:700;color:#00ADD8;letter-spacing:1.5px;background:rgba(0,173,216,0.08);display:block;width:fit-content;margin:0 auto 16px;padding:4px 14px;border-radius:20px;">SHIELD ACTIVE</div>
                    <div style="font-size:12px;color:#6b7280;text-align:center;line-height:1.6;margin-bottom:16px;">Akses inspeksi halaman dibatasi untuk melindungi integritas data.</div>
                    <div style="display:flex;gap:10px;margin-bottom:16px;">
                        <div style="flex:1;padding:14px;border-radius:10px;background:linear-gradient(135deg,rgba(0,173,216,0.05),rgba(0,173,216,0.01));border:1px solid rgba(0,173,216,0.12);">
                            <div style="font-size:13px;font-weight:700;color:#111827;margin-bottom:3px;">Golang <span style="color:#00ADD8;">Engine</span></div>
                            <div style="font-size:11px;color:#6b7280;line-height:1.4;">Rate limiting, cache kilat, anti DDoS.</div>
                        </div>
                        <div style="flex:1;padding:14px;border-radius:10px;background:linear-gradient(135deg,rgba(55,118,171,0.05),rgba(55,118,171,0.01));border:1px solid rgba(55,118,171,0.12);">
                            <div style="font-size:13px;font-weight:700;color:#111827;margin-bottom:3px;">Python <span style="color:#3776AB;">Vault</span></div>
                            <div style="font-size:11px;color:#6b7280;line-height:1.4;">Enkripsi data, validasi SQLi/XSS.</div>
                        </div>
                    </div>
                    <div style="padding-top:14px;border-top:1px solid #f3f4f6;font-size:10px;color:#9ca3af;text-align:center;">Shield v3.0 · Protected Environment</div>
                `;

                securityPopup.style.cssText = 'position:fixed;bottom:28px;right:28px;background:#ffffff;border:1px solid #e5e7eb;padding:24px;border-radius:16px;font-family:-apple-system,sans-serif;z-index:999999;width:340px;box-shadow:0 20px 60px rgba(0,0,0,0.12);pointer-events:none;opacity:0;transform:translateY(16px) scale(0.97);transition:all 0.35s cubic-bezier(0.16, 1, 0.3, 1);';
                document.body.appendChild(securityPopup);

                requestAnimationFrame(() => {
                    securityPopup.style.opacity = '1';
                    securityPopup.style.transform = 'translateY(0) scale(1)';
                });

                setTimeout(() => {
                    if (securityPopup) {
                        securityPopup.style.opacity = '0';
                        securityPopup.style.transform = 'translateY(16px) scale(0.97)';
                        setTimeout(() => securityPopup.remove(), 350);
                    }
                }, 4000);
            }, true);


            // B. Proteksi Print (Menyusup diam-diam)
            const printStyle = document.createElement('style');
            printStyle.id = 'nathan-print-shield';
            printStyle.media = 'print';
            printStyle.textContent = `body * { display: none !important; } body::after { content: "NATHAN SECURITY - PRINT DISABLED"; display: flex !important; justify-content: center !important; align-items: center !important; position: fixed !important; top: 0 !important; left: 0 !important; width: 100vw !important; height: 100vh !important; background: #fff !important; font-family: sans-serif !important; font-size: 28px !important; font-weight: 700 !important; color: #dc2626 !important; z-index: 999999999 !important; }`;
            document.head.appendChild(printStyle);

            document.addEventListener('keydown', function(e) {
                if ((e.ctrlKey || e.metaKey) && e.key === 'p') { 
                    e.preventDefault(); e.stopPropagation(); 
                    showMiniToast('🖨️ Print dinonaktifkan'); 
                    return false; 
                }
            }, true);


            // C. Proteksi Salin (Watermark)
            document.addEventListener('copy', function(e) {
                const sel = window.getSelection().toString();
                if (sel.length > 0) {
                    if (/@gmail\.com|@yahoo\.com|password|credit.?card/i.test(sel)) { 
                        e.preventDefault(); showMiniToast('🔒 Data sensitif tidak dapat disalin'); return; 
                    }
                    e.clipboardData.setData('text/plain', sel + '\n\n━━━━━━━━━━━━━━━━\n🛡️ Nathan Security\n📅 ' + new Date().toLocaleString('id-ID') + '\n━━━━━━━━━━━━━━━━');
                    e.preventDefault();
                }
            }, true);


            // D. Proteksi Screenshot
            if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
                navigator.mediaDevices.getDisplayMedia = function() {
                    showMiniToast('📸 Screenshot diblokir');
                    return Promise.reject(new Error('Blocked'));
                };
            }


            // E. Heartbeat ke Server (Hanya setelah semua aman)
            async function startHealthCheck() {
                try {
                    const PERF_API = "https://nathansecurity.vercel.app/api/performance";
                    const SEC_API = "https://nathansecurity.vercel.app/api/monitor";
                    
                    const g = await fetch(PERF_API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "health_check" }) }).then(r => r.json()).catch(() => null);
                    if (g && g.status === "blocked") { window.stop(); document.body.innerHTML = '<div style="display:flex;justify-content:center;align-items:center;height:100vh;background:#0f172a;color:#dc2626;font-size:24px;font-weight:bold;font-family:sans-serif;">⛔ ACCESS DENIED</div>'; return; }
                    
                    const p = await fetch(SEC_API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "heartbeat" }) }).then(r => r.json()).catch(() => null);
                    if (p && p.status === "blocked") { window.stop(); document.body.innerHTML = '<div style="display:flex;justify-content:center;align-items:center;height:100vh;background:#0f172a;color:#dc2626;font-size:24px;font-weight:bold;font-family:sans-serif;">⛔ ACCESS DENIED</div>'; return; }
                } catch (e) {}
            }
            startHealthCheck();

        }, 1500); // <-- DELAY 1.5 DETIK MAGIS DI SINI
    });


    // ==========================================
    // UTILITAS (DI LUAR LOAD EVENT)
    // ==========================================
    let toastActive = false;
    function showMiniToast(msg) {
        if (toastActive) return;
        toastActive = true;
        const t = document.createElement('div');
        t.textContent = msg;
        t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(20px);background:#1f2937;color:#fff;padding:12px 24px;border-radius:10px;font-family:-apple-system,sans-serif;font-size:13px;font-weight:500;z-index:9999999;box-shadow:0 8px 24px rgba(0,0,0,0.2);opacity:0;transition:all 0.3s ease;pointer-events:none;white-space:nowrap;';
        document.body.appendChild(t);
        requestAnimationFrame(() => { t.style.opacity = '1'; t.style.transform = 'translateX(-50%) translateY(0)'; });
        setTimeout(() => {
            t.style.opacity = '0'; t.style.transform = 'translateX(-50%) translateY(20px)';
            setTimeout(() => { t.remove(); toastActive = false; }, 300);
        }, 2500);
    }

    console.log('%c🛡️ Nathan Security Shield v3 (Final CDN) Active', 'color: #00ADD8; font-size: 14px; font-weight: bold;');

})();
