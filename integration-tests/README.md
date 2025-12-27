# Integration Tests

Integration tests for OliveTin-config-helper using Mocha and Selenium WebDriver.

## Prerequisites

- Node.js (v18 or higher)
- npm
- Built service binary (`service/OliveTin-config-helper`)
- Built frontend (`frontend/dist/`)

## Setup

Install dependencies:

```bash
make -C integration-tests install
```

Or manually:

```bash
cd integration-tests
npm install
```

## Running Tests

Run all integration tests:

```bash
make integration-test
```

Or manually:

```bash
cd integration-tests
npm test
```

## Test Structure

- `helpers/` - Test utilities and helpers
  - `service.js` - Service lifecycle management (start/stop)
  - `http-client.js` - HTTP client wrapper
  - `test-data.js` - Test data fixtures
- `tests/` - Test files
  - `api-import.test.js` - Tests for `/api/import` endpoint
  - `api-export.test.js` - Tests for `/api/export` endpoint
  - `api-health.test.js` - Tests for `/api/health` endpoint
  - `api-init.test.js` - Tests for `/api/init` endpoint
  - `security.test.js` - Security tests (path traversal, size limits)
  - `static-files.test.js` - Static file serving tests

## Test Coverage

The integration tests cover:

- ✅ Core API endpoints (`/api/import`, `/api/export`, `/api/health`, `/api/init`)
- ✅ Error handling (invalid requests, malformed data)
- ✅ Security (path traversal, size limits, CORS)
- ✅ Static file serving
- ✅ Request/response validation
- ✅ CORS headers
- ✅ Request ID propagation

## Configuration

Each test suite uses a different port to avoid conflicts:
- `api-import.test.js`: port 9486
- `api-export.test.js`: port 9487
- `api-health.test.js`: port 9488
- `api-init.test.js`: port 9489
- `security.test.js`: port 9490
- `static-files.test.js`: port 9491

## Troubleshooting

If tests fail to start the service:
1. Ensure the service binary is built: `make -C service build`
2. Ensure the frontend is built: `make -C frontend build`
3. Check that ports are not already in use
4. Check service logs for errors

