const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false, // Don't return password by default
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ["super_admin", "internal_staff", "client"],
      required: true,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    avatar: {
      type: String,
      default: null,
    },
    activationToken: {
      type: String,
      default: null,
    },
    activationTokenExpiry: {
      type: Date,
      default: null,
    },
    resetToken: {
      type: String,
      default: null,
    },
    resetTokenExpiry: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
    collection: "users",
  },
);

// Indexes (removed duplicate index: true from fields)
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ activationToken: 1 });
userSchema.index({ resetToken: 1 });

// Virtual for ID as string
userSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

// Ensure virtuals are included in JSON
userSchema.set("toJSON", {
  virtuals: true,
  transform: function (doc, ret) {
    delete ret._id;
    delete ret.__v;
    delete ret.password;
    delete ret.activationToken;
    delete ret.resetToken;
    return ret;
  },
});

module.exports = mongoose.model("User", userSchema);
