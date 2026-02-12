const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "in_progress", "completed", "on_hold"],
      default: "pending",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    testType: {
      type: String,
      required: true,
      trim: true,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedStaffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    dueDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "projects",
  },
);

// Indexes (removed duplicate index: true from fields)
projectSchema.index({ projectId: 1 });
projectSchema.index({ clientId: 1 });
projectSchema.index({ assignedStaffId: 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ createdAt: -1 });

// Text index for search
projectSchema.index({ title: "text", description: "text" });

// Virtual for ID
projectSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

projectSchema.set("toJSON", {
  virtuals: true,
  transform: function (doc, ret) {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

// Pre-save hook to auto-increment project ID
projectSchema.pre("save", async function (next) {
  if (this.isNew && !this.projectId) {
    const Project = mongoose.model("Project");
    const lastProject = await Project.findOne().sort({ projectId: -1 });

    let nextNumber = 1;
    if (lastProject && lastProject.projectId) {
      const lastNumber = parseInt(lastProject.projectId.split("-")[1]);
      nextNumber = lastNumber + 1;
    }

    this.projectId = `PRJ-${String(nextNumber).padStart(3, "0")}`;
  }
  next();
});

module.exports = mongoose.model("Project", projectSchema);
