const mongoose = require("mongoose");

const internalStaffSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    specialization: {
      type: String,
      required: true,
      trim: true,
    },
    tempPassword: {
      type: String,
      default: null, // Clear after first login
    },
  },
  {
    timestamps: true,
    collection: "internal_staff",
  },
);

// Index (removed duplicate index: true from fields)
internalStaffSchema.index({ userId: 1 });

// Virtual for ID
internalStaffSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

internalStaffSchema.set("toJSON", {
  virtuals: true,
  transform: function (doc, ret) {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("InternalStaff", internalStaffSchema);
