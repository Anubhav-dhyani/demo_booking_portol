import express from "express";
import { Booking } from "../models/Booking.js";
import { postToAtre } from "../services/atreClient.js";

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
    payment: booking.payment
  };
}

router.get("/", async (_req, res, next) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.json(booking);
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const booking = await Booking.create({
      ...req.body,
      source: "demo-travel-platform",
      atreImport: { status: "pending" }
    });

    const payload = buildBookingPayload(booking);

    try {
      const atreResponse = await postToAtre("/api/import-booking", payload);
      booking.atreImport = {
        status: "sent",
        response: atreResponse,
        error: null,
        sentAt: new Date()
      };
    } catch (error) {
      booking.atreImport = {
        status: "failed",
        response: error.response || null,
        error: error.message,
        sentAt: new Date()
      };
    }

    await booking.save();
    res.status(201).json(booking);
  } catch (error) {
    next(error);
  }
});

export default router;
