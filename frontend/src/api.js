const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function authHeaders() {
  const token = localStorage.getItem("authToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...authHeaders(), ...(options.headers || {}) },
    ...options
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || "Request failed");
  }

  return data;
}

export function saveSession(session) {
  localStorage.setItem("authToken", session.token);
  localStorage.setItem("authUser", JSON.stringify(session.user));
  window.dispatchEvent(new Event("authchange"));
}

export function clearSession() {
  localStorage.removeItem("authToken");
  localStorage.removeItem("authUser");
  window.dispatchEvent(new Event("authchange"));
}

export function getSessionUser() {
  const saved = localStorage.getItem("authUser");
  return saved ? JSON.parse(saved) : null;
}

export function registerUser(payload) {
  return request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function loginUser(payload) {
  return request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function loginAdmin(payload) {
  return request("/api/auth/admin/login", {
    method: "POST",
    body: JSON.stringify(payload)
  });
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
