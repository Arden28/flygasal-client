
import React from 'react';
import HeroSection from '../../components/client/HeroSection';
import FeaturedFlights from '../../components/client/FeaturedFlights';
import AppPromoSection from '../../components/client/AppPromoSection';


const Home = () => {
  return (
    <div className=''>
      {/* Hero Section with background and promotional text */}
      <HeroSection />

      {/* Featured Flights Section */}
      <FeaturedFlights />
      
    </div>
  );
};

export default Home;
