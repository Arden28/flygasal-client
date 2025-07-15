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
    <div className="ShowSearchBox rounded-5" style={{ display: "block" }}>
      {/* Search tabs */}
      <ul className="nav nav-tabs mb-3 d-flex gap-0 p-0" id="tab" role="tablist">
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link w-100 ${activeTab === 'flights' ? 'active' : ''}`}
            onClick={() => handleTabClick('flights')}
            type="button"
            role="tab"
            aria-controls="tab-flights"
            aria-selected={activeTab === 'flights'}
          >
            <svg style={{ transform: "rotate(90deg)" }} viewBox="0 0 24 24" width="25" height="25" fill="#333333" className="d-inline-block">
              <path d="M5.557 5.565c.45-.45.713-.435 1.163-.06l.105.09a.75.75 0 0 1 .112.105l.255.255 3 3.293a.667.667 0 0 0 .675.195l1.988-.555a.682.682 0 0 0 .48-.75l-.045-.165a.376.376 0 0 1 0-.09l.075-.105c.067-.075.135-.158.21-.233l.113-.105c.12-.12.247-.127.33-.052l.682.682a.667.667 0 0 0 .66.173l2.37-.675a1.013 1.013 0 0 1 .982.217l.06.06h-.052l-6.105 2.82a.676.676 0 0 0-.217 1.065l3.217 3.525a.667.667 0 0 0 .75.158l1.5-.698a.188.188 0 0 1 .248.038.173.173 0 0 1 0 .217L15 18.098l-.082.097a.165.165 0 0 1-.233.045.172.172 0 0 1-.068-.195l.075-.135.69-1.5a.668.668 0 0 0-.157-.75l-3.518-3.217a.674.674 0 0 0-1.072.217l-2.85 6.09-.045-.052h-.038a1.012 1.012 0 0 1-.202-.96l.682-2.385a.667.667 0 0 0-.172-.66l-.698-.705a.187.187 0 0 1 0-.263l.12-.127a2.36 2.36 0 0 1 .24-.218l.105-.075h.18a.674.674 0 0 0 .863-.45l.57-2.01a.683.683 0 0 0-.195-.682l-3.293-3-.187-.18a1.92 1.92 0 0 1-.465-.63c-.09-.24 0-.45.3-.788h.007Zm10.373 13.5 3.082-3.075a1.5 1.5 0 0 0 .24-1.965l-.06-.90a1.5 1.5 0 0 0-1.875-.435l-1.035.473-2.25-2.475 5.25-2.438h.06a1.328 1.328 0 0 0 .33-2.205l-.044-.105-.128-.09a2.318 2.318 0 0 0-2.198-.45l-1.95.54-.42-.427a1.56 1.56 0 0 0-2.182.082 3.761 3.761 0 0 0-.75.863v.075a.668.668 0 0 0-.06.24v.165l-1.012.277-2.806-3.052-.18-.188a4.337 4.337 0 0 0-.36-.285 2.002 2.002 0 0 0-3 .15 1.995 1.995 0 0 0-.6 2.25l.045.105c.23.474.563.889.975 1.215l3 2.753-.3 1.035h-.165a.646.646 0 0 0-.307.097 3.54 3.54 0 0 0-.75.585l-.24.248a1.553 1.553 0 0 0 .06 2.047l.435.443-.563 1.987a2.325 2.325 0 0 0 .533 2.25l.052.053A1.327 1.327 0 0 0 9 19.365v-.067l2.43-5.25 2.475 2.25-.473 1.035.068-.083a1.516 1.516 0 1 0 2.453 1.778" fill-rule="evenodd"></path>
            </svg>
            <span style={{ color: "#333333" }}>Flights</span>
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link w-100 ${activeTab === 'hotels' ? 'active' : ''}`}
            onClick={() => handleTabClick('hotels')}
            type="button"
            role="tab"
            aria-controls="tab-hotels"
            aria-selected={activeTab === 'hotels'}
          >
            <svg viewBox="0 0 24 24" width="25" height="25" fill="#333333" className="d-inline-block">
              <path d="M14.655 3.75a.675.675 0 0 1 .67.59l.005.085h2.595A2.175 2.175 0 0 1 20.1 6.6v12.067a1.425 1.425 0 0 1-1.425 1.425H5.107c-.75 0-1.357-.607-1.357-1.357v-7.966a2.228 2.228 0 0 1 2.047-2.242v-.015a.675.675 0 0 1 1.345-.085l.005.085v.007h2.738v-1.92a2.175 2.175 0 0 1 2.047-2.17v-.004a.675.675 0 0 1 1.345-.085l.006.085h.697a.674.674 0 0 1 .675-.675Zm-4.77 6.12H5.97a.877.877 0 0 0-.545.196l-.073.067a.879.879 0 0 0-.251.63v7.972c0 .003.003.007.007.007h4.778V9.87h-.001Zm2.712-4.096h-.537a.825.825 0 0 0-.825.826v12.142h2.063v-1.305a1.425 1.425 0 0 1 1.313-1.42l.111-.005h.548c.788 0 1.425.638 1.425 1.425v1.304l1.98.001a.07.07 0 0 0 .052-.022l.017-.023.006-.30V6.6a.825.825 0 0 0-.825-.825h-3.27l-.01-.001h-2.048Zm2.673 11.588h-.547a.075.075 0 0 0-.075.075v1.304h.697v-1.304a.075.075 0 0 0-.023-.052l-.023-.017-.029-.006Zm-6.758-.99a.675.675 0 0 1 .085 1.345l-.085.005h-2.04a.676.676 0 0 1-.084-1.345l.084-.005h2.04Zm0-2.76a.675.675 0 0 1 .085 1.345l-.085.005h-2.04a.676.676 0 0 1-.084-1.345l.084-.005h2.04Zm5.46-.322a.675.675 0 0 1 .085 1.345l-.085.005h-1.364a.676.676 0 0 1-.085-1.345l.085-.005h1.364Zm3.406 0a.675.675 0 0 1 .084 1.345l-.084.005h-1.366a.676.676 0 0 1-.084-1.345l.084-.005h1.366Zm-8.866-2.438a.675.675 0 0 1 .085 1.345l-.085.005h-2.04a.676.676 0 0 1-.084-1.345l.084-.005h2.04Zm5.46-.292a.675.675 0 0 1 .085 1.345l-.085.005h-1.364a.676.676 0 0 1-.085-1.345l.085-.005h1.364Zm3.406 0a.675.675 0 0 1 .084 1.345l-.084.005h-1.366a.676.676 0 0 1-.084-1.345l.084-.005h1.366Zm-3.405-2.723a.675.675 0 0 1 .084 1.345l-.085.005h-1.364a.675.675 0 0 1-.085-1.344l.085-.006h1.364Zm3.405 0a.675.675 0 0 1 .084 1.345l-.084.005h-1.366a.675.675 0 0 1-.084-1.344l.084-.006h1.366Z" fill-rule="evenodd"></path>
            </svg>
            <span style={{ color: "#333333" }}>Hotels</span>
          </button>
        </li>
      </ul>
      {/* Tab content */}
      <div className="border rounded p-3 main_search bg-white shadow-sm" id="tab-group-events">
        <div className="tab-content" id="tab">
          {/* Hotels */}
          <div className={`tab-pane fade ${activeTab === 'hotels' ? 'show active' : ''}`} id="tab-hotels" role="tabpanel" tabindex="0">
            <form id="hotels-search" className="content m-0 search_box">
              <div className="row mb-3 g-2" style={{ justifyContent: "space-between" }}>
                {/* Destination */}
                <div className="col-lg-3">
                  <div className="input-items">
                    <div className="mt-1 pl-2 position-absolute z-1">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                      </svg>
                    </div>
                    <div className="form-floating">
                      <input id="hotel-destination" name="destination" className="form-control" type="text" autocomplete="off" value="Dubai" required />
                      <label style={{ margin: "0 24px" }} for="hotel-destination">Destination</label>
                    </div>
                  </div>
                </div>
                {/* Check-in and Check-out Dates */}
                <div className="col-lg-3">
                  <div className="row g-2">
                    <div className="col">
                      <div className="form-floating">
                        <input className="checkin form-control" id="checkin" name="checkin" type="text" autocomplete="off" value="14-07-2025" />
                        <label for="checkin">
                          <i className="bi bi-calendar"></i>
                          Check-in Date
                        </label>
                      </div>
                    </div>
                    <div className="col">
                      <div className="form-floating">
                        <input className="checkout form-control" id="checkout" name="checkout" type="text" autocomplete="off" value="16-07-2025" />
                        <label for="checkout">
                          <i className="bi bi-calendar"></i>
                          Check-out Date
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Travellers and Rooms */}
                <div className="col-lg-3">
                  <div className="input-box">
                    <div className="form-group">
                      <div className="dropdown dropdown-contain">
                        <a className="dropdown-toggle dropdown-btn travellers" href="javascript:void(0)" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                          <p>
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                              <circle cx="9" cy="7" r="4"></circle>
                              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                            </svg>
                            Travellers & Rooms <span className="guest_hotels">1 Adult, 1 Room</span>
                          </p>
                        </a>
                        <div className="dropdown-menu dropdown-menu-wrap w-100 shadow-sm rounded-3 mt-1 p-3" style={{ minWidth: "250px" }}>
                          <div className="dropdown-item adult_qty">
                            <div className="qty-box d-flex align-items-center justify-content-between py-2">
                              <label style={{ lineHeight: "16px" }}>
                                <strong>Adults</strong>
                                <div className="clear"></div>
                                <small style={{ fontSize: "10px" }}>+12 years</small>
                              </label>
                              <div className="qtyBtn d-flex align-items-center">
                                <button className="btn btn-outline-secondary btn-sm qtyDec">-</button>
                                <input type="text" name="adults" id="hadults" value="1" className="qtyInput_hotels form-control mx-2" style={{ width: "50px", textAlign: "center" }} />
                                <button className="btn btn-outline-secondary btn-sm qtyInc">+</button>
                              </div>
                            </div>
                          </div>
                          <div className="dropdown-item child_qty">
                            <div className="qty-box d-flex align-items-center justify-content-between py-2">
                              <label style={{ lineHeight: "16px" }}>
                                <strong>Children</strong>
                                <div className="clear"></div>
                                <small style={{ fontSize: "10px" }}>2 - 11 years</small>
                              </label>
                              <div className="qtyBtn d-flex align-items-center">
                                <button className="btn btn-outline-secondary btn-sm qtyDec">-</button>
                                <input type="text" name="childs" id="hchilds" value="0" className="qtyInput_hotels form-control mx-2" style={{ width: "50px", textAlign: "center" }} />
                                <button className="btn btn-outline-secondary btn-sm qtyInc">+</button>
                              </div>
                            </div>
                          </div>
                          <div className="dropdown-item room_qty">
                            <div className="qty-box d-flex align-items-center justify-content-between py-2">
                              <label style={{ lineHeight: "16px" }}>
                                <strong>Rooms</strong>
                                <div className="clear"></div>
                                <small style={{ fontSize: "10px" }}>Number of rooms</small>
                              </label>
                              <div className="qtyBtn d-flex align-items-center">
                                <button className="btn btn-outline-secondary btn-sm qtyDec">-</button>
                                <input type="text" name="rooms" id="hrooms" value="1" className="qtyInput_hotels form-control mx-2" style={{ width: "50px", textAlign: "center" }} />
                                <button className="btn btn-outline-secondary btn-sm qtyInc">+</button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Search Button */}
                <div className="col-lg-1">
                  <button style={{ height: "64px" }} type="submit" id="hotels-search-btn" className="search_button w-100 btn btn-primary btn-m rounded-sm font-700 text-uppercase btn-full">
                    <svg style={{ fill: "currentColor" }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" className="c8LPF-icon" role="img" height="24">
                      <path d="M174.973 150.594l-29.406-29.406c5.794-9.945 9.171-21.482 9.171-33.819C154.737 50.164 124.573 20 87.368 20S20 50.164 20 87.368s30.164 67.368 67.368 67.368c12.345 0 23.874-3.377 33.827-9.171l29.406 29.406c6.703 6.703 17.667 6.703 24.371 0c6.704-6.702 6.704-17.674.001-24.377zM36.842 87.36c0-27.857 22.669-50.526 50.526-50.526s50.526 22.669 50.526 50.526s-22.669 50.526-50.526 50.526s-50.526-22.669-50.526-50.526z"></path>
                    </svg>
                  </button>
                  <div className="loading_button" style={{ display: "none" }}>
                    <button style={{ height: "64px" }} className="loading_button gap-2 w-100 btn btn-primary btn-m rounded-sm font-700 text-uppercase btn-full" type="button" disabled>
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    </button>
                  </div>
                </div>
              </div>
            </form>
            {/* Hotel Results */}
            <div className="row g-3 append_template justify-content-md-center mt-3">
              {/* Hotel results will be appended here */}
            </div>
          </div>
          {/* Flights */}
          <div className={`tab-pane fade ${activeTab === 'flights' ? 'show active' : ''}`} id="tab-flights" role="tabpanel" tabindex="0">
            {/* Flight Search Form */}
            <FlightSearchForm setAvailableFlights={setAvailableFlights} setReturnFlights={setReturnFlights} />
          </div>
          <div className="tab-pane fade" id="tab-tours" role="tabpanel" tabindex="0">
            <p>Tours Search Form Placeholder</p>
          </div>
          <div className="tab-pane fade" id="tab-cars" role="tabpanel" tabindex="0">
            <p>Cars Search Form Placeholder</p>
          </div>
          <div className="tab-pane fade" id="tab-visa" role="tabpanel" tabindex="0">
            <p>Visa Search Form Placeholder</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchTabs;