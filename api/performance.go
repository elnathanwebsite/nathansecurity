package main

import (
    "bytes"
    "context"
    "encoding/json"
    "io"
    "log"
    "net/http"
    "regexp"
    "strings"
    "sync"
    "sync/atomic"
    "time"
)

const pythonVaultURL = "https://nathansecurity.vercel.app/api/monitor"

var (
    ipLimit     = 15
    banDuration = 30 * time.Minute
    cacheTTL    = 5 * time.Minute
)

// ═══════════════════════════════════════════
// RATE LIMITER - Ring Buffer O(1)
// ═══════════════════════════════════════════
type ipState struct {
    banned    int32
    banExpiry int64
    ts        [32]int64
    head      int32
    size      int32
    mu        sync.Mutex
}

func (s *ipState) isBanned(now int64) bool {
    if atomic.LoadInt32(&s.banned) == 0 {
        return false
    }
    if now > atomic.LoadInt64(&s.banExpiry) {
        atomic.StoreInt32(&s.banned, 0)
        return false
    }
    return true
}

func (s *ipState) ban(now int64) {
    atomic.StoreInt32(&s.banned, 1)
    atomic.StoreInt64(&s.banExpiry, now+int64(banDuration))
}

func (s *ipState) allow(now int64) bool {
    s.mu.Lock()
    defer s.mu.Unlock()

    window := now - int64(10*time.Second)
    valid := int32(0)

    for i := int32(0); i < s.size; i++ {
        idx := (s.head - s.size + i + 32) % 32
        if s.ts[idx] > window {
            s.ts[valid] = s.ts[idx]
            valid++
        }
    }

    s.size = valid
    if valid >= int32(ipLimit) {
        return false
    }

    s.head = (s.head + 1) % 32
    s.ts[s.head] = now
    s.size++
    return true
}

var ipStates sync.Map

func getIPState(ip string) *ipState {
    val, _ := ipStates.LoadOrStore(ip, &ipState{})
    return val.(*ipState)
}

// ═══════════════════════════════════════════
// CACHE WITH TTL
// ═══════════════════════════════════════════
type cacheEntry struct {
    data      string
    expiresAt int64
}

var dataCache sync.Map

func cacheGet(key string) (string, bool) {
    val, ok := dataCache.Load(key)
    if !ok {
        return "", false
    }
    e := val.(*cacheEntry)
    if time.Now().UnixNano() > e.expiresAt {
        dataCache.Delete(key)
        return "", false
    }
    return e.data, true
}

func cacheSet(key string, data string) {
    dataCache.Store(key, &cacheEntry{
        data:      data,
        expiresAt: time.Now().Add(cacheTTL).UnixNano(),
    })
}

func startCacheCleaner() {
    ticker := time.NewTicker(10 * time.Minute)
    go func() {
        for range ticker.C {
            now := time.Now().UnixNano()
            dataCache.Range(func(key, val interface{}) bool {
                if val.(*cacheEntry).expiresAt < now {
                    dataCache.Delete(key)
                }
                return true
            })
        }
    }()
}

// ═══════════════════════════════════════════
// BUFFER POOL
// ═══════════════════════════════════════════
var bufPool = sync.Pool{
    New: func() interface{} { return new(bytes.Buffer) },
}

// ═══════════════════════════════════════════
// SINGLE HTTP CLIENT (Connection Reuse)
// ═══════════════════════════════════════════
var httpClient = &http.Client{
    Timeout: 2 * time.Second,
    Transport: &http.Transport{
        MaxIdleConns:        100,
        MaxIdleConnsPerHost: 100,
        IdleConnTimeout:     90 * time.Second,
        ForceAttemptHTTP2:   true,
    },
}

// ═══════════════════════════════════════════
// PRE-BUILT RESPONSES
// ═══════════════════════════════════════════
var (
    respAllowed    = []byte(`{"status":"allowed"}`)
    respBlocked    = []byte(`{"status":"blocked"}`)
    respMalicious  = []byte(`{"status":"blocked","reason":"MALICIOUS"}`)
    respPythonDown = []byte(`{"status":"PYTHON_VAULT_DOWN"}`)
)

// ═══════════════════════════════════════════
// MALICIOUS PATTERNS (Split for early exit)
// ═══════════════════════════════════════════
var maliciousPatterns = []*regexp.Regexp{
    regexp.MustCompile(`(?i)union\s+select`),
    regexp.MustCompile(`(?i)insert\s+into\s`),
    regexp.MustCompile(`(?i)drop\s+table`),
    regexp.MustCompile(`(?i)<script`),
    regexp.MustCompile(`(?i)javascript:`),
    regexp.MustCompile(`(?i)onerror\s*=`),
    regexp.MustCompile(`\.\.\/`),
    regexp.MustCompile(`\.\.\\`),
    regexp.MustCompile(`(?i)%2e%2e`),
    regexp.MustCompile(`;\s*rm\s`),
    regexp.MustCompile(`;\s*wget\s`),
    regexp.MustCompile(`;\s*curl\s`),
    regexp.MustCompile("(?i)`sleep\\s"),
}

func isMalicious(s string) bool {
    if len(s) < 4 {
        return false
    }
    for i := range maliciousPatterns {
        if maliciousPatterns[i].MatchString(s) {
            return true
        }
    }
    return false
}

// ═══════════════════════════════════════════
// PROXY TO PYTHON
// ═══════════════════════════════════════════
func proxyToPython(body map[string]interface{}) (map[string]interface{}, error) {
    buf := bufPool.Get().(*bytes.Buffer)
    buf.Reset()
    json.NewEncoder(buf).Encode(body)

    req, err := http.NewRequestWithContext(
        context.Background(),
        "POST",
        pythonVaultURL,
        buf,
    )
    if err != nil {
        bufPool.Put(buf)
        return nil, err
    }
    req.Header.Set("Content-Type", "application/json")

    resp, err := httpClient.Do(req)
    bufPool.Put(buf)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()

    var result map[string]interface{}
    json.NewDecoder(resp.Body).Decode(&result)
    return result, nil
}

// ═══════════════════════════════════════════
// MAIN HANDLER
// ═══════════════════════════════════════════
func securityHandler(w http.ResponseWriter, r *http.Request) {
    // CORS Preflight
    if r.Method == "OPTIONS" {
        w.Header().Set("Access-Control-Allow-Origin", "*")
        w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
        w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Api-Key")
        w.WriteHeader(http.StatusOK)
        return
    }

    // Extract IP
    ip := r.Header.Get("X-Forwarded-For")
    if ip == "" {
        ip = r.RemoteAddr
        if idx := strings.LastIndexByte(ip, ':'); idx != -1 {
            ip = ip[:idx]
        }
    } else if idx := strings.IndexByte(ip, ','); idx != -1 {
        ip = strings.TrimSpace(ip[:idx])
    }

    // IP State check
    state := getIPState(ip)
    now := time.Now().UnixNano()

    if state.isBanned(now) {
        w.Header().Set("Content-Type", "application/json")
        w.Write(respBlocked)
        return
    }

    // Read body (limit 64KB)
    bodyBytes, _ := io.ReadAll(io.LimitReader(r.Body, 65536))

    var req map[string]interface{}
    if len(bodyBytes) > 2 {
        json.Unmarshal(bodyBytes, &req)
    }

    action, _ := req["action"].(string)
    payload, _ := req["data"].(string)

    // Malicious check
    if len(payload) > 3 && isMalicious(payload) {
        state.ban(now)
        w.Header().Set("Content-Type", "application/json")
        w.Write(respMalicious)
        return
    }

    // Rate limit
    if !state.allow(now) {
        state.ban(now)
        w.Header().Set("Content-Type", "application/json")
        w.Write(respBlocked)
        return
    }

    // Set headers
    w.Header().Set("Content-Type", "application/json")
    w.Header().Set("Access-Control-Allow-Origin", "*")

    // Fast path: not our actions
    if action != "hide_data" && action != "encrypt" && action != "decrypt" {
        w.Write(respAllowed)
        return
    }

    // Hide data with cache
    if action == "hide_data" {
        if cached, ok := cacheGet(payload); ok {
            w.Write([]byte(`{"status":"success","result":"` + cached + `","boosted":true}`))
            return
        }

        result, err := proxyToPython(req)
        if err == nil && result["status"] == "success" {
            if resStr, ok := result["result"].(string); ok {
                cacheSet(payload, resStr)
                w.Write([]byte(`{"status":"success","result":"` + resStr + `","boosted":false}`))
                return
            }
        }
        w.WriteHeader(http.StatusInternalServerError)
        w.Write(respPythonDown)
        return
    }

    // Encrypt/Decrypt
    result, err := proxyToPython(req)
    if err != nil {
        w.WriteHeader(http.StatusInternalServerError)
        w.Write(respPythonDown)
        return
    }

    buf := bufPool.Get().(*bytes.Buffer)
    buf.Reset()
    json.NewEncoder(buf).Encode(result)
    w.Write(buf.Bytes())
    bufPool.Put(buf)
}

// ═══════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════
func init() {
    startCacheCleaner()
}

func main() {
    server := &http.Server{
        Addr:              ":" + port(),
        ReadHeaderTimeout: 3 * time.Second,
        ReadTimeout:       8 * time.Second,
        WriteTimeout:      8 * time.Second,
        IdleTimeout:       120 * time.Second,
        MaxHeaderBytes:    4096,
    }

    http.HandleFunc("/api/monitor", securityHandler)

    log.Println("⚡ Nathan Ultra-Fast Engine v2 Started")
    server.ListenAndServe()
}

func port() string {
    p := os.Getenv("PORT")
    if p == "" {
        p = "8080"
    }
    return p
}
