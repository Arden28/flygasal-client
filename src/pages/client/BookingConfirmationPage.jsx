import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { flights, airlines, airports } from '../../data/fakeData';
import FlightDetails from '../../components/client/FlightDetails';
import BookingForm from '../../components/client/BookingForm';
import { PayPalScriptProvider } from '@paypal/react-paypal-js';
import flygasal from '../../api/flygasalService';

const countries = [
  { code: 'US', name: 'United States', flag: '/assets/img/flags/us.png' },
  { code: 'GB', name: 'United Kingdom', flag: '/assets/img/flags/gb.png' },
  { code: 'AE', name: 'United Arab Emirates', flag: '/assets/img/flags/ae.png' },
  { code: 'AU', name: 'Australia', flag: '/assets/img/flags/au.png' },
  { code: 'FR', name: 'France', flag: '/assets/img/flags/fr.png' },
  { code: 'ET', name: 'Ethiopia', flag: '/assets/img/flags/et.png' },
  { code: 'KE', name: 'Kenya', flag: '/assets/img/flags/ke.png' },
  { code: 'ZA', name: 'South Africa', flag: '/assets/img/flags/za.png' },
  { code: 'EG', name: 'Egypt', flag: '/assets/img/flags/eg.png' },
  { code: 'MA', name: 'Morocco', flag: '/assets/img/flags/ma.png' },
];
const months = [
  { value: '01', label: '01 January' },
  { value: '02', label: '02 February' },
  { value: '03', label: '03 March' },
  { value: '04', label: '04 April' },
  { value: '05', label: '05 May' },
  { value: '06', label: '06 June' },
  { value: '07', label: '07 July' },
  { value: '08', label: '08 August' },
  { value: '09', label: '09 September' },
  { value: '10', label: '10 October' },
  { value: '11', label: '11 November' },
  { value: '12', label: '12 December' },
];
const days = Array.from({ length: 31 }, (_, i) => ({
  value: String(i + 1).padStart(2, '0'),
  label: String(i + 1).padStart(2, '0'),
}));
const dobYears = Array.from({ length: new Date().getFullYear() - 1920 + 1 }, (_, i) => ({
  value: String(new Date().getFullYear() - i),
  label: String(new Date().getFullYear() - i),
}));
const issuanceYears = dobYears;
const expiryYears = Array.from({ length: 21 }, (_, i) => ({
  value: String(new Date().getFullYear() + i),
  label: String(new Date().getFullYear() + i),
}));

const BookingConfirmationPage = ({ user }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [tripDetails, setTripDetails] = useState(null);
  const [adults, setAdults] = useState(0);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [error, setError] = useState(null);
  const [isAgent, setIsAgent] = useState(false);
  const [agentFee, setAgentFee] = useState(0);
  const [showCancellation, setShowCancellation] = useState(false);
  const [showReadMore, setShowReadMore] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [loading, setLoading] = useState(true);
  const [availableFlights, setAvailableFlights] = useState([]);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    travelers: [],
    payment_method: '',
    agree_terms: false,
  });

  // Set Agent
  useEffect(() => {
    if (user?.role === 'agent') {
      setIsAgent(true);
    } else {
      setIsAgent(false);
    }
  }, [user]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize travelers and counts based on query parameters
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const adultsCount = parseInt(searchParams.get('adults')) || 2;
    const childrenCount = parseInt(searchParams.get('children')) || 0;
    const infantsCount = parseInt(searchParams.get('infants')) || 0;

    setAdults(adultsCount);
    setChildren(childrenCount);
    setInfants(infantsCount);

    const initialTravelers = [
      ...Array(adultsCount).fill().map(() => ({
        type: 'adult',
        title: import.meta.env.ENV_MODE === 'development' ? 'Mr' : '',
        first_name: import.meta.env.ENV_MODE === 'development' ? `Elan${String.fromCharCode(65 + Math.floor(Math.random() * 26))}` : '',
        last_name: import.meta.env.ENV_MODE === 'development' ? `Mask${String.fromCharCode(65 + Math.floor(Math.random() * 26))}` : '',
        nationality: import.meta.env.ENV_MODE === 'development' ? 'PK' : '',
        dob_month: import.meta.env.ENV_MODE === 'development' ? '01' : '',
        dob_day: import.meta.env.ENV_MODE === 'development' ? '01' : '',
        dob_year: import.meta.env.ENV_MODE === 'development' ? '1984' : '',
        passport: import.meta.env.ENV_MODE === 'development' ? '6655899745626' : '',
        passport_issuance_month: import.meta.env.ENV_MODE === 'development' ? '01' : '',
        passport_issuance_day: import.meta.env.ENV_MODE === 'development' ? '01' : '',
        passport_issuance_year: import.meta.env.ENV_MODE === 'development' ? '2020' : '',
        passport_expiry_month: import.meta.env.ENV_MODE === 'development' ? '01' : '',
        passport_expiry_day: import.meta.env.ENV_MODE === 'development' ? '01' : '',
        passport_expiry_year: import.meta.env.ENV_MODE === 'development' ? String(new Date().getFullYear() + 2) : '',
      })),
      ...Array(childrenCount).fill().map(() => ({
        type: 'child',
        title: import.meta.env.ENV_MODE === 'development' ? 'Miss' : '',
        first_name: import.meta.env.ENV_MODE === 'development' ? `Elan${String.fromCharCode(65 + Math.floor(Math.random() * 26))}` : '',
        last_name: import.meta.env.ENV_MODE === 'development' ? `Mask${String.fromCharCode(65 + Math.floor(Math.random() * 26))}` : '',
        nationality: import.meta.env.ENV_MODE === 'development' ? 'PK' : '',
        dob_month: import.meta.env.ENV_MODE === 'development' ? '01' : '',
        dob_day: import.meta.env.ENV_MODE === 'development' ? '01' : '',
        dob_year: import.meta.env.ENV_MODE === 'development' ? '2015' : '',
        passport: import.meta.env.ENV_MODE === 'development' ? '6655899745626' : '',
        passport_issuance_month: import.meta.env.ENV_MODE === 'development' ? '01' : '',
        passport_issuance_day: import.meta.env.ENV_MODE === 'development' ? '01' : '',
        passport_issuance_year: import.meta.env.ENV_MODE === 'development' ? '2020' : '',
        passport_expiry_month: import.meta.env.ENV_MODE === 'development' ? '01' : '',
        passport_expiry_day: import.meta.env.ENV_MODE === 'development' ? '01' : '',
        passport_expiry_year: import.meta.env.ENV_MODE === 'development' ? String(new Date().getFullYear() + 2) : '',
      })),
      ...Array(infantsCount).fill().map(() => ({
        type: 'infant',
        title: import.meta.env.ENV_MODE === 'development' ? 'Miss' : '',
        first_name: import.meta.env.ENV_MODE === 'development' ? `Elan${String.fromCharCode(65 + Math.floor(Math.random() * 26))}` : '',
        last_name: import.meta.env.ENV_MODE === 'development' ? `Mask${String.fromCharCode(65 + Math.floor(Math.random() * 26))}` : '',
        nationality: import.meta.env.ENV_MODE === 'development' ? 'PK' : '',
        dob_month: import.meta.env.ENV_MODE === 'development' ? '01' : '',
        dob_day: import.meta.env.ENV_MODE === 'development' ? '01' : '',
        dob_year: import.meta.env.ENV_MODE === 'development' ? '2023' : '',
        passport: import.meta.env.ENV_MODE === 'development' ? '6655899745626' : '',
        passport_issuance_month: import.meta.env.ENV_MODE === 'development' ? '01' : '',
        passport_issuance_day: import.meta.env.ENV_MODE === 'development' ? '01' : '',
        passport_issuance_year: import.meta.env.ENV_MODE === 'development' ? '2020' : '',
        passport_expiry_month: import.meta.env.ENV_MODE === 'development' ? '01' : '',
        passport_expiry_day: import.meta.env.ENV_MODE === 'development' ? '01' : '',
        passport_expiry_year: import.meta.env.ENV_MODE === 'development' ? String(new Date().getFullYear() + 2) : '',
      })),
    ];
    setFormData(prev => ({ ...prev, travelers: initialTravelers }));
  }, [location.search]);

  // Form validation
  useEffect(() => {
    const isValid =
      formData.full_name &&
      formData.email &&
      formData.phone &&
      formData.agree_terms &&
      formData.payment_method &&
      formData.travelers.length >= adults + children + infants &&
      formData.travelers.every(
        (traveler) =>
          traveler.title &&
          traveler.first_name &&
          traveler.last_name &&
          traveler.nationality &&
          traveler.dob_month &&
          traveler.dob_day &&
          traveler.dob_year &&
          traveler.passport &&
          traveler.passport_issuance_month &&
          traveler.passport_issuance_day &&
          traveler.passport_issuance_year &&
          traveler.passport_expiry_month &&
          traveler.passport_expiry_day &&
          traveler.passport_expiry_year
      ) &&
      (formData.payment_method !== 'credit_card' ||
        (formData.card_full_name && formData.card_number && formData.card_expiration && formData.card_cvv));
    setIsFormValid(isValid);
    console.log('isFormValid:', isValid, 'formData:', formData, 'counts:', { adults, children, infants }); // Debug
  }, [formData, adults, children, infants]);

  // Precise Pricing
  useEffect(() => {
  const fetchFlightData = async () => {
    try {
      const searchParams = new URLSearchParams(location.search);

      const journeysFromUrl = [];
      let i = 0;

      while (searchParams.has(`flights[${i}][origin]`)) {
        journeysFromUrl.push({
          airline: searchParams.get(`flights[${i}][airline]`),
          flightNum: searchParams.get(`flights[${i}][flightNum]`),
          arrival: searchParams.get(`flights[${i}][arrival]`),
          arrivalDate: searchParams.get(`flights[${i}][arrivalDate]`),
          arrivalTime: searchParams.get(`flights[${i}][arrivalTime]`),
          departure: searchParams.get(`flights[${i}][departure]`),
          departureDate: searchParams.get(`flights[${i}][departureDate]`),
          departureTime: searchParams.get(`flights[${i}][departureTime]`),
          bookingCode: searchParams.get(`flights[${i}][bookingCode]`)
        });
        i++;
      }

      const tripType = searchParams.get('tripType') || 'oneway';
      const cabinType = searchParams.get('flightType') || 'Economy';
      const adults = parseInt(searchParams.get('adults')) || 1;
      const children = parseInt(searchParams.get('children')) || 0;
      const infants = parseInt(searchParams.get('infants')) || 0;
      const departureDate = searchParams.get('depart') || null;
      const returnDate = searchParams.get('returnDate') || null;

      const solutionId = searchParams.get('solutionId') || null;
      const solutionKey = searchParams.get('solutionKey') || null;
      const flightId = searchParams.get('flightId');
      const returnFlightId = searchParams.get('returnFlightId');

      const params = {
        journeys: journeysFromUrl,
        tripType,
        cabinType,
        adults,
        children,
        infants,
        departureDate,
        returnDate,
        solutionId,
        solutionKey
      };

      // console.info('Trip Details:', params);


      // Step 2: Call flygasal API to fetch matching flights
      const response = await flygasal.precisePricing(params);
      const outboundFlights = flygasal.transformPreciseData(response.data);
      console.info('Pricing Response:', response.data);

        let returnFlights = [];

        // If round trip, fetch return flights too
        if (tripType === 'return' && returnDate) {
          const returnParams = {
            ...params,
            flights: [{ origin: params.destination, destination: params.origin, depart: returnDate }],
          };
          const returnResponse = await flygasal.precisePricing(returnParams);
          returnFlights = flygasal.transformPreciseData(returnResponse.data);
        }

        const allFlights = [...outboundFlights, ...returnFlights];
        console.info('All Flights: ', allFlights);
        setAvailableFlights(allFlights);

      // Step 3: Match selected flights using flightId(s)
      const selectedOutbound = allFlights.find(f => f.id === flightId);
      const selectedReturn = tripType === 'return' && returnFlightId ? allFlights.find(f => f.id === returnFlightId) : null;
      
      console.info('Selected Outbond: ', selectedOutbound);
      if (!selectedOutbound) {
        setError(`Outbound flight not found for ID: ${flightId}`);
        return;
      }

      if (tripType === 'return' && returnFlightId && !selectedReturn) {
        setError(`Return flight not found for ID: ${returnFlightId}`);
        return;
      }

      // Step 4: Set final trip data
      setTripDetails({
        tripType,
        origin: params.origin,
        destination: params.destination,
        departDate: params.departureDate,
        returnDate: params.returnDate,
        fareSourceCode: params.flightId,
        solutionId: params.solutionId,
        adults,
        children,
        infants,
        outbound: selectedOutbound,
        return: selectedReturn,
        totalPrice: selectedOutbound.price + (selectedReturn ? selectedReturn.price : 0),
        cancellation_policy: 'Non-refundable after 24 hours. Cancellations within 24 hours of booking are refundable with a $50 fee.',
      });

      const errorCode = response?.data?.errorCode;
      const errorMsg = response?.data?.errorMsg;

      if (errorCode) {
        if (errorCode === 'B021') {
          setError('The selected fare is no longer available. Please choose another flight.');
        } else if (errorCode === 'B020') {
          setError('Can not find any price for this flight.');
        } else {
          setError(errorMsg || 'Failed to load booking details.');
        }
      } else {
        setError(null); // Clear any previous error
        // Optionally, you can set the pricing data here
        // setPricingData(response.data);
      }

    } catch (err) {
      console.error('Error loading confirmation:', err);
      setError('Failed to load booking details.');
    } finally {
      setLoading(false);
    }
  };

  fetchFlightData();
  }, [location.search]);


  // Map passenger types from form values ('adult', 'child', 'infant')
  // to the format expected by the backend: 'ADT' (Adult), 'CHD' (Child), 'INF' (Infant)
  const typeMap = {
    adult: 'ADT',
    child: 'CHD',
    infant: 'INF',
  };

  // Handle payment submission
  const handlePayment = async (paymentMethod) => {
    if (!isFormValid) {
      console.log('Form invalid, cannot proceed with payment');
      return;
    }
    setIsProcessing(true);

    try {
      const searchParams = new URLSearchParams(location.search);
      let paymentSuccess = false;
      const solutionId = searchParams.get('solutionId') || null;
      // console.info(`Selected Flight: ${outbound.origin}`);

      const bookingDetails = {
        selectedFlight: outbound,
        solutionId: solutionId,
        // fareSourceCode: ,
        passengers: formData.travelers.map((traveler) => ({
          firstName: traveler.first_name,
          lastName: traveler.last_name,
          type: typeMap[traveler.type.toLowerCase()] || 'ADT', // default to 'ADT' if unknown
          dob: traveler.dob_year && traveler.dob_month && traveler.dob_day
          ? `${traveler.dob_year}-${String(traveler.dob_month).padStart(2, '0')}-${String(traveler.dob_day).padStart(2, '0')}`
          : null, // Format: 'YYYY-MM-DD'
          gender: traveler.gender || 'Male', // 'Male' or 'Female'
          passportNumber: traveler.passport || null,
          passportExpiry: traveler.passport_expiry_year && traveler.passport_expiry_month && traveler.passport_expiry_day
          ? `${traveler.passport_expiry_year}-${String(traveler.passport_expiry_month).padStart(2, '0')}-${String(traveler.passport_expiry_day).padStart(2, '0')}`
          : null, // Format: 'YYYY-MM-DD'
        })),
        contactName: formData.full_name,
        contactEmail: formData.email,
        contactPhone: formData.phone,
        totalPrice: tripDetails.totalPrice + agentFee,
        currency: tripDetails.currency || 'USD', // Set a default if not already available
        agent_fee: agentFee,
        payment_method: 'wallet',
      };

      console.log(JSON.stringify(bookingDetails, null, 2));

      const response = await flygasal.createBooking(bookingDetails);

      let booking = null;

      if (response?.data?.booking?.order_num) {
        paymentSuccess = true;
        booking = response.data.booking;
      } else {
        const readableMessage =
          response?.data?.errorMsg || 'Booking failed. Please try again later.';
        throw new Error(readableMessage);
      }

      if (paymentSuccess && booking) {
        navigate(`/flights/invoice/${booking.order_num}`);
        // navigate('/flight/confirmation-success');
      }

    } catch (err) {
      console.error('Flight booking error:', err);
      setIsProcessing(false);
    }
  };


  // Check cancellation policy height
  useEffect(() => {
    const p = document.querySelector('.to--be > p');
    if (p && p.scrollHeight > p.offsetHeight) {
      setShowReadMore(true);
    }
  }, [tripDetails]);

  // Get airport and airline details
  const getAirportName = (code) => {
    const airport = airports.find((a) => a.value === code);
    return airport ? `${airport.city} (${airport.value})` : code;
  };
  const getCityName = (code) => {
    const airport = airports.find((a) => a.value === code);
    return airport ? airport.city : code;
  };

  const getAirlineName = (code) => {
    const airline = airlines.find((a) => a.code === code);
    return airline ? airline.name : code;
  };

  const getAirlineLogo = (code) => {
    const airline = airlines.find((a) => a.code === code);
    return airline ? airline.logo : 'https://via.placeholder.com/40';
  };

  const getPassengerSummary = (adults, children, infants) => {
    const parts = [];
    if (adults > 0) parts.push(`${adults} Adult${adults > 1 ? 's' : ''}`);
    if (children > 0) parts.push(`${children} Child${children > 1 ? 'ren' : ''}`);
    if (infants > 0) parts.push(`${infants} Infant${infants > 1 ? 's' : ''}`);
    return parts.join(', ');
  };

  // Calculate trip duration
  const calculateDuration = (departure, arrival) => {
    const depart = new Date(departure);
    const arrive = new Date(arrival);
    const diff = (arrive - depart) / (1000 * 60 * 60);
    const hours = Math.floor(diff);
    const minutes = Math.round((diff - hours) * 60);
    return `${hours}h ${minutes}m`;
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateMonth = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const handleFormChange = (e, index) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith('traveler_')) {
      const [_, field, idx] = name.split('_');
      setFormData(prev => ({
        ...prev,
        travelers: prev.travelers.map((t, i) => i === parseInt(idx) ? { ...t, [field]: value } : t),
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    }
  };

  const addTraveler = (type) => {
    if (formData.travelers.length >= 9) return;
    setFormData(prev => ({
      ...prev,
      travelers: [
        ...prev.travelers,
        {
          type,
          title: '',
          first_name: '',
          last_name: '',
          nationality: '',
          dob_month: '',
          dob_day: '',
          dob_year: '',
          passport: '',
          passport_issuance_month: '',
          passport_issuance_day: '',
          passport_issuance_year: '',
          passport_expiry_month: '',
          passport_expiry_day: '',
          passport_expiry_year: '',
        },
      ],
    }));
  };

  const removeTraveler = (index) => {
    const minTravelers = adults + children + infants;
    if (formData.travelers.length <= minTravelers) return;
    setFormData(prev => ({
      ...prev,
      travelers: prev.travelers.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.agree_terms) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      navigate('/flight/confirmation-success');
    }, 2000);
  };

  if (error) {
    return (
      <div className="container mx-auto py-14 mt-5 text-center">
        <h2 className="text-red-600 text-3xl font-bold">Error</h2>
        <p className="text-gray-600 mt-2">{error}</p>
        <button
          className="mt-4 bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg hover:bg-blue-800 transition duration-200"
          onClick={() => navigate('/flight/availability')}
        >
          Back to Flight Search
        </button>
      </div>
    );
  }

  if (!tripDetails || !tripDetails.outbound) {
    return <div className="text-center py-10 text-gray-600">Loading...</div>;
  }

  const { tripType, outbound, return: returnFlight, totalPrice, cancellation_policy } = tripDetails;
  const finalPrice = totalPrice;

  return (
    <div className="relative bg-gray-100 font-sans">
      {/* Hero Section */}
      <motion.section
        className="h-64 md:h-80 bg-cover bg-center m-0"
        style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1436491865332-7a61a109cc05?fit=crop&w=1920&h=400&q=80")' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <div className="inset-0 bg-gradient-to-b from-black/50 to-transparent"></div>
        <div className="container mx-auto h-full flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-4xl md:text-5xl font-bold mb-2">Book Your Journey to {getCityName(outbound.destination)}</h1>
            <p className="text-lg md:text-xl">Secure your flights with ease and start your adventure!</p>
          </div>
        </div>
      </motion.section>

      {/* Main Content */}
      <div className="container mx-auto px-4 pt-0" style={{ marginTop: '-70px' }}>
        {/* <PayPalScriptProvider options={{ 'client-id': 'your-paypal-client-id' }}>
        </PayPalScriptProvider> */}
          <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-6">
            {/* Left Column: Booking Form */}
            <BookingForm
              searchParams={new URLSearchParams(location.search)}
              formData={formData}
              setFormData={setFormData}
              handleFormChange={handleFormChange}
              isSubmitting={isSubmitting}
              cancellation_policy={cancellation_policy}
              setCancellationPolicy={() => {}}
              showReadMore={showReadMore}
              setShowReadMore={setShowReadMore}
              adults={adults}
              children={children}
              infants={infants}
              setAdults={setAdults}
              setChildren={setChildren}
              setInfants={setInfants}
              addTraveler={addTraveler}
              removeTraveler={removeTraveler}
              countries={countries}
              months={months}
              days={days}
              dobYears={dobYears}
              issuanceYears={issuanceYears}
              expiryYears={expiryYears}
              showCancellation={showCancellation}
              setShowCancellation={setShowCancellation}
              getPassengerSummary={getPassengerSummary}
              tripType={tripType}
              outbound={outbound}
              formatDate={formatDate}
              formatDateMonth={formatDateMonth}
              formatTime={formatTime}
              getAirportName={getAirportName}
              getCityName={getCityName}
              getAirlineName={getAirlineName}
              getAirlineLogo={getAirlineLogo}
              returnFlight={returnFlight}
              calculateDuration={calculateDuration}
              isFormValid={isFormValid}
              isProcessing={isProcessing}
              setIsProcessing={setIsProcessing}
              totalPrice={tripDetails.totalPrice + agentFee}
            />

            {/* Right Column: Flight Details */}
            <FlightDetails
              getPassengerSummary={getPassengerSummary}
              totalPrice={totalPrice}
              finalPrice={finalPrice}
              setAgentFee={setAgentFee}
              agentFee={agentFee}
              isAgent={isAgent}
              infants={infants}
              children={children}
              adults={adults}
              tripType={tripType}
              outbound={outbound}
              formatDate={formatDate}
              formatTime={formatTime}
              getAirportName={getAirportName}
              getCityName={getCityName}
              getAirlineName={getAirlineName}
              getAirlineLogo={getAirlineLogo}
              returnFlight={returnFlight}
              calculateDuration={calculateDuration}
              isFormValid={isFormValid}
              formData={formData}
              handlePayment={handlePayment}
              isProcessing={isProcessing}
            />

            {/* Hidden Inputs */}
            <input type="hidden" name="booking_data" value={btoa(JSON.stringify({ cancellation_policy, adults, children, infants }))} />
            <input
              type="hidden"
              name="routes"
              value={btoa(
                JSON.stringify({
                  segments: [
                    [
                      {
                        ...outbound,
                        departure_code: outbound.origin,
                        arrival_code: outbound.destination,
                        departure_time: formatTime(outbound.departureTime),
                        arrival_time: formatTime(outbound.arrivalTime),
                        flight_no: outbound.flightNumber,
                        class: outbound.cabin || 'Economy',
                        img: getAirlineLogo(outbound.airline),
                        currency: 'USD',
                        price: outbound.price,
                      },
                    ],
                    tripType === 'return' && returnFlight
                      ? [
                          {
                            ...returnFlight,
                            departure_code: returnFlight.origin,
                            arrival_code: returnFlight.destination,
                            departure_time: formatTime(returnFlight.departureTime),
                            arrival_time: formatTime(returnFlight.arrivalTime),
                            flight_no: returnFlight.flightNumber,
                            class: returnFlight.cabin || 'Economy',
                            img: getAirlineLogo(returnFlight.airline),
                            currency: 'USD',
                            price: returnFlight.price,
                          },
                        ]
                      : [],
                  ],
                })
              )}
            />
            <input type="hidden" name="travellers" value={btoa(JSON.stringify(formData.travelers))} />
          </form>
      </div>

      {/* Loading Spinner */}
      <AnimatePresence>
        {isSubmitting && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-12 h-12 border-4 border-blue-700 border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            ></motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BookingConfirmationPage;