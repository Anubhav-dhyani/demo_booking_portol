const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || "Request failed");
  }

  return data;
}

export function createBooking(payload) {
  return request("/api/bookings", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function listBookings() {
  return request("/api/bookings");
}

export function getBooking(id) {
  return request(`/api/bookings/${id}`);
}

export function sendFlightDelay(bookingId, delayMinutes, reason) {
  return request("/api/disruptions/flight-delay", {
    method: "POST",
    body: JSON.stringify({ bookingId, delayMinutes, reason })
  });
}

export function sendFlightCancellation(bookingId, reason) {
  return request("/api/disruptions/flight-cancellation", {
    method: "POST",
    body: JSON.stringify({ bookingId, reason })
  });
}
