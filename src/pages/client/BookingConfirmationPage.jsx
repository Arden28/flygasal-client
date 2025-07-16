import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { flights, airlines, airports } from '../../data/fakeData';
import FlightDetails from '../../components/client/FlightDetails';
import BookingForm from '../../components/client/BookingForm';

const countries = [
  { code: 'US', name: 'United States', flag: '/assets/img/flags/us.png' },
  { code: 'GB', name: 'United Kingdom', flag: '/assets/img/flags/gb.png' },
  { code: 'AE', name: 'United Arab Emirates', flag: '/assets/img/flags/ae.png' },
  { code: 'AU', name: 'Australia', flag: '/assets/img/flags/au.png' },
  { code: 'FR', name: 'France', flag: '/assets/img/flags/fr.png' },
  // African Countries
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

const BookingConfirmationPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [tripDetails, setTripDetails] = useState(null);
  const [error, setError] = useState(null);
  const [isAgent, setIsAgent] = useState(false); // Simulate agent status
  const [agentFee, setAgentFee] = useState(0);
  const [showCancellation, setShowCancellation] = useState(false);
  const [showReadMore, setShowReadMore] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    travelers: [],
    payment_method: '',
    agree_terms: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize travelers based on query parameters
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const adults = parseInt(searchParams.get('adults')) || 2;
    const children = parseInt(searchParams.get('children')) || 0;
    const infants = parseInt(searchParams.get('infants')) || 0;

    const initialTravelers = [
      ...Array(adults).fill().map(() => ({
        type: 'adult',
        title: 'Mr',
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
      ...Array(children).fill().map(() => ({
        type: 'child',
        title: 'Miss',
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
      ...Array(infants).fill().map(() => ({
        type: 'infant',
        title: 'Miss',
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
    const isValid = formData.full_name &&
      formData.email &&
      formData.phone &&
      formData.agree_terms &&
      formData.payment_method &&
      formData.travelers.every(traveler =>
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
      );
    setIsFormValid(isValid);
  }, [formData]);

  // Parse flight data
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tripType = searchParams.get('tripType') || 'oneway';
    const adults = parseInt(searchParams.get('adults')) || 2;
    const children = parseInt(searchParams.get('children')) || 0;
    const infants = parseInt(searchParams.get('infants')) || 0;
    const origin = searchParams.get('flights[0][origin]');
    const destination = searchParams.get('flights[0][destination]');
    const departDate = searchParams.get('flights[0][depart]');
    const returnDate = searchParams.get('returnDate');
    const flightId = searchParams.get('flightId');
    const returnFlightId = searchParams.get('returnFlightId');

    console.log('Query Parameters:', { tripType, adults, children, infants, origin, destination, departDate, returnDate, flightId, returnFlightId });
    console.log('Available Flights:', flights);

    const selectedOutbound = flights.find(f => f.id === flightId);
    const selectedReturn = tripType === 'return' && returnFlightId ? flights.find(f => f.id === returnFlightId) : null;

    console.log('Selected Outbound:', selectedOutbound);
    console.log('Selected Return:', selectedReturn);

    if (!selectedOutbound) {
      const errorMsg = `Outbound flight not found for flightId: ${flightId}`;
      console.error(errorMsg);
      setError(errorMsg);
      return;
    }

    if (tripType === 'return' && returnFlightId && !selectedReturn) {
      const errorMsg = `Return flight not found for returnFlightId: ${returnFlightId}`;
      console.error(errorMsg);
      setError(errorMsg);
      return;
    }

    setTripDetails({
      tripType,
      adults,
      children,
      infants,
      outbound: selectedOutbound,
      return: selectedReturn,
      origin,
      destination,
      departDate,
      returnDate,
      totalPrice: selectedOutbound.price + (selectedReturn ? selectedReturn.price : 0),
      cancellation_policy: 'Non-refundable after 24 hours. Cancellations within 24 hours of booking are refundable with a $50 fee.',
    });
  }, [location.search]);

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
          title: 'Mr',
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
    const minTravelers = (tripDetails?.adults || 2) + (tripDetails?.children || 0) + (tripDetails?.infants || 0);
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
      navigate('/confirmation-success');
    }, 2000);
  };

  if (error) {
    return (
      <div className="container mx-auto py-8 text-center">
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

  const { tripType, adults, children, infants, outbound, return: returnFlight, totalPrice, cancellation_policy } = tripDetails;
  const finalPrice = totalPrice; // Hardcoded to match context

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      {/* Hero Section */}
      <motion.section
        className="relative h-64 md:h-80 bg-cover bg-center"
        style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1436491865332-7a61a109cc05?fit=crop&w=1920&h=400&q=80")' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-transparent"></div>
        <div className="container mx-auto h-full flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-4xl md:text-5xl font-bold mb-2">Book Your Journey to {getCityName(outbound.destination)}</h1>
            <p className="text-lg md:text-xl">Secure your flights with ease and start your adventure!</p>
          </div>
        </div>
      </motion.section>

      {/* Breadcrumb */}
      <section className="bg-blue-700 pt-4 pb-4 mb-4">
        <div className="container mx-auto">
          <div className="flex items-center">
            <div className="w-full">
              <p className="mb-0 text-white text-center font-bold text-lg">Flights Booking</p>
            </div>
          </div>
        </div>
      </section>

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

      {/* Main Content */}
      <div className="container mx-auto px-4">
        <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-6">
          {/* Left Column: Booking Form */}
            <BookingForm
                searchParams={new URLSearchParams(location.search)}
                
                formData={formData}
                setFormData={setFormData}
                handleFormChange={handleFormChange}
                isSubmitting={isSubmitting}
                cancellation_policy={cancellation_policy}
                setCancellationPolicy={() => {}} // No setCancellationPolicy in parent, pass noop or implement if needed
                showReadMore={showReadMore}
                setShowReadMore={setShowReadMore}

                adults={adults}
                children={children}
                infants={infants}
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
            />


          {/* Hidden Inputs */}
          <input type="hidden" name="booking_data" value={btoa(JSON.stringify({ cancellation_policy }))} />
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

      
    </div>
  );
};

export default BookingConfirmationPage;