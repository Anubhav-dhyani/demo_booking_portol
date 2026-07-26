import mongoose from "mongoose";

const providerSettingSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["flight", "hotel", "transport"], required: true, unique: true },
    mode: { type: String, default: "manual" },
    useProvider: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const ProviderSetting = mongoose.model("ProviderSetting", providerSettingSchema);
