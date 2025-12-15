import ActivityPermission from "../models/activityPermission.model.js";
import Permission from "../models/permission.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { responseMessage } from "../utils/responseMessage.js";
import { sendSuccess } from "../utils/responseHelpers.js";

/**
 * Assign Role Permissions to Activities
 */
const createOrUpdateActivityPermission = asyncHandler(async (req, res) => {
  const { roleId, activities } = req.body;

  if (!roleId || !activities || !Array.isArray(activities)) {
    throw new ApiError(
      400,
      responseMessage.required("roleId and activities are")
    );
  }

  // 1. Remove all existing mappings for this role
  await ActivityPermission.deleteMany({ roleId });

  // 2. Prepare new records (skip empty permissions)
  const records = activities
    .filter((act) => Array.isArray(act.permissionIds) && act.permissionIds.length > 0)
    .map((act) => ({
      roleId,
      activityId: act.activityId,
      permissionIds: act.permissionIds,
    }));

  // 3. Insert fresh
  if (records.length > 0) {
    await ActivityPermission.insertMany(records);
  }

  return res
    .status(200)
    .json(new ApiResponse(200, null, responseMessage.updated("Permissions")));
});

/**
 * Get Role Permissions (all activities + permissions for role)
 */
const getRolePermissions = asyncHandler(async (req, res) => {
  const { roleId } = req.params;
  if (!roleId) throw new ApiError(400, responseMessage.required("roleId is"));

  const activityPermsRaw = await ActivityPermission.find({ roleId })
    .populate({ path: "roleId", select: "id name" })
    .populate({ path: "activityId", select: "id name" })
    .lean();

  const allPermissionIds = activityPermsRaw.flatMap((item) => Array.isArray(item.permissionIds) ? item.permissionIds : []);
  const uniquePermissionIds = [...new Set(allPermissionIds)];

  const permissionRecords = await Permission.find({ id: { $in: uniquePermissionIds } })
    .select("id name")
    .lean();

  const idToNameMap = {};
  permissionRecords.forEach((p) => (idToNameMap[p.id] = p.name));

  const permissions = activityPermsRaw.map((item) => {
    const permIds = Array.isArray(item.permissionIds) ? item.permissionIds : [];
    const permissionNames = permIds.map((id) => idToNameMap[id]).filter(Boolean);
    return {
      id: item._id,
      activity: item.activityId || null,
      permissionNames,
    };
  });

  // non-paginated
  const payload = { items: permissions, total: permissions.length, page: 1, limit: permissions.length, totalPages: 1, currentPageItems: permissions.length, previousPage: false, nextPage: false };
  return sendSuccess(res, { message: "Role permissions fetched", status: 200, payload });
});

/**
 * Get Activity Permissions by Role ID
 */
const getActivityPermissionsByRoleId = asyncHandler(async (req, res) => {
  const { roleId } = req.params;
  if (!roleId) throw new ApiError(400, responseMessage.required("roleId is"));

  const rows = await ActivityPermission.find({ roleId })
    .populate({ path: "activityId", select: "id name status" })
    .sort({ createdAt: -1 })
    .lean();

  const result = {
    roleId,
    activities: rows.map((r) => ({
      id: r._id,
      activityId: r.activityId?._id ?? null,
      status: r.activityId?.status ?? null,
      permissionIds: r.permissionIds ?? [],
    })),
  };

  return res
    .status(200)
    .json(new ApiResponse(200, result, responseMessage.fetched("Activity permissions")));
});

export default {
  createOrUpdateActivityPermission,
  getRolePermissions,
  getActivityPermissionsByRoleId,
};
