import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { StoredBooking } from "../shared/types";

const dataDir = path.resolve(process.cwd(), "data");
const bookingFile = path.join(dataDir, "bookings.json");

async function readBookings(): Promise<StoredBooking[]> {
  try {
    const raw = await readFile(bookingFile, "utf8");
    return JSON.parse(raw) as StoredBooking[];
  } catch {
    return [];
  }
}

async function writeBookings(bookings: StoredBooking[]) {
  await mkdir(dataDir, { recursive: true });
  await writeFile(bookingFile, JSON.stringify(bookings, null, 2));
}

export async function listBookings() {
  const bookings = await readBookings();
  return bookings.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getBooking(externalBookingId: string) {
  const bookings = await readBookings();
  return bookings.find((booking) => booking.externalBookingId === externalBookingId);
}

export async function saveBooking(booking: StoredBooking) {
  const bookings = await readBookings();
  const nextBookings = [booking, ...bookings.filter((item) => item.externalBookingId !== booking.externalBookingId)];
  await writeBookings(nextBookings);
  return booking;
}
