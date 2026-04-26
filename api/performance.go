package api // Vercel menggunakan nama folder atau 'api' sebagai package untuk serverless

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"strings"
	"time"
)

const pythonVaultURL = "https://nathansecurity.vercel.app/api/monitor"

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

	// Pre-built responses (dalam bentuk bytes untuk efisiensi)
	respAllowed    = []byte(`{"status":"allowed"}`)
	respBlocked    = []byte(`{"status":"blocked"}`)
	respMalicious  = []byte(`{"status":"blocked","reason":"MALICIOUS"}`)
	respPythonDown = []byte(`{"status":"PYTHON_VAULT_DOWN"}`)
)

// =====================================================================
// BAGIAN DUMMY FUNGSI & STRUCT (GANTI DENGAN LOGIKA ASLIMU)
// Karena logika IP State, Cache, dan Regex terpotong di kodemu,
// saya buatkan kerangka dasarnya agar tidak error saat di-build Vercel.
// =====================================================================

type IPState struct{}

func (s *IPState) isBanned(now int64) bool { return false } // Ganti dengan aslimu
func (s *IPState) allow(now int64) bool    { return true }  // Ganti dengan aslimu
func (s *IPState) ban(now int64)           {}               // Ganti dengan aslimu

func getIPState(ip string) *IPState {
	return &IPState{} // Ganti dengan aslimu
}

func isMalicious(payload string) bool {
	return false // Ganti dengan aslimu (Regex Check)
}

func cacheGet(key string) ([]byte, bool) {
	return nil, false // Ganti dengan aslimu (Global Map/Sync Map Check)
}

func cacheSet(key string, val []byte) {
	// Ganti dengan aslimu
}

func proxyToPython(req map[string]interface{}) (map[string]interface{}, error) {
	// Contoh implementasi standar proxyToPython
	reqBody, _ := json.Marshal(req)
	httpReq, _ := http.NewRequest("POST", pythonVaultURL, bytes.NewBuffer(reqBody))
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := httpClient.Do(httpReq)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var result map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&result)
	return result, nil
}

// =====================================================================
// END OF DUMMY
// =====================================================================

// Handler adalah entry point WAJIB untuk Vercel Serverless Function Golang
func Handler(w http.ResponseWriter, r *http.Request) {
	// ── CORS Preflight ──
	if r.Method == http.MethodOptions {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Api-Key")
		w.WriteHeader(http.StatusOK)
		return
	}

	// ── Extract IP ──
	ip := r.Header.Get("X-Forwarded-For")
	if ip == "" {
		// Mengambil IP dari RemoteAddr (format: IP:Port)
		ip = strings.Split(r.RemoteAddr, ":")[0]
	} else if idx := strings.IndexByte(ip, ','); idx != -1 {
		ip = strings.TrimSpace(ip[:idx])
	}

	// ── IP State ──
	state := getIPState(ip)
	now := time.Now().UnixNano()

	if state.isBanned(now) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusForbidden)
		w.Write(respBlocked)
		return
	}

	// ── Parse Body ──
	var req map[string]interface{}
	if r.Body != nil {
		bodyBytes, err := io.ReadAll(r.Body)
		if err == nil && len(bodyBytes) > 2 {
			json.Unmarshal(bodyBytes, &req)
		}
		r.Body.Close()
	}

	action, _ := req["action"].(string)
	payload, _ := req["data"].(string)

	// ── Malicious Check ──
	if len(payload) > 3 && isMalicious(payload) {
		state.ban(now)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusForbidden)
		w.Write(respMalicious)
		return
	}

	// ── Rate Limit ──
	if !state.allow(now) {
		state.ban(now)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusTooManyRequests)
		w.Write(respBlocked)
		return
	}

	// Set header utama untuk response sukses
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	// ── Fast Path ──
	if action != "hide_data" && action != "encrypt" && action != "decrypt" {
		w.WriteHeader(http.StatusOK)
		w.Write(respAllowed)
		return
	}

	// ── Hide Data with Cache ──
	if action == "hide_data" {
		// Cek Cache
		if cached, ok := cacheGet(payload); ok {
			response := map[string]interface{}{
				"status":  "success",
				"result":  string(cached),
				"boosted": true,
			}
			json.NewEncoder(w).Encode(response)
			return
		}

		// Teruskan ke Python Vault
		result, err := proxyToPython(req)
		if err == nil && result["status"] == "success" {
			if resStr, ok := result["result"].(string); ok {
				resBytes := []byte(resStr)
				cacheSet(payload, resBytes)

				response := map[string]interface{}{
					"status":  "success",
					"result":  string(resBytes), // kembalikan sebagai string agar format JSON aman
					"boosted": false,
				}
				json.NewEncoder(w).Encode(response)
				return
			}
		}

		w.WriteHeader(http.StatusInternalServerError)
		w.Write(respPythonDown)
		return
	}

	// ── Encrypt/Decrypt ──
	result, err := proxyToPython(req)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write(respPythonDown)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(result)
}
