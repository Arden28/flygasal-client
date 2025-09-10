import React, { useState } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import PassengerModal from '../Modals/PassengerModal';
// If you're using lucide or another icon set, you can swap the inline SVGs.

export default function PassengerDetailsCard({
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
}) {
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

  const getPassengerSummary = (a, c, i) => {
    const parts = [];
    if (a > 0) parts.push(`${a} Adult${a > 1 ? "s" : ""}`);
    if (c > 0) parts.push(`${c} Child${c > 1 ? "ren" : ""}`);
    if (i > 0) parts.push(`${i} Infant${i > 1 ? "s" : ""}`);
    return parts.join(", ");
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
    <div className="travel">
        
        <motion.div
            className="bg-white rounded-2xl w-full max-w-3xl mb-3 overflow-hidden ring-1 ring-slate-200"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            >
            {/* Header */}
            <header className="flex items-center justify-between px-4 py-3">
                {/* Left: Icon + Title */}
                <div className="flex items-center gap-3 min-w-0">
                    <div className="grid h-9 w-9 place-items-center rounded-full ring-1 ring-slate-300">
                    {/* Minimal airplane mark */}
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="currentColor"
                        viewBox="0 0 640 640"
                        aria-hidden
                    >
                        <path d="M320 312C386.3 312 440 258.3 440 192C440 125.7 386.3 72 320 72C253.7 72 200 125.7 200 192C200 258.3 253.7 312 320 312zM290.3 368C191.8 368 112 447.8 112 546.3C112 562.7 125.3 576 141.7 576L498.3 576C514.7 576 528 562.7 528 546.3C528 447.8 448.2 368 349.7 368L290.3 368z"/>
                    </svg>
                    </div>
                    <div className="min-w-0">
                    <h2 className="text-base font-semibold text-slate-900">Passenger details</h2>
                    <p className="text-xs text-slate-600">{getPassengerSummary(adults, children, infants)}{' '}</p>
                    </div>
                </div>
                <div className="text-right flex gap-1 text-muted hover:bg-[#F3F3F3] p-2 rounded-2xl cursor-pointer">
                    <svg xmlns="http://www.w3.org/2000/svg"
                        fill="#6A6971"
                        className="h-5 w-5" viewBox="0 0 640 640">
                        <path d="M320 576C461.4 576 576 461.4 576 320C576 178.6 461.4 64 320 64C178.6 64 64 178.6 64 320C64 461.4 178.6 576 320 576zM288 224C288 206.3 302.3 192 320 192C337.7 192 352 206.3 352 224C352 241.7 337.7 256 320 256C302.3 256 288 241.7 288 224zM280 288L328 288C341.3 288 352 298.7 352 312L352 400L360 400C373.3 400 384 410.7 384 424C384 437.3 373.3 448 360 448L280 448C266.7 448 256 437.3 256 424C256 410.7 266.7 400 280 400L304 400L304 336L280 336C266.7 336 256 325.3 256 312C256 298.7 266.7 288 280 288z"/>
                    </svg>
                    <span className="hidden sm:inline text-xs text-slate-500">Tips for filling out the passenger details</span>
                </div>
            </header>

            <div className="divide-y divide-slate-200 pb-4">
                <section className="bg-white">
                    <div className="px-4 py-2 sm:px-6">

                        <p className="warning text-xs p-3 rounded-2xl bg-[#F6F6F7]">
                            Be sure passenger names match travel documents exactly
                        </p>

                        {/* Add Traveler Buttons */}
                        <div className="flex gap-2 mt-2 p-1 mb-2">
                            <button type="button" onClick={() => openModal('adult')} className="bg-[#0ea5e9] text-white font-semibold p-1 text-sm rounded-lg hover:bg-[#1982FF] transition duration-200" disabled={formData.travelers.length >= 9} >
                                Add Adult
                            </button>
                            <button type="button" onClick={() => openModal('child')} className="bg-[#0ea5e9] text-white font-semibold p-1 text-sm rounded-lg hover:bg-[#1982FF] transition duration-200" disabled={formData.travelers.length >= 9} >
                                Add Child
                            </button>
                            <button type="button" onClick={() => openModal('infant')} className="bg-[#0ea5e9] text-white font-semibold p-1 text-sm rounded-lg hover:bg-[#1982FF] transition duration-200" disabled={formData.travelers.length >= 9} >
                                Add Infant
                            </button>
                        </div>

                        {/* Traveler Cards */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pb-4">
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

                    </div>
                </section>

            </div>


        </motion.div>
        

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
            <PassengerModal
                modalData={modalData}
                handleModalSubmit={handleModalSubmit}
                closeModal={closeModal}
                handleModalChange={handleModalChange}
                countries={countries}
                months={months}
                days={days}
                dobYears={dobYears}
                issuanceYears={issuanceYears}
                expiryYears={expiryYears}
                editIndex={editIndex}
            />
        )}
      </AnimatePresence>
    </div>
  );
}

