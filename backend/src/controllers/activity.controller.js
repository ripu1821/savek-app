import Activity from "../models/activity.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { trimRequestBody } from "../utils/trimRequestBody.js";
import { responseMessage } from "../utils/responseMessage.js";
import { makePagination, sendSuccess } from "../utils/responseHelpers.js";

/**
 * Create Activity
 */
const createActivity = asyncHandler(async (req, res) => {
  req.body = trimRequestBody(req.body);
  const { name } = req.body;

  const existing = await Activity.findOne({ name });
  if (existing) throw new ApiError(400, responseMessage.alreadyExists("Activity"));

  const createdBy = req.user?._id || null;
  const activity = await Activity.create({ ...req.body, createdBy });

  return res
    .status(201)
    .json(new ApiResponse(201, activity, responseMessage.created("Activity")));
});

/**
 * Get Activity List (pagination + search)
 */
const getActivityList = asyncHandler(async (req, res) => {
  let { page = 1, limit = 10, sortBy = "createdAt", sortOrder = "desc", name = "" } = req.query;
  page = parseInt(page, 10);
  limit = parseInt(limit, 10);

  const filter = {};
  if (name) filter.name = { $regex: name, $options: "i" };

  const [activities, totalItems] = await Promise.all([
    Activity.find(filter)
      .sort({ [sortBy]: sortOrder === "desc" ? -1 : 1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Activity.countDocuments(filter),
  ]);

  const payload = makePagination({ items: activities, total: totalItems, page, limit });
  return sendSuccess(res, { message: "Activities fetched successfully", status: 200, payload });
});

/**
 * Get Activity By ID
 */
const getActivityById = asyncHandler(async (req, res) => {
  const activity = await Activity.findById(req.params.id);
  if (!activity) throw new ApiError(404, responseMessage.notFound("Activity"));

  return res
    .status(200)
    .json(new ApiResponse(200, activity, responseMessage.fetched("Activity")));
});

/**
 * Update Activity
 */
const updateActivity = asyncHandler(async (req, res) => {
  req.body = trimRequestBody(req.body);
  const updatedBy = req.user?._id || null;

  const activity = await Activity.findByIdAndUpdate(
    req.params.id,
    { ...req.body, updatedBy },
    { new: true }
  );

  if (!activity) throw new ApiError(404, responseMessage.notFound("Activity"));

  return res
    .status(200)
    .json(new ApiResponse(200, activity, responseMessage.updated("Activity")));
});

/**
 * Update Activity Status
 */
const updateActivityStatus = asyncHandler(async (req, res) => {
  const activity = await Activity.findById(req.params.id);
  if (!activity) throw new ApiError(404, responseMessage.notFound("Activity"));

  activity.status = req.body.status;
  activity.updatedBy = req.user?._id || null;
  await activity.save();

  return res
    .status(200)
    .json(new ApiResponse(200, activity, responseMessage.statusUpdated("Activity")));
});

/**
 * Delete Activity
 */
const deleteActivity = asyncHandler(async (req, res) => {
  const activity = await Activity.findById(req.params.id);
  if (!activity) throw new ApiError(404, responseMessage.notFound("Activity"));

  await activity.deleteOne();

  return res
    .status(200)
    .json(new ApiResponse(200, null, responseMessage.deleted("Activity")));
});

export default {
  createActivity,
  getActivityList,
  getActivityById,
  updateActivity,
  updateActivityStatus,
  deleteActivity,
};
