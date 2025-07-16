import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const FlightDetails = ({
    getCityName, 
    getAirlineName, 
    getAirlineLogo, 
    getAirportName, 
    formatTime, 
    formatDate,
    outbound,
    returnFlight,
    tripType,
    adults,
    children,
    infants,
    isAgent,
    agentFee,
    setAgentFee,
    finalPrice,
    totalPrice,
    getPassengerSummary,
    calculateDuration,
    isFormValid
}) => {
    
  const navigate = useNavigate();

    
    return (

          <div className="w-full lg:w-1/3">
            <div className="bg-white rounded-lg sticky p-3 top-4">
              {/* Outbound Flight */}
              <motion.div
                className="mb-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                <div className="form-title-wrap p-0 border-0 mb-2">
                    <h6 className="text-capitalize m-0 text-lg font-semibold">
                        {getCityName(outbound.origin)} to {getCityName(outbound.destination)}
                    </h6>
                  <small>{tripType === 'oneway' ? 'One-way, ' : tripType === 'return' ? 'Round-trip, ' : ''} {outbound.cabin || 'Economy'}, {getPassengerSummary(adults, children, infants)}</small>
                </div>
                <div className="form-content p-0">
                  <div className="card-item shadow-none radius-none p-0 mb-0">

                    {/* Airline */}
                    <div className="airline justify-content-between d-flex mb-2">
                        <span className="text-start text-sm">
                            Flying with {getAirlineName(outbound.airline)}
                        </span>
                        <span className="text-end">
                            <img
                            src={getAirlineLogo(outbound.airline)}
                            alt={getAirlineName(outbound.airline)}
                            className="" style={{ height: '20px' }}
                            />
                        </span>
                    </div>

                    {/* Trip Detail */}
                    <div id="accordion-collapse" data-accordion="collapse" className="border mb-4 border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                        {/* Outbound */}
                        <h2 id="accordion-collapse-heading-3">
                            <button
                                type="button"
                                className="flex items-center justify-between w-full p-3 pb-1 bg-white transition-all text-black font-normal"
                                data-accordion-target={`#accordion-collapse-body-${outbound.id}`}
                                aria-expanded="true"
                                aria-controls={`accordion-collapse-body-${outbound.id}`}
                                >
                                <div className="flex flex-col text-left">
                                    <h6 className="fs-6">
                                    {outbound.origin} <i className="bi bi-arrow-right"></i> {outbound.destination}
                                    <span className="text-sm"> {formatDate(outbound.departureTime)}</span>
                                    </h6>
                                    <div className="text-sm">
                                
                                                {outbound.stops > 0
                                                    ? outbound.stopoverAirportCodes?.join(' ') || `${outbound.origin} ${outbound.destination}`
                                                    : 'Nonstop'} • {calculateDuration(outbound.departureTime, outbound.arrivalTime)}
                                    </div>
                                </div>

                                <svg
                                    data-accordion-icon
                                    className="w-3 h-3 rotate-180 shrink-0 font-normal"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 10 6"
                                >
                                    <path
                                    stroke="currentColor"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M9 5 5 1 1 5"
                                    />
                                </svg>
                            </button>
                        </h2>
                        <div id={`accordion-collapse-body-${outbound.id}`} className="hidden" aria-labelledby="accordion-collapse-heading-3">
                            <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                                <div className="d-block">
                                    <h6 className="fs-6">{formatTime(outbound.departureTime)} - {formatTime(outbound.arrivalTime)}</h6>
                                    <span className="text-sm">{getAirportName(outbound.origin)} - {getAirportName(outbound.destination)}</span>

                                    <div className="text-xs text-muted mt-1 justify-content-between d-flex">
                                        <span className="text-start d-flex gap-1">
                                            <img
                                            src={getAirlineLogo(outbound.airline)}
                                            alt={getAirlineName(outbound.airline)}
                                            className="" style={{ height: '15px' }}
                                            />
                                            {getAirlineName(outbound.airline) || 'N/A'}
                                        </span>
                                        <span className="text-end">{outbound.flightNumber || 'N/A'}</span>
                                    </div>

                                    <div className="text-xs text-muted mt-1 justify-content-between d-flex">
                                        <span className="text-start"><i className="bi bi-airplane"></i> Plane type</span>
                                        <span className="text-end">{outbound.planeType || 'N/A'}</span>
                                    </div>
                                    
                                    <div className="text-xs text-muted mt-1 justify-content-between d-flex">
                                        <span className="text-start">Class</span>
                                        <span className="text-end">{outbound.cabin || 'Economy'}</span>
                                    </div>

                                    <div className="text-xs text-muted mt-1 justify-content-between d-flex">
                                        <span className="text-start"><i className="bi bi-suitcase2"></i> Baggage</span>
                                        <span className="text-end">{outbound.baggage || 'N/A'}</span>
                                    </div>

                                    <div className="text-xs text-muted mt-1 justify-content-between d-flex">
                                        <span className="text-start"><i className="bi bi-suitcase2"></i> Cabin Baggage</span>
                                        <span className="text-end">{outbound.cabin_baggage || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Divider */}
                        <hr className="border-t mb-1 mt-1 border-gray-200 dark:border-gray-700" />

                        {/* Return Flight */}
                        {tripType === 'return' && returnFlight && (
                            <div>
                                <h2 id="accordion-collapse-heading-3">
                                    <button type="button"
                                    className="flex items-center justify-between w-full p-3 pb-1 bg-white transition-all text-black font-normal"
                                    data-accordion-target={`#accordion-collapse-body-${returnFlight.id}`} aria-expanded="true" aria-controls={`accordion-collapse-body-${returnFlight.id}`}>
                                        <div className="flex flex-col text-left">
                                            <h6 className="fs-6">
                                            {returnFlight.origin} <i className="bi bi-arrow-right"></i> {returnFlight.destination}
                                            <span className="text-sm"> {formatDate(returnFlight.departureTime)}</span>
                                            </h6>
                                            <div className="text-sm">
                                                
                                                {returnFlight.stops > 0
                                                    ? returnFlight.stopoverAirportCodes?.join(' ') || `${returnFlight.origin} ${returnFlight.destination}`
                                                    : 'Nonstop'} • {calculateDuration(returnFlight.departureTime, returnFlight.arrivalTime)}
                                            </div>
                                        </div>

                                        <svg
                                            data-accordion-icon
                                            className="w-3 h-3 rotate-180 shrink-0 font-normal"
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 10 6"
                                        >
                                            <path
                                            stroke="currentColor"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M9 5 5 1 1 5"
                                            />
                                        </svg>
                                    </button>
                                </h2>
                                <div id={`accordion-collapse-body-${returnFlight.id}`} className="hidden" aria-labelledby="accordion-collapse-heading-3">
                                    <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                                        <div className="d-block">
                                            <h6 className="fs-6">{formatTime(returnFlight.departureTime)} - {formatTime(returnFlight.arrivalTime)}</h6>
                                            <span className="text-sm">{getAirportName(returnFlight.origin)} - {getAirportName(returnFlight.destination)}</span>

                                            <div className="text-xs text-muted mt-1 justify-content-between d-flex">
                                                <span className="text-start d-flex gap-1">
                                                    <img
                                                    src={getAirlineLogo(returnFlight.airline)}
                                                    alt={getAirlineName(returnFlight.airline)}
                                                    className="" style={{ height: '15px' }}
                                                    />
                                                    {getAirlineName(returnFlight.airline) || 'N/A'}
                                                </span>
                                                <span className="text-end">{returnFlight.flightNumber || 'N/A'}</span>
                                            </div>

                                            <div className="text-xs text-muted mt-1 justify-content-between d-flex">
                                                <span className="text-start"><i className="bi bi-airplane"></i> Plane type</span>
                                                <span className="text-end">{returnFlight.planeType || 'N/A'}</span>
                                            </div>
                                            
                                            <div className="text-xs text-muted mt-1 justify-content-between d-flex">
                                                <span className="text-start">Class</span>
                                                <span className="text-end">{returnFlight.cabin || 'Economy'}</span>
                                            </div>

                                            <div className="text-xs text-muted mt-1 justify-content-between d-flex">
                                                <span className="text-start"><i className="bi bi-suitcase2"></i> Baggage</span>
                                                <span className="text-end">{returnFlight.baggage || 'N/A'}</span>
                                            </div>

                                            <div className="text-xs text-muted mt-1 justify-content-between d-flex">
                                                <span className="text-start"><i className="bi bi-suitcase2"></i> Cabin Baggage</span>
                                                <span className="text-end">{returnFlight.cabin_baggage || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Price Summary */}
                    <div className="price-summary mb-3">

                        {/* Price */}
                        {isAgent === true && (
                        <div className="d-flex justify-content-between align-items-center mt-2">
                            <span className="text-start text-sm font-semibold">Price</span>
                            <span className="text-end text-sm font-semibold">
                                ${totalPrice.toFixed(2)}
                            </span>
                        </div>)}

                        {/* Agent Service */}
                        {isAgent === true && (
                        <div className="d-flex justify-content-between align-items-center mt-2">
                            <span className="text-start text-sm font-semibold">Agent Service Fee</span>
                            <span className="text-end text-sm font-semibold">
                                + $
                                <input
                                    id="agent_fee"
                                    type="phone"
                                    value={agentFee}
                                    onChange={(e) => {
                                        const raw = e.target.value.replace(/[^0-9]/g, '');
                                        const cleaned = raw.replace(/^0+(?=\d)/, ''); // remove leading zeros, but not the only 0
                                        setAgentFee(cleaned === '' ? 0 : parseFloat(cleaned));
                                    }}
                                    className="p-0 appearance-none w-[35px] bg-transparent border-none text-black focus:outline-none focus:ring-0 text-sm"
                                />
                            </span>
                        </div>)}

                        {/* Booking Total */}
                        <div className="d-flex justify-content-between align-items-center mt-1">
                            <span className="text-start text-lg font-semibold">Total</span>
                            <span className="text-end text-lg font-bold">
                                ${(finalPrice + agentFee).toFixed(2)}
                            </span>
                        </div>
                    </div>

                    {/* Checkout */}
                    <div className="checkout-btn">
                        <button
                            type="button"
                            onClick={() => navigate('/flight/booking-confirmation')}
                            disabled={!isFormValid}
                            className="btn btn-primary w-100 text-white font-semibold py-2 px-4 rounded-lg hover:from-blue-700 hover:to-blue-900 transition duration-200"
                        >
                            Pay & Book Now
                        </button>
                    </div>
                  </div>
                </div>
              </motion.div>

            </div>
          </div>
    );
}

export default FlightDetails;