# API Design

Base URL: `/api/v1` · Auth: `Authorization: Bearer <token>` · Responses: JSON

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

Validation errors (422):

```json
{
  "status": 422,
  "error": "VALIDATION_ERROR",
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "must be a valid email" },
    { "field": "password", "message": "must be at least 8 characters" }
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
| POST | `/auth/login` | Login → returns JWT | No |
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

### Tracks

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/projects/{id}/tracks` | List tracks of a project | Yes |
| POST | `/projects/{id}/tracks` | Create a track | Yes |
| GET | `/projects/{id}/tracks/{trackId}` | Track detail | Yes |
| PATCH | `/projects/{id}/tracks/{trackId}` | Update a track | Yes |
| PATCH | `/projects/{id}/tracks/{trackId}/archive` | Archive a track | Yes |

### Track Versions

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/projects/{id}/tracks/{trackId}/versions` | List versions | Yes |
| POST | `/projects/{id}/tracks/{trackId}/versions` | Create a version + upload audio | Yes |
| GET | `/projects/{id}/tracks/{trackId}/versions/{vId}` | Version detail | Yes |

> No DELETE or PATCH on versions — a version is immutable. Create a new one instead.

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
{
  "token": "eyJhbGc...",
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
{
  "name": "New name",
  "description": "New description"
}

// ProjectResponse
{
  "id": "uuid",
  "name": "My album",
  "description": "Description",
  "coverUrl": null,
  "owner": { "id": "uuid", "username": "john" },
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
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

// TrackResponse
{
  "id": "uuid",
  "name": "Intro",
  "description": "Description",
  "status": "DRAFT",
  "archived": false,
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

### Track Versions

```json
// CreateTrackVersionRequest
// Audio file is sent as multipart/form-data alongside this JSON.
// The Cloudinary URL is generated server-side — the client does not provide it.
{
  "notes": "First demo, tempo needs revisiting"
}

// TrackVersionResponse
{
  "id": "uuid",
  "versionNumber": 1,
  "audioUrl": "https://cloudinary.com/...",
  "notes": "First demo, tempo needs revisiting",
  "createdAt": "2024-01-01T00:00:00Z"
}
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
// AddMemberRequest
{
  "userId": "uuid",
  "role": "COLLABORATOR"
}

// UpdateMemberRoleRequest
{
  "role": "VIEWER"
}

// ProjectMemberResponse
{
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
