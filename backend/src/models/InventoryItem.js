import mongoose from "mongoose";

const inventoryItemSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["flight", "hotel", "transport"], required: true },
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, default: "", trim: true },
    details: { type: Object, default: {} },
    price: {
      amount: { type: Number, required: true },
      currency: { type: String, default: "USD" }
    },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const InventoryItem = mongoose.model("InventoryItem", inventoryItemSchema);
