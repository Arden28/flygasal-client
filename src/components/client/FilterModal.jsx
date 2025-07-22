import React from 'react';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import { motion, AnimatePresence } from 'framer-motion';

const FilterModal = ({
  isOpen,
  onClose,
  currentStop,
  handleStopChange,
  minPrice,
  maxPrice,
  handlePriceChange,
  uniqueAirlines,
  checkedOnewayValue,
  handleOnewayChange,
  checkedReturnValue,
  handleReturnChange,
  getAirlineName,
  getAirlineLogo,
  returnFlights,
}) => {
  const handleClearFilters = () => {
    handleStopChange('mix');
    handlePriceChange([100, 4000]);
    setCheckedOnewayValue([]);
    setCheckedReturnValue([]);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{ zIndex: 2000 }}
        >
          <motion.div
            className="bg-white rounded-lg w-full max-w-md mx-4 p-6 relative max-h-[90vh] overflow-y-auto"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Filters</h2>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={onClose}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <form>
              {/* Stops Filter */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-700 mb-2">Flight Stops</h3>
                <div className="space-y-2">
                  {[
                    { value: 'mix', label: 'All Flights' },
                    { value: 'oneway_0', label: 'Direct' },
                    { value: 'oneway_1', label: '1 Stop' },
                    { value: 'oneway_2', label: '2 Stops' },
                  ].map(({ value, label }) => (
                    <div key={value} className="flex items-center">
                      <input
                        className="form-check-input h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        type="radio"
                        name="stops"
                        id={value}
                        value={value}
                        checked={currentStop === value}
                        onChange={() => handleStopChange(value)}
                      />
                      <label className="ml-2 text-sm text-gray-600" htmlFor={value}>
                        {label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price Range Filter */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-700 mb-2">Price Range (USD)</h3>
                <div className="px-2">
                  <Slider
                    range
                    min={100}
                    max={4000}
                    value={[minPrice, maxPrice]}
                    onChange={handlePriceChange}
                    trackStyle={{ backgroundColor: '#2563eb' }}
                    handleStyle={{ borderColor: '#2563eb', backgroundColor: '#2563eb' }}
                    railStyle={{ backgroundColor: '#d1d5db' }}
                  />
                  <div className="flex justify-between mt-2 text-sm text-gray-600">
                    <span>${minPrice}</span>
                    <span>${maxPrice}</span>
                  </div>
                </div>
              </div>

              {/* Oneway Airlines Filter */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-700 mb-2">Oneway Airlines</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {uniqueAirlines.map((airline, index) => (
                    <div key={`oneway_flights_${index}`} className="flex items-center">
                      <input
                        className="form-check-input h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        type="checkbox"
                        id={`oneway_flights_${index + 1}`}
                        value={`oneway_${airline}`}
                        checked={checkedOnewayValue.includes(`oneway_${airline}`)}
                        onChange={(e) => handleOnewayChange(e, airline)}
                      />
                      <label
                        className="ml-2 flex items-center gap-2 text-sm text-gray-600 w-full"
                        htmlFor={`oneway_flights_${index + 1}`}
                      >
                        <img
                          className="lazyload"
                          src={getAirlineLogo(airline)}
                          style={{ maxWidth: '20px', maxHeight: '20px' }}
                          alt={getAirlineName(airline)}
                        />
                        {getAirlineName(airline)}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Return Airlines Filter */}
              {returnFlights.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-700 mb-2">Return Airlines</h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {uniqueAirlines.map((airline, index) => (
                      <div key={`return_flights_${index}`} className="flex items-center">
                        <input
                          className="form-check-input h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          type="checkbox"
                          id={`return_flights_${index + 1}`}
                          value={`return_${airline}`}
                          checked={checkedReturnValue.includes(`return_${airline}`)}
                          onChange={(e) => handleReturnChange(e, airline)}
                        />
                        <label
                          className="ml-2 flex items-center gap-2 text-sm text-gray-600 w-full"
                          htmlFor={`return_flights_${index + 1}`}
                        >
                          <img
                            className="lazyload"
                            src={`/assets/img/airlines/${getAirlineName(airline)}.png`}
                            style={{ maxWidth: '20px', maxHeight: '20px' }}
                            alt={getAirlineName(airline)}
                          />
                          {getAirlineName(airline)}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-between">
                <button
                  type="button"
                  className="bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg hover:bg-gray-300 transition duration-200"
                  onClick={handleClearFilters}
                >
                  Clear Filters
                </button>
                <button
                  type="button"
                  className="bg-blue-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-200"
                  onClick={onClose}
                >
                  Apply Filters
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FilterModal;