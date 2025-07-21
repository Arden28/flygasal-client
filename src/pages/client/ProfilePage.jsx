import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import apiService from '../../api/apiService';
import Headbar from '../../components/client/Headbar';
import { getAllCountries } from '../../api/countriesService';

const T = {
  profileinformation: 'Profile Information',
  name: 'Full Name',
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
  welcomeback: 'Welcome Back',
  dashboard: 'Dashboard',
  mybookings: 'My Bookings',
  reports: 'Reports',
  myprofile: 'My Profile',
  logout: 'Logout',
};

const ProfilePage = () => {
  const { user, loading } = useContext(AuthContext);
  const navigate = useNavigate();
  const [formData, setFormData] = useState(null);
  const [countries, setCountries] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Redirect to login if unauthenticated
  useEffect(() => {
    if (!loading && !user) navigate('/login');
  }, [loading, user, navigate]);

  // Populate initial form data
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        password: '',
        phone: user.phone_number || '',
        country_code: user.country_code || '',
        state: user.state || '',
        city: user.city || '',
        address1: user.address1 || '',
        address2: user.address2 || '',
        phone_country_code: user.phone_country_code || '',
        user_id: user.user_id,
      });
    }
  }, [user]);

  // Fetch countries from API
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const data = await getAllCountries();
        // const res = await apiService.get('/countries');
        setCountries(data);
      } catch (err) {
        console.error('Failed to load countries', err.message);
      }
    };
    fetchCountries();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccess(false);

    try {
        await apiService.put(`/profile/${user.id}`, formData); // Adjust endpoint as needed
        setSuccess(true);
        setFormData((prev) => ({ ...prev, password: '' }));
    } catch (err) {
        console.error('Error updating profile', err);
    } finally {
        setIsSubmitting(false);
    }
  };

  if (loading || !formData) return <div className="p-4">Loading profile...</div>;

  return (
    <>
    <Headbar T={T} user={user} />
    <div className="mt-2 mb-4">
      <div className="bg-white rounded-md p-6 ">
        <h2 className="text-xl font-semibold mb-4">{T.profileinformation}</h2>

        {success && (
          <div className="bg-green-100 text-green-800 px-4 py-2 rounded mb-4">
            {T.profileupdatedsuccessfully}
          </div>
        )}

        <form onSubmit={handleSubmit} className="row">
          <input type="hidden" name="user_id" value={formData.user_id} />

          <div className="col-lg-6 mb-1">
            <label className="block mb-1">{T.name}</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div className="col-lg-6 mb-1">
            <label className="block mb-1">{T.email}</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              readOnly
              className="w-full bg-gray-100 border rounded px-3 py-2"
            />
          </div>

          <div className="col-lg-6 mb-1">
            <label className="block mb-1">{T.password}</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div className="col-lg-6 mb-1">
            <label className="block mb-1">{T.phone}</label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div className="col-lg-6 mb-1">
            <label className="block mb-1">{T.country}</label>
            <select
              name="country_code"
              value={formData.country_code}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              required
            >
              <option value="">{T.select} {T.country}</option>
              {countries.map((c) => (
                <option key={c.alpha2Code} value={c.alpha2Code}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="col-lg-6 mb-1">
            <label className="block mb-1">{T.state}</label>
            <input
              type="text"
              name="state"
              value={formData.state}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div className="col-lg-6 mb-1">
            <label className="block mb-1">{T.city}</label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div className="col-lg-6 mb-1">
            <label className="block mb-1">{T.address}</label>
            <input
              type="text"
              name="address1"
              value={formData.address1}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div className="col-lg-6 mb-1">
            <label className="block mb-1">{T.address} 2</label>
            <input
              type="text"
              name="address2"
              value={formData.address2}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div className="md:col-span-2 mt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded"
            >
              {isSubmitting ? 'Updating...' : T.updateprofile}
            </button>
          </div>
        </form>
      </div>
    </div>
    </>
  );
};

export default ProfilePage;
