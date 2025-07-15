// src/pages/ConfirmationSuccessPage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

const ConfirmationSuccessPage = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto py-12 text-center">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">Booking Confirmed!</h1>
      <p className="text-gray-600 mb-6">Your flight booking has been successfully completed.</p>
      <button
        className="bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg hover:bg-blue-800 transition duration-200"
        onClick={() => navigate('/')}
      >
        Return to Home
      </button>
    </div>
  );
};

export default ConfirmationSuccessPage;