// routes/location.router.js
import express from "express";
import locationController from "../controllers/location.controller.js";
import { authenticateUser } from "../middlewares/authMiddleware.js";
import validateSchema from "../middlewares/validationMiddleware.js";
import {
  createLocationSchema,
  updateLocationSchema,
  queryLocationSchema,
} from "../schemas/location.schema.js";

const locationRouter = express.Router();

/**
 * @swagger
 * tags:
 *   name: Locations
 *   description: Location / Booking management APIs
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Location:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         address:
 *           type: string
 *         district:
 *           type: string
 *         state:
 *           type: string
 *         vehicleId:
 *           type: string
 *           format: uuid
 *         clientId:
 *           type: string
 *           format: uuid
 *         locationType:
 *           type: string
 *           nullable: false
 *           enum: [LOADING, UNLOADING]
 *         estimatedCost:
 *           type: number
 *           format: float
 *         advancePaid:
 *           type: number
 *           format: float
 *         paymentStatus:
 *           type: string
 *           enum: [UNPAID, PARTIAL, PAID]
 *         status:
 *           type: string
 *           enum: [PENDING, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED]
 *         startDate:
 *           type: string
 *           format: date-time
 *         endDate:
 *           type: string
 *           format: date-time
 *         isActive:
 *           type: boolean
 *       required:
 *         - vehicleId
 *         - clientId
 *         - startDate
 *         - endDate
 */

/**
 * @swagger
 * /location:
 *   post:
 *     summary: Create a new location/booking
 *     tags: [Locations]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             address: "Ram Nagar"
 *             district: "Jaipur"
 *             state: "Rajasthan"
 *             vehicleId: "b1b28f5c-1234-4551-a991-d8ca09e1db44"
 *             clientId: "6a5e1b2d-7812-44ff-9c50-52cd4e9ad244"
 *             locationType: UNLOADING
 *             estimatedCost: 1500
 *             advancePaid: 500
 *             paymentStatus: "UNPAID"
 *             status: "PENDING"
 *             startDate: "2025-02-15T10:00:00.000Z"
 *             endDate: "2025-02-15T18:00:00.000Z"
 *           schema:
 *             $ref: '#/components/schemas/Location'
 *     responses:
 *       201:
 *         description: Location created
 */
locationRouter.post(
  "/",
  authenticateUser,
  validateSchema(createLocationSchema),
  locationController.createLocation
);

/**
 * @swagger
 * /location:
 *   get:
 *     summary: Get list of locations/bookings (with filters, search & pagination)
 *     tags: [Locations]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: vehicleId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: clientId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: driverId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: locationType
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDateFrom
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: startDateTo
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: clientName
 *         schema:
 *           type: string
 *       - in: query
 *         name: clientMobile
 *         schema:
 *           type: string
 *       - in: query
 *         name: driverName
 *         schema:
 *           type: string
 *       - in: query
 *         name: driverMobile
 *         schema:
 *           type: string
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of filtered locations
 */
locationRouter.get(
  "/",
  authenticateUser,
  validateSchema(queryLocationSchema),
  locationController.listLocations
);

/**
 * @swagger
 * /location/{id}:
 *   get:
 *     summary: Get location details by ID
 *     tags: [Locations]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Location fetched successfully
 */
locationRouter.get(
  "/:id",
  authenticateUser,
  locationController.getLocationById
);

/**
 * @swagger
 * /location/{id}:
 *   put:
 *     summary: Update location/booking
 *     tags: [Locations]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             district: "Updated District"
 *             status: "CONFIRMED"
 *             estimatedCost: 2000
 *           schema:
 *             $ref: '#/components/schemas/Location'
 *     responses:
 *       200:
 *         description: Location updated
 */
locationRouter.put(
  "/:id",
  authenticateUser,
  validateSchema(updateLocationSchema),
  locationController.updateLocation
);

/**
 * @swagger
 * /location/{id}:
 *   delete:
 *     summary: Soft-delete a location/booking
 *     tags: [Locations]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Location deleted
 */
locationRouter.delete(
  "/:id",
  authenticateUser,
  locationController.deleteLocation
);

export default locationRouter;
