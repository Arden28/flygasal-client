import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import PaymentMethod from './PaymentMethod';
import TravelerInformation from './TravelerInformation';

const BookingForm = ({
    searchParams,
    formData,
    setFormData,
    handleFormChange,
    isSubmitting,
    cancellation_policy,
    setCancellationPolicy,
    showReadMore,
    setShowReadMore,
    adults,
    children,
    infants,
    addTraveler,
    removeTraveler,
    countries,
    months,
    days,
    dobYears,
    issuanceYears,
    expiryYears,
    showCancellation,
    setShowCancellation,
    getAirlineLogo,
    getAirlineName,
    outbound,
    returnFlight,
    formatDateMonth,
    formatDate,
    formatTime,
    getCityName,
    getAirportName,
    getPassengerSummary,
    tripType,
    calculateDuration,
    isFormValid,
    totalPrice
    

}) => {
    

    return(
          <div className="w-full lg:w-2/3">
            {/* Personal Information */}
            <motion.div
              className="form-box bg-white rounded-3 shadow-md p-3 mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="form-title-wrap p-0 d-flex justify-between mb-2 border-0">
                <h3 className="title fs-3 font-bold text-gray-800 mb-6">Your Trip</h3>
                <span className="btn btn-secondary cursor-pointer"><i className="bi bi-share-fill"></i> Share</span>
              </div>

              <div className="justify-content-between d-flex mb-4">
                 <div className="text-start">
                    <span>{getCityName(outbound.origin)} to {getCityName(outbound.destination)}, {tripType === 'oneway' ? `${formatDateMonth(outbound.departureTime)}` : tripType === 'return' ? ` to ${formatDateMonth(returnFlight.arrivalTime)}` : ''} </span><br />
                  <small>{tripType === 'oneway' ? 'One-way, ' : tripType === 'return' ? 'Round-trip, ' : ''} {outbound.cabin || 'Economy'}, {getPassengerSummary(adults, children, infants)} <span className="cursor-pointer"><i className="bi bi-pen-fill"></i></span></small>
                 </div>
                  <img
                    src={getAirlineLogo(outbound.airline)}
                    alt={getAirlineName(outbound.airline)}
                    className="text-end" style={{ height: '40px' }}
                  />
              </div>

              {/* Flights */}
              <div className="flight-summary mb-4">
                <h4 className="fs-5 mb-4">Flights</h4>

                {/* Outbound */}
                <div className="flight-item rounded-3 border mb-3">
                    {/* Header */}
                    <div className="flight-header d-flex gap-2 p-2 bg-gray-100 border-bottom">
                        <i className="bi bi-airplane-engines-fill"></i>
                        <div className="">
                            <span className="fs-6 font-medium"> {getCityName(outbound.origin)} - {getCityName(outbound.destination)}</span>
                            <div className="text-xs">{tripType === 'oneway' ? `${formatDate(outbound.departureTime)}` : tripType === 'return' ? ` - ${formatDate(returnFlight.arrivalTime)}` : ''}</div>
                        </div>
                    </div>
                    {/* Body */}
                    <div className="flight-body p-0">
                      <div className="border-bottom mb-3 p-2 justify-content-between d-flex">
                        <span className="text-md pl-3 font-medium text-start">Departure • {formatDate(outbound.departureTime)}</span>
                        <span className="pr-2">{calculateDuration(outbound.departureTime, outbound.arrivalTime)}</span>
                      </div>
                      <div className="p-3">
                        <div className="justify-content-between d-flex">
                          <div className="d-flex gap-2">
                            <img
                              src={getAirlineLogo(outbound.airline)}
                              alt={getAirlineName(outbound.airline)}
                              className="text-start" style={{ height: '25px' }}
                            />
                            <span className="text-xs p-1">{outbound.flightNumber || 'N/A'}</span>
                          </div>
                          <span className="text-end text-sm">
                            {outbound.cabin || 'Economy'}
                          </span>
                        </div>
                        <div className="pb-3">
                              <div className="flex justify-between gap-4 w-full mx-auto mt-6">
                                {/* Departure */}
                                <div className="text-center">
                                  <div className="text-lg font-semibold text-gray-800">{formatTime(outbound.departureTime)}</div>
                                  <div className="text-sm text-gray-500">{getAirportName(outbound.origin)}</div>
                                </div>

                                {/* Line and Plane */}
                                <div className="relative flex-1 h-1 bg-gray-300 mx-2">
                                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-1">
                                    <i className="bi bi-airplane rotate-90"></i>
                                  </div>
                                </div>

                                {/* Arrival */}
                                <div className="text-center">
                                  <div className="text-lg font-semibold text-gray-800">{formatTime(outbound.arrivalTime)}</div>
                                  <div className="text-sm text-gray-500">{getAirportName(outbound.destination)}</div>
                                </div>
                              </div>
                        </div>
                      </div>
                    </div>
                </div>

                {/* Return */}
                {tripType === 'return' && returnFlight && (
                <div className="flight-item rounded-3 border">
                    {/* Header */}
                    <div className="flight-header d-flex justify-content-between gap-2 p-2 border-bottom">
                        <span className="text-md pl-3 font-medium text-start">Return • {formatDate(returnFlight.departureTime)}</span>
                        <span className="pr-2 text-end">{calculateDuration(returnFlight.departureTime, returnFlight.arrivalTime)}</span>
                    </div>
                    {/* Body */}
                    <div className="flight-body p-0">
                      
                      <div className="p-3">
                        <div className="justify-content-between d-flex">
                          <div className="d-flex gap-2">
                            <img
                              src={getAirlineLogo(returnFlight.airline)}
                              alt={getAirlineName(returnFlight.airline)}
                              className="text-start" style={{ height: '25px' }}
                            />
                            <span className="text-xs p-1">{returnFlight.flightNumber || 'N/A'}</span>
                          </div>
                          <span className="text-end text-sm">
                            {returnFlight.cabin || 'Economy'}
                          </span>
                        </div>
                        <div className="pb-3">
                              <div className="flex justify-between gap-4 w-full mx-auto mt-6">
                                {/* Departure */}
                                <div className="text-center">
                                  <div className="text-lg font-semibold text-gray-800">{formatTime(returnFlight.departureTime)}</div>
                                  <div className="text-sm text-gray-500">{getAirportName(returnFlight.origin)}</div>
                                </div>

                                {/* Line and Plane */}
                                <div className="relative flex-1 h-1 bg-gray-300 mx-2">
                                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-1">
                                    <i className="bi bi-airplane rotate-90"></i>
                                  </div>
                                </div>

                                {/* Arrival */}
                                <div className="text-center">
                                  <div className="text-lg font-semibold text-gray-800">{formatTime(returnFlight.arrivalTime)}</div>
                                  <div className="text-sm text-gray-500">{getAirportName(returnFlight.destination)}</div>
                                </div>
                              </div>
                        </div>
                      </div>
                    </div>
                </div>)}

              </div>


              {/* Travelers */}
              <TravelerInformation 
                formData={formData}
                handleFormChange={handleFormChange}
                adults={adults}
                children={children}
                infants={infants}
                addTraveler={addTraveler}
                removeTraveler={removeTraveler}
                countries={countries}
                months={months}
                days={days}
                dobYears={dobYears}
                issuanceYears={issuanceYears}
                expiryYears={expiryYears}
                getAirlineLogo={getAirlineLogo}
              />

              {/* Payment Methods */}
              <PaymentMethod 
                formData={formData} 
                handleFormChange={handleFormChange} 
                isFormValid={isFormValid} 
                totalPrice={totalPrice}
              />
              
              {/* Cancellation Policy */}
              {cancellation_policy && (
              <div className="cancellation-policy mb-2">
                  <h4 className="fs-5">Cancellation Policy</h4>
                  <div className="p-3 bg-red-100">
                    <p className="text-sm text-gray-600">{cancellation_policy}</p>
                    <div className={showReadMore ? 'read--more' : 'read--more hidden'}>
                      <input
                        className="d-none hidden"
                        type="checkbox"
                        id="show--more"
                        checked={showCancellation}
                        onChange={() => setShowCancellation(!showCancellation)}
                      />
                      <label
                        className="d-block block w-full font-bold text-red-600 cursor-pointer flex items-center gap-2 text-sm"
                        htmlFor="show--more"
                        id="to--be_1"
                      >
                        Read More
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#b02a37"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M6 9l6 6 6-6" />
                        </svg>
                      </label>
                      <label
                        className="d-none hidden w-full font-bold text-red-600 cursor-pointer flex items-center gap-2 text-sm"
                        htmlFor="show--more"
                        id="to--be_2"
                      >
                        Read Less
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#b02a37"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M18 15l-6-6-6 6" />
                        </svg>
                      </label>
                    </div>
                  </div>
              </div>)}

              {/* Terms Checkbox */}
              <div className="term-checkbox mb-2 mt-3">
                <div className="input-box p-0">
                  <div className="d-flex gap-3 alert p-0">
                    <input
                      type="checkbox"
                      id="agreechb"
                      name="agree_terms"
                      checked={formData.agree_terms}
                      onChange={handleFormChange}
                      className="form-check-input h-5 w-5 text-blue-700 focus:ring-blue-700 cursor-pointer"
                    />
                    <label htmlFor="agreechb" className="text-gray-600 p-0">
                      I agree to all{' '}
                      <a href="/page/terms-of-use" target="_blank" className="text-blue-700 hover:underline">
                        Terms & Conditions
                      </a>
                    </label>
                  </div>
                </div>
              </div>

            </motion.div>
          </div>
    );
}

export default BookingForm;

