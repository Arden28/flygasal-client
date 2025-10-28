
import React from 'react';
import HeroSection from '../../components/client/HeroSection';


const Home = () => {
  return (
    <div className="min-h-screen font-sans">
      {/* Hero Section with background and promotional text */}
      <HeroSection />
      {/* Hero Section */}

      {/* Hero Section */}
      <section className="relative w-full overflow-hidden">
        {/* Gradient background updated to match Gasal colours (warm orange palette) */}
        <div className="absolute inset-0 bg-gradient-to-b from-orange-400 via-orange-500 to-orange-600" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28 text-center text-white">
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight">
            Book flights. Pay later.
          </h1>
          <p className="mt-4 text-lg sm:text-2xl opacity-90 max-w-2xl mx-auto">
            Book your perfect flight with confidence.
          </p>
          {/* Search form intentionally omitted – integrate your own form here */}
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
                className="flex flex-col items-start gap-4 p-8 bg-orange-50 rounded-3xl shadow-sm transition-transform hover:-translate-y-1"
              >
                <img
                  src={item.icon}
                  alt=""
                  className="h-12 w-12 text-orange-700"
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

      {/* Delay payments Section */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 flex flex-col md:flex-row items-center gap-12">
          {/* Image on the left */}
          <div className="md:w-1/2">
            <img
              src="/assets/img/agent.jpg"
              alt="Flexible payment options"
              className="rounded-3xl w-full h-80 object-cover"
            />
          </div>
          {/* Text content */}
          <div className="md:w-1/2">
            <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">
              Delay payments, not your plans
            </h3>
            <p className="text-slate-600 mb-6">
              Life happens, and plans change. But that shouldn't stop you from exploring the world. With our flexible payment options, delay the cost, not your adventure, and travel when you're ready【781689595112326†L115-L119】.
            </p>
            <a
              href="#"
              className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-full hover:bg-orange-700 transition-colors"
            >
              Explore payment options
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

      {/* Protection Section */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 flex flex-col md:flex-row items-center gap-12">
          {/* Text content */}
          <div className="md:w-1/2 order-2 md:order-1">
            <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">
              Protection that puts you in control
            </h3>
            <p className="text-slate-600 mb-6">
              Travel with peace of mind, knowing that you're prepared for the unexpected. Choose flight protection that works for you, ensuring you're covered before and during your trip, no matter what comes your way【781689595112326†L125-L129】.
            </p>
            <a
              href="#"
              className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-full hover:bg-orange-700 transition-colors"
            >
              Discover protection
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
          {/* Image on the right */}
          <div className="md:w-1/2 order-1 md:order-2">
            <img
              src="/assets/img/agent2.jpg"
              alt="Protection options"
              className="rounded-3xl w-full h-80 object-cover"
            />
          </div>
        </div>
      </section>

      {/* Trusted Customers Section */}
      <section className="bg-orange-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <h3 className="text-center text-3xl sm:text-4xl font-extrabold text-slate-900 mb-10">
            Trusted by customers all around the world
          </h3>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                quote:
                  'This was my first booking and I used Fly Gasal twice on this trip. I must say by far the best online booking experience ever.',
                name: 'Dee',
              },
              {
                quote:
                  'From start to finish the process of selecting, confirming, processing of payment and check‑in experience was absolutely flawless! I will be using Fly Gasal every time I travel.',
                name: 'Corey M',
              },
              {
                quote:
                  'Fly Gasal made what would have been an otherwise difficult situation much easier to manage. Thank you, Fly Gasal.',
                name: 'A',
              },
              {
                quote:
                  'It was my first time using Fly Gasal and it was one of the best experiences I had in booking my flights. The process was easy and the flight options were clearly laid out.',
                name: 'Antonette N',
              },
            ].map((t) => (
              <div
                key={t.name}
                className="bg-white rounded-3xl p-6 shadow-sm flex flex-col justify-between"
              >
                <div className="mb-4">
                  <img
                    src="/assets/img/trustpilot-5star.svg"
                    alt="Trustpilot 5-star"
                    className="h-5 mb-4"
                  />
                  <p className="text-slate-700 leading-relaxed">{t.quote}</p>
                </div>
                <div className="mt-4 text-sm font-semibold text-slate-900">
                  {t.name}
                </div>
                <div className="text-xs text-slate-500">Verified by Trustpilot</div>
              </div>
            ))}
          </div>
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
                className="flex items-center bg-orange-50 rounded-3xl overflow-hidden shadow-sm transition-transform hover:-translate-y-1"
              >
                <img
                  src={dest.img}
                  alt={dest.name}
                  className="w-2/5 h-32 object-cover"
                />
                <div className="flex-1 p-4">
                  <h4 className="text-lg font-semibold text-slate-900">{dest.name}</h4>
                  <p className="text-sm text-slate-600">Flights to {dest.name}</p>
                  <span className="mt-2 inline-flex items-center gap-1 text-orange-700 text-sm">
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
              className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-full hover:bg-orange-700 transition-colors"
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
      <section className="bg-orange-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <h3 className="text-center text-3xl sm:text-4xl font-extrabold text-slate-900 mb-10">
            Access airlines all around the world
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {[
              'WB.png',
              'eth.png',
              'kq.png',
              'air-canada.png',
              'american.png',
              'cebu-pacific.png',
              'delta.png',
              'emirates.png',
              'qatar.png',
              'ryanair.png',
              'wizz.png',
              'air-new-zealand.png',
              'qantas.png',
              'easyjet.png',
              'klm.png',
              'british-airways.png',
              'china-southern.png',
              'flysafair.png',
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
              className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-full hover:bg-orange-700 transition-colors"
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
                className="flex flex-col overflow-hidden bg-orange-50 rounded-3xl shadow-sm hover:shadow-md transition-shadow"
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
                    className="mt-4 inline-flex items-center gap-1 text-orange-700 font-medium"
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