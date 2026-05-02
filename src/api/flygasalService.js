import apiService from '../api/apiService';

/**
 * Flygasal Service
 * Abstracts flight-related API calls to the Laravel backend.
 * Data mapping and normalization is handled on the server.
 */
const flygasal = {

    /**
     * Search flights via Laravel backend
     * @param {Object} criteria - Search parameters
     * @param {Object} opts - Optional settings (e.g. AbortSignal)
     * @returns {Promise<Object>} { message, shoppingKey, searchKey, offers }
     */
    searchFlights: async (criteria, opts = {}) => {
        try {
            const res = await apiService.post("/flights/search", criteria, { signal: opts?.signal });
            return res.data; 
        } catch (error) {
            console.error('Flight search failed:', error);
            throw error;
        }
    },

    /**
     * Perform precise pricing for a selected solution.
     * Validates seat availability and checks for price changes.
     * @param {Object} criteria - Includes solutionId, solutionKey, journeys, etc.
     * @returns {Promise<Object>} { message, offer }
     */
    precisePricing: async (criteria) => {
        try {
            const res = await apiService.post('/flights/precise-pricing', criteria);
            return res.data;
        } catch (error) {
            console.error('Precise pricing failed:', error);
            throw error;
        }
    },

    /**
     * Fetch ancillary options (baggage, seats) for a confirmed price.
     * @param {Object} criteria 
     * @returns {Promise<Object>} 
     */
    ancillaryPricing: async (criteria) => {
        try {
            const res = await apiService.post('/flights/ancillary-pricing', criteria);
            return res.data;
        } catch (error) {
            console.error('Ancillary pricing failed:', error);
            throw error;
        }
    },

    /**
     * Create a new flight booking (PNR generation).
     * @param {Object} bookingDetails 
     * @returns {Promise<Object>} 
     */
    createBooking: async (bookingDetails) => {
        try {
            const res = await apiService.post('/flights/bookings', bookingDetails);
            return res.data;
        } catch (error) {
            console.error('Booking creation failed:', error);
            throw error;
        }
    },

    /**
     * Retrieve live booking details and status.
     * @param {String} bookingReference - The internal order number.
     * @returns {Promise<Object>} 
     */
    getBookingDetails: async (bookingReference) => {
        try {
            const res = await apiService.get(`/bookings/${bookingReference}`);
            return res.data;
        } catch (error) {
            console.error('Failed to fetch booking details:', error);
            throw error;
        }
    },

    /**
     * Cancel an existing unpaid booking.
     * @param {String} bookingReference 
     * @returns {Promise<Object>} 
     */
    cancelBooking: async (bookingReference) => {
        try {
            const res = await apiService.post(`/bookings/${bookingReference}/cancel`);
            return res.data;
        } catch (error) {
            console.error('Cancel booking failed:', error);
            throw error;
        }
    },

    /**
     * Pay for an order using internal wallet balance.
     * @param {Object} criteria 
     * @returns {Promise<Object>} 
     */
    payOrderWithWallet: async (criteria) => {
        try {
            const res = await apiService.post('/transactions/pay', criteria);
            return res.data;
        } catch (error) {
            console.error('Payment failed: ', error);
            throw error;
        }
    },

    /**
     * Finalize the booking and issue tickets.
     * @param {Object} criteria 
     * @returns {Promise<Object>} 
     */
    ticketing: async (criteria) => {
        try {
            const res = await apiService.post('/bookings/ticketing', criteria);
            return res.data;
        } catch (error) {
            console.error('Ticketing failed: ', error);
            throw error;
        }
    }
};

export default flygasal;