import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
  /* ---------- Helpers ---------- */
  const emptyTraveler = (type = "adult") => ({
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
  });

  const typeLabel = (t) => (t === "adult" ? "Adult" : t === "child" ? "Child" : "Infant");
  const typeRing = (t) =>
    t === "adult" ? "ring-slate-700" : t === "child" ? "ring-sky-700" : "ring-emerald-700";

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

  // Map existing travelers by type and remember their real indices in the master array
  const byType = useMemo(() => {
    const map = { adult: [], child: [], infant: [] };
    travelers.forEach((t, idx) => {
      if (map[t.type]) map[t.type].push({ ...t, _index: idx });
    });
    return map;
  }, [travelers]);

  const desired = { adult: adults, child: children, infant: infants };

  // Build rows (existing travelers first, then placeholders up to desired count)
  const rows = useMemo(() => {
    const out = [];
    ["adult", "child", "infant"].forEach((t) => {
      const have = byType[t].length;
      const want = desired[t] || 0;

      // Real ones
      byType[t].forEach((trav) => out.push({ kind: "real", type: t, traveler: trav }));

      // Placeholders
      for (let k = 0; k < Math.max(0, want - have); k++) {
        out.push({ kind: "placeholder", type: t, traveler: emptyTraveler(t) });
      }
    });
    return out;
  }, [byType, desired]);

  /* ---------- Mutations ---------- */

  // Update master traveler list immutably
  const updateTravelers = (next) =>
    handleFormChange({ target: { name: "travelers", value: next } });

  // Change field either on a real row (in-place) or convert placeholder to real (push)
  const onFieldChange = (row, field, value) => {
    const { kind, type } = row;

    if (kind === "real") {
      const realIdx = row.traveler._index;
      const next = [...travelers];
      next[realIdx] = { ...next[realIdx], [field]: value };
      updateTravelers(next);
      return;
    }

    // Placeholder → turn into a real traveler when user starts typing
    const draft = { ...row.traveler, [field]: value };
    const next = [...travelers, draft];
    // If we exceed the desired count for this type, bump the count in parent to match UX
    if (type === "adult" && byType.adult.length >= desired.adult) setAdults(desired.adult + 1);
    if (type === "child" && byType.child.length >= desired.child) setChildren(desired.child + 1);
    if (type === "infant" && byType.infant.length >= desired.infant) setInfants(desired.infant + 1);
    updateTravelers(next);
    addTraveler(type);
  };

  const onRemove = (row) => {
    if (row.kind !== "real") return; // nothing to remove
    const idx = row.traveler._index;
    const t = row.traveler.type;
    const next = [...travelers];
    next.splice(idx, 1);
    updateTravelers(next);

    // Also lower the desired counters so placeholders don't come back immediately
    if (t === "adult" && adults > 0) setAdults(adults - 1);
    if (t === "child" && children > 0) setChildren(children - 1);
    if (t === "infant" && infants > 0) setInfants(infants - 1);

    removeTraveler(idx);
  };

  /* ---------- Field components ---------- */
  const LabeledInput = ({ id, label, type = "text", value, onChange, placeholder = " ", required }) => (
    <div className="relative">
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="peer block w-full border border-slate-300 rounded-2xl px-3 pt-4 pb-2 text-sm text-slate-900 placeholder-transparent focus:border-sky-500 focus:outline-none"
        required={required}
      />
      <label
        htmlFor={id}
        className="absolute left-3 top-2 text-slate-500 text-xs transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-slate-400 peer-placeholder-shown:text-xs peer-focus:top-2 peer-focus:text-xs"
      >
        {label}
      </label>
    </div>
  );

  const LabeledSelect = ({ id, label, value, onChange, children, required }) => (
    <div className="relative">
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="peer block w-full border border-slate-300 rounded-2xl px-3 pt-4 pb-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none bg-white"
        required={required}
      >
        {children}
      </select>
      <label
        htmlFor={id}
        className="absolute left-3 top-2 text-slate-500 text-xs transition-all peer-focus:top-2 peer-focus:text-xs"
      >
        {label}
      </label>
    </div>
  );

  const PassengerCard = ({ row, idx }) => {
    const t = row.traveler;
    const complete = row.kind === "real" ? isComplete(t) : isComplete(t); // live completeness even while typing
    const badgeClasses = complete ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700";
    const dot = complete ? "bg-emerald-600" : "bg-amber-600";

    const onT = (field) => (v) => onFieldChange(row, field, v);

    return (
      <motion.li
        key={`${row.kind}-${idx}-${row.kind === "real" ? row.traveler._index : "placeholder"}`}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2 }}
        className="rounded-2xl bg-white ring-1 ring-slate-200 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`grid h-10 w-10 place-items-center rounded-full ring-2 ${typeRing(row.type)} text-slate-700`}>
              <span className="text-sm font-medium">
                {row.kind === "placeholder" ? typeLabel(row.type).charAt(0) : initials(t)}
              </span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {t.title || t.first_name || t.last_name
                    ? `${t.title ? `${t.title} ` : ""}${t.first_name || ""} ${t.last_name || ""}`.trim()
                    : `Passenger (${typeLabel(row.type)})`}
                </p>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                  {typeLabel(row.type)}
                </span>
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] ${badgeClasses}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
                  {complete ? "Complete" : "Incomplete"}
                </span>
              </div>
              <p className="mt-0.5 truncate text-xs text-slate-600">
                {t.nationality ? `Nationality: ${t.nationality}` : "Nationality not set"}
              </p>
            </div>
          </div>

          {row.kind === "real" && (
            <button
              type="button"
              onClick={() => onRemove(row)}
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-50"
              title="Remove passenger"
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

        {/* Body */}
        <div className="px-4 pb-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {/* Title / First / Last */}
            <LabeledSelect
              id={`title-${idx}`}
              label="Title"
              value={t.title}
              onChange={onT("title")}
              required
            >
              <option value="">Select Title</option>
              <option value="Mr">Mr</option>
              <option value="Miss">Miss</option>
              <option value="Mrs">Mrs</option>
            </LabeledSelect>

            <LabeledInput
              id={`first-${idx}`}
              label="First Name"
              value={t.first_name}
              onChange={onT("first_name")}
              required
            />

            <LabeledInput
              id={`last-${idx}`}
              label="Last Name"
              value={t.last_name}
              onChange={onT("last_name")}
              required
            />

            {/* Nationality */}
            <LabeledSelect
              id={`nationality-${idx}`}
              label="Nationality"
              value={t.nationality}
              onChange={onT("nationality")}
              required
            >
              <option value="">Select Nationality</option>
              {countries.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </LabeledSelect>

            {/* DOB */}
            <div className="lg:col-span-2">
              <div className="grid grid-cols-3 gap-3">
                <LabeledSelect
                  id={`dob-month-${idx}`}
                  label="Date of Birth — Month"
                  value={t.dob_month}
                  onChange={onT("dob_month")}
                  required
                >
                  <option value="">Month</option>
                  {months.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </LabeledSelect>
                <LabeledSelect
                  id={`dob-day-${idx}`}
                  label="Date of Birth — Day"
                  value={t.dob_day}
                  onChange={onT("dob_day")}
                  required
                >
                  <option value="">Day</option>
                  {days.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </LabeledSelect>
                <LabeledSelect
                  id={`dob-year-${idx}`}
                  label="Date of Birth — Year"
                  value={t.dob_year}
                  onChange={onT("dob_year")}
                  required
                >
                  <option value="">Year</option>
                  {dobYears.map((y) => (
                    <option key={y.value} value={y.value}>
                      {y.label}
                    </option>
                  ))}
                </LabeledSelect>
              </div>
              {row.type !== "adult" && (
                <p className="mt-1 text-[11px] text-slate-500">
                  Make sure the date of birth matches {typeLabel(row.type).toLowerCase()} fare rules.
                </p>
              )}
            </div>

            {/* Passport / ID */}
            <div className="lg:col-span-2">
              <div className="relative">
                <p className="m-0 text-end absolute right-3 top-2 text-gray-400 text-xs z-10">
                  <strong>6–15 characters</strong>
                </p>
                <LabeledInput
                  id={`passport-${idx}`}
                  label="Passport or ID"
                  value={t.passport}
                  onChange={onT("passport")}
                  required
                />
              </div>
            </div>

            {/* Issuance */}
            <div>
              <div className="grid grid-cols-3 gap-3">
                <LabeledSelect
                  id={`iss-month-${idx}`}
                  label="Issuance — Month"
                  value={t.passport_issuance_month}
                  onChange={onT("passport_issuance_month")}
                  required
                >
                  <option value="">Month</option>
                  {months.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </LabeledSelect>
                <LabeledSelect
                  id={`iss-day-${idx}`}
                  label="Issuance — Day"
                  value={t.passport_issuance_day}
                  onChange={onT("passport_issuance_day")}
                  required
                >
                  <option value="">Day</option>
                  {days.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </LabeledSelect>
                <LabeledSelect
                  id={`iss-year-${idx}`}
                  label="Issuance — Year"
                  value={t.passport_issuance_year}
                  onChange={onT("passport_issuance_year")}
                  required
                >
                  <option value="">Year</option>
                  {issuanceYears.map((y) => (
                    <option key={y.value} value={y.value}>
                      {y.label}
                    </option>
                  ))}
                </LabeledSelect>
              </div>
            </div>

            {/* Expiry */}
            <div>
              <div className="grid grid-cols-3 gap-3">
                <LabeledSelect
                  id={`exp-month-${idx}`}
                  label="Expiry — Month"
                  value={t.passport_expiry_month}
                  onChange={onT("passport_expiry_month")}
                  required
                >
                  <option value="">Month</option>
                  {months.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </LabeledSelect>
                <LabeledSelect
                  id={`exp-day-${idx}`}
                  label="Expiry — Day"
                  value={t.passport_expiry_day}
                  onChange={onT("passport_expiry_day")}
                  required
                >
                  <option value="">Day</option>
                  {days.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </LabeledSelect>
                <LabeledSelect
                  id={`exp-year-${idx}`}
                  label="Expiry — Year"
                  value={t.passport_expiry_year}
                  onChange={onT("passport_expiry_year")}
                  required
                >
                  <option value="">Year</option>
                  {expiryYears.map((y) => (
                    <option key={y.value} value={y.value}>
                      {y.label}
                    </option>
                  ))}
                </LabeledSelect>
              </div>
            </div>
          </div>
        </div>
      </motion.li>
    );
  };

  return (
    <div className="travel">
      <motion.div
        className="bg-white rounded-2xl w-full max-w-4xl mb-3 overflow-hidden ring-1 ring-slate-200"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        {/* Header */}
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

          <span className="text-xs text-slate-500">
            Ensure names match passports exactly.
          </span>
        </header>

        {/* Body */}
        <div className="px-4 sm:px-6 pb-5">
          <p className="text-xs px-3 py-2 mt-2 rounded-xl bg-slate-50 text-slate-700">
            Tip: Double-check passport numbers and expiry dates. Some destinations require ≥ 6 months validity.
          </p>

          {/* Passenger cards */}
          <ul className="mt-4 grid grid-cols-1 gap-3">
            <AnimatePresence initial={false}>
              {rows.length === 0 ? (
                <motion.li
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="px-4 py-8 text-center text-sm text-slate-500 rounded-2xl ring-1 ring-slate-200 bg-white"
                >
                  Set traveller counts, then fill in each passenger.
                </motion.li>
              ) : (
                rows.map((row, i) => <PassengerCard key={`pc-${i}`} row={row} idx={i} />)
              )}
            </AnimatePresence>
          </ul>
        </div>
      </motion.div>
    </div>
  );
}
