const express = require("express");
const router = express.Router();
const fastTrackController = require("../controllers/fasttrack.controller");
const { authenticate, authorize } = require("../middleware/auth");
const { validateFastTrack } = require("../middleware/validation");

// All fasttrack routes require authentication
router.use(authenticate);

// Get all FastTracks (admin and staff can view)
router.get("/", authorize("super_admin", "internal_staff"), fastTrackController.getFastTracks);

// Generate FastTrack ID (admin only)
router.get("/generate-id", authorize("super_admin"), fastTrackController.generateId);

// Create FastTrack (admin only)
router.post(
  "/",
  authorize("super_admin"),
  validateFastTrack,
  fastTrackController.createFastTrack
);

// Update FastTrack (admin only)
router.put(
  "/:id",
  authorize("super_admin"),
  validateFastTrack,
  fastTrackController.updateFastTrack
);

// Publish FastTrack (admin only)
router.put("/:id/publish", authorize("super_admin"), fastTrackController.publishFastTrack);

// Delete FastTrack (admin only)
router.delete("/:id", authorize("super_admin"), fastTrackController.deleteFastTrack);

module.exports = router;
