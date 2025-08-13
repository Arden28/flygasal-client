import React, { useContext, useEffect, useState } from "react";
import Headbar from "../../../components/client/Headbar";
import { AuthContext } from "../../../context/AuthContext";
import { T } from "../../../utils/translation";
import apiService from "../../../api/apiService";


const AgencyPage = ({
    rootUrl = '/'
}) => {

    const { user, loading } = useContext(AuthContext);
    const [formData, setFormData] = useState(null);
      const [countries, setCountries] = useState([]);
      const [isSubmitting, setIsSubmitting] = useState(false);
      const [success, setSuccess] = useState(false);

    // Populate initial form data
    useEffect(() => {
        if (user) {
        setFormData({
            agency_name: user.agency_name || '',
            agency_license: user.agency_license || '',
            agency_city: user.agency_city || '',
            country_code: user.country_code || '',
            agency_address: user.agency_address || '',
            agency_logo: user.agency_logo || '',
        });
        }
    }, [user]);

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
        <div>
            <Headbar T={T} rootUrl={rootUrl} user={user} />
            <div className="mt-2 mb-4">
            <div className="bg-white rounded-md p-6 ">
                <h2 className="text-xl font-semibold mb-4">{T.agencyinformation}</h2>

                {success && (
                <div className="bg-green-100 text-green-800 px-4 py-2 rounded mb-4">
                    {T.agencyupdatedsuccessfully}
                </div>
                )}

                <form onSubmit={handleSubmit} className="row">
                <input type="hidden" name="user_id" value={formData.user_id} />

                <div className="col-lg-6 mb-1">
                    <label className="block mb-1">{T.agency_name}</label>
                    <input
                    type="text"
                    name="agency_name"
                    value={formData.agency_name}
                    onChange={handleChange}
                    required
                    className="w-full border rounded px-3 py-2"
                    />
                </div>

                <div className="col-lg-6 mb-1">
                    <label className="block mb-1">{T.agency_license}</label>
                    <input
                    type="text"
                    name="agency_license"
                    value={formData.agency_license}
                    readOnly
                    className="w-full bg-gray-100 border rounded px-3 py-2"
                    />
                </div>

                <div className="col-lg-6 mb-1">
                    <label className="block mb-1">{T.agency_city}</label>
                    <input
                    type="text"
                    name="agency_city"
                    value={formData.agency_city}
                    onChange={handleChange}
                    placeholder="City"
                    className="w-full border rounded px-3 py-2"
                    />
                </div>

                <div className="col-lg-6 mb-1">
                    <label className="block mb-1">{T.agency_address}</label>
                    <input
                    type="text"
                    name="agency_address"
                    value={formData.agency_address}
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
                    {isSubmitting ? 'Updating...' : T.updateagency}
                    </button>
                </div>
                </form>
            </div>
            </div>

        </div>
    );
};

export default AgencyPage;