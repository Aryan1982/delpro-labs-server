# DELPRO LABS Backend Setup

Complete backend implementation for the DELPRO LABS management system using **MongoDB + Express + Node.js**.

## 📋 Prerequisites

- Node.js (v18+)
- MongoDB (v6+)
- npm or yarn

## 🚀 Quick Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Configuration

Copy the `.env` file and update the values:

```bash
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/delpro-labs

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Email Configuration (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=DELPRO LABS <noreply@delprolabs.in>

# CORS Configuration
FRONTEND_URL=http://localhost:3000
```

### 3. Database Setup

Make sure MongoDB is running on your system:

```bash
# Start MongoDB (if installed locally)
sudo systemctl start mongod

# Or use MongoDB Atlas and update MONGODB_URI
```

### 4. Start Development Server

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:5000`

## 📡 API Endpoints

Base URL: `http://localhost:5000/api`

### Authentication Routes
- `POST /auth/signup` - Client registration
- `POST /auth/login` - User login
- `POST /auth/activate` - Activate account
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout user

### Project Routes
- `GET /projects` - Get projects (role-based)
- `GET /projects/:id` - Get single project
- `POST /projects` - Create project (admin/staff)
- `PUT /projects/:id` - Update project (admin/staff)
- `DELETE /projects/:id` - Delete project (admin/staff)
- `PUT /projects/:id/assign` - Assign staff (admin only)

### FastTrack Routes
- `GET /fasttrack` - Get FastTracks (admin/staff)
- `GET /fasttrack/generate-id` - Generate ID (admin only)
- `POST /fasttrack` - Create FastTrack (admin only)
- `PUT /fasttrack/:id` - Update FastTrack (admin only)
- `PUT /fasttrack/:id/publish` - Publish FastTrack (admin only)
- `DELETE /fasttrack/:id` - Delete FastTrack (admin only)

### Staff & Client Routes
- `GET /staff` - Get all staff (admin/staff)
- `POST /staff` - Create staff (admin only)
- `GET /staff/clients` - Get all clients (admin/staff)

## 🔐 Default Super Admin

Create a super admin user directly in MongoDB:

```javascript
// Connect to MongoDB shell
use delpro-labs

// Create super admin user
db.users.insertOne({
  email: "admin@delprolabs.in",
  password: "$2b$12$hashedPasswordHere", // Use bcrypt to hash
  name: "Super Admin",
  role: "super_admin",
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
})
```

## 🧪 Testing the API

### Health Check
```bash
curl http://localhost:5000/health
```

### Client Signup
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "client@example.com",
    "password": "Password123",
    "name": "John Doe"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "client@example.com",
    "password": "Password123"
  }'
```

## 📧 Email Configuration

For email functionality, configure your SMTP settings:

### Gmail Setup
1. Enable 2-factor authentication
2. Generate an App Password
3. Update `.env`:
   ```
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   ```

### SendGrid Setup
1. Create SendGrid account
2. Generate API key
3. Update `.env`:
   ```
   EMAIL_HOST=smtp.sendgrid.net
   EMAIL_PORT=587
   EMAIL_USER=apikey
   EMAIL_PASS=your-sendgrid-api-key
   ```

## 🔒 Security Features

- **JWT Authentication** with access/refresh tokens
- **Password Hashing** using bcrypt
- **Rate Limiting** to prevent abuse
- **CORS Protection** with configurable origins
- **Helmet** for security headers
- **Input Validation** using express-validator
- **Role-Based Access Control** (RBAC)

## 📊 Database Schema

### Users Collection
```javascript
{
  email: String (unique, required),
  password: String (hashed, required),
  name: String (required),
  role: String (super_admin | internal_staff | client),
  isActive: Boolean (default: false),
  activationToken: String,
  activationTokenExpiry: Date,
  resetToken: String,
  resetTokenExpiry: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Projects Collection
```javascript
{
  projectId: String (unique, auto-generated, e.g., PRJ-001),
  title: String (required),
  description: String,
  status: String (pending | in_progress | completed | on_hold),
  priority: String (low | medium | high),
  testType: String (required),
  clientId: ObjectId (ref: User),
  assignedStaffId: ObjectId (ref: User),
  dueDate: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### FastTrack Collection
```javascript
{
  trackId: String (unique, auto-generated, e.g., Delpro/Report/2026/001),
  clientName: String (required),
  createdBy: ObjectId (ref: User),
  isPublished: Boolean (default: false),
  publishedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## 🚀 Deployment

### Environment Variables for Production
```bash
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/delpro-labs
JWT_SECRET=your-production-jwt-secret
JWT_REFRESH_SECRET=your-production-refresh-secret
EMAIL_HOST=your-production-smtp-host
EMAIL_USER=your-production-email
EMAIL_PASS=your-production-email-password
FRONTEND_URL=https://your-frontend-domain.com
```

### PM2 Setup
```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start server.js --name delpro-backend

# Monitor
pm2 monit

# Logs
pm2 logs delpro-backend
```

## 🛠️ Development

### Project Structure
```
backend/
├── config/
│   └── database.js          # MongoDB connection
├── controllers/
│   ├── auth.controller.js   # Authentication logic
│   ├── project.controller.js # Project CRUD
│   ├── fasttrack.controller.js # FastTrack CRUD
│   └── staff.controller.js  # Staff & Client management
├── middleware/
│   ├── auth.js             # Authentication middleware
│   └── validation.js       # Input validation
├── models/
│   ├── User.js             # User schema
│   ├── Project.js          # Project schema
│   ├── FastTrack.js        # FastTrack schema
│   └── InternalStaff.js    # Staff details schema
├── routes/
│   ├── auth.routes.js      # Auth endpoints
│   ├── project.routes.js   # Project endpoints
│   ├── fasttrack.routes.js # FastTrack endpoints
│   ├── staff.routes.js     # Staff endpoints
│   └── index.js            # Route aggregation
├── services/
│   └── email.service.js    # Email functionality
├── utils/
│   ├── password.js         # Password hashing
│   ├── jwt.js             # JWT utilities
│   └── token.js           # Token generation
├── .env                   # Environment variables
├── package.json           # Dependencies
└── server.js              # Main server file
```

## 📝 License

This project is proprietary to DELPRO LABS.

---

**Backend is ready! 🎉** 

For API documentation, refer to `API_req.md` in the backend directory.
