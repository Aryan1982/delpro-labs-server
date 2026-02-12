const { verifyToken } = require("../utils/jwt");
const User = require("../models/User");

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access token required",
      });
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix
    
    try {
      const decoded = verifyToken(token);
      const user = await User.findById(decoded.id);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Invalid token - user not found",
        });
      }

      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: "Account not activated",
        });
      }

      req.user = {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
      };
      
      next();
    } catch (tokenError) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(500).json({
      success: false,
      message: "Authentication failed",
    });
  }
};

// Role-based authorization middleware
const authorize = (...roles) => {
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
        message: "Insufficient permissions",
      });
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorize,
};
