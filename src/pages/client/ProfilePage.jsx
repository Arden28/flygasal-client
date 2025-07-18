import React, { useEffect, useState } from "react";
import PropTypes from 'prop-types';
import Headbar from "../../components/client/Headbar";


// Mock translation object to replace PHP T::
const T = {
    welcomeback: 'Welcome Back',
    dashboard: 'Dashboard',
    mybookings: 'My Bookings',
    reports: 'Reports',
    myprofile: 'My Profile',
    logout: 'Logout',
    walletbalance: 'Wallet Balance',
    totalbookings: 'Total Bookings',
    pendinginvoices: 'Pending Invoices',
};

// Mock profile data
const mockProfileData = {
    user_id: '12345',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@example.com',
    phone_country_code: '1',
    phone: '1234567890',
    country_code: '1',
    state: 'California',
    city: 'Los Angeles',
    address1: '123 Main St',
    address2: '',
};

// Mock countries data
const mockCountries = [
    { id: '1', iso: 'US', nicename: 'United States', phonecode: '1' },
    { id: '2', iso: 'FR', nicename: 'France', phonecode: '33' },
    { id: '3', iso: 'KE', nicename: 'Kenya', phonecode: '254' },
];

// Mock translation object as fallback
const fallbackT = {
    profileinformation: 'Profile Information',
    first_name: 'First Name',
    last_name: 'Last Name',
    email: 'Email',
    password: 'Password',
    phone: 'Phone',
    country: 'Country',
    state: 'State',
    city: 'City',
    address: 'Address',
    select: 'Select',
    updateprofile: 'Update Profile',
    profileupdatedsuccessfully: 'Profile updated successfully',
};

const ProfilePage = ({
    rootUrl = '/',
    apiKey = 'mock_api_key',
    apiUrl = '/api',
    // user = mockUser,
    profileData = mockProfileData,
    countries = mockCountries,
}) => {

    const [formData, setFormData] = useState({
        first_name: profileData.first_name || '',
        last_name: profileData.last_name || '',
        email: profileData.email || '',
        password: '',
        phone_country_code: profileData.phone_country_code || '',
        phone: profileData.phone || '',
        country_code: profileData.country_code || '',
        state: profileData.state || '',
        city: profileData.city || '',
        address1: profileData.address1 || '',
        address2: profileData.address2 || '',
        user_id: profileData.user_id || '',
        form_token: 'mock_form_token', // Mock session token
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // Mock API call for profile update
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setShowSuccess(false);

        try {
            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 1000));
            console.log('Profile update submitted:', formData);
            setShowSuccess(true);
            // Reset password field after submission
            setFormData((prev) => ({ ...prev, password: '' }));
        } catch (error) {
            console.error('Error updating profile:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    // Reset success alert after 5 seconds
    useEffect(() => {
        if (showSuccess) {
            const timer = setTimeout(() => setShowSuccess(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [showSuccess]);

    return (
        <>
            <style>{`.newsletter-section { display: none; }`}</style>
            <div className="container-fluid">
                    <section className="w-100">
                        <div className="rounded-bottom">
                            <Headbar T={T} user={{ user_type: profileData.user_type, first_name: profileData.first_name, last_name: profileData.last_name, user_id: profileData.user_id }} rootUrl={rootUrl} />
                        </div>
                        <div className="">
                            <div className="px-0 py-3">
                                <div className="row">
                                    <div className="">
                                        <div className="form-box">
                                            <div className="form-title-wrap border-bottom-0 pb-0">
                                                <h5 className="fw-bold mb-3">{T.profileinformation}</h5>
                                            </div>
                                            <hr />
                                            <div className="p-4">
                                                <form id="profile" onSubmit={handleSubmit}>
                                                    <div className="">
                                                        <div className={`alert alert-success ${showSuccess ? '' : 'd-none'}`}>
                                                            {T.profileupdatedsuccessfully}
                                                        </div>
                                                        <div className="row">
                                                            <div className="col-md-4">
                                                                <div className="form-floating mb-3">
                                                                    <input
                                                                        required
                                                                        type="text"
                                                                        className="form-control"
                                                                        name="first_name"
                                                                        id={T.first_name}
                                                                        placeholder=" "
                                                                        value={formData.first_name}
                                                                        onChange={handleChange}
                                                                        aria-label={T.first_name}
                                                                    />
                                                                    <label htmlFor={T.first_name}>{T.first_name}</label>
                                                                </div>
                                                            </div>
                                                            <div className="col-md-4">
                                                                <div className="form-floating mb-3">
                                                                    <input
                                                                        required
                                                                        type="text"
                                                                        className="form-control"
                                                                        name="last_name"
                                                                        id={T.last_name}
                                                                        placeholder=" "
                                                                        value={formData.last_name}
                                                                        onChange={handleChange}
                                                                        aria-label={T.last_name}
                                                                    />
                                                                    <label htmlFor={T.last_name}>{T.last_name}</label>
                                                                </div>
                                                            </div>
                                                            <div className="col-md-4">
                                                                <div className="form-floating mb-3">
                                                                    <input
                                                                        required
                                                                        type="email"
                                                                        className="form-control"
                                                                        name="email"
                                                                        id={T.email}
                                                                        placeholder=" "
                                                                        value={formData.email}
                                                                        readOnly
                                                                        aria-label={T.email}
                                                                    />
                                                                    <label htmlFor={T.email}>{T.email}</label>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="row">
                                                            <div className="col-md-4">
                                                                <div className="form-floating mb-3">
                                                                    <input
                                                                        required
                                                                        type="password"
                                                                        className="form-control"
                                                                        name="password"
                                                                        id={T.password}
                                                                        placeholder=" "
                                                                        value={formData.password}
                                                                        onChange={handleChange}
                                                                        aria-label={T.password}
                                                                    />
                                                                    <label htmlFor={T.password}>{T.password}</label>
                                                                </div>
                                                            </div>
                                                            <div className="col-md-4">
                                                                <div className="form-floating mb-3">
                                                                    <select
                                                                        required
                                                                        name="phone_country_code"
                                                                        className="selectpicker phone w-100"
                                                                        value={formData.phone_country_code}
                                                                        onChange={handleChange}
                                                                        data-live-search="true"
                                                                        aria-label={T.country}
                                                                    >
                                                                        <option value="">{T.select} {T.country}</option>
                                                                        {countries.map((c) => (
                                                                            <option
                                                                                key={c.id}
                                                                                value={c.id}
                                                                                data-content={`<img class='' src='${rootUrl}assets/img/flags/${c.iso.toLowerCase()}.svg' style='width: 20px; margin-right: 14px;color:#fff'><span class='text-dark'> ${c.nicename} <strong>+${c.phonecode}</strong></span>`}
                                                                            >
                                                                                {c.nicename} +{c.phonecode}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                            </div>
                                                            <div className="col-md-4">
                                                                <div className="form-floating mb-3">
                                                                    <input
                                                                        required
                                                                        type="number"
                                                                        className="form-control"
                                                                        name="phone"
                                                                        id={T.phone}
                                                                        placeholder=" "
                                                                        value={formData.phone}
                                                                        onChange={handleChange}
                                                                        aria-label={T.phone}
                                                                    />
                                                                    <label htmlFor={T.phone}>{T.phone}</label>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="row">
                                                            <div className="col-md-4">
                                                                <div className="form-floating mb-3">
                                                                    <select
                                                                        required
                                                                        name="country_code"
                                                                        className="selectpicker country w-100"
                                                                        value={formData.country_code}
                                                                        onChange={handleChange}
                                                                        data-live-search="true"
                                                                        aria-label={T.country}
                                                                    >
                                                                        <option value="">{T.select} {T.country}</option>
                                                                        {countries.map((c) => (
                                                                            <option
                                                                                key={c.id}
                                                                                value={c.id}
                                                                                data-content={`<img class='' src='${rootUrl}assets/img/flags/${c.iso.toLowerCase()}.svg' style='width: 20px; margin-right: 14px;color:#fff'><span class='text-dark'> ${c.nicename}</span>`}
                                                                            >
                                                                                {c.nicename}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                            </div>
                                                            <div className="col-md-4">
                                                                <div className="form-floating mb-3">
                                                                    <input
                                                                        required
                                                                        type="text"
                                                                        className="form-control"
                                                                        name="state"
                                                                        id={T.state}
                                                                        placeholder=" "
                                                                        value={formData.state}
                                                                        onChange={handleChange}
                                                                        aria-label={T.state}
                                                                    />
                                                                    <label htmlFor={T.state}>{T.state}</label>
                                                                </div>
                                                            </div>
                                                            <div className="col-md-4">
                                                                <div className="form-floating mb-3">
                                                                    <input
                                                                        required
                                                                        type="text"
                                                                        className="form-control"
                                                                        name="city"
                                                                        id={T.city}
                                                                        placeholder=" "
                                                                        value={formData.city}
                                                                        onChange={handleChange}
                                                                        aria-label={T.city}
                                                                    />
                                                                    <label htmlFor={T.city}>{T.city}</label>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="row">
                                                            <div className="col-md-12">
                                                                <div className="form-floating mb-3">
                                                                    <input
                                                                        required
                                                                        type="text"
                                                                        className="form-control"
                                                                        name="address1"
                                                                        id={T.address}
                                                                        placeholder=" "
                                                                        value={formData.address1}
                                                                        onChange={handleChange}
                                                                        aria-label={`${T.address} 1`}
                                                                    />
                                                                    <label htmlFor={T.address}>{T.address} 1</label>
                                                                </div>
                                                            </div>
                                                            <div className="col-md-12">
                                                                <div className="form-floating mb-3">
                                                                    <input
                                                                        type="text"
                                                                        className="form-control"
                                                                        name="address2"
                                                                        id={T.address}
                                                                        placeholder=" "
                                                                        value={formData.address2}
                                                                        onChange={handleChange}
                                                                        aria-label={`${T.address} 2`}
                                                                    />
                                                                    <label htmlFor={T.address}>{T.address} 2</label>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="btn-box mt-4">
                                                            <button
                                                                style={{ height: '44px' }}
                                                                type="submit"
                                                                className={`w-100 submit_button btn btn-primary btn-m rounded-sm ${isSubmitting ? 'd-none' : ''}`}
                                                                aria-label={T.updateprofile}
                                                            >
                                                                {T.updateprofile}
                                                            </button>
                                                            <div className={`loading_button ${isSubmitting ? '' : 'd-none'}`}>
                                                                <button
                                                                    style={{ height: '44px' }}
                                                                    className="w-100 btn btn-primary btn-m rounded-sm"
                                                                    type="button"
                                                                    disabled
                                                                    aria-label="Loading"
                                                                >
                                                                    <span
                                                                        className="spinner-border spinner-border-sm"
                                                                        role="status"
                                                                        aria-hidden="true"
                                                                    ></span>
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <input type="hidden" name="form_token" value={formData.form_token} />
                                                        <input type="hidden" name="user_id" value={formData.user_id} />
                                                    </div>
                                                </form>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
            </div>
        </>
    );
};


ProfilePage.propTypes = {
    rootUrl: PropTypes.string,
    apiUrl: PropTypes.string,
    apiKey: PropTypes.string,
    profileData: PropTypes.shape({
        user_id: PropTypes.string,
        first_name: PropTypes.string,
        last_name: PropTypes.string,
        email: PropTypes.string,
        phone_country_code: PropTypes.string,
        phone: PropTypes.string,
        country_code: PropTypes.string,
        state: PropTypes.string,
        city: PropTypes.string,
        address1: PropTypes.string,
        address2: PropTypes.string,
        user_type: PropTypes.string,
    }),
    countries: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.string,
            iso: PropTypes.string,
            nicename: PropTypes.string,
            phonecode: PropTypes.string,
        })
    ),
};

export default ProfilePage;