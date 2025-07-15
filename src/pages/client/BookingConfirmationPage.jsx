import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { flights, airlines, airports } from '../../data/fakeData';

const countries = [
  { value: 'PK', label: 'Pakistan' },
  { value: 'KE', label: 'Kenya' },
  { value: 'ET', label: 'Ethiopia' },
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
  const [isAgent, setIsAgent] = useState(true); // Simulate agent status
  const [agentFee, setAgentFee] = useState(0);
  const [showCancellation, setShowCancellation] = useState(false);
  const [showReadMore, setShowReadMore] = useState(false);
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
            <h1 className="text-4xl md:text-5xl font-bold mb-2">Book Your Journey to Addis Ababa</h1>
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
      <div className="container mx-auto py-12 px-4">
        <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-6 book">
          {/* Left Column: Booking Form */}
          <div className="w-full lg:w-2/3">
            {/* Personal Information */}
            <motion.div
              className="form-box bg-white rounded-lg shadow-md p-8 mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="form-title-wrap">
                <h3 className="title text-3xl font-bold text-gray-800 mb-6">Personal Information</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="label-text absolute top-0 left-3 text-gray-500 text-sm">Full Name</label>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleFormChange}
                    className="form-control w-full border border-gray-300 rounded-lg p-3 pt-6 focus:ring-2 focus:ring-blue-700"
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div>
                  <label className="label-text absolute top-0 left-3 text-gray-500 text-sm">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleFormChange}
                    className="form-control w-full border border-gray-300 rounded-lg p-3 pt-6 focus:ring-2 focus:ring-blue-700"
                    placeholder="john.doe@example.com"
                    required
                  />
                </div>
                <div>
                  <label className="label-text absolute top-0 left-3 text-gray-500 text-sm">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleFormChange}
                    className="form-control w-full border border-gray-300 rounded-lg p-3 pt-6 focus:ring-2 focus:ring-blue-700"
                    placeholder="+1234567890"
                    required
                  />
                </div>
              </div>
            </motion.div>

            {/* Traveler Information */}
            <motion.div
              className="form-box payment-received-wrap bg-white rounded-lg shadow-md p-8 mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="form-title-wrap">
                <h3 className="title text-3xl font-bold text-gray-800 mb-6">Traveler Information</h3>
              </div>
              <div className="card-body space-y-6">
                {formData.travelers.map((traveler, index) => (
                  <div key={index} className="card bg-white rounded-lg shadow-md mb-3">
                    <div className="card-header bg-gray-100 p-3 font-semibold">
                      {traveler.type.charAt(0).toUpperCase() + traveler.type.slice(1)} Traveler <strong>{index + 1}</strong>
                      {index >= adults + children + infants && (
                        <button
                          type="button"
                          onClick={() => removeTraveler(index)}
                          className="ml-2 text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="card-body p-6">
                      <input type="hidden" name={`traveler_type_${index}`} value={traveler.type} />
                      <div className="row g-2">
                        <div className="col-md-2">
                          <div className="form-floating relative">
                            <select
                              name={`traveler_title_${index}`}
                              value={traveler.title}
                              onChange={(e) => handleFormChange(e, index)}
                              className="form-select w-full border border-gray-300 rounded-lg p-3 pt-6 focus:ring-2 focus:ring-blue-700"
                            >
                              <option value="Mr">Mr</option>
                              <option value="Miss">Miss</option>
                              <option value="Mrs">Mrs</option>
                            </select>
                            <label className="label-text absolute top-0 left-3 text-gray-500 text-sm">Title</label>
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="form-floating relative">
                            <input
                              type="text"
                              name={`traveler_first_name_${index}`}
                              value={traveler.first_name}
                              onChange={(e) => handleFormChange(e, index)}
                              className="form-control w-full border border-gray-300 rounded-lg p-3 pt-6 focus:ring-2 focus:ring-blue-700"
                              placeholder="First Name"
                              required
                            />
                            <label className="label-text absolute top-0 left-3 text-gray-500 text-sm">First Name</label>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="form-floating relative">
                            <input
                              type="text"
                              name={`traveler_last_name_${index}`}
                              value={traveler.last_name}
                              onChange={(e) => handleFormChange(e, index)}
                              className="form-control w-full border border-gray-300 rounded-lg p-3 pt-6 focus:ring-2 focus:ring-blue-700"
                              placeholder="Last Name"
                              required
                            />
                            <label className="label-text absolute top-0 left-3 text-gray-500 text-sm">Last Name</label>
                          </div>
                        </div>
                      </div>
                      <div className="row mt-1 g-2">
                        <div className="col-md-6">
                          <div className="form-floating relative">
                            <select
                              name={`traveler_nationality_${index}`}
                              value={traveler.nationality}
                              onChange={(e) => handleFormChange(e, index)}
                              className="form-select w-full border border-gray-300 rounded-lg p-3 pt-6 focus:ring-2 focus:ring-blue-700"
                              required
                            >
                              <option value="">Select Nationality</option>
                              {countries.map(country => (
                                <option key={country.value} value={country.value}>{country.label}</option>
                              ))}
                            </select>
                            <label className="label-text absolute top-0 left-3 text-gray-500 text-sm">Nationality</label>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="row g-2">
                            <div className="col-5">
                              <div className="form-floating relative">
                                <select
                                  name={`traveler_dob_month_${index}`}
                                  value={traveler.dob_month}
                                  onChange={(e) => handleFormChange(e, index)}
                                  className="form-select w-full border border-gray-300 rounded-lg p-3 pt-6 focus:ring-2 focus:ring-blue-700"
                                  required
                                >
                                  <option value="">Month</option>
                                  {months.map(month => (
                                    <option key={month.value} value={month.value}>{month.label}</option>
                                  ))}
                                </select>
                                <label className="label-text absolute top-0 left-3 text-gray-500 text-sm">Date of Birth</label>
                              </div>
                            </div>
                            <div className="col-3">
                              <div className="form-floating relative">
                                <select
                                  name={`traveler_dob_day_${index}`}
                                  value={traveler.dob_day}
                                  onChange={(e) => handleFormChange(e, index)}
                                  className="form-select w-full border border-gray-300 rounded-lg p-3 pt-6 focus:ring-2 focus:ring-blue-700"
                                  required
                                >
                                  <option value="">Day</option>
                                  {days.map(day => (
                                    <option key={day.value} value={day.value}>{day.label}</option>
                                  ))}
                                </select>
                                <label className="label-text absolute top-0 left-3 text-gray-500 text-sm">Day</label>
                              </div>
                            </div>
                            <div className="col-4">
                              <div className="form-floating relative">
                                <select
                                  name={`traveler_dob_year_${index}`}
                                  value={traveler.dob_year}
                                  onChange={(e) => handleFormChange(e, index)}
                                  className="form-select w-full border border-gray-300 rounded-lg p-3 pt-6 focus:ring-2 focus:ring-blue-700"
                                  required
                                >
                                  <option value="">Year</option>
                                  {dobYears.map(year => (
                                    <option key={year.value} value={year.value}>{year.label}</option>
                                  ))}
                                </select>
                                <label className="label-text absolute top-0 left-3 text-gray-500 text-sm">Year</label>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="my-4" />
                      <div className="row g-2">
                        <div className="col-md-12 relative">
                          <p className="m-0 text-end absolute right-8 top-4 text-gray-400 text-sm z-10">
                            <strong>6 - 15 Numbers</strong>
                          </p>
                          <div className="form-floating relative">
                            <input
                              type="text"
                              name={`traveler_passport_${index}`}
                              value={traveler.passport}
                              onChange={(e) => handleFormChange(e, index)}
                              className="form-control w-full border border-gray-300 rounded-lg p-3 pt-6 focus:ring-2 focus:ring-blue-700"
                              placeholder="Passport or ID"
                              required
                              minLength={6}
                              maxLength={15}
                            />
                            <label className="label-text absolute top-0 left-3 text-gray-500 text-sm">Passport or ID</label>
                          </div>
                        </div>
                        <div className="col-md-6 mt-3">
                          <div className="row g-2">
                            <div className="col-5">
                              <div className="form-floating relative">
                                <select
                                  name={`traveler_passport_issuance_month_${index}`}
                                  value={traveler.passport_issuance_month}
                                  onChange={(e) => handleFormChange(e, index)}
                                  className="form-select w-full border border-gray-300 rounded-lg p-3 pt-6 focus:ring-2 focus:ring-blue-700"
                                  required
                                >
                                  <option value="">Month</option>
                                  {months.map(month => (
                                    <option key={month.value} value={month.value}>{month.label}</option>
                                  ))}
                                </select>
                                <label className="label-text absolute top-0 left-3 text-gray-500 text-sm">Issuance Date</label>
                              </div>
                            </div>
                            <div className="col-3">
                              <div className="form-floating relative">
                                <select
                                  name={`traveler_passport_issuance_day_${index}`}
                                  value={traveler.passport_issuance_day}
                                  onChange={(e) => handleFormChange(e, index)}
                                  className="form-select w-full border border-gray-300 rounded-lg p-3 pt-6 focus:ring-2 focus:ring-blue-700"
                                  required
                                >
                                  <option value="">Day</option>
                                  {days.map(day => (
                                    <option key={day.value} value={day.value}>{day.label}</option>
                                  ))}
                                </select>
                                <label className="label-text absolute top-0 left-3 text-gray-500 text-sm">Day</label>
                              </div>
                            </div>
                            <div className="col-4">
                              <div className="form-floating relative">
                                <select
                                  name={`traveler_passport_issuance_year_${index}`}
                                  value={traveler.passport_issuance_year}
                                  onChange={(e) => handleFormChange(e, index)}
                                  className="form-select w-full border border-gray-300 rounded-lg p-3 pt-6 focus:ring-2 focus:ring-blue-700"
                                  required
                                >
                                  <option value="">Year</option>
                                  {issuanceYears.map(year => (
                                    <option key={year.value} value={year.value}>{year.label}</option>
                                  ))}
                                </select>
                                <label className="label-text absolute top-0 left-3 text-gray-500 text-sm">Year</label>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-6 mt-3">
                          <div className="row g-2">
                            <div className="col-5">
                              <div className="form-floating relative">
                                <select
                                  name={`traveler_passport_expiry_month_${index}`}
                                  value={traveler.passport_expiry_month}
                                  onChange={(e) => handleFormChange(e, index)}
                                  className="form-select w-full border border-gray-300 rounded-lg p-3 pt-6 focus:ring-2 focus:ring-blue-700"
                                  required
                                >
                                  <option value="">Month</option>
                                  {months.map(month => (
                                    <option key={month.value} value={month.value}>{month.label}</option>
                                  ))}
                                </select>
                                <label className="label-text absolute top-0 left-3 text-gray-500 text-sm">Expiry Date</label>
                              </div>
                            </div>
                            <div className="col-3">
                              <div className="form-floating relative">
                                <select
                                  name={`traveler_passport_expiry_day_${index}`}
                                  value={traveler.passport_expiry_day}
                                  onChange={(e) => handleFormChange(e, index)}
                                  className="form-select w-full border border-gray-300 rounded-lg p-3 pt-6 focus:ring-2 focus:ring-blue-700"
                                  required
                                >
                                  <option value="">Day</option>
                                  {days.map(day => (
                                    <option key={day.value} value={day.value}>{day.label}</option>
                                  ))}
                                </select>
                                <label className="label-text absolute top-0 left-3 text-gray-500 text-sm">Day</label>
                              </div>
                            </div>
                            <div className="col-4">
                              <div className="form-floating relative">
                                <select
                                  name={`traveler_passport_expiry_year_${index}`}
                                  value={traveler.passport_expiry_year}
                                  onChange={(e) => handleFormChange(e, index)}
                                  className="form-select w-full border border-gray-300 rounded-lg p-3 pt-6 focus:ring-2 focus:ring-blue-700"
                                  required
                                >
                                  <option value="">Year</option>
                                  {expiryYears.map(year => (
                                    <option key={year.value} value={year.value}>{year.label}</option>
                                  ))}
                                </select>
                                <label className="label-text absolute top-0 left-3 text-gray-500 text-sm">Year</label>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="flex gap-4 mt-4">
                  <button
                    type="button"
                    onClick={() => addTraveler('adult')}
                    className="bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-800 transition duration-200"
                    disabled={formData.travelers.length >= 9}
                  >
                    Add Adult
                  </button>
                  <button
                    type="button"
                    onClick={() => addTraveler('child')}
                    className="bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-800 transition duration-200"
                    disabled={formData.travelers.length >= 9}
                  >
                    Add Child
                  </button>
                  <button
                    type="button"
                    onClick={() => addTraveler('infant')}
                    className="bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-800 transition duration-200"
                    disabled={formData.travelers.length >= 9}
                  >
                    Add Infant
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Payment Methods */}
            <motion.div
              className="form-box bg-white rounded-lg shadow-md p-8 mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="form-title-wrap">
                <h3 className="title text-3xl font-bold text-gray-800 mb-6">Payment Methods</h3>
              </div>
              <div className="space-y-3">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="payment_method"
                    value="credit_card"
                    checked={formData.payment_method === 'credit_card'}
                    onChange={handleFormChange}
                    className="form-check-input mr-2 h-5 w-5 text-blue-700 focus:ring-blue-700"
                    required
                  />
                  Credit Card
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="payment_method"
                    value="paypal"
                    checked={formData.payment_method === 'paypal'}
                    onChange={handleFormChange}
                    className="form-check-input mr-2 h-5 w-5 text-blue-700 focus:ring-blue-700"
                  />
                  PayPal
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="payment_method"
                    value="bank_transfer"
                    checked={formData.payment_method === 'bank_transfer'}
                    onChange={handleFormChange}
                    className="form-check-input mr-2 h-5 w-5 text-blue-700 focus:ring-blue-700"
                  />
                  Bank Transfer
                </label>
              </div>
            </motion.div>

            {/* Cancellation Policy */}
            {cancellation_policy && (
              <motion.div
                className="alert alert-danger bg-red-100 border border-red-400 rounded-lg p-4 mt-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <p className="font-bold text-red-700 text-lg">Cancellation Policy</p>
                <div className="to--be">
                  <p className="text-sm text-gray-600">{cancellation_policy}</p>
                  <div className={showReadMore ? 'read--more' : 'read--more hidden'}>
                    <input
                      className="d-none hidden"
                      type="checkbox"
                      id="show--more"
                      checked={showCancellation}
                      onChange={() => setShowCancellation(!showCancellation)}
                    />
                    <label
                      className="d-block block w-full font-bold text-red-600 cursor-pointer flex items-center gap-2 text-sm"
                      htmlFor="show--more"
                      id="to--be_1"
                    >
                      Read More
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#b02a37"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </label>
                    <label
                      className="d-none hidden w-full font-bold text-red-600 cursor-pointer flex items-center gap-2 text-sm"
                      htmlFor="show--more"
                      id="to--be_2"
                    >
                      Read Less
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#b02a37"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M18 15l-6-6-6 6" />
                      </svg>
                    </label>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Terms Checkbox */}
            <motion.div
              className="mt-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <div className="input-box">
                <div className="d-flex gap-3 alert border border-gray-300 rounded-lg p-4">
                  <input
                    type="checkbox"
                    id="agreechb"
                    name="agree_terms"
                    checked={formData.agree_terms}
                    onChange={handleFormChange}
                    className="form-check-input h-5 w-5 text-blue-700 focus:ring-blue-700 cursor-pointer"
                  />
                  <label htmlFor="agreechb" className="text-gray-600">
                    I agree to all{' '}
                    <a href="/page/terms-of-use" target="_blank" className="text-blue-700 hover:underline">
                      Terms & Conditions
                    </a>
                  </label>
                </div>
              </div>
            </motion.div>

            {/* Confirm Button */}
            <motion.div
              className="btn-box mt-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <button
                type="submit"
                disabled={!formData.agree_terms || isSubmitting}
                className="btn btn-primary w-full bg-gradient-to-r from-blue-600 to-blue-800 text-white font-semibold py-4 rounded-lg hover:from-blue-700 hover:to-blue-900 transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
                id="booking"
              >
                Confirm Booking
              </button>
            </motion.div>
          </div>

          {/* Right Column: Flight Details */}
          <div className="w-full lg:w-1/3">
            <div className="bg-white rounded-lg sticky p-3 top-4">
              {/* Outbound Flight */}
              <motion.div
                className="mb-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                <div className="form-title-wrap p-0 border-0 mb-2">
                    <h6 className="text-capitalize m-0 text-lg font-semibold">
                        {getCityName(outbound.origin)} to {getCityName(outbound.destination)}
                    </h6>
                  <small>{tripType === 'oneway' ? 'One-way, ' : tripType === 'return' ? 'Round-trip, ' : ''} {outbound.cabin || 'Economy'}, {getPassengerSummary(adults, children, infants)}</small>
                </div>
                <div className="form-content p-0">
                  <div className="card-item shadow-none radius-none p-0 mb-0">

                    {/* Airline */}
                    <div className="airline justify-content-between d-flex mb-2">
                        <span className="text-start text-sm">
                            Flying with {getAirlineName(outbound.airline)}
                        </span>
                        <span className="text-end">
                            <img
                            src={getAirlineLogo(outbound.airline)}
                            alt={getAirlineName(outbound.airline)}
                            className="" style={{ height: '20px' }}
                            />
                        </span>
                    </div>

                    {/* Trip Detail */}
                    <div id="accordion-collapse" data-accordion="collapse" class="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                        {/* Outbound */}
                        <h2 id="accordion-collapse-heading-3">
                            <button type="button"
                            class="flex items-center justify-between w-full p-3 pb-1 bg-white transition-all text-black font-normal"
                            data-accordion-target={`#accordion-collapse-body-${outbound.id}`} aria-expanded="true" aria-controls={`accordion-collapse-body-${outbound.id}`}>
                            <h6 className=" fs-6">{outbound.origin} <i className="bi bi-arrow-right"></i> {outbound.destination} <span className="text-sm">{formatDate(outbound.departureTime)}</span></h6>
                            <svg data-accordion-icon class="w-3 h-3 rotate-180 shrink-0 font-normal" xmlns="http://www.w3.org/2000/svg" fill="none"
                                viewBox="0 0 10 6">
                                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M9 5 5 1 1 5" />
                            </svg>
                            </button>
                        </h2>
                        <div id={`accordion-collapse-body-${outbound.id}`} class="hidden" aria-labelledby="accordion-collapse-heading-3">
                            <div class="p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                                <div className="d-block">
                                    <h6 className="fs-6">{formatTime(outbound.departureTime)} - {formatTime(outbound.arrivalTime)}</h6>
                                    <span className="text-sm">{getAirportName(outbound.origin)} - {getAirportName(outbound.destination)}</span>

                                    <div className="text-xs text-muted mt-1 justify-content-between d-flex">
                                        <span className="text-start d-flex gap-1">
                                            <img
                                            src={getAirlineLogo(outbound.airline)}
                                            alt={getAirlineName(outbound.airline)}
                                            className="" style={{ height: '15px' }}
                                            />
                                            {getAirlineName(outbound.airline) || 'N/A'}
                                        </span>
                                        <span className="text-end">{outbound.flightNumber || 'N/A'}</span>
                                    </div>

                                    <div className="text-xs text-muted mt-1 justify-content-between d-flex">
                                        <span className="text-start"><i className="bi bi-airplane"></i> Plane type</span>
                                        <span className="text-end">{outbound.planeType || 'N/A'}</span>
                                    </div>
                                    
                                    <div className="text-xs text-muted mt-1 justify-content-between d-flex">
                                        <span className="text-start">Class</span>
                                        <span className="text-end">{outbound.cabin || 'Economy'}</span>
                                    </div>

                                    <div className="text-xs text-muted mt-1 justify-content-between d-flex">
                                        <span className="text-start"><i className="bi bi-suitcase2"></i> Baggage</span>
                                        <span className="text-end">{outbound.baggage || 'N/A'}</span>
                                    </div>

                                    <div className="text-xs text-muted mt-1 justify-content-between d-flex">
                                        <span className="text-start"><i className="bi bi-suitcase2"></i> Cabin Baggage</span>
                                        <span className="text-end">{outbound.cabin_baggage || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Divider */}
                        <hr class="border-t mb-1 mt-1 border-gray-200 dark:border-gray-700" />

                        {/* Return Flight */}
                        {tripType === 'return' && returnFlight && (
                            <div>
                                <h2 id="accordion-collapse-heading-3">
                                    <button type="button"
                                    class="flex items-center justify-between w-full p-3 pb-1 bg-white transition-all text-black font-normal"
                                    data-accordion-target={`#accordion-collapse-body-${returnFlight.id}`} aria-expanded="true" aria-controls={`accordion-collapse-body-${returnFlight.id}`}>
                                    <h6 className=" fs-6">{returnFlight.origin} <i className="bi bi-arrow-right"></i> {returnFlight.destination} <span className="text-sm">{formatDate(returnFlight.departureTime)}</span></h6>
                                    <svg data-accordion-icon class="w-3 h-3 rotate-180 shrink-0 font-normal" xmlns="http://www.w3.org/2000/svg" fill="none"
                                        viewBox="0 0 10 6">
                                        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M9 5 5 1 1 5" />
                                    </svg>
                                    </button>
                                </h2>
                                <div id={`accordion-collapse-body-${returnFlight.id}`} class="hidden" aria-labelledby="accordion-collapse-heading-3">
                                    <div class="p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                                        <div className="d-block">
                                            <h6 className="fs-6">{formatTime(returnFlight.departureTime)} - {formatTime(returnFlight.arrivalTime)}</h6>
                                            <span className="text-sm">{getAirportName(returnFlight.origin)} - {getAirportName(returnFlight.destination)}</span>

                                            <div className="text-xs text-muted mt-1 justify-content-between d-flex">
                                                <span className="text-start d-flex gap-1">
                                                    <img
                                                    src={getAirlineLogo(returnFlight.airline)}
                                                    alt={getAirlineName(returnFlight.airline)}
                                                    className="" style={{ height: '15px' }}
                                                    />
                                                    {getAirlineName(returnFlight.airline) || 'N/A'}
                                                </span>
                                                <span className="text-end">{returnFlight.flightNumber || 'N/A'}</span>
                                            </div>

                                            <div className="text-xs text-muted mt-1 justify-content-between d-flex">
                                                <span className="text-start"><i className="bi bi-airplane"></i> Plane type</span>
                                                <span className="text-end">{returnFlight.planeType || 'N/A'}</span>
                                            </div>
                                            
                                            <div className="text-xs text-muted mt-1 justify-content-between d-flex">
                                                <span className="text-start">Class</span>
                                                <span className="text-end">{returnFlight.cabin || 'Economy'}</span>
                                            </div>

                                            <div className="text-xs text-muted mt-1 justify-content-between d-flex">
                                                <span className="text-start"><i className="bi bi-suitcase2"></i> Baggage</span>
                                                <span className="text-end">{returnFlight.baggage || 'N/A'}</span>
                                            </div>

                                            <div className="text-xs text-muted mt-1 justify-content-between d-flex">
                                                <span className="text-start"><i className="bi bi-suitcase2"></i> Cabin Baggage</span>
                                                <span className="text-end">{returnFlight.cabin_baggage || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Price Summary */}
                    <div className="price-summary">

                        {/* Price */}
                        <div className="d-flex justify-content-between align-items-center mt-2">
                            <span className="text-start text-sm font-semibold">Price</span>
                            <span className="text-end text-sm font-semibold">
                                ${totalPrice.toFixed(2)}
                            </span>
                        </div>

                        {/* Agent Service */}
                        <div className="d-flex justify-content-between align-items-center mt-2">
                            <span className="text-start text-sm font-semibold">Agent Service Fee</span>
                            <span className="text-end text-sm font-semibold">
                                + $
                                <input
                                    id="agent_fee"
                                    type="phone"
                                    value={agentFee}
                                    onChange={(e) => {
                                        const raw = e.target.value.replace(/[^0-9]/g, '');
                                        const cleaned = raw.replace(/^0+(?=\d)/, ''); // remove leading zeros, but not the only 0
                                        setAgentFee(cleaned === '' ? 0 : parseFloat(cleaned));
                                    }}
                                    className="p-0 appearance-none w-[35px] bg-transparent border-none text-black focus:outline-none focus:ring-0 text-sm"
                                />
                            </span>
                        </div>

                        {/* Booking Total */}
                        <div className="d-flex justify-content-between align-items-center mt-1">
                            <span className="text-start text-lg font-semibold">Total</span>
                            <span className="text-end text-lg font-bold">
                                ${(finalPrice + agentFee).toFixed(2)}
                            </span>
                        </div>
                    </div>

                  </div>
                </div>
              </motion.div>

            </div>
          </div>

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