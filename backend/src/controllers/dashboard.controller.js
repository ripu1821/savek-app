import User from "../models/user.model.js";
import Role from "../models/role.model.js";
import Location from "../models/location.model.js";
import Permission from "../models/permission.model.js";
import Amavasya from "../models/amavasya.model.js";
import AmavasyaUserLocation from "../models/amavasyaUserLocation.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/responseHelpers.js";
import amavasyaUserLocationModel from "../models/amavasyaUserLocation.model.js";

/**
 * Dashboard counts (ALL)
 */
const getDashboardCounts = asyncHandler(async (req, res) => {
  const [
    userCount,
    roleCount,
    locationCount,
    permissionCount,
    amavasyaCount,
    amavasyaUserLocationCount,
  ] = await Promise.all([
    User.countDocuments(),
    Role.countDocuments(),
    Location.countDocuments(),
    Permission.countDocuments(),
    Amavasya.countDocuments(),
    AmavasyaUserLocation.countDocuments(),
  ]);

  return sendSuccess(res, {
    status: 200,
    message: "Dashboard counts fetched successfully",
    payload: {
      users: userCount,
      roles: roleCount,
      locations: locationCount,
      permissions: permissionCount,
      amavasya: amavasyaCount,
      amavasyaUserLocations: amavasyaUserLocationCount,
    },
  });
});
/**
 * USER ATTENDANCE COUNT LIST
 * Sorted by highest attendance
 */
const getUserAttendanceCountList = asyncHandler(async (req, res) => {
  const { search = "" } = req.query;

  const pipeline = [
    /* =========================
       ONLY ACTIVE
    ========================= */
    {
      $match: { isActive: true },
    },

    /* =========================
       GROUP BY USER
    ========================= */
    {
      $group: {
        _id: "$userId",
        totalAttendance: { $sum: 1 },
      },
    },

    /* =========================
       JOIN USER
    ========================= */
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: "$user" },

    /* =========================
       SEARCH (OPTIONAL)
    ========================= */
    ...(search
      ? [
          {
            $match: {
              $or: [
                { "user.userName": { $regex: search, $options: "i" } },
                { "user.email": { $regex: search, $options: "i" } },
              ],
            },
          },
        ]
      : []),

    /* =========================
       SHAPE RESPONSE
    ========================= */
    {
      $project: {
        _id: 0,
        userId: "$user._id",
        userName: "$user.userName",
        email: "$user.email",
        totalAttendance: 1,
      },
    },

    /* =========================
       SORT
    ========================= */
    {
      $sort: {
        totalAttendance: -1,
        userName: 1, // stable order
      },
    },
  ];

  const data = await amavasyaUserLocationModel.aggregate(pipeline);

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
 * Get Amavasya (Past, Current & Future) with status
 * Order: FUTURE → CURRENT → PAST
 */
const getAllAmavasya = asyncHandler(async (req, res) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-based

  // 🔹 Start of last month
  const startOfLastMonth = new Date(currentYear, currentMonth - 1, 1);

  // 🔹 End of next month
  const endOfNextMonth = new Date(
    currentYear,
    currentMonth + 2,
    0,
    23,
    59,
    59,
    999
  );

  const list = await Amavasya.find({
    startDate: {
      $gte: startOfLastMonth,
      $lte: endOfNextMonth,
    },
  }).lean();

  /* =========================
     STATUS LOGIC (MONTH BASED)
  ========================= */
  const itemsWithStatus = list.map((item) => {
    const d = new Date(item.startDate);
    const y = d.getFullYear();
    const m = d.getMonth();

    let timeStatus = "PAST";

    // ✅ CURRENT → same year + same month (date doesn't matter)
    if (y === currentYear && m === currentMonth) {
      timeStatus = "CURRENT";
    }
    // ✅ FUTURE → month after current month
    else if (y > currentYear || (y === currentYear && m > currentMonth)) {
      timeStatus = "FUTURE";
    }

    return {
      ...item,
      timeStatus,
    };
  });

  /* =========================
     SORT: FUTURE → CURRENT → PAST
  ========================= */
  const statusOrder = {
    FUTURE: 1,
    CURRENT: 2,
    PAST: 3,
  };

  itemsWithStatus.sort((a, b) => {
    const diff = statusOrder[a.timeStatus] - statusOrder[b.timeStatus];

    // Same status → sort by date (ascending)
    if (diff === 0) {
      return new Date(a.startDate) - new Date(b.startDate);
    }

    return diff;
  });

  const payload = {
    items: itemsWithStatus,
    total: itemsWithStatus.length,
    page: 1,
    limit: itemsWithStatus.length,
    totalPages: 1,
    currentPageItems: itemsWithStatus.length,
    previousPage: false,
    nextPage: false,
  };

  return sendSuccess(res, {
    status: 200,
    message: "Amavasya list fetched (future → current → past)",
    payload,
  });
});

export default {
  getDashboardCounts,
  getUserAttendanceCountList,
  getAllAmavasya,
};
