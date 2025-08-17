import React from "react";
import { motion } from "framer-motion";

/**
 * About.jsx — Flygasal
 * A polished, fully responsive About page with tasteful motion.
 * TailwindCSS required. No external layout dependencies.
 */

const fade = {
  hidden: { opacity: 0, y: 12 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.06, ease: "easeOut" },
  }),
};

const SectionTitle = ({ eyebrow, title, sub }) => (
  <div className="mx-auto max-w-2xl text-center">
    {eyebrow ? (
      <div className="mb-2 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium text-blue-700 border-blue-200 bg-blue-50">
        {eyebrow}
      </div>
    ) : null}
    <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-gray-900">{title}</h2>
    {sub ? <p className="mt-2 text-sm md:text-base text-gray-600">{sub}</p> : null}
  </div>
);

const Stat = ({ value, label }) => (
  <div className="rounded-2xl border border-gray-100 bg-white/60 p-6 backdrop-blur">
    <div className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900">{value}</div>
    <div className="mt-1 text-sm text-gray-600">{label}</div>
  </div>
);

const Feature = ({ icon, title, desc }) => (
  <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow transition-shadow">
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
        {icon}
      </div>
      <div>
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <p className="mt-1 text-sm text-gray-600">{desc}</p>
      </div>
    </div>
  </div>
);

const Step = ({ n, title, desc }) => (
  <div className="group relative rounded-2xl border border-gray-100 bg-white p-6">
    <div className="absolute -top-3 left-6 inline-flex h-7 items-center justify-center rounded-full border bg-white px-3 text-xs font-semibold text-gray-700">
      Step {n}
    </div>
    <h4 className="mt-1 font-semibold text-gray-900">{title}</h4>
    <p className="mt-1 text-sm text-gray-600">{desc}</p>
  </div>
);

const Testimonial = ({ quote, name, role, avatar }) => (
  <div className="rounded-2xl border border-gray-100 bg-white p-5">
    <p className="text-sm text-gray-700 leading-relaxed">“{quote}”</p>
    <div className="mt-3 flex items-center gap-3">
      <img src={avatar} alt={name} className="h-9 w-9 rounded-full object-cover" />
      <div>
        <div className="text-sm font-medium text-gray-900">{name}</div>
        <div className="text-xs text-gray-500">{role}</div>
      </div>
    </div>
  </div>
);

const FAQ = ({ q, a }) => (
  <details className="group rounded-2xl border border-gray-100 bg-white p-4 [&_summary::-webkit-details-marker]:hidden">
    <summary className="flex cursor-pointer items-center justify-between gap-2">
      <h4 className="text-sm font-medium text-gray-900">{q}</h4>
      <span className="ml-2 inline-flex h-6 w-6 items-center justify-center rounded-md border text-gray-600 group-open:rotate-45 transition">
        +
      </span>
    </summary>
    <p className="mt-2 text-sm text-gray-600">{a}</p>
  </details>
);

const About = () => {
  return (
    <div className="bg-gray-50">
      {/* Hero */}
      <section className="relative">
        <div
          className="absolute inset-0 -z-10 bg-cover bg-center"
          style={{
            backgroundImage:
              'url("/assets/img/hotels.jpg")',
          }}
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/60 via-black/40 to-black/20" />
        <div className="container mx-auto max-w-6xl px-4 py-28 md:py-36">
          <motion.div
            initial="hidden"
            animate="show"
            variants={fade}
            className="max-w-3xl text-white"
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium ring-1 ring-white/30">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              We love great trips
            </span>
            <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
              About Flygasal
            </h1>
            <p className="mt-3 text-base md:text-lg text-white/90">
              We’re on a mission to make air travel simple, transparent, and
              surprisingly delightful — from the first search to the final
              boarding call.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <a
                href="/flight/availability"
                className="inline-flex items-center rounded-xl bg-white px-5 py-3 text-sm font-medium text-gray-900 shadow hover:shadow-md"
              >
                Start searching flights
              </a>
              <a
                href="/"
                className="inline-flex items-center rounded-xl border border-white/40 bg-white/10 px-5 py-3 text-sm font-medium text-white backdrop-blur hover:bg-white/20"
              >
                Back to Home
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="container mx-auto max-w-6xl px-4 -mt-10 md:-mt-14">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat value="8k+" label="Airports indexed" />
          <Stat value="190+" label="Countries covered" />
          <Stat value="24/7" label="Human support" />
          <Stat value="10M+" label="Daily fare checks" />
        </div>
      </section>

      {/* Mission */}
      <section className="container mx-auto max-w-6xl px-4 py-12 md:py-16">
        <div className="grid items-center gap-8 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.5 }}
            className="order-2 md:order-1"
          >
            <SectionTitle
              eyebrow="Our mission"
              title="Travel that just works"
              sub="No gotchas, no mystery fees. We build tools that feel fast, fair, and flexible — so you can focus on the journey, not the juggling."
            />
            <ul className="mt-6 space-y-3 text-sm text-gray-700">
              <li className="flex items-start gap-3">
                <Check />
                Transparent pricing and easy comparisons across airlines and cabins.
              </li>
              <li className="flex items-start gap-3">
                <Check />
                Smart filters and chunked results for speed — even with huge datasets.
              </li>
              <li className="flex items-start gap-3">
                <Check />
                Friendly support from real specialists whenever you need a hand.
              </li>
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.5 }}
            className="order-1 md:order-2"
          >
            <div className="overflow-hidden rounded-3xl border border-gray-200 shadow-sm">
              <img
                alt="Flygasal mission"
                src="/assets/img/visa.jpg"
                className="h-72 w-full object-cover md:h-[420px]"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Why Flygasal */}
      <section className="container mx-auto max-w-6xl px-4 py-12 md:py-16">
        <SectionTitle
          eyebrow="Why Flygasal"
          title="Built for real travelers"
          sub="We obsess over details that shave seconds off your search and hours off your hassle."
        />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
      </section>

      {/* How it works */}
      <section className="container mx-auto max-w-6xl px-4 py-12 md:py-16">
        <SectionTitle
          eyebrow="How it works"
          title="From search to boarding — in four simple steps"
        />
        <div className="mt-8 grid gap-4 md:grid-cols-4">
          <Step n={1} title="Search" desc="Enter your route, dates, and cabin. We scan live fares instantly." />
          <Step n={2} title="Compare" desc="Sort by time, price, or airline — filter down to what matters." />
          <Step n={3} title="Hold & Book" desc="Lock your fare, add travelers, and pay securely — card or wallet." />
          <Step n={4} title="Get Help" desc="Manage changes, request extras, and chat with an agent anytime." />
        </div>
      </section>

      {/* Testimonials */}
      <section className="container mx-auto max-w-6xl px-4 py-12 md:py-16">
        <SectionTitle
          eyebrow="Loved by travelers"
          title="What customers say"
        />
        <div className="mt-8 grid gap-4 md:grid-cols-3">
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
      </section>

      {/* FAQ */}
      <section className="container mx-auto max-w-4xl px-4 py-12 md:py-16">
        <SectionTitle eyebrow="FAQ" title="Answers to common questions" />
        <div className="mt-6 space-y-3">
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
      <section className="container mx-auto max-w-6xl px-4 pb-16">
        <div className="rounded-3xl border border-gray-100 bg-gradient-to-tr from-blue-50 to-emerald-50 p-6 md:p-10">
          <div className="grid items-center gap-6 md:grid-cols-2">
            <div>
              <h3 className="text-2xl md:text-3xl font-semibold text-gray-900">
                Ready to plan your next trip?
              </h3>
              <p className="mt-2 text-sm md:text-base text-gray-700">
                Search live fares, compare options you care about, and book with confidence.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 md:justify-end">
              <a
                href="/flight/availability"
                className="inline-flex items-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white shadow hover:bg-blue-700"
              >
                Search flights
              </a>
              <a
                href="/contact"
                className="inline-flex items-center rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-medium text-gray-900 hover:bg-gray-50"
              >
                Talk to us
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer mini */}
      <footer className="border-t border-gray-100 bg-white">
        <div className="container mx-auto max-w-6xl px-4 py-8 text-sm text-gray-600">
          <div className="flex flex-col items-center justify-between gap-3 md:flex-row">
            <div>© {new Date().getFullYear()} Flygasal. All rights reserved.</div>
            <div className="flex items-center gap-4">
              <a className="hover:text-gray-900" href="/terms">Terms</a>
              <a className="hover:text-gray-900" href="/privacy">Privacy</a>
              <a className="hover:text-gray-900" href="/contact">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

/* ================= Icons ================= */
const Check = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-emerald-600">
    <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/>
    <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);
const TagIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M20.59 13.41L12 22l-8-8 8-8 8.59 8.41z" stroke="currentColor" strokeWidth="2" fill="none"/>
    <circle cx="7.5" cy="14.5" r="1.5" fill="currentColor"/>
  </svg>
);
const ShieldIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M12 3l7 4v6c0 4-3 7-7 8-4-1-7-4-7-8V7l7-4z" stroke="currentColor" strokeWidth="2" fill="none"/>
    <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const PeopleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="2"/>
    <path d="M2 21v-1a5 5 0 015-5h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="17" cy="10" r="3" stroke="currentColor" strokeWidth="2"/>
    <path d="M22 21v-1a5 5 0 00-5-5h-1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);
const GlobeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
    <path d="M3 12h18M12 3c3 4 3 14 0 18M12 3c-3 4-3 14 0 18" stroke="currentColor" strokeWidth="2"/>
  </svg>
);
const SparklesIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M12 3l1.5 3.5L17 8l-3.5 1.5L12 13l-1.5-3.5L7 8l3.5-1.5L12 3zM6 15l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2zm12 0l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2z" fill="currentColor"/>
  </svg>
);

export default About;
