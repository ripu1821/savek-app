import { connectDB, runSeeders } from "./config/db.js";
import logger from "./utils/logger.js";
import { httpServer } from "./app.js";

const PORT = process.env.PORT || 9000;

async function start() {
  try {
    await connectDB();
    // await runSeeders();
    httpServer.listen(PORT, () => {
      logger.info(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    logger.error("❌ Error starting app: " + err.message);
    process.exit(1);
  }
}

start();
