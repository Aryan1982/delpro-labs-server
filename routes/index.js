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
