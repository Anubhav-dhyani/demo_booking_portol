import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { connectDb } from "./config/db.js";
import authRoutes from "./routes/auth.js";
import atreSyncRoutes from "./routes/atreSync.js";
import bookingRoutes from "./routes/bookings.js";
import disruptionRoutes from "./routes/disruptions.js";
import inventoryRoutes from "./routes/inventory.js";
import searchRoutes from "./routes/search.js";
import settingsRoutes from "./routes/settings.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "demo-travel-booking-backend" });
});

app.use("/api/auth", authRoutes);
app.use("/api/atre", atreSyncRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/disruptions", disruptionRoutes);

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(error.status || 500).json({
    message: error.message || "Unexpected server error"
  });
});

connectDb()
  .then(() => {
    app.listen(port, () => {
      console.log(`Booking backend listening on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to start server", error);
    process.exit(1);
  });
