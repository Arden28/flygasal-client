import React from 'react';

const FlightSegment = ({ flight, segmentType, formatDate, formatTime, calculateDuration, getAirportName }) => {
  const getStopoverDetails = (flight) => {
    if (flight.stops === 0 || !flight.stopoverAirportCodes || flight.stopoverAirportCodes.length === 0) {
      return (
        <div className="d-flex flex-wrap">
          <small className="d-sm-inline">Direct flight, no stopovers</small>
        </div>
      );
    }
    return flight.stopoverAirportCodes.map((code, idx) => (
      <div key={idx} className="d-flex flex-wrap mt-2">
        <div className="flight--ddt fw-bold d-flex align-items-center gap-2 flex-wrap">
          <span>Stop {idx + 1}</span>
        </div>
        <small className="d-sm-inline">
          Layover at <b>{getAirportName(code)}</b>
          {flight.stopoverDurations && flight.stopoverDurations[idx]
            ? `, ${flight.stopoverDurations[idx]}`
            : ', N/A'}
        </small>
      </div>
    ));
  };

  return (
    <div className="mb-3">
      <h6 className="mb-1"><strong>{segmentType} Flight</strong></h6>
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
          {getStopoverDetails(flight)}
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
  );
};

export default FlightSegment;