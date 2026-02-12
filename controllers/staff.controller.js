const User = require("../models/User");
const InternalStaff = require("../models/InternalStaff");
const { hashPassword, generateTempPassword } = require("../utils/password");
const { sendStaffCredentialsEmail } = require("../services/email.service");

// Get All Internal Staff
exports.getStaff = async (req, res) => {
  try {
    const staff = await User.find({ role: "internal_staff" })
      .select("-password -activationToken -resetToken")
      .sort({ createdAt: -1 })
      .lean();

    // Get specializations from InternalStaff model
    const staffWithSpecialization = await Promise.all(
      staff.map(async (staffMember) => {
        const staffDetails = await InternalStaff.findOne({
          userId: staffMember._id,
        }).lean();

        return {
          id: staffMember._id,
          email: staffMember.email,
          name: staffMember.name,
          role: staffMember.role,
          isActive: staffMember.isActive,
          specialization: staffDetails ? staffDetails.specialization : null,
          createdAt: staffMember.createdAt,
          updatedAt: staffMember.updatedAt,
        };
      }),
    );

    return res.status(200).json({
      success: true,
      data: staffWithSpecialization,
    });
  } catch (error) {
    console.error("Get staff error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch staff",
    });
  }
};

// Create Staff Member
exports.createStaff = async (req, res) => {
  try {
    const { name, email, specialization } = req.body;

    // Check if user already exists
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

    // Create user with staff role
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: "internal_staff",
      isActive: true, // Staff accounts are active by default
    });

    await user.save();

    // Create staff details
    const staffDetails = new InternalStaff({
      userId: user._id,
      specialization,
      tempPassword, // Store temporarily for reference
    });

    await staffDetails.save();

    // Send credentials email
    try {
      await sendStaffCredentialsEmail(user, tempPassword);
    } catch (emailError) {
      console.error("Failed to send staff credentials email:", emailError);
      // Don't fail the request if email fails
    }

    return res.status(201).json({
      success: true,
      message: "Staff member created successfully",
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        specialization: staffDetails.specialization,
        createdAt: user.createdAt,
        tempPassword: tempPassword,
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
      .select("-password -activationToken -resetToken")
      .sort({ createdAt: -1 })
      .lean();

    const transformedClients = clients.map((client) => ({
      id: client._id,
      email: client.email,
      name: client.name,
      role: client.role,
      isActive: client.isActive,
      createdAt: client.createdAt,
      updatedAt: client.updatedAt,
    }));

    return res.status(200).json({
      success: true,
      data: transformedClients,
    });
  } catch (error) {
    console.error("Get clients error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch clients",
    });
  }
};

// Update Staff Member
exports.updateStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, specialization } = req.body;

    // Find and update user
    const user = await User.findByIdAndUpdate(
      id,
      { name, email },
      { new: true, runValidators: true },
    ).select("-password -activationToken -resetToken");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Staff member not found",
      });
    }

    // Update specialization in InternalStaff
    await InternalStaff.findOneAndUpdate(
      { userId: id },
      { specialization },
      { new: true, runValidators: true },
    );

    // Get updated staff details
    const staffDetails = await InternalStaff.findOne({ userId: id }).lean();

    return res.status(200).json({
      success: true,
      message: "Staff member updated successfully",
      data: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        specialization: staffDetails ? staffDetails.specialization : null,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error("Update staff error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update staff member",
    });
  }
};

// Delete Staff Member
exports.deleteStaff = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if staff exists
    const user = await User.findById(id);
    if (!user || user.role !== "internal_staff") {
      return res.status(404).json({
        success: false,
        message: "Staff member not found",
      });
    }

    // Delete from InternalStaff
    await InternalStaff.findOneAndDelete({ userId: id });

    // Delete from User
    await User.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Staff member deleted successfully",
    });
  } catch (error) {
    console.error("Delete staff error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete staff member",
    });
  }
};

// Regenerate Staff Password
exports.regenerateStaffPassword = async (req, res) => {
  try {
    const { id } = req.params;

    // Find staff member
    const user = await User.findById(id);
    if (!user || user.role !== "internal_staff") {
      return res.status(404).json({
        success: false,
        message: "Staff member not found",
      });
    }

    // Generate new temporary password
    const tempPassword = generateTempPassword();
    const hashedPassword = await hashPassword(tempPassword);

    // Update user password
    user.password = hashedPassword;
    await user.save();

    // Update temp password in InternalStaff
    await InternalStaff.findOneAndUpdate(
      { userId: id },
      { tempPassword },
      { new: true },
    );

    // Send email with new credentials
    try {
      await sendStaffCredentialsEmail(user, tempPassword);
    } catch (emailError) {
      console.error("Failed to send password email:", emailError);
      // Don't fail the request if email fails
    }

    return res.status(200).json({
      success: true,
      message: "Password regenerated successfully",
      data: {
        tempPassword: tempPassword, // Include for immediate display
      },
    });
  } catch (error) {
    console.error("Regenerate password error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to regenerate password",
    });
  }
};
