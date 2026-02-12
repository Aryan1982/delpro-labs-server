const express = require("express");
const router = express.Router();
const staffController = require("../controllers/staff.controller");
const { authenticate, authorize } = require("../middleware/auth");
const {
  validateStaffCreation,
  validateStaffUpdate,
} = require("../middleware/validation");

// All staff routes require authentication
router.use(authenticate);

// Get all internal staff (admin and staff can view)
router.get(
  "/",
  authorize("super_admin", "internal_staff"),
  staffController.getStaff,
);

// Create staff member (admin only)
router.post(
  "/",
  authorize("super_admin"),
  validateStaffCreation,
  staffController.createStaff,
);

// Update staff member (admin only)
router.put(
  "/:id",
  authorize("super_admin"),
  validateStaffUpdate,
  staffController.updateStaff,
);

// Delete staff member (admin only)
router.delete("/:id", authorize("super_admin"), staffController.deleteStaff);

// Regenerate staff password (admin only)
router.post(
  "/:id/regenerate-password",
  authorize("super_admin"),
  staffController.regenerateStaffPassword,
);

// Get all clients (admin and staff can view)
router.get(
  "/clients",
  authorize("super_admin", "internal_staff"),
  staffController.getClients,
);

module.exports = router;
