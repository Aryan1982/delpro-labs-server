# DELPRO LABS - Backend Development Guide (MongoDB)

Complete backend implementation guide for the DELPRO LABS management system using **MongoDB + Mongoose**.

## 📋 Table of Contents

1. [Tech Stack](#tech-stack)
2. [Database Schema (Mongoose)](#database-schema-mongoose)
3. [Authentication & Security](#authentication--security)
4. [API Routes](#api-routes)
5. [Middleware](#middleware)
6. [Email Service](#email-service)
7. [Environment Variables](#environment-variables)
8. [Implementation Steps](#implementation-steps)
9. [Testing](#testing)

---

## 🛠️ Tech Stack

```
Runtime:     Node.js (v18+)
Framework:   Express.js
Database:    MongoDB (v6+)
ODM:         Mongoose
Auth:        JWT + bcrypt
Email:       Nodemailer / SendGrid
Validation:  Zod / Joi / express-validator
```

### NPM Dependencies

```bash
npm install express mongoose cors dotenv bcrypt jsonwebtoken
npm install nodemailer
npm install zod express-validator
npm install express-rate-limit
npm install helmet compression morgan

# Dev dependencies
npm install --save-dev nodemon typescript @types/node @types/express
```

---

## 🗄️ Database Schema (Mongoose)

### User Model

```javascript
// models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
      select: false, // Don't return password by default
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ["super_admin", "internal_staff", "client"],
      required: true,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    avatar: {
      type: String,
      default: null,
    },
    activationToken: {
      type: String,
      default: null,
    },
    activationTokenExpiry: {
      type: Date,
      default: null,
    },
    resetToken: {
      type: String,
      default: null,
    },
    resetTokenExpiry: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
    collection: "users",
  },
);

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ activationToken: 1 });
userSchema.index({ resetToken: 1 });

// Virtual for ID as string
userSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

// Ensure virtuals are included in JSON
userSchema.set("toJSON", {
  virtuals: true,
  transform: function (doc, ret) {
    delete ret._id;
    delete ret.__v;
    delete ret.password;
    delete ret.activationToken;
    delete ret.resetToken;
    return ret;
  },
});

module.exports = mongoose.model("User", userSchema);
```

### InternalStaff Model

```javascript
// models/InternalStaff.js
const mongoose = require("mongoose");

const internalStaffSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    specialization: {
      type: String,
      required: true,
      trim: true,
    },
    tempPassword: {
      type: String,
      default: null, // Clear after first login
    },
  },
  {
    timestamps: true,
    collection: "internal_staff",
  },
);

// Index
internalStaffSchema.index({ userId: 1 });

// Virtual for ID
internalStaffSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

internalStaffSchema.set("toJSON", {
  virtuals: true,
  transform: function (doc, ret) {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("InternalStaff", internalStaffSchema);
```

### Project Model

```javascript
// models/Project.js
const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    projectId: {
      type: String,
      required: true,
      unique: true,
      index: true, // e.g., PRJ-001
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "in_progress", "completed", "on_hold"],
      default: "pending",
      index: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    testType: {
      type: String,
      required: true,
      trim: true,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    assignedStaffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    dueDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "projects",
  },
);

// Indexes
projectSchema.index({ projectId: 1 });
projectSchema.index({ clientId: 1 });
projectSchema.index({ assignedStaffId: 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ createdAt: -1 });

// Text index for search
projectSchema.index({ title: "text", description: "text" });

// Virtual for ID
projectSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

projectSchema.set("toJSON", {
  virtuals: true,
  transform: function (doc, ret) {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

// Pre-save hook to auto-increment project ID
projectSchema.pre("save", async function (next) {
  if (this.isNew && !this.projectId) {
    const Project = mongoose.model("Project");
    const lastProject = await Project.findOne().sort({ projectId: -1 });

    let nextNumber = 1;
    if (lastProject && lastProject.projectId) {
      const lastNumber = parseInt(lastProject.projectId.split("-")[1]);
      nextNumber = lastNumber + 1;
    }

    this.projectId = `PRJ-${String(nextNumber).padStart(3, "0")}`;
  }
  next();
});

module.exports = mongoose.model("Project", projectSchema);
```

### FastTrack Model

```javascript
// models/FastTrack.js
const mongoose = require("mongoose");

const fastTrackSchema = new mongoose.Schema(
  {
    trackId: {
      type: String,
      required: true,
      unique: true,
      index: true, // e.g., Delpro/Report/2026/001
    },
    clientName: {
      type: String,
      required: true,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    isPublished: {
      type: Boolean,
      default: false,
      index: true,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "fast_track",
  },
);

// Indexes
fastTrackSchema.index({ trackId: 1 });
fastTrackSchema.index({ createdBy: 1 });
fastTrackSchema.index({ isPublished: 1 });
fastTrackSchema.index({ createdAt: -1 });

// Virtual for ID
fastTrackSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

fastTrackSchema.set("toJSON", {
  virtuals: true,
  transform: function (doc, ret) {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("FastTrack", fastTrackSchema);
```

---

## 🔐 Authentication & Security

### Database Connection

```javascript
// config/database.js
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      autoIndex: true, // Build indexes
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    };

    const conn = await mongoose.connect(process.env.MONGODB_URI, options);

    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Handle connection events
    mongoose.connection.on("error", (err) => {
      console.error("MongoDB connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("MongoDB disconnected");
    });
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1);
  }
};

module.exports = connectDB;
```

### Password Hashing

```javascript
// utils/password.js
const bcrypt = require("bcrypt");

const hashPassword = async (password) => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

const verifyPassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

module.exports = { hashPassword, verifyPassword };
```

### JWT Implementation

```javascript
// utils/jwt.js
const jwt = require("jsonwebtoken");

const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "1h" },
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign({ id: user._id.toString() }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  });
};

const verifyToken = (token, secret = process.env.JWT_SECRET) => {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    throw new Error("Invalid token");
  }
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
};
```

### Token Generation

```javascript
// utils/token.js
const crypto = require("crypto");

const generateActivationToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

const generateResetToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

const generateTempPassword = () => {
  return crypto.randomBytes(4).toString("hex"); // 8 characters
};

module.exports = {
  generateActivationToken,
  generateResetToken,
  generateTempPassword,
};
```

---

## 🛣️ API Routes

### Complete Route Structure

```javascript
// routes/index.js
const express = require("express");
const router = express.Router();

const authRoutes = require("./auth.routes");
const projectRoutes = require("./project.routes");
const fastTrackRoutes = require("./fasttrack.routes");
const staffRoutes = require("./staff.routes");

router.use("/auth", authRoutes);
router.use("/projects", projectRoutes);
router.use("/fasttrack", fastTrackRoutes);
router.use("/staff", staffRoutes);

module.exports = router;
```

### Auth Routes Implementation

```javascript
// routes/auth.routes.js
const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const { authenticate } = require("../middleware/auth");
const { validateSignup, validateLogin } = require("../middleware/validation");

router.post("/signup", validateSignup, authController.signup);
router.post("/login", validateLogin, authController.login);
router.post("/activate", authController.activateAccount);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);
router.post("/refresh", authController.refreshToken);
router.post("/logout", authenticate, authController.logout);

module.exports = router;
```

### Auth Controller

```javascript
// controllers/auth.controller.js
const User = require("../models/User");
const { hashPassword, verifyPassword } = require("../utils/password");
const { generateAccessToken, generateRefreshToken } = require("../utils/jwt");
const {
  generateActivationToken,
  generateResetToken,
} = require("../utils/token");
const {
  sendActivationEmail,
  sendPasswordResetEmail,
} = require("../services/email.service");

// Signup
exports.signup = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already registered",
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Generate activation token
    const activationToken = generateActivationToken();
    const activationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user
    const user = new User({
      email,
      password: hashedPassword,
      name,
      role: "client",
      isActive: false,
      activationToken,
      activationTokenExpiry,
    });

    await user.save();

    // Send activation email
    await sendActivationEmail(user, activationToken);

    return res.status(201).json({
      success: true,
      message:
        "Registration successful. Please check your email to activate your account.",
      data: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({
      success: false,
      message: "Registration failed",
    });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user with password field
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account not activated. Please check your email.",
      });
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Remove password from response
    user.password = undefined;

    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          isActive: user.isActive,
          createdAt: user.createdAt,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
};

// Activate Account
exports.activateAccount = async (req, res) => {
  try {
    const { token } = req.body;

    const user = await User.findOne({
      activationToken: token,
      activationTokenExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired activation token",
      });
    }

    // Activate account
    user.isActive = true;
    user.activationToken = null;
    user.activationTokenExpiry = null;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Account activated successfully. You can now login.",
    });
  } catch (error) {
    console.error("Activation error:", error);
    return res.status(500).json({
      success: false,
      message: "Activation failed",
    });
  }
};

// Forgot Password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    // Always return success for security (don't reveal if email exists)
    if (!user) {
      return res.status(200).json({
        success: true,
        message:
          "If an account exists, password reset instructions have been sent.",
      });
    }

    // Generate reset token
    const resetToken = generateResetToken();
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    user.resetToken = resetToken;
    user.resetTokenExpiry = resetTokenExpiry;
    await user.save();

    // Send reset email
    await sendPasswordResetEmail(user, resetToken);

    return res.status(200).json({
      success: true,
      message:
        "If an account exists, password reset instructions have been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({
      success: false,
      message: "Request failed",
    });
  }
};

// Reset Password
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
      });
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    user.password = hashedPassword;
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password reset successful. You can now login.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({
      success: false,
      message: "Password reset failed",
    });
  }
};

// Refresh Token
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    const decoded = verifyToken(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    const newAccessToken = generateAccessToken(user);

    return res.status(200).json({
      success: true,
      data: {
        accessToken: newAccessToken,
      },
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired refresh token",
    });
  }
};

// Logout
exports.logout = async (req, res) => {
  try {
    // In a stateless JWT setup, logout is handled client-side
    // Optionally, you can implement a token blacklist in Redis

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Logout failed",
    });
  }
};
```

### Project Controller

```javascript
// controllers/project.controller.js
const Project = require("../models/Project");
const User = require("../models/User");

// Get Projects (role-based)
exports.getProjects = async (req, res) => {
  try {
    const { role, id: userId } = req.user;
    const { status, priority, search, page = 1, limit = 20 } = req.query;

    // Build query
    let query = {};

    // Role-based filtering
    if (role === "client") {
      query.clientId = userId;
    }
    // super_admin and internal_staff see all projects

    // Additional filters
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (search) {
      query.$text = { $search: search };
    }

    // Execute query with pagination
    const projects = await Project.find(query)
      .populate("clientId", "name email")
      .populate("assignedStaffId", "name email")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const count = await Project.countDocuments(query);

    // Transform response
    const transformedProjects = projects.map((project) => ({
      id: project.projectId,
      title: project.title,
      description: project.description,
      status: project.status,
      priority: project.priority,
      testType: project.testType,
      client: project.clientId
        ? {
            id: project.clientId._id,
            name: project.clientId.name,
            email: project.clientId.email,
          }
        : null,
      assignedStaff: project.assignedStaffId
        ? {
            id: project.assignedStaffId._id,
            name: project.assignedStaffId.name,
            email: project.assignedStaffId.email,
          }
        : null,
      dueDate: project.dueDate,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    }));

    return res.status(200).json({
      success: true,
      data: transformedProjects,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error("Get projects error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch projects",
    });
  }
};

// Get Single Project
exports.getProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, id: userId } = req.user;

    const project = await Project.findOne({ projectId: id })
      .populate("clientId", "name email")
      .populate("assignedStaffId", "name email");

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Authorization check
    if (role === "client" && project.clientId._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: project.projectId,
        title: project.title,
        description: project.description,
        status: project.status,
        priority: project.priority,
        testType: project.testType,
        client: {
          id: project.clientId._id,
          name: project.clientId.name,
          email: project.clientId.email,
        },
        assignedStaff: project.assignedStaffId
          ? {
              id: project.assignedStaffId._id,
              name: project.assignedStaffId.name,
              email: project.assignedStaffId.email,
            }
          : null,
        dueDate: project.dueDate,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      },
    });
  } catch (error) {
    console.error("Get project error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch project",
    });
  }
};

// Create Project
exports.createProject = async (req, res) => {
  try {
    const {
      title,
      description,
      clientId,
      testType,
      priority,
      status,
      dueDate,
    } = req.body;

    // Validate client exists
    const client = await User.findById(clientId);
    if (!client || client.role !== "client") {
      return res.status(400).json({
        success: false,
        message: "Invalid client",
      });
    }

    // Create project (projectId auto-generated by pre-save hook)
    const project = new Project({
      title,
      description,
      clientId,
      testType,
      priority: priority || "medium",
      status: status || "pending",
      dueDate: dueDate || null,
    });

    await project.save();
    await project.populate("clientId", "name email");

    return res.status(201).json({
      success: true,
      message: "Project created successfully",
      data: {
        id: project.projectId,
        title: project.title,
        description: project.description,
        status: project.status,
        priority: project.priority,
        testType: project.testType,
        clientId: project.clientId._id,
        clientName: project.clientId.name,
        dueDate: project.dueDate,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      },
    });
  } catch (error) {
    console.error("Create project error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create project",
    });
  }
};

// Update Project
exports.updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Don't allow updating projectId or clientId
    delete updates.projectId;
    delete updates.clientId;

    const project = await Project.findOneAndUpdate({ projectId: id }, updates, {
      new: true,
      runValidators: true,
    })
      .populate("clientId", "name email")
      .populate("assignedStaffId", "name email");

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Project updated successfully",
      data: {
        id: project.projectId,
        title: project.title,
        description: project.description,
        status: project.status,
        priority: project.priority,
        dueDate: project.dueDate,
        updatedAt: project.updatedAt,
      },
    });
  } catch (error) {
    console.error("Update project error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update project",
    });
  }
};

// Delete Project
exports.deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    const project = await Project.findOneAndDelete({ projectId: id });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error) {
    console.error("Delete project error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete project",
    });
  }
};

// Assign Staff
exports.assignStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const { staffId } = req.body;

    // Validate staff exists and is internal_staff
    const staff = await User.findById(staffId);
    if (!staff || staff.role !== "internal_staff") {
      return res.status(400).json({
        success: false,
        message: "Invalid staff member",
      });
    }

    const project = await Project.findOneAndUpdate(
      { projectId: id },
      {
        assignedStaffId: staffId,
        status: "in_progress", // Auto-update status
      },
      { new: true },
    ).populate("assignedStaffId", "name email");

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Staff assigned successfully",
      data: {
        id: project.projectId,
        assignedStaffId: project.assignedStaffId._id,
        assignedStaffName: project.assignedStaffId.name,
        status: project.status,
        updatedAt: project.updatedAt,
      },
    });
  } catch (error) {
    console.error("Assign staff error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to assign staff",
    });
  }
};
```

### FastTrack Controller

```javascript
// controllers/fasttrack.controller.js
const FastTrack = require("../models/FastTrack");

// Generate FastTrack ID
exports.generateId = async (req, res) => {
  try {
    const year = new Date().getFullYear();

    // Find the last FastTrack ID for the current year
    const lastTrack = await FastTrack.findOne({
      trackId: new RegExp(`^Delpro/Report/${year}/`),
    }).sort({ trackId: -1 });

    let nextSequence = 1;

    if (lastTrack) {
      const lastSequence = parseInt(lastTrack.trackId.split("/").pop());
      nextSequence = lastSequence + 1;
    }

    const newId = `Delpro/Report/${year}/${String(nextSequence).padStart(3, "0")}`;

    return res.status(200).json({
      success: true,
      data: { id: newId },
    });
  } catch (error) {
    console.error("Generate ID error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate ID",
    });
  }
};

// Get All FastTracks
exports.getFastTracks = async (req, res) => {
  try {
    const fastTracks = await FastTrack.find()
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 })
      .lean();

    const transformedData = fastTracks.map((ft) => ({
      id: ft.trackId,
      clientName: ft.clientName,
      isPublished: ft.isPublished,
      publishedAt: ft.publishedAt,
      createdBy: {
        id: ft.createdBy._id,
        name: ft.createdBy.name,
      },
      createdAt: ft.createdAt,
      updatedAt: ft.updatedAt,
    }));

    return res.status(200).json({
      success: true,
      data: transformedData,
    });
  } catch (error) {
    console.error("Get FastTracks error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch FastTracks",
    });
  }
};

// Create FastTrack
exports.createFastTrack = async (req, res) => {
  try {
    const { clientName } = req.body;
    const createdBy = req.user.id;

    // Generate ID
    const year = new Date().getFullYear();
    const lastTrack = await FastTrack.findOne({
      trackId: new RegExp(`^Delpro/Report/${year}/`),
    }).sort({ trackId: -1 });

    let nextSequence = 1;
    if (lastTrack) {
      const lastSequence = parseInt(lastTrack.trackId.split("/").pop());
      nextSequence = lastSequence + 1;
    }

    const trackId = `Delpro/Report/${year}/${String(nextSequence).padStart(3, "0")}`;

    const fastTrack = new FastTrack({
      trackId,
      clientName,
      createdBy,
      isPublished: false,
    });

    await fastTrack.save();
    await fastTrack.populate("createdBy", "name");

    return res.status(201).json({
      success: true,
      message: "FastTrack created successfully",
      data: {
        id: fastTrack.trackId,
        clientName: fastTrack.clientName,
        isPublished: fastTrack.isPublished,
        createdBy: fastTrack.createdBy._id,
        createdByName: fastTrack.createdBy.name,
        createdAt: fastTrack.createdAt,
      },
    });
  } catch (error) {
    console.error("Create FastTrack error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create FastTrack",
    });
  }
};

// Update FastTrack
exports.updateFastTrack = async (req, res) => {
  try {
    const { id } = req.params;
    const { clientName } = req.body;

    const fastTrack = await FastTrack.findOneAndUpdate(
      { trackId: id },
      { clientName },
      { new: true },
    );

    if (!fastTrack) {
      return res.status(404).json({
        success: false,
        message: "FastTrack not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "FastTrack updated successfully",
      data: {
        id: fastTrack.trackId,
        clientName: fastTrack.clientName,
        updatedAt: fastTrack.updatedAt,
      },
    });
  } catch (error) {
    console.error("Update FastTrack error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update FastTrack",
    });
  }
};

// Publish FastTrack
exports.publishFastTrack = async (req, res) => {
  try {
    const { id } = req.params;

    const fastTrack = await FastTrack.findOneAndUpdate(
      { trackId: id },
      {
        isPublished: true,
        publishedAt: new Date(),
      },
      { new: true },
    );

    if (!fastTrack) {
      return res.status(404).json({
        success: false,
        message: "FastTrack not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "FastTrack published successfully",
      data: {
        id: fastTrack.trackId,
        isPublished: fastTrack.isPublished,
        publishedAt: fastTrack.publishedAt,
      },
    });
  } catch (error) {
    console.error("Publish FastTrack error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to publish FastTrack",
    });
  }
};

// Delete FastTrack
exports.deleteFastTrack = async (req, res) => {
  try {
    const { id } = req.params;

    const fastTrack = await FastTrack.findOneAndDelete({ trackId: id });

    if (!fastTrack) {
      return res.status(404).json({
        success: false,
        message: "FastTrack not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "FastTrack deleted successfully",
    });
  } catch (error) {
    console.error("Delete FastTrack error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete FastTrack",
    });
  }
};
```

### Staff Controller

```javascript
// controllers/staff.controller.js
const User = require("../models/User");
const InternalStaff = require("../models/InternalStaff");
const { hashPassword } = require("../utils/password");
const { generateTempPassword } = require("../utils/token");
const { sendStaffCredentialsEmail } = require("../services/email.service");

// Get All Staff
exports.getStaff = async (req, res) => {
  try {
    const staff = await InternalStaff.find()
      .populate("userId", "name email createdAt")
      .lean();

    const transformedData = staff.map((s) => ({
      id: s.userId._id,
      name: s.userId.name,
      email: s.userId.email,
      role: "internal_staff",
      specialization: s.specialization,
      createdAt: s.userId.createdAt,
    }));

    return res.status(200).json({
      success: true,
      data: transformedData,
    });
  } catch (error) {
    console.error("Get staff error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch staff",
    });
  }
};

// Create Staff
exports.createStaff = async (req, res) => {
  try {
    const { name, email, specialization } = req.body;

    // Check if email exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already registered",
      });
    }

    // Generate temporary password
    const tempPassword = generateTempPassword();
    const hashedPassword = await hashPassword(tempPassword);

    // Create user
    const user = new User({
      email,
      password: hashedPassword,
      name,
      role: "internal_staff",
      isActive: true, // Staff accounts are active immediately
    });

    await user.save();

    // Create staff record
    const staff = new InternalStaff({
      userId: user._id,
      specialization,
      tempPassword, // Store plain text temporarily
    });

    await staff.save();

    // Send credentials email
    await sendStaffCredentialsEmail(user, tempPassword);

    return res.status(201).json({
      success: true,
      message: "Staff member created successfully",
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        specialization: staff.specialization,
        tempPassword, // Return for display
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Create staff error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create staff member",
    });
  }
};

// Get All Clients
exports.getClients = async (req, res) => {
  try {
    const clients = await User.find({ role: "client" })
      .select("name email isActive createdAt")
      .lean();

    return res.status(200).json({
      success: true,
      data: clients.map((c) => ({
        id: c._id,
        name: c.name,
        email: c.email,
        isActive: c.isActive,
        createdAt: c.createdAt,
      })),
    });
  } catch (error) {
    console.error("Get clients error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch clients",
    });
  }
};
```

---

## 🔒 Middleware

### Authentication Middleware

```javascript
// middleware/auth.js
const { verifyToken } = require("../utils/jwt");
const User = require("../models/User");

exports.authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    next();
  };
};
```

### Validation Middleware

```javascript
// middleware/validation.js
const { z } = require("zod");

const validateRequest = (schema) => {
  return (req, res, next) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors,
      });
    }
  };
};

// Schemas
const signupSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain uppercase letter")
    .regex(/[a-z]/, "Password must contain lowercase letter")
    .regex(/[0-9]/, "Password must contain number"),
  name: z.string().min(2).max(255),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const projectSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().optional(),
  clientId: z.string(),
  testType: z.string(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  status: z.enum(["pending", "in_progress", "completed", "on_hold"]).optional(),
  dueDate: z.string().optional(),
});

exports.validateSignup = validateRequest(signupSchema);
exports.validateLogin = validateRequest(loginSchema);
exports.validateProject = validateRequest(projectSchema);
```

---

## 📧 Email Service

```javascript
// services/email.service.js
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendEmail = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from: `"DELPRO LABS" <${process.env.SMTP_FROM}>`,
      to,
      subject,
      html,
    });
    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error("Email send error:", error);
    throw new Error("Failed to send email");
  }
};

exports.sendActivationEmail = async (user, token) => {
  const activationLink = `${process.env.FRONTEND_URL}/activate-account?token=${token}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Welcome to DELPRO LABS, ${user.name}!</h2>
      <p>Please click the button below to activate your account:</p>
      <a href="${activationLink}" 
         style="display: inline-block; padding: 12px 24px; background-color: #0066cc; 
                color: white; text-decoration: none; border-radius: 4px; margin: 20px 0;">
        Activate Account
      </a>
      <p>Or copy and paste this link: ${activationLink}</p>
      <p>This link expires in 24 hours.</p>
    </div>
  `;

  await sendEmail(user.email, "Activate Your DELPRO LABS Account", html);
};

exports.sendPasswordResetEmail = async (user, token) => {
  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Password Reset Request</h2>
      <p>Hi ${user.name},</p>
      <p>Click the button below to reset your password:</p>
      <a href="${resetLink}" 
         style="display: inline-block; padding: 12px 24px; background-color: #0066cc; 
                color: white; text-decoration: none; border-radius: 4px; margin: 20px 0;">
        Reset Password
      </a>
      <p>Or copy and paste this link: ${resetLink}</p>
      <p>This link expires in 1 hour.</p>
    </div>
  `;

  await sendEmail(user.email, "Reset Your DELPRO LABS Password", html);
};

exports.sendStaffCredentialsEmail = async (user, tempPassword) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Welcome to DELPRO LABS, ${user.name}!</h2>
      <p>Your staff account has been created. Here are your login credentials:</p>
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 4px; margin: 20px 0;">
        <p><strong>Email:</strong> ${user.email}</p>
        <p><strong>Temporary Password:</strong> <code style="background-color: #e0e0e0; padding: 4px 8px; border-radius: 3px; font-size: 16px;">${tempPassword}</code></p>
      </div>
      <p style="color: #d32f2f;"><strong>Important:</strong> Please change your password after first login.</p>
      <p>Login at: <a href="${process.env.FRONTEND_URL}/login">${process.env.FRONTEND_URL}/login</a></p>
    </div>
  `;

  await sendEmail(user.email, "Your DELPRO LABS Staff Account", html);
};
```

---

## 🔧 Environment Variables

```bash
# .env
NODE_ENV=development
PORT=5000

# Frontend URL
FRONTEND_URL=http://localhost:3000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/delpro_labs

# For MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/delpro_labs?retryWrites=true&w=majority

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@delprolabs.in

# CORS
CORS_ORIGIN=http://localhost:3000
```

---

## 🚀 Main Application File

```javascript
// app.js
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
require("dotenv").config();

const connectDB = require("./config/database");
const routes = require("./routes");

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  }),
);
app.use(compression());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api", routes);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date() });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
```

---

## 📁 Complete Project Structure

```
delpro-backend/
├── src/
│   ├── config/
│   │   └── database.js
│   ├── models/
│   │   ├── User.js
│   │   ├── InternalStaff.js
│   │   ├── Project.js
│   │   └── FastTrack.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── project.controller.js
│   │   ├── fasttrack.controller.js
│   │   └── staff.controller.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── project.routes.js
│   │   ├── fasttrack.routes.js
│   │   ├── staff.routes.js
│   │   └── index.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── validation.js
│   ├── services/
│   │   └── email.service.js
│   ├── utils/
│   │   ├── jwt.js
│   │   ├── password.js
│   │   └── token.js
│   └── app.js
├── .env
├── .gitignore
├── package.json
└── README.md
```

---

## 🚀 Quick Start

```bash
# 1. Clone/Create project
mkdir delpro-backend && cd delpro-backend

# 2. Initialize npm
npm init -y

# 3. Install dependencies
npm install express mongoose cors dotenv bcrypt jsonwebtoken nodemailer zod express-rate-limit helmet compression morgan

# 4. Install dev dependencies
npm install --save-dev nodemon

# 5. Create .env file
# Add all environment variables

# 6. Start MongoDB
# Local: mongod
# Or use MongoDB Atlas

# 7. Run server
npm run dev
```

### package.json scripts

```json
{
  "scripts": {
    "start": "node src/app.js",
    "dev": "nodemon src/app.js"
  }
}
```

---

## 🧪 Testing with MongoDB

```javascript
// Test database connection
const mongoose = require("mongoose");

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB Connection Error:", err));
```

---

## 📊 MongoDB Indexes

Indexes are automatically created via Mongoose schemas, but you can also create them manually:

```javascript
// In MongoDB shell
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1 });
db.projects.createIndex({ projectId: 1 }, { unique: true });
db.projects.createIndex({ clientId: 1 });
db.projects.createIndex({ assignedStaffId: 1 });
db.fast_track.createIndex({ trackId: 1 }, { unique: true });

// Text search indexes
db.projects.createIndex({ title: "text", description: "text" });
```

---

## 🔐 Security Checklist for MongoDB

- [ ] Use strong MongoDB passwords
- [ ] Enable MongoDB authentication
- [ ] Use connection string with credentials
- [ ] Limit network access (IP whitelist)
- [ ] Use latest MongoDB version
- [ ] Regular backups
- [ ] Monitor queries
- [ ] Use indexes for performance
- [ ] Implement rate limiting
- [ ] Validate all inputs

---

**MongoDB Backend Ready! 🚀**  
Production-ready with Mongoose ODM
