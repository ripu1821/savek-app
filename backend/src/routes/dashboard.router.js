import express from "express";
import { authenticateUser } from "../middlewares/authMiddleware.js";
import dashboardController from "../controllers/dashboard.controller.js";

const dashboardRouter = express.Router();

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Dashboard APIs (counts & analytics)
 */

/**
 * @swagger
 * /dashboard/counts:
 *   get:
 *     summary: Get all dashboard counts
 *     tags: [Dashboard]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard counts fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: integer
 *                   example: 120
 *                 roles:
 *                   type: integer
 *                   example: 5
 *                 locations:
 *                   type: integer
 *                   example: 30
 *                 permissions:
 *                   type: integer
 *                   example: 45
 *                 amavasya:
 *                   type: integer
 *                   example: 12
 *                 amavasyaUserLocations:
 *                   type: integer
 *                   example: 340
 */
dashboardRouter.get(
  "/counts",
  authenticateUser,
  dashboardController.getDashboardCounts
);

/**
 * @swagger
 * /dashboard/user-attendance:
 *   get:
 *     summary: Get user attendance count list (highest first)
 *     tags: [Dashboard]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User attendance ranking fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       userId:
 *                         type: string
 *                       userName:
 *                         type: string
 *                       email:
 *                         type: string
 *                       totalAttendance:
 *                         type: integer
 *                 totalUsers:
 *                   type: integer
 */
dashboardRouter.get(
  "/userAttendance",
  authenticateUser,
  dashboardController.getUserAttendanceCountList
);

/**
 * @swagger
 * /dashboard/amavasya:
 *   get:
 *     summary: Get Amavasya list (last, current & next month)
 *     tags: [Dashboard]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Amavasya list fetched successfully
 */
dashboardRouter.get(
  "/amavasya",
  authenticateUser,
  dashboardController.getAllAmavasya
);

export default dashboardRouter;
