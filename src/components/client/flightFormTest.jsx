
      <form onSubmit={handleSubmit} className="space-y-4">
        <style>{datePickerStyles}</style>
        {errors.length > 0 && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
            <ul className="list-disc pl-5">
              {errors.map((error, index) => (
                <li key={index} className="text-sm">{error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Trip Type and Flight Type */}
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2 bg-gray-100 p-2 rounded-lg">
            <div className="flex items-center">
              <input
                type="radio"
                name="trip"
                id="one-way"
                value="oneway"
                checked={tripType === 'oneway'}
                onChange={() => setTripType('oneway')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <label htmlFor="one-way" className="ml-2 flex items-center text-sm font-medium text-gray-700">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="mr-1"
                >
                  <path d="M16.79 7.79l-1.41 1.42L17.17 11H3v2h14.17l-1.79 1.79 1.41 1.42L21 12z"></path>
                </svg>
                One Way
              </label>
            </div>
            <div className="flex items-center ml-4">
              <input
                type="radio"
                name="trip"
                id="round-trip"
                value="return"
                checked={tripType === 'return'}
                onChange={() => setTripType('return')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <label htmlFor="round-trip" className="ml-2 flex items-center text-sm font-medium text-gray-700">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="mr-1"
                >
                  <polygon points="8.41,12.41 7,11 2,16 7,21 8.41,19.59 5.83,17 21,17 21,15 5.83,15"></polygon>
                  <polygon points="15.59,11.59 17,13 22,8 17,3 15.59,4.41 18.17,7 3,7 3,9 18.17,9"></polygon>
                </svg>
                Round Trip
              </label>
            </div>
          </div>
          <div>
            <select
              name="flight_type"
              id="flight_type"
              className="rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500 py-2 px-3 text-sm"
              value={flightType}
              onChange={(e) => setFlightType(e.target.value)}
            >
              <option value="economy">Economy</option>
              <option value="economy_premium">Economy Premium</option>
              <option value="business">Business</option>
              <option value="first">First</option>
            </select>
          </div>
        </div>

        {/* Flight Fields */}
        <div className="space-y-4">
          {flights.map((flight, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <div className="absolute left-3 top-3 z-10">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M20.9999,20 C21.5522,20 21.9999,20.4477 21.9999,21 C21.9999,21.51285 21.613873,21.9355092 21.1165239,21.9932725 L20.9999,22 L2.99988,22 C2.44759,22 1.99988,21.5523 1.99988,21 C1.99988,20.48715 2.38591566,20.0644908 2.8832579,20.0067275 L2.99988,20 L20.9999,20 Z M7.26152,3.77234 C7.60270875,3.68092 7.96415594,3.73859781 8.25798121,3.92633426 L8.37951,4.0147 L14.564,9.10597 L18.3962,8.41394 C19.7562,8.16834 21.1459,8.64954 22.0628,9.68357 C22.5196,10.1987 22.7144,10.8812 22.4884,11.5492 C22.1394625,12.580825 21.3287477,13.3849891 20.3041894,13.729249 L20.0965,13.7919 L5.02028,17.8315 C4.629257,17.93626 4.216283,17.817298 3.94116938,17.5298722 L3.85479,17.4279 L0.678249,13.1819 C0.275408529,12.6434529 0.504260903,11.8823125 1.10803202,11.640394 L1.22557,11.6013 L3.49688,10.9927 C3.85572444,10.8966111 4.23617877,10.9655 4.53678409,11.1757683 L4.64557,11.2612 L5.44206,11.9612 L7.83692,11.0255 L3.97034,6.11174 C3.54687,5.57357667 3.77335565,4.79203787 4.38986791,4.54876405 L4.50266,4.51158 L7.26152,3.77234 Z M7.40635,5.80409 L6.47052,6.05484 L10.2339,10.8375 C10.6268063,11.3368125 10.463277,12.0589277 9.92111759,12.3504338 L9.80769,12.4028 L5.60866,14.0433 C5.29604667,14.1654333 4.9460763,14.123537 4.67296914,13.9376276 L4.57438,13.8612 L3.6268,13.0285 L3.15564,13.1547 L5.09121,15.7419 L19.5789,11.86 C20.0227,11.7411 20.3838,11.4227 20.5587,11.0018 C20.142625,10.53815 19.5333701,10.3022153 18.9191086,10.3592364 L18.7516,10.3821 L14.4682,11.1556 C14.218,11.2007714 13.9615551,11.149698 13.7491184,11.0154781 L13.6468,10.9415 L7.40635,5.80409 Z"></path>
                    </svg>
                  </div>
                  <Select
                    options={airports}
                    value={flight.origin}
                    onChange={(selected) => handleFlightChange(index, 'origin', selected)}
                    components={{ Option: CustomOption }}
                    styles={selectStyles}
                    placeholder="Flying From"
                    isSearchable
                    required
                    className="pl-10"
                  />
                </div>
                <div className="relative">
                  <div className="absolute left-3 top-3 z-10">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M20.99989,20.0001 C21.5522,20.0001 21.99989,20.4478 21.99989,21.0001 C21.99989,21.51295 21.6138716,21.9356092 21.1165158,21.9933725 L20.99989,22.0001 L2.99989,22.0001 C2.4476,22.0001 1.99989,21.5524 1.99989,21.0001 C1.99989,20.48725 2.38592566,20.0645908 2.8832679,20.0068275 L2.99989,20.0001 L20.99989,20.0001 Z M8.10346,3.20538 C8.00550211,2.52548211 8.59636283,1.96050997 9.25436746,2.06249271 L9.36455,2.08576 L12.1234,2.82499 C12.4699778,2.91787 12.7577704,3.15444975 12.9168957,3.47137892 L12.9704,3.59387 L15.7807,11.0953 L19.4455,12.4121 C20.7461,12.8794 21.709,13.991 21.9861,15.3449 C22.1241,16.0194 21.9516,16.7079 21.4218,17.1734 C20.6038313,17.8923687 19.4996906,18.183398 18.4402863,17.9692815 L18.2291,17.9197 L3.15287,13.8799 C2.75789727,13.7740818 2.45767661,13.459338 2.36633273,13.0674492 L2.34531,12.9477 L1.71732,7.68232 C1.63740111,7.01225556 2.22049639,6.4660062 2.86699575,6.56318572 L2.98162,6.58712 L5.25293,7.19571 C5.61177444,7.29186111 5.90680062,7.54177815 6.06199513,7.87418144 L6.11349,8.00256 L6.45329,9.00701 L8.99512,9.39414 L8.10346,3.20538 Z M10.2971,4.4062 L11.165,10.4298 C11.2559176,11.0610471 10.7489114,11.6064588 10.1303657,11.5834026 L10.0132,11.5723 L5.5565,10.8935 C5.22469556,10.8429222 4.94258198,10.6316333 4.79900425,10.3341508 L4.75183,10.2187 L4.34758,9.02368 L3.87642,8.89743 L4.25907,12.1058 L18.7467,15.9878 C19.1906,16.1067 19.6625,16.0115 20.0243,15.7345 C19.8949769,15.1206538 19.4803805,14.6088858 18.9139056,14.3528832 L18.7692,14.2943 L14.673,12.8225 C14.4336857,12.7364429 14.2371306,12.5639857 14.1203003,12.3415274 L14.0687,12.2263 L11.233,4.65695 L10.2971,4.4062 Z"></path>
                    </svg>
                  </div>
                  <div className="relative">
                    <Select
                      options={airports}
                      value={flight.destination}
                      onChange={(selected) => handleFlightChange(index, 'destination', selected)}
                      components={{ Option: CustomOption }}
                      styles={selectStyles}
                      placeholder="Flying To"
                      isSearchable
                      required
                      className="pl-10"
                    />
                    <button
                      type="button"
                      onClick={() => swapPlaces(index)}
                      className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-blue-100 rounded-full p-2 hover:bg-blue-200 transition-colors"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M3 12h18M12 3l9 9-9 9"></path>
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <DatePicker
                    selected={flight.depart}
                    onChange={(date) => handleFlightChange(index, 'depart', date)}
                    dateFormat="EEE d MMM"
                    className="w-full rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500 py-3 px-4 text-sm"
                    placeholderText="Depart Date"
                    minDate={new Date()}
                    showPopperArrow={false}
                  />
                  {index === 0 && tripType === 'return' && (
                    <DatePicker
                      selected={returnDate}
                      onChange={(date) => setReturnDate(date)}
                      dateFormat="EEE d MMM"
                      className="w-full rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500 py-3 px-4 text-sm"
                      placeholderText="Return Date"
                      minDate={flight.depart || new Date()}
                      showPopperArrow={false}
                    />
                  )}
                </div>
              </div>
              {flights.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeFlight(index)}
                  className="mt-2 text-red-500 hover:text-red-700 text-sm"
                >
                  Remove Flight
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Travellers and Submit */}
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="relative">
            <button
              type="button"
              className="flex items-center gap-2 bg-gray-100 rounded-lg py-2 px-4 text-sm text-gray-700 hover:bg-gray-200 transition-colors"
              onClick={() => setIsTravellersOpen(!isTravellersOpen)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              {guestText()}
            </button>
            <AnimatePresence>
              {isTravellersOpen && (
                <motion.div
                  className="absolute z-20 mt-2 w-64 bg-white rounded-lg shadow-lg p-4"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <strong className="text-gray-700">Adults</strong>
                        <div className="text-xs text-gray-500">+12 years</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="w-8 h-8 border border-gray-300 rounded hover:bg-gray-100"
                          onClick={() => setAdults(adults > 0 ? adults - 1 : 0)}
                        >
                          -
                        </button>
                        <input
                          type="text"
                          value={adults}
                          className="w-12 text-center border-gray-300 rounded"
                          readOnly
                        />
                        <button
                          type="button"
                          className="w-8 h-8 border border-gray-300 rounded hover:bg-gray-100"
                          onClick={() => setAdults(adults + 1)}
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <strong className="text-gray-700">Children</strong>
                        <div className="text-xs text-gray-500">2 - 11 years</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="w-8 h-8 border border-gray-300 rounded hover:bg-gray-100"
                          onClick={() => setChildren(children > 0 ? children - 1 : 0)}
                        >
                          -
                        </button>
                        <input
                          type="text"
                          value={children}
                          className="w-12 text-center border-gray-300 rounded"
                          readOnly
                        />
                        <button
                          type="button"
                          className="w-8 h-8 border border-gray-300 rounded hover:bg-gray-100"
                          onClick={() => setChildren(children + 1)}
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <strong className="text-gray-700">Infants</strong>
                        <div className="text-xs text-gray-500">-2 years</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="w-8 h-8 border border-gray-300 rounded hover:bg-gray-100"
                          onClick={() => setInfants(infants > 0 ? infants - 1 : 0)}
                        >
                          -
                        </button>
                        <input
                          type="text"
                          value={infants}
                          className="w-12 text-center border-gray-300 rounded"
                          readOnly
                        />
                        <button
                          type="button"
                          className="w-8 h-8 border border-gray-300 rounded hover:bg-gray-100"
                          onClick={() => setInfants(infants + 1)}
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="w-full bg-blue-600 text-white rounded-lg py-2 hover:bg-blue-700 transition-colors"
                      onClick={() => setIsTravellersOpen(false)}
                    >
                      Done
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="flex gap-4">
            <button
              type="button"
              className="text-blue-600 hover:text-blue-800 text-sm"
              onClick={addFlight}
            >
              + Add Another Flight
            </button>
            <button
              type="submit"
              className="bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z"></path>
                </svg>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                  Search
                </>
              )}
            </button>
          </div>
        </div>
      </form>