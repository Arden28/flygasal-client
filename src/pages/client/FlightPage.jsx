import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { airports, airlines } from '../../data/fakeData';
import FilterModal from '../../components/client/FilterModal';
import FlightHeader from '../../components/client/FlightHeader';
import SortNavigation from '../../components/client/SortNavigation';
import ItineraryList from '../../components/client/ItineraryList';
import Pagination from '../../components/client/Pagination';
import FlightSearchForm from '../../components/client/FlightSearchForm';
import flygasal from '../../api/flygasalService';
import { motion, AnimatePresence } from 'framer-motion';

// FlightPage component displays flight search results based on URL parameters
const FlightPage = () => {
  // State for search parameters, flights, filters, and UI controls
  const [searchParams, setSearchParams] = useState(null);
  const [searchKey, setSearchKey] = useState(null);
  const [availableFlights, setAvailableFlights] = useState([]);
  const [returnFlights, setReturnFlights] = useState([]);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(10000);
  const [currentStop, setCurrentStop] = useState('mix');
  const [checkedOnewayValue, setCheckedOnewayValue] = useState([]);
  const [checkedReturnValue, setCheckedReturnValue] = useState([]);
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [openDetailsId, setOpenDetailsId] = useState(null);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isSearchFormVisible, setIsSearchFormVisible] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(900); // 15 minutes in seconds
  const [isExpired, setIsExpired] = useState(false);
  const flightsPerPage = 25;
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  // Format timer display (e.g., "14:32")
  const formatTimer = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Helper to format date (e.g., "Wed, 15 Dec")
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const formatToYMD = (dateInput) => {
    const date = new Date(dateInput);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper to format time (e.g., "8:00 PM")
  const formatTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  // Helper to format time (e.g., "8:00")
  const formatTimeOnly = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString)
      .toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: false });
  };

  // Calculate trip duration (e.g., "2h 45m")
  const calculateDuration = (departure, arrival) => {
    const depart = new Date(departure);
    const arrive = new Date(arrival);
    const diff = (arrive - depart) / (1000 * 60);
    const hours = Math.floor(diff / 60);
    const minutes = Math.round(diff % 60);
    return `${hours}h ${minutes}m`;
  };

  // Get airport name from code
  const getAirportName = (code) => {
    const airport = airports.find((a) => a.value === code);
    return airport ? `${airport.label}` : code;
  };

  // Get airline name from code
  const getAirlineName = (code) => {
    const airline = airlines.find((a) => a.code === code);
    return airline ? airline.name : code;
  };

  // Get airline logo from code
  const getAirlineLogo = (code) => {
    const airline = airlines.find((a) => a.code === code);
    return airline ? code : code;
    // return airline ? airline.logo : code;
  };

  // Toggle search form visibility
  const toggleSearchForm = () => {
    setIsSearchFormVisible(!isSearchFormVisible);
  };

  // Fetch flights and start timer
  useEffect(() => {
    setLoading(true);
    setIsExpired(false);
    setTimeRemaining(900); // Reset timer to 15 minutes

    const fetchFlights = async () => {
      // Parse query parameters from URL
      const queryParams = new URLSearchParams(location.search);
      const flightsFromUrl = [];
      let i = 0;

      // Extract flight legs from URL
      while (queryParams.has(`flights[${i}][origin]`)) {
        flightsFromUrl.push({
          origin: queryParams.get(`flights[${i}][origin]`),
          destination: queryParams.get(`flights[${i}][destination]`),
          depart: queryParams.get(`flights[${i}][depart]`),
        });
        i++;
      }

      // Build search parameters
      const flight = flightsFromUrl.length > 0 ? flightsFromUrl[0] : { origin: 'HKG', destination: 'BKK', depart: '2024-12-15' };
      const params = {
        flights: flightsFromUrl.length > 0 ? flightsFromUrl : [{ origin: 'HKG', destination: 'BKK', depart: '2024-12-15' }],
        tripType: queryParams.get('tripType') || 'Oneway',
        cabinType: queryParams.get('flightType') || 'economy',
        origin: flight.origin,
        destination: flight.destination,
        departureDate: flight.depart,
        returnDate: queryParams.get('returnDate') || null,
        adults: parseInt(queryParams.get('adults')) || 1,
        children: parseInt(queryParams.get('children')) || 0,
        infants: parseInt(queryParams.get('infants')) || 0,
      };

      setSearchParams(params);

      try {
        // Fetch flights from PKfare via flygasal service
        const response = await flygasal.searchFlights(params);
        const pkData = response.data;
        const searchKey = pkData.searchKey;
        const outbound = flygasal.transformPKFareData(pkData);

        let returnFlights = [];

        // Handle return flights if tripType is 'return'
        if (params.tripType === 'return' && params.returnDate) {
          const returnParams = {
            ...params,
            flights: [{ origin: params.destination, destination: params.origin, depart: params.returnDate }],
          };
          const returnResponse = await flygasal.searchFlights(returnParams);
          returnFlights = flygasal.transformPKFareData(returnResponse.data);
        }

        // Set search key
        setSearchKey(searchKey);
        queryParams.set("searchKey", searchKey);
        const newUrl = `${window.location.pathname}?${queryParams.toString()}`;
        window.history.pushState(null, "", newUrl);

        setAvailableFlights(outbound);
        setReturnFlights(returnFlights);

        // Update price range based on fetched flights
        const allPrices = [...outbound, ...returnFlights].map(f => f.price).filter(Boolean);
        if (allPrices.length > 0) {
          setMinPrice(Math.floor(Math.min(...allPrices)));
          setMaxPrice(Math.ceil(Math.max(...allPrices)));
        }
      } catch (error) {
        console.error('Failed to fetch flights:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFlights();

    // Start timer
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsExpired(true);
          setAvailableFlights([]);
          setReturnFlights([]);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Cleanup timer on unmount or new search
    return () => clearInterval(timer);
  }, [location.search]);

  // Combine flights into itineraries for display
  const getItineraries = () => {
    if (searchParams?.tripType === 'return') {
      const itineraries = [];
      availableFlights.forEach((outbound) => {
        returnFlights.forEach((returnFlight) => {
          itineraries.push({
            id: `${outbound.id}-${returnFlight.id}`,
            outbound,
            return: returnFlight,
            totalPrice: outbound.price + returnFlight.price,
            totalStops: outbound.stops + returnFlight.stops,
            airlines: [...new Set([outbound.airline, returnFlight.airline])],
            cabin: outbound.segments[0]?.cabinClass || 'Economy',
            baggage: outbound.segments[0]?.baggage || '1PC 7KG carry-on',
            refundable: false, // PKfare miniRules indicate non-refundable (isPermited: 0)
          });
        });
      });
      return itineraries;
    }
    return availableFlights.map((flight) => ({
      id: flight.id,
      outbound: flight,
      return: null,
      totalPrice: flight.price,
      totalStops: flight.stops,
      airlines: [flight.airline],
      cabin: flight.segments[0]?.cabinClass || 'Economy',
      baggage: flight.segments[0]?.baggage || '1PC 7KG carry-on',
      refundable: false,
    }));
  };

  // Filter and sort itineraries
  const filteredItineraries = getItineraries().filter((itinerary) => {
    const price = itinerary.totalPrice;
    const stopsMatch = currentStop === 'mix' || `oneway_${itinerary.totalStops}` === currentStop;
    const onewayAirlinesMatch =
      checkedOnewayValue.length === 0 ||
      itinerary.airlines.some((airline) => checkedOnewayValue.includes(`oneway_${airline}`));
    const returnAirlinesMatch =
      checkedReturnValue.length === 0 ||
      itinerary.airlines.some((airline) => checkedReturnValue.includes(`return_${airline}`));
    return price >= minPrice && price <= maxPrice && stopsMatch && onewayAirlinesMatch && returnAirlinesMatch;
  }).sort((a, b) => {
    return sortOrder === 'asc' ? a.totalPrice - b.totalPrice : b.totalPrice - a.totalPrice;
  });

  // Handle pagination
  const handlePageChange = (page) => {
    if (page >= 1 && page <= Math.ceil(filteredItineraries.length / flightsPerPage)) {
      setCurrentPage(page);
      window.scrollTo({
        top: document.getElementById('flight--list-targets').getBoundingClientRect().top + window.pageYOffset - 250,
        behavior: 'smooth',
      });
    }
  };

  // Handle price range filter
  const handlePriceChange = (value) => {
    setMinPrice(value[0]);
    setMaxPrice(value[1]);
    setCurrentPage(1);
    window.scrollTo({
      top: document.getElementById('flight--list-targets').getBoundingClientRect().top + window.pageYOffset - 250,
      behavior: 'smooth',
    });
  };

  // Handle stop filter
  const handleStopChange = (value) => {
    setCurrentStop(value);
    setCurrentPage(1);
    window.scrollTo({
      top: document.getElementById('flight--list-targets').getBoundingClientRect().top + window.pageYOffset - 250,
      behavior: 'smooth',
    });
  };

  // Handle one-way airline filter
  const handleOnewayChange = (e, airline) => {
    const value = `oneway_${airline}`;
    setCheckedOnewayValue((prev) =>
      e.target.checked ? [...prev, value] : prev.filter((v) => v !== value)
    );
    setCurrentPage(1);
    window.scrollTo({
      top: document.getElementById('flight--list-targets').getBoundingClientRect().top + window.pageYOffset - 250,
      behavior: 'smooth',
    });
  };

  // Handle return airline filter
  const handleReturnChange = (e, airline) => {
    const value = `return_${airline}`;
    setCheckedReturnValue((prev) =>
      e.target.checked ? [...prev, value] : prev.filter((v) => v !== value)
    );
    setCurrentPage(1);
    window.scrollTo({
      top: document.getElementById('flight--list-targets').getBoundingClientRect().top + window.pageYOffset - 250,
      behavior: 'smooth',
    });
  };

  // Handle sort order change
  const handleSortChange = (order) => {
    setSortOrder(order);
    setCurrentPage(1);
  };

  // Get unique airlines for filter
  const uniqueAirlines = [...new Set([...availableFlights, ...returnFlights].map((flight) => flight.airline))];

  return (
    <div className="" style={{ paddingTop: '120px' }}>
      <AnimatePresence>
        {isSearchFormVisible && (
          <motion.div
            className="p-3 mb-0"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <div className="container border rounded-4 p-3">
              <div className="flights_listing modify_search">
                <FlightSearchForm
                  searchParams={searchParams}
                  setAvailableFlights={setAvailableFlights}
                  setReturnFlights={setReturnFlights}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="position-relative container-fluid pt-4 pb-4">
        <div className="container">
          <div className="row g-3">
            <div className="col-lg-12">

              {isExpired ? (
                <div className="bg-red-100 border border-red-300 rounded-lg p-4 text-center text-red-700">
                  Search results have expired. Please search again using the form above.
                </div>
              ) : (
                <>
                  <FlightHeader
                    onOpen={() => setIsFilterModalOpen(true)}
                    filteredItineraries={filteredItineraries}
                    searchParams={searchParams}
                    formatDate={formatDate}
                    loading={loading}
                  />

                  {/* Timer */}
                  <motion.div
                    className="flex justify-content-between gap-2 bg-white border border-gray-300 rounded-lg py-2 px-4 mb-4 text-sm text-gray-700"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    
                    <span className='text-start'><i className="bi bi-clock"></i> Time Remaining</span>
                    <span className="text-end fw-bold">
                      {formatTimer(timeRemaining)}
                    </span>
                  </motion.div>

                  {/* Sort Navigation */}
                  <SortNavigation
                    sortOrder={sortOrder}
                    handleSortChange={handleSortChange}
                    isSearchFormVisible={isSearchFormVisible}
                    toggleSearchForm={toggleSearchForm}
                  />
                  <ItineraryList
                    paginatedItineraries={filteredItineraries.slice(
                      (currentPage - 1) * flightsPerPage,
                      currentPage * flightsPerPage
                    )}
                    searchParams={searchParams}
                    openDetailsId={openDetailsId}
                    setOpenDetailsId={setOpenDetailsId}
                    getAirlineLogo={getAirlineLogo}
                    getAirlineName={getAirlineName}
                    formatToYMD={formatToYMD}
                    formatDate={formatDate}
                    formatTime={formatTime}
                    formatTimeOnly={formatTimeOnly}
                    calculateDuration={calculateDuration}
                    getAirportName={getAirportName}
                    availableFlights={availableFlights}
                    returnFlights={returnFlights}
                    loading={loading}
                  />
                  <Pagination
                    currentPage={currentPage}
                    totalPages={Math.ceil(filteredItineraries.length / flightsPerPage)}
                    handlePageChange={handlePageChange}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        currentStop={currentStop}
        handleStopChange={handleStopChange}
        minPrice={minPrice}
        maxPrice={maxPrice}
        handlePriceChange={handlePriceChange}
        uniqueAirlines={uniqueAirlines}
        checkedOnewayValue={checkedOnewayValue}
        handleOnewayChange={handleOnewayChange}
        checkedReturnValue={checkedReturnValue}
        handleReturnChange={handleReturnChange}
        getAirlineName={getAirlineName}
        getAirlineLogo={getAirlineLogo}
        returnFlights={returnFlights}
      />
    </div>
  );
};

export default FlightPage;