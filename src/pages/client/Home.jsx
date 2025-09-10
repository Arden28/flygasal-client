
import React from 'react';
import HeroSection from '../../components/client/HeroSection';


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
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <h3 className="text-center text-3xl sm:text-4xl font-extrabold">Destinations ready for you to explore</h3>
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


          <div className="mt-8 text-center">
            <a href="#" className="pill bg-aa.violet text-white px-5 py-3 inline-flex items-center gap-2 hover:bg-aa.violetDark">Explore all destinations →</a>
          </div>
        </div>
      </section>
      
      {/* Airlines mosaic with artistic multi-lane auto-scroll */}

      <section className="bg-aa.lilac/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <h3 className="text-center text-3xl sm:text-4xl font-extrabold text-slate-900">
            Access airlines all around the world
          </h3>

          <div className="marquee mt-10 edge-fade relative overflow-hidden tilt-1">
            <ul className="track flex items-center gap-6 min-w-max animate-marquee [&>li]:transition-transform stagger">
              {/* <!-- set A --> */}
              <li className="logo-tile bg-white p-4 shadow-card">
                <img className="bob h-8 mx-auto object-contain" src="/assets/img/airlines/WB.png" alt="Qntas"/>
              </li>
              <li className="logo-tile bg-white p-4 shadow-card">
                <img className="bob h-8 mx-auto object-contain" src="/assets/img/airlines/riyadh-air.svg" alt="Riyadh Air"/>
              </li>
              <li className="logo-tile bg-white p-4 shadow-card">
                <img className="bob h-9 mx-auto object-contain" src="/assets/img/airlines/southwest.svg" alt="Southwest"/>
              </li>
              <li className="logo-tile bg-white p-4 shadow-card">
                <img className="bob h-8 mx-auto object-contain" src="/assets/img/airlines/air-canada.svg" alt="Air Canada"/>
              </li>
              <li className="logo-tile bg-white p-4 shadow-card">
                <img className="bob h-8 mx-auto object-contain" src="/assets/img/airlines/american.svg" alt="American Airlines"/>
              </li>
              <li className="logo-tile bg-white p-4 shadow-card">
                <img className="bob h-8 mx-auto object-contain" src="/assets/img/airlines/cebu-pacific.svg" alt="Cebu Pacific"/>
              </li>
              <li className="logo-tile bg-white p-4 shadow-card">
                <img className="bob h-8 mx-auto object-contain" src="/assets/img/airlines/delta.svg" alt="Delta"/>
              </li>
              <li className="logo-tile bg-white p-4 shadow-card">
                <img className="bob h-8 mx-auto object-contain" src="/assets/img/airlines/emirates.svg" alt="Emirates"/>
              </li>
              <li className="logo-tile bg-white p-4 shadow-card">
                <img className="bob h-8 mx-auto object-contain" src="/assets/img/airlines/qatar.svg" alt="Qatar Airways"/>
              </li>
              <li className="logo-tile bg-white p-4 shadow-card">
                <img className="bob h-8 mx-auto object-contain" src="/assets/img/airlines/ryanair.svg" alt="Ryanair"/>
              </li>
              <li className="logo-tile bg-white p-4 shadow-card">
                <img className="bob h-8 mx-auto object-contain" src="/assets/img/airlines/wizz.svg" alt="Wizz Air"/>
              </li>
              <li className="logo-tile bg-white p-4 shadow-card">
                <img className="bob h-8 mx-auto object-contain" src="/assets/img/airlines/air-new-zealand.svg" alt="Air New Zealand"/>
              </li>

              {/* <!-- duplicate for seamless loop --> */}
              <li className="logo-tile bg-white p-4 shadow-card"><img className="bob h-8 mx-auto object-contain" src="/assets/img/airlines/qantas.svg" alt=""/></li>
              <li className="logo-tile bg-white p-4 shadow-card"><img className="bob h-8 mx-auto object-contain" src="/assets/img/airlines/riyadh-air.svg" alt=""/></li>
              <li className="logo-tile bg-white p-4 shadow-card"><img className="bob h-9 mx-auto object-contain" src="/assets/img/airlines/southwest.svg" alt=""/></li>
              <li className="logo-tile bg-white p-4 shadow-card"><img className="bob h-8 mx-auto object-contain" src="/assets/img/airlines/air-canada.svg" alt=""/></li>
              <li className="logo-tile bg-white p-4 shadow-card"><img className="bob h-8 mx-auto object-contain" src="/assets/img/airlines/american.svg" alt=""/></li>
              <li className="logo-tile bg-white p-4 shadow-card"><img className="bob h-8 mx-auto object-contain" src="/assets/img/airlines/cebu-pacific.svg" alt=""/></li>
              <li className="logo-tile bg-white p-4 shadow-card"><img className="bob h-8 mx-auto object-contain" src="/assets/img/airlines/delta.svg" alt=""/></li>
              <li className="logo-tile bg-white p-4 shadow-card"><img className="bob h-8 mx-auto object-contain" src="/assets/img/airlines/emirates.svg" alt=""/></li>
              <li className="logo-tile bg-white p-4 shadow-card"><img className="bob h-8 mx-auto object-contain" src="/assets/img/airlines/qatar.svg" alt=""/></li>
              <li className="logo-tile bg-white p-4 shadow-card"><img className="bob h-8 mx-auto object-contain" src="/assets/img/airlines/ryanair.svg" alt=""/></li>
              <li className="logo-tile bg-white p-4 shadow-card"><img className="bob h-8 mx-auto object-contain" src="/assets/img/airlines/wizz.svg" alt=""/></li>
              <li className="logo-tile bg-white p-4 shadow-card"><img className="bob h-8 mx-auto object-contain" src="/assets/img/airlines/air-new-zealand.svg" alt=""/></li>
            </ul>
          </div>

          <div className="marquee mt-6 edge-fade relative overflow-hidden tilt-2">
            <ul className="track flex items-center gap-6 min-w-max animate-marqueeFast [animation-direction:reverse] [&>li]:transition-transform stagger">
              
              <li className="logo-tile bg-white p-4 shadow-card"><img className="bob h-8 mx-auto object-contain" src="/assets/img/airlines/air-canada.svg" alt="Air Canada"/></li>
              <li className="logo-tile bg-white p-4 shadow-card"><img className="bob h-8 mx-auto object-contain" src="/assets/img/airlines/american.svg" alt="American Airlines"/></li>
              <li className="logo-tile bg-white p-4 shadow-card"><img className="bob h-8 mx-auto object-contain" src="/assets/img/airlines/cebu-pacific.svg" alt="Cebu Pacific"/></li>
              <li className="logo-tile bg-white p-4 shadow-card"><img className="bob h-9 mx-auto object-contain" src="/assets/img/airlines/southwest.svg" alt="Southwest"/></li>
              <li className="logo-tile bg-white p-4 shadow-card"><img className="bob h-8 mx-auto object-contain" src="/assets/img/airlines/emirates.svg" alt="Emirates"/></li>
              <li className="logo-tile bg-white p-4 shadow-card"><img className="bob h-8 mx-auto object-contain" src="/assets/img/airlines/qatar.svg" alt="Qatar Airways"/></li>
              <li className="logo-tile bg-white p-4 shadow-card"><img className="bob h-8 mx-auto object-contain" src="/assets/img/airlines/ryanair.svg" alt="Ryanair"/></li>
              <li className="logo-tile bg-white p-4 shadow-card"><img className="bob h-8 mx-auto object-contain" src="/assets/img/airlines/wizz.svg" alt="Wizz Air"/></li>
              <li className="logo-tile bg-white p-4 shadow-card"><img className="bob h-8 mx-auto object-contain" src="/assets/img/airlines/qantas.svg" alt="Qantas"/></li>
              <li className="logo-tile bg-white p-4 shadow-card"><img className="bob h-8 mx-auto object-contain" src="/assets/img/airlines/delta.svg" alt="Delta"/></li>
              <li className="logo-tile bg-white p-4 shadow-card"><img className="bob h-8 mx-auto object-contain" src="/assets/img/airlines/riyadh-air.svg" alt="Riyadh Air"/></li>
              <li className="logo-tile bg-white p-4 shadow-card"><img className="bob h-8 mx-auto object-contain" src="/assets/img/airlines/air-new-zealand.svg" alt="Air New Zealand"/></li>

              <li className="logo-tile bg-white p-4 shadow-card"><img className="bob h-8 mx-auto object-contain" src="/assets/img/airlines/air-canada.svg" alt=""/></li>
              <li className="logo-tile bg-white p-4 shadow-card"><img className="bob h-8 mx-auto object-contain" src="/assets/img/airlines/american.svg" alt=""/></li>
              <li className="logo-tile bg-white p-4 shadow-card"><img className="bob h-8 mx-auto object-contain" src="/assets/img/airlines/cebu-pacific.svg" alt=""/></li>
              <li className="logo-tile bg-white p-4 shadow-card"><img className="bob h-9 mx-auto object-contain" src="/assets/img/airlines/southwest.svg" alt=""/></li>
              <li className="logo-tile bg-white p-4 shadow-card"><img className="bob h-8 mx-auto object-contain" src="/assets/img/airlines/emirates.svg" alt=""/></li>
              <li className="logo-tile bg-white p-4 shadow-card"><img className="bob h-8 mx-auto object-contain" src="/assets/img/airlines/qatar.svg" alt=""/></li>
              <li className="logo-tile bg-white p-4 shadow-card"><img className="bob h-8 mx-auto object-contain" src="/assets/img/airlines/ryanair.svg" alt=""/></li>
              <li className="logo-tile bg-white p-4 shadow-card"><img className="bob h-8 mx-auto object-contain" src="/assets/img/airlines/wizz.svg" alt=""/></li>
              <li className="logo-tile bg-white p-4 shadow-card"><img className="bob h-8 mx-auto object-contain" src="/assets/img/airlines/qantas.svg" alt=""/></li>
              <li className="logo-tile bg-white p-4 shadow-card"><img className="bob h-8 mx-auto object-contain" src="/assets/img/airlines/delta.svg" alt=""/></li>
              <li className="logo-tile bg-white p-4 shadow-card"><img className="bob h-8 mx-auto object-contain" src="/assets/img/airlines/riyadh-air.svg" alt=""/></li>
              <li className="logo-tile bg-white p-4 shadow-card"><img className="bob h-8 mx-auto object-contain" src="/assets/img/airlines/air-new-zealand.svg" alt=""/></li>
            </ul>
          </div>

          {/* <!-- CTA --> */}
          <div className="mt-10 text-center">
            <a href="#" className="pill bg-aa.violet text-white px-5 py-3 inline-flex items-center gap-2 hover:bg-aa.violetDark">
              Explore all airlines →
            </a>
          </div>
        </div>
      </section>


      {/* <!-- Help cards --> */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="tile overflow-hidden bg-white shadow-card">
              <img src="/assets/img/before-booking.webp" className="h-44 w-full object-cover" alt=""/>
              <div className="p-6">
                <h4 className="text-lg font-semibold">Before you book</h4>
                <p className="mt-2 text-slate-700">What makes us unique and why you should book your flights the Fly Gasal way.</p>
                <a className="mt-4 inline-block text-aa.violet" href="#">About us →</a>
              </div>
            </div>
            <div className="tile overflow-hidden bg-white shadow-card">
              <img src="/assets/img/agent2.jpg" className="h-44 w-full object-cover" alt=""/>
              <div className="p-6">
                <h4 className="text-lg font-semibold">After you book</h4>
                <p className="mt-2 text-slate-700">Our next-level customer support team is on hand and available every step of the way.</p>
                <a className="mt-4 inline-block text-aa.violet" href="#">Our service →</a>
              </div>
            </div>
            <div className="tile overflow-hidden bg-white shadow-card">
              <img src="/assets/img/agent.jpg" className="h-44 w-full object-cover" alt=""/>
              <div className="p-6">
                <h4 className="text-lg font-semibold">Need help?</h4>
                <p className="mt-2 text-slate-700">Check out our help centre for answers to all of your questions.</p>
                <a className="mt-4 inline-block text-aa.violet" href="#">Help centre →</a>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;
