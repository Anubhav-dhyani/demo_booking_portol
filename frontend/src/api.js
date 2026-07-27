const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

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
    const error = new Error(data?.message || "Request failed");
    error.data = data;
    throw error;
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

export function createBooking(payload) {
  return request("/api/bookings", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function listInventory(type) {
  const query = type ? `?type=${type}` : "";
  return request(`/api/inventory${query}`);
}

export function searchFlights(payload) {
  return request("/api/search/flights", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function searchHotels(payload) {
  return request("/api/search/hotels", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function searchTransport(payload) {
  return request("/api/search/transport", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function listProviderModes() {
  return request("/api/settings/provider-modes");
}

export function updateProviderMode(type, mode) {
  return request(`/api/settings/provider-modes/${type}`, {
    method: "PUT",
    body: JSON.stringify({ mode })
  });
}

export function listAdminInventory() {
  return request("/api/inventory/admin");
}

export function createInventoryItem(payload) {
  return request("/api/inventory", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateInventoryItem(id, payload) {
  return request(`/api/inventory/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function deleteInventoryItem(id) {
  return request(`/api/inventory/${id}`, {
    method: "DELETE"
  });
}

export function listBookings() {
  return request("/api/bookings");
}

export function listMyBookings() {
  return request("/api/bookings/my");
}

export function getBooking(id) {
  return request(`/api/bookings/${id}`);
}

export function retryAtreImport(id) {
  return request(`/api/bookings/${id}/retry-atre-import`, {
    method: "POST"
  });
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
