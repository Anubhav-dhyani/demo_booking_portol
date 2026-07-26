import express from "express";
import { Booking } from "../models/Booking.js";
import { InventoryItem } from "../models/InventoryItem.js";
import { sendTravelerEmail } from "../services/emailClient.js";
import { buildAtreBookingPayload } from "../utils/atrePayload.js";

const router = express.Router();

function normalizeInventoryItem(item) {
  return {
    id: String(item._id),
    type: item.type,
    title: item.title,
    subtitle: item.subtitle,
    details: item.details,
    price: item.price,
    source: "demo-booking-portal"
  };
}

function escapeRegex(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildUpdatedBooking(booking, selectedPlan = {}) {
  const updated = {};

  if (selectedPlan.flight) {
    updated.flight = { ...booking.flight, ...selectedPlan.flight, status: "booked" };
  }

  if (selectedPlan.hotel) {
    updated.hotel = { ...booking.hotel, ...selectedPlan.hotel, status: "booked" };
  }

  if (selectedPlan.transport) {
    updated.transport = { ...booking.transport, ...selectedPlan.transport, status: "booked" };
  }

  if (selectedPlan.taxi) {
    updated.transport = { ...booking.transport, ...selectedPlan.taxi, status: "booked" };
  }

  return updated;
}

function addMinutes(value, minutes) {
  const base = value ? new Date(value) : new Date();
  return new Date(base.getTime() + minutes * 60 * 1000).toISOString();
}

function pendingCode(prefix) {
  return `${prefix}${Math.floor(100000 + Math.random() * 900000)}`;
}

function buildRecoveryOption({ id, title, summary, flight, hotel, transport, fareDifference, friction }) {
  const flightDetails = flight?.details || flight || {};
  const hotelDetails = hotel?.details || hotel || {};
  const transportDetails = transport?.details || transport || {};
  const arrivalTime = flightDetails.arrivalTime;

  return {
    id,
    title,
    summary,
    flight: {
      flightNumber: flightDetails.flightNumber,
      airline: flightDetails.airline || flight?.title || "Demo Recovery Air",
      origin: flightDetails.origin,
      destination: flightDetails.destination,
      departureTime: flightDetails.departureTime,
      arrivalTime,
      cabin: flightDetails.cabin || (id === "option_fastest" ? "Business" : "Economy"),
      seat: id === "option_fastest" ? "10A" : null,
      confirmationCode: "PENDING",
      fareDifference
    },
    hotel: {
      status: "pending",
      hotelName: hotelDetails.hotelName || hotelDetails.name || hotel?.title,
      note: "Late check-in available"
    },
    transport: {
      status: "pending",
      provider: transportDetails.provider || transportDetails.transportType || transportDetails.type || transport?.title || "Taxi Provider",
      pickupTime: arrivalTime ? addMinutes(arrivalTime, 30) : transportDetails.pickupTime
    },
    totalCostDelta: fareDifference,
    customerFriction: friction
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
      bookings: bookings.map(buildAtreBookingPayload)
    });
  } catch (error) {
    next(error);
  }
});

router.post("/recovery-options", async (req, res, next) => {
  try {
    const { externalBookingId, externalUserId, flightNumber, booking, disruptedTrip, tripProfile } = req.body;
    const storedBooking = externalBookingId
      ? await Booking.findOne({ externalBookingId, ...(externalUserId ? { externalUserId } : {}) })
      : null;
    const baseBooking = storedBooking || booking || disruptedTrip || req.body || {};
    const itinerary = baseBooking.itinerary || {};
    const flightFilter = { type: "flight", active: true };
    const hotelFilter = { type: "hotel", active: true };
    const transportFilter = { type: "transport", active: true };

    if (baseBooking.flight?.origin || req.body.flight?.origin || itinerary.origin) {
      flightFilter["details.origin"] = new RegExp(`^${escapeRegex(baseBooking.flight?.origin || req.body.flight?.origin || itinerary.origin)}$`, "i");
    }

    if (baseBooking.flight?.destination || req.body.flight?.destination || itinerary.destination) {
      flightFilter["details.destination"] = new RegExp(`^${escapeRegex(baseBooking.flight?.destination || req.body.flight?.destination || itinerary.destination)}$`, "i");
    }

    if (itinerary.destination) {
      hotelFilter.$or = [
        { "details.city": new RegExp(escapeRegex(itinerary.destination), "i") },
        { title: new RegExp(escapeRegex(itinerary.destination), "i") },
        { subtitle: new RegExp(escapeRegex(itinerary.destination), "i") }
      ];
      transportFilter.$or = [
        { "details.dropoffLocation": new RegExp(escapeRegex(itinerary.destination), "i") },
        { "details.pickupLocation": new RegExp(escapeRegex(itinerary.destination), "i") }
      ];
    }

    const [flights, hotels, transports] = await Promise.all([
      InventoryItem.find(flightFilter).limit(10),
      InventoryItem.find(hotelFilter).limit(10),
      InventoryItem.find(transportFilter).limit(10)
    ]);

    const normalizedFlights = flights.map(normalizeInventoryItem).filter((flight) => flight.details?.flightNumber !== (flightNumber || baseBooking.flight?.flightNumber));
    const normalizedHotels = hotels.map(normalizeInventoryItem);
    const normalizedTransports = transports.map(normalizeInventoryItem);
    const originalFlight = baseBooking.flight || req.body.flight || {};
    const fastestFlight = normalizedFlights[0] || {
      details: {
        flightNumber: `${originalFlight.flightNumber || "IFG"}90`,
        airline: originalFlight.airline || "Demo Recovery Air",
        origin: originalFlight.origin,
        destination: originalFlight.destination,
        departureTime: addMinutes(originalFlight.departureTime, 180),
        arrivalTime: addMinutes(originalFlight.arrivalTime, 180),
        cabin: originalFlight.cabin || "Business"
      }
    };
    const cheapestFlight = normalizedFlights[1] || {
      details: {
        ...fastestFlight.details,
        flightNumber: `${originalFlight.flightNumber || "IFG"}91`,
        departureTime: addMinutes(originalFlight.departureTime, 480),
        arrivalTime: addMinutes(originalFlight.arrivalTime, 480),
        cabin: "Economy"
      }
    };

    res.json({
      options: [
        buildRecoveryOption({
          id: "option_fastest",
          title: "Fastest available recovery",
          summary: "Arrives before the traveler deadline.",
          flight: fastestFlight,
          hotel: normalizedHotels[0] || baseBooking.hotel,
          transport: normalizedTransports[0] || baseBooking.transport,
          fareDifference: 250,
          friction: "low"
        }),
        buildRecoveryOption({
          id: "option_cheapest",
          title: "Lowest cost recovery",
          summary: "Lower fare difference, later arrival.",
          flight: cheapestFlight,
          hotel: normalizedHotels[0] || baseBooking.hotel,
          transport: normalizedTransports[0] || baseBooking.transport,
          fareDifference: 40,
          friction: "medium"
        })
      ]
    });
  } catch (error) {
    next(error);
  }
});

router.post("/recovery/confirm", async (req, res, next) => {
  try {
    const { externalBookingId, externalUserId, originalFlightNumber, selectedPlan } = req.body;

    if (!externalBookingId) {
      return res.status(400).json({ message: "externalBookingId is required" });
    }

    const booking = await Booking.findOne({ externalBookingId, ...(externalUserId ? { externalUserId } : {}) });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const confirmedPlan = { ...(selectedPlan || {}) };
    const flightCode = confirmedPlan.flight?.confirmationCode && confirmedPlan.flight.confirmationCode !== "PENDING"
      ? confirmedPlan.flight.confirmationCode
      : pendingCode("NEW");
    const taxiCode = confirmedPlan.transport?.confirmationCode && confirmedPlan.transport.confirmationCode !== "PENDING"
      ? confirmedPlan.transport.confirmationCode
      : pendingCode("TAXI");

    if (confirmedPlan.flight) {
      confirmedPlan.flight = { ...confirmedPlan.flight, confirmationCode: flightCode };
    }

    if (confirmedPlan.transport) {
      confirmedPlan.transport = { ...confirmedPlan.transport, confirmationCode: taxiCode };
    }

    const updates = buildUpdatedBooking(booking, confirmedPlan);
    if (booking.flight) {
      booking.flight = {
        ...booking.flight,
        status: "replaced",
        originalFlightNumber: originalFlightNumber || booking.flight.flightNumber,
        replacedByFlightNumber: selectedPlan?.flight?.flightNumber
      };
    }
    Object.assign(booking, updates);
    booking.recoveryConfirmation = {
      selectedPlan: confirmedPlan,
      confirmedAt: new Date(),
      source: "atre"
    };
    await booking.save();

    res.json({
      flight: updates.flight
        ? {
            status: "confirmed",
            provider: "demo-booking-portal",
            updatedFlight: {
              ...updates.flight,
              confirmationCode: flightCode
            },
            bookingReference: flightCode
          }
        : null,
      hotel: {
        status: "confirmed",
        hotelName: updates.hotel?.hotelName || updates.hotel?.name || booking.hotel?.hotelName || booking.hotel?.name,
        note: "Late check-in confirmed"
      },
      transport: {
        status: "confirmed",
        provider: updates.transport?.provider || updates.transport?.type || booking.transport?.provider || booking.transport?.type || "Taxi Provider",
        pickupTime: updates.transport?.pickupTime || booking.transport?.pickupTime,
        confirmationCode: taxiCode
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post("/notifications/email", async (req, res, next) => {
  try {
    const { to, title, message, actionUrl } = req.body;

    if (!to || !title || !message) {
      return res.status(400).json({ message: "to, title, and message are required" });
    }

    const result = await sendTravelerEmail({ to, title, message, actionUrl });

    res.json({
      status: "sent",
      messageId: result.messageId,
      accepted: result.accepted,
      rejected: result.rejected
    });
  } catch (error) {
    next(error);
  }
});

export default router;
