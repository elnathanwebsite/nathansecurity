(function() {
    const CONFIG = {
        API_URL: "https://nathansecurity.vercel.app/api/monitor",
        SECRET_PREFIX: "NS_SECURE::",
        API_TIMEOUT: 500 
    };

    if (window.nathanSecurityActive) return;
    window.nathanSecurityActive = true;
    const originalSetItem = Storage.prototype.setItem;
    const originalGetItem = Storage.prototype.getItem;
    const CORE_SENSITIVE_PATTERNS = [
        /@gmail\.com/i, /@yahoo\.com/i, /@outlook\.com/i, 
        /user_token/i, /api_token/i, /access_token/i, /refresh_token/i, 
        /password/i, /email/i, /name/i, /phone/i, /address/i 
    ];
    function containsSensitivePattern(valueStr) {
        return CORE_SENSITIVE_PATTERNS.some(pattern => pattern.test(valueStr));
    }
    function hasSensitiveDataRecursively(data) {
        if (typeof data === 'string') {
            return containsSensitivePattern(data);
        }
        if (typeof data === 'object' && data !== null) {
            for (const key in data) {
                if (hasSensitiveDataRecursively(data[key])) {
                    return true;
                }
            }
        }
        return false;
    }
    function shouldEncryptData(value) {
        if (typeof value !== 'string') {
            return false;
        }

        const valueStr = value;

        try {
            const parsedValue = JSON.parse(valueStr);
            return hasSensitiveDataRecursively(parsedValue);
        } catch (e) {
            return containsSensitivePattern(valueStr);
        }
    }
    function decrypt(data) {
        try {
            if (!data) return null;
            if (!String(data).startsWith(CONFIG.SECRET_PREFIX)) return data;

            const cleanStr = data.replace(CONFIG.SECRET_PREFIX, "");
            return decodeURIComponent(atob(cleanStr.split('').reverse().join('')));
        } catch(e) {
            return data;
        }
    }
    function encrypt(data) {
        try {
            const str = String(data);
            if (str.startsWith(CONFIG.SECRET_PREFIX)) return str;
            return CONFIG.SECRET_PREFIX + btoa(encodeURIComponent(str)).split('').reverse().join('');
        } catch(e) {
            return CONFIG.SECRET_PREFIX + btoa(encodeURIComponent(str)).split('').reverse().join('');
        }
    }
    Storage.prototype.setItem = function(key, value) {
        if (shouldEncryptData(value)) {
            const secureValue = encrypt(value);
            originalSetItem.call(this, key, secureValue);
        } else {
            originalSetItem.call(this, key, value);
        }
    };
    Storage.prototype.getItem = function(key) {
        const rawValue = originalGetItem.call(this, key);
        return decrypt(rawValue);
    };
    setInterval(() => {
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                const rawValue = originalGetItem.call(localStorage, key);
                if (rawValue && shouldEncryptData(rawValue) && !String(rawValue).startsWith(CONFIG.SECRET_PREFIX)) {
                    localStorage.setItem(key, rawValue); 
                }
            }
        } catch (e) {}
    }, 10000); 
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
