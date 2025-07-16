import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import PaymentMethod from './PaymentMethod';

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
    isFormValid
    

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
                <button className="btn btn-secondary"><i className="bi bi-share-fill"></i> Share</button>
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
              <div className="traveler-summary mb-2">
                  <h4 className="fs-5">Travelers</h4>
                  <p className="text-muted text-sm">Please provide the details of all travelers.</p>

                  {/* Personal Informations */}
                  <div className="row gap-1 mb-3">
                      <div className="col-md-4">
                        <label className="label-text absolute top-0 text-gray-500 text-sm">Full Name</label>
                        <input
                          type="text"
                          name="full_name"
                          value={formData.full_name}
                          onChange={handleFormChange}
                          className="form-control w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-700"
                          placeholder="Arden BOUET"
                          required
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="label-text absolute top-0 text-gray-500 text-sm">Email</label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleFormChange}
                          className="form-control w-full border border-gray-300 rounded-lg p-3 pt-6 focus:ring-2 focus:ring-blue-700"
                          placeholder="arden.bouet@example.com"
                          required
                        />
                      </div>
                      <div className="col-md-3">
                        <label className="label-text absolute top-0 left-3 text-gray-500 text-sm">Phone</label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleFormChange}
                          className="form-control w-full border border-gray-300 rounded-lg p-3 pt-6 focus:ring-2 focus:ring-blue-700"
                          placeholder="+1234567890"
                          required
                        />
                      </div>
                  </div>

                  {/* Travelers Informations */}
                  <div id="accordion-flush" className="mb-4" data-accordion="collapse" data-active-classes="bg-white dark:bg-gray-900 text-gray-900 dark:text-white" data-inactive-classes="text-gray-500 dark:text-gray-400">
                    <h2 id="accordion-flush-heading-1">
                      <button type="button" class="flex pb-2 text-sm text-muted items-center justify-between w-full font-normal rtl:text-right border-b border-gray-200 gap-3" data-accordion-target="#accordion-flush-body-1" aria-expanded="true" aria-controls="accordion-flush-body-1">
                        <span>Traveler Information</span>
                        <svg data-accordion-icon class="w-3 h-3 rotate-180 shrink-0" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                          <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5 5 1 1 5"/>
                        </svg>
                      </button>
                    </h2>
                    <div id="accordion-flush-body-1" class="hidden" aria-labelledby="accordion-flush-heading-1">
                      {formData.travelers.map((traveler, index) => (
                        <div key={index} className="card bg-white rounded-lg shadow-md mb-3">
                          <div className="card-header bg-gray-100 p-3 font-semibold">
                            {traveler.type.charAt(0).toUpperCase() + traveler.type.slice(1)} Traveler <strong>{index + 1}</strong>
                            {index >= adults + children + infants && (
                              <button
                                type="button"
                                onClick={() => removeTraveler(index)}
                                className="ml-2 text-red-600 hover:text-red-800 text-sm"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                          <div className="card-body p-6">
                            <input type="hidden" name={`traveler_type_${index}`} value={traveler.type} />
                            <div className="row g-2">
                              <div className="col-md-2">
                                <div className="form-floating relative">
                                  <select
                                    name={`traveler_title_${index}`}
                                    value={traveler.title}
                                    onChange={(e) => handleFormChange(e, index)}
                                    className="form-select w-full border border-gray-300 rounded-lg p-3 pt-6 focus:ring-2 focus:ring-blue-700"
                                  >
                                    <option value="Mr">Mr</option>
                                    <option value="Miss">Miss</option>
                                    <option value="Mrs">Mrs</option>
                                  </select>
                                  <label className="label-text absolute top-0 left-3 text-gray-500 text-sm">Title</label>
                                </div>
                              </div>
                              <div className="col-md-4">
                                <div className="form-floating relative">
                                  <input
                                    type="text"
                                    name={`traveler_first_name_${index}`}
                                    value={traveler.first_name}
                                    onChange={(e) => handleFormChange(e, index)}
                                    className="form-control w-full border border-gray-300 rounded-lg p-3 pt-6 focus:ring-2 focus:ring-blue-700"
                                    placeholder="First Name"
                                    required
                                  />
                                  <label className="label-text absolute top-0 left-3 text-gray-500 text-sm">First Name</label>
                                </div>
                              </div>
                              <div className="col-md-6">
                                <div className="form-floating relative">
                                  <input
                                    type="text"
                                    name={`traveler_last_name_${index}`}
                                    value={traveler.last_name}
                                    onChange={(e) => handleFormChange(e, index)}
                                    className="form-control w-full border border-gray-300 rounded-lg p-3 pt-6 focus:ring-2 focus:ring-blue-700"
                                    placeholder="Last Name"
                                    required
                                  />
                                  <label className="label-text absolute top-0 left-3 text-gray-500 text-sm">Last Name</label>
                                </div>
                              </div>
                            </div>
                            <div className="row mt-1 g-2">
                              <div className="col-md-6">
                                <div className="form-floating relative">
                                  
                                  <select
                                    name={`traveler_nationality_${index}`}
                                    value={traveler.nationality}
                                    onChange={(e) => handleFormChange(e, index)}
                                    className="form-select w-full border border-gray-300 rounded-lg p-3 pt-6 focus:ring-2 focus:ring-blue-700"
                                    required
                                  >
                                    <option value="">Select Nationality</option>
                                    {countries.map(country => (
                                      <option key={country.code} value={country.code}>{country.name}</option>
                                    ))}
                                  </select>
                                  <label className="label-text absolute top-0 left-3 text-gray-500 text-sm">Nationality</label>
                                </div>
                              </div>
                              <div className="col-md-6">
                                <div className="row g-2">
                                  <div className="col-5">
                                    <div className="form-floating relative">
                                      <select
                                        name={`traveler_dob_month_${index}`}
                                        value={traveler.dob_month}
                                        onChange={(e) => handleFormChange(e, index)}
                                        className="form-select w-full border border-gray-300 rounded-lg p-3 pt-6 focus:ring-2 focus:ring-blue-700"
                                        required
                                      >
                                        <option value="">Month</option>
                                        {months.map(month => (
                                          <option key={month.value} value={month.value}>{month.label}</option>
                                        ))}
                                      </select>
                                      <label className="label-text absolute top-0 left-3 text-gray-500 text-sm">Date of Birth</label>
                                    </div>
                                  </div>
                                  <div className="col-3">
                                    <div className="form-floating relative">
                                      <select
                                        name={`traveler_dob_day_${index}`}
                                        value={traveler.dob_day}
                                        onChange={(e) => handleFormChange(e, index)}
                                        className="form-select w-full border border-gray-300 rounded-lg p-3 pt-6 focus:ring-2 focus:ring-blue-700"
                                        required
                                      >
                                        <option value="">Day</option>
                                        {days.map(day => (
                                          <option key={day.value} value={day.value}>{day.label}</option>
                                        ))}
                                      </select>
                                      <label className="label-text absolute top-0 left-3 text-gray-500 text-sm">Day</label>
                                    </div>
                                  </div>
                                  <div className="col-4">
                                    <div className="form-floating relative">
                                      <select
                                        name={`traveler_dob_year_${index}`}
                                        value={traveler.dob_year}
                                        onChange={(e) => handleFormChange(e, index)}
                                        className="form-select w-full border border-gray-300 rounded-lg p-3 pt-6 focus:ring-2 focus:ring-blue-700"
                                        required
                                      >
                                        <option value="">Year</option>
                                        {dobYears.map(year => (
                                          <option key={year.value} value={year.value}>{year.label}</option>
                                        ))}
                                      </select>
                                      <label className="label-text absolute top-0 left-3 text-gray-500 text-sm">Year</label>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <hr className="my-4" />
                            <div className="row g-2">
                              <div className="col-md-12 relative">
                                <p className="m-0 text-end absolute right-8 top-4 text-gray-400 text-sm z-10">
                                  <strong>6 - 15 Numbers</strong>
                                </p>
                                <div className="form-floating relative">
                                  <input
                                    type="text"
                                    name={`traveler_passport_${index}`}
                                    value={traveler.passport}
                                    onChange={(e) => handleFormChange(e, index)}
                                    className="form-control w-full border border-gray-300 rounded-lg p-3 pt-6 focus:ring-2 focus:ring-blue-700"
                                    placeholder="Passport or ID"
                                    required
                                    minLength={6}
                                    maxLength={15}
                                  />
                                  <label className="label-text absolute top-0 left-3 text-gray-500 text-sm">Passport or ID</label>
                                </div>
                              </div>
                              <div className="col-md-6 mt-3">
                                <div className="row g-2">
                                  <div className="col-5">
                                    <div className="form-floating relative">
                                      <select
                                        name={`traveler_passport_issuance_month_${index}`}
                                        value={traveler.passport_issuance_month}
                                        onChange={(e) => handleFormChange(e, index)}
                                        className="form-select w-full border border-gray-300 rounded-lg p-3 pt-6 focus:ring-2 focus:ring-blue-700"
                                        required
                                      >
                                        <option value="">Month</option>
                                        {months.map(month => (
                                          <option key={month.value} value={month.value}>{month.label}</option>
                                        ))}
                                      </select>
                                      <label className="label-text absolute top-0 left-3 text-gray-500 text-sm">Issuance Date</label>
                                    </div>
                                  </div>
                                  <div className="col-3">
                                    <div className="form-floating relative">
                                      <select
                                        name={`traveler_passport_issuance_day_${index}`}
                                        value={traveler.passport_issuance_day}
                                        onChange={(e) => handleFormChange(e, index)}
                                        className="form-select w-full border border-gray-300 rounded-lg p-3 pt-6 focus:ring-2 focus:ring-blue-700"
                                        required
                                      >
                                        <option value="">Day</option>
                                        {days.map(day => (
                                          <option key={day.value} value={day.value}>{day.label}</option>
                                        ))}
                                      </select>
                                      <label className="label-text absolute top-0 left-3 text-gray-500 text-sm">Day</label>
                                    </div>
                                  </div>
                                  <div className="col-4">
                                    <div className="form-floating relative">
                                      <select
                                        name={`traveler_passport_issuance_year_${index}`}
                                        value={traveler.passport_issuance_year}
                                        onChange={(e) => handleFormChange(e, index)}
                                        className="form-select w-full border border-gray-300 rounded-lg p-3 pt-6 focus:ring-2 focus:ring-blue-700"
                                        required
                                      >
                                        <option value="">Year</option>
                                        {issuanceYears.map(year => (
                                          <option key={year.value} value={year.value}>{year.label}</option>
                                        ))}
                                      </select>
                                      <label className="label-text absolute top-0 left-3 text-gray-500 text-sm">Year</label>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="col-md-6 mt-3">
                                <div className="row g-2">
                                  <div className="col-5">
                                    <div className="form-floating relative">
                                      <select
                                        name={`traveler_passport_expiry_month_${index}`}
                                        value={traveler.passport_expiry_month}
                                        onChange={(e) => handleFormChange(e, index)}
                                        className="form-select w-full border border-gray-300 rounded-lg p-3 pt-6 focus:ring-2 focus:ring-blue-700"
                                        required
                                      >
                                        <option value="">Month</option>
                                        {months.map(month => (
                                          <option key={month.value} value={month.value}>{month.label}</option>
                                        ))}
                                      </select>
                                      <label className="label-text absolute top-0 left-3 text-gray-500 text-sm">Expiry Date</label>
                                    </div>
                                  </div>
                                  <div className="col-3">
                                    <div className="form-floating relative">
                                      <select
                                        name={`traveler_passport_expiry_day_${index}`}
                                        value={traveler.passport_expiry_day}
                                        onChange={(e) => handleFormChange(e, index)}
                                        className="form-select w-full border border-gray-300 rounded-lg p-3 pt-6 focus:ring-2 focus:ring-blue-700"
                                        required
                                      >
                                        <option value="">Day</option>
                                        {days.map(day => (
                                          <option key={day.value} value={day.value}>{day.label}</option>
                                        ))}
                                      </select>
                                      <label className="label-text absolute top-0 left-3 text-gray-500 text-sm">Day</label>
                                    </div>
                                  </div>
                                  <div className="col-4">
                                    <div className="form-floating relative">
                                      <select
                                        name={`traveler_passport_expiry_year_${index}`}
                                        value={traveler.passport_expiry_year}
                                        onChange={(e) => handleFormChange(e, index)}
                                        className="form-select w-full border border-gray-300 rounded-lg p-3 pt-6 focus:ring-2 focus:ring-blue-700"
                                        required
                                      >
                                        <option value="">Year</option>
                                        {expiryYears.map(year => (
                                          <option key={year.value} value={year.value}>{year.label}</option>
                                        ))}
                                      </select>
                                      <label className="label-text absolute top-0 left-3 text-gray-500 text-sm">Year</label>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      <div className="flex gap-4 mt-4">
                        <button
                          type="button"
                          onClick={() => addTraveler('adult')}
                          className="bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-800 transition duration-200"
                          disabled={formData.travelers.length >= 9}
                        >
                          Add Adult
                        </button>
                        <button
                          type="button"
                          onClick={() => addTraveler('child')}
                          className="bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-800 transition duration-200"
                          disabled={formData.travelers.length >= 9}
                        >
                          Add Child
                        </button>
                        <button
                          type="button"
                          onClick={() => addTraveler('infant')}
                          className="bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-800 transition duration-200"
                          disabled={formData.travelers.length >= 9}
                        >
                          Add Infant
                        </button>
                      </div>
                    </div>
                  </div>

              </div>

              {/* Payment Methods */}
              <PaymentMethod 
                formData={formData} 
                handleFormChange={handleFormChange} 
                isFormValid={isFormValid} 
              />

              {/* <div className="payment-methods mb-4">
                  <h4 className="fs-5">Payment Method</h4>
                  <p className="text-muted text-sm">Please select your payment method.</p>
                  <div className="space-y-3">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="payment_method"
                        value="credit_card"
                        checked={formData.payment_method === 'credit_card'}
                        onChange={handleFormChange}
                        className="form-check-input mr-2 h-5 w-5 text-blue-700 focus:ring-blue-700"
                        required
                      />
                      Credit Card
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="payment_method"
                        value="paypal"
                        checked={formData.payment_method === 'paypal'}
                        onChange={handleFormChange}
                        className="form-check-input mr-2 h-5 w-5 text-blue-700 focus:ring-blue-700"
                      />
                      PayPal
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="payment_method"
                        value="bank_transfer"
                        checked={formData.payment_method === 'bank_transfer'}
                        onChange={handleFormChange}
                        className="form-check-input mr-2 h-5 w-5 text-blue-700 focus:ring-blue-700"
                      />
                      Bank Transfer
                    </label>
                  </div>
              </div> */}

            </motion.div>

            {/* Cancellation Policy */}
            {cancellation_policy && (
              <motion.div
                className="alert alert-danger bg-red-100 border border-red-400 rounded-lg p-4 mt-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <p className="font-bold text-red-700 text-lg">Cancellation Policy</p>
                <div className="to--be">
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
              </motion.div>
            )}

            {/* Terms Checkbox */}
            <motion.div
              className="mt-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <div className="input-box">
                <div className="d-flex gap-3 alert border border-gray-300 rounded-lg p-4">
                  <input
                    type="checkbox"
                    id="agreechb"
                    name="agree_terms"
                    checked={formData.agree_terms}
                    onChange={handleFormChange}
                    className="form-check-input h-5 w-5 text-blue-700 focus:ring-blue-700 cursor-pointer"
                  />
                  <label htmlFor="agreechb" className="text-gray-600">
                    I agree to all{' '}
                    <a href="/page/terms-of-use" target="_blank" className="text-blue-700 hover:underline">
                      Terms & Conditions
                    </a>
                  </label>
                </div>
              </div>
            </motion.div>

            {/* Confirm Button */}
            <motion.div
              className="btn-box mt-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <button
                type="submit"
                disabled={!formData.agree_terms || isSubmitting}
                className="btn btn-primary w-full bg-gradient-to-r from-blue-600 to-blue-800 text-white font-semibold py-4 rounded-lg hover:from-blue-700 hover:to-blue-900 transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
                id="booking"
              >
                Confirm Booking
              </button>
            </motion.div>
          </div>
    );
}

export default BookingForm;

