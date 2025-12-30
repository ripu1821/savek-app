import AmavasyaUserLocation from "../models/amavasyaUserLocation.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { responseMessage } from "../utils/responseMessage.js";
import { makePagination, sendSuccess } from "../utils/responseHelpers.js";
import amavasyaModel from "../models/amavasya.model.js";
import User from "../models/user.model.js";

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
  let { amavasyaId, userId, locationId, q, page, limit } = req.query;

  page = Number(page);
  limit = Math.min(Number(limit), 100);
  const skip = (page - 1) * limit;

  /* ----------------------------
     FILTERS
  ----------------------------- */
  const filter = {};

  if (amavasyaId) filter.amavasyaId = amavasyaId;
  if (userId) filter.userId = userId;
  if (locationId) filter.locationId = locationId;

  /* ----------------------------
     BASE QUERY
  ----------------------------- */
  let query = AmavasyaUserLocation.find(filter)
    .populate("amavasyaId")
    .populate("userId", "userName email mobileNumber")
    .populate("locationId", "name")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  /* ----------------------------
     SEARCH (USER / LOCATION)
  ----------------------------- */
  if (q) {
    query = AmavasyaUserLocation.find(filter)
      .populate({
        path: "userId",
        match: {
          $or: [
            { userName: { $regex: q, $options: "i" } },
            { email: { $regex: q, $options: "i" } },
            { mobileNumber: { $regex: q, $options: "i" } },
          ],
        },
        select: "userName email mobileNumber",
      })
      .populate({
        path: "locationId",
        match: { name: { $regex: q, $options: "i" } },
        select: "name",
      })
      .populate("amavasyaId")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
  }

  /* ----------------------------
     EXECUTION
  ----------------------------- */
  const [records, total] = await Promise.all([
    query.lean(),
    AmavasyaUserLocation.countDocuments(filter),
  ]);

  const payload = makePagination({
    items: records,
    total,
    page,
    limit,
  });

  return sendSuccess(res, {
    message: "Amavasya user locations fetched successfully",
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
 * USER WISE LIST (WITH PAGINATION LIKE getUsers)
 */
const getUserWiseAULList = asyncHandler(async (req, res) => {
  let { page, limit } = req.query;

  // -----------------------------
  // SAFE PAGINATION (same pattern)
  // -----------------------------
  page = Math.max(Number(page) || 1, 1);
  limit = Math.min(Number(limit) || 10, 100);
  const skip = (page - 1) * limit;

  // -----------------------------
  // BASE AGGREGATION (NO PAGINATION)
  // -----------------------------
  const basePipeline = [
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
    { $sort: { "amavasya.startDate": -1 } },

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
  ];

  // -----------------------------
  // EXECUTE: ITEMS + TOTAL
  // -----------------------------
  const [items, totalResult] = await Promise.all([
    AmavasyaUserLocation.aggregate([
      ...basePipeline,
      { $skip: skip },
      { $limit: limit },
    ]),
    AmavasyaUserLocation.aggregate([...basePipeline, { $count: "count" }]),
  ]);

  const total = totalResult[0]?.count ?? 0;

  // -----------------------------
  // SAME PAGINATION FORMAT
  // -----------------------------
  const payload = makePagination({
    items,
    total,
    page,
    limit,
  });

  return sendSuccess(res, {
    status: 200,
    message: "User wise amavasya list fetched",
    payload,
  });
});

/**
 * USER AMAVASYA ATTENDANCE
 * ONLY Amavasya present in AmavasyaUserLocation table
 */
const getUserAmavasyaAttendance = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { year, status, search } = req.query;

  if (!userId) {
    throw new ApiError(400, "userId is required");
  }

  const today = new Date();

  /* -------------------------------------------------
     0️⃣ FETCH USER DETAILS (FOR HEADER)
  -------------------------------------------------*/
  const user = await User.findById(userId)
    .select("userName email mobileNumber")
    .lean();

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  /* -------------------------------------------------
     1️⃣ USER ATTENDANCE RECORDS
  -------------------------------------------------*/
  const userRecords = await AmavasyaUserLocation.find({ userId })
    .populate("locationId", "name")
    .lean();

  if (!userRecords.length) {
    return sendSuccess(res, {
      status: 200,
      message: "No amavasya attendance found",
      payload: {
        user,
        userId,
        totalAmavasya: 0,
        present: 0,
        absent: 0,
        upcoming: 0,
        items: [],
      },
    });
  }

  /* -------------------------------------------------
     2️⃣ AMAVASYA IDS
  -------------------------------------------------*/
  const amavasyaIds = userRecords.map((r) => r.amavasyaId);

  /* -------------------------------------------------
     3️⃣ FETCH AMAVASYA
  -------------------------------------------------*/
  const query = { _id: { $in: amavasyaIds } };
  if (year) query.year = Number(year);

  const amavasyaList = await amavasyaModel.find(query).lean();

  /* -------------------------------------------------
     4️⃣ MAP (amavasyaId → record)
  -------------------------------------------------*/
  const userMap = new Map();
  userRecords.forEach((r) => userMap.set(String(r.amavasyaId), r));

  /* -------------------------------------------------
     5️⃣ BUILD FINAL ITEMS
  -------------------------------------------------*/
  let items = amavasyaList.map((a) => {
    const record = userMap.get(String(a._id));
    const isFuture = new Date(a.startDate) > today;

    return {
      amavasyaId: a._id,
      month: a.month,
      year: a.year,
      startDate: a.startDate,
      endDate: a.endDate,
      status: isFuture ? "Upcoming" : record ? "Present" : "Absent",
      location: record?.locationId?.name || null,
      note: record?.note || null,
    };
  });

  /* -------------------------------------------------
     6️⃣ FILTERS
  -------------------------------------------------*/
  if (status) {
    items = items.filter((i) => i.status === status);
  }

  if (search) {
    const s = search.toLowerCase();
    items = items.filter((i) => i.month.toLowerCase().includes(s));
  }

  /* -------------------------------------------------
     7️⃣ SORT (LATEST FIRST)
  -------------------------------------------------*/
  items.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));

  /* -------------------------------------------------
     8️⃣ COUNTS
  -------------------------------------------------*/
  const totalAmavasya = items.length;
  const present = items.filter((i) => i.status === "Present").length;
  const absent = items.filter((i) => i.status === "Absent").length;
  const upcoming = items.filter((i) => i.status === "Upcoming").length;

  /* -------------------------------------------------
     9️⃣ RESPONSE
  -------------------------------------------------*/
  return sendSuccess(res, {
    status: 200,
    message: "User amavasya attendance fetched",
    payload: {
      user, // 👈 USER DETAILS FOR HEADER
      userId,
      totalAmavasya,
      present,
      absent,
      upcoming,
      items,
    },
  });
});

/**
 * USER ATTENDANCE COUNT LIST
 * Sorted by highest attendance
 */
const getUserAttendanceCountList = asyncHandler(async (req, res) => {
  const data = await AmavasyaUserLocation.aggregate([
    // optional: only active mappings
    {
      $match: { isActive: true },
    },

    // group by user
    {
      $group: {
        _id: "$userId",
        totalAttendance: { $sum: 1 },
      },
    },

    // join user details
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: "$user" },

    // shape response
    {
      $project: {
        _id: 0,
        userId: "$user._id",
        userName: "$user.userName",
        email: "$user.email",
        totalAttendance: 1,
      },
    },

    // highest count on top
    {
      $sort: { totalAttendance: -1 },
    },
  ]);

  return sendSuccess(res, {
    status: 200,
    message: "User attendance count fetched",
    payload: {
      items: data,
      totalUsers: data.length,
    },
  });
});

/**
 * BULK CREATE AUL (MULTIPLE USERS)
 * - Same amavasyaId
 * - Skip users already assigned
 */
const createBulkAUL = asyncHandler(async (req, res) => {
  const { amavasyaId, userIds, locationId, note } = req.body;

  if (
    !amavasyaId ||
    !Array.isArray(userIds) ||
    !userIds.length ||
    !locationId
  ) {
    throw new ApiError(
      400,
      "amavasyaId, userIds (array), locationId are required"
    );
  }

  /* -------------------------------------------------
     1️⃣ FIND ALREADY ASSIGNED USERS
  -------------------------------------------------*/
  const existingRecords = await AmavasyaUserLocation.find({
    amavasyaId,
    userId: { $in: userIds },
  }).select("userId");

  const existingUserIds = new Set(existingRecords.map((r) => String(r.userId)));

  /* -------------------------------------------------
     2️⃣ FILTER NEW USERS ONLY
  -------------------------------------------------*/
  const newEntries = userIds
    .filter((uid) => !existingUserIds.has(String(uid)))
    .map((uid) => ({
      amavasyaId,
      userId: uid,
      locationId,
      note: note || null,
      createdBy: req.user?._id || null,
    }));

  if (!newEntries.length) {
    return sendSuccess(res, {
      status: 200,
      message: "All users already assigned to this amavasya",
      payload: {
        inserted: 0,
        skipped: userIds.length,
      },
    });
  }

  /* -------------------------------------------------
     3️⃣ INSERT NEW RECORDS
  -------------------------------------------------*/
  const inserted = await AmavasyaUserLocation.insertMany(newEntries);

  /* -------------------------------------------------
     4️⃣ RESPONSE
  -------------------------------------------------*/
  return sendSuccess(res, {
    status: 201,
    message: "Users assigned to amavasya successfully",
    payload: {
      inserted: inserted.length,
      skipped: userIds.length - inserted.length,
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
  getUserAttendanceCountList,
  createBulkAUL,
};
