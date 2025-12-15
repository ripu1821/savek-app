import express from "express";
import controller from "../controllers/amavasya.controller.js";
import { authenticateUser } from "../middlewares/authMiddleware.js";
import validateSchema from "../middlewares/validationMiddleware.js";

import {
  createAmavasyaSchema,
  updateAmavasyaSchema,
} from "../schemas/amavasya.schema.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Amavasyas
 *   description: Amavasya event management APIs
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Amavasya:
 *       type: object
 *       properties:
 *         month:
 *           type: string
 *           enum: [January, February, March, April, May, June, July, August, September, October, November, December]
 *         year:
 *           type: number
 *           example: 2025
 *         startDate:
 *           type: string
 *           format: date
 *         endDate:
 *           type: string
 *           format: date
 *         startTime:
 *           type: string
 *           example: "05:30"
 *         endTime:
 *           type: string
 *           example: "18:45"
 *         isActive:
 *           type: boolean
 *           default: true
 *       required:
 *         - month
 *         - year
 *         - startDate
 */

/**
 * @swagger
 * /amavasya:
 *   post:
 *     summary: Create a new Amavasya event
 *     tags: [Amavasyas]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/Amavasya"
 *           example:
 *             month: "March"
 *             year: 2025
 *             startDate: "2025-03-10"
 *             endDate: "2025-03-10"
 *             startTime: "05:30"
 *             endTime: "18:45"
 *             isActive: true
 *     responses:
 *       201:
 *         description: Amavasya created
 */
router.post(
  "/",
  authenticateUser,
  validateSchema(createAmavasyaSchema),
  controller.createAmavasya
);

/**
 * @swagger
 * /amavasya:
 *   get:
 *     summary: Get all Amavasya events
 *     tags: [Amavasyas]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of Amavasya events
 */
router.get("/", authenticateUser, controller.getAllAmavasya);

/**
 * @swagger
 * /amavasya/{id}:
 *   get:
 *     summary: Get Amavasya event by ID
 *     tags: [Amavasyas]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Event details
 */
router.get("/:id", authenticateUser, controller.getAmavasyaById);

/**
 * @swagger
 * /amavasya/{id}:
 *   put:
 *     summary: Update an Amavasya event
 *     tags: [Amavasyas]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/Amavasya"
 *           example:
 *             month: "April"
 *             year: 2025
 *             startDate: "2025-04-09"
 *             endDate: "2025-04-09"
 *             startTime: "06:00"
 *             endTime: "18:30"
 *             isActive: true
 *     responses:
 *       200:
 *         description: Amavasya updated
 */
router.put(
  "/:id",
  authenticateUser,
  validateSchema(updateAmavasyaSchema),
  controller.updateAmavasya
);

/**
 * @swagger
 * /amavasya/{id}:
 *   delete:
 *     summary: Delete an Amavasya event
 *     tags: [Amavasyas]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Event deleted
 */
router.delete("/:id", authenticateUser, controller.deleteAmavasya);

export default router;
