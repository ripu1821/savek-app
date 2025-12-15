import mongoose from "mongoose";

const locationSchema = new mongoose.Schema({
   // uuid string
  name: { type: String, required: true },
  description: { type: String },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.models.Location || mongoose.model("Location", locationSchema);
