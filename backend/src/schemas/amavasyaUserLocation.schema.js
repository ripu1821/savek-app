import Joi from "joi";

export const createAULSchema = Joi.object({
  amavasyaId: Joi.string().required(),
  userId: Joi.string().required(),
  locationId: Joi.string().required(),
  note: Joi.string().allow(null, ""),
});

export const updateAULSchema = Joi.object({
  amavasyaId: Joi.string(),
  userId: Joi.string(),
  locationId: Joi.string(),
  note: Joi.string().allow(null, ""),
  isActive: Joi.boolean(),
});
