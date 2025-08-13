import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Select from 'react-select';
import { DateRange } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import { airports, flights } from '../../data/fakeData';
import { motion, AnimatePresence } from 'framer-motion';
import { format, addDays } from 'date-fns';

const FlightSearchForm = ({ searchParams, setAvailableFlights, setReturnFlights }) => {
  const [tripType, setTripType] = useState('oneway');
  const [flightType, setFlightType] = useState('Economy');
  const [flightsState, setFlightsState] = useState([
    {
      origin: null,
      destination: null,
      dateRange: { startDate: new Date('2025-07-15'), endDate: new Date('2025-07-20'), key: 'selection' },
    },
  ]);
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isTravellersOpen, setIsTravellersOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [errors, setErrors] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();

  // Pre-populate form with URL query parameters or searchParams prop
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    let params = searchParams;

    if (!params) {
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
      params = {
        tripType: queryParams.get('tripType') || 'oneway',
        flightType: queryParams.get('flightType') || 'Economy',
        flights: flightsFromUrl.length > 0 ? flightsFromUrl : [{ origin: 'JFK', destination: 'LAX', depart: '2025-07-15' }],
        returnDate: queryParams.get('returnDate') || '2025-07-20',
        adults: parseInt(queryParams.get('adults')) || 1,
        children: parseInt(queryParams.get('children')) || 0,
        infants: parseInt(queryParams.get('infants')) || 0,
      };
    }

    setTripType(params.tripType);
    setFlightType(params.flightType);
    setFlightsState(
      params.flights.map((f) => ({
        origin: airports.find((a) => a.value === f.origin) || null,
        destination: airports.find((a) => a.value === f.destination) || null,
        dateRange: {
          startDate: f.depart ? new Date(f.depart) : new Date('2025-07-15'),
          endDate: params.tripType === 'return' && params.returnDate ? new Date(params.returnDate) : new Date('2025-07-20'),
          key: 'selection',
        },
      }))
    );
    setAdults(params.adults || 1);
    setChildren(params.children || 0);
    setInfants(params.infants || 0);
  }, [searchParams, location.search]);

  // Update guest text
  const guestText = () => {
    let text = '';
    if (adults > 0) text += `${adults} Adult${adults > 1 ? 's' : ''}`;
    if (children > 0) text += `${text ? ', ' : ''}${children} Child${children > 1 ? 'ren' : ''}`;
    if (infants > 0) text += `${text ? ', ' : ''}${infants} Infant${infants > 1 ? 's' : ''}`;
    return text || '1 Adult';
  };

  // Handle adding a new flight
  const addFlight = () => {
    setFlightsState([
      ...flightsState,
      { origin: null, destination: null, dateRange: { startDate: new Date(), endDate: addDays(new Date(), 7), key: 'selection' } },
    ]);
  };

  // Handle removing a flight
  const removeFlight = (index) => {
    if (flightsState.length > 1) {
      setFlightsState(flightsState.filter((_, i) => i !== index));
    }
  };

  // Handle flight field changes
  const handleFlightChange = (index, field, value) => {
    const updatedFlights = [...flightsState];
    updatedFlights[index][field] = value;
    setFlightsState(updatedFlights);
  };

  // Handle date range selection
  const handleDateRangeChange = (index, ranges) => {
    const updatedFlights = [...flightsState];
    const newRange = {
      ...ranges.selection,
      endDate: tripType === 'oneway' ? ranges.selection.startDate : ranges.selection.endDate,
    };
    updatedFlights[index].dateRange = newRange;
    setFlightsState(updatedFlights);
    if (tripType === 'oneway') {
      setIsDatePickerOpen(false);
    }
  };

  // Validate form inputs
  const validateForm = () => {
    const newErrors = [];
    flightsState.forEach((flight, index) => {
      if (!flight.origin) {
        newErrors.push(`Flight ${index + 1}: Please select a departure city`);
      }
      if (!flight.destination) {
        newErrors.push(`Flight ${index + 1}: Please select a destination city`);
      }
      if (flight.origin && flight.destination && flight.origin.value === flight.destination.value) {
        newErrors.push(`Flight ${index + 1}: Departure and destination cities cannot be the same`);
      }
      if (!flight.dateRange.startDate) {
        newErrors.push(`Flight ${index + 1}: Please select a departure date`);
      }
      if (tripType === 'return' && !flight.dateRange.endDate) {
        newErrors.push(`Flight ${index + 1}: Please select a return date`);
      }
      if (
        tripType === 'return' &&
        flight.dateRange.startDate &&
        flight.dateRange.endDate &&
        flight.dateRange.endDate < flight.dateRange.startDate
      ) {
        newErrors.push(`Flight ${index + 1}: Return date must be after departure date`);
      }
    });
    if (adults + children + infants === 0) {
      newErrors.push('At least one traveller is required');
    }
    if (infants > adults) {
      newErrors.push('Number of infants cannot exceed number of adults');
    }
    return newErrors;
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors([]);
    setIsLoading(true);

    // Create URL query parameters
    const queryParams = new URLSearchParams();
    queryParams.set('searchKey', '');
    queryParams.set('tripType', tripType);
    queryParams.set('flightType', flightType);
    flightsState.forEach((flight, index) => {
      queryParams.set(`flights[${index}][origin]`, flight.origin?.value || '');
      queryParams.set(`flights[${index}][destination]`, flight.destination?.value || '');
      queryParams.set(`flights[${index}][depart]`, flight.dateRange.startDate?.toISOString().split('T')[0] || '');
    });
    if (tripType === 'return' && flightsState[0]?.dateRange.endDate) {
      queryParams.set('returnDate', flightsState[0].dateRange.endDate.toISOString().split('T')[0]);
    }
    queryParams.set('adults', adults);
    queryParams.set('children', children);
    queryParams.set('infants', infants);

    // Filter flights from fakeData.js
    const outbound = flights.filter((flight) =>
      flightsState.some(
        (f) =>
          f.origin?.value === flight.origin &&
          f.destination?.value === flight.destination &&
          new Date(f.dateRange.startDate).toDateString() === new Date(flight.departureTime).toDateString()
      )
    );

    let returnFlights = [];
    if (tripType === 'return' && flightsState[0]) {
      returnFlights = flights.filter(
        (flight) =>
          flight.origin === flightsState[0].destination?.value &&
          flight.destination === flightsState[0].origin?.value &&
          new Date(flightsState[0].dateRange.endDate).toDateString() === new Date(flight.departureTime).toDateString()
      );
    }

    // Update parent state
    setAvailableFlights(outbound);
    setReturnFlights(returnFlights);

    setTimeout(() => {
      setIsLoading(false);
      navigate(`/flight/availability?${queryParams.toString()}`);
    }, 1000);
  };

  // Swap origin and destination
  const swapPlaces = (index) => {
    const updatedFlights = [...flightsState];
    const temp = updatedFlights[index].origin;
    updatedFlights[index].origin = updatedFlights[index].destination;
    updatedFlights[index].destination = temp;
    setFlightsState(updatedFlights);
  };

  // Custom Option Component for react-select
  const filterOption = (option, searchText) => {
    const search = searchText.toLowerCase();
    return (
      option.data.label.toLowerCase().includes(search) ||
      option.data.city.toLowerCase().includes(search) ||
      option.data.country.toLowerCase().includes(search) ||
      option.data.value.toLowerCase().includes(search)
    );
  };

  const CustomOption = ({ innerProps, label, data }) => (
    <div
      {...innerProps}
      className="flex items-center p-3 hover:bg-gray-100 cursor-pointer transition-colors duration-200"
    >
      <div className="flex-1">
        <div className="font-semibold">{data.city} - {data.country}</div>
        <div className="text-sm text-gray-500">{data.label}</div>
      </div>
    </div>
  );

  // Custom styles for react-select
  const selectStyles = {
    control: (provided) => ({
      ...provided,
      borderRadius: '0.5rem',
      padding: '0.5rem',
      paddingLeft: '0.8rem',
      border: '1px solid #e5e7eb',
      boxShadow: 'none',
      '&:hover': {
        borderColor: '#3b82f6',
      },
    }),
    menu: (provided) => ({
      ...provided,
      borderRadius: '0.5rem',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      marginTop: '0.25rem',
    }),
    option: (provided) => ({
      ...provided,
      backgroundColor: 'transparent',
      '&:hover': {
        backgroundColor: '#f3f4f6',
      },
    }),
  };

  // Custom styles for date picker
  const datePickerStyles = `
    .rdrCalendarWrapper {
      background-color: white;
      border-radius: 0.5rem;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      border: 1px solid #e5e7eb;
      padding: 0.5rem;
    }
    .rdrMonthAndYearWrapper {
      background-color: white;
      padding: 0.75rem;
      border-bottom: 1px solid #e5e7eb;
    }
    .rdrMonthName {
      font-size: 1rem;
      font-weight: 600;
      color: #1f2937;
    }
    .rdrDay {
      color: #1f2937;
      font-size: 0.9rem;
    }
    .rdrDayToday .rdrDayNumber span:after {
      background-color: #3b82f6;
      border-radius: 0.25rem;
    }
    .rdrDay:hover:not(.rdrDayPassive) .rdrDayNumber span {
      background-color: #f3f4f6;
      border-radius: 0.25rem;
    }
    .rdrSelected, .rdrInRange, .rdrStartEdge, .rdrEndEdge {
      background-color: #3b82f6 !important;
      color: white !important;
      border-radius: 0.25rem;
    }
    .rdrInRange {
      background-color: #bfdbfe !important;
    }
    .rdrMonthAndYearPickers select {
      color: #1f2937;
      font-weight: 600;
      font-size: 0.9rem;
    }
    .rdrNextPrevButton {
      background-color: #f3f4f6;
      border-radius: 0.25rem;
    }
    .rdrNextPrevButton:hover {
      background-color: #e5e7eb;
    }
    .rdrDateDisplayWrapper {
      background-color: white;
      border-bottom: 1px solid #e5e7eb;
      padding: 0.5rem;
    }
    .rdrDateInput {
      border-radius: 0.25rem;
      border: 1px solid #e5e7eb;
    }
    .rdrDateInput:hover {
      border-color: #3b82f6;
    }
  `;

  return (
    <form id="flights-search" className="content m-0 search_box" onSubmit={handleSubmit}>
      <style>{datePickerStyles}</style>
      {errors.length > 0 && (
        <div className="alert alert-danger mb-3">
          <ul className="mb-0">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="flex flex-wrap gap-4 mb-4">
        <div className="flex items-center gap-2 bg-light p-2 gap-1 px-2 rounded-3 trip_type mb-3 mb-md-0">
          <div className="one-way form-check flex items-center p-0 m-0">
            <input
              type="radio"
              name="trip"
              id="one-way"
              value="oneway"
              checked={tripType === 'oneway'}
              onChange={() => setTripType('oneway')}
              className="form-check-input m-0"
            />
            <label htmlFor="one-way" className="form-check-label px-2 p-2 flex items-center text-sm font-medium">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#333"
                strokeWidth="2"
                className="mr-1"
              >
                <path d="M16.79 7.79l-1.41 1.42L17.17 11H3v2h14.17l-1.79 1.79 1.41 1.42L21 12z"></path>
              </svg>
              One Way
            </label>
          </div>
          <div className="round-trip form-check flex items-center">
            <input
              type="radio"
              name="trip"
              id="round-trip"
              value="return"
              checked={tripType === 'return'}
              onChange={() => setTripType('return')}
              className="form-check-input m-0"
            />
            <label htmlFor="round-trip" className="form-check-label px-2 p-2 flex items-center text-sm font-medium">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#333"
                strokeWidth="2"
                className="mr-1"
              >
                <polygon points="8.41,12.41 7,11 2,16 7,21 8.41,19.59 5.83,17 21,17 21,15 5.83,15"></polygon>
                <polygon points="15.59,11.59 17,13 22,8 17,3 15.59,4.41 18.17,7 3,7 3,9 18.17,9"></polygon>
              </svg>
              Round Trip
            </label>
          </div>
        </div>
        <div className="h-auto">
          <select
            name="flight_type"
            id="flight_type"
            className="form-select rounded-lg w-auto border-gray-300 focus:ring-blue-500 focus:border-blue-500"
            value={flightType}
            onChange={(e) => setFlightType(e.target.value)}
            style={{ height: '54px' }}
          >
            <option value="">Cabin Class</option>
            <option value="Economy">Economy</option>
            <option value="PREMIUM ECONOMY">Economy Premium</option>
            <option value="business">Business</option>
            <option value="first">First</option>
          </select>
        </div>
      </div>

      <div className="row mb-0 g-2 flight_search" id="onereturn">
        {flightsState.map((flight, index) => (
          <div key={index} className="new-element contact-form-action w-100 multi-flight-field mb-2">
            <div className="row g-2 contact-form-action multi_flight">
              <div className="col-lg-4">
                <div className="input-items from_flights">
                  <div className="mt-1 p-1 position-absolute z-1">
                    <svg width="18" height="18" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg">
                      <g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
                        <g transform="translate(-624.000000, 0.000000)">
                          <g transform="translate(624.000000, 0.000000)">
                            <path d="M24,0 L24,24 L0,24 L0,0 L24,0 Z M12.5934901,23.257841 L12.5819402,23.2595131 L12.5108777,23.2950439 L12.4918791,23.2987469 L12.4918791,23.2987469 L12.4767152,23.2950439 L12.4056548,23.2595131 C12.3958229,23.2563662 12.3870493,23.2590235 12.3821421,23.2649074 L12.3780323,23.275831 L12.360941,23.7031097 L12.3658947,23.7234994 L12.3769048,23.7357139 L12.4804777,23.8096931 L12.4953491,23.8136134 L12.4953491,23.8136134 L12.5071152,23.8096931 L12.6106902,23.7357139 L12.6232938,23.7196733 L12.6232938,23.7196733 L12.6266527,23.7031097 L12.609561,23.275831 C12.6075724,23.2657013 12.6010112,23.2592993 12.5934901,23.257841 L12.5934901,23.257841 Z M12.8583906,23.1452862 L12.8445485,23.1473072 L12.6598443,23.2396597 L12.6498822,23.2499052 L12.6498822,23.2499052 L12.6471943,23.2611114 L12.6650943,23.6906389 L12.6699349,23.7034178 L12.6699349,23.7034178 L12.678386,23.7104931 L12.8793402,23.8032389 C12.8914285,23.8068999 12.9022333,23.8029875 12.9078286,23.7952264 L12.9118235,23.7811639 L12.8776777,23.1665331 C12.8752882,23.1545897 12.8674102,23.1470016 12.8583906,23.1452862 L12.8583906,23.1452862 Z M12.1430473,23.1473072 C12.1332178,23.1423925 12.1221763,23.1452606 12.1156365,23.1525954 L12.1099173,23.1665331 L12.0757714,23.7811639 C12.0751323,23.7926639 12.0828099,23.8018602 12.0926481,23.8045676 L12.108256,23.8032389 L12.3092106,23.7104931 L12.3186497,23.7024347 L12.3186497,23.7024347 L12.3225043,23.6906389 L12.340401,23.2611114 L12.337245,23.2485176 L12.337245,23.2485176 L12.3277531,23.2396597 L12.1430473,23.1473072 Z" fillRule="nonzero"></path>
                            <path
                              d="M20.9999,20 C21.5522,20 21.9999,20.4477 21.9999,21 C21.9999,21.51285 21.613873,21.9355092 21.1165239,21.9932725 L20.9999,22 L2.99988,22 C2.44759,22 1.99988,21.5523 1.99988,21 C1.99988,20.48715 2.38591566,20.0644908 2.8832579,20.0067275 L2.99988,20 L20.9999,20 Z M7.26152,3.77234 C7.60270875,3.68092 7.96415594,3.73859781 8.25798121,3.92633426 L8.37951,4.0147 L14.564,9.10597 L18.3962,8.41394 C19.7562,8.16834 21.1459,8.64954 22.0628,9.68357 C22.5196,10.1987 22.7144,10.8812 22.4884,11.5492 C22.1394625,12.580825 21.3287477,13.3849891 20.3041894,13.729249 L20.0965,13.7919 L5.02028,17.8315 C4.629257,17.93626 4.216283,17.817298 3.94116938,17.5298722 L3.85479,17.4279 L0.678249,13.1819 C0.275408529,12.6434529 0.504260903,11.8823125 1.10803202,11.640394 L1.22557,11.6013 L3.49688,10.9927 C3.85572444,10.8966111 4.23617877,10.9655 4.53678409,11.1757683 L4.64557,11.2612 L5.44206,11.9612 L7.83692,11.0255 L3.97034,6.11174 C3.54687,5.57357667 3.77335565,4.79203787 4.38986791,4.54876405 L4.50266,4.51158 L7.26152,3.77234 Z M7.40635,5.80409 L6.47052,6.05484 L10.2339,10.8375 C10.6268063,11.3368125 10.463277,12.0589277 9.92111759,12.3504338 L9.80769,12.4028 L5.60866,14.0433 C5.29604667,14.1654333 4.9460763,14.123537 4.67296914,13.9376276 L4.57438,13.8612 L3.6268,13.0285 L3.15564,13.1547 L5.09121,15.7419 L19.5789,11.86 C20.0227,11.7411 20.3838,11.4227 20.5587,11.0018 C20.142625,10.53815 19.5333701,10.3022153 18.9191086,10.3592364 L18.7516,10.3821 L14.4682,11.1556 C14.218,11.2007714 13.9615551,11.149698 13.7491184,11.0154781 L13.6468,10.9415 L7.40635,5.80409 Z"
                              fill="#333333"
                            ></path>
                          </g>
                        </g>
                      </g>
                    </svg>
                  </div>
                  <div className="">
                    <Select
                      options={airports}
                      value={flight.origin}
                      onChange={(selected) => handleFlightChange(index, 'origin', selected)}
                      filterOption={filterOption}
                      components={{ Option: CustomOption }}
                      styles={selectStyles}
                      placeholder="Flying From"
                      isSearchable
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="col-lg-4">
                <div id="swap" className="position-absolute" onClick={() => swapPlaces(index)}>
                  <div className="swap-places">
                    <span className="swap-places__arrow --top">
                      <svg width="13" height="6" viewBox="0 0 13 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" clipRule="evenodd" d="M3 4V6L0 3L3 0V2H13V4H3Z"></path>
                      </svg>
                    </span>
                    <span className="swap-places__arrow --bottom">
                      <svg width="13" height="6" viewBox="0 0 13 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" clipRule="evenodd" d="M3 4V6L0 3L3 0V2H13V4H3Z"></path>
                      </svg>
                    </span>
                  </div>
                </div>
                <div className="input-items flights_arrival to_flights">
                  <div className="mt-1 p-1 position-absolute z-1">
                    <svg width="18" height="18" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg">
                      <g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
                        <g transform="translate(-576.000000, 0.000000)">
                          <g transform="translate(576.000000, 0.000000)">
                            <path d="M24,0 L24,24 L0,24 L0,0 L24,0 Z M12.5934901,23.257841 L12.5819402,23.2595131 L12.5108777,23.2950439 L12.4918791,23.2987469 L12.4918791,23.2987469 L12.4767152,23.2950439 L12.4056548,23.2595131 C12.3958229,23.2563662 12.3870493,23.2590235 12.3821421,23.2649074 L12.3780323,23.275831 L12.360941,23.7031097 L12.3658947,23.7234994 L12.3769048,23.7357139 L12.4804777,23.8096931 L12.4953491,23.8136134 L12.4953491,23.8136134 L12.5071152,23.8096931 L12.6106902,23.7357139 L12.6232938,23.7196733 L12.6232938,23.7196733 L12.6266527,23.7031097 L12.609561,23.275831 C12.6075724,23.2657013 12.6010112,23.2592993 12.5934901,23.257841 L12.5934901,23.257841 Z M12.8583906,23.1452862 L12.8445485,23.1473072 L12.6598443,23.2396597 L12.6498822,23.2499052 L12.6498822,23.2499052 L12.6471943,23.2611114 L12.6650943,23.6906389 L12.6699349,23.7034178 L12.6699349,23.7034178 L12.678386,23.7104931 L12.8793402,23.8032389 C12.8914285,23.8068999 12.9022333,23.8029875 12.9078286,23.7952264 L12.9118235,23.7811639 L12.8776777,23.1665331 C12.8752882,23.1545897 12.8674102,23.1470016 12.8583906,23.1452862 L12.8583906,23.1452862 Z M12.1430473,23.1473072 C12.1332178,23.1423925 12.1221763,23.1452606 12.1156365,23.1525954 L12.1099173,23.1665331 L12.0757714,23.7811639 C12.0751323,23.7926639 12.0828099,23.8018602 12.0926481,23.8045676 L12.108256,23.8032389 L12.3092106,23.7104931 L12.3186497,23.7024347 L12.3186497,23.7024347 L12.3225043,23.6906389 L12.340401,23.2611114 L12.337245,23.2485176 L12.337245,23.2485176 L12.3277531,23.2396597 L12.1430473,23.1473072 Z" fillRule="nonzero"></path>
                            <path
                              d="M20.99989,20.0001 C21.5522,20.0001 21.99989,20.4478 21.99989,21.0001 C21.99989,21.51295 21.6138716,21.9356092 21.1165158,21.9933725 L20.99989,22.0001 L2.99989,22.0001 C2.4476,22.0001 1.99989,21.5524 1.99989,21.0001 C1.99989,20.48725 2.38592566,20.0645908 2.8832679,20.0068275 L2.99989,20.0001 L20.99989,20.0001 Z M8.10346,3.20538 C8.00550211,2.52548211 8.59636283,1.96050997 9.25436746,2.06249271 L9.36455,2.08576 L12.1234,2.82499 C12.4699778,2.91787 12.7577704,3.15444975 12.9168957,3.47137892 L12.9704,3.59387 L15.7807,11.0953 L19.4455,12.4121 C20.7461,12.8794 21.709,13.991 21.9861,15.3449 C22.1241,16.0194 21.9516,16.7079 21.4218,17.1734 C20.6038313,17.8923687 19.4996906,18.183398 18.4402863,17.9692815 L18.2291,17.9197 L3.15287,13.8799 C2.75789727,13.7740818 2.45767661,13.459338 2.36633273,13.0674492 L2.34531,12.9477 L1.71732,7.68232 C1.63740111,7.01225556 2.22049639,6.4660062 2.86699575,6.56318572 L2.98162,6.58712 L5.25293,7.19571 C5.61177444,7.29186111 5.90680062,7.54177815 6.06199513,7.87418144 L6.11349,8.00256 L6.45329,9.00701 L8.99512,9.39414 L8.10346,3.20538 Z M10.2971,4.4062 L11.165,10.4298 C11.2559176,11.0610471 10.7489114,11.6064588 10.1303657,11.5834026 L10.0132,11.5723 L5.5565,10.8935 C5.22469556,10.8429222 4.94258198,10.6316333 4.79900425,10.3341508 L4.75183,10.2187 L4.34758,9.02368 L3.87642,8.89743 L4.25907,12.1058 L18.7467,15.9878 C19.1906,16.1067 19.6625,16.0115 20.0243,15.7345 C19.8949769,15.1206538 19.4803805,14.6088858 18.9139056,14.3528832 L18.7692,14.2943 L14.673,12.8225 C14.4336857,12.7364429 14.2371306,12.5639857 14.1203003,12.3415274 L14.0687,12.2263 L11.233,4.65695 L10.2971,4.4062 Z"
                              fill="#333333"
                            ></path>
                          </g>
                        </g>
                      </g>
                    </svg>
                  </div>
                  <div className="form-floating">
                    <Select
                      options={airports}
                      value={flight.destination}
                      onChange={(selected) => handleFlightChange(index, 'destination', selected)}
                      filterOption={filterOption}
                      components={{ Option: CustomOption }}
                      styles={selectStyles}
                      placeholder="Destination To"
                      isSearchable
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="col-lg-4">
                <div className="row g-2">
                  <div className="col-12 relative">
                    <div className="form-floating">
                      <button
                        type="button"
                        className="w-full h-[58px] bg-white border border-gray-300 rounded-lg text-left px-10 py-3 text-sm text-gray-700 hover:border-blue-500 focus:border-blue-500 focus:ring focus:ring-blue-200 transition-colors flex items-center justify-between"
                        onClick={() => setIsDatePickerOpen(isDatePickerOpen === index ? false : index)}
                      >
                        <span>
                          {tripType === 'return'
                            ? `${format(flight.dateRange.startDate, 'EEE d MMM')} - ${format(flight.dateRange.endDate, 'EEE d MMM')}`
                            : format(flight.dateRange.startDate, 'EEE d MMM')}
                        </span>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
                          <path d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
                          <path d="M8 2v4m8-4v4M5 10h14M3 6h18v14H3V6z" />
                        </svg>
                      </div>
                      <AnimatePresence>
                        {isDatePickerOpen === index && (
                          <motion.div
                            className="absolute z-20 mt-2 w-full md:w-[400px] bg-white rounded-lg shadow-lg"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                          >
                            <DateRange
                              ranges={[flight.dateRange]}
                              onChange={(ranges) => handleDateRangeChange(index, ranges)}
                              minDate={new Date()}
                              months={1}
                              direction="vertical"
                              showDateDisplay={true}
                              rangeColors={['#3b82f6']}
                              className="w-full"
                            />
                            {tripType === 'return' && (
                              <div className="p-4 border-t border-gray-200">
                                <button
                                  type="button"
                                  className="w-full bg-blue-600 text-white rounded-lg py-2 hover:bg-blue-700 transition-colors text-sm"
                                  onClick={() => setIsDatePickerOpen(false)}
                                >
                                  Done
                                </button>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </div>
              {flightsState.length > 1 && (
                <div>
                  <button
                    type="button"
                    onClick={() => removeFlight(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="relative">
          <button
            type="button"
            className="flex items-center gap-2 bg-gray-100 rounded-lg py-2 px-4 text-sm text-gray-700 hover:bg-gray-200 transition-colors"
            onClick={() => setIsTravellersOpen(!isTravellersOpen)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            {guestText()}
          </button>
          <AnimatePresence>
            {isTravellersOpen && (
              <motion.div
                className="absolute z-20 mt-2 w-64 bg-white rounded-lg shadow-lg p-4"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <strong className="text-gray-700">Adults</strong>
                      <div className="text-xs text-gray-500">+12 years</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="w-8 h-8 border border-gray-300 rounded hover:bg-gray-100"
                        onClick={() => setAdults(adults > 0 ? adults - 1 : 0)}
                      >
                        -
                      </button>
                      <input
                        type="text"
                        value={adults}
                        className="w-12 text-center border-gray-300 rounded"
                        readOnly
                      />
                      <button
                        type="button"
                        className="w-8 h-8 border border-gray-300 rounded hover:bg-gray-100"
                        onClick={() => setAdults(adults + 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <strong className="text-gray-700">Children</strong>
                      <div className="text-xs text-gray-500">2 - 11 years</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="w-8 h-8 border border-gray-300 rounded hover:bg-gray-100"
                        onClick={() => setChildren(children > 0 ? children - 1 : 0)}
                      >
                        -
                      </button>
                      <input
                        type="text"
                        value={children}
                        className="w-12 text-center border-gray-300 rounded"
                        readOnly
                      />
                      <button
                        type="button"
                        className="w-8 h-8 border border-gray-300 rounded hover:bg-gray-100"
                        onClick={() => setChildren(children + 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <strong className="text-gray-700">Infants</strong>
                      <div className="text-xs text-gray-500">-2 years</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="w-8 h-8 border border-gray-300 rounded hover:bg-gray-100"
                        onClick={() => setInfants(infants > 0 ? infants - 1 : 0)}
                      >
                        -
                      </button>
                      <input
                        type="text"
                        value={infants}
                        className="w-12 text-center border-gray-300 rounded"
                        readOnly
                      />
                      <button
                        type="button"
                        className="w-8 h-8 border border-gray-300 rounded hover:bg-gray-100"
                        onClick={() => setInfants(infants + 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="w-full bg-blue-600 text-white rounded-lg py-2 hover:bg-blue-700 transition-colors"
                    onClick={() => setIsTravellersOpen(false)}
                  >
                    Done
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="flex gap-4">
          <button
            type="button"
            className="text-blue-600 hover:text-blue-800 text-sm"
            onClick={addFlight}
          >
            + Add Another Flight
          </button>
          <button
            type="submit"
            className="bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z"></path>
              </svg>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                Search
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
};

export default FlightSearchForm;