const FastTrack = require("../models/FastTrack");

// Generate small alphanumeric ID
function generateSmallId() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Generate FastTrack IDs
exports.generateId = async (req, res) => {
  try {
    const year = new Date().getFullYear();

    // Generate unique small ID
    let smallId;
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 10) {
      smallId = generateSmallId();
      const existing = await FastTrack.findOne({ smallId });
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      return res.status(500).json({
        success: false,
        message: "Failed to generate unique small ID",
      });
    }

    // Find the last docket number for the current year
    const lastTrack = await FastTrack.findOne({
      docketNumber: new RegExp(`^Delpro/Report/${year}/`),
    }).sort({ docketNumber: -1 });

    let nextSequence = 1;

    if (lastTrack) {
      const lastSequence = parseInt(lastTrack.docketNumber.split("/").pop());
      nextSequence = lastSequence + 1;
    }

    const docketNumber = `Delpro/Report/${year}/${String(nextSequence).padStart(3, "0")}`;

    return res.status(200).json({
      success: true,
      data: { smallId, docketNumber },
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
    const { title, smallId, docketNumber } = req.body;
    const { id: createdBy } = req.user;

    // Validate that both IDs are provided
    if (!smallId || !docketNumber) {
      return res.status(400).json({
        success: false,
        message: "Both small ID and docket number are required",
      });
    }

    // Check if IDs already exist
    const existingSmallId = await FastTrack.findOne({ smallId });
    if (existingSmallId) {
      return res.status(400).json({
        success: false,
        message: "Small ID already exists",
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
