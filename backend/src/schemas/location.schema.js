// src/schemas/location.schema.js
import Joi from "joi";

const id = Joi.string().guid({ version: "uuidv4" });

export const createLocationSchema = Joi.object({
  address: Joi.string().trim().allow(null, ""),
  district: Joi.string().trim().allow(null, ""),
  state: Joi.string().trim().allow(null, ""),
  postalCode: Joi.string().trim().allow(null, ""),
  latitude: Joi.number().precision(7).optional(),
  longitude: Joi.number().precision(7).optional(),

  vehicleId: id.required(),
  clientId: id.required(),
  assignedDriverId: id.optional().allow(null),

  estimatedCost: Joi.number().precision(2).optional().allow(null),
  advancePaid: Joi.number().precision(2).optional().allow(null),
  paymentStatus: Joi.string().valid("UNPAID", "PARTIAL", "PAID").optional(),

  status: Joi.string()
    .valid("PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED")
    .optional(),

  startDate: Joi.date().required(),
  endDate: Joi.date().required(),

  isActive: Joi.boolean().optional(),
});

export const updateLocationSchema = Joi.object({
  address: Joi.string().trim().allow(null, ""),
  district: Joi.string().trim().allow(null, ""),
  state: Joi.string().trim().allow(null, ""),
  postalCode: Joi.string().trim().allow(null, ""),
  latitude: Joi.number().precision(7).optional().allow(null),
  longitude: Joi.number().precision(7).optional().allow(null),

  vehicleId: id.optional(),
  clientId: id.optional(),
  assignedDriverId: id.optional().allow(null),

  estimatedCost: Joi.number().precision(2).optional().allow(null),
  advancePaid: Joi.number().precision(2).optional().allow(null),
  paymentStatus: Joi.string().valid("UNPAID", "PARTIAL", "PAID").optional(),

  status: Joi.string()
    .valid("PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED")
    .optional(),

  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),

  isActive: Joi.boolean().optional(),
});

export const queryLocationSchema = Joi.object({
  vehicleId: id.optional(),
  clientId: id.optional(),
  status: Joi.string()
    .valid("PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED")
    .optional(),
  startDateFrom: Joi.date().optional(),
  startDateTo: Joi.date().optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).optional(),
  q: Joi.string().trim().optional(),
});
