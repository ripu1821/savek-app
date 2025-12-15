import Joi from "joi";

const monthEnum = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const createAmavasyaSchema = Joi.object({
  month: Joi.string().valid(...monthEnum).required(),
  year: Joi.number().integer().min(1900).max(3000).required(),
  startDate: Joi.date().required(),
  endDate: Joi.date().allow(null),
  startTime: Joi.string().allow(null),
  endTime: Joi.string().allow(null),
});

export const updateAmavasyaSchema = Joi.object({
  month: Joi.string().valid(...monthEnum),
  year: Joi.number().integer().min(1900).max(3000),
  startDate: Joi.date(),
  endDate: Joi.date().allow(null),
  startTime: Joi.string().allow(null),
  endTime: Joi.string().allow(null),
  isActive: Joi.boolean(),
});
