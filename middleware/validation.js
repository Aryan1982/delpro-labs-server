const { body, validationResult } = require("express-validator");

// Validation middleware handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array(),
    });
  }
  next();
};

// Signup validation
const validateSignup = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Valid email is required"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, and one number",
    ),
  body("name")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),
  handleValidationErrors,
];

// Login validation
const validateLogin = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Valid email is required"),
  body("password").notEmpty().withMessage("Password is required"),
  handleValidationErrors,
];

// Project validation
const validateProject = [
  body("title")
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage("Title must be between 1 and 500 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Description must not exceed 2000 characters"),
  body("clientId").isMongoId().withMessage("Valid client ID is required"),
  body("testType").trim().notEmpty().withMessage("Test type is required"),
  body("priority")
    .optional()
    .isIn(["low", "medium", "high"])
    .withMessage("Priority must be low, medium, or high"),
  body("status")
    .optional()
    .isIn(["pending", "in_progress", "completed", "on_hold"])
    .withMessage("Status must be pending, in_progress, completed, or on_hold"),
  body("dueDate")
    .optional()
    .isISO8601()
    .withMessage("Due date must be a valid date"),
  handleValidationErrors,
];

// FastTrack validation
const validateFastTrack = [
  body("title")
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage("Title must be between 1 and 200 characters"),
  body("smallId")
    .trim()
    .isLength({ min: 6, max: 6 })
    .matches(/^[A-Z0-9]+$/)
    .withMessage(
      "Small ID must be 6 characters long and contain only uppercase letters and numbers",
    ),
  body("docketNumber")
    .trim()
    .matches(/^Delpro\/Report\/\d{4}\/\d{3}$/)
    .withMessage("Docket number must be in format: Delpro/Report/YYYY/NNN"),
  handleValidationErrors,
];

// Staff creation validation
const validateStaffCreation = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Valid email is required"),
  body("specialization")
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage("Specialization is required"),
  handleValidationErrors,
];

// Password reset validation
const validatePasswordReset = [
  body("token").notEmpty().withMessage("Reset token is required"),
  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, and one number",
    ),
  handleValidationErrors,
];

// Account activation validation
const validateActivation = [
  body("token").notEmpty().withMessage("Activation token is required"),
  handleValidationErrors,
];

// Forgot password validation
const validateForgotPassword = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Valid email is required"),
  handleValidationErrors,
];

// Staff update validation
const validateStaffUpdate = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Valid email is required"),
  body("specialization")
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage("Specialization is required"),
  handleValidationErrors,
];

module.exports = {
  validateSignup,
  validateLogin,
  validateProject,
  validateFastTrack,
  validateStaffCreation,
  validateStaffUpdate,
  validatePasswordReset,
  validateActivation,
  validateForgotPassword,
};
