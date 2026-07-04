# API Design

Base URL: `/api/v1` · Auth: httpOnly cookie `jwt` (set by server on login/register) · Fallback: `Authorization: Bearer <token>` (Swagger UI) · Responses: JSON

---

## Error Handling

All errors follow this format via `@ControllerAdvice`:

```json
{
  "status": 404,
  "error": "NOT_FOUND",
  "message": "Project not found",
  "errors": []
}
```

Validation errors (422) — `errors` is a flat array of `"field: message"` strings:

```json
{
  "status": 422,
  "error": "VALIDATION_ERROR",
  "message": "Validation failed",
  "errors": [
    "email: must be a valid email",
    "password: must be at least 8 characters"
  ]
}
```

### HTTP Codes

| Code | error | Situation |
|---|---|---|
| 404 | `NOT_FOUND` | Resource not found |
| 401 | `UNAUTHORIZED` | No token / invalid token |
| 403 | `FORBIDDEN` | Authenticated but not allowed (rare — see rule below) |
| 422 | `VALIDATION_ERROR` | Invalid input (Bean Validation) |
| 409 | `CONFLICT` | Conflict — e.g. email already taken |
| 429 | `TOO_MANY_REQUESTS` | Rate limit exceeded — login: 5/min per IP, register: 3/min per IP |
| 500 | `INTERNAL_ERROR` | Unexpected server error |

> **403 vs 404 rule**: when a user doesn't have access to an existing resource, return 404 (not 403). A 403 confirms the resource exists — that's an information leak.

---

## Conventions

- Use `PATCH` over `PUT` for updates: PATCH updates only the provided fields, PUT replaces the entire resource.
- Endpoints are plural and kebab-case: `/api/v1/projects`, `/api/v1/track-versions`
- DTOs: `CreateXRequest` / `UpdateXRequest` (all fields optional) / `XResponse`
- Nested objects in responses use a `UserSummary` shape: `{ "id": "uuid", "username": "john" }`

---

## Endpoints

### Auth

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/auth/register` | Register | No |
| POST | `/auth/login` | Login → sets JWT cookie | No |
| POST | `/auth/logout` | Logout → clears the JWT cookie | No |
| GET | `/auth/me` | Authenticated user profile | Yes |

### Projects

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/projects` | List projects of the authenticated user | Yes |
| POST | `/projects` | Create a project | Yes |
| GET | `/projects/{id}` | Project detail | Yes |
| PATCH | `/projects/{id}` | Update a project | Yes |
| DELETE | `/projects/{id}` | Delete a project | Yes |
| POST | `/projects/{id}/cover` | Upload cover image | Yes |

> `isPublic` in the PATCH body is OWNER-only (name/description stay COLLABORATOR) — a non-owner sending it gets 404, per the masking rule.

### Public sharing

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/public/projects/{id}` | Public read-only project view | No |

> Returns 404 if the project does not exist **or** `is_public = false` (same masking policy). Only active (non-archived) tracks are included. Never exposes members, tasks, comments or internal user IDs.

### Tracks

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/projects/{id}/tracks` | List active tracks of a project | Yes |
| GET | `/projects/{id}/tracks?archived=true` | List archived tracks of a project | Yes |
| POST | `/projects/{id}/tracks` | Create a track | Yes |
| GET | `/projects/{id}/tracks/{trackId}` | Track detail | Yes |
| PATCH | `/projects/{id}/tracks/{trackId}` | Update a track | Yes |
| PATCH | `/projects/{id}/tracks/{trackId}/archive` | Archive a track | Yes |
| PATCH | `/projects/{id}/tracks/{trackId}/unarchive` | Unarchive a track | Yes |
| PATCH | `/projects/{id}/tracks/reorder` | Reorder non-archived tracks | Yes |

### Track Versions

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/projects/{id}/tracks/{trackId}/versions` | List versions | Yes |
| POST | `/projects/{id}/tracks/{trackId}/versions` | Create a version + upload audio | Yes |
| GET | `/projects/{id}/tracks/{trackId}/versions/{vId}` | Version detail | Yes |
| PATCH | `/projects/{id}/tracks/{trackId}/versions/{vId}` | Edit version metadata (label, notes) | Yes |

> The `audio` and `version_number` are immutable — no replacement, no deletion (create a new version instead). Only the metadata (`label`, `notes`) is editable via `PATCH`.

### Tasks

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/projects/{id}/tasks` | List tasks of a project | Yes |
| POST | `/projects/{id}/tasks` | Create a task | Yes |
| PATCH | `/projects/{id}/tasks/{taskId}` | Update / change status | Yes |
| DELETE | `/projects/{id}/tasks/{taskId}` | Delete a task | Yes |

### Members (V1)

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/projects/{id}/members` | List members | Yes |
| POST | `/projects/{id}/members` | Invite a member | Yes |
| PATCH | `/projects/{id}/members/{userId}` | Update role | Yes |
| DELETE | `/projects/{id}/members/{userId}` | Remove a member | Yes |

### Comments (V1)

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/projects/{id}/comments` | Project comments | Yes |
| POST | `/projects/{id}/comments` | Add a comment | Yes |
| DELETE | `/projects/{id}/comments/{commentId}` | Delete a comment | Yes |
| GET | `/projects/{id}/tracks/{trackId}/comments` | Track comments | Yes |
| POST | `/projects/{id}/tracks/{trackId}/comments` | Comment on a track | Yes |
| DELETE | `/projects/{id}/tracks/{trackId}/comments/{commentId}` | Delete | Yes |
| GET | `/projects/{id}/tracks/{trackId}/versions/{vId}/comments` | Version comments | Yes |
| POST | `/projects/{id}/tracks/{trackId}/versions/{vId}/comments` | Comment on a version | Yes |
| DELETE | `/projects/{id}/tracks/{trackId}/versions/{vId}/comments/{commentId}` | Delete | Yes |

---

## DTOs

### Auth

```json
// RegisterRequest
{
  "email": "john@example.com",
  "username": "john",
  "password": "motdepasse123"
}

// LoginRequest
{
  "email": "john@example.com",
  "password": "motdepasse123"
}

// AuthResponse (register + login)
// JWT is set as httpOnly cookie — not returned in body
{
  "user": {
    "id": "uuid",
    "email": "john@example.com",
    "username": "john"
  }
}

// UserResponse
{
  "id": "uuid",
  "email": "john@example.com",
  "username": "john",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

### Projects

```json
// CreateProjectRequest
{
  "name": "My album",
  "description": "Optional description"
}

// UpdateProjectRequest (all fields optional — PATCH)
// isPublic is OWNER-only; name/description are COLLABORATOR+
{
  "name": "New name",
  "description": "New description",
  "isPublic": true
}

// ProjectResponse
{
  "id": "uuid",
  "name": "My album",
  "description": "Description",
  "coverUrl": null,
  "isPublic": false,
  "owner": { "id": "uuid", "username": "john" },
  "currentUserRole": "OWNER",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}

// PublicProjectResponse (GET /public/projects/{id} — no auth)
// owner is a bare username; tracks are active only, latest version audio only
{
  "id": "uuid",
  "name": "My album",
  "description": "Description",
  "coverUrl": null,
  "owner": "john",
  "tracks": [
    {
      "id": "uuid",
      "name": "Intro",
      "status": "DRAFT",
      "versionCount": 3,
      "latestVersionId": "uuid",
      "latestVersionNumber": 3,
      "latestAudioUrl": "https://cloudinary.com/..."
    }
  ]
}
// latestVersionId/latestAudioUrl are null and latestVersionNumber is 0 when the track has no versions
// Response carries Cache-Control: public, max-age=60; rate-limited per IP (60/min)
```

### Tracks

```json
// CreateTrackRequest
{
  "name": "Intro",
  "description": "Optional description",
  "status": "DRAFT"
}

// UpdateTrackRequest (all fields optional)
{
  "name": "New name",
  "description": "New description",
  "status": "IN_PROGRESS"
}

// ReorderTracksRequest
{
  "trackIds": ["uuid1", "uuid2", "uuid3"]
}

// TrackResponse
{
  "id": "uuid",
  "position": 0,
  "name": "Intro",
  "description": "Description",
  "status": "DRAFT",
  "archived": false,
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z",
  "versionCount": 3,
  "lastVersionNote": "Tempo légèrement réduit",
  "lastComment": {
    "id": "uuid",
    "content": "La basse est trop forte",
    "author": { "id": "uuid", "username": "john" },
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
// lastVersionNote and lastComment are nullable (null if no versions / no comments)
```

### Track Versions

```json
// CreateTrackVersionRequest (multipart/form-data fields)
// Audio file is sent as multipart/form-data alongside these fields.
// The Cloudinary URL is generated server-side — the client does not provide it.
// originalFileName is extracted server-side from the uploaded file — not provided by the client.
{
  "notes": "First demo, tempo needs revisiting",
  "label": "Rough mix"
}

// UpdateTrackVersionRequest (all fields optional — PATCH, metadata only)
// Blank string clears the field (stored as null). audio and version_number cannot be changed.
{
  "label": "Final mix",
  "notes": "Updated notes"
}

// TrackVersionResponse
{
  "id": "uuid",
  "versionNumber": 1,
  "audioUrl": "https://cloudinary.com/...",
  "notes": "First demo, tempo needs revisiting",
  "label": "Rough mix",
  "originalFileName": "intro-demo.mp3",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
// label and originalFileName are nullable. The file extension is derived client-side from originalFileName.
```

### Tasks

```json
// CreateTaskRequest
{
  "title": "Record guitar",
  "description": "Optional description",
  "assignedToId": null
}

// UpdateTaskRequest (all fields optional)
{
  "title": "New title",
  "status": "DOING",
  "assignedToId": "uuid"
}

// TaskResponse
{
  "id": "uuid",
  "title": "Record guitar",
  "description": "Description",
  "status": "TODO",
  "createdBy": { "id": "uuid", "username": "john" },
  "assignedTo": null,
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

### Members (V1)

```json
// CreateMemberRequest
{
  "email": "collaborateur@example.com",
  "role": "COLLABORATOR"
}

// UpdateMemberRoleRequest
{
  "role": "VIEWER"
}

// ProjectMemberResponse
{
  "id": "uuid",
  "user": { "id": "uuid", "username": "john" },
  "role": "COLLABORATOR",
  "joinedAt": "2024-01-01T00:00:00Z"
}
```

### Comments (V1)

```json
// CreateCommentRequest
{
  "content": "The bass mix is too loud"
}

// CommentResponse
{
  "id": "uuid",
  "content": "The bass mix is too loud",
  "author": { "id": "uuid", "username": "john" },
  "createdAt": "2024-01-01T00:00:00Z"
}
```
