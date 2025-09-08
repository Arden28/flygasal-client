
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
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
          <h1 className="text-center text-2xl sm:text-4xl font-semibold text-slate-900">The future of flight booking has landed</h1>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="tile bg-aa.lavender p-6 bg-[#EEEDFB]">
              <img src="/assets/img/icons/plane.svg" className="h-10 w-10" alt="" />
              <h3 className="mt-4 text-xl font-semibold">Find your perfect flight</h3>
              <p className="mt-2 text-slate-700">Compare 600+ airlines, add extras, and pick from 40+ ways to pay.</p>
            </div>
            <div className="tile bg-aa.lavender p-6 bg-[#EEEDFB]">
              <img src="/assets/img/icons/calendar.svg" className="h-10 w-10" alt="" />
              <h3 className="mt-4 text-xl font-semibold">Pay over time</h3>
              <p className="mt-2 text-slate-700">Exclusive partners let you spread the cost, or pay later.</p>
            </div>
            <div className="tile bg-aa.lavender p-6 bg-[#EEEDFB]">
              <img src="/assets/img/icons/lock.svg" className="h-10 w-10" alt="" />
              <h3 className="mt-4 text-xl font-semibold">Book with confidence</h3>
              <p className="mt-2 text-slate-700">Next-level support, instant confirmation, and protection.</p>
            </div>
          </div>
        </div>
      </section>


      {/* Large Testimonials */}
      <section className="relative w-full">
        <div className="relative min-h-[680px] w-full bg-center bg-cover"
             style={{ backgroundImage: "url('/assets/img/bottom-tp-block-3.webp')" }}>
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.55),rgba(0,0,0,0.25)_45%,rgba(0,0,0,0.25)_55%,rgba(0,0,0,0.2))]"></div>

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-aa.star/20 px-3 py-1 text-aa.star">
                  <img src="/assets/img/trustpilot-5star.svg" className="inline-block h-[20px] bg-aa.star rounded" />
                  <span className="text-white/90">Verified by Trustpilot</span>
              </div>
              <h3 className="mt-4 text-white text-3xl sm:text-4xl font-semibold leading-tight">
                “Fly Gasal made it possible for me to visit my family whom I hadn't seen in 5+ years.
                With everything so expensive, their payment plans made everything more affordable.”
              </h3>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Flights Section */}
      <section class="bg-white">
        <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <h3 class="text-center text-3xl sm:text-4xl font-extrabold">Destinations ready for you to explore</h3>
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              { name: "Australia", img: "/assets/img/destinations/australia.webp" },
              { name: "Canada", img: "/assets/img/destinations/canada.webp" },
              { name: "France", img: "/assets/img/destinations/france.webp" },
              { name: "Hong Kong", img: "/assets/img/destinations/hongkong.webp" },
              { name: "India", img: "/assets/img/destinations/india.webp" },
              { name: "Malaysia", img: "/assets/img/destinations/malaysia.webp" },
              { name: "New Zealand", img: "/assets/img/destinations/new-zealand.webp" },
              { name: "United Kingdom", img: "/assets/img/destinations/uk.webp" },
              { name: "United States", img: "/assets/img/destinations/usa.webp" },
            ].map((dest) => (
              <a
                key={dest.name}
                href="#"
                className="relative group block overflow-hidden rounded-xl shadow-lg"
              >
                {/* Background image */}
                <img
                  src={dest.img}
                  alt={dest.name}
                  className="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-110"
                />

                {/* Overlay */}
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors"></div>

                {/* Text */}
                <div className="absolute bottom-4 left-4 text-white">
                  <h4 className="font-semibold text-lg">{dest.name}</h4>
                  <p className="text-sm opacity-90">Flights to {dest.name}</p>
                  <span className="mt-2 inline-block text-aa.violet text-sm">Explore →</span>
                </div>
              </a>
            ))}
          </div>


          <div class="mt-8 text-center">
            <a href="#" class="pill bg-aa.violet text-white px-5 py-3 inline-flex items-center gap-2 hover:bg-aa.violetDark">Explore all destinations →</a>
          </div>
        </div>
      </section>

      {/* <FeaturedFlights /> */}
      
    </div>
  );
};

export default Home;
