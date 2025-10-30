import React, { useContext, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../../context/AuthContext";
import TelegramLoginButton from "../../../components/client/Account/TelegramLoginButton";

/* ---------------- i18n ---------------- */
const T = {
  login: "Login",
  welcome: "Welcome back",
  tagline: "Sign in to manage your trips, bookings and invoices.",
  email: "Email",
  address: "Address",
  password: "Password",
  rememberme: "Remember me",
  reset: "Reset",
  forgot_password: "Forgot password?",
  signup: "Create account",
  cancel: "Cancel",
  or: "or",
  sign_in_with_telegram: "Sign in with Telegram",
};

const Login = ({
  loginUrl = "/login",
  signupUrl = "/signup",
  resetPasswordUrl = "/api/forget_password",
}) => {
  const { login, telegramLogin } = useContext(AuthContext);
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "", remember: false });
  const [isLoading, setIsLoading] = useState(false);

  // Reset modal state
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  // UI state
  const [error, setError] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [caps, setCaps] = useState(false);

  const canSubmit = useMemo(
    () => form.email.trim() !== "" && form.password.trim() !== "" && !isLoading,
    [form, isLoading]
  );

  const onChange = (e) => {
    const { name, type, checked, value } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const onPwdKey = (e) => {
    // Simple caps detection (not 100% but helpful)
    setCaps(e.getModifierState && e.getModifierState("CapsLock"));
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.email || !form.password) {
      setError("Please enter both email and password.");
      return;
    }

    setIsLoading(true);
    try {
      const user = await login({ email: form.email, password: form.password, remember: form.remember });
      if (user?.role === "admin") navigate("/admin");
      else navigate("/dashboard");
    } catch (err) {
      setError(err?.message || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!resetEmail) {
      setError("Please enter an email address to reset your password.");
      return;
    }
    // Wire your API here when ready. Keeping UX + loaders.
    setIsResetLoading(true);
    try {
      // Example:
      // await API.get('/sanctum/csrf-cookie');
      // const res = await API.post(resetPasswordUrl, { email: resetEmail });
      // handle responses...
      // For now, just simulate:
      setTimeout(() => {
        setIsResetLoading(false);
        setResetEmail("");
        const modalEl = document.getElementById("reset");
        if (modalEl) modalEl.querySelector(".btn-close")?.click();
        alert("If this email exists, a reset link will be sent shortly.");
      }, 1200);
    } catch (err) {
      setIsResetLoading(false);
      setError(err?.response?.data?.message || "Password reset failed.");
    }
  };

  const handleTelegramAuth = async (tgUser) => {
    try {
      const user = await telegramLogin(tgUser);
      if (user?.role === "admin") navigate("/admin");
      else navigate("/dashboard");
    } catch (err) {
      setError(err?.message || "Telegram login failed");
    }
  };

  return (
    <>
      {/* Brand tokens */}
      <style>{`
        :root{
          --brand:#F68221;
          --brand-600:#F5740A;
          --brand-700:#E96806;
          --brand-50:#FFF7EE;
          --brand-100:#FFEAD9;
          --ink:#1f2937;
        }
        .auth-bg{
          background:
            radial-gradient(1200px 400px at 90% -20%, rgba(246,130,33,.15), transparent 60%),
            radial-gradient(1000px 300px at -10% 0%, rgba(246,130,33,.08), transparent 60%),
            linear-gradient(180deg, #ffffff 0%, #fafafa 100%);
          min-height:100vh;
        }
        .glass-card{
          backdrop-filter: saturate(140%) blur(8px);
          background:rgba(255,255,255,.92);
          border:1px solid rgba(246,130,33,.15);
          box-shadow:0 10px 30px rgba(0,0,0,.06);
        }
        .brand-btn{
          background:var(--brand);
          border-color:var(--brand);
        }
        .brand-btn:hover{ background:var(--brand-600); border-color:var(--brand-600); }
        .brand-outline{
          border-color:var(--brand);
          color:var(--brand-700);
        }
        .brand-outline:hover{
          background:var(--brand-50);
          border-color:var(--brand-600);
          color:var(--brand-700);
        }
        .brand-chip{
          background:var(--brand-50);
          color:#7a3a0b;
          border:1px solid rgba(246,130,33,.25);
        }
        .field-focus:focus{
          border-color: var(--brand);
          box-shadow:0 0 0 .2rem rgba(246,130,33,.15) !important;
        }
        .link-brand{
          color:var(--brand-700);
          text-decoration:none;
        }
        .link-brand:hover{ color:var(--brand-600); text-decoration:underline; }
        .caps-hint{
          font-size:12px;
          color:#9a3412;
          background:#fff7ed;
          border:1px dashed rgba(246,130,33,.35);
          border-radius:8px;
          padding:6px 8px;
          margin-top:6px;
        }
      `}</style>

      <div className="auth-bg d-flex align-items-center">
        <div className="container py-5">
          <div className="row g-4 align-items-center">
            {/* Left: Brand / Pitch */}
            <div className="col-lg-6 d-none d-lg-block">
              <div className="p-4">
                <span className="badge brand-chip rounded-pill mb-3">Fly Gasal</span>
                <h1 className="fw-bold" style={{ color: "var(--ink)" }}>
                  {T.welcome}
                </h1>
                <p className="text-muted mb-4">{T.tagline}</p>

                <div className="d-flex align-items-center gap-3">
                  <div className="p-3 rounded-4 glass-card">
                    <div className="d-flex align-items-center gap-3">
                      <div
                        className="rounded-3"
                        style={{
                          width: 44,
                          height: 44,
                          background: "var(--brand-50)",
                          display: "grid",
                          placeItems: "center",
                          border: "1px solid rgba(246,130,33,.2)",
                        }}
                      >
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F68221" strokeWidth="2">
                          <path d="M3 6h18M3 12h18M3 18h18" />
                        </svg>
                      </div>
                      <div>
                        <div className="fw-semibold">Unified dashboard</div>
                        <div className="text-muted small">Manage flights, hotels, clients and invoices in one place.</div>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-4 glass-card">
                    <div className="d-flex align-items-center gap-3">
                      <div
                        className="rounded-3"
                        style={{
                          width: 44,
                          height: 44,
                          background: "var(--brand-50)",
                          display: "grid",
                          placeItems: "center",
                          border: "1px solid rgba(246,130,33,.2)",
                        }}
                      >
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F68221" strokeWidth="2">
                          <circle cx="12" cy="12" r="9" />
                          <path d="M12 7v5l3 3" />
                        </svg>
                      </div>
                      <div>
                        <div className="fw-semibold">Real-time pricing</div>
                        <div className="text-muted small">Live fares with availability and flexible filters.</div>
                      </div>
                    </div>
                  </div>
                </div>

                <img
                  src="/assets/img/login.jpg"
                  alt="Travel"
                  className="mt-4 img-fluid rounded-4 shadow-sm"
                />
              </div>
            </div>

            {/* Right: Form */}
            <div className="col-lg-6">
              <div className="glass-card rounded-4 p-4 p-md-5">
                {error && (
                  <div className="alert alert-danger d-flex align-items-center" role="alert">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" className="me-2">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 8v5M12 16h.01" />
                    </svg>
                    <div>{error}</div>
                  </div>
                )}

                <div className="mb-4">
                  <h3 className="fw-bold mb-1">{T.login}</h3>
                  <div className="text-muted">Use your email and password to continue.</div>
                </div>

                <form onSubmit={handleLoginSubmit} noValidate>
                  {/* Email */}
                  <div className="mb-3">
                    <label htmlFor="email" className="form-label fw-semibold">
                      {T.email} {T.address}
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      className="form-control form-control-lg field-focus"
                      placeholder="you@company.com"
                      value={form.email}
                      onChange={onChange}
                      autoComplete="email"
                      required
                    />
                  </div>

                  {/* Password */}
                  <div className="mb-2">
                    <label htmlFor="password" className="form-label fw-semibold">
                      {T.password}
                    </label>
                    <div className="input-group input-group-lg">
                      <input
                        id="password"
                        name="password"
                        type={showPwd ? "text" : "password"}
                        className="form-control field-focus"
                        placeholder="••••••••"
                        value={form.password}
                        onChange={onChange}
                        onKeyUp={onPwdKey}
                        autoComplete="current-password"
                        required
                      />
                      {/* <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => setShowPwd((s) => !s)}
                        aria-label={showPwd ? "Hide password" : "Show password"}
                        title={showPwd ? "Hide password" : "Show password"}
                      >
                        {showPwd ? "Hide" : "Show"}
                      </button> */}
                    </div>
                    {caps && <div className="caps-hint">Caps Lock appears to be ON.</div>}
                  </div>

                  {/* Row: remember + forgot */}
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div className="form-check">
                      <input
                        id="remember"
                        name="remember"
                        type="checkbox"
                        className="form-check-input"
                        checked={form.remember}
                        onChange={onChange}
                      />
                      <label htmlFor="remember" className="form-check-label ms-1">
                        {T.rememberme}
                      </label>
                    </div>

                    <button
                      type="button"
                      className="btn btn-link link-brand p-0"
                      data-bs-toggle="modal"
                      data-bs-target="#reset"
                    >
                      {T.forgot_password}
                    </button>
                  </div>

                  {/* Submit */}
                  <div className="d-grid">
                    <button
                      type="submit"
                      className="btn btn-lg brand-btn text-white fw-semibold"
                      disabled={!canSubmit}
                      style={{ height: 48 }}
                    >
                      {isLoading ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                            aria-hidden="true"
                          ></span>
                          {T.login}
                        </>
                      ) : (
                        T.login
                      )}
                    </button>
                  </div>

                  {/* Divider */}
                  <div className="position-relative text-center my-4">
                    <hr />
                    <span
                      className="position-absolute top-50 start-50 translate-middle px-3 text-muted bg-white"
                      style={{ fontSize: 12 }}
                    >
                      {T.or}
                    </span>
                  </div>

                  {/* Telegram */}
                  <div className="p-3 bg-light rounded-3 border">
                    <div className="text-center fw-semibold mb-2">{T.sign_in_with_telegram}</div>
                    <div className="d-flex justify-content-center">
                      <TelegramLoginButton botUsername="FlygasalOfiicial_bot" onAuth={handleTelegramAuth} />
                    </div>
                  </div>

                  {/* Signup link */}
                  <p className="text-center text-muted mt-4 mb-0">
                    Don’t have an account?{" "}
                    <a href={signupUrl} className="link-brand fw-semibold">
                      {T.signup}
                    </a>
                  </p>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Reset Modal */}
        <div className="modal fade" id="reset" tabIndex="-1" aria-labelledby="resetLabel" aria-hidden="true">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header" style={{ background: "var(--brand-50)" }}>
                <h5 className="modal-title" id="resetLabel">
                  {T.reset} {T.password}
                </h5>
                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>

              <form onSubmit={handleResetSubmit} noValidate>
                <div className="modal-body">
                  <label htmlFor="reset_mail" className="form-label fw-semibold">
                    {T.email} {T.address}
                  </label>
                  <input
                    id="reset_mail"
                    type="email"
                    className="form-control form-control-lg field-focus"
                    placeholder="you@company.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-light"
                    data-bs-dismiss="modal"
                  >
                    {T.cancel}
                  </button>
                  <button
                    type="submit"
                    className="btn brand-btn text-white"
                    disabled={isResetLoading || !resetEmail}
                  >
                    {isResetLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                        {T.reset} {T.password}
                      </>
                    ) : (
                      <>
                        {T.reset} {T.password}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
