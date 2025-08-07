package main

import (
	"encoding/json"
	"flag"
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"os/signal"
	"sync"
	"syscall"
)

// Config holds the routing configuration
type Config struct {
	Routes map[string]string `json:"routes"`
}

var (
	configPath = flag.String("config", "routes.json", "Path to the configuration file")
	port       = flag.String("port", "8000", "Port to listen on")
	routes     sync.Map
)

// loadConfig reads the routing configuration from the json file
func loadConfig() {
	file, err := os.Open(*configPath)
	if err != nil {
		log.Printf("INFO: Could not open config file %s. Starting with empty routes. Error: %v", *configPath, err)
		return
	}
	defer file.Close()

	var config Config
	decoder := json.NewDecoder(file)
	if err := decoder.Decode(&config); err != nil {
		log.Fatalf("FATAL: Could not decode config file: %v", err)
	}

	// Clear existing routes and load new ones
	routes.Range(func(key, value interface{}) bool {
		routes.Delete(key)
		return true
	})
	for host, target := range config.Routes {
		targetURL, err := url.Parse(target)
		if err != nil {
			log.Printf("WARN: Invalid target URL for host %s: %s. Skipping.", host, target)
			continue
		}
		proxy := httputil.NewSingleHostReverseProxy(targetURL)
		routes.Store(host, proxy)
		log.Printf("INFO: Loaded route: %s -> %s", host, target)
	}
	log.Println("INFO: Configuration loaded successfully.")
}

// proxyHandler finds the correct proxy for the request host and serves the request
func proxyHandler(w http.ResponseWriter, r *http.Request) {
	host := r.Host
	if proxy, ok := routes.Load(host); ok {
		log.Printf("INFO: Proxying request for %s", host)
		proxy.(http.Handler).ServeHTTP(w, r)
	} else {
		log.Printf("WARN: No route found for host: %s", host)
		http.Error(w, "Not Found", http.StatusNotFound)
	}
}

func main() {
	flag.Parse()

	// Initial load of the configuration
	loadConfig()

	// Set up channel to listen for SIGHUP signal for config reload
	reloadSignal := make(chan os.Signal, 1)
	signal.Notify(reloadSignal, syscall.SIGHUP)

	go func() {
		for {
			<-reloadSignal
			log.Println("INFO: Received SIGHUP signal. Reloading configuration...")
			loadConfig()
		}
	}()

	server := &http.Server{
		Addr:    ":" + *port,
		Handler: http.HandlerFunc(proxyHandler),
	}

	log.Printf("INFO: Starting reverse proxy on port %s", *port)
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("FATAL: Could not start server: %v", err)
	}
}
