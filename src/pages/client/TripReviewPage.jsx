import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { flights } from '../../data/fakeData';

const TripReviewPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [tripDetails, setTripDetails] = useState(null);
  const [showOutboundStops, setShowOutboundStops] = useState(false);
  const [showReturnStops, setShowReturnStops] = useState(false);

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

    const selectedOutbound = flights.find(f => f.id === flightId);
    const selectedReturn = tripType === 'return' ? flights.find(f => f.id === returnFlightId) : null;

    if (!selectedOutbound) return;

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
    navigate(`/flight/booking-confirmation?${searchParams.toString()}`);
  };

  if (!tripDetails || !tripDetails.outbound) return <div>Loading...</div>;

  const {
    tripType,
    adults,
    children,
    outbound,
    return: returnFlight,
    origin,
    destination,
    departDate,
    returnDate,
    totalPrice
  } = tripDetails;

  const baseFare = totalPrice;
  const taxes = baseFare * 0.1;
  const fees = baseFare * 0.05;
  const finalPrice = baseFare + taxes + fees;

  const renderStops = (stops, show, toggle) => (
    stops?.length ? (
      <>
        <button
          className="btn btn-link text-primary p-0"
          onClick={toggle}
        >
          {show ? 'Hide' : 'View'} stopover details
        </button>
        {show && (
          <ul className="mt-2 list-unstyled">
            {stops.map((stop, idx) => (
              <li key={idx} className="text-muted">- Stopover at {stop}</li>
            ))}
          </ul>
        )}
      </>
    ) : null
  );

  return (
    <div className="container-fluid p-0 bg-light">
      <div className="hero-section text-white text-center d-flex align-items-center justify-content-center" style={{ height: '200px', backgroundImage: 'url("https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80")', backgroundSize: 'cover', position: 'relative' }}>
        <div className="position-absolute w-100 h-100" style={{ background: 'rgba(0, 0, 0, 0.4)' }}></div>
        <div className="position-relative">
          <h1 className="display-4 fw-bold">Review Your Trip</h1>
          <p className="lead">Confirm your flight details before booking</p>
        </div>
      </div>

      <div className="container py-5">
        <div className="row g-4">
          <div className="col-lg-8">
            <div className="card shadow-sm border-0 rounded-3 mb-4">
              <div className="card-header bg-primary text-white rounded-top-3">
                <h5 className="mb-0">Flight Itinerary</h5>
              </div>
              <div className="card-body">
                <h6 className="fw-bold mb-2">Outbound Flight</h6>
                <p>{origin} to {destination} | {departDate} | {outbound.airline} Flight {outbound.flightNumber || 'N/A'}</p>
                <p>Depart: {outbound.departureTime} | Arrive: {outbound.arrivalTime} | Duration: {outbound.duration}</p>
                {renderStops(outbound.stopoverAirportCodes, showOutboundStops, () => setShowOutboundStops(!showOutboundStops))}

                {tripType === 'return' && returnFlight && (
                  <>
                    <hr className="my-4" />
                    <h6 className="fw-bold mb-2">Return Flight</h6>
                    <p>{destination} to {origin} | {returnDate} | {returnFlight.airline} Flight {returnFlight.flightNumber || 'N/A'}</p>
                    <p>Depart: {returnFlight.departureTime} | Arrive: {returnFlight.arrivalTime} | Duration: {returnFlight.duration}</p>
                    {renderStops(returnFlight.stopoverAirportCodes, showReturnStops, () => setShowReturnStops(!showReturnStops))}
                  </>
                )}
              </div>
            </div>

            <div className="card shadow-sm border-0 rounded-3">
              <div className="card-header bg-primary text-white rounded-top-3">
                <h5 className="mb-0">Passenger Details</h5>
              </div>
              <div className="card-body">
                <p><strong>Adults:</strong> {adults}</p>
                <p><strong>Children:</strong> {children}</p>
                <p className="text-muted mb-0">Passenger names will be collected in the next step.</p>
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="card shadow-sm border-0 rounded-3 sticky-top" style={{ top: '20px' }}>
              <div className="card-header bg-primary text-white rounded-top-3">
                <h5 className="mb-0">Price Summary</h5>
              </div>
              <div className="card-body">
                <div className="d-flex justify-content-between mb-2">
                  <span>Base Fare</span><span>${baseFare.toFixed(2)}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span>Taxes</span><span>${taxes.toFixed(2)}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span>Fees</span><span>${fees.toFixed(2)}</span>
                </div>
                <hr />
                <div className="d-flex justify-content-between fw-bold">
                  <span>Total</span><span>${finalPrice.toFixed(2)}</span>
                </div>
                <button className="btn btn-primary w-100 mt-4 fw-bold text-uppercase" onClick={handleContinue}>
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
