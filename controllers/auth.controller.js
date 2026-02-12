const User = require("../models/User");
const { hashPassword, verifyPassword } = require("../utils/password");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
} = require("../utils/jwt");
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

    // Validate email format
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Valid email address is required",
      });
    }

    const user = await User.findOne({ email });

    // Check if user exists
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No account found with this email address",
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(400).json({
        success: false,
        message: "Account is not active. Please contact support.",
      });
    }

    // Generate reset token
    const resetToken = generateResetToken();
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    user.resetToken = resetToken;
    user.resetTokenExpiry = resetTokenExpiry;
    await user.save();

    // Send reset email
    try {
      await sendPasswordResetEmail(user, resetToken);
    } catch (emailError) {
      console.error("Failed to send reset email:", emailError);
      return res.status(500).json({
        success: false,
        message: "Failed to send reset email. Please try again later.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Password reset instructions have been sent to your email",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({
      success: false,
      message: "Request failed. Please try again later.",
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
