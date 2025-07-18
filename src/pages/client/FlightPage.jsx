import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { airports, airlines, flights } from '../../data/fakeData';
import FilterModal from '../../components/client/FilterModal';
import FlightHeader from '../../components/client/FlightHeader';
import SortNavigation from '../../components/client/SortNavigation';
import ItineraryList from '../../components/client/ItineraryList';
import Pagination from '../../components/client/Pagination';
import FlightSearchForm from '../../components/client/FlightSearchForm';

const FlightPage = () => {
  const [searchParams, setSearchParams] = useState(null);
  const [availableFlights, setAvailableFlights] = useState([]);
  const [returnFlights, setReturnFlights] = useState([]);
  const [minPrice, setMinPrice] = useState(100);
  const [maxPrice, setMaxPrice] = useState(4000);
  const [currentStop, setCurrentStop] = useState('mix');
  const [checkedOnewayValue, setCheckedOnewayValue] = useState([]);
  const [checkedReturnValue, setCheckedReturnValue] = useState([]);
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [openDetailsId, setOpenDetailsId] = useState(null);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const flightsPerPage = 25;
  const location = useLocation();

  // Helper to format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  // Helper to format time
  const formatTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
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

  // Get airport and airline details
  const getAirportName = (code) => {
    const airport = airports.find((a) => a.value === code);
    return airport ? `${airport.city} (${airport.value})` : code;
  };

  const getAirlineName = (code) => {
    const airline = airlines.find((a) => a.code === code);
    return airline ? airline.name : code;
  };

  const getAirlineLogo = (code) => {
    const airline = airlines.find((a) => a.code === code);
    return airline ? airline.logo : code;
  };

  // Load search parameters and filter flights from URL
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const flightsFromUrl = [];
    let i = 0;
    while (queryParams.has(`flights[${i}][origin]`)) {
      flightsFromUrl.push({
        origin: queryParams.get(`flights[${i}][origin]`),
        destination: queryParams.get(`flights[${i}][destination]`),
        depart: queryParams.get(`flights[${i}][depart]`),
      });
      i++;
    }

    const params = {
      tripType: queryParams.get('tripType') || 'oneway',
      flightType: queryParams.get('flightType') || 'economy',
      flights: flightsFromUrl.length > 0 ? flightsFromUrl : [{ origin: 'JFK', destination: 'LAX', depart: '2025-07-15' }],
      returnDate: queryParams.get('returnDate') || '2025-07-20',
      adults: parseInt(queryParams.get('adults')) || 1,
      children: parseInt(queryParams.get('children')) || 0,
      infants: parseInt(queryParams.get('infants')) || 0,
    };

    setSearchParams(params);

    const outbound = flights.filter((flight) =>
      params.flights.some(
        (f) =>
          f.origin === flight.origin &&
          f.destination === flight.destination &&
          new Date(f.depart).toDateString() === new Date(flight.departureTime).toDateString()
      )
    );

    let returnFlights = [];
    if (params.tripType === 'return' && params.flights[0]) {
      returnFlights = flights.filter(
        (flight) =>
          flight.origin === params.flights[0].destination &&
          flight.destination === params.flights[0].origin &&
          new Date(params.returnDate).toDateString() === new Date(flight.departureTime).toDateString()
      );
    }

    setAvailableFlights(outbound);
    setReturnFlights(returnFlights);
  }, [location.search]);

  // Combine flights into itineraries for round-trip searches
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

  // Handle price range change
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

  // Handle airline filter
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

  // Handle sort change
  const handleSortChange = (order) => {
    setSortOrder(order);
    setCurrentPage(1);
  };

  // Unique airlines
  const uniqueAirlines = [...new Set([...availableFlights, ...returnFlights].map((flight) => flight.airline))];

  return (
    <div className="" style={{ paddingTop: '120px' }}>
      <div className="p-3 mb-0">
        <div className="container border rounded-4 p-3">
          <div className="flights_listing modify_search">
            <FlightSearchForm
              searchParams={searchParams}
              setAvailableFlights={setAvailableFlights}
              setReturnFlights={setReturnFlights}
            />
          </div>
        </div>
      </div>

      <div className="position-relative container-fluid pt-4 pb-4">
        <div className="container">
          <div className="row g-3">
            <div className="col-lg-12">
              <div className="flex justify-between items-center mb-4 md:mb-0">
                <button
                  className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-200 flex items-center gap-2"
                  onClick={() => setIsFilterModalOpen(true)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="4" y1="6" x2="20" y2="6"></line>
                    <line x1="4" y1="12" x2="20" y2="12"></line>
                    <line x1="4" y1="18" x2="20" y2="18"></line>
                    <circle cx="8" cy="6" r="1"></circle>
                    <circle cx="8" cy="12" r="1"></circle>
                    <circle cx="8" cy="18" r="1"></circle>
                  </svg>
                  Filters
                </button>
              </div>
              <FlightHeader
                filteredItineraries={filteredItineraries}
                searchParams={searchParams}
                formatDate={formatDate}
              />
              <SortNavigation sortOrder={sortOrder} handleSortChange={handleSortChange} />
              <ItineraryList
                paginatedItineraries={filteredItineraries.slice(
                  (currentPage - 1) * flightsPerPage,
                  currentPage * flightsPerPage
                )}
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
              <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(filteredItineraries.length / flightsPerPage)}
                handlePageChange={handlePageChange}
              />
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