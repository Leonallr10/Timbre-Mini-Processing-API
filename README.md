# Timbre Mini Processing API

Backend service for uploading audio/video assets, starting simulated processing jobs, and tracking job status.

Built for the Timbre Backend Engineering Intern assignment: Node.js, Express, PostgreSQL, multipart uploads, and asynchronous job processing.

## Features

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/assets` | Upload an audio/video file (`multipart/form-data`, field: `file`) |
| `GET` | `/assets/:assetId` | Retrieve asset metadata |
| `POST` | `/assets/:assetId/process` | Start a processing job (`transcription` or `noise_reduction`) |
| `GET` | `/jobs/:jobId` | Get job status/details |
| `GET` | `/assets/:assetId/jobs` | List all jobs for an asset |
| `GET` | `/health` | Health check |

## Project structure

```
src/
  config/           # Environment-driven configuration
  controllers/      # Request orchestration / validation
  db/               # PostgreSQL pool + migration runner
  middleware/       # Multer upload + error handling
  routes/           # Express routers
  services/         # DB access + async processing worker
  utils/            # AppError helpers
  app.js            # Express app factory
  server.js         # Process entrypoint
migrations/         # Reproducible SQL schema
docs/openapi.yaml   # OpenAPI 3 documentation
uploads/            # Local file storage (gitignored contents)
```

Concerns are separated: routes → controllers → services. Simulated processing lives in `processingService` and never blocks the HTTP response.

## Database schema & relationships

One **asset** can have many **jobs** (1:N). Deleting an asset cascades to its jobs (`ON DELETE CASCADE`).

```mermaid
erDiagram
    assets ||--o{ jobs : "has"

    assets {
        uuid id PK
        text original_name
        text mime_type
        bigint size_bytes
        text storage_path
        timestamptz created_at
    }

    jobs {
        uuid id PK
        uuid asset_id FK
        text operation
        text status
        text error_message
        timestamptz created_at
        timestamptz completed_at
    }
```

```
┌──────────────────────────────┐
│            assets            │
├──────────────────────────────┤
│ id (PK, UUID)                │
│ original_name                │
│ mime_type                    │
│ size_bytes                   │
│ storage_path                 │
│ created_at                   │
└──────────────┬───────────────┘
               │ 1
               │
               │ N
┌──────────────▼───────────────┐
│             jobs             │
├──────────────────────────────┤
│ id (PK, UUID)                │
│ asset_id (FK → assets.id)    │
│ operation                    │  transcription | noise_reduction
│ status                       │  queued → processing → completed | failed
│ error_message                │
│ created_at                   │
│ completed_at                 │
└──────────────────────────────┘
```

Migrations live in `migrations/` (`npm run migrate`).

## Prerequisites

- Node.js 18+
- PostgreSQL 14+ (local install **or** Docker)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` if your PostgreSQL credentials differ:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | HTTP port |
| `DATABASE_URL` | `postgresql://timbre:timbre@localhost:5432/timbre` | Postgres connection string |
| `UPLOAD_DIR` | `uploads` | Local directory for stored files |
| `MAX_FILE_SIZE_BYTES` | `104857600` (100 MB) | Upload size limit |

### 3. Start PostgreSQL

**Option A — Docker Compose (DB only):**

```bash
docker compose up -d db
```

**Option B — Local Postgres:** create the app role/database with your superuser password:

```bash
# PowerShell
$env:POSTGRES_ADMIN_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/postgres"
npm run setup:db
```

Or run SQL manually:

```sql
CREATE USER timbre WITH PASSWORD 'timbre';
CREATE DATABASE timbre OWNER timbre;
```

### 4. Run migrations

```bash
npm run migrate
```

### 5. Start the API

```bash
npm start
# or with auto-reload:
npm run dev
```

API: `http://localhost:3000`

### Full stack via Docker Compose

If Docker is available:

```bash
docker compose up --build
```

This starts Postgres and the API (migrations run on container start).

## API examples

### Upload a file

```bash
curl -X POST http://localhost:3000/assets \
  -F "file=@./sample.mp4"
```

Example `201` response:

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "originalName": "sample.mp4",
  "mimeType": "video/mp4",
  "sizeBytes": 1048576,
  "storagePath": "uploads/a1b2c3d4-....mp4",
  "createdAt": "2026-03-28T10:00:00.000Z"
}
```

### Get an asset

```bash
curl http://localhost:3000/assets/<assetId>
```

### Start processing

```bash
curl -X POST http://localhost:3000/assets/<assetId>/process \
  -H "Content-Type: application/json" \
  -d '{"operation":"transcription"}"
```

Returns `202` immediately with `status: "queued"`. Processing is simulated asynchronously (`queued` → `processing` → `completed`, ~2–5 seconds).

Supported operations: `transcription`, `noise_reduction`.

### Check job status

```bash
curl http://localhost:3000/jobs/<jobId>
```

### List jobs for an asset

```bash
curl http://localhost:3000/assets/<assetId>/jobs
```

API docs:

- OpenAPI: [`docs/openapi.yaml`](docs/openapi.yaml)
- Postman: [`docs/Timbre_API.postman_collection.json`](docs/Timbre_API.postman_collection.json)

## Validation & error handling

- Missing upload → `400`
- Unsupported MIME/extension → `400`
- File too large → `400` (`LIMIT_FILE_SIZE`)
- Invalid UUID path params → `400`
- Unknown asset/job → `404`
- Unsupported operation → `400`
- Errors return `{ "error": { "message": "..." } }` and do not crash the process

## Design decisions & trade-offs

1. **Safe filenames** — Stored names are UUIDs + sanitized extension. The original filename is kept only as metadata, never used as a filesystem path.
2. **In-process async simulation** — Jobs are scheduled with `setImmediate` and a short delay. This meets the assignment (non-blocking HTTP) without a queue dependency. For multi-minute jobs or multiple API instances, use BullMQ/SQS/etc. and persistent workers.
3. **Status model** — `queued` → `processing` → `completed`, with `failed` if the worker hits an unexpected error.
4. **No auth** — Out of scope for this assignment.
5. **Local disk storage** — Simple and reviewable. Moving to S3/Blob would mean uploading the stream to object storage and storing the object key instead of a local path.
6. **Lightweight migrations** — Plain SQL + a small runner (`npm run migrate`). Easy to review; no ORM lock-in.

## Interview talking points (brief)

- **10-minute jobs:** Swap `setImmediate` for a durable queue; workers update status independently; API remains request/response only.
- **Many concurrent jobs:** Queue + concurrency limits on workers; optionally horizontal worker scaling.
- **Duplicate processing:** Unique constraint or idempotency key on `(asset_id, operation)` while a non-terminal job exists; or client-supplied `Idempotency-Key` header.
- **Concurrent identical requests:** Use a DB unique index / advisory lock when creating jobs so only one “active” job per asset+operation wins.

## License

MIT
