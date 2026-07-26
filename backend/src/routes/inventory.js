import express from "express";
import { requireAdmin } from "../middleware/auth.js";
import { InventoryItem } from "../models/InventoryItem.js";

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const filter = { active: true };

    if (req.query.type) {
      filter.type = req.query.type;
    }

    const items = await InventoryItem.find(filter).sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    next(error);
  }
});

router.get("/admin", requireAdmin, async (_req, res, next) => {
  try {
    const items = await InventoryItem.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    next(error);
  }
});

router.post("/", requireAdmin, async (req, res, next) => {
  try {
    const item = await InventoryItem.create(req.body);
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
});

router.put("/:id", requireAdmin, async (req, res, next) => {
  try {
    const item = await InventoryItem.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!item) {
      return res.status(404).json({ message: "Inventory item not found" });
    }

    res.json(item);
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", requireAdmin, async (req, res, next) => {
  try {
    const item = await InventoryItem.findByIdAndDelete(req.params.id);

    if (!item) {
      return res.status(404).json({ message: "Inventory item not found" });
    }

    res.json({ message: "Inventory item deleted" });
  } catch (error) {
    next(error);
  }
});

export default router;
