import React, { useState } from 'react';
import FlightSearchForm from './FlightSearchForm';
// import HotelSearchForm from './HotelSearchForm';

const SearchTabs = () => {
  // State to track active tab
  const [activeTab, setActiveTab] = useState('flights');
  // State for flight search results
  const [availableFlights, setAvailableFlights] = useState([]);
  const [returnFlights, setReturnFlights] = useState([]);

  // Handle tab click
  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
  };

  return (
    <>
      <div className="mx-auto mt-2 mb-2 flex w-full max-w-3xl items-center justify-center gap-2">
        <div className="bg-white/20 flex gap-1 backdrop-blur-md p-2 rounded-2xl">
            <button 
              className={`pill ${activeTab === 'flights' ? 'active text-slate-900' : ''}  px-4 py-2 text-sm font-medium hover:bg-white/90`}
              onClick={() => handleTabClick('flights')}
              type="button"
              role="tab"
              aria-controls="tab-flights"
              aria-selected={activeTab === 'flights'}>
                <svg style={{ transform: "rotate(90deg)" }} viewBox="0 0 24 24" width="25" height="25" fill={`${activeTab === 'flights' ? '#333333' : '#fff'}`} className="d-inline-block">
                  <path d="M5.557 5.565c.45-.45.713-.435 1.163-.06l.105.09a.75.75 0 0 1 .112.105l.255.255 3 3.293a.667.667 0 0 0 .675.195l1.988-.555a.682.682 0 0 0 .48-.75l-.045-.165a.376.376 0 0 1 0-.09l.075-.105c.067-.075.135-.158.21-.233l.113-.105c.12-.12.247-.127.33-.052l.682.682a.667.667 0 0 0 .66.173l2.37-.675a1.013 1.013 0 0 1 .982.217l.06.06h-.052l-6.105 2.82a.676.676 0 0 0-.217 1.065l3.217 3.525a.667.667 0 0 0 .75.158l1.5-.698a.188.188 0 0 1 .248.038.173.173 0 0 1 0 .217L15 18.098l-.082.097a.165.165 0 0 1-.233.045.172.172 0 0 1-.068-.195l.075-.135.69-1.5a.668.668 0 0 0-.157-.75l-3.518-3.217a.674.674 0 0 0-1.072.217l-2.85 6.09-.045-.052h-.038a1.012 1.012 0 0 1-.202-.96l.682-2.385a.667.667 0 0 0-.172-.66l-.698-.705a.187.187 0 0 1 0-.263l.12-.127a2.36 2.36 0 0 1 .24-.218l.105-.075h.18a.674.674 0 0 0 .863-.45l.57-2.01a.683.683 0 0 0-.195-.682l-3.293-3-.187-.18a1.92 1.92 0 0 1-.465-.63c-.09-.24 0-.45.3-.788h.007Zm10.373 13.5 3.082-3.075a1.5 1.5 0 0 0 .24-1.965l-.06-.90a1.5 1.5 0 0 0-1.875-.435l-1.035.473-2.25-2.475 5.25-2.438h.06a1.328 1.328 0 0 0 .33-2.205l-.044-.105-.128-.09a2.318 2.318 0 0 0-2.198-.45l-1.95.54-.42-.427a1.56 1.56 0 0 0-2.182.082 3.761 3.761 0 0 0-.75.863v.075a.668.668 0 0 0-.06.24v.165l-1.012.277-2.806-3.052-.18-.188a4.337 4.337 0 0 0-.36-.285 2.002 2.002 0 0 0-3 .15 1.995 1.995 0 0 0-.6 2.25l.045.105c.23.474.563.889.975 1.215l3 2.753-.3 1.035h-.165a.646.646 0 0 0-.307.097 3.54 3.54 0 0 0-.75.585l-.24.248a1.553 1.553 0 0 0 .06 2.047l.435.443-.563 1.987a2.325 2.325 0 0 0 .533 2.25l.052.053A1.327 1.327 0 0 0 9 19.365v-.067l2.43-5.25 2.475 2.25-.473 1.035.068-.083a1.516 1.516 0 1 0 2.453 1.778" fill-rule="evenodd"></path>
                </svg>
                <span className={`${activeTab === 'flights' ? 'color-[#333333]' : ''}`}>Flights</span>
              </button>
            <button 
              className={`pill ${activeTab === 'hotels' ? 'active text-slate-900' : ''}  px-4 py-2 text-sm font-medium hover:bg-white/90`}
              onClick={() => handleTabClick('hotels')}
              type="button"
              role="tab"
              aria-controls="tab-hotels"
              aria-selected={activeTab === 'hotels'}>
                <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill={`${activeTab === 'hotels' ? '#333333' : '#fff'}`}  class="bi bi-buildings-fill d-inline-block" viewBox="0 0 24 24">
                  <path d="M15 .5a.5.5 0 0 0-.724-.447l-8 4A.5.5 0 0 0 6 4.5v3.14L.342 9.526A.5.5 0 0 0 0 10v5.5a.5.5 0 0 0 .5.5h9a.5.5 0 0 0 .5-.5V14h1v1.5a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5zM2 11h1v1H2zm2 0h1v1H4zm-1 2v1H2v-1zm1 0h1v1H4zm9-10v1h-1V3zM8 5h1v1H8zm1 2v1H8V7zM8 9h1v1H8zm2 0h1v1h-1zm-1 2v1H8v-1zm1 0h1v1h-1zm3-2v1h-1V9zm-1 2h1v1h-1zm-2-4h1v1h-1zm3 0v1h-1V7zm-2-2v1h-1V5zm1 0h1v1h-1z"/>
                </svg>
                <span className={`${activeTab === 'hotels' ? 'color-[#333333]' : ''}`}>hotels</span>
              </button>
            <button 
              className={`pill ${activeTab === 'cars' ? 'active text-slate-900' : ''}  px-4 py-2 text-sm font-medium hover:bg-white/90`}
              onClick={() => handleTabClick('cars')}
              type="button"
              role="tab"
              aria-controls="tab-cars"
              aria-selected={activeTab === 'cars'}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 640 640" fill={`${activeTab === 'cars' ? '#333333' : '#fff'}`} class="d-inline-block">
                  <path d="M199.2 181.4L173.1 256L466.9 256L440.8 181.4C436.3 168.6 424.2 160 410.6 160L229.4 160C215.8 160 203.7 168.6 199.2 181.4zM103.6 260.8L138.8 160.3C152.3 121.8 188.6 96 229.4 96L410.6 96C451.4 96 487.7 121.8 501.2 160.3L536.4 260.8C559.6 270.4 576 293.3 576 320L576 512C576 529.7 561.7 544 544 544L512 544C494.3 544 480 529.7 480 512L480 480L160 480L160 512C160 529.7 145.7 544 128 544L96 544C78.3 544 64 529.7 64 512L64 320C64 293.3 80.4 270.4 103.6 260.8zM192 368C192 350.3 177.7 336 160 336C142.3 336 128 350.3 128 368C128 385.7 142.3 400 160 400C177.7 400 192 385.7 192 368zM480 400C497.7 400 512 385.7 512 368C512 350.3 497.7 336 480 336C462.3 336 448 350.3 448 368C448 385.7 462.3 400 480 400z"/>
                </svg>
                <span className={`${activeTab === 'cars' ? 'color-[#333333]' : ''}`}>Cars</span>
              </button>
        </div>
      </div>
      <div className="border p-3 pt-0 bg-white shadow-sm rounded-2xl" id="tab-group-events">
        <div className="tab-content mt-2 p-0" id="tab">
          {/* Flights */}
          <div className={`tab-pane fade ${activeTab === 'flights' ? 'show active' : ''}`} id="tab-flights" role="tabpanel" tabindex="0">
            {/* Flight Search Form */}
            <FlightSearchForm setAvailableFlights={setAvailableFlights} setReturnFlights={setReturnFlights} />
          </div>
          
        </div>
      </div>
    </>
  );
};

export default SearchTabs;