import express from "express";
import { requireAdmin } from "../middleware/auth.js";
import { ProviderSetting } from "../models/ProviderSetting.js";

const router = express.Router();
const supportedTypes = ["flight", "hotel", "transport"];
const supportedModes = {
  flight: ["manual", "ignav"],
  hotel: ["manual", "google", "geoapify"],
  transport: ["manual"]
};

async function ensureSettings() {
  await Promise.all(
    supportedTypes.map((type) =>
      ProviderSetting.findOneAndUpdate(
        { type },
        { $setOnInsert: { type, mode: "manual", useProvider: false } },
        { upsert: true, new: true }
      )
    )
  );
}

router.get("/provider-modes", requireAdmin, async (_req, res, next) => {
  try {
    await ensureSettings();
    const settings = await ProviderSetting.find().sort({ type: 1 });
    res.json(settings);
  } catch (error) {
    next(error);
  }
});

router.put("/provider-modes/:type", requireAdmin, async (req, res, next) => {
  try {
    const { type } = req.params;

    if (!supportedTypes.includes(type)) {
      return res.status(400).json({ message: "Unsupported provider mode type" });
    }

    const mode = req.body.mode || (req.body.useProvider ? (type === "flight" ? "ignav" : "manual") : "manual");

    if (!supportedModes[type].includes(mode)) {
      return res.status(400).json({ message: `Unsupported ${type} search mode` });
    }

    const setting = await ProviderSetting.findOneAndUpdate(
      { type },
      { mode, useProvider: mode !== "manual" },
      { upsert: true, new: true, runValidators: true }
    );

    res.json(setting);
  } catch (error) {
    next(error);
  }
});

export default router;
