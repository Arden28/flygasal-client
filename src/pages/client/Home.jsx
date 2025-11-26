import React from 'react';
import SearchTabs from '../../components/client/Flight/SearchTabs';
import { 
  ShieldCheck, CreditCard, ArrowRight, MapPin, 
  Star, Headphones, Luggage, MessageCircle, Phone, ArrowUpRight 
} from 'lucide-react';

const Home = () => {
  return (
    <>
      <style>{`
        /* Infinite Scroll Animation */
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .marquee-container {
          overflow: hidden;
          position: relative;
        }
        .marquee-content {
          display: flex;
          width: fit-content;
          animation: scroll 40s linear infinite;
        }
        .marquee-content:hover {
          animation-play-state: paused;
        }
        
        /* Smooth Fade for Images */
        .img-zoom-container {
          overflow: hidden;
        }
        .img-zoom-container img {
          transition: transform 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        .img-zoom-container:hover img {
          transform: scale(1.05);
        }

        /* Bento Grid Hover Effects */
        .bento-card {
           transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .bento-card:hover {
           transform: translateY(-4px);
           box-shadow: 0 20px 40px -5px rgba(0, 0, 0, 0.05);
        }

        /* Tech Pattern Background */
        .bg-dot-pattern {
          background-image: radial-gradient(#cbd5e1 1px, transparent 1px);
          background-size: 24px 24px;
        }
      `}</style>

      <div className="min-h-screen font-sans bg-white selection:bg-orange-100 selection:text-orange-900">
        
        {/* --- 1. HERO SECTION (Unchanged) --- */}
        <section className="relative w-full pb-32">
          <div className="relative h-[600px] w-full overflow-hidden rounded-b-[3rem] shadow-2xl shadow-orange-900/5">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: "url('/assets/img/visitor.jpg')" }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-transparent" />
            <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-24 text-center text-white">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 backdrop-blur-md mb-8">
                <span className="flex h-2 w-2 rounded-full bg-orange-400 animate-pulse"></span>
                <span className="text-sm font-medium tracking-wide">The new way to fly is here</span>
              </div>
              <h1 className="text-4xl sm:text-7xl font-semibold tracking-tight mb-6 drop-shadow-lg">
                The world is waiting. <br/>
                <span className="text-orange-400">Go get it.</span>
              </h1>
              <p className="text-lg sm:text-xl text-white/90 max-w-2xl mx-auto font-light leading-relaxed">
                Book your perfect flight with confidence. Compare 600+ airlines and pay the way you want.
              </p>
            </div>
          </div>
          <div className="relative -mt-35 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 z-20">
               <SearchTabs />
            <div className="mt-8 flex justify-center">
              <div className="inline-flex items-center gap-3 bg-white px-5 py-2 rounded-full shadow-sm border border-slate-100 text-slate-600 text-sm font-medium">
                 <img src="/assets/img/trustpilot-5star.svg" alt="Trustpilot" className="h-5" />
                 <span>Trusted by <strong className="text-slate-900">1000+</strong> customers</span>
              </div>
            </div>
          </div>
        </section>

        {/* --- 2. VALUE PROPOSITION (PRO BENTO GRID) --- */}
        <section className="py-24 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4 tracking-tight">
                Why savvy travelers choose <span className="text-orange-600">Fly Gasal</span>
              </h2>
              <p className="text-slate-500 max-w-2xl mx-auto text-lg">We’ve re-engineered the booking experience to be faster, safer, and more flexible.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 grid-rows-2 gap-6 h-auto md:h-[600px]">
              
              {/* Feature 1: Global Inventory (Large Vertical with Live Map feel) */}
              <div className="bento-card md:row-span-2 bg-slate-50 rounded-[2.5rem] p-8 relative overflow-hidden group border border-slate-100">
                 <div className="absolute inset-0 bg-dot-pattern opacity-30"></div>
                 <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:opacity-10 transition-opacity transform rotate-12">
                    <MapPin size={180} />
                 </div>
                 
                 <div className="relative z-10 flex flex-col h-full justify-between">
                    <div>
                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-6 text-orange-600 ring-1 ring-slate-100">
                           <MapPin size={28} />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-3">Global Inventory</h3>
                        <p className="text-slate-500 leading-relaxed font-medium">Access 600+ airlines instantly. From local budget carriers to international first-class suites, we connect you to every corner of the globe.</p>
                    </div>
                    
                    {/* Visual Widget: Live Flight Routes */}
                    <div className="mt-8 w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-4 opacity-90">
                        <div className="flex items-center gap-3 mb-3 border-b border-slate-50 pb-3">
                           <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                           <span className="text-xs font-bold text-slate-400 tracking-wider">LIVE ROUTES</span>
                        </div>
                        <div className="space-y-3">
                           <div className="flex justify-between items-center group/item hover:bg-slate-50 p-1 rounded transition-colors">
                              <span className="text-sm font-semibold text-slate-700">JED <span className="text-slate-300">→</span> LHR</span>
                              <span className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded-full font-bold">$420</span>
                           </div>
                           <div className="flex justify-between items-center group/item hover:bg-slate-50 p-1 rounded transition-colors">
                              <span className="text-sm font-semibold text-slate-700">DXB <span className="text-slate-300">→</span> JFK</span>
                              <span className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded-full font-bold">$650</span>
                           </div>
                        </div>
                    </div>
                 </div>
              </div>

              {/* Feature 2: Flexible Payments (Horizontal with App UI) */}
              <div className="bento-card md:col-span-2 bg-blue-50/40 border border-blue-100 rounded-[2.5rem] p-8 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
                 <div className="flex-1 relative z-10">
                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-4 text-blue-600 shadow-sm ring-1 ring-blue-50">
                       <CreditCard size={28} />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">Fly Now, Pay Later</h3>
                    <p className="text-slate-600 font-medium">Don't let budget stop you. Split your booking into manageable monthly installments with 0% interest options available.</p>
                 </div>
                 
                 {/* Visual Widget: Payment Success Card */}
                 <div className="w-full md:w-1/3 bg-white rounded-2xl p-5 shadow-xl shadow-blue-900/5 rotate-2 border border-slate-100 transform transition-transform group-hover:rotate-0">
                     <div className="flex justify-between items-center mb-4">
                        <div className="w-8 h-5 bg-gradient-to-r from-orange-400 to-orange-600 rounded-md shadow-sm"></div>
                        <span className="text-[10px] font-bold text-slate-400 tracking-widest">VISA</span>
                     </div>
                     <div className="space-y-3 mb-4">
                        <div className="h-2 bg-slate-100 rounded-full w-full"></div>
                        <div className="h-2 bg-slate-100 rounded-full w-2/3"></div>
                     </div>
                     <div className="flex gap-2">
                        <div className="flex-1 h-1.5 bg-green-500 rounded-full"></div>
                        <div className="flex-1 h-1.5 bg-green-500 rounded-full"></div>
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full"></div>
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full"></div>
                     </div>
                     <div className="mt-2 text-right">
                        <span className="text-[10px] font-bold text-slate-400">2 of 4 PAID</span>
                     </div>
                 </div>
              </div>

              {/* Feature 3: Protection (Compact) */}
              <div className="bento-card bg-white border border-slate-100 rounded-[2.5rem] p-8 relative overflow-hidden">
                 <div className="relative z-10">
                    <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center mb-4 text-orange-600">
                       <ShieldCheck size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Total Protection</h3>
                    <p className="text-slate-500 text-sm font-medium">Instant refund guarantees and 24/7 support for cancellations.</p>
                 </div>
              </div>

              {/* Feature 4: Support (Compact) */}
              <div className="bento-card bg-white border border-slate-100 rounded-[2.5rem] p-8 relative overflow-hidden group">
                 <div className="relative z-10">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 text-slate-700">
                       <Headphones size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Human Support</h3>
                    <p className="text-slate-500 text-sm font-medium">No bots. Real travel agents ready to help you via WhatsApp or Call.</p>
                 </div>
              </div>

            </div>
          </div>
        </section>

        {/* --- 3. DESTINATIONS (Unchanged) --- */}
        <section className="py-20 bg-slate-50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-end mb-12">
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">Trending Destinations</h2>
                <p className="text-slate-500 mt-2">Curated locations ready for your arrival.</p>
              </div>
              <a href="#" className="hidden sm:flex items-center gap-2 text-orange-600 font-semibold hover:text-orange-700 transition-colors group">
                View all <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-2 gap-4 h-[600px]">
              <div className="md:col-span-2 md:row-span-2 relative group rounded-3xl overflow-hidden cursor-pointer img-zoom-container">
                <img src="/assets/img/destinations/france.webp" alt="France" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-90" />
                <div className="absolute bottom-0 left-0 p-8">
                  <p className="text-orange-400 font-semibold text-sm mb-1 uppercase tracking-wider">Europe</p>
                  <h3 className="text-white text-3xl font-bold">Paris, France</h3>
                </div>
              </div>
              <div className="md:col-span-2 relative group rounded-3xl overflow-hidden cursor-pointer img-zoom-container">
                <img src="/assets/img/destinations/australia.webp" alt="Australia" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-0 left-0 p-6">
                  <h3 className="text-white text-xl font-bold">Sydney, Australia</h3>
                </div>
              </div>
              <div className="relative group rounded-3xl overflow-hidden cursor-pointer img-zoom-container">
                 <img src="/assets/img/destinations/hongkong.webp" alt="Hong Kong" className="absolute inset-0 w-full h-full object-cover" />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                 <div className="absolute bottom-0 left-0 p-6">
                  <h3 className="text-white text-lg font-bold">Hong Kong</h3>
                </div>
              </div>
              <div className="relative group rounded-3xl overflow-hidden cursor-pointer img-zoom-container">
                 <img src="/assets/img/destinations/usa.webp" alt="USA" className="absolute inset-0 w-full h-full object-cover" />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                 <div className="absolute bottom-0 left-0 p-6">
                  <h3 className="text-white text-lg font-bold">New York, USA</h3>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- 4. FEATURE SPLIT (Unchanged) --- */}
        <section className="py-20 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
             <div className="bg-slate-900 rounded-[3rem] overflow-hidden text-white relative">
                <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-orange-500 rounded-full blur-[100px] opacity-20"></div>
                <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-blue-500 rounded-full blur-[100px] opacity-20"></div>
                <div className="grid md:grid-cols-2 items-center">
                    <div className="p-12 md:p-20 relative z-10">
                        <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-3 py-1 mb-6 text-sm font-medium text-orange-300">
                          <CreditCard className="w-4 h-4" />
                          <span>Flexible Finance</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">Delay payments, <br/> not your dreams.</h2>
                        <p className="text-slate-300 text-lg mb-8 leading-relaxed">Life happens. Don't let budget constraints stop you from exploring. With our flexible payment options, you can secure your ticket today and pay when you're ready.</p>
                        <a href="#" className="inline-flex items-center gap-2 bg-white text-slate-900 px-8 py-4 rounded-full font-bold hover:bg-orange-50 transition-colors">Explore Options <ArrowRight className="w-4 h-4" /></a>
                    </div>
                    <div className="h-full min-h-[400px] md:min-h-full relative">
                       <img src="/assets/img/agent.jpg" alt="Agent" className="absolute inset-0 w-full h-full object-cover md:rounded-l-[3rem]" />
                       <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-transparent to-transparent md:bg-gradient-to-l"></div>
                    </div>
                </div>
             </div>
          </div>
        </section>

        {/* --- 5. AIRLINES (Unchanged) --- */}
        <section className="py-16 bg-slate-50 overflow-hidden">
           <div className="text-center mb-10">
              <h3 className="text-slate-400 font-semibold uppercase tracking-widest text-sm">Connecting you to the world's best</h3>
           </div>
           <div className="marquee-container">
              <div className="marquee-content gap-12 px-6">
                {['WB.png', 'eth.png', 'KQ.png', 'msr.png', 'BA.png', 'B6.png', 'baw.png', 'skv.png', 'qtr.png', 'etd.png', 'afr.png', 'aal.png', 'qantas.png', 'easyjet.png', 'klm.png', 'british-airways.png', 'china-southern.png', 'flysafair.png', 'WB.png', 'eth.png', 'KQ.png'].map((logo, index) => (
                  <div key={index} className="flex-shrink-0 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-300 cursor-pointer">
                    <img src={`/assets/img/airlines/${logo}`} alt="airline" className="h-10 w-auto object-contain" />
                  </div>
                ))}
              </div>
           </div>
        </section>

        {/* --- 6. TESTIMONIAL (Unchanged) --- */}
        <section className="relative py-24">
           <div className="absolute inset-0">
              <img src="/assets/img/bottom-tp-block-3.webp" alt="Background" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-slate-900/70"></div>
           </div>
           <div className="relative z-10 mx-auto max-w-4xl px-4 text-center">
              <div className="flex justify-center mb-8 text-orange-400">
                  <Star className="w-6 h-6 fill-current" />
                  <Star className="w-6 h-6 fill-current" />
                  <Star className="w-6 h-6 fill-current" />
                  <Star className="w-6 h-6 fill-current" />
                  <Star className="w-6 h-6 fill-current" />
              </div>
              <blockquote className="text-3xl md:text-5xl font-serif text-white leading-tight mb-8">"It felt like chasing a sunset across the savannah. Thanks to Fly Gasal, the journey home finally became real."</blockquote>
              <cite className="text-slate-300 not-italic font-medium text-lg">— Sarah Jenkins, <span className="text-orange-400">Verified Traveler</span></cite>
           </div>
        </section>

        {/* --- 7. LAST SECTION: CONCIERGE & UTILITIES (LIGHT & PRO) --- */}
        <section className="py-24 bg-gradient-to-b from-slate-50 to-white relative overflow-hidden">
          <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row gap-8 items-stretch">
                
                {/* Left: Premium Contact Card (Dark Contrast) */}
                <div className="lg:w-2/5 flex flex-col justify-between bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-slate-200">
                    <div className="relative z-10">
                        <div className="inline-flex items-center gap-2 bg-orange-500 rounded-full px-3 py-1 mb-6 text-sm font-bold text-white">
                           <Star size={14} fill="white" />
                           <span>Premium Service</span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Need a hand?</h2>
                        <p className="text-slate-300 text-lg leading-relaxed mb-8">Our expert travel agents are online 24/7 to assist with bookings, changes, or emergency travel needs.</p>
                        
                        <div className="space-y-4">
                           <a href="#" className="flex items-center justify-between bg-white/10 hover:bg-white/20 p-4 rounded-2xl transition-all group">
                               <div className="flex items-center gap-4">
                                   <div className="bg-green-500 p-2 rounded-full text-white"><MessageCircle size={20} /></div>
                                   <div>
                                       <div className="font-bold text-sm">Chat on WhatsApp</div>
                                       <div className="text-xs text-slate-400">Avg response: 2 mins</div>
                                   </div>
                               </div>
                               <ArrowUpRight className="text-slate-500 group-hover:text-white transition-colors" />
                           </a>
                           <a href="#" className="flex items-center justify-between bg-white/10 hover:bg-white/20 p-4 rounded-2xl transition-all group">
                               <div className="flex items-center gap-4">
                                   <div className="bg-blue-500 p-2 rounded-full text-white"><Phone size={20} /></div>
                                   <div>
                                       <div className="font-bold text-sm">Call Support</div>
                                       <div className="text-xs text-slate-400">Toll-free, 24/7</div>
                                   </div>
                               </div>
                               <ArrowUpRight className="text-slate-500 group-hover:text-white transition-colors" />
                           </a>
                        </div>
                    </div>
                    
                    {/* Abstract Circle Decoration */}
                    <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-slate-800 rounded-full opacity-50"></div>
                </div>

                {/* Right: Utility Grid (Light Glass) */}
                <div className="lg:w-3/5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    {/* Manage Booking */}
                    <a href="/dashboard" className="bg-white border border-slate-200 p-8 rounded-[2.5rem] hover:border-orange-200 hover:shadow-xl hover:shadow-orange-900/5 transition-all hover:scale-[1.01] cursor-pointer group flex flex-col justify-center">
                        <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <Luggage size={28} />
                        </div>
                        <h4 className="font-bold text-2xl text-slate-900 mb-2">Manage Booking</h4>
                        <p className="text-slate-500 font-medium">Change dates, add extra baggage, or check-in online instantly.</p>
                    </a>

                    {/* Help Centre */}
                    <a href="/help" className="bg-white border border-slate-200 p-8 rounded-[2.5rem] hover:border-orange-200 hover:shadow-xl hover:shadow-orange-900/5 transition-all hover:scale-[1.01] cursor-pointer group flex flex-col justify-center">
                        <div className="w-14 h-14 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                            <Headphones size={28} />
                        </div>
                        <h4 className="font-bold text-2xl text-slate-900 mb-2">Help Centre</h4>
                        <p className="text-slate-500 font-medium">Find answers to frequently asked questions about visas, refunds, and more.</p>
                    </a>

                    {/* About Us (Wide) */}
                    <a href="/about" className="sm:col-span-2 bg-slate-50 border border-slate-200 p-8 rounded-[2.5rem] hover:bg-white hover:shadow-lg transition-all flex items-center justify-between group">
                         <div>
                            <h4 className="font-bold text-xl text-slate-900 mb-1 group-hover:text-orange-600 transition-colors">About Fly Gasal</h4>
                            <p className="text-slate-500">Learn why we are the fastest growing agency.</p>
                         </div>
                         <div className="bg-white w-12 h-12 rounded-full flex items-center justify-center shadow-sm group-hover:translate-x-2 transition-transform text-slate-900 border border-slate-100">
                            <ArrowRight size={20} />
                         </div>
                    </a>

                </div>

            </div>
          </div>
        </section>

      </div>
    </>
  );
};

export default Home;