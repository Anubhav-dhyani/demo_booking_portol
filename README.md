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
ATRE_API_URL=http://localhost:5003
IGNAV_API_URL=https://ignav.com
IGNAV_API_KEY=replace-with-your-ignav-key
GOOGLE_PLACES_API_KEY=replace-with-your-google-places-key
GEOAPIFY_API_URL=https://api.geoapify.com
GEOAPIFY_API_KEY=replace-with-your-geoapify-key
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=replace-with-smtp-user
SMTP_PASS=replace-with-smtp-password
EMAIL_FROM=Demo Travel <no-reply@example.com>
AUTH_TOKEN_SECRET=change-this-local-secret
ADMIN_NAME=Travel Admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123
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
- `POST /api/atre/bookings/sync`
- `POST /api/atre/recovery-options`
- `POST /api/atre/recovery/confirm`
- `POST /api/atre/notifications/email`
