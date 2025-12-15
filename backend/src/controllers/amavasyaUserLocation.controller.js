import AmavasyaUserLocation from "../models/amavasyaUserLocation.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { responseMessage } from "../utils/responseMessage.js";
import { sendSuccess } from "../utils/responseHelpers.js";

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

export default {
  createAUL,
  getAllAUL,
  getAULById,
  updateAUL,
  deleteAUL,
};
