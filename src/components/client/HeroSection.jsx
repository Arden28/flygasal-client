import React from 'react';
import SearchTabs from './SearchTabs';

const HeroSection = () => {
    return (
        <div className="homepage w-100" style={{ minHeight:"450px", position:"relative" }}>
            <div className="hero">
            </div>
            <div className="container mb-5 mt-5 search-panel">
                {/* Hero text */}
                <div className="" style={{ marginBottom: "50px", position: "relative", zIndex: 10 }}>
                    <h4 className="text-white"><strong>Discover Your Next Adventure</strong></h4>
                    <p className="text-white">Book flights, hotels, tours, and more with ease!</p>
                </div>

                {/* Main search section */}
                <div className="main_search rounded-3">
                    <div className="bgw rounded-3 bg-white">
                        <div className="p-5 hide_loading justify-content-center align-items-center bg-white" style={{ minHeight: "231.4px", display: "none", borderRadius: "8px" }}>
                            <div className="loading_home">
                                <div className="bg-white"></div>
                            </div>
                        </div>
                        {/* Search Tabs */}
                        <SearchTabs />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HeroSection;
