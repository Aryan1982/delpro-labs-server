const mongoose = require("mongoose");

const FTS_TYPES = ["Report", "Purchase", "Correspondence", "Other"];

const fastTrackSchema = new mongoose.Schema(
  {
    smallId: {
      type: String,
      required: true,
      unique: true,
    },
    docketNumber: {
      type: String,
      required: true,
      unique: true,
    },
    ftsType: {
      type: String,
      required: true,
      enum: FTS_TYPES,
      default: "Report",
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "fast_track",
  },
);

// Indexes (removed duplicate index: true from fields)
fastTrackSchema.index({ smallId: 1 });
fastTrackSchema.index({ docketNumber: 1 });
fastTrackSchema.index({ ftsType: 1 });
fastTrackSchema.index({ createdBy: 1 });
fastTrackSchema.index({ isPublished: 1 });
fastTrackSchema.index({ createdAt: -1 });

// Virtual for ID
fastTrackSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

fastTrackSchema.set("toJSON", {
  virtuals: true,
  transform: function (doc, ret) {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("FastTrack", fastTrackSchema);
