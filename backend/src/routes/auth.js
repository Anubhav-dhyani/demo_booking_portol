import express from "express";
import { User } from "../models/User.js";
import { hashPassword, signToken, verifyPassword } from "../utils/auth.js";

const router = express.Router();

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    externalUserId: user.externalUserId
  };
}

router.post("/register", async (req, res, next) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ message: "Name, email, phone, and password are required" });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });

    if (existingUser) {
      return res.status(409).json({ message: "An account with this email already exists" });
    }

    const user = await User.create({
      name,
      email,
      phone,
      passwordHash: hashPassword(password),
      externalUserId: `user_${Date.now()}`
    });
    const safeUser = publicUser(user);

    res.status(201).json({ user: safeUser, token: signToken(safeUser) });
  } catch (error) {
    next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase() });

    if (!user || !verifyPassword(password || "", user.passwordHash)) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const safeUser = publicUser(user);
    res.json({ user: safeUser, token: signToken(safeUser) });
  } catch (error) {
    next(error);
  }
});

router.post("/admin/login", (req, res) => {
  const { email, password } = req.body;
  const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

  if (email !== adminEmail || password !== adminPassword) {
    return res.status(401).json({ message: "Invalid admin credentials" });
  }

  const admin = {
    id: "admin",
    name: process.env.ADMIN_NAME || "Travel Admin",
    email: adminEmail,
    phone: "",
    role: "admin",
    externalUserId: "admin"
  };

  res.json({ user: admin, token: signToken(admin) });
});

export default router;
