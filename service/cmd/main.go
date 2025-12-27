package main

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"strconv"
	"strings"
	"syscall"
	"time"

	"github.com/google/uuid"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/sirupsen/logrus"
	"gopkg.in/yaml.v3"
)

var (
	version   = "dev"
	commit    = "unknown"
	date      = "unknown"
	logger    *logrus.Logger
	startTime = time.Now()
)

var (
	httpRequestDuration = promauto.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "http_request_duration_seconds",
			Help:    "Duration of HTTP requests in seconds",
			Buckets: prometheus.DefBuckets,
		},
		[]string{"method", "endpoint", "status"},
	)

	httpRequestTotal = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Name: "http_requests_total",
			Help: "Total number of HTTP requests",
		},
		[]string{"method", "endpoint", "status"},
	)

	httpRequestsInFlight = promauto.NewGauge(
		prometheus.GaugeOpts{
			Name: "http_requests_in_flight",
			Help: "Number of HTTP requests currently being processed",
		},
	)

	yamlParseTotal = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Name: "yaml_parse_total",
			Help: "Total number of YAML parse operations",
		},
		[]string{"status"},
	)

	yamlParseDuration = promauto.NewHistogram(
		prometheus.HistogramOpts{
			Name:    "yaml_parse_duration_seconds",
			Help:    "Duration of YAML parsing in seconds",
			Buckets: []float64{0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0},
		},
	)

	yamlSizeBytes = promauto.NewHistogram(
		prometheus.HistogramOpts{
			Name:    "yaml_size_bytes",
			Help:    "Size of YAML content in bytes",
			Buckets: []float64{1024, 10240, 102400, 1024000, 10240000, 102400000},
		},
	)
)

var (
	maxRequestSize   = getEnvInt("MAX_REQUEST_SIZE_MB", 10) * 1024 * 1024
	readTimeout      = getEnvDuration("READ_TIMEOUT", 15*time.Second)
	writeTimeout     = getEnvDuration("WRITE_TIMEOUT", 15*time.Second)
	idleTimeout      = getEnvDuration("IDLE_TIMEOUT", 60*time.Second)
	shutdownTimeout   = getEnvDuration("SHUTDOWN_TIMEOUT", 10*time.Second)
	maxYAMLSize      = getEnvInt("MAX_YAML_SIZE_MB", 5) * 1024 * 1024
)

func getEnvInt(key string, defaultValue int) int {
	if val := os.Getenv(key); val != "" {
		if intVal, err := strconv.Atoi(val); err == nil {
			return intVal
		}
	}
	return defaultValue
}

func getEnvDuration(key string, defaultValue time.Duration) time.Duration {
	if val := os.Getenv(key); val != "" {
		if duration, err := time.ParseDuration(val); err == nil {
			return duration
		}
	}
	return defaultValue
}

type Config struct {
	ListenAddress string `yaml:"listenAddressSingleHTTPFrontend" json:"listenAddressSingleHTTPFrontend"`
	LogLevel      string `yaml:"logLevel" json:"logLevel"`
	Actions       []Action `yaml:"actions" json:"actions"`
	Entities      []Entity `yaml:"entities" json:"entities"`
	Dashboards    []Dashboard `yaml:"dashboards" json:"dashboards"`
}

type Action struct {
	Title    string                 `yaml:"title" json:"title"`
	Shell    string                 `yaml:"shell" json:"shell,omitempty"`
	Icon     string                 `yaml:"icon" json:"icon,omitempty"`
	ID       string                 `yaml:"id" json:"id,omitempty"`
	Timeout  int                    `yaml:"timeout" json:"timeout,omitempty"`
	Entity   string                 `yaml:"entity" json:"entity,omitempty"`
	Hidden   bool                   `yaml:"hidden" json:"hidden,omitempty"`
	Arguments []map[string]interface{} `yaml:"arguments" json:"arguments,omitempty"`
}

type Entity struct {
	File string `yaml:"file" json:"file"`
	Name string `yaml:"name" json:"name"`
}

type Dashboard struct {
	Title    string      `yaml:"title" json:"title"`
	Contents []interface{} `yaml:"contents" json:"contents"`
}

type ImportRequest struct {
	Config string `json:"config"`
}

type ImportResponse struct {
	Success bool   `json:"success"`
	Config  *Config `json:"config,omitempty"`
	Error   string `json:"error,omitempty"`
}

func main() {
	logger = logrus.New()
	
	logLevel := os.Getenv("LOG_LEVEL")
	if logLevel == "" {
		logLevel = "info"
	}
	level, err := logrus.ParseLevel(logLevel)
	if err != nil {
		level = logrus.InfoLevel
		logger.Warnf("Invalid LOG_LEVEL '%s', using 'info'", logLevel)
	}
	logger.SetLevel(level)
	logger.SetFormatter(&logrus.JSONFormatter{})

	port := os.Getenv("PORT")
	if port == "" {
		port = "9485"
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/api/import", metricsMiddleware(requestIDMiddleware(importHandler), "/api/import"))
	mux.HandleFunc("/api/export", metricsMiddleware(requestIDMiddleware(exportHandler), "/api/export"))
	mux.HandleFunc("/api/health", metricsMiddleware(requestIDMiddleware(healthHandler), "/api/health"))
	mux.HandleFunc("/api/init", metricsMiddleware(requestIDMiddleware(initHandler), "/api/init"))
	mux.Handle("/metrics", promhttp.Handler())

	staticDir := os.Getenv("STATIC_DIR")
	if staticDir == "" {
		staticDir = "/var/www/olivetin-config-helper"
	}

	absStaticDir, err := filepath.Abs(staticDir)
	if err != nil {
		logger.WithError(err).Fatalf("Failed to resolve static directory: %s", staticDir)
	}

	if _, err := os.Stat(absStaticDir); err == nil {
		fileServer := http.FileServer(secureFileSystem{http.Dir(absStaticDir), absStaticDir})
		mux.HandleFunc("/", metricsMiddleware(func(w http.ResponseWriter, r *http.Request) {
			if strings.HasPrefix(r.URL.Path, "/api/") {
				http.NotFound(w, r)
				return
			}
			fileServer.ServeHTTP(w, r)
		}, "/"))
		logger.Infof("Serving static files from %s", absStaticDir)
	} else {
		logger.Warnf("Static directory %s does not exist, static file serving disabled", absStaticDir)
	}

	server := &http.Server{
		Addr:         ":" + port,
		Handler:      mux,
		ReadTimeout:  readTimeout,
		WriteTimeout: writeTimeout,
		IdleTimeout:  idleTimeout,
		MaxHeaderBytes: 1 << 20, // 1MB
	}

	go func() {
		logger.Infof("Starting OliveTin-config-helper version %s (commit: %s, date: %s) on port %s", version, commit, date, port)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.WithError(err).Fatal("Failed to start server")
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logger.Info("Shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), shutdownTimeout)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		logger.WithError(err).Error("Server forced to shutdown")
		os.Exit(1)
	}

	logger.Info("Server exited")
}

func importHandler(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	setCORSHeaders(w)
	
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}
	
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	body := http.MaxBytesReader(w, r.Body, int64(maxRequestSize))
	defer body.Close()

	var req ImportRequest
	decoder := json.NewDecoder(body)
	if err := decoder.Decode(&req); err != nil {
		logger.WithField("requestID", getRequestID(ctx)).WithError(err).Warn("Failed to decode import request")
		http.Error(w, fmt.Sprintf("Invalid request: %v", err), http.StatusBadRequest)
		return
	}

	yamlSizeBytes.Observe(float64(len(req.Config)))

	if len(req.Config) > maxYAMLSize {
		logger.WithField("requestID", getRequestID(ctx)).Warnf("YAML config too large: %d bytes (max: %d)", len(req.Config), maxYAMLSize)
		yamlParseTotal.WithLabelValues("error_size").Inc()
		response := ImportResponse{
			Success: false,
			Error:   fmt.Sprintf("YAML config exceeds maximum size of %d MB", maxYAMLSize/(1024*1024)),
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(response)
		return
	}

	parseStart := time.Now()
	var config Config
	if err := yaml.Unmarshal([]byte(req.Config), &config); err != nil {
		yamlParseDuration.Observe(time.Since(parseStart).Seconds())
		yamlParseTotal.WithLabelValues("error_parse").Inc()
		logger.WithField("requestID", getRequestID(ctx)).WithError(err).Warn("Failed to parse YAML config")
		response := ImportResponse{
			Success: false,
			Error:   fmt.Sprintf("Failed to parse YAML: %v", err),
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(response)
		return
	}
	yamlParseDuration.Observe(time.Since(parseStart).Seconds())
	yamlParseTotal.WithLabelValues("success").Inc()

	response := ImportResponse{
		Success: true,
		Config:  &config,
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(response); err != nil {
		logger.WithField("requestID", getRequestID(ctx)).WithError(err).Error("Failed to encode import response")
	}
}

type ExportRequest struct {
	Config *Config `json:"config"`
}

type ExportResponse struct {
	Success bool   `json:"success"`
	YAML    string `json:"yaml,omitempty"`
	Error   string `json:"error,omitempty"`
}

func exportHandler(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	setCORSHeaders(w)
	
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}
	
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	body := http.MaxBytesReader(w, r.Body, int64(maxRequestSize))
	defer body.Close()

	var req ExportRequest
	decoder := json.NewDecoder(body)
	if err := decoder.Decode(&req); err != nil {
		logger.WithField("requestID", getRequestID(ctx)).WithError(err).Warn("Failed to decode export request")
		http.Error(w, fmt.Sprintf("Invalid request: %v", err), http.StatusBadRequest)
		return
	}

	if req.Config == nil {
		response := ExportResponse{
			Success: false,
			Error:   "Config is required",
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(response)
		return
	}

	cleanConfig := cleanConfigForExport(req.Config)
	
	marshalStart := time.Now()
	yamlBytes, err := yaml.Marshal(cleanConfig)
	if err != nil {
		yamlParseDuration.Observe(time.Since(marshalStart).Seconds())
		yamlParseTotal.WithLabelValues("error_marshal").Inc()
		logger.WithField("requestID", getRequestID(ctx)).WithError(err).Error("Failed to marshal YAML")
		response := ExportResponse{
			Success: false,
			Error:   fmt.Sprintf("Failed to generate YAML: %v", err),
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(response)
		return
	}
	yamlParseDuration.Observe(time.Since(marshalStart).Seconds())
	yamlParseTotal.WithLabelValues("success").Inc()
	yamlSizeBytes.Observe(float64(len(yamlBytes)))

	response := ExportResponse{
		Success: true,
		YAML:    string(yamlBytes),
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(response); err != nil {
		logger.WithField("requestID", getRequestID(ctx)).WithError(err).Error("Failed to encode export response")
	}
}

func cleanConfigForExport(config *Config) *Config {
	if config == nil {
		return &Config{}
	}
	
	cleanConfig := &Config{
		ListenAddress: config.ListenAddress,
		LogLevel:      config.LogLevel,
	}
	
	if config.Actions != nil && len(config.Actions) > 0 {
		cleanConfig.Actions = config.Actions
	}
	
	if config.Entities != nil && len(config.Entities) > 0 {
		cleanConfig.Entities = config.Entities
	}
	
	if config.Dashboards != nil && len(config.Dashboards) > 0 {
		cleanConfig.Dashboards = config.Dashboards
	}
	
	return cleanConfig
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	setCORSHeaders(w)
	w.Header().Set("Content-Type", "application/json")
	
	status := map[string]interface{}{
		"status":  "ok",
		"version": version,
		"uptime":  time.Since(startTime).String(),
	}
	
	w.WriteHeader(http.StatusOK)
	if err := json.NewEncoder(w).Encode(status); err != nil {
		logger.WithError(err).Error("Failed to encode health response")
	}
}

type InitResponse struct {
	Version string `json:"version"`
	Commit  string `json:"commit"`
	Date    string `json:"date"`
}

func initHandler(w http.ResponseWriter, r *http.Request) {
	setCORSHeaders(w)
	w.Header().Set("Content-Type", "application/json")
	
	response := InitResponse{
		Version: version,
		Commit:  commit,
		Date:    date,
	}
	
	if err := json.NewEncoder(w).Encode(response); err != nil {
		logger.WithError(err).Error("Failed to encode init response")
	}
}

func setCORSHeaders(w http.ResponseWriter) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
}

func requestIDMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		requestID := r.Header.Get("X-Request-ID")
		if requestID == "" {
			requestID = uuid.New().String()
		}
		ctx := context.WithValue(r.Context(), "requestID", requestID)
		w.Header().Set("X-Request-ID", requestID)
		next(w, r.WithContext(ctx))
	}
}

func metricsMiddleware(next http.HandlerFunc, endpoint string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		httpRequestsInFlight.Inc()
		defer httpRequestsInFlight.Dec()

		start := time.Now()
		wrapped := &responseWriter{ResponseWriter: w, statusCode: http.StatusOK}

		next(wrapped, r)

		duration := time.Since(start).Seconds()
		status := strconv.Itoa(wrapped.statusCode)
		method := r.Method

		httpRequestDuration.WithLabelValues(method, endpoint, status).Observe(duration)
		httpRequestTotal.WithLabelValues(method, endpoint, status).Inc()
	}
}

type responseWriter struct {
	http.ResponseWriter
	statusCode int
}

func (rw *responseWriter) WriteHeader(code int) {
	rw.statusCode = code
	rw.ResponseWriter.WriteHeader(code)
}

func getRequestID(ctx context.Context) string {
	if id, ok := ctx.Value("requestID").(string); ok {
		return id
	}
	return "unknown"
}

type secureFileSystem struct {
	fs     http.FileSystem
	root   string
}

func (sfs secureFileSystem) Open(name string) (http.File, error) {
	cleaned := filepath.Clean(name)
	if cleaned == "/" || cleaned == "" {
		cleaned = "/index.html"
	}
	
	path := filepath.Join(sfs.root, cleaned)
	absPath, err := filepath.Abs(path)
	if err != nil {
		return nil, err
	}
	
	rootAbs, err := filepath.Abs(sfs.root)
	if err != nil {
		return nil, err
	}
	
	if !strings.HasPrefix(absPath, rootAbs) {
		return nil, os.ErrNotExist
	}
	
	return sfs.fs.Open(cleaned)
}

