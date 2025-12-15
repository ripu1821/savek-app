import Permission from "../models/permission.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { trimRequestBody } from "../utils/trimRequestBody.js";
import { responseMessage } from "../utils/responseMessage.js";
import { makePagination, sendSuccess } from "../utils/responseHelpers.js";

/**
 * Create Permission
 */
const createPermission = asyncHandler(async (req, res) => {
  req.body = trimRequestBody(req.body);
  const { name, description, status } = req.body;

  const existing = await Permission.findOne({ name });
  if (existing) throw new ApiError(400, responseMessage.alreadyExists("Permissions"));

  const createdBy = req.user?._id || null;
  const permission = await Permission.create({ name, description, status, createdBy });

  return res
    .status(201)
    .json(new ApiResponse(201, permission, responseMessage.created("Permissions")));
});

/**
 * Get Permission List (with pagination + search)
 */
const getPermissionList = asyncHandler(async (req, res) => {
  let { page = 1, limit = 10, sortBy = "createdAt", sortOrder = "desc", name = "" } = req.query;
  page = parseInt(page, 10);
  limit = parseInt(limit, 10);

  const filter = {};
  if (name) {
    filter.$or = [
      { name: { $regex: name, $options: "i" } },
      { description: { $regex: name, $options: "i" } },
    ];
  }

  const [permissions, totalItems] = await Promise.all([
    Permission.find(filter)
      .sort({ [sortBy]: sortOrder === "desc" ? -1 : 1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Permission.countDocuments(filter),
  ]);

  const payload = makePagination({ items: permissions, total: totalItems, page, limit });
  return sendSuccess(res, { message: "Permissions fetched successfully", status: 200, payload });
});
/**
 * Get Permission by ID
 */
const getPermissionById = asyncHandler(async (req, res) => {
  const permission = await Permission.findById(req.params.id);
  if (!permission) throw new ApiError(404, responseMessage.notFound("Permission"));

  return res
    .status(200)
    .json(new ApiResponse(200, permission, responseMessage.fetched("Permissions")));
});

/**
 * Update Permission
 */
const updatePermission = asyncHandler(async (req, res) => {
  req.body = trimRequestBody(req.body);
  const updatedBy = req.user?._id || null;

  const permission = await Permission.findByIdAndUpdate(
    req.params.id,
    { ...req.body, updatedBy },
    { new: true }
  );

  if (!permission) throw new ApiError(404, responseMessage.notFound("Permission"));

  return res
    .status(200)
    .json(new ApiResponse(200, permission, responseMessage.updated("Permissions")));
});

/**
 * Update Permission Status
 */
const updatePermissionStatus = asyncHandler(async (req, res) => {
  const permission = await Permission.findById(req.params.id);
  if (!permission) throw new ApiError(404, responseMessage.notFound("Permission"));

  permission.status = req.body.status;
  permission.updatedBy = req.user?._id || null;
  await permission.save();

  return res
    .status(200)
    .json(new ApiResponse(200, permission, responseMessage.statusUpdated("Permissions")));
});

/**
 * Delete Permission
 */
const deletePermission = asyncHandler(async (req, res) => {
  const permission = await Permission.findById(req.params.id);
  if (!permission) throw new ApiError(404, responseMessage.notFound("Permission"));

  await permission.deleteOne();

  return res
    .status(200)
    .json(new ApiResponse(200, null, responseMessage.deleted("Permissions")));
});

export default {
  createPermission,
  getPermissionList,
  getPermissionById,
  updatePermission,
  updatePermissionStatus,
  deletePermission,
};
