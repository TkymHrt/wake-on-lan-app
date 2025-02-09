package main

import (
	"bytes"
	"encoding/json"
	"flag"
	"fmt"
	"net"
	"net/http"
	"os"
)

var (
	port = flag.String("port", "8080", "Port to listen on")
	host = flag.String("host", "0.0.0.0", "Host to bind to")
)

// Send WoL magic packet
func sendWOL(macAddr string) error {
	hwAddr, err := net.ParseMAC(macAddr)
	if err != nil {
		return err
	}

	// Construct magic packet (6x 0xFF + 16x MAC)
	payload := bytes.Repeat([]byte{0xFF}, 6)
	payload = append(payload, bytes.Repeat(hwAddr, 16)...)

	// Broadcast to port 9
	conn, err := net.DialUDP("udp", nil, &net.UDPAddr{
		IP:   net.IPv4bcast,
		Port: 9,
	})
	if err != nil {
		return err
	}
	defer conn.Close()

	_, err = conn.Write(payload)
	return err
}

func enableCORS(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		
		next(w, r)
	}
}

// API endpoint handler
func wolHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	
	mac := r.URL.Query().Get("mac")
	if mac == "" {
		json.NewEncoder(w).Encode(map[string]string{"error": "MAC address required"})
		return
	}

	if err := sendWOL(mac); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	json.NewEncoder(w).Encode(map[string]string{"message": "WoL packet sent to " + mac})
}

func main() {
	flag.Parse()

	// Serve React static files
	fs := http.FileServer(http.Dir("../frontend/dist"))
	http.Handle("/", fs)

	// API endpoint
	http.HandleFunc("/api/wake", enableCORS(wolHandler))

	// Start server
	addr := fmt.Sprintf("%s:%s", *host, *port)
	println("Server running on http://" + addr)
	if err := http.ListenAndServe(addr, nil); err != nil {
		fmt.Fprintf(os.Stderr, "Error starting server: %v\n", err)
		os.Exit(1)
	}
}