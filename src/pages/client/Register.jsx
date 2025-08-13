import React, { useState, useContext } from 'react';
import Select from 'react-select';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

// Mock translation object
const T = {
  signup: 'Sign Up',
  name: 'Full Name',
  select: 'Select',
  country: 'Country',
  phone: 'Phone Number',
  email: 'Email',
  address: 'Address',
  password: 'Password',
  by_signup_i_agree_to_terms_and_policy: 'By signing up, I agree to the Terms and Policy',
  agent: 'Agent',
  agency_name: 'Agency Name',
  agency_license: 'Agency License',
  agency_city: 'Agency City',
  agency_address: 'Agency Address',
};

// Mock country data
const countries = [
  { id: '1', iso: 'us', nicename: 'United States', phonecode: '1' },
  { id: '2', iso: 'uk', nicename: 'United Kingdom', phonecode: '44' },
  { id: '3', iso: 'ca', nicename: 'Canada', phonecode: '1' },
  { id: '4', iso: 'in', nicename: 'India', phonecode: '91' },
  { id: '5', iso: 'au', nicename: 'Australia', phonecode: '61' },
];

const Register = ({
  formToken = 'static_form_token',
  hcaptchaSiteKey = '10000000-ffff-ffff-ffff-000000000001', // Replace with your actual hCaptcha site key
}) => {
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isAgreed, setIsAgreed] = useState(false);
  const [isRecaptchaVerified, setIsRecaptchaVerified] = useState(false);
  const initialFormState = {
    name: '',
    phone_country_code: null,
    phone: '',
    email: '',
    password: '',
    agency_name: '',
    agency_license: '',
    agency_city: '',
    agency_address: '',
    agency_logo: null,
    user_type: 'agent',
    form_token: formToken,
  };
  const [formState, setFormState] = useState(initialFormState);
  const [formErrors, setFormErrors] = useState({});

  // Custom styles for react-select
  const selectStyles = {
    control: (provided) => ({
      ...provided,
      borderRadius: '0.5rem',
      padding: '0.5rem',
      paddingLeft: '0.8rem',
      border: formErrors.phone_country_code ? '1px solid #dc3545' : '1px solid #e5e7eb',
      boxShadow: 'none',
      '&:hover': {
        borderColor: formErrors.phone_country_code ? '#dc3545' : '#3b82f6',
      },
    }),
    container: (provided) => ({
      ...provided,
      zIndex: 200,
    }),
    menu: (provided) => ({
      ...provided,
      borderRadius: '0.5rem',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      marginTop: '0.25rem',
    }),
    option: (provided) => ({
      ...provided,
      backgroundColor: 'transparent',
      '&:hover': {
        backgroundColor: '#f3f4f6',
      },
    }),
  };

  // Custom Option Component for react-select
  const CustomOption = ({ innerProps, label, data }) => (
    <div
      {...innerProps}
      className="flex items-center p-3 hover:bg-gray-100 cursor-pointer transition-colors duration-200"
    >
      <img
        src={`/assets/img/flags/${data.iso.toLowerCase()}.svg`}
        alt={`${data.nicename} flag`}
        className="w-[20px] mr-3"
      />
      <span>{`${data.nicename} (+${data.phonecode})`}</span>
    </div>
  );

  // Custom SingleValue Component for react-select
  const CustomSingleValue = ({ innerProps, data }) => (
    <div {...innerProps} className="flex items-center">
      <img
        src={`/assets/img/flags/${data.iso.toLowerCase()}.svg`}
        alt={`${data.nicename} flag`}
        className="w-[20px] mr-3"
      />
      <span>{`${data.nicename} (+${data.phonecode})`}</span>
    </div>
  );

  // Handle form field changes
  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    setFormState((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
    setFormErrors((prev) => ({ ...prev, [name]: '' }));
  };

  // Handle country select change
  const handleCountryChange = (selectedOption) => {
    setFormState((prev) => ({ ...prev, phone_country_code: selectedOption }));
    setFormErrors((prev) => ({ ...prev, phone_country_code: '' }));
  };

  // Handle hCaptcha verification
  const handleVerificationSuccess = (token) => {
    console.log('hCaptcha token:', token);
    setIsRecaptchaVerified(!!token);
  };

  // Validate form fields
  const validateForm = () => {
    const errors = {};
    if (!formState.name.trim()) errors.name = 'Full Name is required.';
    if (!formState.phone_country_code) errors.phone_country_code = 'Country is required.';
    if (!formState.phone.trim()) errors.phone = 'Phone Number is required.';
    else if (!/^\d{7,15}$/.test(formState.phone.trim())) errors.phone = 'Phone number must be 7-15 digits.';
    if (!formState.email.trim()) errors.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formState.email.trim())) errors.email = 'Invalid email format.';
    if (!formState.password.trim()) errors.password = 'Password is required.';
    else if (formState.password.length < 8) errors.password = 'Password must be at least 8 characters.';
    if (!formState.agency_name.trim()) errors.agency_name = 'Agency Name is required.';
    if (formState.agency_license && formState.agency_license.length > 255)
      errors.agency_license = 'Agency License must be 255 characters or less.';
    if (formState.agency_city && formState.agency_city.length > 255)
      errors.agency_city = 'Agency City must be 255 characters or less.';
    if (formState.agency_address && formState.agency_address.length > 255)
      errors.agency_address = 'Agency Address must be 255 characters or less.';
    return errors;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});

    // Validate form
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      const firstErrorField = Object.keys(errors)[0];
      const element = document.getElementById(firstErrorField);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.focus();
      }
      return;
    }

    // Check terms agreement
    if (!isAgreed) {
      setFormErrors({ terms: 'You must agree to the Terms and Policy' });
      document.getElementById('terms')?.focus();
      return;
    }

    // Check hCaptcha verification
    if (!isRecaptchaVerified) {
      setFormErrors({ recaptcha: 'Please complete the hCaptcha verification' });
      return;
    }

    setIsLoading(true);

    try {
      // Prepare form data
      const formData = new FormData();
      formData.append('name', formState.name);
      formData.append('email', formState.email);
      formData.append('phone_number', formState.phone);
      formData.append('password', formState.password);
      formData.append('phone_country_code', formState.phone_country_code?.phonecode || '');
      formData.append('agency_name', formState.agency_name || '');
      formData.append('agency_license', formState.agency_license || '');
      formData.append('agency_city', formState.agency_city || '');
      formData.append('agency_address', formState.agency_address || '');
      if (formState.agency_logo) formData.append('agency_logo', formState.agency_logo);
      formData.append('role', formState.user_type);
      formData.append('form_token', formState.form_token);

      // Call register function
      const response = await register(formData);

      // Reset form
      setFormState(initialFormState);
      setIsAgreed(false);
      setIsRecaptchaVerified(false);
      setFormErrors({});

      // Redirect based on role
      navigate(response.user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (error) {
      // Handle API errors
      if (error.response?.status === 422) {
        const backendErrors = error.response.data.errors;
        setFormErrors(
          Object.keys(backendErrors).reduce(
            (acc, key) => ({
              ...acc,
              [key === 'phone_number' ? 'phone' : key]: backendErrors[key][0],
            }),
            { general: error.response.data.message }
          )
        );
      } else {
        setFormErrors({
          general: error.response?.data?.message || 'Registration failed. Please try again.',
        });
      }
      console.error('Registration failed:', error.response?.data || error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <style>
        {`
        .hero-section { background-color: #fff; padding: 80px 0; }
        .features-section { background-color: #f5f5f5; padding: 60px 0; }
        .feature-icon { width: 64px; height: 64px; margin-bottom: 20px; }
        .how-it-works { padding: 60px 0; }
        .step-number { width: 40px; height: 40px; border-radius: 50%; background-color: #f5f5f5; display: flex; align-items: center; justify-content: center; margin-right: 15px; }
        .btn-register { background-color: #006CE4; color: white; padding: 8px 24px; border-radius: 4px; text-decoration: none; }
        .btn-register:hover { background-color: #0056b3; color: white; }
        .react-select__control {
          border-radius: 6px !important;
          border: 1px solid #dee2e6;
        }
        .react-select__control--is-focused {
          border-color: #80bdff !important;
          box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25) !important;
        }
        .is-invalid .react-select__control {
          border-color: #dc3545 !important;
          padding-right: calc(1.5em + 0.75rem);
          background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12' width='12' height='12' fill='none' stroke='%23dc3545'%3e%3ccircle cx='6' cy='6' r='4.5'/%3e%3cpath stroke-linejoin='round' d='M5.8 3.6h.4L6 6.5z'/%3e%3ccircle cx='6' cy='8.2' r='.6' fill='%23dc3545' stroke='none'/%3e%3c/svg%3e") !important;
          background-repeat: no-repeat;
          background-position: right calc(0.375em + 0.1875rem) center;
          background-size: calc(0.75em + 0.375rem) calc(0.75em + 0.375rem);
        }
        `}
      </style>
      <section className="hero-section">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6">
              <h1 className="mb-3 strong bold">
                Join <span className="text-primary">Fly Gasal</span> as an agent today!
              </h1>
              <p className="mb-4">
                Get the best pricing in the market and build better business with us – register
                today with our official networks
              </p>
              <a href="#signup" className="btn btn-primary px-5 py-3">
                Signup
              </a>
            </div>
            <div className="col-lg-6">
              <img
                src={`/assets/img/agent.jpg`}
                alt="Hero image"
                className="img-fluid rounded-5"
              />
            </div>
          </div>
        </div>
      </section>
      <section className="features-section">
        <div className="container">
          <h2 className="mb-4 strong">Why join Fly Gasal?</h2>
          <p className="mb-5">
            Access wholesale rates and premium inventory to boost your travel agency's revenue
          </p>
          <div className="row g-4">
            <div className="col-md-3">
              <img src={`/assets/img/ico1.png`} alt="Rates" className="feature-icon" />
              <h3 className="h5 strong">Wholesale Rates</h3>
              <p>
                Access exclusive B2B rates up to 40% below retail prices across 500,000+ properties
                worldwide to maximize your profit margins.
              </p>
            </div>
            <div className="col-md-3">
              <img src={`/assets/img/ico2.png`} alt="Inventory" className="feature-icon" />
              <h3 className="h5 strong">Premium Inventory</h3>
              <p>
                Book luxury hotels, resorts, and unique properties with guaranteed availability and
                real-time confirmation for your clients.
              </p>
            </div>
            <div className="col-md-3">
              <img src={`/assets/img/ico3.png`} alt="Platform" className="feature-icon" />
              <h3 className="h5 strong">Agent Dashboard</h3>
              <p>
                Manage bookings, access reports, and track commissions through our intuitive
                platform designed specifically for travel agents.
              </p>
            </div>
            <div className="col-md-3">
              <img src={`/assets/img/ico4.png`} alt="Support" className="feature-icon" />
              <h3 className="h5 strong">Dedicated Support</h3>
              <p>
                Get priority access to our 24/7 travel agent support team for quick resolution of
                booking modifications and queries.
              </p>
            </div>
          </div>
        </div>
      </section>
      <section className="how-it-works">
        <div className="container">
          <h2 className="strong mb-1">How does it work?</h2>
          <p className="mb-5">Start booking with wholesale rates today</p>
          <div className="row align-items-center">
            <div className="col-lg-6">
              <div className="mb-2 d-flex align-items-start">
                <div className="step-number">1</div>
                <div>
                  <h3 className="h5 strong">Register as an Agent</h3>
                  <p>Complete our simple verification process to confirm your agency credentials</p>
                </div>
              </div>
              <div className="mb-2 d-flex align-items-start">
                <div className="step-number">2</div>
                <div>
                  <h3 className="h5 strong">Access Your Dashboard</h3>
                  <p>
                    Get instant access to wholesale rates and premium inventory through your
                    dedicated portal
                  </p>
                </div>
              </div>
              <div className="mb-2 d-flex align-items-start">
                <div className="step-number">3</div>
                <div>
                  <h3 className="h5 strong">Make Bookings</h3>
                  <p>Search filter book with exclusive B2B rates with instant confirmation</p>
                </div>
              </div>
              <div className="mb-2 d-flex align-items-start">
                <div className="step-number">4</div>
                <div>
                  <h3 className="h5 strong">Grow Your Business</h3>
                  <p>Track your bookings, manage client requests, and expand your travel business</p>
                </div>
              </div>
            </div>
            <div className="col-lg-6">
              <img
                src={`/assets/img/agent2.jpg`}
                alt="How it works illustration"
                className="img-fluid rounded-5 w-100"
              />
            </div>
          </div>
        </div>
      </section>
      <div className="bg-light" id="signup">
        <div className="row p-2">
          <div className="col-md-6 mx-auto">
            <form id="signupForm" onSubmit={handleSubmit} className="mb-5">
              <div className="container-fluid">
                <div className="card mt-5 col-md-12 mx-auto rounded-4">
                  <div className="p-3 p-md-4">
                    <h3 className="font-bold text-2xl">{T.signup} {T.agent}</h3>
                    {formErrors.general && (
                      <div className="alert alert-danger col-md-5 mx-auto mt-3">{formErrors.general}</div>
                    )}
                    <div className="row">
                      <div className="form-floating mb-3 col-md-6">
                        <input
                          type="text"
                          className={`form-control ${formErrors.name ? 'is-invalid' : ''}`}
                          id="name"
                          placeholder="Full Name"
                          name="name"
                          value={formState.name}
                          onChange={handleInputChange}
                          aria-describedby="name_error"
                        />
                        <label htmlFor="name">{T.name}</label>
                        {formErrors.name && (
                          <div id="name_error" className="invalid-feedback">{formErrors.name}</div>
                        )}
                      </div>
                      <div className="form-floating mb-3 col-md-6">
                        <Select
                          options={countries}
                          value={formState.phone_country_code}
                          onChange={handleCountryChange}
                          components={{ Option: CustomOption, SingleValue: CustomSingleValue }}
                          styles={selectStyles}
                          placeholder={`${T.select} ${T.country}`}
                          isSearchable
                          getOptionLabel={(option) => `${option.nicename} (+${option.phonecode})`}
                          getOptionValue={(option) => option.id}
                          aria-label="Select country"
                          className={formErrors.phone_country_code ? 'is-invalid' : ''}
                        />
                        <label htmlFor="phone_country_code">{`${T.select} ${T.country}`}</label>
                        {formErrors.phone_country_code && (
                          <div className="invalid-feedback">{formErrors.phone_country_code}</div>
                        )}
                      </div>
                      <div className="form-floating mb-3 col-md-6">
                        <input
                          type="tel"
                          className={`form-control ${formErrors.phone ? 'is-invalid' : ''}`}
                          id="phone"
                          placeholder="Phone Number"
                          name="phone"
                          value={formState.phone}
                          onChange={handleInputChange}
                          aria-describedby="phone_error"
                        />
                        <label htmlFor="phone">{T.phone}</label>
                        {formErrors.phone && (
                          <div id="phone_error" className="invalid-feedback">{formErrors.phone}</div>
                        )}
                      </div>
                      <div className="form-floating mb-3 col-md-6">
                        <input
                          type="email"
                          className={`form-control ${formErrors.email ? 'is-invalid' : ''}`}
                          id="email"
                          placeholder="Email"
                          name="email"
                          value={formState.email}
                          onChange={handleInputChange}
                          aria-describedby="email_error"
                        />
                        <label htmlFor="email">{`${T.email} ${T.address}`}</label>
                        {formErrors.email && (
                          <div id="email_error" className="invalid-feedback">{formErrors.email}</div>
                        )}
                      </div>
                      <div className="form-floating mb-3 col-md-12">
                        <input
                          type="password"
                          className={`form-control ${formErrors.password ? 'is-invalid' : ''}`}
                          id="password"
                          placeholder="Password"
                          name="password"
                          value={formState.password}
                          onChange={handleInputChange}
                          aria-describedby="password_error"
                        />
                        <label htmlFor="password">{T.password}</label>
                        {formErrors.password && (
                          <div id="password_error" className="invalid-feedback">{formErrors.password}</div>
                        )}
                      </div>
                      <div className="form-floating mb-3 col-md-6">
                        <input
                          type="text"
                          className={`form-control ${formErrors.agency_name ? 'is-invalid' : ''}`}
                          id="agency_name"
                          placeholder="Agency Name"
                          name="agency_name"
                          value={formState.agency_name}
                          onChange={handleInputChange}
                          aria-describedby="agency_name_error"
                        />
                        <label htmlFor="agency_name">{T.agency_name}</label>
                        {formErrors.agency_name && (
                          <div id="agency_name_error" className="invalid-feedback">{formErrors.agency_name}</div>
                        )}
                      </div>
                      <div className="form-floating mb-3 col-md-6">
                        <input
                          type="text"
                          className={`form-control ${formErrors.agency_license ? 'is-invalid' : ''}`}
                          id="agency_license"
                          placeholder="Agency License"
                          name="agency_license"
                          value={formState.agency_license}
                          onChange={handleInputChange}
                          aria-describedby="agency_license_error"
                        />
                        <label htmlFor="agency_license">{T.agency_license}</label>
                        {formErrors.agency_license && (
                          <div id="agency_license_error" className="invalid-feedback">{formErrors.agency_license}</div>
                        )}
                      </div>
                      <div className="form-floating mb-3 col-md-6">
                        <input
                          type="text"
                          className={`form-control ${formErrors.agency_city ? 'is-invalid' : ''}`}
                          id="agency_city"
                          placeholder="Agency City"
                          name="agency_city"
                          value={formState.agency_city}
                          onChange={handleInputChange}
                          aria-describedby="agency_city_error"
                        />
                        <label htmlFor="agency_city">{T.agency_city}</label>
                        {formErrors.agency_city && (
                          <div id="agency_city_error" className="invalid-feedback">{formErrors.agency_city}</div>
                        )}
                      </div>
                      <div className="form-floating mb-3 col-md-6">
                        <input
                          type="text"
                          className={`form-control ${formErrors.agency_address ? 'is-invalid' : ''}`}
                          id="agency_address"
                          placeholder="Agency Address"
                          name="agency_address"
                          value={formState.agency_address}
                          onChange={handleInputChange}
                          aria-describedby="agency_address_error"
                        />
                        <label htmlFor="agency_address">{T.agency_address}</label>
                        {formErrors.agency_address && (
                          <div id="agency_address_error" className="invalid-feedback">{formErrors.agency_address}</div>
                        )}
                      </div>
                      <div className="form-floating mb-3 col-md-6">
                        <input
                          type="file"
                          className={`form-control ${formErrors.agency_logo ? 'is-invalid' : ''}`}
                          id="agency_logo"
                          name="agency_logo"
                          onChange={handleInputChange}
                          accept="image/png,image/jpeg,image/gif,image/svg+xml"
                          aria-describedby="agency_logo_error"
                        />
                        <label htmlFor="agency_logo">Agency Logo</label>
                        {formErrors.agency_logo && (
                          <div id="agency_logo_error" className="invalid-feedback">{formErrors.agency_logo}</div>
                        )}
                      </div>
                    </div>
                    <div className="mb-3">
                      <HCaptcha
                        sitekey={hcaptchaSiteKey}
                        onVerify={handleVerificationSuccess}
                        onExpire={() => setIsRecaptchaVerified(false)}
                        onError={() => setIsRecaptchaVerified(false)}
                      />
                      {formErrors.recaptcha && (
                        <div className="text-danger mt-1">{formErrors.recaptcha}</div>
                      )}
                    </div>
                    <div className="mt-4">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id="terms"
                        checked={isAgreed}
                        onChange={(e) => setIsAgreed(e.target.checked)}
                        aria-label="Agree to terms and policy"
                      />
                      <label className="form-check-label ms-2" htmlFor="terms">
                        {T.by_signup_i_agree_to_terms_and_policy}
                      </label>
                      {formErrors.terms && (
                        <div className="text-danger mt-1">{formErrors.terms}</div>
                      )}
                    </div>
                    <hr />
                    <div className="pt-0 pb-2">
                      <button
                        type="submit"
                        className="btn btn-primary w-100 d-flex align-items-center justify-content-center font-bold"
                        disabled={!isAgreed || !isRecaptchaVerified || isLoading}
                      >
                        {isLoading ? (
                          <>
                            <span
                              className="spinner-border spinner-border-sm me-2"
                              role="status"
                              aria-hidden="true"
                            ></span>
                            Registering...
                          </>
                        ) : (
                          T.signup
                        )}
                      </button>
                    </div>
                    <input type="hidden" name="user_type" value={formState.user_type} />
                    <input type="hidden" name="form_token" value={formState.form_token} />
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default Register;