import React, { useEffect, useState, useRef } from 'react';
import Slider from 'rc-slider';
import { motion, AnimatePresence } from 'framer-motion';
import { airports, airlines, flights } from '../../data/fakeData';
// import 'bootstrap/dist/css/bootstrap.min.css';
import 'rc-slider/assets/index.css';
// import './styles.css';

const FlightPage = () => {
  const [searchParams, setSearchParams] = useState(null);
  const [availableFlights, setAvailableFlights] = useState([]);
  const [returnFlights, setReturnFlights] = useState([]);
  const [minPrice, setMinPrice] = useState(100);
  const [maxPrice, setMaxPrice] = useState(1000);
  const [currentStop, setCurrentStop] = useState('mix');
  const [checkedOnewayValue, setCheckedOnewayValue] = useState([]);
  const [checkedReturnValue, setCheckedReturnValue] = useState([]);
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const flightsPerPage = 25;

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

  // Load search parameters and filter flights
  useEffect(() => {
    let params;
    try {
      params = JSON.parse(sessionStorage.getItem('flightSearch'));
    } catch (e) {
      console.error('Invalid sessionStorage data:', e);
    }
    if (!params) {
      params = {
        tripType: 'oneway',
        flights: [{ origin: 'JFK', destination: 'LAX', depart: '2025-07-15' }],
        returnDate: '2025-07-20',
      };
    }
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
  }, []);

  // Filter and sort flights
  const filteredFlights = [...availableFlights, ...returnFlights].filter((flight) => {
    const price = flight.price;
    if (currentStop === 'mix' && checkedOnewayValue.length === 0 && checkedReturnValue.length === 0) {
      return price >= minPrice && price <= maxPrice;
    }
    if (currentStop === 'mix' && checkedOnewayValue.length > 0 && checkedReturnValue.length > 0) {
      return (
        checkedOnewayValue.includes(`oneway_${flight.airline}`) &&
        checkedReturnValue.includes(`return_${flight.airline}`) &&
        price >= minPrice &&
        price <= maxPrice
      );
    }
    if (currentStop === 'mix' && checkedOnewayValue.length > 0) {
      return checkedOnewayValue.includes(`oneway_${flight.airline}`) && price >= minPrice && price <= maxPrice;
    }
    if (currentStop === 'mix' && checkedReturnValue.length > 0) {
      return checkedReturnValue.includes(`return_${flight.airline}`) && price >= minPrice && price <= maxPrice;
    }
    if (checkedOnewayValue.length > 0 && checkedReturnValue.length > 0) {
      return (
        checkedOnewayValue.includes(`oneway_${flight.airline}`) &&
        checkedReturnValue.includes(`return_${flight.airline}`) &&
        `oneway_${flight.stops}` === currentStop &&
        price >= minPrice &&
        price <= maxPrice
      );
    }
    if (checkedOnewayValue.length > 0) {
      return (
        checkedOnewayValue.includes(`oneway_${flight.airline}`) &&
        `oneway_${flight.stops}` === currentStop &&
        price >= minPrice &&
        price <= maxPrice
      );
    }
    if (checkedReturnValue.length > 0) {
      return (
        checkedReturnValue.includes(`return_${flight.airline}`) &&
        `oneway_${flight.stops}` === currentStop &&
        price >= minPrice &&
        price <= maxPrice
      );
    }
    if (currentStop === 'mix') {
      return price >= minPrice && price <= maxPrice;
    }
    return `oneway_${flight.stops}` === currentStop && price >= minPrice && price <= maxPrice;
  }).sort((a, b) => {
    return sortOrder === 'asc' ? a.price - b.price : b.price - a.price;
  });

  // Pagination
  const totalPages = Math.ceil(filteredFlights.length / flightsPerPage);
  const paginatedFlights = filteredFlights.slice(
    (currentPage - 1) * flightsPerPage,
    currentPage * flightsPerPage
  );

  // Scroll to flight details
  const moreDetails = (element) => {
    const target = element.closest('li.mix.all');
    if (target) {
      window.scrollTo({
        top: target.getBoundingClientRect().top + window.pageYOffset - 90,
        behavior: 'smooth',
      });
    }
  };

  // Handle pagination
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
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
    <div className="" style={{ paddingTop: '7%' }}>
      <div className="py-4 mb-0 bg-light d-none d-md-block">
        <div className="container">
          <div className="flights_listing modify_search">
            <div className="search-form-placeholder">
              <p>Search Form Placeholder</p>
            </div>
          </div>
        </div>
      </div>

      <div className="position-relative container-fluid pt-4 pb-4">
        <div className="container">
          <div className="row g-3">
            {/* Left Sidebar */}
            <div className="col-lg-3 d-none d-md-block">
              <div className="sticky-top sticky-bottom" style={{ top: '100px', bottom: '100px' }}>
                <div className="border-0 rounded-3">
                  <div className="pe-4">
                    <form>
                      <div className="sidebar mt-0">
                        {/* Stops Filter */}
                        <div className="sidebar-widget">
                          <div className="sidebar-box">
                            <p><strong>Flight Stops</strong></p>
                            <div className="box-content controls">
                              <ul className="list remove_duplication stop--radio-filter" style={{ maxHeight: '200px', overflow: 'hidden' }}>
                                <li>
                                  <div className="form-check">
                                    <input
                                      className="form-check-input filter"
                                      value="mix"
                                      type="radio"
                                      name="type"
                                      id="all"
                                      checked={currentStop === 'mix'}
                                      onChange={() => handleStopChange('mix')}
                                    />
                                    <label className="form-check-label w-100" htmlFor="all">All Flights</label>
                                  </div>
                                </li>
                                <li>
                                  <div className="form-check">
                                    <input
                                      className="form-check-input filter"
                                      type="radio"
                                      name="type"
                                      id="direct"
                                      value="oneway_0"
                                      checked={currentStop === 'oneway_0'}
                                      onChange={() => handleStopChange('oneway_0')}
                                    />
                                    <label className="form-check-label w-100" htmlFor="direct">Direct</label>
                                  </div>
                                </li>
                                <li>
                                  <div className="form-check">
                                    <input
                                      className="form-check-input filter"
                                      type="radio"
                                      name="type"
                                      id="stop1"
                                      value="oneway_1"
                                      checked={currentStop === 'oneway_1'}
                                      onChange={() => handleStopChange('oneway_1')}
                                    />
                                    <label className="form-check-label w-100" htmlFor="stop1">1 Stop</label>
                                  </div>
                                </li>
                                <li>
                                  <div className="form-check">
                                    <input
                                      className="form-check-input filter"
                                      type="radio"
                                      name="type"
                                      id="stop2"
                                      value="oneway_2"
                                      checked={currentStop === 'oneway_2'}
                                      onChange={() => handleStopChange('oneway_2')}
                                    />
                                    <label className="form-check-label w-100" htmlFor="stop2">2 Stops</label>
                                  </div>
                                </li>
                              </ul>
                            </div>
                          </div>
                        </div>
                        {/* Price Range Filter */}
                        <div className="sidebar-widget controls">
                          <p className="mt-3"><strong>Price Range (USD)</strong></p>
                          <div className="sidebar-price-range">
                            <div className="range-sliderrr">
                              <Slider
                                range
                                min={100}
                                max={1000}
                                defaultValue={[100, 1000]}
                                onChange={handlePriceChange}
                                trackStyle={{ backgroundColor: '#007bff' }}
                                handleStyle={{ borderColor: '#007bff' }}
                              />
                              <div className="d-flex justify-content-between mt-2">
                                <span>${minPrice}</span>
                                <span>${maxPrice}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        {/* Oneway Airlines Filter */}
                        <div className="sidebar-box mb-2 controls">
                          <p className="mt-3"><strong>Oneway Airlines</strong></p>
                          <ul className="list remove_duplication checkbox-group oneway--checkbox-filter" style={{ maxHeight: '300px', overflow: 'hidden', overflowY: 'auto', marginTop: '18px' }}>
                            {uniqueAirlines.map((airline, index) => (
                                <li key={`oneway_flights_${index}`}>
                                    <div className="form-check flights_line d-flex gap-2">
                                    <input
                                        className="form-check-input filter"
                                        type="checkbox"
                                        id={`oneway_flights_${index + 1}`}
                                        value={`oneway_${airline}`}
                                        checked={checkedOnewayValue.includes(`oneway_${airline}`)}
                                        onChange={(e) => handleOnewayChange(e, airline)}
                                    />
                                    <label className="form-check-label d-flex gap-1 w-100 text--overflow" htmlFor={`oneway_flights_${index + 1}`}>
                                        <img
                                        className="lazyload"
                                        src={getAirlineLogo(airline)}
                                        style={{ background: 'transparent', maxWidth: '20px', maxHeight: '20px', paddingTop: '0px', margin: '0 6px' }}
                                        alt={getAirlineName(airline)}
                                        />
                                        {getAirlineName(airline)}
                                    </label>
                                    </div>
                                </li>
                            ))}
                          </ul>
                        </div>
                        {/* Return Airlines Filter */}
                        {returnFlights.length > 0 && (
                          <div className="sidebar-box mb-4 controls return--check">
                            <p className="mt-3"><strong>Return Airlines</strong></p>
                            <ul className="list checkbox-group return--checkbox-filter">
                              {uniqueAirlines.map((airline, index) => (
                                <li key={`return_flights_${index}`}>
                                  <div className="form-check flights_line d-flex gap-2">
                                    <input
                                      className="form-check-input filter"
                                      type="checkbox"
                                      id={`return_flights_${index + 1}`}
                                      value={`return_${airline}`}
                                      checked={checkedReturnValue.includes(`return_${airline}`)}
                                      onChange={(e) => handleReturnChange(e, airline)}
                                    />
                                    <label className="form-check-label d-flex gap-1 w-100 text--overflow" htmlFor={`return_flights_${index + 1}`}>
                                      <img
                                        className="lazyload"
                                        src={getAirlineLogo(airline)}
                                        style={{ background: 'transparent', maxWidth: '20px', maxHeight: '20px', paddingTop: '0px', margin: '0 6px' }}
                                        alt={getAirlineName(airline)}
                                      />
                                      {getAirlineName(airline)}
                                    </label>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
            {/* Right Content */}
            <div className="col-lg-9">
              <div className="new-m-main-tit__content flex1 mb-3" style={{ background: "url('/assets/img/flight_search.avif') center bottom -212px / cover, rgb(50, 100, 255)" }}>
                <div className="stacked-color"></div>
                <div className="flex tit-travel-restriction-wrapper">
                  <h4 className="new-main-tit mx-2 fs-5 fw-light">
                    <span className="j_listABTit"><small>{filteredFlights.length} Flights Found</small></span>
                  </h4>
                  <span className="title__fetched-time gap-2 d-flex" style={{ color: 'rgb(255, 255, 255)' }}>
                        <span>
                            {searchParams?.flights[0]?.origin || 'JFK'}
                        </span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h13M12 5l7 7-7 7"/></svg> 
                        <span>
                            {searchParams?.flights[0]?.destination || 'LAX'}
                        </span>
                    <span>{formatDate(searchParams?.flights[0]?.depart)} - {formatDate(searchParams?.returnDate)}</span>
                  </span>
                </div>
              </div>
              {/* Sorting Navigation */}
              <nav className="sorting" style={{ top: '150px' }}>
                <ul className="flex-nowrap gap-3 flex-sm-wrap nav nav-pills nav-justified bg-white rounded-2 overflow-hidden mb-3">
                  <li className="nav-item">
                    <button
                      role="button"
                      className={`nav-link px-0 ${sortOrder === 'asc' ? 'active' : ''}`}
                      onClick={() => handleSortChange('asc')}
                    >
                      <span className="d-block w-100 d-flex align-items-center justify-content-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="20" x2="12" y2="10"></line><line x1="18" y1="20" x2="18" y2="4"></line><line x1="6" y1="20" x2="6" y2="16"></line></svg>
                        Lowest to Higher
                      </span>
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      role="button"
                      className={`nav-link px-0 ${sortOrder === 'desc' ? 'active' : ''}`}
                      onClick={() => handleSortChange('desc')}
                    >
                      <span className="d-block w-100 d-flex align-items-center justify-content-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20V10M6 20V4M18 20v-4"/></svg>
                        Highest to Lower
                      </span>
                    </button>
                  </li>
                </ul>
              </nav>
              {/* Flight List */}
              <div className="mixitup--container mt-2" id="flights--list-js">
                <ul id="flight--list-targets" className="list">
                  <AnimatePresence>
                    {paginatedFlights.map((flight, index) => (
                      <motion.li
                        key={flight.id || index}
                        className={`mix all oneway_${flight.airline} ${flight.stops === 0 ? 'oneway_0' : `oneway_${flight.stops}`}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div>
                          <div className="row">
                            <div className="col-md-1 d-flex align-items-center justify-content-center">
                              <div className="py-2">
                                <span
                                  style={{
                                    width: '8px',
                                    height: '8px',
                                    position: 'absolute',
                                    zIndex: 1,
                                    borderRadius: '12px',
                                    padding: '0',
                                    background: '#007bff',
                                    top: '10px',
                                    left: '10px',
                                  }}
                                ></span>
                                <img
                                  style={{ maxWidth: '40px', maxHeight: '40px' }}
                                  src={getAirlineLogo(flight.airline)}
                                  className="w-100"
                                  alt={getAirlineName(flight.airline)}
                                />
                              </div>
                            </div>
                            <div className="mt-3 mt-sm-0 col-md-6">
                              <h6 className="mb-0"><strong>{formatDate(flight.departureTime)}</strong></h6>
                            </div>
                          </div>
                          <div>
                            <hr className="mt-0" />
                            <div className="row">
                              <div className="col-md-1 d-flex align-items-center justify-content-center">
                                <div className="py-2">
                                  <img
                                    style={{ maxWidth: '40px', maxHeight: '40px' }}
                                    src={getAirlineLogo(flight.airline)}
                                    className="w-100"
                                    alt={getAirlineName(flight.airline)}
                                  />
                                </div>
                              </div>
                              <div className="mt-3 mt-sm-0 col-md-7">
                                <h6 className="mb-0"><strong>{formatTime(flight.departureTime)} - {formatTime(flight.arrivalTime)}</strong></h6>
                                <p className="mb-1">{getAirlineName(flight.airline)} - <small>{flight.flightNumber || `AA${index + 123}`}</small></p>
                              </div>
                              <div className="col-md-4">
                                <div className="row">
                                  <div className="col-6 col-md-6">
                                    <h6 className="mb-0"><strong>Trip Duration</strong></h6>
                                    <p className="mb-0">{calculateDuration(flight.departureTime, flight.arrivalTime)}</p>
                                  </div>
                                  <div className="col-6 col-md-6 text-end">
                                    <h6 className="mb-0"><strong>Stops: {flight.stops}</strong></h6>
                                    <p className="mb-0">{flight.stops > 0 ? flight.stopoverAirportCodes?.join(' ') || `${flight.origin} ${flight.destination}` : '-'}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="pt-2 px-0 d-flex flex-column flex-sm-row justify-content-between">
                            <h6 className="order-2 order-sm-1 m-0 d-flex justify-content-center justify-content-sm-start align-items-center mt-3 mt-sm-0">
                              <strong><small style={{ fontSize: '14px', color: '#aeaeae', fontWeight: '100' }}>From</small> USD {flight.price.toFixed(2)}</strong>
                            </h6>
                            <div className="order-1 order-sm-2 d-flex justify-content-between justify-content-sm-start gap-2">
                              <button
                                className="flex-grow-1 btn btn-outline-primary"
                                type="button"
                                data-bs-toggle="collapse"
                                data-bs-target={`#more_details_${flight.id || index}`}
                                aria-expanded="true"
                                aria-controls={`more_details_${flight.id || index}`}
                                onClick={(e) => moreDetails(e.currentTarget)}
                              >
                                More Details
                              </button>
                              <button type="submit" className="flex-grow-1 btn btn-primary">
                                Select Flight
                              </button>
                            </div>
                          </div>
                          <div className="collapse mt-2" id={`more_details_${flight.id || index}`}>
                            <div className="mx-2">
                              <div className="position-relative bg-light p-3 rounded-4 border">
                                <div className="row">
                                  <div className="col-md-10">
                                    <div className="row g-0">
                                      <div className="col-1 position-relative d-flex flex-column flight--timeline z-3 overflow-hidden">
                                        <span className="d-inline-block bg-light">
                                          <svg
                                            className="bg-light"
                                            style={{ marginTop: '12px' }}
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="15"
                                            height="15"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="#000"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                          >
                                            <circle cx="12" cy="12" r="10"></circle>
                                          </svg>
                                        </span>
                                        <span className="d-inline-block mt-auto bottom--timeline">
                                          <svg
                                            className="bg-light"
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="15"
                                            height="15"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="#000"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                          >
                                            <circle cx="12" cy="12" r="10"></circle>
                                          </svg>
                                        </span>
                                      </div>
                                      <div className="col">
                                        <div className="d-flex flex-wrap mt-2">
                                          <div className="flight--ddt fw-bold d-flex align-items-center gap-2 flex-wrap">
                                            <span>{formatDate(flight.departureTime)}</span>
                                            <span className="me-3 d-flex align-items-center gap-2">{formatTime(flight.departureTime)}</span>
                                          </div>
                                          <small className="d-sm-inline">Depart from <b>{getAirportName(flight.origin)}</b></small>
                                        </div>
                                        <div className="mt-2 h6" style={{ fontSize: '14px' }}>
                                          <span>Trip Duration</span>
                                          <span>{calculateDuration(flight.departureTime, flight.arrivalTime)}</span>
                                        </div>
                                        <div className="d-flex flex-wrap">
                                          <div className="flight--ddt fw-bold d-flex align-items-center gap-2 flex-wrap">
                                            <span>{formatDate(flight.arrivalTime)}</span>
                                            <span className="me-3 d-flex align-items-center gap-2">{formatTime(flight.arrivalTime)}</span>
                                          </div>
                                          <small className="d-sm-inline">Arrive at <b>{getAirportName(flight.destination)}</b></small>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="col-md-2 d-flex align-items-center mt-2 mt-md-0">
                                    <div className="form-check d-flex align-items-center gap-2 p-0">
                                      <input
                                        className="form-check-input m-0"
                                        type="radio"
                                        name="flight_select"
                                        id={`flight_select_${flight.id || index}`}
                                        value=""
                                        defaultChecked={index === 0}
                                      />
                                      <label className="form-check-label" htmlFor={`flight_select_${flight.id || index}`}>Selected</label>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="flight--tco small--text d-flex flex-wrap mt-3 mb-3 text-muted fw-bold gap-2" style={{ fontSize: '12px' }}>
                                <span className="border rounded-5 px-3 text-capitalize">
                                  Airline <strong className="text-dark">{getAirlineName(flight.airline)} - {flight.flightNumber || `AA${index + 123}`}</strong>
                                </span>
                                <span className="border rounded-5 px-3 text-capitalize">
                                  Trip Duration <strong className="text-dark">{calculateDuration(flight.departureTime, flight.arrivalTime)}</strong>
                                </span>
                                <span className="border rounded-5 px-3 text-capitalize">
                                  Flight Class <strong className="text-dark">{flight.cabin || 'Economy'}</strong>
                                </span>
                                <span className="border rounded-5 px-3 text-capitalize">
                                  Baggage <strong className="text-dark">{flight.baggage || '23kg'}</strong>
                                </span>
                                <span className="border rounded-5 px-3 text-capitalize">{flight.refundable ? 'Refundable' : 'Non-refundable'}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
                <div className="listjs--pagination-container d-flex gap-1 items-center">
                  <button
                    className="pag--nav prev--pag"
                    type="button"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#fff"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M11 17l-5-5 5-5M18 17l-5-5 5-5" />
                    </svg>
                  </button>
                  <ul className="pagination--listjs d-flex gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <li key={page} className={page === currentPage ? 'active' : ''}>
                        <button onClick={() => handlePageChange(page)}>{page}</button>
                      </li>
                    ))}
                  </ul>
                  <button
                    className="pag--nav next--pag"
                    type="button"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#fff"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M13 17l5-5-5-5M6 17l5-5-5-5" />
                    </svg>
                  </button>
                </div>
                <p className="fail-message align-items-center" style={{ display: filteredFlights.length === 0 ? 'block' : 'none' }}>
                  
                  <img src="/assets/img/flights_search.gif" style={{ width: "375px" }} alt="" />
                  <strong>No Results Found</strong>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlightPage;
