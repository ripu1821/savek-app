import mongoose from "mongoose";

const permissionSchema = new mongoose.Schema({
  
  name: { type: String, required: true },
  description: { type: String },
  status: { type: String, default: "Active" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.models.Permission || mongoose.model("Permission", permissionSchema);
