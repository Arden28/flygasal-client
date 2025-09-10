import React, { useState } from 'react';
import { motion, AnimatePresence } from "framer-motion";
// If you're using lucide or another icon set, you can swap the inline SVGs.

export default function PassengerModal({
  modalData,
  handleModalSubmit,
  closeModal,
  handleModalChange,
  countries,
  months,
  days,
  dobYears,
  issuanceYears,
  expiryYears,
  editIndex
}) {

  return (
            <motion.div
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <motion.div
                className="bg-white rounded-lg p-6 w-full max-w-2xl"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.4 }}
              >
                <div className="flex justify-between items-center mb-4">
                  <h5 className="text-lg font-semibold">
                    {editIndex !== null ? 'Edit Traveler' : `Add ${modalData.type.charAt(0).toUpperCase() + modalData.type.slice(1)}`}
                  </h5>
                  <button
                    type="button"
                    className="text-gray-500 hover:text-gray-700"
                    onClick={closeModal}
                  >
                    <i className="bi bi-x-lg"></i>
                  </button>
                </div>
                <div className="card-body p-6">
                  <input type="hidden" name="type" value={modalData.type} />
                  <div className="row g-2">
                    <div className="col-md-2">
                      <div className="form-floating relative">
                        <select
                          name="traveler_title"
                          value={modalData.title || ''}
                          onChange={handleModalChange}
                          className="form-select w-full border border-gray-300 rounded-lg p-3 pt-6 focus:ring-2 focus:ring-blue-700"
                        >
                          <option value="">Select Title</option>
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
                          name="traveler_first_name"
                          value={modalData.first_name || ''}
                          onChange={handleModalChange}
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
                          name="traveler_last_name"
                          value={modalData.last_name || ''}
                          onChange={handleModalChange}
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
                          name="traveler_nationality"
                          value={modalData.nationality || ''}
                          onChange={handleModalChange}
                          className="form-select w-full border border-gray-300 rounded-lg p-3 pt-6 focus:ring-2 focus:ring-blue-700"
                          required
                        >
                          <option value="">Select Nationality</option>
                          {countries.map((country) => (
                            <option key={country.code} value={country.code}>
                              {country.name}
                            </option>
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
                              name="traveler_dob_month"
                              value={modalData.dob_month || ''}
                              onChange={handleModalChange}
                              className="form-select w-full border border-gray-300 rounded-lg p-3 pt-6 focus:ring-2 focus:ring-blue-700"
                              required
                            >
                              <option value="">Month</option>
                              {months.map((month) => (
                                <option key={month.value} value={month.value}>
                                  {month.label}
                                </option>
                              ))}
                            </select>
                            <label className="label-text absolute top-0 left-3 text-gray-500 text-sm">Date of Birth</label>
                          </div>
                        </div>
                        <div className="col-3">
                          <div className="form-floating relative">
                            <select
                              name="traveler_dob_day"
                              value={modalData.dob_day || ''}
                              onChange={handleModalChange}
                              className="form-select w-full border border-gray-300 rounded-lg p-3 pt-6 focus:ring-2 focus:ring-blue-700"
                              required
                            >
                              <option value="">Day</option>
                              {days.map((day) => (
                                <option key={day.value} value={day.value}>
                                  {day.label}
                                </option>
                              ))}
                            </select>
                            <label className="label-text absolute top-0 left-3 text-gray-500 text-sm">Day</label>
                          </div>
                        </div>
                        <div className="col-4">
                          <div className="form-floating relative">
                            <select
                              name="traveler_dob_year"
                              value={modalData.dob_year || ''}
                              onChange={handleModalChange}
                              className="form-select w-full border border-gray-300 rounded-lg p-3 pt-6 focus:ring-2 focus:ring-blue-700"
                              required
                            >
                              <option value="">Year</option>
                              {dobYears.map((year) => (
                                <option key={year.value} value={year.value}>
                                  {year.label}
                                </option>
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
                          name="traveler_passport"
                          value={modalData.passport || ''}
                          onChange={handleModalChange}
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
                              name="traveler_passport_issuance_month"
                              value={modalData.passport_issuance_month || ''}
                              onChange={handleModalChange}
                              className="form-select w-full border border-gray-300 rounded-lg p-3 pt-6 focus:ring-2 focus:ring-blue-700"
                              required
                            >
                              <option value="">Month</option>
                              {months.map((month) => (
                                <option key={month.value} value={month.value}>
                                  {month.label}
                                </option>
                              ))}
                            </select>
                            <label className="label-text absolute top-0 left-3 text-gray-500 text-sm">Issuance Date</label>
                          </div>
                        </div>
                        <div className="col-3">
                          <div className="form-floating relative">
                            <select
                              name="traveler_passport_issuance_day"
                              value={modalData.passport_issuance_day || ''}
                              onChange={handleModalChange}
                              className="form-select w-full border border-gray-300 rounded-lg p-3 pt-6 focus:ring-2 focus:ring-blue-700"
                              required
                            >
                              <option value="">Day</option>
                              {days.map((day) => (
                                <option key={day.value} value={day.value}>
                                  {day.label}
                                </option>
                              ))}
                            </select>
                            <label className="label-text absolute top-0 left-3 text-gray-500 text-sm">Day</label>
                          </div>
                        </div>
                        <div className="col-4">
                          <div className="form-floating relative">
                            <select
                              name="traveler_passport_issuance_year"
                              value={modalData.passport_issuance_year || ''}
                              onChange={handleModalChange}
                              className="form-select w-full border border-gray-300 rounded-lg p-3 pt-6 focus:ring-2 focus:ring-blue-700"
                              required
                            >
                              <option value="">Year</option>
                              {issuanceYears.map((year) => (
                                <option key={year.value} value={year.value}>
                                  {year.label}
                                </option>
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
                              name="traveler_passport_expiry_month"
                              value={modalData.passport_expiry_month || ''}
                              onChange={handleModalChange}
                              className="form-select w-full border border-gray-300 rounded-lg p-3 pt-6 focus:ring-2 focus:ring-blue-700"
                              required
                            >
                              <option value="">Month</option>
                              {months.map((month) => (
                                <option key={month.value} value={month.value}>
                                  {month.label}
                                </option>
                              ))}
                            </select>
                            <label className="label-text absolute top-0 left-3 text-gray-500 text-sm">Expiry Date</label>
                          </div>
                        </div>
                        <div className="col-3">
                          <div className="form-floating relative">
                            <select
                              name="traveler_passport_expiry_day"
                              value={modalData.passport_expiry_day || ''}
                              onChange={handleModalChange}
                              className="form-select w-full border border-gray-300 rounded-lg p-3 pt-6 focus:ring-2 focus:ring-blue-700"
                              required
                            >
                              <option value="">Day</option>
                              {days.map((day) => (
                                <option key={day.value} value={day.value}>
                                  {day.label}
                                </option>
                              ))}
                            </select>
                            <label className="label-text absolute top-0 left-3 text-gray-500 text-sm">Day</label>
                          </div>
                        </div>
                        <div className="col-4">
                          <div className="form-floating relative">
                            <select
                              name="traveler_passport_expiry_year"
                              value={modalData.passport_expiry_year || ''}
                              onChange={handleModalChange}
                              className="form-select w-full border border-gray-300 rounded-lg p-3 pt-6 focus:ring-2 focus:ring-blue-700"
                              required
                            >
                              <option value="">Year</option>
                              {expiryYears.map((year) => (
                                <option key={year.value} value={year.value}>
                                  {year.label}
                                </option>
                              ))}
                            </select>
                            <label className="label-text absolute top-0 left-3 text-gray-500 text-sm">Year</label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    type="button"
                    className="bg-gray-300 text-gray-700 font-semibold p-2 rounded-lg hover:bg-gray-400 transition duration-200"
                    onClick={closeModal}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="bg-primary text-white font-semibold p-2 rounded-lg hover:bg-blue-800 transition duration-200"
                    onClick={handleModalSubmit}
                    disabled={
                      !modalData.title ||
                      !modalData.first_name ||
                      !modalData.last_name ||
                      !modalData.nationality ||
                      !modalData.dob_month ||
                      !modalData.dob_day ||
                      !modalData.dob_year ||
                      !modalData.passport ||
                      !modalData.passport_issuance_month ||
                      !modalData.passport_issuance_day ||
                      !modalData.passport_issuance_year ||
                      !modalData.passport_expiry_month ||
                      !modalData.passport_expiry_day ||
                      !modalData.passport_expiry_year
                    }
                  >
                    Save
                  </button>
                </div>
              </motion.div>
            </motion.div>
  );
}

