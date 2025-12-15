// src/controllers/auth.controller.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import Role from "../models/role.model.js";
import ActivityPermission from "../models/activityPermission.model.js";
import Permission from "../models/permission.model.js";
import Activity from "../models/activity.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const JWT_ACCESS_SECRET = process.env.JWT_TOKEN_SECRET_KEY;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_TOKEN_SECRET_KEY;
const JWT_VERIFY_SECRET = process.env.JWT_VERIFY_SECRET_KEY;
const ACCESS_EXPIRES = process.env.JWT_TOKEN_EXPIRE_IN_TIME || "1h";
const REFRESH_EXPIRES = process.env.JWT_REFRESH_TOKEN_EXPIRE_IN_TIME || "7d";

function generateToken(user) {
  const payload = {
    id: user.id || user._id.toString(),
    email: user.email,
    mobileNumber: user.mobileNumber,
    roles: user.roleName || user.role?.name || null,
  };

  const accessToken = jwt.sign(payload, JWT_ACCESS_SECRET, {
    expiresIn: ACCESS_EXPIRES,
  });
  const refreshToken = jwt.sign({ id: payload.id }, JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_EXPIRES,
  });

  return { accessToken, refreshToken };
}

/**
 * Verify User
 */
const verifyUser = asyncHandler(async (req, res) => {
  const { token } = req.body;
  try {
    const decoded = jwt.verify(token, JWT_VERIFY_SECRET);
    const id = decoded.id;

    const result = await User.updateOne(
      { id },
      { $set: { isVerified: true, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) throw new ApiError(404, "User not found");

    return res
      .status(200)
      .json(new ApiResponse(200, null, "User verified successfully"));
  } catch (error) {
    throw new ApiError(401, "Link is invalid or expired");
  }
});

/**
 * Login User
 */
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).lean();
  if (!user) throw new ApiError(401, "Invalid credentials");
  if (!user.isActive) throw new ApiError(401, "User is not active");

  const userDoc = await User.findOne({ email });
  const isMatch = await bcrypt.compare(password, userDoc.password);
  if (!isMatch) throw new ApiError(401, "Invalid credentials");

  const role = await Role.findOne({ _id: user.roleId }).lean();

  /** FIXED: populate field changed from `activity` → `activityId` */
  const activityPermsRaw = await ActivityPermission.find({
    roleId: user.roleId,
  })
    .populate({
      path: "roleId",
      model: Role,
      select: "id name",
    })
    .populate({
      path: "activityId", // ← FIXED
      model: Activity,
      select: "id name",
    })
    .lean();

  const allPermissionIds = activityPermsRaw.flatMap((ap) =>
    Array.isArray(ap.permissionIds) ? ap.permissionIds : []
  );

  const uniquePermissionIds = [...new Set(allPermissionIds)];

  const permissionRecords = await Permission.find(
    { id: { $in: uniquePermissionIds } },
    { id: 1, name: 1 }
  ).lean();

  const idToNameMap = {};
  permissionRecords.forEach((p) => {
    idToNameMap[p.id] = p.name;
  });

  const enrichedPermissions = activityPermsRaw.map((item) => {
    const permIds = Array.isArray(item.permissionIds) ? item.permissionIds : [];
    const permissionNames = permIds
      .map((pid) => idToNameMap[pid])
      .filter(Boolean);

    return {
      id: item.id || null,
      role: item.roleId || { id: user.roleId, name: role?.name },
      activity: item.activityId || null, // FIXED
      permissionNames,
    };
  });

  const tokens = generateToken(user);

  await User.updateOne(
    { email },
    { $set: { refreshToken: tokens.refreshToken, updatedAt: new Date() } }
  );

  const userResponse = { ...user };
  delete userResponse.password;
  delete userResponse.refreshToken;

  const data = {
    token: tokens,
    user: userResponse,
    permissions: enrichedPermissions,
  };

  return res.status(200).json(new ApiResponse(200, data, "Login successful"));
});

/**
 * Forgot Password
 */
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email, isVerified: true }).lean();
  if (!user) throw new ApiError(400, "Invalid Email");

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Reset Password email sent successfully"));
});

/**
 * Reset Password
 */
const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  try {
    const decoded = jwt.verify(token, JWT_VERIFY_SECRET);
    const id = decoded.id;

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await User.updateOne(
      { id },
      {
        $set: {
          password: hashedPassword,
          updatedAt: new Date(),
          refreshToken: null,
        },
      }
    );

    if (result.matchedCount === 0) throw new ApiError(404, "User not found");

    return res
      .status(200)
      .json(new ApiResponse(200, null, "Password reset successfully"));
  } catch (error) {
    throw new ApiError(401, "Link is invalid or expired");
  }
});

/**
 * Refresh Token
 */
const refreshToken = asyncHandler(async (req, res) => {
  try {
    const { refreshToken: incoming } = req.body;
    if (!incoming) throw new ApiError(400, "Refresh token is required");

    const decoded = jwt.verify(incoming, JWT_REFRESH_SECRET);
    const userId = decoded.id;

    const user = await User.findOne({ _id: userId }).lean();
    if (!user || user.refreshToken !== incoming)
      throw new ApiError(401, "Invalid or expired refresh token");

    const tokens = generateToken(user);

    await User.updateOne(
      { id: userId },
      { $set: { refreshToken: tokens.refreshToken, updatedAt: new Date() } }
    );

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { accessToken: tokens.accessToken },
          "Access token refreshed"
        )
      );
  } catch (err) {
    if (err.name === "TokenExpiredError" || err.name === "JsonWebTokenError")
      throw new ApiError(400, "Token is expired");
    throw err;
  }
});

/**
 * Logout
 */
const logoutUser = asyncHandler(async (req, res) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.split(" ")[1];

    if (!token)
      return res
        .status(400)
        .json(new ApiResponse(false, null, "Token missing in request"));

    try {
      const decoded = jwt.verify(token, JWT_ACCESS_SECRET);
      const userId = decoded.id;

      await User.updateOne(
        { id: userId },
        { $set: { refreshToken: null, updatedAt: new Date() } }
      );
    } catch (e) {
      // ignore invalid tokens
    }

    return res
      .status(200)
      .json(new ApiResponse(true, null, "Logout successful"));
  } catch (err) {
    console.error("Logout Error:", err);
    return res.status(500).json(new ApiResponse(false, null, "Logout failed"));
  }
});

export default {
  verifyUser,
  loginUser,
  refreshToken,
  forgotPassword,
  resetPassword,
  logoutUser,
};
