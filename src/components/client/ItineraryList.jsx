import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import FlightSegment from '../../components/client/FlightSegment';

const ItineraryList = ({
  paginatedItineraries,
  openDetailsId,
  setOpenDetailsId,
  getAirlineLogo,
  getAirlineName,
  formatDate,
  formatToYMD,
  formatTime,
  calculateDuration,
  getAirportName,
  availableFlights,
  returnFlights,
  loading
}) => {
  const navigate = useNavigate();

  const handleSelectItinerary = (itinerary) => {
    // console.info(formatToYMD(itinerary.outbound.departureTime));
    const searchParams = new URLSearchParams({
      tripType: itinerary.return ? 'return' : 'oneway',
      'flights[0][origin]': itinerary.outbound.origin,
      'flights[0][destination]': itinerary.outbound.destination,
      'flights[0][depart]': formatToYMD(itinerary.outbound.departureTime),
      returnDate: itinerary.return ? formatToYMD(itinerary.return.departureTime) : '',
      adults: itinerary.adults?.toString() || '1',
      children: itinerary.children?.toString() || '0',
      cabin: itinerary.outbound.cabin || 'Economy',
      flightId: itinerary.outbound.id,
      returnFlightId: itinerary.return ? itinerary.return.id : '',
    });

    navigate(`/flight/booking-confirmation?${searchParams.toString()}`);
  };

  return (
    <div className="mixitup--container mt-3" id="flights--list-js">
      <ul id="flight--list-targets" className="list mt-2">
        <AnimatePresence>
          {paginatedItineraries.map((itinerary, index) => (
            <motion.li
              key={itinerary.id}
              className={`mix all ${itinerary.airlines.map(a => `oneway_${a}`).join(' ')} oneway_${itinerary.totalStops}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.3 }}
            >
              <div className='border rounded-4 p-3 mb-3'>
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
                        src={`/assets/img/airlines/${getAirlineLogo(itinerary.outbound.airline)}.png`}
                        className="w-100"
                        alt={getAirlineName(itinerary.outbound.airline)}
                      />
                    </div>
                  </div>
                  <div className="mt-3 mt-sm-0 col-md-6">
                    <h6 className="mb-0"><strong>{formatDate(itinerary.outbound.departureTime)}</strong></h6>
                    {itinerary.return && (
                      <h6 className="mb-0"><strong>{formatDate(itinerary.return.departureTime)}</strong></h6>
                    )}
                  </div>
                </div>
                <div>
                  <hr className="mt-0" />
                  <div className="row">
                    <div className="col-md-1 d-flex align-items-center justify-content-center">
                      <div className="py-2">
                        <img
                          style={{ maxWidth: '40px', maxHeight: '40px' }}
                          src={`/assets/img/airlines/${getAirlineLogo(itinerary.outbound.airline)}.png`}
                          className="w-100"
                          alt={getAirlineName(itinerary.outbound.airline)}
                        />
                      </div>
                    </div>
                    <div className="mt-3 mt-sm-0 col-md-7">
                      <h6 className="mb-0"><strong>{formatTime(itinerary.outbound.departureTime)} - {formatTime(itinerary.outbound.arrivalTime)}</strong></h6>
                      <p className="mb-1">{getAirlineName(itinerary.outbound.airline)} - <small>{itinerary.outbound.flightNumber || `AA${index + 123}`}</small></p>
                      {itinerary.return && (
                        <>
                          <h6 className="mb-0 mt-2"><strong>{formatTime(itinerary.return.departureTime)} - {formatTime(itinerary.return.arrivalTime)}</strong></h6>
                          <p className="mb-1">{getAirlineName(itinerary.return.airline)} - <small>{itinerary.return.flightNumber || `AA${index + 124}`}</small></p>
                        </>
                      )}
                    </div>
                    <div className="col-md-4">
                      <div className="row">
                        <div className="col-6 col-md-6">
                          <h6 className="mb-0"><strong>Trip Duration</strong></h6>
                          {itinerary.outbound.journeyTime && (
                          <p className="mb-0">{Math.floor(itinerary.outbound.journeyTime / 60)}h {itinerary.outbound.journeyTime % 60}m</p>
                          )}
                          {itinerary.return && (
                            <p className="mb-0">{calculateDuration(itinerary.return.departureTime, itinerary.return.arrivalTime)}</p>
                          )}
                        </div>
                        <div className="col-6 col-md-6 text-end">
                          <h6 className="mb-0"><strong>Stops: {itinerary.totalStops}</strong></h6>
                          <p className="mb-0">
                            {itinerary.outbound.stops > 0
                              ? itinerary.outbound.segments.slice(0, -1).map(s => s.arrival).join(', ')
                              : 'Direct'}
                          </p>
                          {itinerary.return && (
                            <p className="mb-0">
                              {itinerary.return.stops > 0
                                ? itinerary.return.segments.slice(0, -1).map(s => s.arrival).join(', ')
                                : 'Direct'}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="pt-2 px-0 d-flex flex-column flex-sm-row justify-content-between">
                  <h6 className="order-2 order-sm-1 m-0 d-flex justify-content-center justify-content-sm-start align-items-center mt-3 mt-sm-0">
                    <strong><small style={{ fontSize: '14px', color: '#aeaeae', fontWeight: '100' }}>From</small> USD {itinerary.totalPrice.toFixed(2)}</strong>
                  </h6>
                  <div className="order-1 order-sm-2 d-flex justify-content-between justify-content-sm-start gap-2">
                    <button
                      className="flex-grow-1 btn btn-outline-primary"
                      type="button"
                      onClick={() =>
                        setOpenDetailsId(
                          openDetailsId === itinerary.id ? null : itinerary.id
                        )
                      }
                    >
                      More Details
                    </button>
                    <button
                      type="button"
                      className="flex-grow-1 btn btn-primary"
                      onClick={() => handleSelectItinerary(itinerary)}
                    >
                      Select Itinerary
                    </button>
                  </div>
                </div>
                <div
                  className={`mt-2 ${openDetailsId === itinerary.id ? '' : 'd-none'}`}
                  id={`more_details_${itinerary.id}`}
                >
                  <div className="mx-2">
                    <div className="position-relative bg-light p-3 rounded-4 border">
                      <div className="position-relative border rounded-3 p-3 mb-4 bg-white">
                        {/* Top-right radio button */}
                        <div className="position-absolute top-0 end-0 mt-2 me-3">
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="radio"
                              name="itinerary_select"
                              id={`itinerary_select_${itinerary.id}`}
                              value=""
                              defaultChecked={index === 0}
                            />
                            <label className="form-check-label small" htmlFor={`itinerary_select_${itinerary.id}`}>
                              Selected
                            </label>
                          </div>
                        </div>

                        <div className="row">
                          <div className="col-12">
                            <FlightSegment
                              flight={itinerary.outbound}
                              segmentType="Outbound"
                              formatDate={formatDate}
                              formatTime={formatTime}
                              calculateDuration={calculateDuration}
                              getAirportName={getAirportName}
                            />
                            {itinerary.return && (
                              <FlightSegment
                                flight={itinerary.return}
                                segmentType="Return"
                                formatDate={formatDate}
                                formatTime={formatTime}
                                calculateDuration={calculateDuration}
                                getAirportName={getAirportName}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flight--tco small--text d-flex flex-wrap mt-3 mb-3 text-muted fw-bold gap-2" style={{ fontSize: '12px' }}>
                      <span className="border rounded-5 px-3 text-capitalize">
                        Airline <strong className="text-dark">{itinerary.airlines.map(getAirlineName).join(', ')}</strong>
                      </span>
                      <span className="border rounded-5 px-3 text-capitalize">
                        Total Trip Duration <strong className="text-dark">
                          {Math.floor(itinerary.outbound.journeyTime / 60)}h {itinerary.outbound.journeyTime % 60}m
                          {itinerary.return && ` + ${calculateDuration(itinerary.return.departureTime, itinerary.return.arrivalTime)}`}
                        </strong>
                      </span>
                      <span className="border rounded-5 px-3 text-capitalize">
                        Flight Class <strong className="text-dark">{itinerary.outbound.cabin || 'Economy'}</strong>
                      </span>
                      <span className="border rounded-5 px-3 text-capitalize">
                        Baggage <strong className="text-dark">{itinerary.outbound.baggage || '23kg'}</strong>
                      </span>
                      <span className="border rounded-5 px-3 text-capitalize">
                        {itinerary.outbound.refundable ? 'Refundable' : 'Non-refundable'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      {loading ? (
        <div className="d-flex flex-column justify-content-center align-items-center text-center py-4">
          <img
            src="/assets/img/search3.gif"
            alt="Loading..."
            style={{ width: '250px', marginBottom: '1rem' }}
          />
          <strong className="text-gray-500">Searching flights...</strong>
        </div>
      ) : paginatedItineraries.length === 0 && (
        <div className="d-flex flex-column justify-content-center align-items-center text-center py-4">
          <img
            src="/assets/img/flights_search.gif"
            alt="No flights found"
            style={{ width: '250px', marginBottom: '1rem' }}
          />
          <strong className="text-lg text-gray-600">No Results Found</strong>
        </div>
      )}
    </div>
  );
};

export default ItineraryList;