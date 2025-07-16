import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ItineraryList from './ItineraryList';
import flightData from '../data/fakeData';

const FlightPage = () => {
  const location = useLocation();
  const [availableFlights, setAvailableFlights] = useState([]);
  const [returnFlights, setReturnFlights] = useState([]);
  const [paginatedItineraries, setPaginatedItineraries] = useState([]);
  const [openDetailsId, setOpenDetailsId] = useState(null);

  // Utility functions for ItineraryList
  const getAirlineLogo = (airlineCode) => {
    const airlineMap = {
      AA: 'https://example.com/airlines/aa.png',
      DL: 'https://example.com/airlines/dl.png',
      UA: 'https://example.com/airlines/ua.png',
    };
    return airlineMap[airlineCode] || 'https://example.com/airlines/default.png';
  };

  const getAirlineName = (airlineCode) => {
    const airlineMap = {
      AA: 'American Airlines',
      DL: 'Delta Air Lines',
      UA: 'United Airlines',
    };
    return airlineMap[airlineCode] || airlineCode;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const calculateDuration = (departureTime, arrivalTime) => {
    const depart = new Date(departureTime);
    const arrive = new Date(arrivalTime);
    const diffMs = arrive - depart;
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.round((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const getAirportName = (airportCode) => {
    const airportMap = {
      JFK: 'John F. Kennedy International',
      LAX: 'Los Angeles International',
      MIA: 'Miami International',
    };
    return airportMap[airportCode] || airportCode;
  };

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tripType = searchParams.get('tripType') || 'oneway';
    const origin = searchParams.get('flights[0][origin]')?.toLowerCase();
    const destination = searchParams.get('flights[0][destination]')?.toLowerCase();
    const departDate = searchParams.get('flights[0][depart]');
    const returnDate = searchParams.get('returnDate');
    const adults = parseInt(searchParams.get('adults')) || 1;
    const children = parseInt(searchParams.get('children')) || 0;
    const cabin = searchParams.get('cabin') || 'Economy';

    // Filter flights
    const filteredFlights = flightData.filter(
      (flight) =>
        flight.origin.toLowerCase() === origin &&
        flight.destination.toLowerCase() === destination &&
        flight.date === departDate &&
        flight.cabin.toLowerCase() === cabin.toLowerCase()
    );

    setAvailableFlights(filteredFlights);

    const filteredReturnFlights = tripType === 'return' && returnDate
      ? flightData.filter(
          (flight) =>
            flight.origin.toLowerCase() === destination &&
            flight.destination.toLowerCase() === origin &&
            flight.date === returnDate &&
            flight.cabin.toLowerCase() === cabin.toLowerCase()
        )
      : [];

    setReturnFlights(filteredReturnFlights);

    // Construct itineraries
    const itineraries = filteredFlights.map((outbound, index) => ({
      id: `itinerary-${index}`,
      outbound,
      return: filteredReturnFlights[index] || null,
      airlines: [outbound.airline, ...(filteredReturnFlights[index] ? [filteredReturnFlights[index].airline] : [])],
      totalStops: outbound.stops + (filteredReturnFlights[index] ? filteredReturnFlights[index].stops : 0),
      totalPrice: outbound.price + (filteredReturnFlights[index] ? filteredReturnFlights[index].price : 0),
      adults,
      children,
    }));

    setPaginatedItineraries(itineraries);
  }, [location.search]);

  return (
    <div className="container py-4">
      <h2 className="font-700 mb-4">Flight Results</h2>
      <ItineraryList
        paginatedItineraries={paginatedItineraries}
        openDetailsId={openDetailsId}
        setOpenDetailsId={setOpenDetailsId}
        getAirlineLogo={getAirlineLogo}
        getAirlineName={getAirlineName}
        formatDate={formatDate}
        formatTime={formatTime}
        calculateDuration={calculateDuration}
        getAirportName={getAirportName}
        availableFlights={availableFlights}
        returnFlights={returnFlights}
      />

      
                {/* Right Column: Trip Summary */}
                <div className="w-full lg:w-1/3">
                  <div className="sticky top-4">
                    <motion.div
                      className="bg-gradient-to-b from-blue-900 to-blue-950 border-2 border-gray-600 rounded-sm p-4"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.6 }}
                    >
                      <h3 className="text-2xl font-bold text-white uppercase tracking-tight mb-4">Flight Itinerary</h3>
                      <div className="space-y-4">
                        {/* Outbound Flight */}
                        <div>
                          <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M22 2L11 13L9 22L2 20L20 2" />
                            </svg>
                            <h4 className="text-lg font-bold text-white uppercase">Outbound: {getAirportCity(outbound.origin)} → {getAirportCity(outbound.destination)}</h4>
                          </div>
                          <div className="grid grid-cols-2 gap-2 mt-2 text-sm text-gray-200">
                            <div>
                              <span className="text-gray-400">Flight:</span> {outbound.flightNumber || 'N/A'}
                            </div>
                            <div>
                              <span className="text-gray-400">Airline:</span> {getAirlineName(outbound.airline)}
                            </div>
                            <div>
                              <span className="text-gray-400">Depart:</span> {formatTime(outbound.departureTime)}
                            </div>
                            <div>
                              <span className="text-gray-400">Arrive:</span> {formatTime(outbound.arrivalTime)}
                            </div>
                            <div>
                              <span className="text-gray-400">Duration:</span> {outbound.duration || 'N/A'}
                            </div>
                            <div>
                              <span className="text-gray-400">Class:</span> {outbound.cabin || 'Economy'}
                            </div>
                            <div>
                              <span className="text-gray-400">Baggage:</span> {outbound.baggage || '23kg'}
                            </div>
                            <div>
                              <span className="text-gray-400">Cabin Bag:</span> {outbound.cabin_baggage || '7kg'}
                            </div>
                          </div>
                          {outbound.stopoverAirportCodes?.length > 0 && (
                            <div className="mt-2">
                              <button
                                type="button"
                                onClick={() => setOpenStopovers(prev => ({ ...prev, outbound: !prev.outbound }))}
                                className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm"
                              >
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M6 9l6 6 6-6" />
                                </svg>
                                {openStopovers.outbound ? 'Hide Stopovers' : 'Show Stopovers'}
                              </button>
                              <AnimatePresence>
                                {openStopovers.outbound && (
                                  <motion.div
                                    className="mt-2 text-sm text-gray-200"
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                  >
                                    {outbound.stopoverAirportCodes.map((stop, idx) => (
                                      <div key={idx} className="flex items-center gap-2">
                                        <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                          <circle cx="12" cy="12" r="2" />
                                        </svg>
                                        <span>{getAirportCity(stop)} - Layover: 2h</span>
                                      </div>
                                    ))}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          )}
                        </div>
      
                        {/* Return Flight */}
                        {tripType === 'return' && returnFlight && (
                          <div className="border-t border-gray-600 pt-4">
                            <div className="flex items-center gap-2">
                              <svg className="w-5 h-5 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M22 2L11 13L9 22L2 20L20 2" />
                              </svg>
                              <h4 className="text-lg font-bold text-white uppercase">Return: {getAirportCity(returnFlight.origin)} → {getAirportCity(returnFlight.destination)}</h4>
                            </div>
                            <div className="grid grid-cols-2 gap-2 mt-2 text-sm text-gray-200">
                              <div>
                                <span className="text-gray-400">Flight:</span> {returnFlight.flightNumber || 'N/A'}
                              </div>
                              <div>
                                <span className="text-gray-400">Airline:</span> {getAirlineName(returnFlight.airline)}
                              </div>
                              <div>
                                <span className="text-gray-400">Depart:</span> {formatTime(returnFlight.departureTime)}
                              </div>
                              <div>
                                <span className="text-gray-400">Arrive:</span> {formatTime(returnFlight.arrivalTime)}
                              </div>
                              <div>
                                <span className="text-gray-400">Duration:</span> {returnFlight.duration || 'N/A'}
                              </div>
                              <div>
                                <span className="text-gray-400">Class:</span> {returnFlight.cabin || 'Economy'}
                              </div>
                              <div>
                                <span className="text-gray-400">Baggage:</span> {returnFlight.baggage || '23kg'}
                              </div>
                              <div>
                                <span className="text-gray-400">Cabin Bag:</span> {returnFlight.cabin_baggage || '7kg'}
                              </div>
                            </div>
                            {returnFlight.stopoverAirportCodes?.length > 0 && (
                              <div className="mt-2">
                                <button
                                  type="button"
                                  onClick={() => setOpenStopovers(prev => ({ ...prev, return: !prev.return }))}
                                  className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm"
                                >
                                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M6 9l6 6 6-6" />
                                  </svg>
                                  {openStopovers.return ? 'Hide Stopovers' : 'Show Stopovers'}
                                </button>
                                <AnimatePresence>
                                  {openStopovers.return && (
                                    <motion.div
                                      className="mt-2 text-sm text-gray-200"
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ duration: 0.3 }}
                                    >
                                      {returnFlight.stopoverAirportCodes.map((stop, idx) => (
                                        <div key={idx} className="flex items-center gap-2">
                                          <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="12" cy="12" r="2" />
                                          </svg>
                                          <span>{getAirportCity(stop)} - Layover: 2h</span>
                                        </div>
                                      ))}
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            )}
                          </div>
                        )}
      
                        {/* Price Summary */}
                        <div className="border-t border-gray-600 pt-4">
                          <h4 className="text-lg font-bold text-white uppercase tracking-tight">Mission Cost</h4>
                          <div className="grid grid-cols-2 gap-2 mt-2 text-sm text-gray-200 font-mono">
                            <div>Base Fare:</div>
                            <div>USD {totalPrice.toFixed(2)}</div>
                            {isAgent && (
                              <>
                                <div>Agent Fee:</div>
                                <div>
                                  <input
                                    id="agent_fee"
                                    type="number"
                                    value={agentFee}
                                    onChange={(e) => setAgentFee(parseFloat(e.target.value.replace(/[^0-9]/g, '')) || 0)}
                                    className="w-20 bg-gray-700 border-2 border-gray-500 text-white p-1 rounded-sm focus:ring-2 focus:ring-blue-400 text-right font-mono"
                                    min="0"
                                  />
                                </div>
                              </>
                            )}
                            <div>VAT:</div>
                            <div>0%</div>
                            <div className="font-bold text-blue-300">Total:</div>
                            <div className="font-bold text-blue-300">USD {(finalPrice + agentFee).toFixed(2)}</div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </div>
    </div>




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
  );
};

export default FlightPage;