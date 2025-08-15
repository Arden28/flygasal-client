import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TravelerInformation = ({
  formData,
  handleFormChange,
  adults,
  children,
  infants,
  addTraveler,
  removeTraveler,
  setAdults,
  setChildren,
  setInfants,
  countries,
  months,
  days,
  dobYears,
  issuanceYears,
  expiryYears,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState({
    type: 'adult',
    title: '',
    first_name: '',
    last_name: '',
    nationality: '',
    dob_month: '',
    dob_day: '',
    dob_year: '',
    passport: '',
    passport_issuance_month: '',
    passport_issuance_day: '',
    passport_issuance_year: '',
    passport_expiry_month: '',
    passport_expiry_day: '',
    passport_expiry_year: '',
  });
  const [editIndex, setEditIndex] = useState(null);

  const openModal = (type, index = null) => {
    if (index !== null) {
      setModalData({ ...formData.travelers[index], type: formData.travelers[index].type });
      setEditIndex(index);
    } else {
      setModalData({
        type,
        title: '',
        first_name: '',
        last_name: '',
        nationality: '',
        dob_month: '',
        dob_day: '',
        dob_year: '',
        passport: '',
        passport_issuance_month: '',
        passport_issuance_day: '',
        passport_issuance_year: '',
        passport_expiry_month: '',
        passport_expiry_day: '',
        passport_expiry_year: '',
      });
      setEditIndex(null);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditIndex(null);
  };

  const handleModalChange = (e) => {
    const { name, value } = e.target;
    const field = name.replace('traveler_', '');
    console.log('handleModalChange:', { name, value, field }); // Debug
    setModalData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleModalSubmit = () => {
    if (
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
    ) {
      console.log('Modal submit blocked: incomplete fields', modalData); // Debug
      return;
    }

    console.log('Submitting modalData:', modalData); // Debug
    if (editIndex !== null) {
      // Edit existing traveler
      const updatedTravelers = [...formData.travelers];
      updatedTravelers[editIndex] = modalData;
      handleFormChange({
        target: { name: 'travelers', value: updatedTravelers },
      });
    } else {
      // Add new traveler and update counts
      addTraveler(modalData.type);
      handleFormChange({
        target: { name: 'travelers', value: [...formData.travelers, modalData] },
      });
      if (modalData.type === 'adult') {
        setAdults(adults + 1);
      } else if (modalData.type === 'child') {
        setChildren(children + 1);
      } else if (modalData.type === 'infant') {
        setInfants(infants + 1);
      }
    }
    // Reset modalData after successful submit
    setModalData({
      type: 'adult',
      title: '',
      first_name: '',
      last_name: '',
      nationality: '',
      dob_month: '',
      dob_day: '',
      dob_year: '',
      passport: '',
      passport_issuance_month: '',
      passport_issuance_day: '',
      passport_issuance_year: '',
      passport_expiry_month: '',
      passport_expiry_day: '',
      passport_expiry_year: '',
    });
    closeModal();
  };

  return (
    <div className="traveler-summary mb-2">
      <h4 className="fs-5">Travelers</h4>
      <p className="text-muted text-sm">Please provide the details of all travelers.</p>

      {/* Personal Information */}
      <div className="row gap-1 mb-3">
        <div className="col-md-4">
          <label className="label-text top-0 text-gray-500 text-sm">Full Name</label>
          <input
            type="text"
            name="full_name"
            value={formData.full_name}
            onChange={handleFormChange}
            className="form-control w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-700"
            placeholder="Your Full Name"
            required
          />
        </div>
        <div className="col-md-4">
          <label className="label-text top-0 text-gray-500 text-sm">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleFormChange}
            className="form-control w-full border border-gray-300 rounded-lg p-3 pt-6 focus:ring-2 focus:ring-blue-700"
            placeholder="Your Email Address"
            required
          />
        </div>
        <div className="col-md-3">
          <label className="label-text top-0 left-3 text-gray-500 text-sm">Phone</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleFormChange}
            className="form-control w-full border border-gray-300 rounded-lg p-3 pt-6 focus:ring-2 focus:ring-blue-700"
            placeholder="Your Phone Number"
            required
          />
        </div>
      </div>

      {/* Add Traveler Buttons */}
      <div className="flex gap-2 mt-2 p-1 mb-2">
        <button
          type="button"
          onClick={() => openModal('adult')}
          className="bg-primary text-white font-semibold p-1 text-sm rounded-lg hover:bg-blue-800 transition duration-200"
          disabled={formData.travelers.length >= 9}
        >
          Add Adult
        </button>
        <button
          type="button"
          onClick={() => openModal('child')}
          className="bg-primary text-white font-semibold p-1 text-sm rounded-lg hover:bg-blue-800 transition duration-200"
          disabled={formData.travelers.length >= 9}
        >
          Add Child
        </button>
        <button
          type="button"
          onClick={() => openModal('infant')}
          className="bg-primary text-white font-semibold p-1 text-sm rounded-lg hover:bg-blue-800 transition duration-200"
          disabled={formData.travelers.length >= 9}
        >
          Add Infant
        </button>
      </div>

      {/* Traveler Cards */}
      <div className="flex overflow-x-auto gap-4 pb-4">
        {formData.travelers.map((traveler, index) => (
          <div
            key={index}
            className="min-w-[270px] bg-white border border rounded-xl p-3 pb-1 text-sm flex-shrink-0"
          >
            <div className="justify-content-between d-flex">
              <span className="font-semibold text-gray-700 mb-2 text-start">
                {traveler.title} {traveler.first_name} {traveler.last_name}
              </span>
              <i
                className="bi bi-pen text-end cursor-pointer"
                onClick={() => openModal(traveler.type, index)}
              ></i>
            </div>
            <div className="text-gray-600">
              <div className="justify-content-between d-flex mb-2">
                <span className="font-normal text-xs text-start">
                  {traveler.dob_month}/{traveler.dob_day}/{traveler.dob_year}
                </span>
                <span className="font-normal text-xs text-end">{traveler.nationality}</span>
              </div>
              <div className="justify-content-between d-flex mb-1">
                <span className="font-medium text-xs text-start">{traveler.passport}</span>
                <div className="d-block text-sm text-end">
                  <div>{traveler.passport_issuance_month}/{traveler.passport_issuance_day}/{traveler.passport_issuance_year}</div>
                  <div>{traveler.passport_expiry_month}/{traveler.passport_expiry_day}/{traveler.passport_expiry_year}</div>
                </div>
              </div>
              <div className="justify-content-between d-flex mb-2">
                <span className="font-normal text-xs text-start bg-primary rounded-5 fw-bold p-1 text-white">
                  {traveler.type.charAt(0).toUpperCase() + traveler.type.slice(1)}
                </span>
                {index >= adults + children + infants && (
                  <span
                    className="font-normal text-xs text-end text-red-600 cursor-pointer"
                    onClick={() => {
                      removeTraveler(index);
                      if (traveler.type === 'adult') {
                        setAdults(adults - 1);
                      } else if (traveler.type === 'child') {
                        setChildren(children - 1);
                      } else if (traveler.type === 'infant') {
                        setInfants(infants - 1);
                      }
                    }}
                  >
                    Remove
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
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
        )}
      </AnimatePresence>
    </div>
  );
};

export default TravelerInformation;