package main

import (
    "bytes"
    "context"
    "encoding/json"
    "log"
    "net/http"
    "regexp"
    "strings"
    "sync"
    "sync/atomic"
    "time"

    "github.com/valyala/fasthttp"
)

const pythonVaultURL = "https://nathansecurity.vercel.app/api/monitor"

// ... (ipState, cache, patterns sama seperti di atas) ...

var (
    httpClient = &http.Client{
        Timeout: 2 * time.Second,
        Transport: &http.Transport{
            MaxIdleConns:        200,
            MaxIdleConnsPerHost: 200,
            IdleConnTimeout:     90 * time.Second,
            ForceAttemptHTTP2:   true,
        },
    }
    
    bufPool = sync.Pool{
        New: func() interface{} { return new(bytes.Buffer) },
    }

    // FastHTTP pre-built responses
    respAllowed    = []byte(`{"status":"allowed"}`)
    respBlocked    = []byte(`{"status":"blocked"}`)
    respMalicious  = []byte(`{"status":"blocked","reason":"MALICIOUS"}`)
    respPythonDown = []byte(`{"status":"PYTHON_VAULT_DOWN"}`)
)

func securityHandlerFast(ctx *fasthttp.RequestCtx) {
    // ── CORS Preflight ──
    if string(ctx.Method()) == "OPTIONS" {
        ctx.SetContentType("text/plain")
        ctx.Response.Header.Set("Access-Control-Allow-Origin", "*")
        ctx.Response.Header.Set("Access-Control-Allow-Methods", "POST, OPTIONS")
        ctx.Response.Header.Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Api-Key")
        ctx.SetStatusCode(200)
        return
    }

    // ── Extract IP ──
    ip := string(ctx.Request.Header.Peek("X-Forwarded-For"))
    if ip == "" {
        ip = ctx.RemoteIP().String()
    } else if idx := strings.IndexByte(ip, ','); idx != -1 {
        ip = strings.TrimSpace(ip[:idx])
    }

    // ── IP State ──
    state := getIPState(ip)
    now := time.Now().UnixNano()

    if state.isBanned(now) {
        ctx.SetContentType("application/json")
        ctx.Write(respBlocked)
        return
    }

    // ── Parse Body: Zero-copy where possible ──
    body := ctx.PostBody()
    var req map[string]interface{}
    if len(body) > 2 {
        json.Unmarshal(body, &req)
    }

    action, _ := req["action"].(string)
    payload, _ := req["data"].(string)

    // ── Malicious Check ──
    if len(payload) > 3 && isMalicious(payload) {
        state.ban(now)
        ctx.SetContentType("application/json")
        ctx.Write(respMalicious)
        return
    }

    // ── Rate Limit ──
    if !state.allow(now) {
        state.ban(now)
        ctx.SetContentType("application/json")
        ctx.Write(respBlocked)
        return
    }

    ctx.SetContentType("application/json")
    ctx.Response.Header.Set("Access-Control-Allow-Origin", "*")

    // ── Fast Path ──
    if action != "hide_data" && action != "encrypt" && action != "decrypt" {
        ctx.Write(respAllowed)
        return
    }

    // ── Hide Data with Cache ──
    if action == "hide_data" {
        if cached, ok := cacheGet(payload); ok {
            ctx.Write([]byte(`{"status":"success","result":"`))
            ctx.Write(cached)
            ctx.Write([]byte(`","boosted":true}`))
            return
        }

        result, err := proxyToPython(req)
        if err == nil && result["status"] == "success" {
            if resStr, ok := result["result"].(string); ok {
                resBytes := []byte(resStr)
                cacheSet(payload, resBytes)
                ctx.Write([]byte(`{"status":"success","result":"`))
                ctx.Write(resBytes)
                ctx.Write([]byte(`","boosted":false}`))
                return
            }
        }
        ctx.SetStatusCode(500)
        ctx.Write(respPythonDown)
        return
    }

    // ── Encrypt/Decrypt ──
    result, err := proxyToPython(req)
    if err != nil {
        ctx.SetStatusCode(500)
        ctx.Write(respPythonDown)
        return
    }

    buf := bufPool.Get().(*bytes.Buffer)
    buf.Reset()
    json.NewEncoder(buf).Encode(result)
    ctx.Write(buf.Bytes())
    bufPool.Put(buf)
}

func main() {
    startCacheCleaner()

    // FastHTTP server - zero memory allocation per request
    server := &fasthttp.Server{
        Handler:               securityHandlerFast,
        Name:                  "NathanUltra/2.0",
        MaxRequestBodySize:    65536,
        ReadTimeout:           time.Second * 8,
        WriteTimeout:          time.Second * 8,
        IdleTimeout:           time.Second * 120,
        MaxConnsPerIP:         100,
        Concurrency:           0, // unlimited
        ReduceMemoryUsage:     true,
        StreamRequestBody:     false,
        HeaderReceivedTimeout: time.Second * 3,
    }

    log.Println("🚀 Nathan EXTREME Engine (FastHTTP) Started on :8080")
    if err := server.ListenAndServe(":8080"); err != nil {
        log.Fatal(err)
    }
}
