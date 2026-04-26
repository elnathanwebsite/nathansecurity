package main

import (
    "bytes"
    "context"
    "encoding/json"
    "io"
    "net/http"
    "os"
    "regexp"
    "strings"
    "sync"
    "sync/atomic"
    "time"
)

type ipStateM struct {
    banned    int32
    banExpiry int64
    ts        [32]int64
    head      int32
    size      int32
    mu        sync.Mutex
}

func (s *ipStateM) isBanned(now int64) bool {
    if atomic.LoadInt32(&s.banned) == 0 {
        return false
    }
    if now > atomic.LoadInt64(&s.banExpiry) {
        atomic.StoreInt32(&s.banned, 0)
        return false
    }
    return true
}

func (s *ipStateM) ban(now int64) {
    atomic.StoreInt32(&s.banned, 1)
    atomic.StoreInt64(&s.banExpiry, now+int64(30*time.Minute))
}

func (s *ipStateM) allow(now int64) bool {
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
    if valid >= 15 {
        return false
    }
    s.head = (s.head + 1) % 32
    s.ts[s.head] = now
    s.size++
    return true
}

var ipStatesM sync.Map

func getIPStateM(ip string) *ipStateM {
    val, _ := ipStatesM.LoadOrStore(ip, &ipStateM{})
    return val.(*ipStateM)
}

var maliciousM = []*regexp.Regexp{
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
    regexp.MustCompile("`sleep\\s"),
}

func isMaliciousM(s string) bool {
    if len(s) < 4 {
        return false
    }
    for i := range maliciousM {
        if maliciousM[i].MatchString(s) {
            return true
        }
    }
    return false
}

func monitorHandler(w http.ResponseWriter, r *http.Request) {
    if r.Method == "OPTIONS" {
        w.Header().Set("Access-Control-Allow-Origin", "*")
        w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
        w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Api-Key")
        w.WriteHeader(http.StatusOK)
        return
    }

    ip := r.Header.Get("X-Forwarded-For")
    if ip == "" {
        ip = r.RemoteAddr
        if idx := strings.LastIndexByte(ip, ':'); idx != -1 {
            ip = ip[:idx]
        }
    } else if idx := strings.IndexByte(ip, ','); idx != -1 {
        ip = strings.TrimSpace(ip[:idx])
    }

    state := getIPStateM(ip)
    now := time.Now().UnixNano()

    if state.isBanned(now) {
        w.Header().Set("Content-Type", "application/json")
        w.Write([]byte(`{"status":"blocked"}`))
        return
    }

    bodyBytes, _ := io.ReadAll(io.LimitReader(r.Body, 65536))
    var req map[string]interface{}
    if len(bodyBytes) > 2 {
        json.Unmarshal(bodyBytes, &req)
    }

    action, _ := req["action"].(string)
    payload, _ := req["data"].(string)

    if len(payload) > 3 && isMaliciousM(payload) {
        state.ban(now)
        w.Header().Set("Content-Type", "application/json")
        w.Write([]byte(`{"status":"blocked","reason":"MALICIOUS"}`))
        return
    }

    if !state.allow(now) {
        state.ban(now)
        w.Header().Set("Content-Type", "application/json")
        w.Write([]byte(`{"status":"blocked"}`))
        return
    }

    w.Header().Set("Content-Type", "application/json")
    w.Header().Set("Access-Control-Allow-Origin", "*")

    if action == "heartbeat" {
        w.Write([]byte(`{"status":"alive","engine":"python-monitor"}`))
        return
    }

    if action == "encrypt" || action == "decrypt" || action == "hide_data" {
        buf := bufPoolM.Get().(*bytes.Buffer)
        buf.Reset()
        json.NewEncoder(buf).Encode(req)
        proxyReq, err := http.NewRequestWithContext(context.Background(), "POST", "https://nathansecurity.vercel.app/api/monitor", buf)
        if err != nil {
            bufPoolM.Put(buf)
            w.WriteHeader(500)
            w.Write([]byte(`{"status":"PYTHON_VAULT_DOWN"}`))
            return
        }
        proxyReq.Header.Set("Content-Type", "application/json")
        resp, err := httpClientM.Do(proxyReq)
        bufPoolM.Put(buf)
        if err != nil {
            w.WriteHeader(500)
            w.Write([]byte(`{"status":"PYTHON_VAULT_DOWN"}`))
            return
        }
        defer resp.Body.Close()
        var result map[string]interface{}
        json.NewDecoder(resp.Body).Decode(&result)
        json.NewEncoder(w).Encode(result)
        return
    }

    w.Write([]byte(`{"status":"allowed"}`))
}

var bufPoolM = sync.Pool{
    New: func() interface{} { return new(bytes.Buffer) },
}

var httpClientM = &http.Client{
    Timeout: 2 * time.Second,
    Transport: &http.Transport{
        MaxIdleConns:        100,
        MaxIdleConnsPerHost: 100,
        IdleConnTimeout:     90 * time.Second,
        ForceAttemptHTTP2:   true,
    },
}

func main() {
    port := os.Getenv("PORT")
    if port == "" {
        port = "8080"
    }
    http.HandleFunc("/", monitorHandler)
    http.ListenAndServe(":"+port, nil)
}
