export function buildAtreBookingPayload(booking) {
  return {
    externalBookingId: booking.externalBookingId,
    externalUserId: booking.externalUserId,
    source: "demo-booking-portal",
    user: booking.user,
    itinerary: {
      title: booking.itinerary?.title || `${booking.itinerary?.origin || "Origin"} to ${booking.itinerary?.destination || "Destination"} trip`,
      ...booking.itinerary
    },
    flight: booking.flight,
    hotel: booking.hotel
      ? {
          ...booking.hotel,
          name: booking.hotel.name || booking.hotel.hotelName,
          checkInDate: booking.hotel.checkInDate || booking.hotel.checkIn
        }
      : null,
    transport: booking.transport,
    preferences: booking.preferences,
    travelPolicy: booking.travelPolicy || { maxRecoveryCostDelta: 500 },
    cardBenefits: booking.cardBenefits || {
      product: "American Express Platinum",
      disruptionProtection: true
    }
  };
}
