import express from "express";
import controller from "../controllers/amavasyaUserLocation.controller.js";
import { authenticateUser } from "../middlewares/authMiddleware.js";
import validateSchema from "../middlewares/validationMiddleware.js";
import {
  createAULSchema,
  updateAULSchema,
} from "../schemas/amavasyaUserLocation.schema.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: AmavasyaUserLocations
 *   description: Mapping of Amavasya, User & Location
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     AmavasyaUserLocation:
 *       type: object
 *       properties:
 *         amavasyaId:
 *           type: string
 *         userId:
 *           type: string
 *         locationId:
 *           type: string
 *         note:
 *           type: string
 *         isActive:
 *           type: boolean
 */

/**
 * @swagger
 * /amavasyaUserLocation:
 *   post:
 *     summary: Create a new amavasyaUserLocation mapping
 *     tags: [AmavasyaUserLocations]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/AmavasyaUserLocation"
 *     responses:
 *       201:
 *         description: Mapping created successfully
 */
router.post(
  "/",
  authenticateUser,
  validateSchema(createAULSchema),
  controller.createAUL
);

/**
 * @swagger
 * /amavasyaUserLocation:
 *   get:
 *     summary: Get all mappings (with populated data)
 *     tags: [AmavasyaUserLocations]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List retrieved
 */
router.get("/", authenticateUser, controller.getAllAUL);

/**
 * @swagger
 * /amavasyaUserLocation/userWise:
 *   get:
 *     summary: Get user-wise amavasya list (1 user = 1 row)
 *     tags: [AmavasyaUserLocations]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User-wise list retrieved
 */
router.get("/userWise", authenticateUser, controller.getUserWiseAULList);

/**
 * @swagger
 * /amavasyaUserLocation/{id}:
 *   get:
 *     summary: Get mapping by ID
 *     tags: [AmavasyaUserLocations]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *     responses:
 *       200:
 *         description: Single record fetched
 */
router.get("/:id", authenticateUser, controller.getAULById);

/**
 * @swagger
 * /amavasyaUserLocation/{id}:
 *   put:
 *     summary: Update a mapping record
 *     tags: [AmavasyaUserLocations]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/AmavasyaUserLocation"
 *     responses:
 *       200:
 *         description: Mapping updated
 */
router.put(
  "/:id",
  authenticateUser,
  validateSchema(updateAULSchema),
  controller.updateAUL
);

/**
 * @swagger
 * /amavasyaUserLocation/{id}:
 *   delete:
 *     summary: Soft-delete a mapping
 *     tags: [AmavasyaUserLocations]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *     responses:
 *       200:
 *         description: Mapping deleted
 */
router.delete("/:id", authenticateUser, controller.deleteAUL);

/**
 * @swagger
 * /amavasyaUserLocation/userAttendance/{userId}:
 *   get:
 *     summary: Get user amavasya attendance (Present / Absent)
 *     tags: [AmavasyaUserLocations]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User attendance list retrieved
 */
router.get(
  "/userAttendance/:userId",
  authenticateUser,
  controller.getUserAmavasyaAttendance
);

/**
 * @swagger
 * /amavasyaUserLocation/dashboard/userAttendanceCount:
 *   get:
 *     summary: Get users sorted by total amavasya attendance
 *     tags: [AmavasyaUserLocations]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User attendance ranking list
 */
router.get(
  "/dashboard/userAttendanceCount",
  authenticateUser,
  controller.getUserAttendanceCountList
);

/**
 * @swagger
 * /amavasyaUserLocation/bulk:
 *   post:
 *     summary: Bulk assign users to same amavasya (skip existing users)
 *     tags: [AmavasyaUserLocations]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amavasyaId
 *               - userIds
 *               - locationId
 *             properties:
 *               amavasyaId:
 *                 type: string
 *               userIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               locationId:
 *                 type: string
 *               note:
 *                 type: string
 *     responses:
 *       201:
 *         description: Users assigned successfully
 */
router.post("/bulk", authenticateUser, controller.createBulkAUL);

export default router;
