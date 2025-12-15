import Amavasya from "../models/amavasya.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { responseMessage } from "../utils/responseMessage.js";
import { sendSuccess } from "../utils/responseHelpers.js";

/**
 * Create Amavasya
 */
export const createAmavasya = asyncHandler(async (req, res) => {
  const { month, year, startDate, endDate, startTime, endTime, isActive } =
    req.body;

  if (!month || !year || !startDate) {
    throw new ApiError(
      400,
      responseMessage.required("month, year & startDate are")
    );
  }

  const amavasya = await Amavasya.create({
    month,
    year,
    startDate,
    endDate,
    startTime,
    endTime,
    isActive: isActive !== undefined ? isActive : true,
    createdBy: req.user?._id || null,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, amavasya, responseMessage.created("Amavasya")));
});

/**
 * Get All
 */
export const getAllAmavasya = asyncHandler(async (req, res) => {
  const list = await Amavasya.find().sort({ startDate: 1 }).lean();
  const payload = { items: list, total: list.length, page: 1, limit: list.length, totalPages: 1, currentPageItems: list.length, previousPage: false, nextPage: false };
  return sendSuccess(res, { message: "Amavasya list fetched", status: 200, payload });
});
/**
 * Get By ID
 */
export const getAmavasyaById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const amavasya = await Amavasya.findById(id).lean();
  if (!amavasya) throw new ApiError(404, responseMessage.notFound("Amavasya"));

  return res
    .status(200)
    .json(new ApiResponse(200, amavasya, responseMessage.fetched("Amavasya")));
});

/**
 * Update
 */
export const updateAmavasya = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const updated = await Amavasya.findByIdAndUpdate(
    id,
    { ...req.body, updatedBy: req.user?._id || null },
    { new: true, runValidators: true } // runValidators ensures year is validated
  );

  if (!updated) throw new ApiError(404, responseMessage.notFound("Amavasya"));

  return res
    .status(200)
    .json(new ApiResponse(200, updated, responseMessage.updated("Amavasya")));
});

/**
 * Delete
 */
export const deleteAmavasya = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const deleted = await Amavasya.findByIdAndDelete(id);

  if (!deleted) throw new ApiError(404, responseMessage.notFound("Amavasya"));

  return res
    .status(200)
    .json(new ApiResponse(200, null, responseMessage.deleted("Amavasya")));
});

export default {
  createAmavasya,
  getAllAmavasya,
  getAmavasyaById,
  updateAmavasya,
  deleteAmavasya,
};
