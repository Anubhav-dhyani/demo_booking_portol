import express from "express";
import { requireAdmin } from "../middleware/auth.js";
import { Booking } from "../models/Booking.js";
import { postToAtre } from "../services/atreClient.js";

const router = express.Router();

function getDisruptionPath(type) {
  return type === "flight-delay"
    ? "/api/disruptions/flight-delay"
    : "/api/disruptions/flight-cancellation";
}

async function sendDisruption(req, res, next, type) {
  try {
    const { bookingId, delayMinutes, reason } = req.body;
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (!booking.flight?.flightNumber) {
      return res.status(400).json({ message: "This booking does not include a flight" });
    }

    const payload = {
      externalBookingId: booking.externalBookingId,
      externalUserId: booking.externalUserId,
      flightNumber: booking.flight.flightNumber,
      reason,
      source: "demo-booking-portal"
    };

    if (type === "flight-delay") {
      payload.delayMinutes = Number(delayMinutes);
    }

    let status = "sent";
    let response = null;
    let errorMessage = null;

    try {
      response = await postToAtre(getDisruptionPath(type), payload);
    } catch (error) {
      status = "failed";
      response = error.response || null;
      errorMessage = error.message;
    }

    booking.disruptions.push({
      type,
      payload,
      status,
      response,
      error: errorMessage,
      sentAt: new Date()
    });

    await booking.save();

    res.json({
      message: status === "sent" ? "Disruption sent to ATRE recovery engine." : "Disruption saved but ATRE rejected the request.",
      status,
      payload,
      response,
      error: errorMessage
    });
  } catch (error) {
    next(error);
  }
}

router.post("/flight-delay", requireAdmin, (req, res, next) => sendDisruption(req, res, next, "flight-delay"));
router.post("/flight-cancellation", requireAdmin, (req, res, next) => sendDisruption(req, res, next, "flight-cancellation"));

export default router;
