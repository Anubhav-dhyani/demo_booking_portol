import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    externalBookingId: { type: String, required: true, unique: true },
    externalUserId: { type: String, required: true },
    ownerUserId: { type: String, required: true },
    createdByRole: { type: String, enum: ["user", "admin"], default: "user" },
    source: { type: String, default: "demo-travel-platform" },
    user: { type: Object, required: true },
    itinerary: { type: Object, required: true },
    flight: { type: Object, required: true },
    hotel: { type: Object, required: true },
    transport: { type: Object, required: true },
    meetings: { type: Array, default: [] },
    preferences: { type: Object, required: true },
    payment: { type: Object, required: true },
    atreImport: {
      status: { type: String, enum: ["pending", "sent", "failed"], default: "pending" },
      response: { type: Object, default: null },
      error: { type: String, default: null },
      sentAt: { type: Date, default: null }
    },
    disruptions: [
      {
        type: { type: String, enum: ["flight-delay", "flight-cancellation"], required: true },
        payload: { type: Object, required: true },
        status: { type: String, enum: ["sent", "failed"], required: true },
        response: { type: Object, default: null },
        error: { type: String, default: null },
        sentAt: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

export const Booking = mongoose.model("Booking", bookingSchema);
