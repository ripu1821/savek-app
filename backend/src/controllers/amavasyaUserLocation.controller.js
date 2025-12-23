import AmavasyaUserLocation from "../models/amavasyaUserLocation.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { responseMessage } from "../utils/responseMessage.js";
import { sendSuccess } from "../utils/responseHelpers.js";
import amavasyaModel from "../models/amavasya.model.js";

/**
 * Create Relation Entry
 */
export const createAUL = asyncHandler(async (req, res) => {
  const { amavasyaId, userId, locationId, note } = req.body;

  if (!amavasyaId || !userId || !locationId) {
    throw new ApiError(
      400,
      responseMessage.required("amavasyaId, userId, locationId are")
    );
  }

  const record = await AmavasyaUserLocation.create({
    amavasyaId,
    userId,
    locationId,
    note,
    createdBy: req.user?._id || null,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, record, responseMessage.created("Relation")));
});

/**
 * Get All Relations
 */
export const getAllAUL = asyncHandler(async (req, res) => {
  const records = await AmavasyaUserLocation.find()
    .populate("amavasyaId")
    .populate("userId", "userName email")
    .populate("locationId", "name")
    .sort({ createdAt: -1 })
    .lean();

  // non-paginated list: return items in payload.items
  const payload = {
    items: records,
    total: records.length,
    page: 1,
    limit: records.length,
    totalPages: 1,
    currentPageItems: records.length,
    previousPage: false,
    nextPage: false,
  };
  return sendSuccess(res, {
    message: "All relations fetched",
    status: 200,
    payload,
  });
});

/**
 * Get By ID
 */
export const getAULById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const record = await AmavasyaUserLocation.findById(id)
    .populate("amavasyaId")
    .populate("userId", "userName email")
    .populate("locationId", "name")
    .lean();

  if (!record) throw new ApiError(404, responseMessage.notFound("Record"));

  return res
    .status(200)
    .json(new ApiResponse(200, record, responseMessage.fetched("Record")));
});

/**
 * Update Relation
 */
export const updateAUL = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const updated = await AmavasyaUserLocation.findByIdAndUpdate(
    id,
    {
      ...req.body,
      updatedBy: req.user?._id || null,
    },
    { new: true }
  );

  if (!updated) throw new ApiError(404, responseMessage.notFound("Record"));

  return res
    .status(200)
    .json(new ApiResponse(200, updated, responseMessage.updated("Record")));
});

/**
 * Delete Relation
 */
export const deleteAUL = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const deleted = await AmavasyaUserLocation.findByIdAndDelete(id);

  if (!deleted) throw new ApiError(404, responseMessage.notFound("Record"));

  return res
    .status(200)
    .json(new ApiResponse(200, null, responseMessage.deleted("Record")));
});

/**
 * USER WISE LIST
 */
const getUserWiseAULList = asyncHandler(async (req, res) => {
  const data = await AmavasyaUserLocation.aggregate([
    {
      $lookup: {
        from: "amavasyas",
        localField: "amavasyaId",
        foreignField: "_id",
        as: "amavasya",
      },
    },
    { $unwind: "$amavasya" },

    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: "$user" },

    {
      $lookup: {
        from: "locations",
        localField: "locationId",
        foreignField: "_id",
        as: "location",
      },
    },
    { $unwind: "$location" },

    // latest amavasya first
    {
      $sort: { "amavasya.startDate": -1 },
    },

    // group by user
    {
      $group: {
        _id: "$user._id",
        user: { $first: "$user" },
        latestAmavasya: { $first: "$amavasya" },
        latestLocation: { $first: "$location" },
        assignments: {
          $push: {
            _id: "$_id",
            amavasya: "$amavasya",
            location: "$location",
            note: "$note",
            isActive: "$isActive",
            createdAt: "$createdAt",
          },
        },
      },
    },

    { $sort: { "latestAmavasya.startDate": -1 } },
  ]);

  return sendSuccess(res, {
    status: 200,
    message: "User wise amavasya list fetched",
    payload: {
      items: data,
      total: data.length,
    },
  });
});

/**
 * USER AMAVASYA ATTENDANCE
 * Present / Absent + Continuous Present Count
 */
const getUserAmavasyaAttendance = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    throw new ApiError(400, responseMessage.required("userId is"));
  }

  // 1️⃣ All amavasya (latest first for streak logic)
  const allAmavasyas = await amavasyaModel
    .find()
    .sort({ startDate: -1 }) // latest → old
    .lean();

  // 2️⃣ User records
  const userRecords = await AmavasyaUserLocation.find({ userId })
    .populate("locationId", "name")
    .lean();

  // quick lookup
  const userMap = new Map();
  userRecords.forEach((r) => {
    userMap.set(String(r.amavasyaId), r);
  });

  let continuousPresentCount = 0;

  // 3️⃣ Build attendance list + streak
  const result = allAmavasyas.map((a) => {
    const record = userMap.get(String(a._id));
    const status = record ? "Present" : "Absent";

    // streak calculation (latest first)
    if (status === "Present" && continuousPresentCount !== -1) {
      continuousPresentCount++;
    } else if (status === "Absent") {
      // break streak permanently
      continuousPresentCount = -1;
    }

    return {
      amavasyaId: a._id,
      month: a.month,
      year: a.year,
      startDate: a.startDate,
      endDate: a.endDate,
      status,
      location: record?.locationId?.name || null,
      note: record?.note || null,
    };
  });

  // fix negative streak
  const finalStreak =
    continuousPresentCount === -1
      ? result.findIndex((r) => r.status === "Absent")
      : continuousPresentCount;

  return sendSuccess(res, {
    status: 200,
    message: "User amavasya attendance fetched",
    payload: {
      userId,
      totalAmavasya: allAmavasyas.length,
      present: result.filter((r) => r.status === "Present").length,
      absent: result.filter((r) => r.status === "Absent").length,

      // 🔥 NEW COUNTS
      continuousPresentCount: finalStreak < 0 ? 0 : finalStreak,

      items: result.reverse(), // old → new (UI friendly)
    },
  });
});

export default {
  createAUL,
  getAllAUL,
  getAULById,
  updateAUL,
  deleteAUL,
  getUserWiseAULList,
  getUserAmavasyaAttendance,
};
