# Music Workspace

Collaborative platform for managing music projects — organize tracks, audio versions, tasks and feedback with your collaborators.

**Objective:** a portfolio project demonstrating a robust **Spring Boot + React** architecture (clean layering, JWT security, optimized queries, IaC-friendly deployment.

---

## 1. Stack

### Backend
- **Java 21**, **Spring Boot 3.5** (Web, Data JPA, Security, Validation)
- **PostgreSQL** + **Flyway** (versioned migrations)
- **MapStruct** (entity ↔ DTO mapping) · **Lombok**
- **JJWT** (JWT signing) · **Bucket4j + Caffeine** (rate limiting)
- **Springdoc OpenAPI** (Swagger UI) · **Apache Tika** (file type detection)

### Frontend
- **Vite** + **React 19** + **TypeScript**
- **Tailwind CSS** + **shadcn/ui**
- **TanStack Router** (routing) · **TanStack Query** (server state)
- **Zustand** (client state) · **react-hook-form** + **Zod** (forms & validation)

### Testing & Infra
- **JUnit 5**, **Mockito**, **MockMvc**, **Testcontainers** (backend)
- **Vitest** + **Testing Library** (frontend)
- **Cloudinary** (audio & cover image storage)
- **Docker** (local Postgres) · **Railway** (API) · **Netlify** (frontend) · **GitHub Actions** (CI)

---

## 2. Repository architecture

Monorepo with two independently deployable apps.

```
music-workspace/
├── backend/                     # Spring Boot REST API
│   └── src/main/java/com/musicworkspace/backend/
│       ├── controller/          # routing only — delegate to services
│       ├── service/             # all business logic
│       ├── repository/          # Spring Data JPA repositories
│       ├── entity/              # JPA entities
│       ├── dto/                 # request/response DTOs + MapStruct mappers
│       ├── security/            # JWT filter, cookie service, Spring Security config
│       ├── exception/           # @ControllerAdvice + custom exceptions
│       └── config/              # CORS, Cloudinary, rate limiter, OpenAPI
│   └── src/main/resources/
│       ├── db/migration/        # Flyway migrations (V1..V13)
│       └── application*.yml      # profiles: dev / prod / test
│
├── frontend/                    # Vite + React SPA
│   └── src/
│       ├── features/            # feature-based: auth, projects, tracks, tasks, comments, home
│       │   └── <feature>/       #   components/ · hooks/ · api.ts · types.ts
│       ├── components/          # shared/generic UI (+ hooks/)
│       ├── lib/                 # fetch wrapper, utils
│       ├── store/               # Zustand stores (auth, player)
│       └── routes/              # TanStack Router route definitions
│
├── docker-compose.yml           # local PostgreSQL
├── netlify.toml                 # frontend build + /api proxy to Railway
├── DATA_MODEL.md · API_DESIGN.md · CLAUDE.md   # design source-of-truth
```

**Backend layering rules:** business logic lives only in services; controllers route and delegate; DB access only via repositories; entities are never exposed — always mapped to DTOs; JPA relations are always `LAZY`, with no `@OneToMany` on parents (children fetched via repository).

---

## 3. Getting started (local)

### Prerequisites
- **Java 21+** and Maven (wrapper `./mvnw` included)
- **Node 20+**
- **Docker** (for PostgreSQL) — or a local PostgreSQL instance
- A free **Cloudinary** account (for audio/image uploads)

### 1. Start PostgreSQL

```bash
cp .env.example .env          # optional — sensible defaults are baked in
docker compose up -d          # Postgres on localhost:5433
```

### 2. Configure & run the backend

```bash
cd backend
cp src/main/resources/application-dev.yml.example src/main/resources/application-dev.yml
# set your Cloudinary URL and a JWT secret (see env vars below)
export CLOUDINARY_URL="cloudinary://API_KEY:API_SECRET@CLOUD_NAME"
export JWT_SECRET="$(openssl rand -base64 64)"

./mvnw spring-boot:run          # API on http://localhost:8080
```

Flyway runs the migrations automatically on startup (schema is validated, never auto-generated).
Swagger UI: **http://localhost:8080/swagger-ui.html**

### 3. Run the frontend

```bash
cd frontend
npm install
npm run dev                     # app on http://localhost:5173
```

The Vite dev server proxies `/api/*` to `http://localhost:8080`, so the JWT cookie stays first-party.

### Environment variables

| Variable | Where | Purpose |
|---|---|---|
| `POSTGRES_DB` / `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_PORT` | docker-compose (`.env`) | Local database container |
| `DB_URL` / `DB_USERNAME` / `DB_PASSWORD` | backend (prod) | PostgreSQL connection |
| `CLOUDINARY_URL` | backend | `cloudinary://API_KEY:API_SECRET@CLOUD_NAME` |
| `JWT_SECRET` | backend | Base64 signing key, ≥ 256 bits (`openssl rand -base64 64`) |
| `JWT_EXPIRATION_MS` | backend | JWT lifetime, defaults to 7 days |
| `FRONTEND_URL` | backend (prod) | Deployed frontend URL — feeds CORS + origin CSRF guard (required in prod) |
| `TRUSTED_PROXY_HOPS` | backend (prod) | X-Forwarded-For trusted hops for rate limiting (prod default 2) |
| `SPRING_PROFILES_ACTIVE` | backend | `dev` (default) or `prod` |

---

## 4. Useful scripts

### Backend (`cd backend`)
| Command | Description |
|---|---|
| `./mvnw spring-boot:run` | Run the API locally |
| `./mvnw clean verify` | Compile, run tests (Testcontainers) + JaCoCo report |
| `./mvnw test` | Run unit/integration tests |

### Frontend (`cd frontend`)
| Command | Description |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | Type-check (`tsc -b`) + production build |
| `npm run lint` | ESLint (incl. cyclomatic-complexity budget of 15) |
| `npm test` | Vitest run |
| `npm run preview` | Preview the production build |

---

## 5. Main features

- **JWT authentication** — register / login / logout, token stored in an **httpOnly cookie**, 7-day lifetime, no refresh token.
- **Projects** — create, edit, cover image upload (Cloudinary), delete (owner only).
- **Public sharing** — a project can be made public and viewed anonymously at `/p/:projectId` (read-only, active tracks only).
- **Tracks** — status workflow (DRAFT / IN_PROGRESS / DONE), archive/unarchive, drag-and-drop reordering.
- **Audio versions** — immutable, service-managed version numbers, audio uploaded to Cloudinary; only metadata (`label`, `notes`) is editable.
- **Tasks** — lightweight Kanban (TODO / DOING / DONE), optional assignee.
- **Comments (V1)** — on projects, tracks and versions.
- **Members & roles (V1)** — `OWNER` / `COLLABORATOR` / `VIEWER` with role-based permissions on both API and UI.

**MVP:** User, Project, Track, TrackVersion, Task.
**V1 — Collaboration:** ProjectMember, Comments (project / track / version).

---

## 6. Data model

7 core entities. Relations are `@ManyToOne` (always `LAZY`); children are fetched through repositories rather than `@OneToMany` collections.

```mermaid
erDiagram
    USER ||--o{ PROJECT : owns
    USER ||--o{ PROJECT_MEMBER : "member of"
    PROJECT ||--o{ PROJECT_MEMBER : has
    PROJECT ||--o{ TRACK : contains
    TRACK ||--o{ TRACK_VERSION : "has versions"
    PROJECT ||--o{ TASK : has
    USER ||--o{ TASK : "creates / assigned"
    PROJECT ||--o{ PROJECT_COMMENT : has
    TRACK ||--o{ TRACK_COMMENT : has
    TRACK_VERSION ||--o{ TRACK_VERSION_COMMENT : has
    USER ||--o{ PROJECT_COMMENT : authors

    USER {
        uuid id PK
        string email UK
        string username UK
        string password
        timestamp created_at
    }
    PROJECT {
        uuid id PK
        uuid owner_id FK
        string name
        string description
        string cover_url
        boolean is_public
    }
    TRACK {
        uuid id PK
        uuid project_id FK
        string name
        string status
        int position
        boolean archived
    }
    TRACK_VERSION {
        uuid id PK
        uuid track_id FK
        int version_number
        string audio_url
        string notes
        string label
        string original_file_name
    }
    TASK {
        uuid id PK
        uuid project_id FK
        uuid created_by_id FK
        uuid assigned_to_id FK "nullable"
        string title
        string status
    }
    PROJECT_MEMBER {
        uuid id PK
        uuid project_id FK
        uuid user_id FK
        string role
    }
    PROJECT_COMMENT {
        uuid id PK
        uuid project_id FK
        uuid author_id FK
        string content
    }
```

**Key constraints**

- **UNIQUE:** `users(email)`, `users(username)`, `project_members(project_id, user_id)`, `track_versions(track_id, version_number)`, partial `tracks(project_id, position) WHERE archived = false`.
- **ON DELETE CASCADE:** deleting a project removes its tracks, tasks, members and comments; deleting a track removes its versions and comments; deleting a version removes its comments. User FKs (`owner_id`, `created_by_id`, `assigned_to_id`, `author_id`) use `RESTRICT`.
- **Performance indexes** (V13): FK columns backing the hot list paths — `project_members(user_id)`, `tasks(project_id)`, the three comment FKs, and composite `tracks(project_id, archived, position)`.

**Design invariants**

- `version_number` is assigned by the service (`SELECT MAX + 1`), not DB auto-increment.
- `TrackVersion` audio and version number are **immutable** — create a new version instead of replacing.
- Creating a project auto-creates an `OWNER` `ProjectMember`.
- `ProjectResponse` exposes a computed `currentUserRole` (not stored).

See [DATA_MODEL.md](DATA_MODEL.md) and [API_DESIGN.md](API_DESIGN.md) for the full reference.

---

## 7. Key flow — new project to optimized track list

Creating a project, adding a track with an audio version (uploaded to Cloudinary), then listing tracks with a query optimized against the N+1 problem.

```mermaid
sequenceDiagram
    actor U as User
    participant FE as Frontend (React)
    participant API as Spring Boot API
    participant DB as PostgreSQL
    participant CL as Cloudinary

    Note over U,DB: 1 — Create project
    U->>FE: Fill "New project"
    FE->>API: POST /api/v1/projects (JWT cookie)
    API->>DB: INSERT project
    API->>DB: INSERT project_member (OWNER)
    API-->>FE: 201 ProjectResponse { currentUserRole: OWNER }

    Note over U,CL: 2 — Add a track + upload an audio version
    U->>FE: Create track, drop an audio file
    FE->>API: POST /projects/{id}/tracks
    API->>DB: INSERT track (position = MAX + 1)
    FE->>API: POST /tracks/{id}/versions (multipart audio)
    API->>API: Tika validates file type
    API->>CL: Upload audio
    CL-->>API: secure audio_url
    API->>DB: INSERT track_version (version_number = MAX + 1)
    API-->>FE: 201 TrackVersionResponse

    Note over FE,DB: 3 — Optimized track list (no N+1)
    FE->>API: GET /projects/{id}/tracks
    API->>DB: SELECT tracks (indexed by project_id, archived, position)
    API->>DB: Batched projections: version counts, latest notes,<br/>last comments — by trackIds IN (...)
    API-->>FE: TrackResponse[] (fixed number of queries)
```

The list endpoint resolves version counts, latest notes and last comments with **batched `IN (:trackIds)` projections** instead of per-track queries — a fixed number of round-trips regardless of track count.

### Authentication flow

```mermaid
sequenceDiagram
    actor U as User
    participant FE as Frontend
    participant API as Spring Boot API
    U->>FE: Submit credentials
    FE->>API: POST /api/v1/auth/login
    API->>API: Verify password (BCrypt), sign JWT
    API-->>FE: Set-Cookie: jwt (httpOnly, SameSite=Lax)
    FE->>API: GET /auth/me (cookie sent automatically)
    API-->>FE: 200 UserResponse
    Note over FE: On 401 → clear auth state, redirect to /login
```

---

## 8. Security

- **JWT in an httpOnly cookie** — not readable by JavaScript (XSS-resistant); `SameSite=Lax` and, in prod, `Secure`. A `Bearer` header fallback exists for Swagger only.
- **First-party cookie by design** — the frontend reaches the API through the Netlify `/api` proxy, so the cookie stays first-party and Safari's third-party-cookie blocking doesn't break auth.
- **Origin-based CSRF guard** — an origin-validation filter rejects state-changing requests from unexpected origins (driven by `FRONTEND_URL`).
- **Rate limiting** (Bucket4j) — login `5/min`, register `3/min`, public project view `60/min`, per client IP (read from `X-Forwarded-For` with a configurable trusted-proxy hop count).
- **Bean Validation** on all incoming DTOs; structured error responses via `@ControllerAdvice`.
- **File upload hardening** — server-side MIME detection with Apache Tika (content, not extension); size limits; Cloudinary URLs generated server-side.
- **Information-leak prevention** — accessing an existing resource without permission returns **404, not 403**, so existence isn't disclosed. Same masking on the public endpoint (`is_public = false` → 404).
- **Passwords** hashed with BCrypt; entities never returned directly.

---

## 9. Production notes

- **Frontend → Netlify** (`netlify.toml`): builds `frontend/`, publishes `dist/`, proxies `/api/*` to the Railway API, and serves the SPA fallback for client-side routes.
- **API → Railway**: `SPRING_PROFILES_ACTIVE=prod`. Prod fails fast at startup if `FRONTEND_URL` is unset. Cookie is `Secure` + `SameSite=Lax`.
- **Database**: PostgreSQL (Railway). Flyway migrations run on startup; `ddl-auto: validate` guarantees the JPA model matches the migrated schema — the app never mutates the schema itself.
- **Trusted proxies**: two hops in prod (Netlify proxy → Railway edge) so the rate limiter reads the real client IP.
- **CI (GitHub Actions)**: `backend-ci` runs `mvnw clean verify` (Testcontainers Postgres) on changes under `backend/`; `frontend-ci` runs lint + tests + build on changes under `frontend/`. Both gate PRs to `main`/`develop`.
- **Storage**: Cloudinary holds audio files and cover images; project deletion best-effort deletes the project's Cloudinary folder.

---

## Reference documents

- [DATA_MODEL.md](DATA_MODEL.md) — entities, fields, constraints, JPA relations
- [API_DESIGN.md](API_DESIGN.md) — endpoints, DTOs, error format
- [CLAUDE.md](CLAUDE.md) — architecture rules & conventions
