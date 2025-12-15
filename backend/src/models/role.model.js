import mongoose from "mongoose";

const roleSchema = new mongoose.Schema({
  
  name: { type: String, required: true },
  description: { type: String },
  isActive: { type: Boolean, default: true },
  isSystemLogin: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.models.Role || mongoose.model("Role", roleSchema);
