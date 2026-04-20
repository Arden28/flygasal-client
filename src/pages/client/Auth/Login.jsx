import React, { useState, useEffect, useRef, useMemo, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../../context/AuthContext"; 
import { Eye, EyeOff, Lock, Mail, CheckCircle, X, Globe, Zap, Headset, Star } from "lucide-react";

/* ---------------- Component: Telegram Button ---------------- */
const TelegramLoginButton = ({ botUsername, onAuth }) => {
  const ref = useRef(null);
  useEffect(() => {
    window.onTelegramAuthLogin = (user) => onAuth(user);
    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.setAttribute("data-telegram-login", botUsername);
    script.setAttribute("data-size", "large");
    script.setAttribute("data-radius", "8");
    script.setAttribute("data-request-access", "write");
    script.setAttribute("data-userpic", "false");
    script.setAttribute("data-onauth", "onTelegramAuthLogin(user)");
    script.async = true;
    if (ref.current) {
      ref.current.innerHTML = "";
      ref.current.appendChild(script);
    }
    return () => { delete window.onTelegramAuthLogin; };
  }, [botUsername, onAuth]);
  return <div ref={ref} className="d-flex justify-content-center" />;
};

/* ---------------- Helper: Input Error ---------------- */
const InputError = ({ msg }) => {
  if (!msg) return null;
  const message = Array.isArray(msg) ? msg[0] : msg;
  return <p className="text-danger mt-1 mb-0" style={{ fontSize: '0.8rem', fontWeight: 500, color: '#DC2626' }}>{message}</p>;
};

/* ---------------- Constants ---------------- */
const T = {
  login: "Sign In",
  welcome: "Welcome Back",
  tagline: "Manage your bookings, invoices, and clients in one place.",
  email: "Email Address",
  password: "Password",
  rememberme: "Remember me",
  forgot_password: "Forgot password?",
  reset_title: "Reset Password",
  reset_desc: "Enter your email to receive a reset link.",
  send_link: "Send Reset Link",
  back_to_login: "Back to login",
  signup_text: "Don't have an account?",
  signup_link: "Create an account",
  or: "OR",
  side_title: "The Ultimate Tool for Modern Agents",
  side_sub: "Join 10,000+ agencies using Fly Gasal to power their global operations.",
  feat1_title: "Global Inventory",
  feat1_desc: "Direct API access to 500+ airlines & 1M+ properties.",
  feat2_title: "Instant Ticketing",
  feat2_desc: "Auto-issuance within seconds, 24/7 reliability.",
  feat3_title: "Premium Support",
  feat3_desc: "Dedicated account managers for your agency.",
};

const BACKGROUND_IMAGES = [
  "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2021&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=2070&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=2073&auto=format&fit=crop",
];

/* ---------------- Main Component ---------------- */
const Login = ({ 
  loginUrl = "/login", 
  signupUrl = "/signup",
  resetPasswordUrl = "/api/forget_password" 
}) => {
  const { login, telegramLogin } = useContext(AuthContext);
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "", remember: false });
  const [isLoading, setIsLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({}); // New state for field validation
  const [caps, setCaps] = useState(false); 

  const [currentBg, setCurrentBg] = useState(0);

  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const canSubmit = useMemo(() => form.email.trim() !== "" && form.password.trim() !== "" && !isLoading, [form, isLoading]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBg((prev) => (prev + 1) % BACKGROUND_IMAGES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    // Clear errors when the user starts typing again
    if (error) setError("");
    if (fieldErrors[name]) setFieldErrors(prev => ({ ...prev, [name]: null }));
  };

  const onPwdKey = (e) => {
    setCaps(e.getModifierState && e.getModifierState("CapsLock"));
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    // Frontend quick validation
    let newErrors = {};
    if (!form.email) newErrors.email = "Please enter your email address.";
    if (!form.password) newErrors.password = "Please enter your password.";

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      const user = await login({ email: form.email, password: form.password, remember: form.remember });
      if (user?.role === "admin") navigate("/admin");
      else navigate("/dashboard");
    
    } catch (err) {
      // Check for Laravel validation errors
      if (err.response?.status === 422) {
         setFieldErrors(err.response.data.errors || {});
      } else {
         setError(err?.message || "Invalid email or password. Please try again.");
      }
    } finally {
      setIsLoading(false);
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

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!resetEmail) return;
    
    setIsResetLoading(true);
    try {
      setTimeout(() => {
        setIsResetLoading(false);
        setResetSuccess(true);
      }, 1200);
    } catch (err) {
      setIsResetLoading(false);
    }
  };

  return (
    <>
      <style>{`
        :root {
          --brand-primary: #F68221;
          --brand-hover: #e06d0e;
          --text-main: #111827;
          --text-sub: #6B7280;
          --border-color: #E5E7EB;
        }
        .modern-input {
          height: 52px;
          border-radius: 0.75rem;
          border: 1px solid var(--border-color);
          padding: 0.75rem 1rem 0.75rem 2.8rem;
          font-size: 0.95rem;
          width: 100%;
          background-color: #F9FAFB;
          transition: all 0.2s ease;
        }
        .modern-input:focus {
          background-color: #fff;
          border-color: var(--brand-primary);
          box-shadow: 0 0 0 4px rgba(246, 130, 33, 0.1);
          outline: none;
        }
        /* Error Styling */
        .modern-input.is-invalid {
          border-color: #DC2626;
          background-color: #FEF2F2;
        }
        .modern-input.is-invalid:focus {
          box-shadow: 0 0 0 4px rgba(220, 38, 38, 0.15);
        }
        .input-icon {
          position: absolute; left: 1rem; top: 50%;
          transform: translateY(-50%); color: #9CA3AF; pointer-events: none;
        }
        .btn-brand {
          background-color: var(--brand-primary);
          color: white; border: none; height: 52px;
          font-weight: 600; font-size: 1rem;
          border-radius: 0.75rem;
          transition: all 0.2s ease;
          width: 100%; display: flex; align-items: center; justify-content: center;
        }
        .btn-brand:hover {
          background-color: var(--brand-hover);
          transform: translateY(-1px);
          box-shadow: 0 8px 15px -3px rgba(246, 130, 33, 0.25);
        }
        .btn-brand:disabled { opacity: 0.7; transform: none; cursor: not-allowed; }
        .split-layout { min-height: 100vh; display: flex; flex-wrap: wrap; font-family: 'Inter', sans-serif; overflow: hidden; }
        .split-left { 
          flex: 1 1 480px; background: white; padding: 2rem; 
          display: flex; flex-direction: column; justify-content: center; position: relative; z-index: 10;
        }
        .split-right { 
          flex: 1 1 500px; position: relative; overflow: hidden; min-height: 500px;
          background: #0f172a; display: flex; align-items: center; justify-content: center;
        }
        .bg-slide {
          position: absolute; inset: 0; width: 100%; height: 100%;
          background-size: cover; background-position: center;
          opacity: 0; transform: scale(1.1);
          transition: opacity 1s ease-in-out, transform 6s ease-out;
        }
        .bg-slide.active { opacity: 1; transform: scale(1); }
        .bg-overlay-pro {
          position: absolute; inset: 0; z-index: 1;
          background: linear-gradient(to top right, rgba(15, 23, 42, 0.9) 0%, rgba(15, 23, 42, 0.6) 50%, rgba(246, 130, 33, 0.15) 100%);
        }
        .right-content-wrapper { position: relative; z-index: 5; width: 100%; max-width: 520px; padding: 2rem; }
        .glass-panel {
          background: rgba(255, 255, 255, 0.07); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 24px; padding: 3rem 2.5rem;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }
        .feature-item { display: flex; align-items: flex-start; margin-bottom: 2rem; }
        .feature-item:last-child { margin-bottom: 0; }
        .feature-icon-wrapper {
          background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05));
          width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center;
          margin-right: 1.25rem; flex-shrink: 0; border: 1px solid rgba(255,255,255,0.1); color: #F68221;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
        }
        .floating-card {
          position: absolute; top: -30px; right: -20px; background: white; padding: 0.75rem 1rem;
          border-radius: 12px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.2);
          display: flex; align-items: center; gap: 0.75rem; animation: float 4s ease-in-out infinite; z-index: 10;
        }
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
        .link-brand { color: var(--brand-primary); text-decoration: none; font-weight: 600; }
        .link-brand:hover { text-decoration: underline; }
        .divider { display: flex; align-items: center; margin: 1.5rem 0; color: #9CA3AF; font-size: 0.8rem; font-weight: 500; }
        .divider::before, .divider::after { content: ''; flex: 1; height: 1px; background: #E5E7EB; }
        .divider span { padding: 0 1rem; }
        .modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 50; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px);
        }
        .modal-card {
          background: white; width: 90%; max-width: 400px; padding: 2rem; border-radius: 1rem;
          box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); position: relative; animation: slideUp 0.3s ease-out;
        }
        .caps-hint{
          font-size:12px; color:#9a3412; background:#fff7ed; border:1px dashed rgba(246,130,33,.35);
          border-radius:8px; padding:6px 8px; margin-top:6px;
        }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @media (max-width: 991px) { .split-right { display: none; } }
      `}</style>

      <div className="split-layout">
        
        {/* LEFT PANEL: LOGIN */}
        <div className="split-left">
          <div className="w-100 mx-auto" style={{ maxWidth: 420 }}>
            <div className="mb-5">
              <h1 className="h2 fw-bold mb-2" style={{ color: "var(--text-main)" }}>{T.welcome}</h1>
              <p className="text-muted">{T.tagline}</p>
            </div>

            {error && (
              <div className="alert alert-danger border-0 d-flex align-items-center mb-4 small" style={{background: "#FEF2F2", color: "#991B1B", padding: "0.75rem", borderRadius: "0.5rem"}}>
                <X size={18} className="me-2" />
                {error}
              </div>
            )}

            <form onSubmit={handleLoginSubmit} noValidate>
              <div className="mb-4 position-relative">
                <label className="form-label fw-bold text-dark small mb-1.5" style={{fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px'}}>{T.email}</label>
                <div className="position-relative">
                  <Mail size={18} className={`input-icon ${fieldErrors.email ? 'text-danger' : ''}`} />
                  <input
                    type="email"
                    name="email"
                    className={`modern-input ${fieldErrors.email ? 'is-invalid' : ''}`}
                    placeholder="agent@flygasal.com"
                    value={form.email}
                    onChange={onChange}
                    required
                  />
                </div>
                {/* Field-level error */}
                <InputError msg={fieldErrors.email} />
              </div>

              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-1.5">
                  <label className="form-label fw-bold text-dark small mb-0" style={{fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px'}}>{T.password}</label>
                  <button type="button" onClick={() => setShowReset(true)} className="btn btn-link p-0 text-decoration-none small text-muted hover-brand" style={{ fontSize: '0.85rem' }}>
                    {T.forgot_password}
                  </button>
                </div>
                <div className="position-relative">
                  <Lock size={18} className={`input-icon ${fieldErrors.password ? 'text-danger' : ''}`} />
                  <input
                    type={showPwd ? "text" : "password"}
                    name="password"
                    className={`modern-input ${fieldErrors.password ? 'is-invalid' : ''}`}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={onChange}
                    onKeyUp={onPwdKey}
                    style={{ paddingRight: "2.8rem" }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="position-absolute border-0 bg-transparent text-muted"
                    style={{ right: "1rem", top: "50%", transform: "translateY(-50%)", cursor: 'pointer' }}
                  >
                    {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {/* Field-level error */}
                <InputError msg={fieldErrors.password} />
                
                {caps && <div className="caps-hint mt-2">Caps Lock appears to be ON.</div>}
              </div>

              <div className="mb-4">
                <div className="d-flex align-items-center">
                  <input
                    id="remember"
                    name="remember"
                    type="checkbox"
                    checked={form.remember}
                    onChange={onChange}
                    style={{ accentColor: "#F68221", width: 18, height: 18, borderRadius: 4 }}
                  />
                  <label htmlFor="remember" className="ms-2 small text-muted cursor-pointer select-none">
                    {T.rememberme}
                  </label>
                </div>
              </div>

              <button type="submit" disabled={!canSubmit || isLoading} className="btn-brand mb-4">
                {isLoading ? <div className="spinner-border spinner-border-sm text-white" role="status" /> : T.login}
              </button>

              <div className="divider"><span>{T.or}</span></div>

              <div className="mb-4">
                <TelegramLoginButton botUsername="Flygasal_bot" onAuth={handleTelegramAuth} />
              </div>

              <p className="text-center text-muted small mt-4">
                {T.signup_text} <a href={signupUrl} className="link-brand">{T.signup_link}</a>
              </p>
            </form>
          </div>
          
          <div className="mt-auto text-center text-muted small pt-4" style={{opacity: 0.6}}>
             &copy; {new Date().getFullYear()} Fly Gasal System
          </div>
        </div>

        {/* RIGHT PANEL: PRO DESIGN (Omitted to keep it brief, unchanged from your code!) */}
        <div className="split-right">
          {BACKGROUND_IMAGES.map((img, index) => (
            <div key={index} className={`bg-slide ${index === currentBg ? 'active' : ''}`} style={{ backgroundImage: `url(${img})` }} />
          ))}
          <div className="bg-overlay-pro"></div>
          <div className="right-content-wrapper">
            <div className="glass-panel">
              <div className="floating-card">
                 <div className="bg-success rounded-circle d-flex align-items-center justify-content-center" style={{width: 24, height: 24}}>
                    <CheckCircle size={14} className="text-white" />
                 </div>
                 <div>
                    <div className="fw-bold text-dark" style={{fontSize: '0.75rem', lineHeight: 1}}>Flight Confirmed</div>
                    <div className="text-muted" style={{fontSize: '0.65rem'}}>JED to LHR • Just now</div>
                 </div>
              </div>
              <div className="mb-5 position-relative">
                <h2 className="display-6 fw-bold text-white mb-3" style={{ letterSpacing: '-0.5px' }}>{T.side_title}</h2>
                <p className="text-white-50" style={{ fontSize: '1.05rem', lineHeight: 1.6 }}>{T.side_sub}</p>
              </div>
              <div className="d-flex flex-column">
                <div className="feature-item">
                  <div className="feature-icon-wrapper"><Globe size={22} strokeWidth={2} /></div>
                  <div>
                    <h5 className="fw-bold text-white mb-1" style={{fontSize: '1rem'}}>{T.feat1_title}</h5>
                    <div className="text-white-50 small" style={{lineHeight: 1.5}}>{T.feat1_desc}</div>
                  </div>
                </div>
                <div className="feature-item">
                  <div className="feature-icon-wrapper"><Zap size={22} strokeWidth={2} /></div>
                  <div>
                    <h5 className="fw-bold text-white mb-1" style={{fontSize: '1rem'}}>{T.feat2_title}</h5>
                    <div className="text-white-50 small" style={{lineHeight: 1.5}}>{T.feat2_desc}</div>
                  </div>
                </div>
                <div className="feature-item">
                  <div className="feature-icon-wrapper"><Headset size={22} strokeWidth={2} /></div>
                  <div>
                    <h5 className="fw-bold text-white mb-1" style={{fontSize: '1rem'}}>{T.feat3_title}</h5>
                    <div className="text-white-50 small" style={{lineHeight: 1.5}}>{T.feat3_desc}</div>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-top border-white border-opacity-10 d-flex align-items-center gap-2">
                 <div className="d-flex text-warning">
                    <Star size={16} fill="currentColor" />
                    <Star size={16} fill="currentColor" />
                    <Star size={16} fill="currentColor" />
                    <Star size={16} fill="currentColor" />
                    <Star size={16} fill="currentColor" />
                 </div>
                 <span className="text-white-50 small fw-medium">Trusted by 500+ Agencies</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal (Unchanged) */}
      {showReset && (
        <div className="modal-overlay" onClick={() => setShowReset(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowReset(false)} className="position-absolute top-0 end-0 m-3 btn btn-sm text-muted">
              <X size={20} />
            </button>
            {!resetSuccess ? (
              <>
                <h4 className="fw-bold mb-2">{T.reset_title}</h4>
                <p className="text-muted small mb-4">{T.reset_desc}</p>
                <form onSubmit={handleResetSubmit}>
                  <div className="mb-4">
                    <label className="form-label fw-medium small">{T.email}</label>
                    <input 
                      type="email" className="modern-input" 
                      value={resetEmail} onChange={e => setResetEmail(e.target.value)} 
                      placeholder="you@agency.com" autoFocus
                    />
                  </div>
                  <button type="submit" disabled={isResetLoading || !resetEmail} className="btn-brand">
                    {isResetLoading ? <span className="spinner-border spinner-border-sm" /> : T.send_link}
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center py-3">
                <div className="mb-3 text-success"><CheckCircle size={48} /></div>
                <h4 className="fw-bold mb-2">Check your email</h4>
                <p className="text-muted small mb-4">We've sent a password reset link to <strong>{resetEmail}</strong>.</p>
                <button onClick={() => setShowReset(false)} className="btn btn-light w-100 fw-medium">{T.back_to_login}</button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Login;