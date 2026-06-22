# Music Workspace — Claude Code context

## Project
Collaborative music project management platform. Portfolio project to learn Spring Boot and target Java CDA apprenticeships.

## Stack
- **Backend**: Java 17+, Spring Boot 3, Spring Web, Spring Data JPA, Spring Security (JWT), PostgreSQL, Flyway, Bean Validation, MapStruct, Lombok
- **Testing**: JUnit 5, Mockito, MockMvc
- **Docs**: Springdoc OpenAPI (Swagger UI)
- **Storage**: Cloudinary (audio files + cover images)
- **Infra**: Docker, Railway, GitHub Actions

## Architecture rules
- All business logic lives in the **service layer** — never in controllers
- Controllers only route and delegate
- No direct DB access outside repositories
- Entities are **never** exposed directly — always map to DTOs via MapStruct
- Always use fetch **LAZY** on JPA relations
- No `@OneToMany` on parent entities — fetch children via repository (`findByProjectId(...)`)

## Package structure
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

## Naming conventions
| Type | Convention | Example |
|---|---|---|
| Incoming DTOs | `CreateXRequest` / `UpdateXRequest` | `CreateProjectRequest` |
| Outgoing DTOs | `XResponse` | `ProjectResponse` |
| Endpoints | `/api/v1/resources` (plural, kebab-case) | `/api/v1/projects` |
| Entities | PascalCase, singular | `Project`, `TrackVersion` |
| Packages | lowercase, singular | `entity`, `controller` |

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
- `Project` — id, owner_id (FK User), name, description, cover_url, created_at, updated_at
- `Track` — id, project_id (FK Project), name, description, status (DRAFT/IN_PROGRESS/DONE), archived, created_at, updated_at
- `TrackVersion` — id, track_id (FK Track), version_number (managed by service), audio_url, notes, created_at
- `Task` — id, project_id, created_by_id, assigned_to_id (nullable), title, description, status (TODO/DOING/DONE), created_at, updated_at

## Design rules
- `version_number` on TrackVersion is managed by the service (`SELECT MAX + 1`), not DB auto-increment
- `TrackVersion` is immutable — no update, no delete. Create a new version instead
- `assigned_to_id` on Task is nullable from MVP to anticipate V1 without migration
- When a Project is created, automatically create a `ProjectMember` entry with role OWNER

## Git
- Branches: `main` + `develop` + `feature/feature-name`
- Always work on a feature branch, merge to develop
- No Co-Authored-By in commit messages
- 
## Reference documents
- `DATA_MODEL.md` — entities, fields, constraints, JPA relations
- `API_DESIGN.md` — endpoints, DTOs, error format

## Current focus
👥 Phase 3 — V1 Collaboration Objectif : rôles, permissions, commentaires
    ** Step 9 — Système de rôles **
- [ ] Entité ProjectMember (User ↔ Project + rôle)
- [ ] Migration Flyway
- [ ] Inviter un membre, modifier son rôle, le retirer
- [ ] DTOs + tests


  On travaille sur la branche `feature/roles`. Crée-la depuis develop si elle n'existe pas