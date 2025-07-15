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
  );
};

export default FlightPage;