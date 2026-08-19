# Daemon HTTP API

The HYDRA daemon exposes a REST API for task submission, creative generation, status monitoring, and control.

## Starting the Daemon

```bash
cargo run -p hydra-daemon
```

The daemon listens on `http://localhost:3000` by default.

## Endpoints

### POST /task

Submit a task for execution.

**Request:**
```json
{
  "goal": "Build a REST API"
}
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000"
}
```

### POST /creative

Generate artifacts from a creative goal.

**Request:**
```json
{
  "goal": "Create a logo and a website"
}
```

**Response:**
```json
{
  "goal": "Create a logo and a website",
  "result": "[planned] Understand the creative goal: ...\n[generated] Generate images for: ...",
  "artifacts": [
    {"modality": "Image", "path": "/path/to/logo.png"},
    {"modality": "Code", "path": "/path/to/index.html"}
  ]
}
```

### GET /status

Get daemon status.

**Response:**
```json
{
  "running": true,
  "tasks_processed": 42,
  "models_loaded": 3,
  "uptime": 3600
}
```

### POST /stop

Gracefully stop the daemon.

**Response:**
```json
{
  "stopped": true
}
```

### POST /emergency-stop

Activate the kill switch and stop all operations.

**Response:**
```json
{
  "status": "kill switch activated"
}
```

## Error Handling

All endpoints return standard HTTP status codes:

- `200 OK` — Success
- `400 Bad Request` — Invalid request body
- `500 Internal Server Error` — Server error
