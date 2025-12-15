// src/config/db.js
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";
import { createRequire } from "module";
import dotenv from "dotenv";

dotenv.config();

const { MONGO_URL, NODE_ENV } = process.env;

if (!MONGO_URL) {
  throw new Error("MONGO_URL environment variable is required");
}

mongoose.set("strictQuery", false);

/**
 * Connect to MongoDB using mongoose
 */
export async function connectDB() {
  try {
    const opts = {
      // configure pool sizes if needed (Mongoose 6+)
      serverSelectionTimeoutMS: 30000,
      // maxPoolSize: 10,
    };

    await mongoose.connect(MONGO_URL, opts);
    if (NODE_ENV !== "production") {
      console.log("✅ MongoDB connected");
    }
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    throw err;
  }
}

/**
 * Run seeders located at src/seeders/*.js | *.mjs | *.cjs
 * - .cjs => loaded with require()
 * - .js/.mjs => loaded with dynamic import()
 *
 * Seeder export shapes supported:
 *  - module.exports.up = async () => {}
 *  - export async function up() {}
 *  - export default { up: async () => {} }
 *  - export default async function() {}  (treated as default function)
 */
export async function runSeeders() {
  const seedersDir = path.join(process.cwd(), "src", "seeders");
  if (!fs.existsSync(seedersDir)) {
    if (NODE_ENV !== "production") console.log("No seeders directory found, skipping seeding.");
    return;
  }

  const files = fs
    .readdirSync(seedersDir)
    .filter((f) => f.endsWith(".js") || f.endsWith(".mjs") || f.endsWith(".cjs"))
    .sort();

  for (const file of files) {
    const seederPath = path.join(seedersDir, file);
    try {
      let mod;

      if (file.endsWith(".cjs")) {
        // load CommonJS seeder using require
        const require = createRequire(pathToFileURL(seederPath).href);
        mod = require(seederPath);
      } else {
        // load ESM seeder using dynamic import
        const fileUrl = pathToFileURL(seederPath).href;
        mod = await import(fileUrl);
      }

      // Normalize supported shapes:
      //  - module.exports.up = async () => {}
      //  - export async function up() {}
      //  - export default { up: async () => {} }
      //  - export default async function() {}
      const seederUp =
        (mod && (mod.up || (mod.default && mod.default.up))) ||
        (mod && typeof mod.default === "function" ? mod.default : null) ||
        (typeof mod === "function" ? mod : null);

      if (typeof seederUp === "function") {
        console.log(`Running seeder: ${file}`);
        // pass mongoose object in case seeders expect context
        await seederUp({ mongoose });
      } else {
        console.warn(`Seeder ${file} does not export an 'up' async function — skipping`);
      }
    } catch (err) {
      console.error(`Error running seeder ${file}:`, err);
      // rethrow to fail startup (you can change this behavior if you prefer)
      throw err;
    }
  }
}

/**
 * Close connection (for tests / graceful shutdown)
 */
export async function closeDB() {
  await mongoose.disconnect();
  if (NODE_ENV !== "production") console.log("MongoDB disconnected");
}

export default mongoose;
