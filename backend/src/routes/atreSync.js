import express from "express";
import { Booking } from "../models/Booking.js";

const router = express.Router();

function buildBookingPayload(booking) {
  return {
    externalBookingId: booking.externalBookingId,
    externalUserId: booking.externalUserId,
    source: booking.source,
    user: booking.user,
    itinerary: booking.itinerary,
    flight: booking.flight,
    hotel: booking.hotel,
    transport: booking.transport,
    meetings: booking.meetings,
    preferences: booking.preferences,
    payment: booking.payment,
    atreImport: booking.atreImport,
    disruptions: booking.disruptions,
    createdAt: booking.createdAt,
    updatedAt: booking.updatedAt
  };
}

router.post("/bookings/sync", async (req, res, next) => {
  try {
    const { email, phone } = req.body;

    if (!email && !phone) {
      return res.status(400).json({ message: "Email or phone is required" });
    }

    const filters = [];

    if (email) {
      filters.push({ "user.email": email });
    }

    if (phone) {
      filters.push({ "user.phone": phone });
    }

    const bookings = await Booking.find({ $or: filters }).sort({ createdAt: -1 });

    res.json({
      bookings: bookings.map(buildBookingPayload)
    });
  } catch (error) {
    next(error);
  }
});

export default router;
