import React from 'react';
import SearchTabs from './SearchTabs';

const HeroSection = () => {
    return (
        
        <div 
            className="w-100 p-3 bg-cover bg-center" 
            style={{ minHeight:"550px", position:"relative", backgroundImage: 'url("/assets/img/flight.jpg")' }}
            >
            {/* <div className="hero">
            </div> */}
            <div className="container " style={{ marginTop: '83px' }}>
                {/* Hero text */}
                <div className="" style={{ marginBottom: "60px", position: "relative", zIndex: 10 }}>
                    <h4 className="text-white"><strong>Discover Your Next Adventure</strong></h4>
                    <p className="text-white">Book flights, hotels, tours, and more with ease!</p>
                </div>

                {/* Main search section */}
                <div className="main_search rounded-3">
                    <div className=" rounded-3 bg-white">
                        {/* Search Tabs */}
                        <SearchTabs />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HeroSection;
