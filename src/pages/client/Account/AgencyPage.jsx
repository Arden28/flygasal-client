import React, { useContext, useEffect, useMemo, useState } from "react";
import Headbar from "../../../components/client/Headbar";
import { AuthContext } from "../../../context/AuthContext";
import { T } from "../../../utils/translation";
import apiService from "../../../api/apiService";

/**
 * AgencyPage (Refined)
 * - Cleaner visual hierarchy: contained width, card layout, section headers
 * - Consistent spacing & grid, mobile-first, accessible labels & help text
 * - Inline success/error banners, subtle loading skeletons
 * - Safer inputs (number for % with min/max), readOnly license field styling
 * - Prevents submit when unchanged; shows "Saved" pulse after success
 */
const AgencyPage = ({ rootUrl = "/" }) => {
  const { user, loading } = useContext(AuthContext);

  const [formData, setFormData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Initialize form data from user once available
  useEffect(() => {
    if (user) {
      setFormData({
        agency_name: user.agency_name || "",
        agency_license: user.agency_license || "",
        agency_city: user.agency_city || "",
        country_code: user.country_code || "",
        agency_address: user.agency_address || "",
        agency_logo: user.agency_logo || "",
        agency_markup: user.agency_markup ?? "",
      });
    }
  }, [user]);

  const initialSnapshot = useMemo(() => ({
    agency_name: user?.agency_name || "",
    agency_license: user?.agency_license || "",
    agency_city: user?.agency_city || "",
    country_code: user?.country_code || "",
    agency_address: user?.agency_address || "",
    agency_logo: user?.agency_logo || "",
    agency_markup: user?.agency_markup ?? "",
  }), [user]);

  const isChanged = useMemo(() => {
    if (!formData) return false;
    return Object.keys(initialSnapshot).some(k => String(formData[k] ?? "") !== String(initialSnapshot[k] ?? ""));
  }, [formData, initialSnapshot]);

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
    } catch (err) {
      console.error("Error updating profile", err);
      setError(T.something_went_wrong || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !formData) {
    return (
      <div>
        <Headbar T={T} rootUrl={rootUrl} user={user} />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-white rounded-2xl shadow-sm p-6 animate-pulse">
            <div className="h-6 w-48 bg-gray-200 rounded mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
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
      <Headbar T={T} rootUrl={rootUrl} user={user} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 mb-10">
        {/* Page header */}
        <div className="mb-4">
          <h1 className="text-2xl font-semibold tracking-tight">{T.agencyinformation}</h1>
          <p className="text-sm text-gray-600 mt-1">{T.update_your_agency_profile || "Update your agency details and pricing preferences."}</p>
        </div>

        {/* Alerts */}
        {success && (
          <div className="flex items-start gap-3 mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-green-800">
            <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-600 text-white text-xs">✓</span>
            <div>
              <p className="font-medium">{T.agencyupdatedsuccessfully}</p>
              <p className="text-sm opacity-80">{T.changes_saved || "Your changes have been saved."}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-3 mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-800">
            <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-white text-xs">!</span>
            <div>
              <p className="font-medium">{T.update_failed || "Update failed"}</p>
              <p className="text-sm opacity-80">{error}</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Agency Name */}
              <div>
                <label htmlFor="agency_name" className="block text-sm font-medium text-gray-700 mb-1">{T.agency_name}</label>
                <input
                  id="agency_name"
                  type="text"
                  name="agency_name"
                  value={formData.agency_name}
                  onChange={handleChange}
                  required
                  placeholder={T.company_placeholder || "e.g., FlyGasal Ltd"}
                  className="block w-full rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 px-3 py-2.5 transition"
                />
              </div>

              {/* License (read-only) */}
              <div>
                <label htmlFor="agency_license" className="block text-sm font-medium text-gray-700 mb-1">{T.agency_license}</label>
                <input
                  id="agency_license"
                  type="text"
                  name="agency_license"
                  value={formData.agency_license}
                  readOnly
                  className="block w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-gray-600"
                />
                <p className="mt-1 text-xs text-gray-500">{T.license_readonly_hint || "This field is managed by compliance."}</p>
              </div>

              {/* City */}
              <div>
                <label htmlFor="agency_city" className="block text-sm font-medium text-gray-700 mb-1">{T.agency_city}</label>
                <input
                  id="agency_city"
                  type="text"
                  name="agency_city"
                  value={formData.agency_city}
                  onChange={handleChange}
                  placeholder={T.city_placeholder || "e.g., Nairobi"}
                  className="block w-full rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 px-3 py-2.5 transition"
                />
              </div>

              {/* Address */}
              <div>
                <label htmlFor="agency_address" className="block text-sm font-medium text-gray-700 mb-1">{T.agency_address}</label>
                <input
                  id="agency_address"
                  type="text"
                  name="agency_address"
                  value={formData.agency_address}
                  onChange={handleChange}
                  placeholder={T.address_placeholder || "Street, Building, Suite"}
                  className="block w-full rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 px-3 py-2.5 transition"
                />
              </div>

              {/* Logo URL */}
              <div className="md:col-span-2">
                <label htmlFor="agency_logo" className="block text-sm font-medium text-gray-700 mb-1">{T.agency_logo || "Agency Logo (URL)"}</label>
                <div className="flex items-center gap-3">
                  <input
                    id="agency_logo"
                    type="url"
                    name="agency_logo"
                    value={formData.agency_logo}
                    onChange={handleChange}
                    placeholder={T.logo_url_placeholder || "https://..."}
                    className="block w-full rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 px-3 py-2.5 transition"
                  />
                  {formData.agency_logo ? (
                    <img
                      src={formData.agency_logo}
                      alt="Logo preview"
                      className="h-10 w-10 rounded-lg object-contain border border-gray-200"
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                  ) : null}
                </div>
                <p className="mt-1 text-xs text-gray-500">{T.logo_help || "Paste a public image URL for best results."}</p>
              </div>
            </div>

            {/* Divider */}
            <div className="my-6 h-px w-full bg-gray-100" />

            {/* Markups */}
            <div className="mb-4">
              <h2 className="text-lg font-semibold tracking-tight">{T.markupsinformation}</h2>
              <p className="text-sm text-gray-600 mt-1">{T.markup_help || "Set a default markup applied to fares (0–100%)."}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="agency_markup" className="block text-sm font-medium text-gray-700 mb-1">{T.agency_markup}</label>
                <div className="relative">
                  <input
                    id="agency_markup"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    max={100}
                    step="0.1"
                    name="agency_markup"
                    value={formData.agency_markup}
                    onChange={handleChange}
                    placeholder="0"
                    className="block w-full rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 pr-12 px-3 py-2.5 transition"
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500">%</span>
                </div>
                <p className="mt-1 text-xs text-gray-500">{T.markup_note || "You can override this per booking or fare class."}</p>
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
                {isSubmitting ? (T.updating || "Updating…") : (T.updateagency)}
              </button>

              {success && (
                <span className="inline-flex items-center gap-2 text-sm text-green-700">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                  </span>
                  {T.saved_just_now || "Saved just now"}
                </span>
              )}

              {!isChanged && !isSubmitting && (
                <span className="text-sm text-gray-500">{T.no_changes || "No changes to save"}</span>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AgencyPage;
