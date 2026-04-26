(function() {
    'use strict';
    
    console.log('🛡️ Nathan Security [Diagnostic Mode] Active');

    // HANYA popup klik kanan
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        const t = document.createElement('div');
        t.innerText = 'Nathan Security v3';
        t.style.cssText = 'position:fixed;bottom:30px;right:30px;background:#111;color:#fff;padding:15px 25px;border-radius:10px;z-index:999999;font-family:sans-serif;transition: opacity 0.3s;';
        document.body.appendChild(t);
        setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 2000);
    });

    // HANYA blokir F12 dan Ctrl+U
    document.addEventListener('keydown', function(e) {
        if (e.key === 'F12') { e.preventDefault(); return false; }
        if (e.ctrlKey && (e.key === 'u' || e.key === 's')) { e.preventDefault(); return false; }
    }, true);

})();
