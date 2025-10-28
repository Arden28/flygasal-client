
import React from 'react';
import HeroSection from '../../components/client/HeroSection';



/**
 * Updated home page to better align with the look and feel of the
 * Alternative Airlines marketing site. The hero now uses a soft
 * purple‑to‑pink gradient and larger typography inspired by the
 * “Book flights. Pay later.” header seen on the Alternative Airlines
 * homepage【594294797686614†L8-L11】. Below the hero there are three
 * benefit cards with pastel backgrounds and clear copy mirroring the
 * “Find your perfect flight”, “Pay over time” and “Book with
 * confidence” sections on the reference site【594294797686614†L45-L61】.
 * A testimonial block overlays text on a full‑width image with a
 * subtle gradient, similar to the Trustpilot quote area on the
 * Alternative Airlines site【594294797686614†L64-L69】. Destinations are
 * presented as horizontal cards with left‑aligned images and a small
 * “Explore” call to action like the destination grid on the reference
 * site【594294797686614†L74-L88】. An airline mosaic uses a simple grid
 * of white tiles instead of a marquee for better readability and
 * alignment with the reference. Finally, the help cards section now
 * adopts the “We’re with you every step of the way” styling from the
 * reference site.
 */

const Home = () => {
  return (
    <div className="min-h-screen font-sans">

      {/* Hero Section with background and promotional text */}
      {/* <HeroSection /> */}
      {/* Hero Section */}

      <section className="relative w-full overflow-hidden">
        {/* Gradient background inspired by Alternative Airlines */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#2AA9E0] via-[#7ECFF5] to-[#FFD6A3]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28 text-center text-white">
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight">
            Book flights. Pay later.
          </h1>
          <p className="mt-4 text-lg sm:text-2xl opacity-90 max-w-2xl mx-auto">
            Book your perfect flight with confidence.
          </p>

            {/* Search Tabs */}
            <SearchTabs />

          <div className="mt-10 inline-flex items-center gap-2 mx-auto">
            <span className="inline-flex items-center gap-1 bg-white/20 rounded-full px-3 py-1 text-sm sm:text-base">
              {/* Trustpilot 5‑star badge */}
              <img src="/assets/img/trustpilot-5star.svg" alt="Trustpilot rating" className="h-5" />
              <span>Trusted by 100,000+ customers</span>
            </span>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-center text-3xl sm:text-4xl font-bold text-slate-900 mb-12">
            The future of flight booking has landed
          </h2>
          <div className="grid gap-8 sm:grid-cols-3">
            {[
              {
                title: 'Find your perfect flight',
                text: 'Compare 600+ airlines, add extras and pick from 40+ ways to pay.',
                icon: '/assets/img/icons/plane.svg',
              },
              {
                title: 'Pay over time',
                text: 'Exclusive partners let you spread the cost, or pay later.',
                icon: '/assets/img/icons/calendar.svg',
              },
              {
                title: 'Book with confidence',
                text: 'Next‑level support, instant confirmation and protection.',
                icon: '/assets/img/icons/lock.svg',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="flex flex-col items-start gap-4 p-8 bg-purple-50 rounded-3xl shadow-sm transition-transform hover:-translate-y-1"
              >
                <img
                  src={item.icon}
                  alt=""
                  className="h-12 w-12 text-purple-700"
                />
                <h3 className="text-xl font-semibold text-slate-900">
                  {item.title}
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="relative">
        {/* Background image with subtle gradient overlay */}
        <img
          src="/assets/img/bottom-tp-block-3.webp"
          alt="Happy traveller"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-black/20" />
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-20">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-white">
            <img
              src="/assets/img/trustpilot-5star.svg"
              alt="Trustpilot 5 stars"
              className="h-5"
            />
            <span className="text-sm sm:text-base">Verified by Trustpilot</span>
          </div>
          <h3 className="mt-6 text-3xl sm:text-4xl font-semibold text-white leading-snug max-w-3xl">
            “Fly Gasal made it possible for me to visit my family whom I hadn't seen in 5+ years.
            With everything so expensive, their payment plans made everything more affordable.”
          </h3>
        </div>
      </section>

      {/* Destinations Section */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <h3 className="text-center text-3xl sm:text-4xl font-extrabold text-slate-900 mb-10">
            Destinations ready for you to explore
          </h3>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              { name: 'Australia', img: '/assets/img/destinations/australia.webp' },
              { name: 'Canada', img: '/assets/img/destinations/canada.webp' },
              { name: 'France', img: '/assets/img/destinations/france.webp' },
              { name: 'Hong Kong', img: '/assets/img/destinations/hongkong.webp' },
              { name: 'India', img: '/assets/img/destinations/india.webp' },
              { name: 'Malaysia', img: '/assets/img/destinations/malaysia.webp' },
              { name: 'New Zealand', img: '/assets/img/destinations/new-zealand.webp' },
              { name: 'United Kingdom', img: '/assets/img/destinations/uk.webp' },
              { name: 'United States', img: '/assets/img/destinations/usa.webp' },
            ].map((dest) => (
              <a
                key={dest.name}
                href="#"
                className="flex items-center bg-purple-50 rounded-3xl overflow-hidden shadow-sm transition-transform hover:-translate-y-1"
              >
                <img
                  src={dest.img}
                  alt={dest.name}
                  className="w-2/5 h-32 object-cover"
                />
                <div className="flex-1 p-4">
                  <h4 className="text-lg font-semibold text-slate-900">{dest.name}</h4>
                  <p className="text-sm text-slate-600">Flights to {dest.name}</p>
                  <span className="mt-2 inline-flex items-center gap-1 text-purple-700 text-sm">
                    Explore
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="w-4 h-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </span>
                </div>
              </a>
            ))}
          </div>
          <div className="mt-10 text-center">
            <a
              href="#"
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors"
            >
              Explore all destinations
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-4 h-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* Airlines Section */}
      <section className="bg-purple-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <h3 className="text-center text-3xl sm:text-4xl font-extrabold text-slate-900 mb-10">
            Access airlines all around the world
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {[
              'WB.png',
              'riyadh-air.svg',
              'southwest.svg',
              'air-canada.svg',
              'american.svg',
              'cebu-pacific.svg',
              'delta.svg',
              'emirates.svg',
              'qatar.svg',
              'ryanair.svg',
              'wizz.svg',
              'air-new-zealand.svg',
              'qantas.svg',
              'easyjet.svg',
              'klm.svg',
              'british-airways.svg',
              'china-southern.svg',
              'flysafair.svg',
            ].map((logo) => (
              <div
                key={logo}
                className="flex items-center justify-center bg-white rounded-2xl p-4 shadow-sm h-20"
              >
                <img
                  src={`/assets/img/airlines/${logo}`}
                  alt="airline logo"
                  className="max-h-8 object-contain"
                />
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <a
              href="#"
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors"
            >
              Explore all airlines
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-4 h-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* Help Cards Section */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <h3 className="text-center text-3xl sm:text-4xl font-extrabold text-slate-900 mb-10">
            We're with you every step of the way
          </h3>
          <div className="grid gap-8 sm:grid-cols-3">
            {[
              {
                title: 'Before you book',
                text: 'What makes us unique and why you should start booking your flights the Fly Gasal way.',
                img: '/assets/img/before-booking.webp',
                cta: 'About us',
              },
              {
                title: 'After you book',
                text: 'Our next‑level customer support team is on hand and available for you every step of the way.',
                img: '/assets/img/agent2.jpg',
                cta: 'Our service',
              },
              {
                title: 'Need help?',
                text: 'Check out our help centre for answers to all of your questions.',
                img: '/assets/img/agent.jpg',
                cta: 'Help centre',
              },
            ].map((card) => (
              <div
                key={card.title}
                className="flex flex-col overflow-hidden bg-purple-50 rounded-3xl shadow-sm hover:shadow-md transition-shadow"
              >
                <img
                  src={card.img}
                  alt=""
                  className="h-48 w-full object-cover"
                />
                <div className="p-6 flex flex-col flex-1">
                  <h4 className="text-lg font-semibold text-slate-900">
                    {card.title}
                  </h4>
                  <p className="mt-2 text-slate-600 flex-1">
                    {card.text}
                  </p>
                  <a
                    href="#"
                    className="mt-4 inline-flex items-center gap-1 text-purple-700 font-medium"
                  >
                    {card.cta}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="w-4 h-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;