import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PassengerModal from "../Modals/PassengerModal";

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
  const [modalData, setModalData] = useState(emptyTraveler("adult"));
  const [editIndex, setEditIndex] = useState(null);

  function emptyTraveler(type = "adult") {
    return {
      type,
      title: "",
      first_name: "",
      last_name: "",
      nationality: "",
      dob_month: "",
      dob_day: "",
      dob_year: "",
      passport: "",
      passport_issuance_month: "",
      passport_issuance_day: "",
      passport_issuance_year: "",
      passport_expiry_month: "",
      passport_expiry_day: "",
      passport_expiry_year: "",
    };
  }

  const typeLabel = (t) => (t === "adult" ? "Adult" : t === "child" ? "Child" : "Infant");

  const typeColor = (t) =>
    t === "adult" ? "border-slate-900" : t === "child" ? "border-sky-700" : "border-emerald-700";

  const initials = (t) => {
    const a = (t.title || "").trim().charAt(0).toUpperCase();
    const b = (t.first_name || "").trim().charAt(0).toUpperCase();
    const c = (t.last_name || "").trim().charAt(0).toUpperCase();
    return a || b || c ? `${a || b}${c || ""}` : typeLabel(t.type).charAt(0);
  };

  const isComplete = (t) =>
    t.title &&
    t.first_name &&
    t.last_name &&
    t.nationality &&
    t.dob_month &&
    t.dob_day &&
    t.dob_year &&
    t.passport &&
    t.passport_issuance_month &&
    t.passport_issuance_day &&
    t.passport_issuance_year &&
    t.passport_expiry_month &&
    t.passport_expiry_day &&
    t.passport_expiry_year;

  const getPassengerSummary = (a, c, i) => {
    const parts = [];
    if (a > 0) parts.push(`${a} Adult${a > 1 ? "s" : ""}`);
    if (c > 0) parts.push(`${c} Child${c > 1 ? "ren" : ""}`);
    if (i > 0) parts.push(`${i} Infant${i > 1 ? "s" : ""}`);
    return parts.join(", ");
  };

  const travelers = formData.travelers || [];
  const byType = useMemo(() => {
    const map = { adult: [], child: [], infant: [] };
    travelers.forEach((t, idx) => {
      if (map[t.type]) map[t.type].push({ ...t, _index: idx });
    });
    return map;
  }, [travelers]);

  const desired = { adult: adults, child: children, infant: infants };
  const placeholdersNeeded = {
    adult: Math.max(0, desired.adult - byType.adult.length),
    child: Math.max(0, desired.child - byType.child.length),
    infant: Math.max(0, desired.infant - byType.infant.length),
  };

  const rows = useMemo(() => {
    const out = [];
    ["adult", "child", "infant"].forEach((t) => {
      byType[t].forEach((trav) => out.push({ kind: "real", type: t, traveler: trav }));
      for (let k = 0; k < placeholdersNeeded[t]; k++) {
        out.push({ kind: "placeholder", type: t, traveler: emptyTraveler(t) });
      }
    });
    return out;
  }, [byType, placeholdersNeeded]);

  const openModal = (type, index = null) => {
    if (index !== null && travelers[index]) {
      setModalData({ ...travelers[index], type: travelers[index].type });
      setEditIndex(index);
    } else {
      setModalData(emptyTraveler(type));
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
    const field = name.replace("traveler_", "");
    setModalData((prev) => ({ ...prev, [field]: value }));
  };

  const handleModalSubmit = () => {
    if (!isComplete(modalData)) return;

    if (editIndex !== null) {
      const updated = [...travelers];
      updated[editIndex] = modalData;
      handleFormChange({ target: { name: "travelers", value: updated } });
    } else {
      const currentOfType = byType[modalData.type].length;
      const desiredOfType = desired[modalData.type];
      if (currentOfType >= desiredOfType) {
        if (modalData.type === "adult") setAdults(adults + 1);
        if (modalData.type === "child") setChildren(children + 1);
        if (modalData.type === "infant") setInfants(infants + 1);
      }
      addTraveler(modalData.type);
      handleFormChange({
        target: { name: "travelers", value: [...travelers, modalData] },
      });
    }

    setModalData(emptyTraveler("adult"));
    closeModal();
  };

  const Counter = ({ label, value, onDec, onInc }) => (
    <div className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-2 py-1">
      <span className="text-xs text-slate-600">{label}</span>
      <button
        type="button"
        onClick={onDec}
        className="grid h-6 w-6 place-items-center rounded-full border border-slate-300 text-slate-700 disabled:opacity-40"
        disabled={value <= 0}
        aria-label={`Decrease ${label}`}
      >
        –
      </button>
      <span className="min-w-[1.25rem] text-center text-sm font-medium tabular-nums">
        {value}
      </span>
      <button
        type="button"
        onClick={onInc}
        className="grid h-6 w-6 place-items-center rounded-full border border-slate-300 text-slate-700 disabled:opacity-40"
        aria-label={`Increase ${label}`}
      >
        +
      </button>
    </div>
  );

  const handleRemove = (index, type) => {
    removeTraveler(index);
    const updated = [...travelers];
    updated.splice(index, 1);
    handleFormChange({ target: { name: "travelers", value: updated } });

    if (type === "adult" && adults > 0) setAdults(adults - 1);
    if (type === "child" && children > 0) setChildren(children - 1);
    if (type === "infant" && infants > 0) setInfants(infants - 1);
  };

  const decType = (type) => {
    if (type === "adult" && adults > 0) {
      if (byType.adult.length > adults - 1) {
        const last = byType.adult[byType.adult.length - 1];
        handleRemove(last._index, "adult");
      }
      setAdults(adults - 1);
    }
    if (type === "child" && children > 0) {
      if (byType.child.length > children - 1) {
        const last = byType.child[byType.child.length - 1];
        handleRemove(last._index, "child");
      }
      setChildren(children - 1);
    }
    if (type === "infant" && infants > 0) {
      if (byType.infant.length > infants - 1) {
        const last = byType.infant[byType.infant.length - 1];
        handleRemove(last._index, "infant");
      }
      setInfants(infants - 1);
    }
  };

  const incType = (type) => {
    if (type === "adult") setAdults(adults + 1);
    if (type === "child") setChildren(children + 1);
    if (type === "infant") setInfants(infants + 1);
  };

  return (
    <div className="travel">
      <motion.div
        className="bg-white rounded-2xl w-full max-w-4xl mb-3 overflow-hidden ring-1 ring-slate-200"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 py-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="grid h-9 w-9 place-items-center rounded-full ring-1 ring-slate-300">
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
              <p className="text-xs text-slate-600">
                {getPassengerSummary(adults, children, infants)}
              </p>
            </div>
          </div>

          <button
            type="button"
            className="inline-flex items-center gap-2 text-xs text-slate-600 hover:text-slate-900 transition-colors"
            title="Tips for filling out the passenger details"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2a10 10 0 1010 10A10.012 10.012 0 0012 2zm.75 15h-1.5v-6h1.5zm0-8h-1.5V7h1.5z" />
            </svg>
            <span className="hidden sm:inline">Filling tips</span>
          </button>
        </header>

        <div className="px-4 sm:px-6 pb-5">
          <p className="text-xs px-3 py-2 mt-3 rounded-xl bg-slate-50 text-slate-700">
            Be sure passenger names match travel documents exactly.
          </p>

          {/* <div className="mt-3 flex flex-wrap items-center gap-3">
            <Counter label="Adults" value={adults} onDec={() => decType("adult")} onInc={() => incType("adult")} />
            <Counter label="Children" value={children} onDec={() => decType("child")} onInc={() => incType("child")} />
            <Counter label="Infants" value={infants} onDec={() => decType("infant")} onInc={() => incType("infant")} />
          </div> */}

          <ul className="mt-4 divide-y divide-slate-200 rounded-xl border border-slate-200 overflow-hidden">
            {rows.length === 0 && (
              <li className="px-4 py-8 text-center text-sm text-slate-500">
                Set your traveller counts above, then add details for each passenger.
              </li>
            )}

            <AnimatePresence initial={false}>
              {rows.map((row, i) => {
                const t = row.traveler;
                const complete = row.kind === "real" ? isComplete(t) : false;
                const name =
                  row.kind === "placeholder"
                    ? `Add ${typeLabel(row.type)} details`
                    : `${t.title || ""} ${t.first_name || ""} ${t.last_name || ""}`.trim() ||
                      `Unnamed ${typeLabel(row.type)}`;
                const subline =
                  row.kind === "placeholder"
                    ? `${typeLabel(row.type)} • Details required`
                    : [
                        [t.dob_month, t.dob_day, t.dob_year].filter(Boolean).join("/"),
                        t.nationality,
                        t.passport ? `Passport • ${t.passport}` : null,
                      ]
                        .filter(Boolean)
                        .join("  ·  ");
                const index = row.kind === "real" ? t._index : null;

                return (
                  <motion.li
                    key={`${row.kind}-${i}-${index ?? "placeholder"}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="relative flex items-center gap-4 px-4 py-3 bg-white"
                  >
                    <div className={`absolute left-0 top-0 h-full w-1 border-l-4 ${typeColor(row.type)}`} />

                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-slate-300 text-slate-700">
                      <span className="text-sm font-medium">
                        {row.kind === "placeholder" ? typeLabel(row.type).charAt(0) : initials(t)}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium text-slate-900">{name}</p>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                          {typeLabel(row.type)}
                        </span>
                        <span
                          className={`ml-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] ${
                            complete ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                          }`}
                          title={complete ? "All required fields filled" : "Missing information"}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${complete ? "bg-emerald-600" : "bg-amber-600"}`} />
                          {complete ? "Complete" : "Incomplete"}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-slate-600">{subline}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          row.kind === "placeholder" ? openModal(row.type, null) : openModal(row.type, index)
                        }
                        className="inline-flex items-center gap-1 rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-800 hover:bg-slate-50"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" />
                          <path d="M14.06 4.94l3.75 3.75" />
                        </svg>
                        {row.kind === "placeholder" ? "Add details" : "Edit"}
                      </button>

                      {row.kind === "real" && (
                        <button
                          type="button"
                          onClick={() => handleRemove(index, t.type)}
                          className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-50"
                          title="Remove traveller"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M3 6h18" />
                            <path d="M8 6V4h8v2" />
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          </svg>
                          Remove
                        </button>
                      )}
                    </div>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        </div>
      </motion.div>

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
