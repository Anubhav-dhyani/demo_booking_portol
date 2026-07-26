import type { Flight, Hotel, Transport } from "../shared/types";

export const flights: Array<Flight & { id: string; label: string }> = [
  {
    id: "flight_ax123",
    label: "Morning business nonstop",
    airline: "Amex Airways",
    flightNumber: "AX123",
    origin: "JFK",
    destination: "SFO",
    departureTime: "2026-08-15T08:00:00-04:00",
    arrivalTime: "2026-08-15T11:30:00-07:00",
    cabin: "business",
    confirmationCode: "FL123A",
    status: "booked",
    price: { amount: 850, currency: "USD" }
  },
  {
    id: "flight_ax219",
    label: "Midday premium economy",
    airline: "Amex Airways",
    flightNumber: "AX219",
    origin: "JFK",
    destination: "SFO",
    departureTime: "2026-08-15T12:10:00-04:00",
    arrivalTime: "2026-08-15T15:55:00-07:00",
    cabin: "premium economy",
    confirmationCode: "FL219P",
    status: "booked",
    price: { amount: 610, currency: "USD" }
  },
  {
    id: "flight_ax777",
    label: "Evening first class",
    airline: "Amex Airways",
    flightNumber: "AX777",
    origin: "JFK",
    destination: "SFO",
    departureTime: "2026-08-15T18:25:00-04:00",
    arrivalTime: "2026-08-15T22:10:00-07:00",
    cabin: "first",
    confirmationCode: "FL777F",
    status: "booked",
    price: { amount: 1250, currency: "USD" }
  }
];

export const hotels: Array<Hotel & { id: string; perks: string }> = [
  {
    id: "hotel_fhr_sf",
    hotelName: "Amex Fine Hotels Downtown SF",
    city: "San Francisco",
    checkIn: "2026-08-15",
    checkOut: "2026-08-17",
    confirmationCode: "HT456B",
    status: "booked",
    price: { amount: 620, currency: "USD" },
    perks: "Breakfast, late checkout, Union Square access"
  },
  {
    id: "hotel_bay_view",
    hotelName: "Bay View Executive Suites",
    city: "San Francisco",
    checkIn: "2026-08-15",
    checkOut: "2026-08-17",
    confirmationCode: "HT812C",
    status: "booked",
    price: { amount: 540, currency: "USD" },
    perks: "Waterfront rooms, workspace, fitness center"
  },
  {
    id: "hotel_soma",
    hotelName: "SoMa Business Hotel",
    city: "San Francisco",
    checkIn: "2026-08-15",
    checkOut: "2026-08-17",
    confirmationCode: "HT300S",
    status: "booked",
    price: { amount: 430, currency: "USD" },
    perks: "Near Moscone Center, espresso bar, quiet floor"
  }
];

export const transports: Array<Transport & { id: string; eta: string }> = [
  {
    id: "taxi_rideshare",
    type: "rideshare",
    pickupLocation: "SFO",
    dropoffLocation: "Amex Fine Hotels Downtown SF",
    pickupTime: "2026-08-15T12:00:00-07:00",
    confirmationCode: "TX789C",
    status: "booked",
    price: { amount: 48, currency: "USD" },
    eta: "12 min pickup"
  },
  {
    id: "taxi_black_car",
    type: "black car",
    pickupLocation: "SFO",
    dropoffLocation: "Amex Fine Hotels Downtown SF",
    pickupTime: "2026-08-15T12:05:00-07:00",
    confirmationCode: "TX901L",
    status: "booked",
    price: { amount: 92, currency: "USD" },
    eta: "Meet and greet"
  },
  {
    id: "taxi_cab",
    type: "taxi",
    pickupLocation: "SFO",
    dropoffLocation: "Amex Fine Hotels Downtown SF",
    pickupTime: "2026-08-15T12:10:00-07:00",
    confirmationCode: "TX222T",
    status: "booked",
    price: { amount: 58, currency: "USD" },
    eta: "Terminal stand"
  }
];
