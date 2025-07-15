import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { flights, airlines, airports } from '../../data/fakeData';

const TripReviewPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [tripDetails, setTripDetails] = useState(null);
  const [error, setError] = useState(null);

  // Helper functions
  const getAirlineName = (code) => {
    const airline = airlines.find((a) => a.code === code);
    return airline ? airline.name : code;
  };

  const getAirportName = (code) => {
    const airport = airports.find((a) => a.value === code);
    return airport ? `${airport.city} (${airport.value})` : code;
  };

  // Parse query parameters
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tripType = searchParams.get('tripType') || 'oneway';
    const adults = parseInt(searchParams.get('adults')) || 1;
    const children = parseInt(searchParams.get('children')) || 0;
    const origin = searchParams.get('flights[0][origin]');
    const destination = searchParams.get('flights[0][destination]');
    const departDate = searchParams.get('flights[0][depart]');
    const returnDate = searchParams.get('returnDate');
    const flightId = searchParams.get('flightId');
    const returnFlightId = searchParams.get('returnFlightId');

    // Log query parameters for debugging
    console.log('Query Parameters:', {
      tripType,
      adults,
      children,
      origin,
      destination,
      departDate,
      returnDate,
      flightId,
      returnFlightId,
    });

    // Find selected flights
    const selectedOutbound = flights.find(f => f.id === flightId);
    const selectedReturn = tripType === 'return' && returnFlightId ? flights.find(f => f.id === returnFlightId) : null;

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
      outbound: selectedOutbound,
      return: selectedReturn,
      origin,
      destination,
      departDate,
      returnDate,
      totalPrice: selectedOutbound.price + (selectedReturn ? selectedReturn.price : 0),
    });
  }, [location.search]);

  const handleContinue = () => {
    const searchParams = new URLSearchParams(location.search);
    navigate(`/booking-confirmation?${searchParams.toString()}`);
  };

  if (error) {
    return (
      <div className="container py-5 text-center">
        <h2 className="text-danger">Error</h2>
        <p>{error}</p>
        <button
          className="btn btn-primary"
          onClick={() => navigate('/flight/availability')}
        >
          Back to Flight Search
        </button>
      </div>
    );
  }

  if (!tripDetails || !tripDetails.outbound) {
    return <div>Loading...</div>;
  }

  const { tripType, adults, children, outbound, return: returnFlight, origin, destination, departDate, returnDate, totalPrice } = tripDetails;

  // Calculate pricing
  const baseFare = totalPrice;
  const taxes = baseFare * 0.1;
  const fees = baseFare * 0.05;
  const finalPrice = baseFare + taxes + fees;

  return (
    <div className="container-fluid p-0" style={{ backgroundColor: '#f8f9fa', marginTop: '50px' }}>
      {/* Hero Section */}
      <div
        className="hero-section position-relative text-white text-center"
        style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          height: '200px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          className="position-absolute w-100 h-100"
          style={{ background: 'rgba(0, 0, 0, 0.4)' }}
        ></div>
        <div className="position-relative">
          <h1 className="display-4 font-700">Review Your Trip</h1>
          <p className="lead">Confirm your flight details before booking</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-5">
        <div className="row g-4">
          {/* Flight Details */}
          <div className="col-lg-8">
            <div className="card shadow-sm border-0 rounded-3">
              <div className="card-header bg-primary text-white rounded-top-3">
                <h5 className="mb-0">Flight Itinerary</h5>
              </div>
              <div className="card-body">
                <h6 className="font-700">Outbound Flight</h6>
                <p>
                  {getAirportName(origin)} to {getAirportName(destination)} | {departDate} | {getAirlineName(outbound.airline)} Flight {outbound.flightNumber || 'N/A'}
                </p>
                <p>
                  Depart: {outbound.departureTime} | Arrive: {outbound.arrivalTime} | Duration: {outbound.duration}
                </p>
                {outbound.stops > 0 && (
                  <p>Stops: {outbound.stopoverAirportCodes?.map(getAirportName).join(', ') || 'N/A'}</p>
                )}
                {tripType === 'return' && returnFlight && (
                  <>
                    <h6 className="font-700 mt-4">Return Flight</h6>
                    <p>
                      {getAirportName(destination)} to {getAirportName(origin)} | {returnDate} | {getAirlineName(returnFlight.airline)} Flight {returnFlight.flightNumber || 'N/A'}
                    </p>
                    <p>
                      Depart: {returnFlight.departureTime} | Arrive: {returnFlight.arrivalTime} | Duration: {returnFlight.duration}
                    </p>
                    {returnFlight.stops > 0 && (
                      <p>Stops: {returnFlight.stopoverAirportCodes?.map(getAirportName).join(', ') || 'N/A'}</p>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Passenger Information */}
            <div className="card shadow-sm border-0 rounded-3 mt-4">
              <div className="card-header bg-primary text-white rounded-top-3">
                <h5 className="mb-0">Passenger Details</h5>
              </div>
              <div className="card-body">
                <p>Adults: {adults}</p>
                <p>Children: {children}</p>
                <p>Passenger Names: (To be collected in booking confirmation)</p>
              </div>
            </div>
          </div>

          {/* Pricing Breakdown */}
          <div className="col-lg-4">
            <div className="card shadow-sm border-0 rounded-3 sticky-top" style={{ top: '20px' }}>
              <div className="card-header bg-primary text-white rounded-top-3">
                <h5 className="mb-0">Price Summary</h5>
              </div>
              <div className="card-body">
                <div className="d-flex justify-content-between">
                  <span>Base Fare</span>
                  <span>${baseFare.toFixed(2)}</span>
                </div>
                <div className="d-flex justify-content-between mt-2">
                  <span>Taxes</span>
                  <span>${taxes.toFixed(2)}</span>
                </div>
                <div className="d-flex justify-content-between mt-2">
                  <span>Fees</span>
                  <span>${fees.toFixed(2)}</span>
                </div>
                <hr />
                <div className="d-flex justify-content-between font-700">
                  <span>Total</span>
                  <span>${finalPrice.toFixed(2)}</span>
                </div>
                <button
                  className="btn btn-primary btn-m rounded-sm font-700 text-uppercase btn-full mt-4"
                  onClick={handleContinue}
                >
                  Continue to Booking
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TripReviewPage;