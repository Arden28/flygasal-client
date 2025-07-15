import axios from 'axios';
import getAccessToken from './auth';

// Cache for API responses
const cache = new Map();

const cacheResponse = (key, data, ttl = 15 * 60 * 1000) => {
  cache.set(key, { data, expiry: Date.now() + ttl });
};

const getCachedResponse = (key) => {
  const cached = cache.get(key);
  if (cached && Date.now() < cached.expiry) {
    return cached.data;
  }
  return null;
};

// Fetch airports for search dropdown
export const getAirports = async (keyword = '') => {
  const cacheKey = `airports_${keyword}`;
  const cached = getCachedResponse(cacheKey);
  if (cached) return cached;

  const url = 'https://test.api.amadeus.com/v1/reference-data/locations';
  const token = await getAccessToken();

  try {
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        subType: 'AIRPORT',
        keyword,
        page: { limit: 50 }, // Limit to 50 for dropdown
      },
    });

    const airports = response.data.data.map((loc) => ({
      value: loc.iataCode,
      label: `${loc.address.cityName} (${loc.iataCode})`,
      city: loc.address.cityName,
      country: loc.address.countryName,
    }));

    cacheResponse(cacheKey, airports);
    return airports;
  } catch (error) {
    console.error('Error fetching airports:', error);
    return [];
  }
};

// Fetch airlines for filters
export const getAirlines = async (airlineCodes = []) => {
  const cacheKey = `airlines_${airlineCodes.join(',') || 'all'}`;
  const cached = getCachedResponse(cacheKey);
  if (cached) return cached;

  const url = 'https://test.api.amadeus.com/v1/reference-data/airlines';
  const token = await getAccessToken();

  try {
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` },
      params: airlineCodes.length ? { airlineCodes: airlineCodes.join(',') } : {},
    });

    const airlines = response.data.data.map((airline) => ({
      code: airline.iataCode,
      name: airline.commonName || airline.businessName,
      logo: `https://content.airhex.com/airlines/${airline.iataCode}.png`, // External logo source (replace if needed)
    }));

    cacheResponse(cacheKey, airlines, 24 * 60 * 60 * 1000); // Cache for 24 hours
    return airlines;
  } catch (error) {
    console.error('Error fetching airlines:', error);
    return [];
  }
};

// Fetch flight offers
export const getFlightOffers = async (searchParams) => {
  const { tripType, flights, returnDate, adults, children, infants, flightType } = searchParams;
  const cacheKey = JSON.stringify({ tripType, flights, returnDate, adults, children, infants, flightType });
  const cached = getCachedResponse(cacheKey);
  if (cached) return cached;

  const url = 'https://test.api.amadeus.com/v2/shopping/flight-offers';
  const token = await getAccessToken();

  try {
    const params = {
      originLocationCode: flights[0].origin,
      destinationLocationCode: flights[0].destination,
      departureDate: flights[0].depart,
      adults: adults || 1,
      children: children || 0,
      infants: infants || 0,
      travelClass: flightType?.toUpperCase() || 'ECONOMY',
      currencyCode: 'USD',
      max: 50, // Limit results
    };

    if (tripType === 'return' && returnDate) {
      params.returnDate = returnDate;
    }

    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` },
      params,
    });

    const flightOffers = response.data.data.map((offer) => ({
      id: offer.id,
      outbound: {
        id: offer.itineraries[0].segments[0].id,
        origin: offer.itineraries[0].segments[0].departure.iataCode,
        destination: offer.itineraries[0].segments[0].arrival.iataCode,
        departureTime: offer.itineraries[0].segments[0].departure.at,
        arrivalTime: offer.itineraries[0].segments[0].arrival.at,
        airline: offer.itineraries[0].segments[0].carrierCode,
        price: parseFloat(offer.price.total) / (offer.itineraries.length || 1), // Approximate per leg
        stops: offer.itineraries[0].segments.length - 1,
        stopoverAirportCodes: offer.itineraries[0].segments.slice(0, -1).map((s) => s.arrival.iataCode),
        flightNumber: offer.itineraries[0].segments[0].number,
        baggage: offer.travelerPricings[0].fareDetailsBySegment[0].includedCheckedBags?.quantity || '0',
        refundable: offer.travelerPricings[0].fareDetailsBySegment[0].fareBasis.includes('REF') || false,
      },
      returnFlight: tripType === 'return' && offer.itineraries[1] ? {
        id: offer.itineraries[1].segments[0].id,
        origin: offer.itineraries[1].segments[0].departure.iataCode,
        destination: offer.itineraries[1].segments[0].arrival.iataCode,
        departureTime: offer.itineraries[1].segments[0].departure.at,
        arrivalTime: offer.itineraries[1].segments[0].arrival.at,
        airline: offer.itineraries[1].segments[0].carrierCode,
        price: 0, // Included in total
        stops: offer.itineraries[1].segments.length - 1,
        stopoverAirportCodes: offer.itineraries[1].segments.slice(0, -1).map((s) => s.arrival.iataCode),
        flightNumber: offer.itineraries[1].segments[0].number,
        baggage: offer.travelerPricings[0].fareDetailsBySegment[1]?.includedCheckedBags?.quantity || '0',
        refundable: offer.travelerPricings[0].fareDetailsBySegment[1]?.fareBasis.includes('REF') || false,
      } : null,
      totalPrice: parseFloat(offer.price.total),
      currency: offer.price.currency,
      offerDetails: offer, // For pricing/booking
    }));

    cacheResponse(cacheKey, flightOffers);
    return flightOffers;
  } catch (error) {
    console.error('Error fetching flight offers:', error);
    return [];
  }
};

// Confirm flight price
export const confirmFlightPrice = async (flightOffer) => {
  const url = 'https://test.api.amadeus.com/v1/shopping/flight-offers/pricing';
  const token = await getAccessToken();

  try {
    const response = await axios.post(
      url,
      { data: { type: 'flight-offers-pricing', flightOffers: [flightOffer.offerDetails] } },
      {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      }
    );
    return response.data.data.flightOffers[0];
  } catch (error) {
    console.error('Error confirming flight price:', error);
    throw error;
  }
};

// Create flight order
export const createFlightOrder = async (flightOffer, travelerDetails) => {
  const url = 'https://test.api.amadeus.com/v1/booking/flight-orders';
  const token = await getAccessToken();

  try {
    const response = await axios.post(
      url,
      {
        data: {
          type: 'flight-order',
          flightOffers: [flightOffer],
          travelers: [travelerDetails],
        },
      },
      {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      }
    );
    return response.data.data;
  } catch (error) {
    console.error('Error creating flight order:', error);
    throw error;
  }
};