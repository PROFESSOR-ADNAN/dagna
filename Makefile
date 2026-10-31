SHELL := /bin/bash
.PHONY: help up down dev build test test-unit test-integration test-sandbox test-property lint format seed migrate load-test chaos judge-vm pause-judging clean

help: ## Show this help message
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

up: ## Start core local dev infrastructure (MongoDB, Redis, MinIO, Mailpit)
	docker compose -f docker/compose.yaml up -d --remove-orphans
	@echo "Core services up. Waiting for MongoDB replica set initialization..."
	@sleep 3
	@echo "Local services ready!"

down: ## Stop all local dev containers
	docker compose -f docker/compose.yaml down

dev: up ## Start all services in development mode
	npm run dev

build: ## Build all workspaces (packages/shared, server, worker, judge, web)
	npm run build

test: test-unit test-property test-sandbox ## Run all test suites
	@echo "All test suites passed!"

test-unit: ## Run unit tests across all workspaces
	npm test

test-property: ## Run property-based reference model tests (scoreboard, rating, leasing)
	npm test --workspace=server -- tests/property

test-sandbox: ## Run the hostile-program containment suite against dagna-sandbox CLI
	node --test tests/sandbox/hostile-runner.test.mjs

lint: ## Run ESLint and TypeScript typecheck
	npm run lint

format: ## Format code with Prettier
	npm run format

seed: ## Seed database with canary problem, sample users, contest data
	node server/dist/scripts/seed.js

migrate: ## Run MongoDB database migrations
	node server/dist/scripts/migrate.js up

load-test: ## Run k6 load test for API and queue throughput
	k6 run tests/load/contest-load.js

chaos: ## Run chaos engineering scenarios (judge kill, network drop, redis wipe)
	bash scripts/chaos-test.sh

judge-vm: ## Boot the local Vagrant/Lima judge sandbox VM
	cd docker/dev-vm && vagrant up

pause-judging: ## Emergency kill-switch: pause all judging queues on core host
	bash scripts/pause-judging.sh

clean: ## Clean build artifacts and node_modules
	rm -rf dist build coverage node_modules packages/*/dist server/dist worker/dist judge/dist web/dist
