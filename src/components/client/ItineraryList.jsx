import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import FlightSegment from '../../components/client/FlightSegment';

const ItineraryList = ({
  paginatedItineraries,
  openDetailsId,
  searchParams,
  setOpenDetailsId,
  getAirlineLogo,
  getAirlineName,
  formatDate,
  formatToYMD,
  formatTime,
  formatTimeOnly,
  calculateDuration,
  getAirportName,
  availableFlights,
  returnFlights,
  loading
}) => {
  const navigate = useNavigate();

  const handleSelectItinerary = (itinerary) => {
    console.info(`Adults: ${searchParams?.adults}`);
    // console.info(formatToYMD(itinerary.outbound.departureTime));
    const searchParams2 = new URLSearchParams({
      solutionId: itinerary.outbound.solutionId || '',
      tripType: itinerary.return ? 'return' : 'oneway',
      'flights[0][origin]': itinerary.outbound.origin,
      'flights[0][destination]': itinerary.outbound.destination,
      'flights[0][depart]': formatToYMD(itinerary.outbound.departureTime),
      'flights[0][airline]': itinerary.outbound.airline,
      'flights[0][flightNum]': itinerary.outbound.flightNumber,
      'flights[0][arrival]': itinerary.outbound.destination,
      'flights[0][arrivalDate]': formatToYMD(itinerary.outbound.arrivalTime),
      'flights[0][arrivalTime]': formatTimeOnly(itinerary.outbound.arrivalTime),
      'flights[0][departure]': itinerary.outbound.origin,
      'flights[0][departureDate]': formatToYMD(itinerary.outbound.departureTime),
      'flights[0][departureTime]': formatTimeOnly(itinerary.outbound.departureTime),
      'flights[0][bookingCode]': itinerary.outbound.bookingCode || '',
      returnDate: itinerary.return ? formatToYMD(itinerary.return.departureTime) : '',
      adults: searchParams?.adults || '1',
      children: searchParams?.children || '0',
      infants: searchParams?.infants || '0',
      cabin: itinerary.outbound.cabin || 'Economy',
      flightId: itinerary.outbound.id,
      returnFlightId: itinerary.return ? itinerary.return.id : '',
    });
    

    navigate(`/flight/booking-confirmation?${searchParams2.toString()}`);
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
              
              <div className="row border rounded-4 mb-3">
                <div className="col-md-10 col-12 p-3">
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

                  <div className="d-flex align-items-center text-sm gap-2 text-dark">
                    <span className="text-sm gap-2">Trip Duration:
                      {itinerary.journeyTime && (
                      <span>{Math.floor(itinerary.journeyTime / 60)}h {itinerary.journeyTime % 60}m</span>
                    )}
                    </span>
                    
                  </div>
                </div>

                <div className="col-md-2 col-12 rounded-end-4 lg:py-16 sm:py-2 bg-[#EEF4FB]">
                    <span className="text-[14px] text-[#aeaeae] font-thin">
                        From
                    </span>
                    <span className="fw-bold d-block mt-3 mb-3 lh-0">
                      USD {itinerary.totalPrice.toFixed(2)}
                    </span>
                    <button
                      type="button"
                      className="btn btn-primary d-flex gap-3 rounded-4"
                      onClick={() => handleSelectItinerary(itinerary)}
                    >
                      <span>Select Flight</span>
                      <i className="bi bi-arrow-right"></i>
                    </button>
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