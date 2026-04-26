package main

import (
    "crypto/aes"
    "crypto/cipher"
    "crypto/rand"
    "encoding/base64"
    "encoding/json"
    "io"
    "log"
    "net/http"
    "regexp"
    "strings"
    "sync"
    "time"
)

// URL Python di Vercel (Internal, user tidak tahu ini)
const PYTHON_VAULT_URL = "https://nathansecurity.vercel.app/api/monitor"

var cfg = struct {
    IpLimit     int
    BanDuration time.Duration
}{IpLimit: 15, BanDuration: 30 * time.Minute}

var (
    banList      = sync.Map{}
    rateLimiters = sync.Map{}
    dataCache    = sync.Map{} // Turbo Cache di RAM Go
)

var maliciousPatterns = []*regexp.Regexp{
    regexp.MustCompile(`(?i)(union\s+select|insert\s+into\s|drop\s+table)`),
    regexp.MustCompile(`(?i)(<script.*?>|javascript:\s*|onerror\s*=)`),
    regexp.MustCompile(`(\.\./|\.\.\\|%2e%2e)`),
    regexp.MustCompile(`(?i)(;\s*rm\s|;\s*wget\s|;\s*curl\s|` + "`" + `sleep\s)`),
}

// Fungsi untuk menyuruh Python mengerjakan tugasnya
func proxyToPython(body map[string]interface{}) (map[string]interface{}, error) {
    jsonBody, _ := json.Marshal(body)
    req, _ := http.NewRequest("POST", PYTHON_VAULT_URL, strings.NewReader(string(jsonBody)))
    req.Header.Set("Content-Type", "application/json")
    
    // Timeout ketat 2 detik, kalau Python lambat, biarkan mati, jangan menghambat Go
    client := &http.Client{Timeout: 2 * time.Second}
    resp, err := client.Do(req)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()
    
    var result map[string]interface{}
    json.NewDecoder(resp.Body).Decode(&result)
    return result, nil
}

func securityHandler(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Access-Control-Allow-Origin", "*")
    w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
    w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Api-Key")
    if r.Method == "OPTIONS" { w.WriteHeader(http.StatusOK); return }

    ip := r.Header.Get("X-Forwarded-For")
    if ip == "" { ip = strings.Split(r.RemoteAddr, ":")[0] }

    // 1. CEK BAN (RAM Go, Super Cepat)
    if _, banned := banList.Load(ip); banned {
        json.NewEncoder(w).Encode(map[string]interface{}{"status": "blocked", "ip": ip})
        return
    }

    // 2. BACA BODY
    var body map[string]interface{}
    json.NewDecoder(r.Body).Decode(&body)
    action, _ := body["action"].(string)
    payload, _ := body["data"].(string)

    // 3. CEK RACUN (RAM Go, Super Cepat)
    if payload != "" {
        for _, pattern := range maliciousPatterns {
            if pattern.MatchString(payload) {
                banList.Store(ip, true)
                go func() { time.Sleep(cfg.BanDuration); banList.Delete(ip) }()
                json.NewEncoder(w).Encode(map[string]interface{}{"status": "blocked", "reason": "MALICIOUS"})
                return
            }
        }
    }

    // 4. CEK RATE LIMIT (RAM Go, Super Cepat)
    now := time.Now().UnixNano()
    val, _ := rateLimiters.LoadOrStore(ip, &sync.Map{})
    ipMap := val.(*sync.Map{})
    count := 0
    ipMap.Range(func(k, _ interface{}) bool {
        if now-k.(int64) > 10000000000 { ipMap.Delete(k) } else { count++ }
        return true
    })
    ipMap.Store(now, true)
    if count > cfg.IpLimit { banList.Store(ip, true); json.NewEncoder(w).Encode(map[string]interface{}{"status": "blocked"}); return }

    // ==========================================
    // PROSES LOGIKA UTAMA
    // ==========================================
    
    // A. Jika LLM / API Normal -> Langsung Izinkan (Tanpa sentuh Python)
    if action == "" || (action != "hide_data" && action != "encrypt" && action != "decrypt") {
        json.NewEncoder(w).Encode(map[string]interface{}{"status": "allowed"})
        return
    }

    // B. Jika Hide Data -> Cek Cache RAM Go dulu
    if action == "hide_data" {
        cacheKey := payload
        if cached, found := dataCache.Load(cacheKey); found {
            json.NewEncoder(w).Encode(map[string]interface{}{"status": "success", "result": cached, "boosted": true})
            return
        }
        // Kalau tidak ada di cache, baru suruh Python
        pyResult, err := proxyToPython(body)
        if err == nil && pyResult["status"] == "success" {
            resStr := pyResult["result"].(string)
            dataCache.Store(cacheKey, resStr) // Simpan ke RAM Go
            json.NewEncoder(w).Encode(map[string]interface{}{"status": "success", "result": resStr, "boosted": false})
            return
        }
    }

    // C. Jika Encrypt / Decrypt -> Langsung lempar ke Python
    if action == "encrypt" || action == "decrypt" {
        pyResult, err := proxyToPython(body)
        if err == nil {
            json.NewEncoder(w).Encode(pyResult)
            return
        }
    }

    w.WriteHeader(http.StatusInternalServerError)
    json.NewEncoder(w).Encode(map[string]interface{}{"status": "PYTHON_VAULT_DOWN"})
}

func main() {
    log.Println("⚔️ Nathan Hybrid Engine (Go + Python) Started on :8080")
    http.HandleFunc("/api/monitor", securityHandler)
    http.ListenAndServe(":8080", nil)
}
