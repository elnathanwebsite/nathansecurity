// ==========================================
// 🚀 NATHAN SERVICE WORKER (INTERCEPTOR)
// ==========================================
const CACHE_NAME = 'nathan-v1';
const GO_URL = 'https://nathansecurity.vercel.app/api/performance';

// Daftar file yang BOLEH lewat tanpa dicek
const ALLOWED_EXT = ['css', 'js', 'png', 'jpg', 'jpeg', 'gif', 'svg', 'woff', 'woff2', 'ttf'];

self.addEventListener('install', (event) => {
  self.skipWaiting(); // Aktifkan langsung tanpa reload
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim()); // Ambil alih semua tab yang terbuka
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // 1. JANGAN ganggu request ke NathanSecurity, Vercel, Google Fonts, dll
  if (url.hostname.includes('vercel.app') || 
      url.hostname.includes('googleapis.com') || 
      url.hostname.includes('gstatic.com') ||
      url.hostname.includes('jsdelivr.net') ||
      url.hostname.includes('cloudflare.com') ||
      url.protocol === 'chrome-extension:') {
    return; // Luruskan saja, tidak usah di-cache
  }

  // 2. JANGAN ganggu file statis (CSS, Gambar, Font)
  const ext = url.pathname.split('.').pop().toLowerCase();
  if (ALLOWED_EXT.includes(ext)) {
    return; // Biarkan browser yang handle cache bawaannya
  }

  // 3. SASARAN: Hanya file API (admin.php) yang mengembalikan JSON
  if (event.request.method === 'POST' || event.request.method === 'GET') {
    event.respondWith(handleAPIRequest(event.request, url));
  } else {
    return; // Method lain (OPTIONS, dll) dibiarkan
  }
});

async function handleAPIRequest(request, url) {
  try {
    // Buat Key Cache berdasarkan URL dan Body (jika POST)
    let cacheKey = url.href;
    if (request.method === 'POST' && request.body) {
      const bodyClone = await request.clone().text();
      cacheKey = url.href + '::' + bodyClone;
    }

    // CEK 1: Apakah datanya sudah ada di Golang (Proxy)?
    const goResponse = await fetch(GO_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'get_cache', key: cacheKey })
    });

    if (goResponse.ok) {
      const goData = await goResponse.json();
      
      // Kalau Golang bilang "ADA", langsung kembalikan data super cepat
      if (goData.status === 'hit' && goData.data) {
        return new Response(goData.data, {
          status: 200,
          statusText: 'OK',
          headers: { 'Content-Type': 'application/json', 'X-Cache': 'GO-RAM-HIT' }
        });
      }
    }

    // CEK 2: Kalau belum ada di Golang, minta ke server web pelanggan asli
    const originalResponse = await fetch(request);
    
    if (originalResponse.ok) {
      const responseClone = originalResponse.clone();
      const responseText = await responseClone.text();

      // KIRIM KE GOLANG UNTUK DISIMPAN DI RAM
      // Kita pakai fetch biasa tanpa await supaya tidak makan waktu loading
      fetch(GO_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set_cache', key: cacheKey, data: responseText })
      });

      return originalResponse; // Kembalikan data asli ke user
    }

    return originalResponse;

  } catch (error) {
    // Jika Golang error atau koneksi putus, tetap kembalikan request asli (Fail-safe)
    return fetch(request);
  }
}
