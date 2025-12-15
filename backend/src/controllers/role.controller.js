import Role from "../models/role.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { trimRequestBody } from "../utils/trimRequestBody.js";
import { responseMessage } from "../utils/responseMessage.js";
import { makePagination, sendSuccess } from "../utils/responseHelpers.js";

/**
 * Helper: get roleId by role name
 */
const getRoleIdByName = async (roleName) => {
  const role = await Role.findOne({ name: roleName });
  if (!role) throw new Error(`Role not found: ${roleName}`);
  return role._id.toString();
};

// Create Role
const createRole = asyncHandler(async (req, res) => {
  req.body = trimRequestBody(req.body);
  const { name } = req.body;

  const existing = await Role.findOne({ name });
  if (existing) throw new ApiError(400, responseMessage.alreadyExists("Role"));

  const createdBy = req.user?._id || null;
  const role = await Role.create({ ...req.body, createdBy });

  return res
    .status(201)
    .json(new ApiResponse(201, role, responseMessage.created("Role")));
});

// Get Role List (pagination + search)
const getRoleList = asyncHandler(async (req, res) => {
  let { page = 1, limit = 20, sortBy = "createdAt", sortOrder = "desc", name = "", isActive } = req.query;
  page = parseInt(page, 10);
  limit = parseInt(limit, 10);

  const filter = {};
  if (name) filter.name = { $regex: new RegExp(name.trim(), "i") };
  if (typeof isActive !== "undefined") filter.isActive = isActive === "true";

  const [roles, totalItems] = await Promise.all([
    Role.find(filter)
      .sort({ [sortBy]: sortOrder === "desc" ? -1 : 1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Role.countDocuments(filter),
  ]);

  const payload = makePagination({ items: roles, total: totalItems, page, limit });
  return sendSuccess(res, { message: "Roles fetched successfully", status: 200, payload });
});

// Get Role by ID
const getRoleById = asyncHandler(async (req, res) => {
  const role = await Role.findById(req.params.id);
  if (!role) throw new ApiError(404, responseMessage.notFound("Role"));
  return res.status(200).json(new ApiResponse(200, role, responseMessage.fetched("Role")));
});

// Update Role
const updateRole = asyncHandler(async (req, res) => {
  req.body = trimRequestBody(req.body);
  const updatedBy = req.user?._id || null;

  const role = await Role.findByIdAndUpdate(
    req.params.id,
    { ...req.body, updatedBy },
    { new: true }
  );

  if (!role) throw new ApiError(404, responseMessage.notFound("Role"));
  return res.status(200).json(new ApiResponse(200, role, responseMessage.updated("Role")));
});

// Update Role Status
const updateRoleStatus = asyncHandler(async (req, res) => {
  const role = await Role.findById(req.params.id);
  if (!role) throw new ApiError(404, responseMessage.notFound("Role"));

  role.status = req.body.status;
  role.updatedBy = req.user?._id || null;
  await role.save();

  return res.status(200).json(new ApiResponse(200, role, responseMessage.statusUpdated("Role")));
});

// Delete Role
const deleteRole = asyncHandler(async (req, res) => {
  const role = await Role.findById(req.params.id);
  if (!role) throw new ApiError(404, responseMessage.notFound("Role"));

  await role.deleteOne();

  return res.status(200).json(new ApiResponse(200, null, responseMessage.deleted("Role")));
});

export default {
  createRole,
  getRoleList,
  getRoleById,
  updateRole,
  updateRoleStatus,
  deleteRole,
  getRoleIdByName,
};
