import React from 'react';

const FlightHeader = ({ onOpen, filteredItineraries, searchParams, formatDate, loading }) => {
  return (
    <div className="new-m-main-tit__content flex1 mb-3" style={{ background: "url('/assets/img/flight_search.avif') center bottom -212px / cover, rgb(50, 100, 255)" }}>
      <div className="stacked-color"></div>
      <div className="flex tit-travel-restriction-wrapper">
        <div className="flex">
        <span
          className="cursor-pointer fw-bold text-white font-semibold py-2 rounded-lg transition duration-200 flex items-center gap-2"
                  onClick={onOpen}
        >
          <i className="bi bi-sliders2"></i>
        </span>
        <h4 className="new-main-tit mx-2 fs-5 fw-light p-2">
          {loading ? (
          <span className="j_listABTit"><small>Searching flights...</small></span>
          ):(
          <span className="j_listABTit"><small><strong>{filteredItineraries.length}</strong> {searchParams?.tripType === 'return' ? 'Round-Trip Itineraries' : 'Flights'} Found</small></span>
          )}
        </h4>
        </div>
        <span className="title__fetched-time gap-2 d-flex" style={{ color: 'rgb(255, 255, 255)' }}>
          <span>{searchParams?.origin || 'JFK'}</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h13M12 5l7 7-7 7"/>
          </svg>
          <span>{searchParams?.destination || 'LAX'}</span>
          <span>{formatDate(searchParams?.departureDate)} {searchParams?.tripType === 'return' ? ` - ${formatDate(searchParams?.returnDate)}` : ''}</span>
        </span>
      </div>
    </div>
  );
};

export default FlightHeader;