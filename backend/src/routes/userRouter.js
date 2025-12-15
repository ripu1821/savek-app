import express from "express";
import userController from "../controllers/user.controller.js";
import { authenticateUser } from "../middlewares/authMiddleware.js";
import { createUserSchema, queryUserSchema, updateUserSchema } from "../schemas/user.schema.js";
import validateSchema from "../middlewares/validationMiddleware.js";

const userRouter = express.Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management APIs
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         userName:
 *           type: string
 *         email:
 *           type: string
 *         mobileNumber:
 *           type: string
 *         password:
 *           type: string
 *         roleId:
 *           type: string
 *           format: uuid
 *         refreshToken:
 *           type: string
 *         isActive:
 *           type: boolean
 */

/**
 * @swagger
 * /user:
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: "#/components/schemas/User" }
 *     responses:
 *       201:
 *         description: User created
 */
userRouter.post(
  "/",
  authenticateUser,
  validateSchema(createUserSchema),
  userController.createUser
);

/**
 * @swagger
 * /user:
 *   get:
 *     summary: Get list of users (with filters)
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userName
 *         schema:
 *           type: string
 *         description: partial match on userName
 *       - in: query
 *         name: roleId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: exact role id filter
 *       - in: query
 *         name: roleName
 *         schema:
 *           type: string
 *         description: partial match on role name
 *       - in: query
 *         name: mobileNumber
 *         schema:
 *           type: string
 *         description: partial match on mobile number
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *         description: partial match on email
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: generic search across userName, email, mobileNumber
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
 *         description: List of users
 */
userRouter.get(
  "/",
  // authenticateUser,
  validateSchema(queryUserSchema),
  userController.getUsers
);


/**
 * @swagger
 * /user/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: User fetched
 */
userRouter.get("/:id", authenticateUser, userController.getUserById);

/**
 * @swagger
 * /user/{id}:
 *   put:
 *     summary: Update user
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: "#/components/schemas/User" }
 *     responses:
 *       200:
 *         description: User updated
 */
userRouter.put(
  "/:id",
  authenticateUser,
  validateSchema(updateUserSchema),
  userController.updateUser
);

/**
 * @swagger
 * /user/{id}:
 *   delete:
 *     summary: Delete user
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: User deleted
 */
userRouter.delete("/:id", authenticateUser, userController.deleteUser);

export default userRouter;
