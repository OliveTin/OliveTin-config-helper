.PHONY: build test lint

VERSION ?= dev
COMMIT ?= $(shell git rev-parse --short HEAD 2>/dev/null || echo "unknown")
DATE ?= $(shell date -u +"%Y-%m-%dT%H:%M:%SZ")

build:
	go build -ldflags "-X main.version=$(VERSION) -X main.commit=$(COMMIT) -X main.date=$(DATE)" -o OliveTin-config-helper ./cmd/main.go

test:
	go test ./...

lint:
	golangci-lint run ./...

