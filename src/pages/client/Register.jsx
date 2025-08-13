import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { toast } from 'react-toastify';
import apiService from '../../api/apiService';

// Mock translation object to replace PHP T::
const T = {
  signup: 'Sign Up',
  name: 'Full Name',
  last_name: 'Last Name',
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

// Mock country data to replace PHP foreach loop
const countries = [
  { id: '1', iso: 'us', nicename: 'United States', phonecode: '1' },
  { id: '2', iso: 'uk', nicename: 'United Kingdom', phonecode: '44' },
  { id: '3', iso: 'ca', nicename: 'Canada', phonecode: '1' },
  { id: '4', iso: 'in', nicename: 'India', phonecode: '91' },
  { id: '5', iso: 'au', nicename: 'Australia', phonecode: '61' },
];

const Register = ({
  signupUrl = '/signup',
  formToken = 'static_form_token',
  recaptchaSiteKey = 'f32aa812-3254-479a-839c-4e8a70388cac', // Replace with your actual reCAPTCHA site key
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isAgreed, setIsAgreed] = useState(false);
  const [isRecaptchaVerified, setIsRecaptchaVerified] = useState(false);
  const [formState, setFormState] = useState({
    name: '',
    phone_country_code: null, // Stores the selected option object from react-select
    phone: '',
    email: '',
    password: '',
    walletBalance: 0,
    agency_name: '',
    agency_license: '',
    agency_address: '',
    agency_city: '',
    agency_logo: null,
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    // Load reCAPTCHA script dynamically
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=explicit`; // Use explicit render mode
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    // Define the callback function globally for reCAPTCHA
    window.correctCaptcha = (response) => {
      // You might want to send this response token to your backend for verification
      console.log("reCAPTCHA response:", response);
      setIsRecaptchaVerified(true);
    };

    script.onload = () => {
      // Ensure grecaptcha is available before trying to render
      if (window.grecaptcha && window.grecaptcha.render) {
        window.grecaptcha.render('recaptcha-container', {
          sitekey: recaptchaSiteKey,
          callback: window.correctCaptcha,
          'expired-callback': () => setIsRecaptchaVerified(false), // Handle token expiration
          'error-callback': () => setIsRecaptchaVerified(false), // Handle errors
        });
      }
    };

    return () => {
      // Cleanup: Remove the script and global callback
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
      delete window.correctCaptcha;
      // Reset reCAPTCHA on unmount if it was rendered
      if (window.grecaptcha && window.grecaptcha.reset) {
        window.grecaptcha.reset();
      }
    };
  }, [recaptchaSiteKey]); // Add recaptchaSiteKey to dependencies


    // Custom styles for react-select
    const selectStyles = {
      control: (provided) => ({
        ...provided,
        borderRadius: '0.5rem',
        padding: '0.5rem',
        paddingLeft: '0.8rem',
        border: '1px solid #e5e7eb',
        boxShadow: 'none',
        '&:hover': {
          borderColor: '#3b82f6',
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
        src={`/assets/img/flags/${data.iso.toLowerCase()}.svg`} // Ensure lowercase for consistency
        alt={`${data.nicename} flag`}
        className="w-[20px] mr-3"
      />
      <span>{`${data.nicename} (+${data.phonecode})`}</span>
    </div>
  );

  // Custom SingleValue Component for react-select
  const CustomSingleValue = ({ innerProps, children, data }) => (
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
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
    // Clear error for the field when user starts typing
    setFormErrors((prev) => ({ ...prev, [name]: '' }));
  };

  // Handle country select change
  const handleCountryChange = (selectedOption) => {
    setFormState((prev) => ({ ...prev, phone_country_code: selectedOption }));
    setFormErrors((prev) => ({ ...prev, phone_country_code: '' }));
  };

  // Validate form fields
  const validateForm = () => {
    const errors = {};
    if (!formState.name.trim()) {
      errors.name = 'Full Name is required.';
    }
    if (!formState.phone_country_code) {
      errors.phone_country_code = 'Country is required.';
    }
    if (!formState.phone.trim()) {
      errors.phone = 'Phone Number is required.';
    } else if (!/^\d{7,15}$/.test(formState.phone.trim())) {
      errors.phone = 'Phone number must be 7-15 digits.';
    }
    if (!formState.email.trim()) {
      errors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formState.email.trim())) {
      errors.email = 'Invalid email format.';
    }
    if (!formState.password.trim()) {
      errors.password = 'Password is required.';
    } else if (formState.password.length < 6) {
      errors.password = 'Password must be at least 6 characters.';
    }
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      // Optional: scroll to the first error
      const firstErrorField = Object.keys(errors)[0];
      const element = document.getElementById(firstErrorField);
      if (element) {
        element.focus();
      }
      return;
    }

    if (!isAgreed) {
      alert('You must agree to the Terms and Policy.');
      return;
    }
    // if (!isRecaptchaVerified) {
    //   alert('Please complete the reCAPTCHA verification.');
    //   return;
    // }

    setIsLoading(true);

    // Simulate API call
    
    try {
        const newUser = {
          name: formState.name,
          phone_country_code: formState.phone_country_code?.id || '',
          phone: formState.phone,
          email: formState.email,
          password: formState.password,
          walletBalance: formState.walletBalance,
          // Add agency details
          agency_name: formState.agency_name,
          agency_license: formState.agency_license,
          agency_city: formState.agency_city,
          agency_address: formState.agency_address,
          agency_logo: formState.agency_logo,
        };
        const response = await apiService.post('/admin/users', newUser);
        setIsLoading(false);
        console.log('User added successfully:', response.data);
        if (response.data.success) {
          
          // Reset form and reCAPTCHA
          setFormState({
            name: '',
            phone_country_code: null,
            phone: '',
            email: '',
            password: '',
            agency_name: '',
            agency_license: '',
            agency_city: '',
            agency_address: '',
          });
          setIsAgreed(false);
          setIsRecaptchaVerified(false);
        }
        
    } catch (error) {
        console.error('Add failed:', error);
        alert('An error occurred during signup.');
    }
    // setIsLoading(false);
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
        /* Adjusted select styles to directly apply to react-select components */
        .react-select__control {
            border-radius: 6px !important;
            border: 1px solid #dee2e6;
        }
        .react-select__control--is-focused {
            border-color: #80bdff !important; /* Example Bootstrap focus color */
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
          <p>{/* Response message if needed */}</p>
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
              <img
                src={`/assets/img/ico1.png`}
                alt="Rates"
                className="feature-icon"
              />
              <h3 className="h5 strong">Wholesale Rates</h3>
              <p>
                Access exclusive B2B rates up to 40% below retail prices across 500,000+ properties
                worldwide to maximize your profit margins.
              </p>
            </div>
            <div className="col-md-3">
              <img
                src={`/assets/img/ico2.png`}
                alt="Inventory"
                className="feature-icon"
              />
              <h3 className="h5 strong">Premium Inventory</h3>
              <p>
                Book luxury hotels, resorts, and unique properties with guaranteed availability and
                real-time confirmation for your clients.
              </p>
            </div>
            <div className="col-md-3">
              <img
                src={`/assets/img/ico3.png`}
                alt="Platform"
                className="feature-icon"
              />
              <h3 className="h5 strong">Agent Dashboard</h3>
              <p>
                Manage bookings, access reports, and track commissions through our intuitive
                platform designed specifically for travel agents.
              </p>
            </div>
            <div className="col-md-3">
              <img
                src={`/assets/img/ico4.png`}
                alt="Support"
                className="feature-icon"
              />
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
            <div className="card"> {/* Removed duplicate id="signup" from here */}
              <div>
                <form id="signupForm" onSubmit={handleSubmit} className="mb-5"> {/* Changed id to avoid conflict */}
                  <div className="container-fluid">
                    <div className="card mt-5 col-md-12 mx-auto rounded-4">
                      <div className="p-3 p-md-4">
                        <h3 className="font-bold text-2xl">{T.signup} {T.agent}</h3>
                        <p className="mb-4"></p>
                        <div className="row">
                            <div className="form-floating mb-3 col-md-6">
                            <input
                                type="text"
                                className={`form-control ${formErrors.name ? 'is-invalid' : ''}`}
                                id="name"
                                placeholder=" "
                                name="name"
                                value={formState.name}
                                onChange={handleInputChange}
                                required
                                aria-describedby="name_error"
                            />
                            <label htmlFor="name">{T.name}</label>
                            {formErrors.name && (
                                <div id="name_error" className="invalid-feedback">
                                {formErrors.name}
                                </div>
                            )}
                            </div>
                            <div className="form-floating mb-3 col-md-6">
                                <Select
                                    options={countries}
                                    value={formState.phone_country_code}
                                    onChange={handleCountryChange}
                                    components={{ Option: CustomOption }}
                                    styles={selectStyles}
                                    placeholder={`${T.select} ${T.country}`}
                                    isSearchable
                                    getOptionLabel={(option) => `${option.nicename} (+${option.phonecode})`}
                                    getOptionValue={(option) => option.id}
                                    required
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
                                placeholder=" "
                                name="phone"
                                value={formState.phone}
                                onChange={handleInputChange}
                                required
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
                                placeholder=" "
                                name="email"
                                value={formState.email}
                                onChange={handleInputChange}
                                required
                                aria-describedby="email_error"
                            />
                            <label htmlFor="email">{`${T.email} ${T.address}`}</label>
                            {formErrors.email && (
                                <div id="email_error" className="invalid-feedback">
                                {formErrors.email}
                                </div>
                            )}
                            </div>

                            <div className="form-floating mb-3 col-md-12">
                            <input
                                type="password"
                                className={`form-control ${formErrors.password ? 'is-invalid' : ''}`}
                                id="password"
                                placeholder=" "
                                name="password"
                                value={formState.password}
                                onChange={handleInputChange}
                                required
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
                                    placeholder=" "
                                    name="agency_name"
                                    value={formState.agency_name}
                                    onChange={handleInputChange}
                                    required
                                    aria-describedby="agency_name_error"
                                />
                                <label htmlFor="agency_name">{T.agency_name}</label>
                                {formErrors.agency_name && (
                                    <div id="agency_name_error" className="invalid-feedback">
                                    {formErrors.agency_name}
                                    </div>
                                )}
                            </div>
                            
                            <div className="form-floating mb-3 col-md-6">
                                <input
                                    type="text"
                                    className={`form-control ${formErrors.agency_license ? 'is-invalid' : ''}`}
                                    id="agency_license"
                                    placeholder=" "
                                    name="agency_license"
                                    value={formState.agency_license}
                                    onChange={handleInputChange}
                                    required
                                    aria-describedby="agency_licence_error"
                                />
                                <label htmlFor="agency_license">{T.agency_license}</label>
                                {formErrors.agency_license && (
                                    <div id="agency_licence_error" className="invalid-feedback">
                                    {formErrors.agency_license}
                                    </div>
                                )}
                            </div>
                            
                            <div className="form-floating mb-3 col-md-6">
                                <input
                                    type="text"
                                    className={`form-control ${formErrors.agency_city ? 'is-invalid' : ''}`}
                                    id="agency_city"
                                    placeholder=" "
                                    name="agency_city"
                                    value={formState.agency_city}
                                    onChange={handleInputChange}
                                    required
                                    aria-describedby="agency_licence_error"
                                />
                                <label htmlFor="agency_city">{T.agency_city}</label>
                                {formErrors.agency_license && (
                                    <div id="agency_city_error" className="invalid-feedback">
                                    {formErrors.agency_city}
                                    </div>
                                )}
                            </div>
                            
                            <div className="form-floating mb-3 col-md-6">
                                <input
                                    type="text"
                                    className={`form-control ${formErrors.agency_address ? 'is-invalid' : ''}`}
                                    id="agency_address"
                                    placeholder=" "
                                    name="agency_address"
                                    value={formState.agency_address}
                                    onChange={handleInputChange}
                                    required
                                    aria-describedby="agency_licence_error"
                                />
                                <label htmlFor="agency_address">{T.agency_address}</label>
                                {formErrors.agency_license && (
                                    <div id="agency_address_error" className="invalid-feedback">
                                    {formErrors.agency_address}
                                    </div>
                                )}
                            </div>

                        </div>

                        <div
                          id="recaptcha-container" // Changed to explicit ID for rendering
                          className="g-recaptcha"
                          data-sitekey={recaptchaSiteKey}
                          data-callback="correctCaptcha"
                        ></div>
                        <HCaptcha
                            sitekey={recaptchaSiteKey}
                            // onVerify={(token,ekey) => handleVerificationSuccess(token, ekey)}
                        />
                        {formErrors.recaptcha && ( // Add error message for recaptcha if needed
                            <div className="text-danger mt-1">{formErrors.recaptcha}</div>
                        )}
                        <div className="mt-4">
                          <input
                            type="checkbox"
                            className="form-check-input agree"
                            id="terms"
                            checked={isAgreed}
                            onChange={(e) => setIsAgreed(e.target.checked)}
                            aria-label="Agree to terms and policy"
                            required // Make this visually required, validation handled by state
                          />
                          <label className="form-check-label ms-2" htmlFor="terms">
                            {T.by_signup_i_agree_to_terms_and_policy}
                          </label>
                        </div>
                        <hr />
                        <div className="pt-0 pb-2">
                          <div className="mt-3 row">
                            <div className="col-md-12">
                              <div className="signup_button" style={{ display: isLoading ? 'none' : 'block' }}>
                                <button
                                  id="submitBTN"
                                  style={{ height: '44px' }}
                                  type="submit"
                                  className="btn btn-primary w-100 d-flex align-items-center justify-content-center font-bold"
                                  disabled={!isAgreed 
                                    // || !isRecaptchaVerified 
                                    || isLoading} // Disable while loading
                                >
                                  <span>{T.signup}</span>
                                </button>
                              </div>
                              <div className="loading_button" style={{ display: isLoading ? 'block' : 'none' }}>
                                <button
                                  style={{ height: '44px' }}
                                  className="gap-2 w-100 btn btn-primary rounded-sm font-bold uppercase"
                                  type="button"
                                  disabled
                                >
                                  <span
                                    className="spinner-border spinner-border-sm"
                                    role="status"
                                    aria-hidden="true"
                                  ></span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <input type="hidden" name="user_type" value="agent" /> {/* Added user_type hidden input */}
                    <input type="hidden" name="form_token" value={formToken} />
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Register;
