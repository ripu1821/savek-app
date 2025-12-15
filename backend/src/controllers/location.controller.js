import Location from "../models/location.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { responseMessage } from "../utils/responseMessage.js";
import { makePagination, sendSuccess } from "../utils/responseHelpers.js";

// ------------------------------
// Create Location
// ------------------------------
export const createLocation = asyncHandler(async (req, res, next) => {
  try {
    const payload = req.body;

    const location = await Location.create(payload);

    return res
      .status(201)
      .json(
        new ApiResponse(201, location, responseMessage.created("Location"))
      );
  } catch (err) {
    next(new ApiError(500, err.message));
  }
});

// ------------------------------
// List Locations
// ------------------------------
export const listLocations = asyncHandler(async (req, res, next) => {
  try {
    const { page = 1, limit = 50, q, isActive } = req.query;
    const filter = {};
    if (isActive !== undefined) filter.isActive = isActive === "true";
    if (q) {
      const search = new RegExp(q, "i");
      filter.$or = [{ name: search }, { description: search }];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [items, total] = await Promise.all([
      Location.find(filter).skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
      Location.countDocuments(filter),
    ]);

    const payload = makePagination({ items, total, page: Number(page), limit: Number(limit) });
    return sendSuccess(res, { message: "Locations fetched successfully", status: 200, payload });
  } catch (err) {
    next(new ApiError(500, err.message));
  }
});
// ------------------------------
// Get Location by ID
// ------------------------------
export const getLocationById = asyncHandler(async (req, res, next) => {
  try {
    const location = await Location.findById(req.params.id);

    if (!location) {
      return next(new ApiError(404, responseMessage.notFound("Location")));
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, location, responseMessage.fetched("Location"))
      );
  } catch (err) {
    next(new ApiError(500, err.message));
  }
});

// ------------------------------
// Update Location
// ------------------------------
export const updateLocation = asyncHandler(async (req, res, next) => {
  try {
    const payload = req.body;

    const location = await Location.findByIdAndUpdate(
      req.params.id,
      { ...payload, updatedAt: new Date() },
      { new: true }
    );

    if (!location) {
      return next(new ApiError(404, responseMessage.notFound("Location")));
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, location, responseMessage.updated("Location"))
      );
  } catch (err) {
    next(new ApiError(500, err.message));
  }
});

// ------------------------------
// Delete Location
// ------------------------------
export const deleteLocation = asyncHandler(async (req, res, next) => {
  try {
    const location = await Location.findByIdAndDelete(req.params.id);

    if (!location) {
      return next(new ApiError(404, responseMessage.notFound("Location")));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, null, responseMessage.deleted("Location")));
  } catch (err) {
    next(new ApiError(500, err.message));
  }
});

export default {
  createLocation,
  listLocations,
  getLocationById,
  updateLocation,
  deleteLocation,
};
