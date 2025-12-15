import mongoose from "mongoose";

const amavasyaUserLocationSchema = new mongoose.Schema(
  {
    amavasyaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Amavasya",
      required: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
      required: true,
    },

    note: {
      type: String,
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.AmavasyaUserLocation ||
  mongoose.model("AmavasyaUserLocation", amavasyaUserLocationSchema);
