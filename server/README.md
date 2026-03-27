# CoT Visualization — Go Backend

A production-grade Chain-of-Thought reasoning backend built on a **custom transformer from scratch** in pure Go.
Captures all four reasoning signal types in a single forward pass and provides enterprise-grade infrastructure.

---

## Key Features

- **Custom Transformer**: Built-from-scratch matrix operations, multi-head attention, and layer normalization.
- **JWT Authentication**: Secure API access with HS256 signed tokens.
- **Redis Caching**: High-performance caching for expensive reasoning traces.
- **Apache Kafka Integration**: Event-driven architecture for trace publishing and async inference requests.
- **SSE Streaming**: Real-time server-sent events for reasoning graph animation.
- **Zero-CGO Build**: Pure Go implementation for maximum portability.

---

## Architecture

```text
main.go
├── internal/
│   ├── transformer/ — Custom transformer model & reasoning pipeline
│   ├── api/         — Protected HTTP handlers & router
│   ├── auth/        — Supabase JWT validation & middleware
│   ├── kafka/       — Producer, Consumer & topic management
│   └── cache/       — Redis-backed caching results layer
├── docker-compose.yml — Full stack (App, Kafka, Redis, Zookeeper, UI)
└── Dockerfile         — Multi-stage alpine build
```

---

## Infrastructure Stack

| Service | Purpose | Port |
| --- | --- | --- |
| **API** | Main HTTP Backend | `8080` |
| **Kafka** | Event streaming & Async processing | `9092` |
| **Redis** | Trace & Activation caching | `6379` |
| **Kafka UI** | Visual topic management | `8090` |

---

## Quick Start

### Using Docker Compose (Recommended)

The easiest way to start the full stack including Kafka and Redis:

```bash
docker-compose up -d
```

### Manual Development

```bash
# 1. Install dependencies
go mod tidy

# 2. Set environment variables (or edit .env)
export KAFKA_BROKERS=localhost:9092
export REDIS_URL=redis://localhost:6379
export SUPABASE_JWT_SECRET=your-actual-secret-here

# 3. Start server
go run main.go
```

---

## Authentication (Supabase Auth)

All `/api/` endpoints are protected by Supabase JWT. The backend validates tokens signed with your Supabase **JWT Secret**.

### Setup

1. Go to your **Supabase Dashboard** → **Project Settings** → **API**.
2. Copy the **JWT Secret**.
3. Set the `SUPABASE_JWT_SECRET` environment variable in your backend.

### Frontend Integration

Your frontend should handle the login (via Supabase Auth SDK) and send the resulting access token in the headers of all API requests:

`Authorization: Bearer <SUPABASE_ACCESS_TOKEN>`

### `GET /auth/me` (Protected)

Verify the current Supabase session.

#### Example Response

```json
{
  "email": "user@example.com",
  "user_id": "uuid-v4-string",
  "issued_at": "...",
  "expires_at": "..."
}
```

---

## API Reference

### `GET /health` (Public)

```json
{"status": "ok", "version": "1.0.0"}
```

### `POST /api/reason` (Protected)

Full reasoning trace. Checks Redis cache first.

**Header provided**: `X-Cache: HIT` or `MISS`

#### Request Body content

```json
{"query": "explain multi-head attention"}
```

### `POST /api/reason/stream` (Protected)

SSE stream for live animation. Replays from cache if available.

**Event Types**: `meta`, `cot_step`, `tool_call`, `attention`, `activation`, `done`

### `GET /api/kafka/status` (Protected)

Returns connectivity and topic status.

### `GET /api/cache/status` (Protected)

Returns Redis status and TTL configuration.

---

## Configuration

| Variable | Default | Description |
| --- | --- | --- |
| `PORT` | `8080` | Server port |
| `KAFKA_BROKERS` | - | Comma-separated broker list |
| `REDIS_URL` | - | Redis connection URL |
| `REDIS_CACHE_TTL` | `3600` | Cache expiry in seconds |
| `SUPABASE_JWT_SECRET` | - | **Required**: Copy from Supabase Dashboard |

---

## Testing

```bash
# Run all package tests
go test ./... -v

# Run transformer benchmarks
go test ./internal/transformer/... -bench=. -benchmem
```
