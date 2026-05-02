import React, { useMemo, useState, useEffect } from "react";
import Select from "react-select";

/* ==========================================================================
   Modern Input Components
   ========================================================================== */

const BRAND_COLOR = "#F68221"; // Your primary orange

const customSelectStyles = {
  control: (base, state) => ({
    ...base,
    minHeight: "56px",
    height: "56px",
    borderRadius: "0.75rem", // rounded-xl (12px)
    border: state.isFocused ? `1px solid ${BRAND_COLOR}` : "1px solid #e2e8f0",
    backgroundColor: state.isFocused ? "#ffffff" : "#f8fafc", // bg-white vs bg-slate-50
    boxShadow: state.isFocused ? `0 0 0 1px ${BRAND_COLOR}` : "none",
    fontSize: "12px", // Crisp modern font size
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s ease",
    "&:hover": {
      borderColor: state.isFocused ? BRAND_COLOR : "#cbd5e1",
    },
  }),
  valueContainer: (base) => ({
    ...base,
    paddingTop: "16px", // Push text down slightly to make room for floating label
    paddingLeft: "8px",
  }),
  singleValue: (base) => ({
    ...base,
    color: "#0f172a", // text-slate-900
    fontSize: "12px",
  }),
  placeholder: (base) => ({
    ...base,
    color: "transparent", // Hide default placeholder, we use the absolute label
  }),
  input: (base) => ({
    ...base,
    margin: 0,
    paddingTop: "16px",
    color: "#0f172a",
  }),
  indicatorSeparator: () => ({
    display: "none",
  }),
  dropdownIndicator: (base) => ({
    ...base,
    color: "#94a3b8",
  }),
  menu: (base) => ({
    ...base,
    borderRadius: "0.75rem",
    overflow: "hidden",
    boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
    zIndex: 9999,
  }),
  menuPortal: (base) => ({ 
    ...base, 
    zIndex: 9999 // Guarantees the dropdown breaks out of any hidden overflow containers
  }), 
  option: (base, state) => ({
    ...base,
    fontSize: "14px",
    backgroundColor: state.isSelected ? "#0ea5e9" : state.isFocused ? "#f0f9ff" : "white",
    color: state.isSelected ? "white" : "#0f172a",
    cursor: "pointer",
    "&:active": {
      backgroundColor: "#bae6fd",
    },
  }),
};

// Converts a 2-letter ISO code to a flag emoji (e.g. US -> 🇺🇸)
const getFlagEmoji = (countryCode) => {
  if (!countryCode) return "";
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt());
  return String.fromCodePoint(...codePoints);
};

// Reusable Searchable Select with Floating Label
const SearchableSelect = ({ id, label, value, options, onChange, required, formatOptionLabel }) => {
  const selectedOption = useMemo(() => options.find((o) => o.value === value) || null, [options, value]);
  // Use a portal so the dropdown never gets trapped under the next row
  const menuPortalTarget = typeof document !== "undefined" ? document.body : null;

  return (
    <div className="relative min-w-0">
      <Select
        inputId={id}
        value={selectedOption}
        onChange={(option) => onChange(option ? option.value : "")}
        options={options}
        styles={customSelectStyles}
        isClearable={false}
        isSearchable={true}
        formatOptionLabel={formatOptionLabel}
        menuPortalTarget={menuPortalTarget} 
      />
      <label
        htmlFor={id}
        className="pointer-events-none absolute left-3 top-1.5 text-[11px] text-slate-500 z-10 transition-all"
      >
        {label} {required && <span className="text-red-500">*</span>}
      </label>
    </div>
  );
};

// Standard Floating Label Text Input
const LabeledInput = ({ id, label, type = "text", value, onChange, required, autoComplete }) => (
  <div className="relative min-w-0">
    <input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="block w-full rounded-2xl border border-slate-300 bg-white px-3 pb-1.5 pt-[18px] mt-1 text-[14px] text-slate-900 placeholder-transparent focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 h-12 transition-all peer"
      placeholder=" "
      required={required}
      autoComplete={autoComplete}
    />
    <label
      htmlFor={id}
      className="pointer-events-none absolute left-3 top-1.5 text-[11px] text-slate-500 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:text-slate-400 peer-focus:top-1.5 peer-focus:text-[11px] peer-focus:text-slate-500"
    >
      {label} {required && <span className="text-red-500">*</span>}
    </label>
  </div>
);

/* ==========================================================================
   Passenger Card Row
   ========================================================================== */

const PassengerCard = ({
  row,
  idx,
  drafts,
  onRemove,
  totalPax,
  onFieldChange,
  isComplete,
  typeLabel,
  typeRing,
  initials,
  countryOptions,
  months,
  days,
  dobYears,
  issuanceYears,
  expiryYears,
}) => {
  const t = drafts[row._key] || row.traveler;
  const complete = isComplete(t);
  const badgeClasses = complete ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700";
  const dot = complete ? "bg-emerald-600" : "bg-amber-600";
  const onT = (field) => (v) => onFieldChange(row, field, v);

  // Formatting country labels with flags
  const formatCountryLabel = ({ label, value }) => (
    <div className="flex items-center gap-2">
      <span className="text-lg leading-none">{getFlagEmoji(value)}</span>
      <span>{label}</span>
    </div>
  );

  return (
    <li className="rounded-2xl bg-white ring-1 ring-slate-200 overflow-visible relative z-0 hover:z-10 focus-within:z-20 transition-all">
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
                {t.first_name || t.last_name
                  ? `${t.first_name || ""} ${t.last_name || ""}`.trim()
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
              {t.nationality ? `Nationality set` : "Nationality required"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {row.kind === "real" && (
            <button
              type="button"
              onClick={() => onRemove(row)}
              disabled={totalPax <= 1}
              className={[
                "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors",
                totalPax <= 1
                  ? "border-slate-200 text-slate-400 cursor-not-allowed bg-slate-50"
                  : "border-rose-200 text-rose-600 hover:bg-rose-50 bg-white",
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
      </div>

      {/* Body */}
      <div className="px-4 pb-4">
        {/* Row 1: Title / First / Last */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr_2fr] gap-3">
          <SearchableSelect
            id={`gender-${idx}`}
            label="Gender"
            value={t.gender}
            onChange={onT("gender")}
            required
            options={[
              { value: "M", label: "Male" },
              { value: "F", label: "Female" },
            ]}
          />

          <LabeledInput id={`first-${idx}`} label="First Name" value={t.first_name} onChange={onT("first_name")} required autoComplete="given-name" />
          <LabeledInput id={`last-${idx}`} label="Last Name" value={t.last_name} onChange={onT("last_name")} required autoComplete="family-name" />
        </div>

        {/* Row 2: Nationality */}
        <div className="grid grid-cols-1 gap-3 mt-3">
          <SearchableSelect
            id={`nationality-${idx}`}
            label="Nationality"
            value={t.nationality}
            onChange={onT("nationality")}
            required
            options={countryOptions}
            formatOptionLabel={formatCountryLabel}
          />
        </div>

        {/* Row 3: DOB */}
        <div className="grid grid-cols-3 gap-3 mt-3">
          <SearchableSelect id={`dob-day-${idx}`} label="Day" value={t.dob_day} onChange={onT("dob_day")} required options={days} />
          <SearchableSelect id={`dob-month-${idx}`} label="Month" value={t.dob_month} onChange={onT("dob_month")} required options={months} />
          <SearchableSelect id={`dob-year-${idx}`} label="Year" value={t.dob_year} onChange={onT("dob_year")} required options={dobYears} />
        </div>

        <div className="mt-4 border-t border-slate-100 pt-4">
          <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wide mb-3">Travel Document</h4>
          
          {/* Row 4: Passport */}
          <div className="grid grid-cols-1 gap-3">
            <LabeledInput id={`passport-${idx}`} label="Passport or ID Number" value={t.passport} onChange={onT("passport")} required autoComplete="off" />
          </div>

          {/* Row 5: Issuance */}
          <div className="grid grid-cols-3 gap-3 mt-3">
            <SearchableSelect id={`iss-day-${idx}`} label="Issue Day" value={t.passport_issuance_day} onChange={onT("passport_issuance_day")} required options={days} />
            <SearchableSelect id={`iss-month-${idx}`} label="Issue Month" value={t.passport_issuance_month} onChange={onT("passport_issuance_month")} required options={months} />
            <SearchableSelect id={`iss-year-${idx}`} label="Issue Year" value={t.passport_issuance_year} onChange={onT("passport_issuance_year")} required options={issuanceYears} />
          </div>

          {/* Row 6: Expiry */}
          <div className="grid grid-cols-3 gap-3 mt-3">
            <SearchableSelect id={`exp-day-${idx}`} label="Expiry Day" value={t.passport_expiry_day} onChange={onT("passport_expiry_day")} required options={days} />
            <SearchableSelect id={`exp-month-${idx}`} label="Expiry Month" value={t.passport_expiry_month} onChange={onT("passport_expiry_month")} required options={months} />
            <SearchableSelect id={`exp-year-${idx}`} label="Expiry Year" value={t.passport_expiry_year} onChange={onT("passport_expiry_year")} required options={expiryYears} />
          </div>
        </div>
      </div>
    </li>
  );
};

/* ==========================================================================
   Main Parent Component
   ========================================================================== */

export default function PassengerDetailsCard({
  formData,
  handleFormChange,
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
}) {
  const emptyTraveler = (type = "adult") => ({
    type, gender: "", first_name: "", last_name: "", nationality: "",
    dob_month: "", dob_day: "", dob_year: "", passport: "",
    passport_issuance_month: "", passport_issuance_day: "", passport_issuance_year: "",
    passport_expiry_month: "", passport_expiry_day: "", passport_expiry_year: "",
  });

  const totalPax = (adults || 0) + (children || 0) + (infants || 0);

  const typeLabel = (t) => (t === "adult" ? "Adult" : t === "child" ? "Child" : "Infant");
  const typeRing = (t) => t === "adult" ? "ring-slate-700 bg-slate-50" : t === "child" ? "ring-sky-700 bg-sky-50" : "ring-emerald-700 bg-emerald-50";

  const initials = (t) => {
    const a = (t.first_name || "").trim().charAt(0).toUpperCase();
    const b = (t.last_name || "").trim().charAt(0).toUpperCase();
    return a || b ? `${a || b}` : typeLabel(t.type).charAt(0);
  };

  const isComplete = (t) =>
    t.gender && t.first_name && t.last_name && t.nationality &&
    t.dob_month && t.dob_day && t.dob_year && t.passport &&
    t.passport_issuance_month && t.passport_issuance_day && t.passport_issuance_year &&
    t.passport_expiry_month && t.passport_expiry_day && t.passport_expiry_year;

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

  // Convert raw arrays to react-select { value, label } format
  const countryOptions = useMemo(() => countries.map(c => ({ value: c.code, label: c.name })), [countries]);

  // Local drafts state
  const [drafts, setDrafts] = useState({});

  // Sync draft to parent formData whenever it changes
  useEffect(() => {
    if (Object.keys(drafts).length === 0) return;

    const nextTravelers = [...travelers];
    let hasChanges = false;

    Object.entries(drafts).forEach(([key, draftData]) => {
      const row = rows.find(r => r._key === key);
      if (!row) return;

      if (row.kind === "real") {
        nextTravelers[row.traveler._index] = { ...nextTravelers[row.traveler._index], ...draftData };
        hasChanges = true;
      } else {
        nextTravelers.push({ ...draftData, type: row.type });
        addTraveler(row.type); 
        setDrafts(prev => { const p = {...prev}; delete p[key]; return p; });
        hasChanges = true;
      }
    });

    if (hasChanges) {
      handleFormChange({ target: { name: "travelers", value: nextTravelers } });
    }
  }, [drafts]); 

  const rows = useMemo(() => {
    const out = [];
    ["adult", "child", "infant"].forEach((t) => {
      const have = byType[t].length;
      const want = desired[t] || 0;

      byType[t].forEach((trav) => {
        out.push({ kind: "real", type: t, traveler: trav, _key: `real-${t}-${trav._index}` });
      });

      for (let k = 0; k < Math.max(0, want - have); k++) {
        out.push({ kind: "placeholder", type: t, traveler: emptyTraveler(t), _placeholderIndex: k, _key: `ph-${t}-${k}` });
      }
    });
    return out;
  }, [byType, desired]);

  const onFieldChange = (row, field, value) => {
    const key = row._key;
    setDrafts((prev) => {
      const base = prev[key] ?? { ...row.traveler, type: row.type };
      return { ...prev, [key]: { ...base, [field]: value } };
    });
  };

  const onRemove = (row) => {
    if (row.kind !== "real" || totalPax <= 1) return;
    const idx = row.traveler._index;
    const next = [...travelers];
    next.splice(idx, 1);
    handleFormChange({ target: { name: "travelers", value: next } });
    removeTraveler(idx);
    
    setDrafts(prev => { const p = {...prev}; delete p[row._key]; return p; });
  };

  return (
    <div className="bg-white rounded-2xl w-full mb-3 overflow-hidden ring-1 ring-slate-200">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3 min-w-0">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-[#FFF3E8] text-[#F68221]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 640 640" aria-hidden>
              <path d="M320 312C386.3 312 440 258.3 440 192C440 125.7 386.3 72 320 72C253.7 72 200 125.7 200 192C200 258.3 253.7 312 320 312zM290.3 368C191.8 368 112 447.8 112 546.3C112 562.7 125.3 576 141.7 576L498.3 576C514.7 576 528 562.7 528 546.3C528 447.8 448.2 368 349.7 368L290.3 368z"/>
            </svg>
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-slate-900">Passenger details</h2>
            <p className="text-xs text-slate-600">{getPassengerSummary(adults, children, infants)}</p>
          </div>
        </div>
        <span className="text-xs font-medium bg-amber-50 text-amber-700 px-3 py-1 rounded-full">
          Ensure names match passports exactly.
        </span>
      </header>

      <div className="px-4 sm:px-6 pb-5 bg-slate-50/50 pt-4">
        <ul className="grid grid-cols-1 gap-4">
          {rows.length === 0 ? (
            <li className="px-4 py-8 text-center text-sm text-slate-500 rounded-2xl ring-1 ring-slate-200 bg-white">
              Set traveller counts, then fill in each passenger.
            </li>
          ) : (
            rows.map((row, i) => (
              <PassengerCard
                key={row._key}
                row={row}
                idx={i}
                drafts={drafts}
                onRemove={onRemove}
                totalPax={totalPax}
                onFieldChange={onFieldChange}
                isComplete={isComplete}
                typeLabel={typeLabel}
                typeRing={typeRing}
                initials={initials}
                countryOptions={countryOptions}
                months={months}
                days={days}
                dobYears={dobYears}
                issuanceYears={issuanceYears}
                expiryYears={expiryYears}
              />
            ))
          )}
        </ul>
      </div>
    </div>
  );
}