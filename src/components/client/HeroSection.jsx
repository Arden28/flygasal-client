import React from 'react';
import SearchTabs from './Flight/SearchTabs';

const HeroSection = () => {
    return (
        <>
        <section className="relative hero-grad text-white overflow-hidden text-black">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-28 pb-10">
            <div className="text-center py-12">
                <h1 className="text-4xl sm:text-6xl font-bold tracking-tight">Discover Your Next Adventure</h1>
                <p className="mt-3 text-lg sm:text-xl text-white/90">Book your perfect flight with confidence.</p>
            </div>
            {/* Search Tabs */}
            <SearchTabs />

            {/* Trust line */}
            <div className="mt-7 text-center text-white/90">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2">
                <span>Trusted by 100,000+ customers every year</span>
                <span className="hidden sm:inline-flex items-center gap-1 pl-2 border-l border-white/20">
                    <span className="inline-flex -space-x-0.5">
                    <img src="/assets/img/trustpilot-5star.svg" className="inline-block h-[20px] bg-aa.star rounded" />
                    </span>
                    <span className="text-white/80 text-sm">Verified by Trustpilot</span>
                </span>
                </div>
            </div>
            </div>

        </section>
        </>
    );
};

export default HeroSection;
