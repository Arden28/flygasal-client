import React, { useMemo } from "react";

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

  const totalPax = (adults || 0) + (children || 0) + (infants || 0);

  const typeLabel = (t) => (t === "adult" ? "Adult" : t === "child" ? "Child" : "Infant");
  const typeRing = (t) =>
    t === "adult" ? "ring-slate-700" : t === "child" ? "ring-sky-700" : "ring-emerald-700";

  const initials = (t) => {
    const a = (t.title || "").trim().charAt(0).toUpperCase();
    const b = (t.first_name || "").trim().charAt(0).toUpperCase();
    const c = (t.last_name || "").trim().charAt(0).toUpperCase();
    return a || b || c ? `${a || b}${c || ""}` : typeLabel(t.type).charAt(0);
  };

  // You can relax passport requirements for infants if needed
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

  // ------ STABLE ROW KEYS ------
  const rows = useMemo(() => {
    const out = [];
    ["adult", "child", "infant"].forEach((t) => {
      const have = byType[t].length;
      const want = desired[t] || 0;

      // real travelers (stable by underlying array index)
      byType[t].forEach((trav) => {
        out.push({
          kind: "real",
          type: t,
          traveler: trav,
          _key: `real-${t}-${trav._index}`,
        });
      });

      // placeholders to fill up to wanted count (stable per type & position)
      for (let k = 0; k < Math.max(0, want - have); k++) {
        out.push({
          kind: "placeholder",
          type: t,
          traveler: emptyTraveler(t),
          _placeholderIndex: k,
          _key: `ph-${t}-${k}`,
        });
      }
    });
    return out;
  }, [byType, desired]);
  // -----------------------------

  /* ---------- Mutations ---------- */
  const updateTravelers = (next) =>
    handleFormChange({ target: { name: "travelers", value: next } });

  const onFieldChange = (row, field, value) => {
    const { kind, type } = row;

    if (kind === "real") {
      const realIdx = row.traveler._index;
      const next = [...travelers];
      next[realIdx] = { ...next[realIdx], [field]: value };
      updateTravelers(next);
      return;
    }

    // placeholder -> real
    const draft = { ...row.traveler, [field]: value };
    const next = [...travelers, draft];
    if (type === "adult" && byType.adult.length >= desired.adult) setAdults(desired.adult + 1);
    if (type === "child" && byType.child.length >= desired.child) setChildren(desired.child + 1);
    if (type === "infant" && byType.infant.length >= desired.infant) setInfants(desired.infant + 1);
    updateTravelers(next);
    addTraveler(type);
  };

  const onRemove = (row) => {
    if (row.kind !== "real") return;
    if (totalPax <= 1) return; // prevent removing last passenger
    const idx = row.traveler._index;
    const t = row.traveler.type;
    const next = [...travelers];
    next.splice(idx, 1);
    updateTravelers(next);

    if (t === "adult" && adults > 0) setAdults(adults - 1);
    if (t === "child" && children > 0) setChildren(children - 1);
    if (t === "infant" && infants > 0) setInfants(infants - 1);

    removeTraveler(idx);
  };

  /* ---------- Uniform field components ---------- */
  const baseCtrl =
    "block w-full rounded-2xl border border-slate-300 text-sm text-slate-900 focus:border-sky-500 focus:outline-none " +
    "px-3 pt-4 pb-2 h-12";

  const LabeledInput = ({ id, label, type = "text", value, onChange, required, autoComplete }) => (
    <div className="relative min-w-0">
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={baseCtrl + " placeholder-transparent"}
        placeholder=" "
        required={required}
        autoComplete={autoComplete}
      />
      <label
        htmlFor={id}
        className="pointer-events-none absolute left-3 top-2 text-xs text-slate-500 transition-all"
      >
        {label}
      </label>
    </div>
  );

  const LabeledSelect = ({ id, label, value, onChange, children, required }) => (
    <div className="relative min-w-0">
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={baseCtrl + " bg-white"}
        required={required}
      >
        {children}
      </select>
      <label htmlFor={id} className="pointer-events-none absolute left-3 top-2 text-xs text-slate-500">
        {label}
      </label>
    </div>
  );

  /* ---------- Passenger Card ---------- */
  const PassengerCard = ({ row, idx }) => {
    const t = row.traveler;
    const complete = isComplete(t);
    const badgeClasses = complete ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700";
    const dot = complete ? "bg-emerald-600" : "bg-amber-600";
    const onT = (field) => (v) => onFieldChange(row, field, v);

    return (
      <li className="rounded-2xl bg-white ring-1 ring-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`grid h-10 w-10 place-items-center rounded-full ring-2 ${typeRing(row.type)} text-slate-700`}>
              <span className="text-sm font-medium">
                {row.kind === "placeholder" ? typeLabel(row.type).charAt(0) : initials(t)}
              </span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {t.title || t.first_name || t.last_name
                    ? `${t.title ? `${t.title} ` : ""}${t.first_name || ""} ${t.last_name || ""}`.trim()
                    : `Passenger (${typeLabel(row.type)})`}
                </p>
                <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                  {typeLabel(row.type)}
                </span>
                <span className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] ${badgeClasses}`}>
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
              disabled={totalPax <= 1}
              className={[
                "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs",
                totalPax <= 1
                  ? "border-slate-200 text-slate-400 cursor-not-allowed"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              ].join(" ")}
              title={totalPax <= 1 ? "You must have at least one passenger" : "Remove passenger"}
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
          {/* Row 1: Title / First / Last */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <LabeledSelect id={`title-${idx}`} label="Title" value={t.title} onChange={onT("title")} required>
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
              autoComplete="given-name"
            />

            <LabeledInput
              id={`last-${idx}`}
              label="Last Name"
              value={t.last_name}
              onChange={onT("last_name")}
              required
              autoComplete="family-name"
            />
          </div>

          {/* Row 2: Nationality */}
          <div className="grid grid-cols-1 gap-3 mt-3">
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
          </div>

          {/* Row 3: DOB */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
            <LabeledSelect
              id={`dob-month-${idx}`}
              label="Date of Birth - Month"
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
              label="Date of Birth - Day"
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
              label="Date of Birth - Year"
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

          {/* Row 4: Passport */}
          <div className="grid grid-cols-1 gap-3 mt-3">
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
                autoComplete="off"
              />
            </div>
          </div>

          {/* Row 5: Issuance */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
            <LabeledSelect
              id={`iss-month-${idx}`}
              label="Issuance - Month"
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
              label="Issuance - Day"
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
              label="Issuance - Year"
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

          {/* Row 6: Expiry */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
            <LabeledSelect
              id={`exp-month-${idx}`}
              label="Expiry - Month"
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
              label="Expiry - Day"
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
              label="Expiry - Year"
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
      </li>
    );
  };

  return (
    <div className="travel">
      <div className="bg-white rounded-2xl w-full max-w-4xl mb-3 overflow-hidden ring-1 ring-slate-200">
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
            {rows.length === 0 ? (
              <li className="px-4 py-8 text-center text-sm text-slate-500 rounded-2xl ring-1 ring-slate-200 bg-white">
                Set traveller counts, then fill in each passenger.
              </li>
            ) : (
              rows.map((row, i) => <PassengerCard key={row._key} row={row} idx={i} />)
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
