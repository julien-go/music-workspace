# Music Workspace — Claude Code context

## Project

Collaborative music project management platform. Portfolio project to learn Spring Boot and target Java CDA apprenticeships.

## Stack

- **Backend**: Java 17+, Spring Boot 3, Spring Web, Spring Data JPA, Spring Security (JWT), PostgreSQL, Flyway, Bean Validation, MapStruct, Lombok
- **Testing**: JUnit 5, Mockito, MockMvc
- **Docs**: Springdoc OpenAPI (Swagger UI)
- **Storage**: Cloudinary (audio files + cover images)
- **Infra**: Docker, Railway, GitHub Actions
- **Frontend**: Vite + React + TypeScript, Tailwind CSS, shadcn/ui, TanStack Router, TanStack Query, Zustand

## Backend — Architecture rules

- All business logic lives in the **service layer** — never in controllers
- Controllers only route and delegate
- No direct DB access outside repositories
- Entities are **never** exposed directly — always map to DTOs via MapStruct
- Always use fetch **LAZY** on JPA relations
- No `@OneToMany` on parent entities — fetch children via repository (`findByProjectId(...)`)

## Backend — Package structure

```
controller/   → routing only
service/      → all business logic
repository/   → JPA repositories
entity/       → JPA entities
dto/          → request/response objects (MapStruct mapping)
security/     → JWT filter, Spring Security config
exception/    → @ControllerAdvice, custom exceptions
config/       → beans, CORS, Cloudinary, etc.
```

## Backend — Naming conventions

| Type          | Convention                               | Example                   |
| ------------- | ---------------------------------------- | ------------------------- |
| Incoming DTOs | `CreateXRequest` / `UpdateXRequest`      | `CreateProjectRequest`    |
| Outgoing DTOs | `XResponse`                              | `ProjectResponse`         |
| Endpoints     | `/api/v1/resources` (plural, kebab-case) | `/api/v1/projects`        |
| Entities      | PascalCase, singular                     | `Project`, `TrackVersion` |
| Packages      | lowercase, singular                      | `entity`, `controller`    |

## Error handling

All errors follow this format via `@ControllerAdvice`:

```json
{
  "status": 404,
  "error": "NOT_FOUND",
  "message": "Project not found",
  "errors": []
}
```

HTTP codes: 404 NOT_FOUND · 401 UNAUTHORIZED · 403 FORBIDDEN · 422 VALIDATION_ERROR · 409 CONFLICT · 500 INTERNAL_ERROR

**Rule**: if a user doesn't have access to an existing resource, return 404 (not 403) to avoid information leaks.

## Data model (MVP)

- `User` — id (UUID), email, username, password, created_at
- `Project` — id, owner_id (FK User), name, description, cover_url, created_at, updated_at, **currentUserRole** (computed, not stored)
- `Track` — id, project_id (FK Project), name, description, status (DRAFT/IN_PROGRESS/DONE), archived, created_at, updated_at
- `TrackVersion` — id, track_id (FK Track), version_number (managed by service), audio_url, notes, created_at
- `Task` — id, project_id, created_by_id, assigned_to_id (nullable), title, description, status (TODO/DOING/DONE), created_at, updated_at

## Design rules

- `version_number` on TrackVersion is managed by the service (`SELECT MAX + 1`), not DB auto-increment
- `TrackVersion` audio and `version_number` are immutable — no replacement, no delete. Create a new version instead. Only metadata (`label`, `notes`) is editable via `PATCH`
- `assigned_to_id` on Task is nullable from MVP to anticipate V1 without migration
- When a Project is created, automatically create a `ProjectMember` entry with role OWNER
- `ProjectResponse` includes `currentUserRole` (OWNER / COLLABORATOR / VIEWER) resolved from ProjectMember for the authenticated user

## Frontend — Structure

Feature-based organization. Each feature owns its components, hooks, api calls and types.

```
src/
  features/
    auth/
      components/
      hooks/
      api.ts
      types.ts
    projects/
      components/
      hooks/
      api.ts
      types.ts
    tracks/
    tasks/
    comments/
  components/       → shared/generic components only (Button, Modal, etc.)
  lib/              → fetch wrapper, utils
  store/            → Zustand stores
  routes/
    index.ts        → all route definitions (manual config, not file-based)
```

## Frontend — Naming conventions

| Type                | Convention                 | Example                               |
| ------------------- | -------------------------- | ------------------------------------- |
| Components          | PascalCase                 | `ProjectCard.tsx`, `TrackList.tsx`    |
| Hooks               | camelCase prefixed `use`   | `useProjects.ts`, `useCurrentRole.ts` |
| Pages               | PascalCase suffixed `Page` | `ProjectDetailPage.tsx`               |
| api / types / utils | camelCase                  | `api.ts`, `types.ts`                  |
| Route definitions   | camelCase                  | `projectDetail`, `trackView`          |

Pages live inside their feature folder (`features/projects/ProjectDetailPage.tsx`), not in a separate `pages/` directory.

## Frontend — State management

- **Server state** → TanStack Query (all API data)
- **Global client state** → Zustand (auth user, current role)
- **Local state** → useState

no useEffect for data fetching or derived state — use TanStack Query and useMemo instead.

## Frontend — Auth

- JWT stored in **httpOnly cookie** (set by backend on login)
- On 401 response: clear Zustand auth state + redirect to `/login`
- No refresh token — JWT lifetime set to 7 days

## Frontend — Permissions

- `ProjectResponse` includes `currentUserRole` for the authenticated user
- UI shows/hides actions based on role (OWNER / COLLABORATOR / VIEWER)
- VIEWER can read and comment — cannot create/edit/delete resources
- COLLABORATOR can create/edit — cannot manage members or delete the project
- OWNER has full access

## Frontend — Optimistic updates

Apply optimistic updates on lightweight actions only:

- Task status change
- Track archive toggle

Do NOT use optimistic updates on: audio upload, project deletion, member management.

## Frontend — Routes

| Path                                   | Access | Description                                     |
| -------------------------------------- | ------ | ----------------------------------------------- |
| `/`                                    | public | Home / landing                                  |
| `/login`                               | public | Login                                           |
| `/register`                            | public | Register                                        |
| `/dashboard`                           | auth   | Project list                                    |
| `/projects/:projectId`                 | auth   | Project detail (tracks, tasks, members sidebar) |
| `/projects/:projectId/tracks/:trackId` | auth   | Track detail (versions, comments)               |
| `/p/:projectId`                        | public | Public read-only project view                   |
| `*`                                    | public | 404 catch-all                                   |

## Frontend — Testing (Vitest)

- Custom hooks — all business logic hooks in features/
- Utility functions — fetch wrapper, helpers in lib/
- Critical components — auth forms, role-based conditional rendering
- No tests on pure UI components (buttons, layout, etc.)

## Git

- Branches: `main` + `develop` + `feature/feature-name`
- Always work on a feature branch, merge to develop
- No Co-Authored-By in commit messages

## Reference documents

- `DATA_MODEL.md` — entities, fields, constraints, JPA relations
- `API_DESIGN.md` — endpoints, DTOs, error format

## Current focus

🎨 Phase 4 — Frontend

** Étape 13 — UI MVP **

- [x] Design system & visual direction (palette, typo, variables CSS shadcn, références visuelles)
- [x] Homepage + layout global (nav, structure des pages, routing visuel)
- [x] Auth (login / register)
- [x] Dashboard projets
- [x] Vue projet (tracks + tâches)
- [x] Vue track (versions + player audio)
