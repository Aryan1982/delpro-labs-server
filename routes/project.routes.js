const express = require("express");
const router = express.Router();
const projectController = require("../controllers/project.controller");
const { authenticate, authorize } = require("../middleware/auth");
const { validateProject } = require("../middleware/validation");

// All project routes require authentication
router.use(authenticate);

// Get projects (all authenticated users can view, role-based filtering applied)
router.get("/", projectController.getProjects);

// Get single project
router.get("/:id", projectController.getProject);

// Create project (admin and staff only)
router.post(
  "/",
  authorize("super_admin", "internal_staff"),
  validateProject,
  projectController.createProject
);

// Update project (admin and staff only)
router.put(
  "/:id",
  authorize("super_admin", "internal_staff"),
  validateProject,
  projectController.updateProject
);

// Delete project (admin and staff only)
router.delete(
  "/:id",
  authorize("super_admin", "internal_staff"),
  projectController.deleteProject
);

// Assign staff to project (admin only)
router.put(
  "/:id/assign",
  authorize("super_admin"),
  projectController.assignStaff
);

module.exports = router;
