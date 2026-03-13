const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const { authenticate, authorize } = require("../middleware/auth");
const {
  validateSignup,
  validateLogin,
  validateActivation,
  validateForgotPassword,
  validatePasswordReset,
  validateChangePassword,
} = require("../middleware/validation");

router.post("/signup", validateSignup, authController.signup);
router.post("/login", validateLogin, authController.login);
router.post("/activate", validateActivation, authController.activateAccount);
router.post("/forgot-password", validateForgotPassword, authController.forgotPassword);
router.post("/reset-password", validatePasswordReset, authController.resetPassword);
router.post("/refresh", authController.refreshToken);
router.post("/logout", authenticate, authController.logout);
router.post(
  "/change-password",
  authenticate,
  authorize("super_admin"),
  validateChangePassword,
  authController.changePassword,
);

module.exports = router;
