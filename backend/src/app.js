/**
 * Application Entry Point
 */

import "dotenv/config";

import express from "express";
import cors from "cors";
import { createServer } from "node:http";
import routes from "./routes/index.js";
import setupSwagger from "./swagger/swaggerConfig.js";
import { morganMiddleware } from "./middlewares/morganMiddleware.js";
import { globalErrorHandler } from "./middlewares/globalErrorHandler.js";

const app = express();

// for websocket
const httpServer = createServer(app);
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);
// Middleware to parse incoming JSON requests
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));

app.use(morganMiddleware);

//routes
app.use("/api/v1", routes);

//swagger
setupSwagger(app);

// Error handling middleware
app.use(globalErrorHandler);

export { app, httpServer };
