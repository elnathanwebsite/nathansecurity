package main

import (
	"encoding/json"
	"net/http"
	"os"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Access-Control-Allow-Origin", "*")
		
		json.NewEncoder(w).Encode(map[string]interface{}{
			"status": "ok",
			"engine": "nathan-hybrid-v3",
			"endpoints": map[string]string{
				"performance": "/api/performance",
				"monitor":     "/api/monitor",
			},
		})
	})

	http.ListenAndServe(":"+port, nil)
}
