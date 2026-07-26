import mongoose from "mongoose";

export async function connectDb() {
  const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/demo-travel-booking";

  await mongoose.connect(mongoUri);
  console.log("MongoDB connected");
}
