/**
 * Index routes
 */

import authRouter from "./authRoutes.js";
import express from "express";
import roleRouter from "./roleRouter.js";
import userRouter from "./userRouter.js";
import permissionRouter from "./permissionRouter.js";
import activityRouter from "./activityRouter.js";
import activityPermissionRouter from "./activityPermissionRouter.js";
import locationRouter from "./location.routes.js";
import amavasyaRouter from "./amavasya.routes.js";
import amavasyaUserLocationRouter from "./amavasyaUserLocation.routes.js";
import dashboardRouter from "./dashboard.router.js";

const router = express.Router();

router.use("/auth", authRouter);
router.use("/role", roleRouter);

router.use("/permission", permissionRouter);

router.use("/user", userRouter);
router.use("/activity", activityRouter);
router.use("/activityPermission", activityPermissionRouter);
router.use("/location", locationRouter);
router.use("/amavasya", amavasyaRouter);
router.use("/amavasyaUserLocation", amavasyaUserLocationRouter);
router.use("/dashboard", dashboardRouter);
export default router;
