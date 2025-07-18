import React, { useState, useEffect } from 'react';
import Select from 'react-select';

// Mock translation object to replace PHP T::
const T = {
    signup: 'Sign Up',
    name: 'Full Name',
    last_name: 'Last Name',
    select: 'Select',
    country: 'Country',
    phone_number: 'Phone',
    email: 'Email',
    address: 'Address',
    password: 'Password',
    by_signup_i_agree_to_terms_and_policy: 'By signing up, I agree to the Terms and Policy',
};

// Mock country data to replace PHP foreach loop
const countries = [
    { id: '1', iso: 'us', nicename: 'United States', phonecode: '1' },
    { id: '2', iso: 'uk', nicename: 'United Kingdom', phonecode: '44' },
    { id: '3', iso: 'ca', nicename: 'Canada', phonecode: '1' },
];

const Register = ({
    signupUrl = '/signup',
    formToken = 'static_form_token',
    recaptchaSiteKey = '6LdX3JoUAAAAAFCG5tm0MFJaCF3LKxUN4pVusJIF',
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isAgreed, setIsAgreed] = useState(false);
    const [isRecaptchaVerified, setIsRecaptchaVerified] = useState(false);
    const [formState, setFormState] = useState({
        name: '',
        phone_country_code: null,
        phone_number: '',
        email: '',
        password: '',
    });
    const [formErrors, setFormErrors] = useState({});

    useEffect(() => {
        // Load reCAPTCHA script dynamically
        const script = document.createElement('script');
        script.src = 'https://www.google.com/recaptcha/api.js';
        script.async = true;
        document.body.appendChild(script);

        // Define the callback function globally for reCAPTCHA
        window.correctCaptcha = () => {
            setIsRecaptchaVerified(true);
        };

        return () => {
            document.body.removeChild(script);
            delete window.correctCaptcha;
            // Reset reCAPTCHA on unmount
            if (window.grecaptcha) {
                window.grecaptcha.reset();
            }
        };
    }, []);

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
                src={`/assets/img/flags/${data.iso}.svg`}
                // alt={`${data.nicename} flag`}
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
            errors.name = 'First name is required';
        }
        if (!formState.phone_country_code) {
            errors.phone_country_code = 'Country is required';
        }
        if (!formState.phone.trim()) {
            errors.phone = 'Phone number is required';
        } else if (!/^\d{7,15}$/.test(formState.phone.trim())) {
            errors.phone = 'Phone number must be 7-15 digits';
        }
        if (!formState.email.trim()) {
            errors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formState.email.trim())) {
            errors.email = 'Invalid email format';
        }
        if (!formState.password.trim()) {
            errors.password = 'Password is required';
        } else if (formState.password.length < 6) {
            errors.password = 'Password must be at least 6 characters';
        }
        return errors;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const errors = validateForm();
        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }
        setIsLoading(true);

        // Simulate API call
        fetch(signupUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                ...formState,
                phone_country_code: formState.phone_country_code?.id || '',
                form_token: formToken,
            }).toString(),
        })
            .then((response) => response.json())
            .then((data) => {
                setIsLoading(false);
                console.log('Signup response:', data);
                // Reset form and reCAPTCHA
                setFormState({
                    name: '',
                    phone_country_code: null,
                    phone_number: '',
                    email: '',
                    password: '',
                });
                setIsAgreed(false);
                setIsRecaptchaVerified(false);
                if (window.grecaptcha) {
                    window.grecaptcha.reset();
                }
            })
            .catch((error) => {
                setIsLoading(false);
                console.error('Error:', error);
                alert('An error occurred during signup');
            });
    };

    return (
        <div className="py-5 pt-2 mt-5">
            <form id="signup" onSubmit={handleSubmit} className="mb-5">
                <div className="container">
                    <div className="card mt-5 col-md-5 mx-auto rounded-4">
                        <div className="p-3 p-md-4">
                            <h3 className="font-bold text-2xl">{T.signup}</h3>
                            <p className="mb-4"></p>
                            <div className="form-floating mb-3">
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
                            <div className="row">
                                <div className="col-md-12">
                                    <div className="form-floating mb-3">
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
                                </div>
                                <div className="col-md-12">
                                    <div className="form-floating mb-3">
                                        <input
                                            type="tel"
                                            className={`form-control ${formErrors.phone_number ? 'is-invalid' : ''}`}
                                            id="phone_number"
                                            placeholder=" "
                                            name="phone_number"
                                            value={formState.phone_number}
                                            onChange={handleInputChange}
                                            required
                                            aria-describedby="phone_number_error"
                                        />
                                        <label htmlFor="phone_number">{T.phone_number}</label>
                                        {formErrors.phone && (
                                            <div id="phone_error" className="invalid-feedback">{formErrors.phone_number}</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="form-floating mb-3">
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
                            <div className="form-floating mb-3">
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
                            <div
                                className="g-recaptcha"
                                data-sitekey={recaptchaSiteKey}
                                data-callback="correctCaptcha"
                            ></div>
                            <div className="mt-2">
                                <input
                                    type="checkbox"
                                    className="form-check-input agree"
                                    id="terms"
                                    checked={isAgreed}
                                    onChange={(e) => setIsAgreed(e.target.checked)}
                                    aria-label="Agree to terms and policy"
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
                                                disabled={!isAgreed || !isRecaptchaVerified}
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
                    <input type="hidden" name="form_token" value={formToken} />
                </div>
            </form>
        </div>
    );
};

export default Register