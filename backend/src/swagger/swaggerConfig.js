/**
 * Swagger Configuration
 */
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options = {
  definition: {
    openapi: "3.0.1",
    info: {
      title: "Sevak Management System",
      version: "1.0.0",
      description:
        "API documentation for Sevak Management System",
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT}/api/v1`,
        description: "Local API URL",
      },
      {
        url: `${process.env.SERVER_URL}/api/v1`,
        description: "Production API URL",
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        BearerAuth: [],
      },
    ],
    tags: [
      { name: "Auth", description: "Authentication APIs" },
      { name: "Users", description: "User Management" },
      { name: "Roles", description: "Role Management" },
      { name: "Permissions", description: "Permission APIs" },
      { name: "Activities", description: "Activity Management" },
      {
        name: "ActivityPermissions",
        description: "Activity Permission Management",
      },
      { name: "Locations", description: "Locations Management" },
      { name: "Amavasyas", description: "Amavasya Management" },
      { name: "AmavasyaUserLocations", description: "Amavasya User Location Management" },
    ],
  },
  apis: ["./src/routes/*.js", "./src/models/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);

const setupSwagger = (app) => {
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, { explorer: true })
  );
};

export default setupSwagger;
