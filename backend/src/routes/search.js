import express from "express";
import { InventoryItem } from "../models/InventoryItem.js";
import { ProviderSetting } from "../models/ProviderSetting.js";

const router = express.Router();

const cityToAirportCode = {
  delhi: "DEL",
  "new delhi": "DEL",
  mumbai: "BOM",
  bombay: "BOM",
  bengaluru: "BLR",
  bangalore: "BLR",
  chennai: "MAA",
  hyderabad: "HYD",
  kolkata: "CCU",
  calcutta: "CCU",
  pune: "PNQ",
  goa: "GOI",
  ahmedabad: "AMD",
  jaipur: "JAI",
  kochi: "COK",
  cochin: "COK",
  sfo: "SFO",
  "san francisco": "SFO",
  jfk: "JFK",
  "new york": "JFK",
  london: "LHR"
};

function getIgnavBaseUrl() {
  return (process.env.IGNAV_API_URL || "https://ignav.com").replace(/\/$/, "");
}

function getGeoapifyBaseUrl() {
  return (process.env.GEOAPIFY_API_URL || "https://api.geoapify.com").replace(/\/$/, "");
}

function getFareList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.itineraries)) return data.itineraries;
  if (Array.isArray(data?.fares)) return data.fares;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.data?.itineraries)) return data.data.itineraries;
  if (Array.isArray(data?.data?.fares)) return data.data.fares;
  if (Array.isArray(data?.data?.results)) return data.data.results;
  return [];
}

function firstValue(source, keys, fallback = "") {
  for (const key of keys) {
    if (source?.[key] !== undefined && source[key] !== null && source[key] !== "") {
      return source[key];
    }
  }

  return fallback;
}

function escapeRegex(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function resolveAirportCode(value) {
  const cleaned = String(value || "").trim();

  if (/^[a-zA-Z]{3}$/.test(cleaned)) {
    return cleaned.toUpperCase();
  }

  return cityToAirportCode[cleaned.toLowerCase()] || "";
}

function normalizeFare(fare, search) {
  const firstSegment = fare.outbound?.segments?.[0] || {};
  const lastSegment = fare.outbound?.segments?.[fare.outbound?.segments?.length - 1] || firstSegment;
  const price = typeof fare.price === "object" ? fare.price : {};
  const airline = firstValue(fare, ["airline", "airline_name", "carrier", "carrier_name"], firstValue(fare.outbound, ["carrier"], firstValue(firstSegment, ["operating_carrier_name", "marketing_carrier_code"], "Flight")));
  const flightNumber = firstValue(fare, ["flightNumber", "flight_number", "flight", "number"], firstValue(firstSegment, ["flight_number"], `${airline}-${fare.ignav_id || fare.id || Date.now()}`));
  const amount = Number(firstValue(fare, ["amount", "fare", "total", "total_amount"], firstValue(price, ["amount"], 0)));
  const currency = firstValue(fare, ["currency", "currency_code"], firstValue(price, ["currency"], "USD"));

  return {
    _id: String(firstValue(fare, ["id", "_id", "fare_id", "ignav_id"], `${flightNumber}-${amount}`)),
    type: "flight",
    title: `${airline} ${flightNumber}`,
    subtitle: firstValue(fare, ["cabin", "class", "fare_class", "cabin_class"], "Flight fare"),
    price: { amount, currency },
    details: {
      airline,
      flightNumber,
      origin: firstValue(fare, ["origin", "from"], firstValue(firstSegment, ["departure_airport"], search.origin)),
      destination: firstValue(fare, ["destination", "to"], firstValue(lastSegment, ["arrival_airport"], search.destination)),
      departureTime: firstValue(fare, ["departureTime", "departure_time", "departure", "departureDateTime"], firstValue(firstSegment, ["departure_time_local", "departure_time_utc"], `${search.departure_date}T08:00`)),
      arrivalTime: firstValue(fare, ["arrivalTime", "arrival_time", "arrival", "arrivalDateTime"], firstValue(lastSegment, ["arrival_time_local", "arrival_time_utc"], "")),
      cabin: firstValue(fare, ["cabin", "class", "fare_class", "cabin_class"], ""),
      confirmationCode: `FL${Math.floor(100000 + Math.random() * 900000)}`
    },
    providerPayload: fare
  };
}

async function getMode(type) {
  const setting = await ProviderSetting.findOne({ type });
  if (setting?.mode) return setting.mode;
  return setting?.useProvider ? (type === "flight" ? "ignav" : "manual") : "manual";
}

async function searchDbInventory(type, criteria = {}) {
  const filter = { type, active: true };

  if (type === "flight") {
    if (criteria.origin) filter["details.origin"] = new RegExp(`^${escapeRegex(criteria.origin)}$`, "i");
    if (criteria.destination) filter["details.destination"] = new RegExp(`^${escapeRegex(criteria.destination)}$`, "i");
    if (criteria.departure_date) filter["details.departureTime"] = new RegExp(`^${escapeRegex(criteria.departure_date)}`);
  }

  if (type === "hotel" && criteria.destination) {
    filter.$or = [
      { title: new RegExp(escapeRegex(criteria.destination), "i") },
      { subtitle: new RegExp(escapeRegex(criteria.destination), "i") },
      { "details.city": new RegExp(escapeRegex(criteria.destination), "i") },
      { "details.hotelName": new RegExp(escapeRegex(criteria.destination), "i") }
    ];
  }

  if (type === "transport") {
    const routeFilters = [];
    if (criteria.origin) routeFilters.push({ "details.pickupLocation": new RegExp(escapeRegex(criteria.origin), "i") });
    if (criteria.destination) routeFilters.push({ "details.dropoffLocation": new RegExp(escapeRegex(criteria.destination), "i") });
    if (routeFilters.length > 0) filter.$and = routeFilters;
  }

  return InventoryItem.find(filter).sort({ createdAt: -1 });
}

function normalizeDbItem(item) {
  return {
    _id: String(item._id),
    type: item.type,
    title: item.title,
    subtitle: item.subtitle,
    price: item.price,
    details: item.details,
    providerPayload: null
  };
}

function normalizeGoogleHotel(place, search) {
  return {
    _id: `google-${place.id || place.name}`,
    type: "hotel",
    title: place.displayName?.text || place.name || "Hotel",
    subtitle: place.formattedAddress || search.destination,
    price: { amount: 0, currency: "USD" },
    details: {
      hotelName: place.displayName?.text || place.name || "Hotel",
      city: search.destination,
      checkIn: search.departureDate,
      checkOut: search.returnDate,
      confirmationCode: `HT${Math.floor(100000 + Math.random() * 900000)}`,
      rating: place.rating,
      address: place.formattedAddress
    },
    providerPayload: place
  };
}

function normalizeGeoapifyHotel(feature, search) {
  const props = feature.properties || {};

  return {
    _id: `geoapify-${props.place_id || props.datasource?.raw?.osm_id || props.name}`,
    type: "hotel",
    title: props.name || "Hotel",
    subtitle: props.formatted || search.destination,
    price: { amount: 0, currency: "USD" },
    details: {
      hotelName: props.name || "Hotel",
      city: props.city || search.destination,
      checkIn: search.departureDate,
      checkOut: search.returnDate,
      confirmationCode: `HT${Math.floor(100000 + Math.random() * 900000)}`,
      address: props.formatted
    },
    providerPayload: feature
  };
}

async function searchGoogleHotels(search) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    throw new Error("GOOGLE_PLACES_API_KEY is not configured");
  }

  const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.rating,places.location"
    },
    body: JSON.stringify({
      textQuery: `hotels in ${search.destination}`,
      includedType: "lodging",
      maxResultCount: 20
    })
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error?.message || "Google hotel search failed");
  }

  return { items: (data?.places || []).map((place) => normalizeGoogleHotel(place, search)), providerResponse: data };
}

async function searchGeoapifyHotels(search) {
  const apiKey = process.env.GEOAPIFY_API_KEY;

  if (!apiKey) {
    throw new Error("GEOAPIFY_API_KEY is not configured");
  }

  const geocodeUrl = new URL(`${getGeoapifyBaseUrl()}/v1/geocode/search`);
  geocodeUrl.searchParams.set("text", search.destination);
  geocodeUrl.searchParams.set("limit", "1");
  geocodeUrl.searchParams.set("apiKey", apiKey);

  const geocodeResponse = await fetch(geocodeUrl);
  const geocodeData = await geocodeResponse.json().catch(() => null);

  if (!geocodeResponse.ok || !geocodeData?.features?.[0]) {
    throw new Error(geocodeData?.message || "Geoapify could not locate the hotel destination");
  }

  const [lon, lat] = geocodeData.features[0].geometry.coordinates;
  const placesUrl = new URL(`${getGeoapifyBaseUrl()}/v2/places`);
  placesUrl.searchParams.set("categories", "accommodation.hotel");
  placesUrl.searchParams.set("filter", `circle:${lon},${lat},15000`);
  placesUrl.searchParams.set("bias", `proximity:${lon},${lat}`);
  placesUrl.searchParams.set("limit", "20");
  placesUrl.searchParams.set("apiKey", apiKey);

  const placesResponse = await fetch(placesUrl);
  const placesData = await placesResponse.json().catch(() => null);

  if (!placesResponse.ok) {
    throw new Error(placesData?.message || "Geoapify hotel search failed");
  }

  return { items: (placesData?.features || []).map((feature) => normalizeGeoapifyHotel(feature, search)), providerResponse: placesData };
}

router.post("/flights", async (req, res, next) => {
  try {
    const { origin: originInput, destination: destinationInput, departure_date: departureDateFromBody, departureDate } = req.body;
    const origin = resolveAirportCode(originInput);
    const destination = resolveAirportCode(destinationInput);
    const departure_date = departureDateFromBody || departureDate;
    const apiKey = process.env.IGNAV_API_KEY;

    const missing = [];

    if (!origin) missing.push("origin");
    if (!destination) missing.push("destination");
    if (!departure_date) missing.push("departure_date");

    if (missing.length > 0) {
      return res.status(400).json({
        message: `Missing or unsupported flight search fields: ${missing.join(", ")}. Use a supported city name or 3-letter IATA code.`,
        missing
      });
    }

    if ((await getMode("flight")) !== "ignav") {
      const fares = await searchDbInventory("flight", { origin, destination, departure_date });
      return res.json({ source: "database", fares: fares.map(normalizeDbItem) });
    }

    if (!apiKey) {
      return res.status(500).json({ message: "IGNAV_API_KEY is not configured" });
    }

    const response = await fetch(`${getIgnavBaseUrl()}/api/fares/one-way`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": apiKey
      },
      body: JSON.stringify({
        origin,
        destination,
        departure_date
      })
    });

    const data = await response.json().catch(() => null);

    if (data?.error) {
      return res.status(response.ok ? 502 : response.status).json({
        message: data.error.message || "Flight search provider returned an error",
        providerResponse: data
      });
    }

    if (!response.ok) {
      return res.status(response.status).json({
        message: data?.error?.message || data?.message || "Flight search provider request failed",
        providerResponse: data
      });
    }

    const fares = getFareList(data).map((fare) => normalizeFare(fare, { origin, destination, departure_date }));

    if (fares.length === 0) {
      return res.status(502).json({
        message: "Flight provider returned no fares for this route/date.",
        providerResponse: data
      });
    }

    res.json({ source: "provider", fares, providerResponse: data });
  } catch (error) {
    next(error);
  }
});

router.post("/hotels", async (req, res, next) => {
  try {
    const mode = await getMode("hotel");

    if (mode === "google") {
      const result = await searchGoogleHotels(req.body);
      return res.json({ source: "google", ...result });
    }

    if (mode === "geoapify") {
      const result = await searchGeoapifyHotels(req.body);
      return res.json({ source: "geoapify", ...result });
    }

    const hotels = await searchDbInventory("hotel", req.body);
    res.json({
      source: "database",
      items: hotels.map(normalizeDbItem)
    });
  } catch (error) {
    next(error);
  }
});

router.post("/transport", async (_req, res, next) => {
  try {
    const transport = await searchDbInventory("transport", _req.body);
    res.json({
      source: "database",
      items: transport.map(normalizeDbItem)
    });
  } catch (error) {
    next(error);
  }
});

export default router;
