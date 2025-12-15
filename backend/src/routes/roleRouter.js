// routes/role.routes.js
import express from "express";
import RoleController from "../controllers/role.controller.js";
import {
  createRoleSchema,
  updateRoleSchema,
  updateRoleStatusSchema,
} from "../schemas/role.schema.js";
import validateSchema from "../middlewares/validationMiddleware.js";
import { authenticateUser } from "../middlewares/authMiddleware.js";

const roleRouter = express.Router();

/**
 * @swagger
 * tags:
 *   name: Roles
 *   description: Role management APIs
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Role:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         description:
 *           type: string
 *           nullable: true
 *         isActive:
 *           type: boolean
 *         isSystemLogin:
 *           type: boolean
 *         createdBy:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         updatedBy:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         deletedBy:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         deletedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *       required:
 *         - name
 *       example:
 *         id: "2f0a3b19-182c-4a5d-92d7-role123abc"
 *         name: "Driver"
 *         description: "Handles all vehicles"
 *         isActive: true
 *         isSystemLogin: false
 *         createdBy: "a1b2c3d4-1234-5678-user0001"
 *         updatedBy: null
 *         deletedBy: null
 *         createdAt: "2025-11-10T10:00:00.000Z"
 *         updatedAt: "2025-11-10T10:00:00.000Z"
 *         deletedAt: null
 *
 *     CreateRole:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         isActive:
 *           type: boolean
 *         isSystemLogin:
 *           type: boolean
 *       required:
 *         - name
 *       example:
 *         name: "Driver"
 *         description: "Handles driving vehicles"
 *         isActive: true
 *         isSystemLogin: false
 *
 *     UpdateRole:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         isActive:
 *           type: boolean
 *         isSystemLogin:
 *           type: boolean
 *       example:
 *         name: "Senior Driver"
 *         description: "Handles heavy vehicles"
 *         isActive: true
 *         isSystemLogin: true
 *
 *     UpdateRoleStatus:
 *       type: object
 *       properties:
 *         isActive:
 *           type: boolean
 *       required:
 *         - isActive
 *       example:
 *         isActive: false
 */

/**
 * @swagger
 * /role:
 *   post:
 *     summary: Create a new role
 *     tags: [Roles]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/CreateRole"
 *     responses:
 *       201:
 *         description: Role created
 */
roleRouter.post(
  "/",
  authenticateUser,
  validateSchema(createRoleSchema),
  RoleController.createRole
);
/**
 * @swagger
 * /role:
 *   get:
 *     summary: Get list of roles (with filters & pagination)
 *     tags: [Roles]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         example: driver
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         example: true
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         example: 10
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         example: name
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *         example: ASC
 *     responses:
 *       200:
 *         description: List of roles
 */
roleRouter.get("/", authenticateUser, RoleController.getRoleList);

/**
 * @swagger
 * /role/{id}:
 *   get:
 *     summary: Get role by ID
 *     tags: [Roles]
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
 *         description: Role fetched
 */
roleRouter.get("/:id", authenticateUser, RoleController.getRoleById);

/**
 * @swagger
 * /role/{id}:
 *   put:
 *     summary: Update role
 *     tags: [Roles]
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
 *           schema:
 *             $ref: "#/components/schemas/UpdateRole"
 *     responses:
 *       200:
 *         description: Role updated
 */
roleRouter.put(
  "/:id",
  authenticateUser,
  validateSchema(updateRoleSchema),
  RoleController.updateRole
);

/**
 * @swagger
 * /role/{id}/status:
 *   patch:
 *     summary: Update role status
 *     tags: [Roles]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/UpdateRoleStatus"
 *     responses:
 *       200:
 *         description: Role status updated
 */
roleRouter.patch(
  "/:id/status",
  authenticateUser,
  validateSchema(updateRoleStatusSchema),
  RoleController.updateRoleStatus
);

/**
 * @swagger
 * /role/{id}:
 *   delete:
 *     summary: Soft-delete role (paranoid delete)
 *     tags: [Roles]
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
 *         description: Role deleted
 */
roleRouter.delete("/:id", authenticateUser, RoleController.deleteRole);

export default roleRouter;
