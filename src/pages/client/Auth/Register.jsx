import React, { useState, useContext, useRef } from "react";
import Select from "react-select";
import HCaptcha from "@hcaptcha/react-hcaptcha";
import { AuthContext } from "../../../context/AuthContext";
import { useNavigate } from "react-router-dom";

/* ---------------- i18n ---------------- */
const T = {
  signup: "Sign Up",
  agent: "Agent",
  name: "Full Name",
  country: "Country",
  select_country: "Select Country",
  phone: "Phone Number",
  email: "Email",
  address: "Address",
  password: "Password",
  confirm_password: "Confirm Password",
  by_signup_i_agree_to_terms_and_policy: "By signing up, I agree to the Terms and Policy",
  agency_name: "Agency Name",
  agency_license: "Agency License",
  agency_city: "Agency City",
  agency_address: "Agency Address",
  continue: "Continue",
  back: "Back",
  create_account: "Create Account",
  already_have_account: "Already have an account?",
  sign_in: "Sign in",

  // Marketing copy
  hero_title: "Join Fly Gasal as an Agent",
  hero_sub: "Access wholesale rates, manage bookings, and grow your travel business with a dashboard built for agencies.",
  cta_get_started: "Get Started",
  why_join_title: "Why join Fly Gasal?",
  why_join_sub: "Access wholesale rates and premium inventory to boost your travel agency's revenue.",
  feat1_title: "Wholesale Rates",
  feat1_desc: "Access exclusive B2B fares and room rates to maximize your margins.",
  feat2_title: "Premium Inventory",
  feat2_desc: "Book flights and stays across global carriers and top hotels.",
  feat3_title: "Agent Dashboard",
  feat3_desc: "Manage bookings, invoices, markups, and reports in one place.",
  feat4_title: "Dedicated Support",
  feat4_desc: "Priority, 24/7 support tailored for travel agencies.",
  how_title: "How it works",
  how_sub: "Start booking with wholesale rates today.",
  step1_t: "Register as an Agent",
  step1_d: "Complete a quick verification of your agency credentials.",
  step2_t: "Access Your Dashboard",
  step2_d: "Log in and unlock wholesale rates and premium inventory.",
  step3_t: "Make Bookings",
  step3_d: "Search, filter, and confirm bookings in real time.",
  step4_t: "Grow Your Business",
  step4_d: "Track performance, manage clients, and scale profitably.",
};

/* ---------------- Countries (mock) ---------------- */
const countries = [
  { id: "1", iso: "us", nicename: "United States", phonecode: "1" },
  { id: "2", iso: "uk", nicename: "United Kingdom", phonecode: "44" },
  { id: "3", iso: "ca", nicename: "Canada", phonecode: "1" },
  { id: "4", iso: "in", nicename: "India", phonecode: "91" },
  { id: "5", iso: "au", nicename: "Australia", phonecode: "61" },
];

/* ---------------- Styles for react-select ---------------- */
const selectStyles = {
  control: (p, s) => ({
    ...p,
    borderRadius: 12,
    minHeight: 48,
    borderColor: s.isFocused ? "#60a5fa" : "#e5e7eb",
    boxShadow: s.isFocused ? "0 0 0 3px rgba(59,130,246,.2)" : "none",
    ":hover": { borderColor: "#93c5fd" },
  }),
  menu: (p) => ({ ...p, borderRadius: 12, overflow: "hidden" }),
  option: (p, s) => ({
    ...p,
    padding: "10px 12px",
    background: s.isFocused ? "#f3f4f6" : "white",
  }),
};

const CustomOption = ({ innerProps, data }) => (
  <div {...innerProps} className="d-flex align-items-center px-3 py-2">
    <img src={`/assets/img/flags/${data.iso}.svg`} alt="" width={18} className="me-2" />
    <span>
      {data.nicename} (+{data.phonecode})
    </span>
  </div>
);
const CustomSingleValue = ({ innerProps, data }) => (
  <div {...innerProps} className="d-flex align-items-center">
    <img src={`/assets/img/flags/${data.iso}.svg`} alt="" width={18} className="me-2" />
    <span>
      {data.nicename} (+{data.phonecode})
    </span>
  </div>
);

/* ---------------- Helpers ---------------- */
const digitsOnly = (v) => v.replace(/\D+/g, "");
const strength = (pwd) => {
  let sc = 0;
  if (pwd.length >= 8) sc++;
  if (/[A-Z]/.test(pwd)) sc++;
  if (/[a-z]/.test(pwd)) sc++;
  if (/\d/.test(pwd)) sc++;
  if (/[^A-Za-z0-9]/.test(pwd)) sc++;
  return Math.min(sc, 4);
};

const Register = ({
  formToken = "static_form_token",
  hcaptchaSiteKey = "f32aa812-3254-479a-839c-4e8a70388cac",
}) => {
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1: account, 2: agency
  const [isAgreed, setIsAgreed] = useState(false);
  const [isCaptchaOk, setIsCaptchaOk] = useState(false);
  const captchaRef = useRef(null);

  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [touched, setTouched] = useState({});

  const [form, setForm] = useState({
    name: "",
    phone_country_code: null,
    phone: "",
    email: "",
    password: "",
    confirm_password: "",
    agency_name: "",
    agency_license: "",
    agency_city: "",
    agency_address: "",
  });

  /* -------- Validation -------- */
  const step1Errors = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Full name is required.";
    if (!form.phone_country_code) e.phone_country_code = "Country is required.";
    if (!form.phone.trim()) e.phone = "Phone number is required.";
    else if (!/^\d{7,15}$/.test(form.phone.trim())) e.phone = "Phone must be 7–15 digits.";
    if (!form.email.trim()) e.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = "Invalid email format.";
    if (!form.password) e.password = "Password is required.";
    else if (form.password.length < 8) e.password = "Use at least 8 characters.";
    if (!form.confirm_password) e.confirm_password = "Please confirm your password.";
    else if (form.confirm_password !== form.password) e.confirm_password = "Passwords do not match.";
    return e;
  };
  const step2Errors = () => {
    const e = {};
    if (!form.agency_name.trim()) e.agency_name = "Agency name is required.";
    if (!form.agency_license.trim()) e.agency_license = "Agency license is required.";
    if (!form.agency_city.trim()) e.agency_city = "Agency city is required.";
    if (!form.agency_address.trim()) e.agency_address = "Agency address is required.";
    if (!isAgreed) e.terms = "You must agree to the Terms and Policy.";
    if (!isCaptchaOk) e.recaptcha = "Please complete the verification.";
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
    setForm((f) => ({ ...f, phone_country_code: opt }));
    if (formErrors.phone_country_code) setFormErrors((er) => ({ ...er, phone_country_code: "" }));
  };

  const goNext = () => {
    const e = step1Errors();
    if (Object.keys(e).length) {
      setFormErrors(e);
      const first = Object.keys(e)[0];
      const el = document.getElementById(first);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.focus();
      return;
    }
    setFormErrors({});
    setStep(2);
    setTimeout(() => document.getElementById("agency_name")?.focus(), 50);
  };
  const goBack = () => setStep(1);

  const onSubmit = async (e) => {
    e.preventDefault();
    const e2 = step2Errors();
    if (Object.keys(e2).length) {
      setFormErrors(e2);
      const first = Object.keys(e2)[0];
      const el = document.getElementById(first === "recaptcha" ? "hcaptcha-box" : first);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        phone_number: form.phone.trim(),
        phone_country_code: form.phone_country_code?.phonecode || null,
        phone_country_iso: form.phone_country_code?.iso || null,
        agency_name: form.agency_name.trim(),
        agency_license: form.agency_license.trim(),
        agency_city: form.agency_city.trim(),
        agency_address: form.agency_address.trim(),
        role: "agent",
        form_token: formToken,
      };
      await register(payload);
      // reset
      setForm({
        name: "",
        phone_country_code: null,
        phone: "",
        email: "",
        password: "",
        confirm_password: "",
        agency_name: "",
        agency_license: "",
        agency_city: "",
        agency_address: "",
      });
      setIsAgreed(false);
      setIsCaptchaOk(false);
      setFormErrors({});
      navigate("/signup-success", { replace: true });
    } catch (err) {
      const msg = err?.response?.data?.message || "Registration failed. Please try again.";
      setFormErrors({ general: msg });
    } finally {
      setIsLoading(false);
    }
  };

  /* -------- Visual helpers -------- */
  const pwdScore = strength(form.password);
  const pwdBars = ["#fee2e2", "#fde68a", "#bbf7d0", "#86efac"];
  const pwdBarColor = pwdScore ? pwdBars[pwdScore - 1] : "#e5e7eb";

  return (
    <>
      <style>{`
        .hero-grad{background:linear-gradient(135deg,#f8fbff 0%,#f5f7ff 40%,#f9f9ff 100%)}
        .card-glass{backdrop-filter:saturate(180%) blur(6px); background:rgba(255,255,255,.88)}
        .step-dot{width:28px;height:28px;border-radius:9999px}
        .step-dot.active{background:#2563eb;color:#fff}
        .step-dot.done{background:#22c55e;color:#fff}
        .feature-card{transition:transform .2s ease, box-shadow .2s ease}
        .feature-card:hover{transform:translateY(-2px); box-shadow:0 10px 20px rgba(0,0,0,.06)}
      `}</style>

      {/* Hero */}
      <section className="hero-grad py-5">
        <div className="container">
          <div className="row align-items-center g-4">
            <div className="col-lg-6">
              <h1 className="fw-bold mb-3">{T.hero_title}</h1>
              <p className="text-muted mb-4">{T.hero_sub}</p>
              <a href="#why-join" className="btn btn-primary btn-lg px-4">{T.cta_get_started}</a>
            </div>
            <div className="col-lg-6">
              <img src="/assets/img/agent.jpg" alt="Agent" className="img-fluid rounded-4 shadow-sm" />
            </div>
          </div>
        </div>
      </section>

      {/* Why Join / Advantages */}
      <section className="py-5 bg-white" id="why-join">
        <div className="container">
          <div className="text-center mb-4">
            <h2 className="fw-semibold">{T.why_join_title}</h2>
            <p className="text-muted">{T.why_join_sub}</p>
          </div>

          <div className="row g-4">
            <div className="col-md-3">
              <div className="feature-card h-100 p-4 rounded-4 border bg-white">
                <img src="/assets/img/ico1.png" alt="" width={48} className="mb-3" />
                <h5 className="fw-semibold mb-1">{T.feat1_title}</h5>
                <p className="text-muted small mb-0">{T.feat1_desc}</p>
              </div>
            </div>
            <div className="col-md-3">
              <div className="feature-card h-100 p-4 rounded-4 border bg-white">
                <img src="/assets/img/ico2.png" alt="" width={48} className="mb-3" />
                <h5 className="fw-semibold mb-1">{T.feat2_title}</h5>
                <p className="text-muted small mb-0">{T.feat2_desc}</p>
              </div>
            </div>
            <div className="col-md-3">
              <div className="feature-card h-100 p-4 rounded-4 border bg-white">
                <img src="/assets/img/ico3.png" alt="" width={48} className="mb-3" />
                <h5 className="fw-semibold mb-1">{T.feat3_title}</h5>
                <p className="text-muted small mb-0">{T.feat3_desc}</p>
              </div>
            </div>
            <div className="col-md-3">
              <div className="feature-card h-100 p-4 rounded-4 border bg-white">
                <img src="/assets/img/ico4.png" alt="" width={48} className="mb-3" />
                <h5 className="fw-semibold mb-1">{T.feat4_title}</h5>
                <p className="text-muted small mb-0">{T.feat4_desc}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-5 bg-light">
        <div className="container">
          <div className="text-center mb-4">
            <h2 className="fw-semibold">{T.how_title}</h2>
            <p className="text-muted">{T.how_sub}</p>
          </div>
          <div className="row align-items-center g-4">
            <div className="col-lg-6">
              <ol className="list-unstyled m-0">
                {[
                  { n: 1, t: T.step1_t, d: T.step1_d },
                  { n: 2, t: T.step2_t, d: T.step2_d },
                  { n: 3, t: T.step3_t, d: T.step3_d },
                  { n: 4, t: T.step4_t, d: T.step4_d },
                ].map((s) => (
                  <li key={s.n} className="d-flex align-items-start mb-3">
                    <div className="me-3 d-flex align-items-center justify-content-center rounded-circle bg-white border" style={{width:40,height:40}}>
                      <strong>{s.n}</strong>
                    </div>
                    <div>
                      <h6 className="mb-1">{s.t}</h6>
                      <p className="text-muted small mb-0">{s.d}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            <div className="col-lg-6">
              <img src="/assets/img/agent2.jpg" alt="How it works" className="img-fluid rounded-4 shadow-sm w-100" />
            </div>
          </div>
        </div>
      </section>

      {/* Form */}
      <section className="py-4 bg-light" id="signup-form">
        <div className="container">
          <div className="col-lg-8 mx-auto">
            <div className="card card-glass border-0 shadow-sm rounded-4">
              <div className="card-body p-4 p-md-5">

                {/* Header + Stepper */}
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h3 className="mb-0 fw-semibold">
                    {T.signup} <span className="text-primary">{T.agent}</span>
                  </h3>
                  <a href="/login" className="text-sm text-decoration-none">
                    {T.already_have_account} <strong>{T.sign_in}</strong>
                  </a>
                </div>

                <div className="d-flex align-items-center gap-3 mb-4">
                  <div className={`step-dot d-flex align-items-center justify-content-center ${step === 1 ? "active" : "done"}`}>1</div>
                  <div className="flex-fill" style={{height:2, background:"#e5e7eb"}} />
                  <div className={`step-dot d-flex align-items-center justify-content-center ${step === 2 ? "active" : ""}`}>2</div>
                </div>

                {formErrors.general && <div className="alert alert-danger">{formErrors.general}</div>}

                <form onSubmit={onSubmit} noValidate>
                  {step === 1 && (
                    <>
                      <div className="row g-3">
                        <div className="col-md-12">
                          <label htmlFor="name" className="form-label">* {T.name}</label>
                          <input
                            id="name"
                            name="name"
                            type="text"
                            className={`form-control form-control-lg ${touched.name && formErrors.name ? "is-invalid" : ""}`}
                            value={form.name}
                            onChange={onInput}
                            onBlur={() => markTouched("name")}
                            placeholder="Jane Doe"
                            autoComplete="name"
                          />
                          {touched.name && formErrors.name && <div className="invalid-feedback">{formErrors.name}</div>}
                        </div>

                        <div className="col-md-6">
                          <label htmlFor="phone_country_code" className="form-label">* {T.select_country}</label>
                          <Select
                            inputId="phone_country_code"
                            classNamePrefix="react-select"
                            options={countries}
                            value={form.phone_country_code}
                            onChange={onCountry}
                            styles={selectStyles}
                            components={{ Option: CustomOption, SingleValue: CustomSingleValue }}
                            getOptionValue={(o) => o.id}
                            placeholder={T.select_country}
                          />
                          {touched.phone_country_code && formErrors.phone_country_code && (
                            <div className="text-danger small mt-1">{formErrors.phone_country_code}</div>
                          )}
                        </div>

                        <div className="col-md-6">
                          <label htmlFor="phone" className="form-label">* {T.phone}</label>
                          <div className="input-group input-group-lg">
                            <span className="input-group-text">+{form.phone_country_code?.phonecode || "—"}</span>
                            <input
                              id="phone"
                              name="phone"
                              type="tel"
                              className={`form-control ${touched.phone && formErrors.phone ? "is-invalid" : ""}`}
                              value={form.phone}
                              onChange={onInput}
                              onBlur={() => markTouched("phone")}
                              placeholder="712345678"
                              inputMode="numeric"
                              autoComplete="tel"
                            />
                            {touched.phone && formErrors.phone && <div className="invalid-feedback">{formErrors.phone}</div>}
                          </div>
                        </div>

                        <div className="col-md-6">
                          <label htmlFor="email" className="form-label">* {T.email}</label>
                          <input
                            id="email"
                            name="email"
                            type="email"
                            className={`form-control form-control-lg ${touched.email && formErrors.email ? "is-invalid" : ""}`}
                            value={form.email}
                            onChange={onInput}
                            onBlur={() => markTouched("email")}
                            placeholder="you@company.com"
                            autoComplete="email"
                          />
                          {touched.email && formErrors.email && <div className="invalid-feedback">{formErrors.email}</div>}
                        </div>

                        <div className="col-md-6">
                          <label htmlFor="password" className="form-label">* {T.password}</label>
                          <div>
                            <input
                              id="password"
                              name="password"
                              type="password"
                              className={`form-control form-control-lg ${touched.password && formErrors.password ? "is-invalid" : ""}`}
                              value={form.password}
                              onChange={onInput}
                              onBlur={() => markTouched("password")}
                              placeholder="••••••••"
                              autoComplete="new-password"
                            />
                            <div className="mt-2 d-flex gap-1">
                              {[0,1,2,3].map((i) => (
                                <div key={i} style={{height:6, flex:1, borderRadius:4, background: i < strength(form.password) ? pwdBarColor : "#e5e7eb"}} />
                              ))}
                            </div>
                            {touched.password && formErrors.password && <div className="invalid-feedback d-block">{formErrors.password}</div>}
                          </div>
                        </div>

                        <div className="col-md-6">
                          <label htmlFor="confirm_password" className="form-label">* {T.confirm_password}</label>
                          <input
                            id="confirm_password"
                            name="confirm_password"
                            type="password"
                            className={`form-control form-control-lg ${touched.confirm_password && formErrors.confirm_password ? "is-invalid" : ""}`}
                            value={form.confirm_password}
                            onChange={onInput}
                            onBlur={() => markTouched("confirm_password")}
                            placeholder="••••••••"
                            autoComplete="new-password"
                          />
                          {touched.confirm_password && formErrors.confirm_password && (
                            <div className="invalid-feedback">{formErrors.confirm_password}</div>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 d-flex justify-content-end">
                        <button type="button" className="btn btn-primary btn-lg px-4" onClick={goNext}>
                          {T.continue}
                        </button>
                      </div>
                    </>
                  )}

                  {step === 2 && (
                    <>
                      <div className="row g-3">
                        <div className="col-md-6">
                          <label htmlFor="agency_name" className="form-label">* {T.agency_name}</label>
                          <input
                            id="agency_name"
                            name="agency_name"
                            type="text"
                            className={`form-control form-control-lg ${touched.agency_name && formErrors.agency_name ? "is-invalid" : ""}`}
                            value={form.agency_name}
                            onChange={onInput}
                            onBlur={() => markTouched("agency_name")}
                            placeholder="Awesome Travels Ltd."
                          />
                          {touched.agency_name && formErrors.agency_name && <div className="invalid-feedback">{formErrors.agency_name}</div>}
                        </div>

                        <div className="col-md-6">
                          <label htmlFor="agency_license" className="form-label">* {T.agency_license}</label>
                          <input
                            id="agency_license"
                            name="agency_license"
                            type="text"
                            className={`form-control form-control-lg ${touched.agency_license && formErrors.agency_license ? "is-invalid" : ""}`}
                            value={form.agency_license}
                            onChange={onInput}
                            onBlur={() => markTouched("agency_license")}
                            placeholder="IATA / Local License"
                          />
                          {touched.agency_license && formErrors.agency_license && <div className="invalid-feedback">{formErrors.agency_license}</div>}
                        </div>

                        <div className="col-md-6">
                          <label htmlFor="agency_city" className="form-label">* {T.agency_city}</label>
                          <input
                            id="agency_city"
                            name="agency_city"
                            type="text"
                            className={`form-control form-control-lg ${touched.agency_city && formErrors.agency_city ? "is-invalid" : ""}`}
                            value={form.agency_city}
                            onChange={onInput}
                            onBlur={() => markTouched("agency_city")}
                            placeholder="Nairobi"
                          />
                          {touched.agency_city && formErrors.agency_city && <div className="invalid-feedback">{formErrors.agency_city}</div>}
                        </div>

                        <div className="col-md-6">
                          <label htmlFor="agency_address" className="form-label">* {T.agency_address}</label>
                          <input
                            id="agency_address"
                            name="agency_address"
                            type="text"
                            className={`form-control form-control-lg ${touched.agency_address && formErrors.agency_address ? "is-invalid" : ""}`}
                            value={form.agency_address}
                            onChange={onInput}
                            onBlur={() => markTouched("agency_address")}
                            placeholder="123 Riverside Rd."
                          />
                          {touched.agency_address && formErrors.agency_address && <div className="invalid-feedback">{formErrors.agency_address}</div>}
                        </div>
                      </div>

                      {/* Terms + Captcha */}
                      <div className="form-check mt-4">
                        <input
                          id="terms"
                          className="form-check-input"
                          type="checkbox"
                          checked={isAgreed}
                          onChange={(e) => setIsAgreed(e.target.checked)}
                        />
                        <label htmlFor="terms" className="form-check-label ms-2">
                          {T.by_signup_i_agree_to_terms_and_policy}
                        </label>
                        {formErrors.terms && <div className="text-danger small mt-1">{formErrors.terms}</div>}
                      </div>

                      <div className="mt-3" id="hcaptcha-box">
                        <HCaptcha
                          sitekey={hcaptchaSiteKey}
                          onVerify={() => setIsCaptchaOk(true)}
                          onExpire={() => setIsCaptchaOk(false)}
                          onError={() => setIsCaptchaOk(false)}
                          ref={captchaRef}
                        />
                        {formErrors.recaptcha && <div className="text-danger small mt-1">{formErrors.recaptcha}</div>}
                      </div>

                      {/* Actions */}
                      <div className="mt-4 d-flex justify-content-between">
                        <button type="button" className="btn btn-light btn-lg" onClick={goBack}>
                          {T.back}
                        </button>
                        <button type="submit" className="btn btn-primary btn-lg px-4" disabled={isLoading}>
                          {isLoading ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                              {T.create_account}
                            </>
                          ) : (
                            T.create_account
                          )}
                        </button>
                      </div>
                    </>
                  )}

                  <input type="hidden" name="user_type" value="agent" />
                  <input type="hidden" name="form_token" value={formToken} />
                </form>
              </div>
            </div>

            <p className="text-center mt-3 text-muted">
              {T.already_have_account} <a href="/login">{T.sign_in}</a>
            </p>
          </div>
        </div>
      </section>
    </>
  );
};

export default Register;
