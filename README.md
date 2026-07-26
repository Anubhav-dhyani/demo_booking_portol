# Demo Travel Booking Platform

Standalone external booking website for creating demo trips and forwarding booking/disruption data to an Amex ATRE backend.

This repo intentionally contains only the travel booking platform. It does not include the ATRE portal, recovery engine, admin disruption tools for ATRE, or recovery timeline UI.

## Structure

- `frontend/` - React, Vite, TailwindCSS booking and admin UI
- `backend/` - Node.js, Express, MongoDB API

## Environment

Backend `.env`:

```bash
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/demo-travel-booking
ATRE_API_URL=http://localhost:4000
```

Frontend `.env`:

```bash
VITE_API_URL=http://localhost:5000
```

## Run Locally

Start MongoDB first, then:

```bash
cd backend
npm install
npm run dev
```

In another terminal:

```bash
cd frontend
npm install
npm run dev
```

The booking platform calls:

- `POST {ATRE_API_URL}/api/import-booking`
- `POST {ATRE_API_URL}/api/disruptions/flight-delay`
- `POST {ATRE_API_URL}/api/disruptions/flight-cancellation`
