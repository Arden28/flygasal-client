import React, { useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "../../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import apiService from "../../../api/apiService";
import Headbar from "../../../components/client/Headbar";
import { getAllCountries } from "../../../api/countriesService";

const T = {
  profileinformation: "Profile Information",
  subtitle: "Keep your account details up to date.",
  name: "Full Name",
  email: "Email",
  password: "Password",
  phone: "Phone",
  country: "Country",
  state: "State",
  city: "City",
  address: "Address",
  address2: "Address 2",
  select: "Select",
  updateprofile: "Update Profile",
  profileupdatedsuccessfully: "Profile updated successfully",
  something_went_wrong: "Something went wrong. Please try again.",
  updating: "Updating…",
  no_changes: "No changes to save",
  saved_just_now: "Saved just now",
  update_failed: "Update failed",
};

const ProfilePage = ({ rootUrl = "/" }) => {
  const { user, loading } = useContext(AuthContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState(null);
  const [countries, setCountries] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Populate initial form data
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        password: "",
        phone: user.phone_number || "",
        phone_country_code: user.phone_country_code || "",
        country_code: user.country_code || "",
        state: user.state || "",
        city: user.city || "",
        address1: user.address1 || "",
        address2: user.address2 || "",
        user_id: user.user_id || user.id,
      });
    }
  }, [user]);

  // Snapshot for change detection
  const initialSnapshot = useMemo(() => ({
    name: user?.name || "",
    email: user?.email || "",
    password: "",
    phone: user?.phone_number || "",
    phone_country_code: user?.phone_country_code || "",
    country_code: user?.country_code || "",
    state: user?.state || "",
    city: user?.city || "",
    address1: user?.address1 || "",
    address2: user?.address2 || "",
    user_id: user?.user_id || user?.id,
  }), [user]);

  const isChanged = useMemo(() => {
    if (!formData) return false;
    return Object.keys(initialSnapshot).some((k) => String(formData[k] ?? "") !== String(initialSnapshot[k] ?? ""));
  }, [formData, initialSnapshot]);

  // Fetch countries from API
  useEffect(() => {
    (async () => {
      try {
        const data = await getAllCountries();
        setCountries(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load countries", err.message);
      }
    })();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (success) setSuccess(false);
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isChanged) return;

    setIsSubmitting(true);
    setSuccess(false);
    setError("");

    try {
      await apiService.put(`/profile/${user.id}`, formData);
      setSuccess(true);
      setFormData((prev) => ({ ...prev, password: "" }));
    } catch (err) {
      console.error("Error updating profile", err);
      setError(T.something_went_wrong);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !formData) {
    return (
      <div>
        <Headbar T={T} user={user} rootUrl={rootUrl} />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-white rounded-2xl shadow-sm p-6 animate-pulse">
            <div className="h-6 w-56 bg-gray-200 rounded mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 w-24 bg-gray-200 rounded" />
                  <div className="h-10 w-full bg-gray-200 rounded" />
                </div>
              ))}
              <div className="md:col-span-2 mt-2 h-11 bg-gray-200 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Headbar T={T} user={user} rootUrl={rootUrl} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 mb-10">
        {/* Page header */}
        <div className="mb-4">
          <h1 className="text-2xl font-semibold tracking-tight">{T.profileinformation}</h1>
          <p className="text-sm text-gray-600 mt-1">{T.subtitle}</p>
        </div>

        {/* Alerts */}
        {success && (
          <div className="flex items-start gap-3 mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-green-800">
            <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-600 text-white text-xs">✓</span>
            <div>
              <p className="font-medium">{T.profileupdatedsuccessfully}</p>
              <p className="text-sm opacity-80">{T.saved_just_now}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-3 mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-800">
            <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-white text-xs">!</span>
            <div>
              <p className="font-medium">{T.update_failed}</p>
              <p className="text-sm opacity-80">{error}</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <form onSubmit={handleSubmit} className="p-6">
            <input type="hidden" name="user_id" value={formData.user_id} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">{T.name}</label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="block w-full rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 px-3 py-2.5 transition"
                />
              </div>

              {/* Email (read-only) */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">{T.email}</label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  readOnly
                  className="block w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-gray-600"
                />
                <p className="mt-1 text-xs text-gray-500">This email is linked to your account.</p>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">{T.password}</label>
                <input
                  id="password"
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="block w-full rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 px-3 py-2.5 transition"
                />
                <p className="mt-1 text-xs text-gray-500">Leave blank to keep your current password.</p>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{T.phone}</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="phone_country_code"
                    value={formData.phone_country_code}
                    onChange={handleChange}
                    placeholder="+254"
                    className="w-28 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 px-3 py-2.5 transition"
                  />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="712 345 678"
                    className="flex-1 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 px-3 py-2.5 transition"
                  />
                </div>
              </div>

              {/* Country */}
              <div>
                <label htmlFor="country_code" className="block text-sm font-medium text-gray-700 mb-1">{T.country}</label>
                <select
                  id="country_code"
                  name="country_code"
                  value={formData.country_code}
                  onChange={handleChange}
                  className="block w-full rounded-xl border border-gray-300 px-3 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  required
                >
                  <option value="">{T.select} {T.country}</option>
                  {countries.map((c) => (
                    <option key={c.alpha2Code || c.code} value={c.alpha2Code || c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* State */}
              <div>
                <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">{T.state}</label>
                <input
                  id="state"
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="block w-full rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 px-3 py-2.5 transition"
                />
              </div>

              {/* City */}
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">{T.city}</label>
                <input
                  id="city"
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="block w-full rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 px-3 py-2.5 transition"
                />
              </div>

              {/* Address 1 */}
              <div>
                <label htmlFor="address1" className="block text-sm font-medium text-gray-700 mb-1">{T.address}</label>
                <input
                  id="address1"
                  type="text"
                  name="address1"
                  value={formData.address1}
                  onChange={handleChange}
                  className="block w-full rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 px-3 py-2.5 transition"
                />
              </div>

              {/* Address 2 */}
              <div>
                <label htmlFor="address2" className="block text-sm font-medium text-gray-700 mb-1">{T.address2}</label>
                <input
                  id="address2"
                  type="text"
                  name="address2"
                  value={formData.address2}
                  onChange={handleChange}
                  className="block w-full rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 px-3 py-2.5 transition"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                type="submit"
                disabled={isSubmitting || !isChanged}
                className={`inline-flex justify-center items-center gap-2 rounded-xl px-4 py-2.5 text-white shadow-sm transition focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed ${
                  isSubmitting || !isChanged ? "bg-blue-500" : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {isSubmitting ? T.updating : T.updateprofile}
              </button>

              {success && (
                <span className="inline-flex items-center gap-2 text-sm text-green-700">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                  </span>
                  {T.saved_just_now}
                </span>
              )}

              {!isChanged && !isSubmitting && (
                <span className="text-sm text-gray-500">{T.no_changes}</span>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
