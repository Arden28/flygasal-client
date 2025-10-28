import React, { useState } from 'react';
import FlightSearchForm from './FlightSearchForm';
// import HotelSearchForm from './HotelSearchForm';


const SearchTabs = () => {
  // State to track active tab
  const [activeTab, setActiveTab] = useState('flights');
  // State for flight search results
  const [availableFlights, setAvailableFlights] = useState([]);
  const [returnFlights, setReturnFlights] = useState([]);
  
  const tabs = [
    {
      id: 'flights',
      label: 'Flights',
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width={20}
          height={20}
          className="shrink-0"
        >
          {/* Plane icon rotated to suggest travel */}
          <path
            d="M2 16l20-5-2-3-8 2-5-6-2 1 3 7-6 2z"
            fill="currentColor"
          />
          <path d="M2 19h20" fill="currentColor" />
        </svg>
      ),
    },
    {
      id: 'hotels',
      label: 'Hotels',
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width={20}
          height={20}
          className="shrink-0"
        >
          {/* Simple building icon */}
          <path
            d="M3 3h18v18H3z"
            fill="currentColor"
          />
          <path
            d="M7 7h2v2H7zM11 7h2v2h-2zM15 7h2v2h-2zM7 11h2v2H7zM11 11h2v2h-2zM15 11h2v2h-2zM7 15h2v2H7zM11 15h2v2h-2zM15 15h2v2h-2z"
            fill="white"
          />
        </svg>
      ),
    },
    {
      id: 'cars',
      label: 'Cars',
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width={20}
          height={20}
          className="shrink-0"
        >
          {/* Car silhouette */}
          <path
            d="M5 11l1-3h12l1 3h1a1 1 0 011 1v5a1 1 0 01-1 1h-1a2 2 0 01-4 0H9a2 2 0 01-4 0H4a1 1 0 01-1-1v-5a1 1 0 011-1h1z"
            fill="currentColor"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      {/* Tab selector */}
      <div className="flex justify-center">
        <div className="flex gap-1 rounded-full bg-white/80 shadow-lg backdrop-blur-md">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-medium transition-colors focus:outline-none ${
                  isActive
                    ? 'bg-[#F58220] text-white'
                    : 'bg-transparent text-gray-800 hover:bg-gray-100'
                }`}
              >
                {/* Clone icon to apply currentColor */}
                {tab.icon}
                <span className="capitalize">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
      {/* Search form only for flights (hotel/car forms can be implemented later) */}
      <div className="mt-6">
        {activeTab === 'flights' && (
          <FlightSearchForm setAvailableFlights={setAvailableFlights} setReturnFlights={setReturnFlights} />
        )}
      </div>
    </div>
  );
};

export default SearchTabs;