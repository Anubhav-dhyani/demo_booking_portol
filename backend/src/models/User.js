import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true },
    externalUserId: { type: String, required: true, unique: true },
    role: { type: String, enum: ["user"], default: "user" }
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
