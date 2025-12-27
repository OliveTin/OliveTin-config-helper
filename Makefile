.PHONY: all build test lint run frontend backend

all: build

build: frontend backend

frontend:
	make -C frontend

backend:
	make -C service

test:
	make -C service test

integration-test:
	make -C integration-tests test

lint:
	make -C service lint
	make -C frontend lint

run: build
	./service/OliveTin-config-helper

