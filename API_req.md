# DELPRO LABS - Complete API Routes Reference

## 📋 All API Endpoints

Base URL: `http://localhost:5000/api` (development)

---

## 🔐 Authentication Routes (`/api/auth`)

### 1. Client Signup

```
POST /api/auth/signup
Access: Public
Body: {
  "email": "client@company.com",
  "password": "Password123",
  "name": "John Doe"
}
Response: 201 Created
```

### 2. Login

```
POST /api/auth/login
Access: Public
Body: {
  "email": "user@example.com",
  "password": "password123"
}
Response: 200 OK
Returns: { user, accessToken, refreshToken }
```

### 3. Activate Account

```
POST /api/auth/activate
Access: Public
Body: {
  "token": "activation-token-from-email"
}
Response: 200 OK
```

### 4. Forgot Password

```
POST /api/auth/forgot-password
Access: Public
Body: {
  "email": "user@example.com"
}
Response: 200 OK
```

### 5. Reset Password

```
POST /api/auth/reset-password
Access: Public
Body: {
  "token": "reset-token-from-email",
  "newPassword": "NewPassword123"
}
Response: 200 OK
```

### 6. Refresh Token

```
POST /api/auth/refresh
Access: Public
Body: {
  "refreshToken": "jwt-refresh-token"
}
Response: 200 OK
Returns: { accessToken }
```

### 7. Logout

```
POST /api/auth/logout
Access: Protected
Headers: Authorization: Bearer <access-token>
Response: 200 OK
```

---

## 📋 Project Routes (`/api/projects`)

### 8. Get All Projects (Role-Based)

```
GET /api/projects
Access: Protected (All roles)
Headers: Authorization: Bearer <access-token>
Query Params:
  - status (optional): pending | in_progress | completed | on_hold
  - priority (optional): low | medium | high
  - search (optional): search text
  - page (optional): page number (default: 1)
  - limit (optional): items per page (default: 20)

Response: 200 OK
Returns:
  - Super Admin: All projects
  - Internal Staff: All projects
  - Client: Only their projects
```

### 9. Get Single Project

```
GET /api/projects/:id
Access: Protected (All roles)
Headers: Authorization: Bearer <access-token>
Params: id (projectId e.g., PRJ-001)
Response: 200 OK
Authorization:
  - Super Admin: Any project
  - Internal Staff: Any project
  - Client: Only their projects
```

### 10. Create Project

```
POST /api/projects
Access: Protected (Super Admin, Internal Staff only)
Headers: Authorization: Bearer <access-token>
Body: {
  "title": "Project Title",
  "description": "Project description",
  "clientId": "client-mongo-id",
  "testType": "Soil Testing",
  "priority": "medium",
  "status": "pending",
  "dueDate": "2024-04-30T00:00:00Z"
}
Response: 201 Created
```

### 11. Update Project

```
PUT /api/projects/:id
Access: Protected (Super Admin, Internal Staff only)
Headers: Authorization: Bearer <access-token>
Params: id (projectId e.g., PRJ-001)
Body: {
  "title": "Updated Title",
  "description": "Updated description",
  "status": "in_progress",
  "priority": "high",
  "dueDate": "2024-05-15T00:00:00Z"
}
Response: 200 OK
```

### 12. Delete Project

```
DELETE /api/projects/:id
Access: Protected (Super Admin, Internal Staff only)
Headers: Authorization: Bearer <access-token>
Params: id (projectId e.g., PRJ-001)
Response: 200 OK
```

### 13. Assign Staff to Project

```
PUT /api/projects/:id/assign
Access: Protected (Super Admin only)
Headers: Authorization: Bearer <access-token>
Params: id (projectId e.g., PRJ-001)
Body: {
  "staffId": "staff-mongo-id"
}
Response: 200 OK
Note: Auto-updates project status to "in_progress"
```

---

## ⚡ FastTrack Routes (`/api/fasttrack`)

### 14. Get All FastTracks

```
GET /api/fasttrack
Access: Protected (Super Admin, Internal Staff)
Headers: Authorization: Bearer <access-token>
Response: 200 OK
Note: Staff can view but not modify
```

### 15. Generate FastTrack ID

```
GET /api/fasttrack/generate-id
Access: Protected (Super Admin only)
Headers: Authorization: Bearer <access-token>
Response: 200 OK
Returns: { id: "Delpro/Report/2026/001" }
```

### 16. Create FastTrack

```
POST /api/fasttrack
Access: Protected (Super Admin only)
Headers: Authorization: Bearer <access-token>
Body: {
  "clientName": "Client Company Name"
}
Response: 201 Created
Note: ID is auto-generated (Delpro/Report/YYYY/XXX)
```

### 17. Update FastTrack

```
PUT /api/fasttrack/:id
Access: Protected (Super Admin only)
Headers: Authorization: Bearer <access-token>
Params: id (trackId e.g., Delpro/Report/2026/001)
Body: {
  "clientName": "Updated Client Name"
}
Response: 200 OK
```

### 18. Publish FastTrack

```
PUT /api/fasttrack/:id/publish
Access: Protected (Super Admin only)
Headers: Authorization: Bearer <access-token>
Params: id (trackId e.g., Delpro/Report/2026/001)
Response: 200 OK
Note: Sets isPublished to true and records publishedAt timestamp
```

### 19. Delete FastTrack

```
DELETE /api/fasttrack/:id
Access: Protected (Super Admin only)
Headers: Authorization: Bearer <access-token>
Params: id (trackId e.g., Delpro/Report/2026/001)
Response: 200 OK
```

---

## 👥 Staff & Client Routes (`/api/staff`)

### 20. Get All Internal Staff

```
GET /api/staff
Access: Protected (Super Admin, Internal Staff)
Headers: Authorization: Bearer <access-token>
Response: 200 OK
Returns: List of all internal staff with specializations
```

### 21. Create Staff Member

```
POST /api/staff
Access: Protected (Super Admin only)
Headers: Authorization: Bearer <access-token>
Body: {
  "name": "Staff Name",
  "email": "staff@delprolabs.in",
  "specialization": "Soil & Geotechnical Testing"
}
Response: 201 Created
Returns: Staff data including auto-generated tempPassword
Note: Email sent to staff with credentials
```

### 22. Get All Clients

```
GET /api/clients
Access: Protected (Super Admin, Internal Staff)
Headers: Authorization: Bearer <access-token>
Response: 200 OK
Returns: List of all clients (for dropdown in create project)
```

---

## 📊 Summary Table

| #   | Method | Endpoint                     | Access      | Purpose                   |
| --- | ------ | ---------------------------- | ----------- | ------------------------- |
| 1   | POST   | `/api/auth/signup`           | Public      | Client registration       |
| 2   | POST   | `/api/auth/login`            | Public      | User login                |
| 3   | POST   | `/api/auth/activate`         | Public      | Activate account          |
| 4   | POST   | `/api/auth/forgot-password`  | Public      | Request password reset    |
| 5   | POST   | `/api/auth/reset-password`   | Public      | Reset password            |
| 6   | POST   | `/api/auth/refresh`          | Public      | Refresh access token      |
| 7   | POST   | `/api/auth/logout`           | Protected   | Logout user               |
| 8   | GET    | `/api/projects`              | Protected   | Get projects (role-based) |
| 9   | GET    | `/api/projects/:id`          | Protected   | Get single project        |
| 10  | POST   | `/api/projects`              | Admin/Staff | Create project            |
| 11  | PUT    | `/api/projects/:id`          | Admin/Staff | Update project            |
| 12  | DELETE | `/api/projects/:id`          | Admin/Staff | Delete project            |
| 13  | PUT    | `/api/projects/:id/assign`   | Admin Only  | Assign staff              |
| 14  | GET    | `/api/fasttrack`             | Admin/Staff | Get FastTracks            |
| 15  | GET    | `/api/fasttrack/generate-id` | Admin Only  | Generate ID               |
| 16  | POST   | `/api/fasttrack`             | Admin Only  | Create FastTrack          |
| 17  | PUT    | `/api/fasttrack/:id`         | Admin Only  | Update FastTrack          |
| 18  | PUT    | `/api/fasttrack/:id/publish` | Admin Only  | Publish FastTrack         |
| 19  | DELETE | `/api/fasttrack/:id`         | Admin Only  | Delete FastTrack          |
| 20  | GET    | `/api/staff`                 | Admin/Staff | Get all staff             |
| 21  | POST   | `/api/staff`                 | Admin Only  | Create staff              |
| 22  | GET    | `/api/clients`               | Admin/Staff | Get all clients           |

---

## 🎯 Role-Based Access Summary

### Super Admin (`super_admin`)

✅ All endpoints (full access)

### Internal Staff (`internal_staff`)

✅ Auth routes (login, password reset)
✅ Projects - View all, Create, Update, Delete
✅ FastTrack - View only (read-only)
✅ Staff - View list
✅ Clients - View list
❌ FastTrack - Cannot create/edit/delete
❌ Staff - Cannot create
❌ Project Assignment - Cannot assign staff

### Client (`client`)

✅ Auth routes (signup, login, activate, password reset)
✅ Projects - View own projects only
❌ Projects - Cannot create/edit/delete
❌ FastTrack - No access
❌ Staff - No access
❌ Clients - No access

---

## 🔑 Authentication Header Format

All protected routes require:

```
Authorization: Bearer <access-token>
```

Example:

```bash
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
     http://localhost:5000/api/projects
```

---

## 📝 Sample Request/Response Examples

### Login Request

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "niraj@delprolabs.in",
  "password": "demo123"
}
```

### Login Response

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "64abc123def456789",
      "email": "niraj@delprolabs.in",
      "name": "Niraj Sir",
      "role": "super_admin",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Get Projects Request

```bash
GET /api/projects?status=pending&page=1&limit=10
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Create Project Request

```bash
POST /api/projects
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "title": "Soil Compaction Test - Highway Project",
  "description": "Complete soil compaction analysis",
  "clientId": "64abc789def123456",
  "testType": "Soil Testing",
  "priority": "high",
  "dueDate": "2024-04-15T00:00:00Z"
}
```

### Generate FastTrack ID Request

```bash
GET /api/fasttrack/generate-id
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Generate FastTrack ID Response

```json
{
  "success": true,
  "data": {
    "id": "Delpro/Report/2026/003"
  }
}
```

---

## ⚠️ Error Response Format

All errors follow this format:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [] // Optional validation errors
}
```

### Common HTTP Status Codes

- `200 OK` - Successful GET, PUT
- `201 Created` - Successful POST (resource created)
- `400 Bad Request` - Validation error
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Duplicate resource (e.g., email exists)
- `500 Internal Server Error` - Server error

---

## 🧪 Testing with Postman/Insomnia

### 1. Create Environment

```
BASE_URL: http://localhost:5000/api
ACCESS_TOKEN: (will be set after login)
```

### 2. Login Flow

1. POST `{{BASE_URL}}/auth/login`
2. Copy `accessToken` from response
3. Set as environment variable
4. Use in subsequent requests

### 3. Sample Collection Order

```
1. POST /auth/signup (client)
2. POST /auth/login
3. GET /projects (get all)
4. POST /projects (create new)
5. GET /projects/:id (get single)
6. PUT /projects/:id (update)
7. PUT /projects/:id/assign (assign staff)
8. GET /fasttrack/generate-id
9. POST /fasttrack (create)
10. PUT /fasttrack/:id/publish
```

---

## 🔒 Security Notes

1. **Never expose JWT secrets** - Keep in .env
2. **HTTPS in production** - Always use SSL
3. **Rate limiting** - Implement on auth routes
4. **Input validation** - Validate all request bodies
5. **CORS** - Configure allowed origins
6. **Password strength** - Enforce minimum requirements
7. **Token expiry** - Keep access tokens short-lived (1h)

---

## 📦 Postman Collection Structure

```
DELPRO LABS API/
├── Auth/
│   ├── Signup
│   ├── Login
│   ├── Activate Account
│   ├── Forgot Password
│   ├── Reset Password
│   ├── Refresh Token
│   └── Logout
├── Projects/
│   ├── Get All Projects
│   ├── Get Single Project
│   ├── Create Project
│   ├── Update Project
│   ├── Delete Project
│   └── Assign Staff
├── FastTrack/
│   ├── Get All FastTracks
│   ├── Generate ID
│   ├── Create FastTrack
│   ├── Update FastTrack
│   ├── Publish FastTrack
│   └── Delete FastTrack
└── Staff & Clients/
    ├── Get All Staff
    ├── Create Staff
    └── Get All Clients
```

---

**Total Routes: 22 Endpoints** ✅  
Ready for implementation and testing! 🚀
