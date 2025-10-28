import React, { useContext, useState } from 'react';
// import API from '../../api/auth'; // Import the Axios instance
import { AuthContext } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import TelegramLoginButton from "react-telegram-login";

// Mock translation object to replace PHP T::
const T = {
  login: 'Login',
  email: 'Email',
  address: 'Address',
  password: 'Password',
  rememberme: 'Remember Me',
  reset: 'Reset',
  signup: 'Sign Up',
  cancel: 'Cancel',
};

const Login = ({
  loginUrl = '/login',
  signupUrl = '/signup',
  resetPasswordUrl = '/api/forget_password',
}) => {
  
  const { login, telegramLogin } = useContext(AuthContext);
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', remember: false });
  const [isLoading, setIsLoading] = useState(false);

  const [isResetLoading, setIsResetLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };


    const handleLoginSubmit = async (e) => {
      e.preventDefault();
      setError('');
      if (!form.email || !form.password) {
        setError('Please enter both email and password');
        return;
      }
      setIsLoading(true);
        try {
          const userResponse = await login({ email: form.email, password: form.password });
          // Redirect based on role
          if (userResponse.role === 'admin') {
            navigate('/admin');
          } else {
            navigate('/dashboard');
          }
        } catch (err) {
            setError(err.message || 'Login failed');
        } finally {
        setIsLoading(false);
      }
      
    };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (!resetEmail) {
      setError('Please enter an email address to reset your password');
      return;
    }
    setIsResetLoading(true);
    setError('');
    // try {
    //   await API.get('/sanctum/csrf-cookie');
    //   const res = await API.post(resetPasswordUrl, { email: resetEmail });
    //   if (res.data.status === true) {
    //     alert('Your password has been reset, please check your mailbox');
    //     document.getElementById('reset').querySelector('.btn-close').click();
    //   } else if (res.data.status === false) {
    //     setError('Invalid or no account found with this email');
    //   } else if (res.data.message === 'not_activated') {
    //     setError('Your account is not activated, please contact us for activation');
    //   }
    // } catch (error) {
    //   setError(error.response?.data?.message || 'An error occurred during password reset');
    // } finally {
    //   setIsResetLoading(false);
    //   setResetEmail('');
    // }
  };

  const handleTelegramAuth = async (user) => {
    try {
      // Telegram gives: {id, first_name, username, auth_date, hash, ...}
      const userResponse = await telegramLogin(user); // uses your AuthContext method
      navigate(userResponse.role === "admin" ? "/admin" : "/dashboard");
    } catch (err) {
      setError(err.message || "Telegram login failed");
    }
  };


  return (
    <div className="mt-5">
      {error && <div className="alert alert-danger col-md-5 mx-auto">{error}</div>}
      <form id="login" onSubmit={handleLoginSubmit} className="mb-5">
        <div className="container">
          <div className="card mt-5 col-md-5 mx-auto rounded-4">
            <div className="p-3 p-md-4">
              <h3 className="font-bold text-2xl">{T.login}</h3>
              <div className="form-floating mb-3">
                <input
                  name="email"
                  type="email"
                  onChange={handleChange}
                  value={form.email}
                  className="form-control"
                  id="email"
                  placeholder="name@example.com"
                  required
                />
                <label htmlFor="email">{`${T.email} ${T.address}`}</label>
              </div>
              <div className="form-floating mb-3">
                <input
                  name="password"
                  type="password"
                  onChange={handleChange}
                  value={form.password}
                  className="form-control"
                  id="password"
                  placeholder="******"
                  required
                />
                <label htmlFor="password">{T.password}</label>
              </div>
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div className="d-flex align-items-center gap-3">
                  <input
                    name="remember"
                    className="form-check-input m-0"
                    type="checkbox"
                    id="rememberchb"
                    checked={form.remember}
                    onChange={handleChange}
                  />
                  <label htmlFor="rememberchb">{T.rememberme}</label>
                </div>
                <div>
                  <label
                    style={{ cursor: 'pointer' }}
                    data-bs-toggle="modal"
                    data-bs-target="#reset"
                  >
                    {`${T.reset} ${T.password}`}
                  </label>
                </div>
              </div>
              <div className="pt-0 pb-2">
                <div className="login_button" style={{ display: isLoading ? 'none' : 'block' }}>
                  <button
                    style={{ height: '44px' }}
                    type="submit"
                    className="btn btn-primary w-100 font-bold"
                    disabled={isLoading}
                  >
                    {T.login}
                  </button>
                </div>
                <div className="loading_button" style={{ display: isLoading ? 'block' : 'none' }}>
                  <button
                    style={{ height: '44px' }}
                    className="gap-2 w-100 btn btn-primary rounded-sm font-bold uppercase"
                    type="button"
                    disabled
                  >
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  </button>
                </div>
                <div className="mt-3 row">
                  <div className="col-md-12">
                    <a
                      href={signupUrl}
                      className="d-flex align-items-center justify-content-center btn btn-outline-primary"
                      style={{ height: '44px' }}
                    >
                      {T.signup}
                    </a>
                  </div>
                </div>
                <div className="mt-3 row text-center">
                  <hr />
                  <div className="bg-light p-3 rounded-3 border">
                    <TelegramLoginButton
                      botName="FlygasalOfiicial_bot"         // your bot username, no @
                      dataOnauth={handleTelegramAuth} // callback function
                      buttonSize="large"              // optional: 'large' | 'medium' | 'small'
                      requestAccess="write"           // optional
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
      <div className="modal fade" id="reset" tabIndex="-1" aria-labelledby="modal" aria-modal="true" role="dialog">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header bg-light">
              <h5 className="modal-title" id="modal">{`${T.reset} ${T.password}`}</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <form onSubmit={handleResetSubmit}>
              <div className="modal-body">
                <div className="input-group">
                  <div className="form-floating mb-3">
                    <input
                      type="email"
                      className="form-control"
                      id="reset_mail"
                      placeholder="name@example.com"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                    />
                    <label htmlFor="reset_mail">{`${T.email} ${T.address}`}</label>
                  </div>
                </div>
              </div>
              <div className="modal-footer bg-light">
                <button
                  style={{ height: '44px' }}
                  type="button"
                  className="btn btn-outline-primary btn-sm"
                  data-bs-dismiss="modal"
                >
                  {T.cancel}
                </button>
                <button
                  type="submit"
                  className="submit_buttons btn btn-primary btn-sm w-100"
                  style={{ height: '44px', display: isResetLoading ? 'none' : 'block' }}
                >
                  {`${T.reset} ${T.email}`}
                </button>
                <button
                  style={{ height: '44px' }}
                  className="gap-2 btn btn-primary btn-sm w-100 rounded-sm"
                  type="button"
                  disabled
                  style={{ display: isResetLoading ? 'block' : 'none' }}
                >
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;