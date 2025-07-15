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
    </div>
  );
};

export default FlightPage;