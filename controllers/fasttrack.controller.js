const FastTrack = require("../models/FastTrack");

const FTS_TYPES = ["Report", "Purchase", "Correspondence", "Other"];
const DOCKET_PREFIX = "Delpro";

// Generate next FTS ID: DPL001..DPL999, then random 3 letters + 001 onwards
async function generateNextFtsId() {
  const dplRegex = /^DPL(\d{3})$/;
  const otherRegex = /^([A-Z]{3})(\d{3})$/;

  const all = await FastTrack.find({}, { smallId: 1 }).lean();
  let maxDpl = 0;
  const otherByPrefix = {};

  for (const { smallId } of all) {
    const dplMatch = smallId.match(dplRegex);
    if (dplMatch) {
      maxDpl = Math.max(maxDpl, parseInt(dplMatch[1], 10));
    } else {
      const otherMatch = smallId.match(otherRegex);
      if (otherMatch) {
        const prefix = otherMatch[1];
        const num = parseInt(otherMatch[2], 10);
        if (!otherByPrefix[prefix]) otherByPrefix[prefix] = 0;
        otherByPrefix[prefix] = Math.max(otherByPrefix[prefix], num);
      }
    }
  }

  let nextFtsId;
  if (maxDpl < 999) {
    nextFtsId = "DPL" + String(maxDpl + 1).padStart(3, "0");
  } else {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let attempts = 0;
    nextFtsId = null;
    while (attempts < 20) {
      let prefix = "";
      for (let i = 0; i < 3; i++) {
        prefix += letters.charAt(Math.floor(Math.random() * letters.length));
      }
      if (prefix === "DPL") continue;
      const maxForPrefix = otherByPrefix[prefix] || 0;
      const nextNum = maxForPrefix + 1;
      const candidate = prefix + String(nextNum).padStart(3, "0");
      const existing = await FastTrack.findOne({ smallId: candidate });
      if (!existing) {
        nextFtsId = candidate;
        break;
      }
      otherByPrefix[prefix] = nextNum;
      attempts++;
    }
    if (!nextFtsId) {
      return null;
    }
  }

  return nextFtsId;
}

// Generate FastTrack IDs (FTS ID + docket number for given type)
exports.generateId = async (req, res) => {
  try {
    const ftsType = (req.query.ftsType || req.body.ftsType || "Report").trim();
    if (!FTS_TYPES.includes(ftsType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid FTS type. Must be one of: " + FTS_TYPES.join(", "),
      });
    }

    const year = new Date().getFullYear();
    const smallId = await generateNextFtsId();
    if (!smallId) {
      return res.status(500).json({
        success: false,
        message: "Failed to generate unique FTS ID",
      });
    }

    const typeSegment = ftsType;
    const lastTrack = await FastTrack.findOne({
      docketNumber: new RegExp(`^${DOCKET_PREFIX}/${typeSegment}/${year}/`),
    }).sort({ docketNumber: -1 });

    let nextSequence = 1;
    if (lastTrack) {
      const lastSequence = parseInt(lastTrack.docketNumber.split("/").pop(), 10);
      nextSequence = lastSequence + 1;
    }

    const docketNumber = `${DOCKET_PREFIX}/${typeSegment}/${year}/${String(nextSequence).padStart(3, "0")}`;

    return res.status(200).json({
      success: true,
      data: { smallId, docketNumber, ftsType },
    });
  } catch (error) {
    console.error("Generate ID error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate IDs",
    });
  }
};

// Get All FastTracks
exports.getFastTracks = async (req, res) => {
  try {
    const fastTracks = await FastTrack.find()
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 })
      .lean();

    const transformedData = fastTracks.map((ft) => ({
      smallId: ft.smallId,
      docketNumber: ft.docketNumber,
      ftsType: ft.ftsType || "Report",
      title: ft.title,
      isPublished: ft.isPublished,
      publishedAt: ft.publishedAt,
      createdBy: {
        id: ft.createdBy._id,
        name: ft.createdBy.name,
      },
      createdAt: ft.createdAt,
      updatedAt: ft.updatedAt,
    }));

    return res.status(200).json({
      success: true,
      data: transformedData,
    });
  } catch (error) {
    console.error("Get FastTracks error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch FastTracks",
    });
  }
};

// Create FastTrack
exports.createFastTrack = async (req, res) => {
  try {
    const { title, smallId, docketNumber, ftsType } = req.body;
    const { id: createdBy } = req.user;

    const type = (ftsType || "Report").trim();
    if (!FTS_TYPES.includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid FTS type. Must be one of: " + FTS_TYPES.join(", "),
      });
    }

    if (!smallId || !docketNumber) {
      return res.status(400).json({
        success: false,
        message: "Both FTS ID and docket number are required",
      });
    }

    const existingSmallId = await FastTrack.findOne({ smallId });
    if (existingSmallId) {
      return res.status(400).json({
        success: false,
        message: "FTS ID already exists",
      });
    }

    const existingDocket = await FastTrack.findOne({ docketNumber });
    if (existingDocket) {
      return res.status(400).json({
        success: false,
        message: "Docket number already exists",
      });
    }

    const fastTrack = new FastTrack({
      smallId,
      docketNumber,
      ftsType: type,
      title,
      createdBy,
    });

    await fastTrack.save();
    await fastTrack.populate("createdBy", "name email");

    return res.status(201).json({
      success: true,
      message: "FastTrack created successfully",
      data: {
        smallId: fastTrack.smallId,
        docketNumber: fastTrack.docketNumber,
        ftsType: fastTrack.ftsType,
        title: fastTrack.title,
        isPublished: fastTrack.isPublished,
        createdBy: {
          id: fastTrack.createdBy._id,
          name: fastTrack.createdBy.name,
        },
        createdAt: fastTrack.createdAt,
        updatedAt: fastTrack.updatedAt,
      },
    });
  } catch (error) {
    console.error("Create FastTrack error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create FastTrack",
    });
  }
};

// Update FastTrack
exports.updateFastTrack = async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;

    // Find by smallId or docketNumber
    const fastTrack = await FastTrack.findOne({
      $or: [{ smallId: id }, { docketNumber: id }],
    }).populate("createdBy", "name email");

    if (!fastTrack) {
      return res.status(404).json({
        success: false,
        message: "FastTrack not found",
      });
    }

    fastTrack.title = title;
    await fastTrack.save();

    return res.status(200).json({
      success: true,
      message: "FastTrack updated successfully",
      data: {
        smallId: fastTrack.smallId,
        docketNumber: fastTrack.docketNumber,
        ftsType: fastTrack.ftsType || "Report",
        title: fastTrack.title,
        isPublished: fastTrack.isPublished,
        publishedAt: fastTrack.publishedAt,
        createdBy: {
          id: fastTrack.createdBy._id,
          name: fastTrack.createdBy.name,
        },
        updatedAt: fastTrack.updatedAt,
      },
    });
  } catch (error) {
    console.error("Update FastTrack error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update FastTrack",
    });
  }
};

// Publish FastTrack
exports.publishFastTrack = async (req, res) => {
  try {
    const { id } = req.params;

    // Find by smallId or docketNumber
    const fastTrack = await FastTrack.findOne({
      $or: [{ smallId: id }, { docketNumber: id }],
    }).populate("createdBy", "name email");

    if (!fastTrack) {
      return res.status(404).json({
        success: false,
        message: "FastTrack not found",
      });
    }

    fastTrack.isPublished = true;
    fastTrack.publishedAt = new Date();
    await fastTrack.save();

    return res.status(200).json({
      success: true,
      message: "FastTrack published successfully",
      data: {
        smallId: fastTrack.smallId,
        docketNumber: fastTrack.docketNumber,
        ftsType: fastTrack.ftsType || "Report",
        title: fastTrack.title,
        isPublished: fastTrack.isPublished,
        publishedAt: fastTrack.publishedAt,
        updatedAt: fastTrack.updatedAt,
      },
    });
  } catch (error) {
    console.error("Publish FastTrack error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to publish FastTrack",
    });
  }
};

// Delete FastTrack
exports.deleteFastTrack = async (req, res) => {
  try {
    const { id } = req.params;

    // Find by smallId or docketNumber
    const fastTrack = await FastTrack.findOneAndDelete({
      $or: [{ smallId: id }, { docketNumber: id }],
    });

    if (!fastTrack) {
      return res.status(404).json({
        success: false,
        message: "FastTrack not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "FastTrack deleted successfully",
    });
  } catch (error) {
    console.error("Delete FastTrack error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete FastTrack",
    });
  }
};
