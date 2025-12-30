import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import Role from "../models/role.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { responseMessage } from "../utils/responseMessage.js";
import { makePagination, sendSuccess } from "../utils/responseHelpers.js";

/**
 * Create User
 */
const createUser = asyncHandler(async (req, res) => {
  const { userName, email, mobileNumber, password, roleId } = req.body;

  // Role check
  const role = await Role.findOne({ _id: roleId });

  if (!role) throw new ApiError(400, "Invalid roleId");

  // Check duplicate email or mobile
  const existing = await User.findOne({
    $or: [{ email }, { mobileNumber }],
  });
  if (existing) throw new ApiError(400, "Email or Mobile already exists");

  // Hash password
  let hashedPassword = null;
  if (password && password.trim() !== "") {
    hashedPassword = await bcrypt.hash(password, 10);
  }

  const user = await User.create({
    userName,
    email,
    mobileNumber,
    password: hashedPassword,
    roleId,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, user, responseMessage.created("User")));
});

/**
 * Get all users with filters & pagination
 */
const getUsers = asyncHandler(async (req, res) => {
  let { userName, roleId, roleName, mobileNumber, email, q, page, limit } =
    req.query;

  page = Number(page);
  limit = Math.min(Number(limit), 100);
  const skip = (page - 1) * limit;

  const filter = {};
  if (userName) filter.userName = { $regex: userName, $options: "i" };
  if (mobileNumber)
    filter.mobileNumber = { $regex: mobileNumber, $options: "i" };
  if (email) filter.email = { $regex: email, $options: "i" };
  if (q) {
    filter.$or = [
      { userName: { $regex: q, $options: "i" } },
      { email: { $regex: q, $options: "i" } },
      { mobileNumber: { $regex: q, $options: "i" } },
    ];
  }

  // base query
  let query = User.find(filter)
    .populate({ path: "roleId", select: "id name" })
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 })
    .select("-password");

  // apply role filters if provided (populate match will filter role)
  if (roleId || roleName) {
    const roleFilter = {};
    if (roleId) roleFilter.id = roleId;
    if (roleName) roleFilter.name = { $regex: roleName, $options: "i" };

    query = User.find(filter)
      .populate({ path: "roleId", match: roleFilter, select: "id name" })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .select("-password");
  }

  const [users, total] = await Promise.all([
    query.lean(),
    User.countDocuments(filter),
  ]);
  const payload = makePagination({ items: users, total, page, limit });

  return sendSuccess(res, {
    message: "Users fetched successfully",
    status: 200,
    payload,
  });
});

/**
 * Get user by ID
 */
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findOne({ _id: req.params.id })
    .populate({ path: "roleId", select: "id name" })
    .select("-password")
    .lean();

  if (!user) throw new ApiError(404, responseMessage.notFound("User"));

  return res
    .status(200)
    .json(new ApiResponse(200, user, responseMessage.fetched("User")));
});

/**
 * Update User
 */
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findOne({ _id: req.params.id });
  if (!user) throw new ApiError(404, responseMessage.notFound("User"));

  const { password, ...rest } = req.body;

  if (password && password.trim() !== "") {
    rest.password = await bcrypt.hash(password, 10);
  }

  Object.assign(user, rest);
  await user.save();

  const updatedUser = user.toObject();
  delete updatedUser.password;

  return res
    .status(200)
    .json(new ApiResponse(200, updatedUser, responseMessage.updated("User")));
});

/**
 * Delete User
 */
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findOne({ _id: req.params.id });
  if (!user) throw new ApiError(404, responseMessage.notFound("User"));

  await user.deleteOne();

  return res
    .status(200)
    .json(new ApiResponse(200, null, responseMessage.deleted("User")));
});

export default {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
};
