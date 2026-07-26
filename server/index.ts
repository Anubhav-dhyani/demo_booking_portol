import express from "express";
import { flights, hotels, transports } from "./catalog";
import { getBooking, listBookings, saveBooking } from "./store";
import type {
  BookingPayload,
  CreateBookingRequest,
  DisruptionCancellationRequest,
  DisruptionDelayRequest,
  StoredBooking
} from "../shared/types";

const app = express();
const port = Number(process.env.PORT ?? 3001);
const atreApiUrl = process.env.ATRE_API_URL ?? "http://localhost:4000";

app.use(express.json());

function buildUrl(path: string) {
  return `${atreApiUrl.replace(/\/$/, "")}${path}`;
}

async function postToAtre(path: string, payload: unknown) {
  const response = await fetch(buildUrl(path), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const text = await response.text();
  const data = text ? safeJson(text) : null;

  if (!response.ok) {
    throw new Error(`ATRE returned ${response.status}: ${text || response.statusText}`);
  }

  return data;
}

function safeJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function createId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function buildBooking(request: CreateBookingRequest): BookingPayload {
  const flight = flights.find((item) => item.id === request.flightId) ?? flights[0];
  const hotel = hotels.find((item) => item.id === request.hotelId) ?? hotels[0];
  const transport = transports.find((item) => item.id === request.transportId) ?? transports[0];

  return {
    externalBookingId: createId("bk"),
    externalUserId: createId("user"),
    source: "demo-travel-platform",
    user: {
      name: request.search.name,
      email: request.search.email,
      phone: request.search.phone
    },
    itinerary: {
      origin: request.search.origin,
      destination: request.search.destination,
      departureDate: request.search.departureDate,
      tripPurpose: request.search.tripPurpose
    },
    flight: {
      airline: flight.airline,
      flightNumber: flight.flightNumber,
      origin: request.search.origin,
      destination: request.search.destination,
      departureTime: flight.departureTime,
      arrivalTime: flight.arrivalTime,
      cabin: flight.cabin,
      confirmationCode: flight.confirmationCode,
      status: "booked",
      price: flight.price
    },
    hotel: {
      hotelName: hotel.hotelName,
      city: hotel.city,
      checkIn: request.search.departureDate,
      checkOut: request.search.returnDate,
      confirmationCode: hotel.confirmationCode,
      status: "booked",
      price: hotel.price
    },
    transport: {
      type: transport.type,
      pickupLocation: request.search.destination,
      dropoffLocation: hotel.hotelName,
      pickupTime: transport.pickupTime,
      confirmationCode: transport.confirmationCode,
      status: "booked",
      price: transport.price
    },
    meetings: [
      {
        title: "Client strategy meeting",
        location: "Downtown San Francisco",
        startTime: "2026-08-16T09:00:00-07:00",
        endTime: "2026-08-16T10:00:00-07:00"
      }
    ],
    preferences: {
      preferredCabin: flight.cabin,
      maxDelayMinutes: 120,
      preferSameAirline: false,
      allowHotelChanges: true,
      allowTransportChanges: true
    },
    payment: request.payment
  };
}

app.get("/api/health", (_request, response) => {
  response.json({ ok: true, atreApiUrl });
});

app.get("/api/catalog", (_request, response) => {
  response.json({ flights, hotels, transports });
});

app.get("/api/bookings", async (_request, response, next) => {
  try {
    response.json(await listBookings());
  } catch (error) {
    next(error);
  }
});

app.get("/api/bookings/:externalBookingId", async (request, response, next) => {
  try {
    const booking = await getBooking(request.params.externalBookingId);
    if (!booking) {
      response.status(404).json({ message: "Booking not found" });
      return;
    }
    response.json(booking);
  } catch (error) {
    next(error);
  }
});

app.post("/api/bookings", async (request, response, next) => {
  try {
    const bookingPayload = buildBooking(request.body as CreateBookingRequest);
    let storedBooking: StoredBooking;

    try {
      const atreImportResponse = await postToAtre("/api/import-booking", bookingPayload);
      storedBooking = {
        ...bookingPayload,
        createdAt: new Date().toISOString(),
        atreImportStatus: "sent",
        atreImportResponse
      };
    } catch (error) {
      storedBooking = {
        ...bookingPayload,
        createdAt: new Date().toISOString(),
        atreImportStatus: "failed",
        atreImportError: error instanceof Error ? error.message : "Unknown ATRE import error"
      };
    }

    await saveBooking(storedBooking);
    response.status(201).json(storedBooking);
  } catch (error) {
    next(error);
  }
});

app.post("/api/admin/disruptions/flight-delay", async (request, response, next) => {
  try {
    const body = request.body as DisruptionDelayRequest;
    const booking = await getBooking(body.externalBookingId);
    if (!booking) {
      response.status(404).json({ message: "Booking not found" });
      return;
    }

    const payload = {
      externalBookingId: booking.externalBookingId,
      externalUserId: booking.externalUserId,
      flightNumber: booking.flight.flightNumber,
      delayMinutes: Number(body.delayMinutes),
      reason: body.reason,
      source: "demo-travel-platform-admin"
    };
    const atreResponse = await postToAtre("/api/disruptions/flight-delay", payload);

    response.json({
      sent: true,
      message: "Disruption sent to ATRE recovery engine.",
      atreResponse
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/admin/disruptions/flight-cancellation", async (request, response, next) => {
  try {
    const body = request.body as DisruptionCancellationRequest;
    const booking = await getBooking(body.externalBookingId);
    if (!booking) {
      response.status(404).json({ message: "Booking not found" });
      return;
    }

    const payload = {
      externalBookingId: booking.externalBookingId,
      externalUserId: booking.externalUserId,
      flightNumber: booking.flight.flightNumber,
      reason: body.reason,
      source: "demo-travel-platform-admin"
    };
    const atreResponse = await postToAtre("/api/disruptions/flight-cancellation", payload);

    response.json({
      sent: true,
      message: "Disruption sent to ATRE recovery engine.",
      atreResponse
    });
  } catch (error) {
    next(error);
  }
});

app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  const message = error instanceof Error ? error.message : "Unexpected server error";
  response.status(500).json({ message });
});

app.listen(port, () => {
  console.log(`Demo travel platform API running on http://localhost:${port}`);
  console.log(`ATRE endpoint configured as ${atreApiUrl}`);
});
