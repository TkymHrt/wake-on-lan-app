package main

import (
	"bytes"
	"encoding/json"
	"flag"
	"fmt"
	"net"
	"net/http"
	"os"
	"os/exec"
	"runtime"
	"strings"
	"time"
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

// statusHandler checks if a device is online using multiple methods
func statusHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	ip := r.URL.Query().Get("ip")
	if ip == "" {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"error": "IP address required",
			"online": false,
		})
		return
	}

	// Resolve hostname to IP if needed
	ips, err := net.LookupHost(ip)
	if err != nil {
		// If lookup fails, try using the IP directly
		ips = []string{ip}
	}

	targetIP := ips[0]
	online, method := isOnline(targetIP)
	
	response := map[string]interface{}{
		"online": online,
		"method": method,
	}
	json.NewEncoder(w).Encode(response)
}

// isOnline uses multiple methods to check if a host is online
func isOnline(ip string) (bool, string) {
	// Try ICMP ping first
	if pingHost(ip) {
		return true, "ping"
	}

	// Try common ports
	ports := []int{
		7,    // Echo
		22,   // SSH
		80,   // HTTP
		443,  // HTTPS
		3389, // RDP
		445,  // SMB
		139,  // NetBIOS
	}
	
	timeout := 2 * time.Second
	for _, port := range ports {
		target := fmt.Sprintf("%s:%d", ip, port)
		conn, err := net.DialTimeout("tcp", target, timeout)
		if err == nil {
			conn.Close()
			return true, fmt.Sprintf("port %d", port)
		}
	}

	return false, "none"
}

// pingHost attempts to ping the target host
func pingHost(ip string) bool {
	var cmd *exec.Cmd
	
	switch runtime.GOOS {
	case "windows":
		cmd = exec.Command("ping", "-n", "1", "-w", "1000", ip)
	default: // Linux and macOS
		cmd = exec.Command("ping", "-c", "1", "-W", "1", ip)
	}
	
	output, err := cmd.Output()
	if err != nil {
		return false
	}
	
	// Check if ping was successful
	return strings.Contains(string(output), "1 received") || 
	       strings.Contains(string(output), "1 packets received") ||
	       strings.Contains(string(output), "bytes from")
}

func main() {
	flag.Parse()

	// Serve React static files
	fs := http.FileServer(http.Dir("../frontend/dist"))
	http.Handle("/", fs)

	// API endpoints
	http.HandleFunc("/api/wake", enableCORS(wolHandler))
	http.HandleFunc("/api/status", enableCORS(statusHandler))

	// Start server
	addr := fmt.Sprintf("%s:%s", *host, *port)
	println("Server running on http://" + addr)
	if err := http.ListenAndServe(addr, nil); err != nil {
		fmt.Fprintf(os.Stderr, "Error starting server: %v\n", err)
		os.Exit(1)
	}
}