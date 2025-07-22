// src/services/flygasal.js

import apiService from '../api/apiService';

// This module abstracts flight-related API calls to your Laravel backend (which proxies PKfare)

const flygasal = {
  /**
   * Search for flights via Laravel (which uses PKfareService@searchFlights)
   * @param {Object} criteria - Search criteria (origin, destination, dates, etc.)
   * @returns {Promise<Object>} - Flight search results
   */
  searchFlights: async (criteria) => {
    try {
      const response = await apiService.post('/flights/search', criteria);
      return response.data;
    } catch (error) {
      console.error('Flight search failed:', error);
      throw error;
    }
  },

  /**
   * Create a booking
   * @param {Object} bookingDetails - Includes selected flight, passengers, and contact info
   * @returns {Promise<Object>} - Booking confirmation
   */
  createBooking: async (bookingDetails) => {
    try {
      const response = await apiService.post('/flights/book', bookingDetails);
      return response.data;
    } catch (error) {
      console.error('Booking failed:', error);
      throw error;
    }
  },

  /**
   * Retrieve booking details by reference code
   * @param {String} bookingReference
   * @returns {Promise<Object>}
   */
  getBookingDetails: async (bookingReference) => {
    try {
      const response = await apiService.get(`/flights/booking/${bookingReference}`);
      return response.data;
    } catch (error) {
      console.error('Get booking details failed:', error);
      throw error;
    }
  },

  /**
   * Cancel a booking
   * @param {String} bookingReference
   * @returns {Promise<Object>}
   */
  cancelBooking: async (bookingReference) => {
    try {
      const response = await apiService.post(`/flights/booking/${bookingReference}/cancel`);
      return response.data;
    } catch (error) {
      console.error('Cancel booking failed:', error);
      throw error;
    }
  },

  
    transformPKFareData: (pkData) => {
    const segmentMap = Object.fromEntries(
        (pkData.segments || []).map((seg) => [seg.segmentId, seg])
    );

    const flightMap = Object.fromEntries(
        (pkData.flights || []).map((flight) => [flight.flightId, flight])
    );

    const solutions = pkData.solutions || [];

    return solutions.map((solution) => {
        const journeyKeys = Object.keys(solution.journeys || {});
        const flightIds = journeyKeys
        .map((key) => solution.journeys[key])
        .flat();

        const allSegmentIds = flightIds
        .map((flightId) => flightMap[flightId]?.segmengtIds || [])
        .flat();
        const tripSegments = allSegmentIds
        .map((segmentId) => segmentMap[segmentId])
        .filter(Boolean);

        const outbound = tripSegments[0];
        const finalSegment = tripSegments[tripSegments.length - 1];

        if (!outbound || !finalSegment) return null;

        const firstFlight = flightMap[flightIds[0]];

        return {
            id: outbound.segmentId,
            solutionKey: solution.solutionKey,
            airline: outbound.airline,
            cabin: outbound.cabinClass,
            flightNumber: outbound.flightNum,
            tickets: outbound.availabilityCount,
            origin: outbound.departure,
            destination: finalSegment.arrival,
            departureTime: new Date(outbound.departureDate),
            arrivalTime: new Date(finalSegment.arrivalDate),
            journeyTime: firstFlight?.journeyTime ?? null,
            transferCount: firstFlight?.transferCount ?? null,
            // lastTktTime: firstFlight?.lastTktTime ?? null,
            lastTktTime: solution.lastTktTime ? new Date(solution.lastTktTime) : null,
            expired: solution.lastTktTime ? new Date(solution.lastTktTime) < new Date() : false,
            stops: tripSegments.length - 1,
            segments: tripSegments,
            price: solution.adtFare + solution.adtTax,
        };
    }).filter(Boolean);
    }

  
};

export default flygasal;
