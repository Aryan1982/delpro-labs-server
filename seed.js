require("dotenv").config();
const mongoose = require("mongoose");
const { hashPassword } = require("./utils/password");
const User = require("./models/User");

const seedSuperAdmin = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Check if super admin already exists
    const existingAdmin = await User.findOne({
      email: "neeraj@delprolabs.com",
    });
    if (existingAdmin) {
      console.log("Super admin already exists!");
      await mongoose.disconnect();
      return;
    }

    // Hash the password
    const hashedPassword = await hashPassword("admindelpro342");

    // Create super admin user
    const superAdmin = new User({
      email: "neeraj@delprolabs.com",
      password: hashedPassword,
      name: "Neeraj Verma",
      role: "super_admin",
      isActive: true, // Super admin is active by default
    });

    await superAdmin.save();

    console.log("✅ Super admin created successfully!");
    console.log("📧 Email: neeraj@delprolabs.com");
    console.log("🔑 Password: admindelpro342");
    console.log("👤 Role: super_admin");
    console.log("✅ Status: Active");
  } catch (error) {
    console.error("❌ Error creating super admin:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
};

// Run the seed function
seedSuperAdmin();
