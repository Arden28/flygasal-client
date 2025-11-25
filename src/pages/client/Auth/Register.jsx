import React, { useState, useContext, useRef, useMemo } from "react";
import Select from "react-select";
import HCaptcha from "@hcaptcha/react-hcaptcha";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../../context/AuthContext";
import { countries } from "../../../data/fakeData";

/* ---------------- i18n ---------------- */
const T = {
  signup: "Create Account",
  agent: "Agent Portal",
  name: "Full Name",
  select_country: "Country",
  phone: "Phone Number",
  email: "Work Email",
  password: "Password",
  confirm_password: "Confirm Password",
  by_signup_i_agree_to_terms_and_policy: "I agree to the Terms of Service & Privacy Policy",
  agency_name: "Agency Name",
  agency_license: "License Number / IATA",
  agency_city: "City",
  agency_address: "Street Address",
  continue: "Continue",
  back: "Back",
  create_account: "Complete Registration",
  already_have_account: "Already a partner?",
  sign_in: "Log in",
  
  // Side Panel Copy
  side_title: "Grow your travel business.",
  side_sub: "Join thousands of agencies booking wholesale rates today.",
  feat1: "Exclusive B2B Fares",
  feat2: "Instant Ticketing",
  feat3: "24/7 Priority Support",
};

/* ---------------- Styles for react-select ---------------- */
const customSelectStyles = {
  control: (provided, state) => ({
    ...provided,
    backgroundColor: "#ffffff",
    border: state.isFocused ? "1px solid #F68221" : "1px solid #e5e7eb",
    borderRadius: "0.5rem", // matches tailwind rounded-lg
    minHeight: "50px",
    boxShadow: state.isFocused ? "0 0 0 4px rgba(246, 130, 33, 0.1)" : "none",
    transition: "all 0.2s ease",
    "&:hover": { borderColor: "#F68221" }
  }),
  valueContainer: (provided) => ({
    ...provided,
    padding: "0 1rem",
  }),
  input: (provided) => ({
    ...provided,
    margin: 0,
    padding: 0,
  }),
  placeholder: (provided) => ({
    ...provided,
    color: "#9ca3af",
  }),
  singleValue: (provided) => ({
    ...provided,
    color: "#111827",
    fontWeight: 500,
  }),
  menu: (provided) => ({
    ...provided,
    borderRadius: "0.75rem",
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
    border: "1px solid #e5e7eb",
    zIndex: 50,
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isFocused ? "#FFF7EE" : "white",
    color: state.isSelected ? "#F68221" : "#374151",
    cursor: "pointer",
    padding: "10px 1rem",
    "&:active": { backgroundColor: "#FFEAD5" }
  }),
};

const CountryOption = ({ innerProps, data }) => (
  <div {...innerProps} className="d-flex align-items-center justify-content-between px-3 py-2">
    <div className="d-flex align-items-center">
      <img src={data.flag} alt="" width={20} className="me-3 rounded-1 shadow-sm" />
      <span className="fw-medium">{data.name}</span>
    </div>
    <span className="text-muted small bg-light px-2 py-1 rounded">{data.callingCode}</span>
  </div>
);

const CountrySingleValue = ({ innerProps, data }) => (
  <div {...innerProps} className="d-flex align-items-center">
    <img src={data.flag} alt="" width={20} className="me-2 rounded-1" />
    <span>{data.name}</span>
  </div>
);

/* ---------------- Logic Helpers ---------------- */
const digitsOnly = (v) => v.replace(/\D+/g, "");
const strength = (pwd) => {
  let sc = 0;
  if (pwd.length >= 8) sc++;
  if (/[A-Z]/.test(pwd)) sc++;
  if (/[0-9]/.test(pwd)) sc++;
  if (/[^A-Za-z0-9]/.test(pwd)) sc++;
  return Math.min(sc, 4);
};
const stripPlus = (code) => (code || "").replace(/^\+/, "");

/* ---------------- Component ---------------- */
const Register = ({
  formToken = "static_form_token",
  hcaptchaSiteKey = "f32aa812-3254-479a-839c-4e8a70388cac",
}) => {
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  // State
  const [step, setStep] = useState(1);
  const [isAgreed, setIsAgreed] = useState(false);
  const [isCaptchaOk, setIsCaptchaOk] = useState(false);
  const captchaRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [showPwd, setShowPwd] = useState(false);
  const [showPwd2, setShowPwd2] = useState(false);

  const [form, setForm] = useState({
    name: "",
    country: null,
    phone: "",
    email: "",
    password: "",
    confirm_password: "",
    agency_name: "",
    agency_license: "",
    agency_city: "",
    agency_address: "",
  });

  /* -------- Validation Logic -------- */
  const validateStep1 = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Full name is required";
    if (!form.country) e.country = "Select your country";
    if (!form.phone.trim()) e.phone = "Phone number is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = "Invalid email address";
    if (!form.password) e.password = "Password is required";
    else if (form.password.length < 8) e.password = "Min 8 characters";
    if (form.confirm_password !== form.password) e.confirm_password = "Passwords do not match";
    return e;
  };

  const validateStep2 = () => {
    const e = {};
    if (!form.agency_name.trim()) e.agency_name = "Agency name is required";
    if (!form.agency_license.trim()) e.agency_license = "License number is required";
    if (!form.agency_city.trim()) e.agency_city = "City is required";
    if (!form.agency_address.trim()) e.agency_address = "Address is required";
    if (!isAgreed) e.terms = "Please accept the terms";
    if (!isCaptchaOk) e.recaptcha = "Please verify you are human";
    return e;
  };

  const markTouched = (name) => setTouched((t) => ({ ...t, [name]: true }));

  /* -------- Handlers -------- */
  const onInput = (e) => {
    const { name, value } = e.target;
    const v = name === "phone" ? digitsOnly(value) : value;
    setForm((f) => ({ ...f, [name]: v }));
    if (formErrors[name]) setFormErrors((er) => ({ ...er, [name]: "" }));
  };

  const onCountry = (opt) => {
    setForm((f) => ({ ...f, country: opt }));
    if (formErrors.country) setFormErrors((er) => ({ ...er, country: "" }));
  };

  const goNext = () => {
    const e = validateStep1();
    if (Object.keys(e).length) {
      setFormErrors(e);
      setTouched({ name: true, phone: true, email: true, password: true, confirm_password: true, country: true });
      return;
    }
    setFormErrors({});
    setStep(2);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const e2 = validateStep2();
    if (Object.keys(e2).length) {
      setFormErrors(e2);
      setTouched((prev) => ({ ...prev, agency_name: true, agency_license: true, agency_city: true, agency_address: true }));
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        phone_number: form.phone.trim(),
        phone_country_code: stripPlus(form.country?.callingCode || ""),
        phone_country_iso: form.country?.code || null,
        agency_name: form.agency_name.trim(),
        agency_license: form.agency_license.trim(),
        agency_city: form.agency_city.trim(),
        agency_address: form.agency_address.trim(),
        role: "agent",
        form_token: formToken,
      };
      await register(payload);
      navigate("/signup-success", { replace: true });
    } catch (err) {
      const msg = err?.response?.data?.message || "Registration failed. Please try again.";
      setFormErrors({ general: msg });
    } finally {
      setIsLoading(false);
    }
  };

  /* -------- Render Helpers -------- */
  const pwdScore = strength(form.password);
  const pwdBars = ["#ef4444", "#f59e0b", "#84cc16", "#22c55e"]; // red, orange, lime, green
  
  // Dynamic CSS for focus states
  const getFieldClass = (fieldName) => {
    const base = "form-control modern-input";
    if (touched[fieldName] && formErrors[fieldName]) return `${base} is-invalid`;
    return base;
  };

  return (
    <>
      <style>{`
        :root {
          --brand-primary: #F68221;
          --brand-hover: #e06d0e;
          --brand-soft: #FFF7EE;
          --text-main: #111827;
          --text-sub: #6B7280;
          --border-color: #E5E7EB;
        }
        body { background-color: #F9FAFB; }
        
        /* Modern Input Reset */
        .modern-input {
          height: 50px;
          border-radius: 0.5rem;
          border: 1px solid var(--border-color);
          padding: 0.75rem 1rem;
          font-size: 0.95rem;
          background-color: #fff;
          transition: all 0.2s ease;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
        .modern-input:focus {
          border-color: var(--brand-primary);
          box-shadow: 0 0 0 4px rgba(246, 130, 33, 0.1);
        }
        .modern-input.is-invalid {
          border-color: #EF4444;
          background-image: none; /* Remove default bootstrap x icon */
        }
        
        /* Floating Labelsish - making labels cleaner */
        .form-label {
          font-weight: 500;
          font-size: 0.875rem;
          color: #374151;
          margin-bottom: 0.35rem;
        }

        /* Buttons */
        .btn-brand {
          background-color: var(--brand-primary);
          color: white;
          border: none;
          height: 50px;
          font-weight: 600;
          border-radius: 0.5rem;
          transition: transform 0.1s ease, box-shadow 0.2s ease;
        }
        .btn-brand:hover {
          background-color: var(--brand-hover);
          color: white;
          transform: translateY(-1px);
          box-shadow: 0 4px 6px -1px rgba(246, 130, 33, 0.2);
        }
        .btn-brand:active { transform: translateY(0); }
        .btn-brand:disabled { opacity: 0.7; transform: none; }

        .btn-outline-back {
          border: 1px solid var(--border-color);
          background: white;
          color: var(--text-sub);
          height: 50px;
          border-radius: 0.5rem;
          font-weight: 500;
        }
        .btn-outline-back:hover { background: #f3f4f6; color: var(--text-main); }

        /* Progress Steps */
        .step-indicator { display: flex; gap: 8px; margin-bottom: 2rem; }
        .step-pill { height: 4px; flex: 1; border-radius: 2px; background: #E5E7EB; transition: all 0.3s ease; }
        .step-pill.active { background: var(--brand-primary); }

        /* Eye Icon */
        .pwd-toggle {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          border: none;
          background: none;
          color: #9CA3AF;
          cursor: pointer;
          padding: 4px;
        }
        .pwd-toggle:hover { color: #6B7280; }

        /* Layout Utilities */
        .split-layout { min-height: 100vh; display: flex; }
        .split-left { 
          flex: 1; 
          background: white; 
          display: flex; 
          flex-direction: column; 
          justify-content: center; 
          padding: 2rem; 
          position: relative;
        }
        .split-right { 
          flex: 0 0 500px; 
          background: #111827; 
          position: relative; 
          overflow: hidden; 
          display: none; /* Hidden on mobile */
        }
        .bg-img-cover {
          position: absolute; inset: 0; width: 100%; height: 100%;
          object-fit: cover; opacity: 0.4; mix-blend-mode: overlay;
        }
        .right-content {
          position: relative; z-index: 2; padding: 4rem; height: 100%;
          display: flex; flex-direction: column; justify-content: center; color: white;
        }

        /* Checkbox Custom */
        .custom-check { accent-color: var(--brand-primary); width: 1.1rem; height: 1.1rem; }

        @media (min-width: 992px) {
          .split-right { display: block; flex: 1; max-width: 50%; }
          .split-left { max-width: 50%; padding: 4rem 6rem; }
        }
      `}</style>

      <div className="split-layout">
        
        {/* LEFT PANEL: FORM */}
        <div className="split-left">
          
          {/* Header */}
          <div className="mb-4">
            <h1 className="h3 fw-bold text-dark mb-1">{T.signup}</h1>
            <p className="text-muted">
              {T.already_have_account} <a href="/login" style={{ color: "var(--brand-primary)", textDecoration:'none', fontWeight: 600 }}>{T.sign_in}</a>
            </p>
          </div>

          {/* Progress Bar */}
          <div className="step-indicator">
            <div className={`step-pill ${step >= 1 ? "active" : ""}`} />
            <div className={`step-pill ${step >= 2 ? "active" : ""}`} />
          </div>

          {/* Error Banner */}
          {formErrors.general && (
            <div className="alert alert-danger border-0 d-flex align-items-center mb-4 small" style={{background: "#FEF2F2", color: "#991B1B"}}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-exclamation-circle-fill me-2" viewBox="0 0 16 16">
                <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8 4a.905.905 0 0 0-.9.995l.35 3.507a.552.552 0 0 0 1.1 0l.35-3.507A.905.905 0 0 0 8 4zm.002 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"/>
              </svg>
              {formErrors.general}
            </div>
          )}

          <form onSubmit={onSubmit} noValidate>
            
            {/* STEP 1: Account Details */}
            {step === 1 && (
              <div className="fade-in-up">
                <div className="mb-3">
                  <label className="form-label">{T.name}</label>
                  <input
                    type="text"
                    name="name"
                    className={getFieldClass("name")}
                    placeholder="Jane Doe"
                    value={form.name}
                    onChange={onInput}
                    onBlur={() => markTouched("name")}
                  />
                  {touched.name && formErrors.name && <div className="text-danger small mt-1">{formErrors.name}</div>}
                </div>

                <div className="mb-3">
                  <label className="form-label">{T.select_country}</label>
                  <Select
                    options={countries}
                    value={form.country}
                    onChange={onCountry}
                    styles={customSelectStyles}
                    components={{ Option: CountryOption, SingleValue: CountrySingleValue }}
                    placeholder="Select Country..."
                    getOptionValue={(o) => o.code}
                  />
                  {touched.country && formErrors.country && <div className="text-danger small mt-1">{formErrors.country}</div>}
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-5 col-md-4">
                    <label className="form-label">Code</label>
                    <div className="modern-input bg-light text-muted d-flex align-items-center justify-content-center">
                      {form.country?.callingCode || "+ --"}
                    </div>
                  </div>
                  <div className="col-7 col-md-8">
                    <label className="form-label">{T.phone}</label>
                    <input
                      type="tel"
                      name="phone"
                      className={getFieldClass("phone")}
                      placeholder="712 345 678"
                      value={form.phone}
                      onChange={onInput}
                      onBlur={() => markTouched("phone")}
                    />
                  </div>
                </div>
                {touched.phone && formErrors.phone && <div className="text-danger small mb-3 mt-n2">{formErrors.phone}</div>}

                <div className="mb-3">
                  <label className="form-label">{T.email}</label>
                  <input
                    type="email"
                    name="email"
                    className={getFieldClass("email")}
                    placeholder="agent@company.com"
                    value={form.email}
                    onChange={onInput}
                    onBlur={() => markTouched("email")}
                  />
                  {touched.email && formErrors.email && <div className="text-danger small mt-1">{formErrors.email}</div>}
                </div>

                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <label className="form-label">{T.password}</label>
                    <div className="position-relative">
                      <input
                        type={showPwd ? "text" : "password"}
                        name="password"
                        className={getFieldClass("password")}
                        value={form.password}
                        onChange={onInput}
                        onBlur={() => markTouched("password")}
                      />
                      <button type="button" className="pwd-toggle" onClick={() => setShowPwd(!showPwd)}>
                        {showPwd ? "Hide" : "Show"}
                      </button>
                    </div>
                    {/* Tiny strength meter */}
                    {form.password && (
                      <div className="d-flex gap-1 mt-2">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} style={{height: 3, flex:1, borderRadius:2, background: i <= pwdScore ? pwdBars[pwdScore-1] : '#f3f4f6'}} />
                        ))}
                      </div>
                    )}
                    {touched.password && formErrors.password && <div className="text-danger small mt-1">{formErrors.password}</div>}
                  </div>
                  
                  <div className="col-md-6">
                    <label className="form-label">{T.confirm_password}</label>
                    <div className="position-relative">
                      <input
                        type={showPwd2 ? "text" : "password"}
                        name="confirm_password"
                        className={getFieldClass("confirm_password")}
                        value={form.confirm_password}
                        onChange={onInput}
                        onBlur={() => markTouched("confirm_password")}
                      />
                      <button type="button" className="pwd-toggle" onClick={() => setShowPwd2(!showPwd2)}>
                        {showPwd2 ? "Hide" : "Show"}
                      </button>
                    </div>
                    {touched.confirm_password && formErrors.confirm_password && <div className="text-danger small mt-1">{formErrors.confirm_password}</div>}
                  </div>
                </div>

                <button type="button" onClick={goNext} className="btn-brand w-100 mt-2">
                  {T.continue}
                </button>
              </div>
            )}

            {/* STEP 2: Agency Details */}
            {step === 2 && (
              <div className="fade-in-up">
                <div className="mb-3">
                  <label className="form-label">{T.agency_name}</label>
                  <input
                    type="text"
                    name="agency_name"
                    className={getFieldClass("agency_name")}
                    value={form.agency_name}
                    onChange={onInput}
                    onBlur={() => markTouched("agency_name")}
                  />
                  {touched.agency_name && formErrors.agency_name && <div className="text-danger small mt-1">{formErrors.agency_name}</div>}
                </div>

                <div className="mb-3">
                  <label className="form-label">{T.agency_license}</label>
                  <input
                    type="text"
                    name="agency_license"
                    className={getFieldClass("agency_license")}
                    placeholder="e.g. IATA-123456"
                    value={form.agency_license}
                    onChange={onInput}
                    onBlur={() => markTouched("agency_license")}
                  />
                  {touched.agency_license && formErrors.agency_license && <div className="text-danger small mt-1">{formErrors.agency_license}</div>}
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label className="form-label">{T.agency_city}</label>
                    <input
                      type="text"
                      name="agency_city"
                      className={getFieldClass("agency_city")}
                      value={form.agency_city}
                      onChange={onInput}
                      onBlur={() => markTouched("agency_city")}
                    />
                    {touched.agency_city && formErrors.agency_city && <div className="text-danger small mt-1">{formErrors.agency_city}</div>}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">{T.agency_address}</label>
                    <input
                      type="text"
                      name="agency_address"
                      className={getFieldClass("agency_address")}
                      value={form.agency_address}
                      onChange={onInput}
                      onBlur={() => markTouched("agency_address")}
                    />
                    {touched.agency_address && formErrors.agency_address && <div className="text-danger small mt-1">{formErrors.agency_address}</div>}
                  </div>
                </div>

                <div className="d-flex align-items-start mb-3">
                  <input
                    id="terms"
                    type="checkbox"
                    className="custom-check mt-1"
                    checked={isAgreed}
                    onChange={(e) => setIsAgreed(e.target.checked)}
                  />
                  <div className="ms-2">
                    <label htmlFor="terms" className="small text-muted cursor-pointer">
                      {T.by_signup_i_agree_to_terms_and_policy}
                    </label>
                    {formErrors.terms && <div className="text-danger small d-block">{formErrors.terms}</div>}
                  </div>
                </div>

                <div className="mb-4">
                  <HCaptcha
                    sitekey={hcaptchaSiteKey}
                    onVerify={() => setIsCaptchaOk(true)}
                    onExpire={() => setIsCaptchaOk(false)}
                    onError={() => setIsCaptchaOk(false)}
                    ref={captchaRef}
                  />
                  {formErrors.recaptcha && <div className="text-danger small mt-1">{formErrors.recaptcha}</div>}
                </div>

                <div className="d-flex gap-3">
                  <button type="button" onClick={() => setStep(1)} className="btn-outline-back w-25">
                    {T.back}
                  </button>
                  <button type="submit" disabled={isLoading} className="btn-brand w-75 d-flex justify-content-center align-items-center">
                    {isLoading ? <span className="spinner-border spinner-border-sm" /> : T.create_account}
                  </button>
                </div>
              </div>
            )}
            
          </form>
          
          <div className="mt-auto pt-4 text-center text-muted small">
            &copy; {new Date().getFullYear()} Fly Gasal. All rights reserved.
          </div>
        </div>

        {/* RIGHT PANEL: VISUALS */}
        <div className="split-right">
          <img src="/assets/img/before-booking.webp" alt="Travel" className="bg-img-cover" />
          <div className="right-content">
            <h2 className="display-5 fw-bold mb-3">{T.side_title}</h2>
            <p className="lead mb-5 opacity-75">{T.side_sub}</p>
            
            <ul className="list-unstyled">
              <li className="d-flex align-items-center mb-3">
                <div className="rounded-circle bg-white text-dark d-flex align-items-center justify-content-center me-3" style={{width: 32, height:32}}>
                  ✓
                </div>
                <span className="fs-5">{T.feat1}</span>
              </li>
              <li className="d-flex align-items-center mb-3">
                <div className="rounded-circle bg-white text-dark d-flex align-items-center justify-content-center me-3" style={{width: 32, height:32}}>
                  ✓
                </div>
                <span className="fs-5">{T.feat2}</span>
              </li>
              <li className="d-flex align-items-center mb-3">
                <div className="rounded-circle bg-white text-dark d-flex align-items-center justify-content-center me-3" style={{width: 32, height:32}}>
                  ✓
                </div>
                <span className="fs-5">{T.feat3}</span>
              </li>
            </ul>
          </div>
        </div>

      </div>
    </>
  );
};

export default Register;