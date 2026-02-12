const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const { authenticate } = require("../middleware/auth");
const {
  validateSignup,
  validateLogin,
  validateActivation,
  validateForgotPassword,
  validatePasswordReset,
} = require("../middleware/validation");

router.post("/signup", validateSignup, authController.signup);
router.post("/login", validateLogin, authController.login);
router.post("/activate", validateActivation, authController.activateAccount);
router.post("/forgot-password", validateForgotPassword, authController.forgotPassword);
router.post("/reset-password", validatePasswordReset, authController.resetPassword);
router.post("/refresh", authController.refreshToken);
router.post("/logout", authenticate, authController.logout);

module.exports = router;
