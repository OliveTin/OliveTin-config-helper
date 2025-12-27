# OliveTin-config-helper

A web application that helps users write and manage OliveTin configuration files.

## Features

- **Import Existing Config**: Paste your existing OliveTin configuration YAML and import it into the editor
- **Build from Scratch**: Create new OliveTin configurations using a graphical interface
- **Action Management**: Add, edit, and remove actions with a user-friendly interface
- **Common Settings**: Easily configure common options like listen address and log level
- **Documentation Links**: Quick access to OliveTin documentation at docs.olivetin.app

## Project Structure

- `frontend/` - Vue + Vite frontend application
- `service/` - Go backend service with REST API
- `integration-tests/` - Integration tests (to be implemented)
- `docs/` - Documentation (to be implemented)

## Building

```bash
make build
```

This will build both the frontend and backend.

## Running

```bash
make run
```

The backend will start on port 8080 (configurable via PORT environment variable).
The frontend development server runs on port 3000.

## Development

### Backend

```bash
cd service
make build
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## API Endpoints

- `POST /api/import` - Import a configuration YAML string
- `GET /api/health` - Health check endpoint

## License

[To be determined]
