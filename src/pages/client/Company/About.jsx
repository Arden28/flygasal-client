import React from "react";
import { motion } from "framer-motion";

/**
 * About.jsx — Flygasal
 * A polished, fully responsive About page with tasteful motion and brand colors.
 */

// Brand hex for inline styles where Tailwind classes might miss exact shade
const BRAND_ORANGE = "#eb7313";

const fade = {
  hidden: { opacity: 0, y: 12 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.06, ease: "easeOut" },
  }),
};

const float = {
  animate: {
    y: [0, -10, 0],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

const SectionTitle = ({ eyebrow, title, sub }) => (
  <div className="mx-auto max-w-2xl text-center">
    {eyebrow ? (
      <div className="mb-2 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium text-orange-700 border-orange-200 bg-orange-50">
        {eyebrow}
      </div>
    ) : null}
    <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">{title}</h2>
    {sub ? <p className="mt-3 text-sm md:text-base text-gray-600 leading-relaxed">{sub}</p> : null}
  </div>
);

const Stat = ({ value, label }) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="rounded-2xl border border-gray-100 bg-white/80 p-6 backdrop-blur shadow-sm hover:shadow-md transition-all"
  >
    <div className="text-3xl md:text-4xl font-bold tracking-tight text-[#eb7313]">{value}</div>
    <div className="mt-1 text-sm font-medium text-gray-600">{label}</div>
  </motion.div>
);

const Feature = ({ icon, title, desc }) => (
  <div className="group rounded-2xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md hover:border-orange-100 transition-all duration-300">
    <div className="flex items-start gap-4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-[#eb7313] group-hover:bg-[#eb7313] group-hover:text-white transition-colors duration-300">
        {icon}
      </div>
      <div>
        <h3 className="font-bold text-gray-900">{title}</h3>
        <p className="mt-1 text-sm text-gray-600 leading-relaxed">{desc}</p>
      </div>
    </div>
  </div>
);

const Step = ({ n, title, desc }) => (
  <div className="group relative rounded-2xl border border-gray-100 bg-white p-6 hover:border-orange-200 transition-colors">
    <div className="absolute -top-3 left-6 inline-flex h-7 items-center justify-center rounded-full border border-orange-100 bg-white px-3 text-xs font-bold text-[#eb7313] shadow-sm">
      Step {n}
    </div>
    <h4 className="mt-2 font-bold text-gray-900 group-hover:text-[#eb7313] transition-colors">{title}</h4>
    <p className="mt-2 text-sm text-gray-600">{desc}</p>
  </div>
);

const Testimonial = ({ quote, name, role, avatar }) => (
  <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
    <div className="mb-4 flex text-[#eb7313]">
      {[...Array(5)].map((_, i) => (
        <svg key={i} className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
      ))}
    </div>
    <p className="text-sm text-gray-700 leading-relaxed italic">“{quote}”</p>
    <div className="mt-4 flex items-center gap-3 border-t border-gray-50 pt-4">
      <img src={avatar} alt={name} className="h-10 w-10 rounded-full object-cover ring-2 ring-gray-100" />
      <div>
        <div className="text-sm font-bold text-gray-900">{name}</div>
        <div className="text-xs text-gray-500">{role}</div>
      </div>
    </div>
  </div>
);

const FAQ = ({ q, a }) => (
  <details className="group rounded-2xl border border-gray-100 bg-white p-4 [&_summary::-webkit-details-marker]:hidden open:border-orange-200 open:bg-orange-50/10 transition-colors">
    <summary className="flex cursor-pointer items-center justify-between gap-2">
      <h4 className="text-sm font-semibold text-gray-900 group-hover:text-[#eb7313] transition-colors">{q}</h4>
      <span className="ml-2 inline-flex h-6 w-6 items-center justify-center rounded-md border border-gray-200 text-gray-400 group-open:rotate-45 group-open:border-[#eb7313] group-open:text-[#eb7313] transition-all">
        <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 1V11M1 6H11"/></svg>
      </span>
    </summary>
    <p className="mt-3 text-sm text-gray-600 leading-relaxed">{a}</p>
  </details>
);

// --- Plane Animation Component ---
const PlaneGraphic = () => (
  <motion.div
    initial={{ x: -100, opacity: 0, y: 50 }}
    animate={{ x: 0, opacity: 1, y: 0 }}
    transition={{ duration: 1.2, ease: "easeOut" }}
    className="absolute right-4 top-20 hidden md:block lg:right-20 lg:top-10"
  >
    <motion.svg
      variants={float}
      animate="animate"
      width="300"
      height="300"
      viewBox="0 0 24 24"
      fill="none"
      className="text-white/10 drop-shadow-2xl"
      style={{ rotate: -15 }}
    >
       <path
        fill="currentColor"
        d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"
      />
    </motion.svg>
  </motion.div>
);

const About = () => {
  return (
    <div className="bg-gray-50 overflow-hidden">
      {/* Hero */}
      <section className="relative min-h-[600px] flex items-center">
        {/* Background Image */}
        <div
          className="absolute inset-0 -z-20 bg-cover bg-center"
          style={{
            backgroundImage: 'url("/assets/img/hotels.jpg")', // Ensure this asset exists or use a placeholder
          }}
        />
        {/* Gradients for text readability */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-transparent" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-transparent to-gray-50" />

        <div className="container mx-auto max-w-7xl px-4 relative">
          <PlaneGraphic />
          
          <motion.div
            initial="hidden"
            animate="show"
            variants={fade}
            className="max-w-2xl text-white pt-20 pb-28"
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-[#eb7313]/20 px-4 py-1.5 text-xs font-semibold ring-1 ring-[#eb7313]/50 backdrop-blur-md mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#eb7313]"></span>
              </span>
              We love great trips
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1]">
              About <span className="text-[#eb7313]">FlyGasal</span>
            </h1>
            
            <p className="mt-6 text-lg md:text-xl text-gray-200 leading-relaxed max-w-xl">
              We’re on a mission to make air travel simple, transparent, and surprisingly delightful — from the first search to the final boarding call.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <a
                href="/flight/availability"
                className="inline-flex items-center gap-2 rounded-xl bg-[#eb7313] px-6 py-4 text-sm font-bold text-white shadow-lg shadow-orange-900/20 hover:bg-[#d6660f] hover:scale-105 transition-all duration-200"
              >
                Start searching
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </a>
              <a
                href="/"
                className="inline-flex items-center rounded-xl border border-white/20 bg-white/5 px-6 py-4 text-sm font-bold text-white backdrop-blur hover:bg-white/10 transition-all"
              >
                Back to Home
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats - Floating overlapping card */}
      <section className="container mx-auto max-w-7xl px-4 relative z-10 -mt-24">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Stat value="8k+" label="Airports indexed" />
          <Stat value="190+" label="Countries covered" />
          <Stat value="24/7" label="Human support" />
          <Stat value="10M+" label="Daily fare checks" />
        </div>
      </section>

      {/* Mission */}
      <section className="container mx-auto max-w-7xl px-4 py-24">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.7 }}
          >
            <SectionTitle
              eyebrow="Our mission"
              title="Travel that just works"
              sub="No gotchas, no mystery fees. We build tools that feel fast, fair, and flexible — so you can focus on the journey, not the juggling."
            />
            
            <div className="mt-10 space-y-6">
              {[
                "Transparent pricing and easy comparisons across airlines.",
                "Smart filters and chunked results for speed.",
                "Friendly support from real specialists anytime."
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                     <div className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-100 text-[#eb7313]">
                        <Check />
                     </div>
                  </div>
                  <p className="text-gray-700 font-medium">{item}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative"
          >
            <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-orange-100 to-amber-50 blur-3xl opacity-50" />
            <div className="relative overflow-hidden rounded-[2rem] border border-gray-100 shadow-2xl bg-white">
               {/* 3D-like Effect with Image */}
              <img
                alt="Flygasal mission"
                src="/assets/img/visa.jpg"
                className="h-[500px] w-full object-cover transform hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-8">
                 <p className="text-white font-medium">Connecting people, places, and cultures.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Why Flygasal */}
      <section className="relative bg-white py-24">
        <div className="absolute inset-0 bg-[radial-gradient(#eb7313_1px,transparent_1px)] [background-size:16px_16px] opacity-[0.03]" />
        <div className="container mx-auto max-w-7xl px-4 relative">
          <SectionTitle
            eyebrow="Why Flygasal"
            title="Built for real travelers"
            sub="We obsess over details that shave seconds off your search and hours off your hassle."
          />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Feature
              icon={<SearchIcon />}
              title="Lightning-fast search"
              desc="Type-to-search across our full global index with ranked, relevant results."
            />
            <Feature
              icon={<TagIcon />}
              title="Fair, flexible fares"
              desc="See what matters: cabin, baggage, changeability — never buried in the fine print."
            />
            <Feature
              icon={<ShieldIcon />}
              title="Trust & security"
              desc="Modern security standards, secure payments, and careful data practices."
            />
            <Feature
              icon={<PeopleIcon />}
              title="Human help"
              desc="Questions about visas, infants, or complex routings? Our team has you."
            />
            <Feature
              icon={<GlobeIcon />}
              title="Global coverage"
              desc="From regional hops to long-haul adventures — we’ve got you covered."
            />
            <Feature
              icon={<SparklesIcon />}
              title="Constantly improving"
              desc="We ship updates weekly — better filters, cleaner UI, smarter recommendations."
            />
          </div>
        </div>
      </section>

      {/* How it works - Timeline Style */}
      <section className="container mx-auto max-w-7xl px-4 py-24">
        <SectionTitle
          eyebrow="How it works"
          title="From search to boarding"
        />
        <div className="mt-16 grid gap-8 md:grid-cols-4 relative">
            {/* Connector Line (Desktop) */}
            <div className="hidden md:block absolute top-12 left-0 w-full h-0.5 bg-gray-100 -z-10" />
            
            <Step n={1} title="Search" desc="Enter your route, dates, and cabin. We scan live fares instantly." />
            <Step n={2} title="Compare" desc="Sort by time, price, or airline — filter down to what matters." />
            <Step n={3} title="Book" desc="Lock your fare, add travelers, and pay securely — card or wallet." />
            <Step n={4} title="Fly" desc="Manage changes, request extras, and chat with an agent anytime." />
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-orange-50/50 py-24">
        <div className="container mx-auto max-w-7xl px-4">
          <SectionTitle
            eyebrow="Loved by travelers"
            title="What customers say"
          />
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <Testimonial
              quote="Fastest flight search I’ve used — and the booking flow was super clean."
              name="Maya A."
              role="Product Designer"
              avatar="https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop"
            />
            <Testimonial
              quote="We booked a tricky multi-city itinerary in minutes. Support was fantastic."
              name="Diego R."
              role="Frequent Flyer"
              avatar="https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?q=80&w=200&auto=format&fit=crop"
            />
            <Testimonial
              quote="Transparent pricing and no surprises at checkout. Five stars."
              name="Lina K."
              role="Founder"
              avatar="https://images.unsplash.com/photo-1544723795-3fb6469f5b39?q=80&w=200&auto=format&fit=crop"
            />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="container mx-auto max-w-4xl px-4 py-24">
        <div className="text-center mb-12">
           <h2 className="text-3xl font-bold text-gray-900">Frequently Asked Questions</h2>
        </div>
        <div className="space-y-4">
          <FAQ
            q="Do you charge extra fees?"
            a="No hidden fees. We show the fare, taxes, and any service fees clearly before you pay."
          />
          <FAQ
            q="Can I change or cancel my ticket?"
            a="It depends on the fare rules of your ticket. We display them upfront and our team can help with changes."
          />
          <FAQ
            q="Which payment methods are accepted?"
            a="Major cards and wallet options are supported. For corporate accounts, invoice/billing can be enabled."
          />
          <FAQ
            q="Do you support infants, children, and special assistance?"
            a="Absolutely. Add traveler details during checkout and note any assistance — our team will coordinate with the airline."
          />
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto max-w-7xl px-4 pb-20">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-[#eb7313] px-6 py-16 md:px-16 md:py-20 shadow-2xl shadow-orange-900/20">
          {/* Decorative Circles */}
          <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-black/10 blur-3xl" />
          
          <div className="relative z-10 grid items-center gap-8 md:grid-cols-2">
            <div>
              <h3 className="text-3xl md:text-4xl font-bold text-white">
                Ready to plan your next trip?
              </h3>
              <p className="mt-4 text-lg text-orange-100 max-w-md">
                Search live fares, compare options you care about, and book with confidence.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4 md:justify-end">
              <a
                href="/flight/availability"
                className="inline-flex items-center rounded-2xl bg-white px-8 py-4 text-sm font-bold text-[#eb7313] shadow-xl hover:bg-gray-50 hover:scale-105 transition-all"
              >
                Search flights
              </a>
              <a
                href="/contact"
                className="inline-flex items-center rounded-2xl border border-white/30 bg-white/10 px-8 py-4 text-sm font-bold text-white hover:bg-white/20 transition-all"
              >
                Talk to us
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer mini - blending into the main layout footer so we keep it minimal */}
      <div className="border-t border-gray-100 bg-white">
        <div className="container mx-auto max-w-7xl px-4 py-8 text-sm text-gray-500 flex justify-center">
            <p>Designed for the modern traveler.</p>
        </div>
      </div>
    </div>
  );
};

/* ================= Icons ================= */
const Check = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6L9 17l-5-5"/>
  </svg>
);
const SearchIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/>
    <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);
const TagIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M20.59 13.41L12 22l-8-8 8-8 8.59 8.41z" stroke="currentColor" strokeWidth="2" fill="none"/>
    <circle cx="7.5" cy="14.5" r="1.5" fill="currentColor"/>
  </svg>
);
const ShieldIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M12 3l7 4v6c0 4-3 7-7 8-4-1-7-4-7-8V7l7-4z" stroke="currentColor" strokeWidth="2" fill="none"/>
    <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const PeopleIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="2"/>
    <path d="M2 21v-1a5 5 0 015-5h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="17" cy="10" r="3" stroke="currentColor" strokeWidth="2"/>
    <path d="M22 21v-1a5 5 0 00-5-5h-1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);
const GlobeIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
    <path d="M3 12h18M12 3c3 4 3 14 0 18M12 3c-3 4-3 14 0 18" stroke="currentColor" strokeWidth="2"/>
  </svg>
);
const SparklesIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M12 3l1.5 3.5L17 8l-3.5 1.5L12 13l-1.5-3.5L7 8l3.5-1.5L12 3zM6 15l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2zm12 0l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2z" fill="currentColor"/>
  </svg>
);

export default About;