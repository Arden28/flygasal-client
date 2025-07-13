
import React from 'react';
import HeroSection from '../../components/client/HeroSection';
import FeaturedFlights from '../../components/client/FeaturedFlights';


const Home = () => {
  return (
    <div className=''>
      {/* Hero Section with background and promotional text */}
      <HeroSection />

      {/* Search Tabs for Flights, Hotels, Tours, Cars, and Visa */}
      {/* <SearchTabs /> */}

      {/* Featured Flights Section */}
      <FeaturedFlights />
    </div>
  );
};

export default Home;
