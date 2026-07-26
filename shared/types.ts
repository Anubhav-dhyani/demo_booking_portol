export type Price = {
  amount: number;
  currency: "USD";
};

export type UserProfile = {
  name: string;
  email: string;
  phone: string;
};

export type Itinerary = {
  origin: string;
  destination: string;
  departureDate: string;
  tripPurpose: "business" | "leisure";
};

export type Flight = {
  airline: string;
  flightNumber: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  cabin: "economy" | "premium economy" | "business" | "first";
  confirmationCode: string;
  status: "booked";
  price: Price;
};

export type Hotel = {
  hotelName: string;
  city: string;
  checkIn: string;
  checkOut: string;
  confirmationCode: string;
  status: "booked";
  price: Price;
};

export type Transport = {
  type: "rideshare" | "black car" | "taxi";
  pickupLocation: string;
  dropoffLocation: string;
  pickupTime: string;
  confirmationCode: string;
  status: "booked";
  price: Price;
};

export type Meeting = {
  title: string;
  location: string;
  startTime: string;
  endTime: string;
};

export type Preferences = {
  preferredCabin: Flight["cabin"];
  maxDelayMinutes: number;
  preferSameAirline: boolean;
  allowHotelChanges: boolean;
  allowTransportChanges: boolean;
};

export type Payment = {
  cardBrand: "American Express";
  last4: string;
};

export type BookingPayload = {
  externalBookingId: string;
  externalUserId: string;
  source: "demo-travel-platform";
  user: UserProfile;
  itinerary: Itinerary;
  flight: Flight;
  hotel: Hotel;
  transport: Transport;
  meetings: Meeting[];
  preferences: Preferences;
  payment: Payment;
};

export type StoredBooking = BookingPayload & {
  createdAt: string;
  atreImportStatus: "sent" | "failed";
  atreImportResponse?: unknown;
  atreImportError?: string;
};

export type SearchRequest = UserProfile &
  Itinerary & {
    returnDate: string;
  };

export type CreateBookingRequest = {
  search: SearchRequest;
  flightId: string;
  hotelId: string;
  transportId: string;
  payment: Payment;
};

export type DisruptionDelayRequest = {
  externalBookingId: string;
  delayMinutes: number;
  reason: string;
};

export type DisruptionCancellationRequest = {
  externalBookingId: string;
  reason: string;
};

export type DisruptionResponse = {
  sent: boolean;
  message: string;
  atreResponse?: unknown;
};
