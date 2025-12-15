import Joi from "joi";

// Create User schema
export const createUserSchema = Joi.object({
  userName: Joi.string().min(3).max(50).required(),
  email: Joi.string().email().required(),
  mobileNumber: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .required()
    .messages({
      "string.pattern.base": "Mobile number must be 10 digits",
    }),
  password: Joi.string().min(6).required(),
  roleId: Joi.string().uuid().required(),
});

// Update User schema
export const updateUserSchema = Joi.object({
  userName: Joi.string().min(3).max(50).optional(),
  email: Joi.string().email().optional(),
  mobileNumber: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .optional()
    .messages({
      "string.pattern.base": "Mobile number must be 10 digits",
    }),
  password: Joi.string().min(6).optional(),
  roleId: Joi.string().uuid().optional(),
  isActive: Joi.boolean().optional(),
});
/**
 * Query schema for GET /user (search & pagination)
 * Supports:
 *  - userName (partial)
 *  - roleId (exact)
 *  - roleName (partial)
 *  - mobileNumber (partial)
 *  - email (partial)
 *  - q (generic search)
 *  - page, limit
 */
export const queryUserSchema = Joi.object({
  userName: Joi.string().trim().optional(),
  roleId: Joi.string().uuid().trim().optional(),
  roleName: Joi.string().trim().optional(),
  mobileNumber: Joi.string().trim().optional(),
  email: Joi.string().trim().optional(),
  q: Joi.string().trim().optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).optional(),
});