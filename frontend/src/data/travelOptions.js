export const flights = [
  {
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
    airline: "Skyline Demo Air",
    flightNumber: "SD451",
    origin: "JFK",
    destination: "SFO",
    departureTime: "2026-08-15T10:20:00-04:00",
    arrivalTime: "2026-08-15T14:05:00-07:00",
    cabin: "economy",
    confirmationCode: "FL451D",
    status: "booked",
    price: { amount: 520, currency: "USD" }
  },
  {
    airline: "Continental Demo",
    flightNumber: "CD709",
    origin: "JFK",
    destination: "SFO",
    departureTime: "2026-08-15T14:00:00-04:00",
    arrivalTime: "2026-08-15T17:35:00-07:00",
    cabin: "premium economy",
    confirmationCode: "FL709C",
    status: "booked",
    price: { amount: 690, currency: "USD" }
  }
];

export const hotels = [
  {
    hotelName: "Amex Fine Hotels Downtown SF",
    city: "San Francisco",
    checkIn: "2026-08-15",
    checkOut: "2026-08-17",
    confirmationCode: "HT456B",
    status: "booked",
    price: { amount: 620, currency: "USD" }
  },
  {
    hotelName: "Market Street Business Suites",
    city: "San Francisco",
    checkIn: "2026-08-15",
    checkOut: "2026-08-17",
    confirmationCode: "HT882M",
    status: "booked",
    price: { amount: 480, currency: "USD" }
  },
  {
    hotelName: "Bayfront Executive Hotel",
    city: "San Francisco",
    checkIn: "2026-08-15",
    checkOut: "2026-08-17",
    confirmationCode: "HT290F",
    status: "booked",
    price: { amount: 540, currency: "USD" }
  }
];

export const transports = [
  {
    type: "rideshare",
    pickupLocation: "SFO",
    dropoffLocation: "Amex Fine Hotels Downtown SF",
    pickupTime: "2026-08-15T12:00:00-07:00",
    confirmationCode: "TX789C",
    status: "booked",
    price: { amount: 48, currency: "USD" }
  },
  {
    type: "black car",
    pickupLocation: "SFO",
    dropoffLocation: "Amex Fine Hotels Downtown SF",
    pickupTime: "2026-08-15T12:00:00-07:00",
    confirmationCode: "TX215B",
    status: "booked",
    price: { amount: 92, currency: "USD" }
  },
  {
    type: "taxi",
    pickupLocation: "SFO",
    dropoffLocation: "Amex Fine Hotels Downtown SF",
    pickupTime: "2026-08-15T12:00:00-07:00",
    confirmationCode: "TX304T",
    status: "booked",
    price: { amount: 64, currency: "USD" }
  }
];
