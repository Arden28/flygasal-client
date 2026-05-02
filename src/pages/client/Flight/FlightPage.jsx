import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { airports, airlines } from "../../../data/fakeData";
import FilterSidebar from "../../../components/client/Flight/FilterSidebar";
import SortNavigation from "../../../components/client/Flight/SortNavigation";
import ItineraryList from "../../../components/client/Flight/ItineraryList";
import Pagination from "../../../components/client/Pagination";
import FlightSearchForm from "../../../components/client/Flight/FlightSearchForm";
import flygasal from "../../../api/flygasalService";
import { motion, AnimatePresence } from "framer-motion";
import { AuthContext } from "../../../context/AuthContext";
import BookingHeader from "../../../components/client/Flight/BookingHeader";
import { createPortal } from "react-dom";

const flightsPerPage = 30;

// formatting helpers
const fmtCurrency = (amt, currency = "USD") => {
  if (!Number.isFinite(amt)) return "—";
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(amt);
  } catch {
    return `${currency} ${Math.round(amt).toLocaleString()}`;
  }
};

const fmtDuration = (mins) => {
  if (!Number.isFinite(mins)) return "—";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
};

const normalizeCabinKey = (raw = "") => {
  const s = String(raw).toUpperCase();
  if (/(^|[^A-Z])W($|[^A-Z])|PREM/.test(s)) return "PREMIUM_ECONOMY";
  if (/BUSI|(^|[^A-Z])[CJ]($|[^A-Z])/.test(s)) return "BUSINESS";
  if (/FIRST|(^|[^A-Z])F($|[^A-Z])/.test(s)) return "FIRST";
  return "ECONOMY";
};

// Simplified Baggage Label Generator using the new backend structure
const makeBaggageLabel = (offer) => {
  const adtBag = offer?.baggage?.adt;
  if (!adtBag) return null;

  const firstChecked = Object.values(adtBag.checkedBySegment || {})[0];
  const firstCarry = Object.values(adtBag.carryOnBySegment || {})[0];

  const carryTxt = firstCarry?.amount || firstCarry?.weight 
    ? `${firstCarry.amount ? `${firstCarry.amount} ` : ""}${firstCarry.weight ? `${firstCarry.weight}` : ""} carry-on`.trim()
    : "";

  const checkedTxt = firstChecked?.amount || firstChecked?.weight
    ? `${firstChecked.amount ? `${firstChecked.amount} ` : ""}${firstChecked.weight ? `${firstChecked.weight}` : ""} checked`.trim()
    : "";

  const both = [carryTxt, checkedTxt].filter(Boolean).join(" + ");
  return both || null;
};

// HELPER: Extract unique airline codes from a leg's nested segments
const getLegCarriers = (leg) => {
  if (!leg || !leg.segments) return [];
  return Array.from(new Set(leg.segments.map(s => s.airline).filter(Boolean)));
};

const FlightPage = () => {
  const { user } = useContext(AuthContext);
  const location = useLocation();

  // Core search state
  const [searchParams, setSearchParams] = useState(null);
  const [availableFlights, setAvailableFlights] = useState([]);
  const [currency, setCurrency] = useState("USD");
  const [selectedCabins, setSelectedCabins] = useState([]);

  // Filters / sorting / pagination
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(10000);
  const [priceBounds, setPriceBounds] = useState([100, 4000]);
  const [currentStop, setCurrentStop] = useState("mix");
  const [checkedOnewayValue, setCheckedOnewayValue] = useState([]);
  const [checkedReturnValue, setCheckedReturnValue] = useState([]);
  const [depTimeRange, setDepTimeRange] = useState([0, 24]);
  const [retTimeRange, setRetTimeRange] = useState([0, 24]);
  const [maxDurationHours, setMaxDurationHours] = useState(48);
  const [baggageOnly, setBaggageOnly] = useState(false);
  const [sortOrder, setSortOrder] = useState("recommended"); 
  const [currentPage, setCurrentPage] = useState(1);

  // UI State
  const [openDetailsId, setOpenDetailsId] = useState(null);
  const [isSearchFormVisible, setIsSearchFormVisible] = useState(false);
  const [filtersOpenMobile, setFiltersOpenMobile] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Expiration timer
  const [timeRemaining, setTimeRemaining] = useState(900);
  const [isExpired, setIsExpired] = useState(false);
  const timerRef = useRef(null);

  const tripType = searchParams?.tripType || "oneway";
  const legsCount = tripType === "multi" ? (searchParams?.flights?.length || 2) : tripType === "return" ? 2 : 1;
  const agentMarkupPercent = user?.agency_markup || 0;

  // ---------- Basic Helpers ----------
  const formatDate = (d) => d ? new Date(d).toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" }) : "";
  const formatTime = (d) => d ? new Date(d).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "";
  const formatTimeOnly = (d) => d ? new Date(d).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: false }) : "";
  const formatToYMD = (d) => {
    const dt = new Date(d);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
  };

  const calculateDuration = (dep, arr) => {
    const diffMins = (new Date(arr) - new Date(dep)) / (1000 * 60);
    return `${Math.floor(diffMins / 60)}h ${Math.round(diffMins % 60)}m`;
  };

  const getAirportName = (code) => airports.find((a) => a.value === code)?.label || code;
  const getAirlineName = (code) => airlines.find((x) => x.code === code)?.name || code;
  const getAirlineLogo = (code) => airlines.find((x) => x.code === code)?.logo || `/assets/img/airlines/${code}.png`;
  const toggleSearchForm = () => setIsSearchFormVisible((v) => !v);

  // === Display price = backend total with agency markup applied ===
  const displayPriceOfItin = useCallback((it) => {
    const base = it?.totalPrice || 0;
    const pct = Number(agentMarkupPercent) || 0;
    return Math.round(base * (1 + pct / 100) * 100) / 100;
  }, [agentMarkupPercent]);

  // Timer logic
  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };
  const startTimer = () => {
    stopTimer();
    setTimeRemaining(900);
    setIsExpired(false);
    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          stopTimer();
          setIsExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // ---------- Fetch flights ----------
  useEffect(() => {
    let abort = new AbortController();

    async function fetchFlights() {
      setLoading(true);
      setError("");
      setIsExpired(false);
      
      setAvailableFlights([]); 

      try {
        const qp = new URLSearchParams(location.search);
        const legs = [];
        let i = 0;
        while (qp.has(`flights[${i}][origin]`) || qp.has(`flights[${i}][destination]`) || qp.has(`flights[${i}][depart]`)) {
          legs.push({
            origin: qp.get(`flights[${i}][origin]`) || null,
            destination: qp.get(`flights[${i}][destination]`) || null,
            depart: qp.get(`flights[${i}][depart]`) || null,
          });
          i++;
        }

        const fallbackFirst = { origin: "HKG", destination: "BKK", depart: "2024-12-15" };
        const first = legs[0] || fallbackFirst;
        const last = legs[legs.length - 1] || first;
        const rawTrip = (qp.get("tripType") || "oneway").toLowerCase();
        const tripType = rawTrip === "multi" ? "multi" : rawTrip === "return" ? "return" : "oneway";

        const params = {
          tripType,
          cabinType: qp.get("flightType") || "",
          flights: legs.length ? legs : [first],
          origin: first.origin,
          destination: tripType === "multi" ? last.destination : first.destination,
          departureDate: first.depart,
          returnDate: tripType === "return" ? qp.get("returnDate") || null : null,
          adults: parseInt(qp.get("adults") || "1", 10),
          children: parseInt(qp.get("children") || "0", 10),
          infants: parseInt(qp.get("infants") || "0", 10),
        };
        setSearchParams(params);

        const res = await flygasal.searchFlights(params, { signal: abort.signal });
        const rawOffers = res.offers || [];

        const uniqueOffers = new Map();
        rawOffers.forEach(offer => {
            if (!uniqueOffers.has(offer.id)) {
                uniqueOffers.set(offer.id, offer);
            }
        });

        setAvailableFlights(Array.from(uniqueOffers.values()));
        setCurrency(rawOffers[0]?.priceBreakdown?.currency || "USD");
        startTimer();

      } catch (err) {
        if (err?.name === "AbortError") return;
        console.error("Failed to fetch flights:", err);
        setError("We couldn’t load flights for your search. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    fetchFlights();
    return () => {
      abort.abort();
      stopTimer();
    };
  }, [location.search]);

  // ---------- Build Clean Itineraries for UI ----------
  const itineraries = useMemo(() => {
    if (!availableFlights.length) return [];

    return availableFlights.map(offer => {
      const legs = offer.summary?.legs || [];
      const primaryCabin = offer.segments?.[0]?.cabinClass || "Economy";

      return {
        id: offer.id,
        rawOffer: offer, 
        outbound: legs[0] || null,
        return: legs[1] || null,
        legs: legs,
        totalPrice: offer.priceBreakdown?.totals?.grand || 0,
        totalStops: offer.totalStops || 0,
        outboundStops: offer.outboundStops ?? 0,
        returnStops: offer.returnStops ?? 0,
        airlines: offer.marketingCarriers || [], 
        cabin: primaryCabin,
        baggageLabel: makeBaggageLabel(offer),
        priceBreakdown: offer.priceBreakdown,
        journeyTime: offer.journeyTime || 0,
      };
    }).sort((a, b) => a.totalPrice - b.totalPrice);
  }, [availableFlights]);

  // ======= Recompute price bounds =======
  useEffect(() => {
    if (itineraries.length) {
      const prices = itineraries.map(displayPriceOfItin).filter(Number.isFinite);
      if (prices.length) {
        const absMin = Math.floor(Math.min(...prices));
        const absMax = Math.ceil(Math.max(...prices));
        setPriceBounds([absMin, absMax]);
        setMinPrice(absMin);
        setMaxPrice(absMax);
        return;
      }
    }
    setPriceBounds([0, 0]);
    setMinPrice(0);
    setMaxPrice(0);
  }, [itineraries, displayPriceOfItin]);

  // Filter + sort
  const filteredItineraries = useMemo(() => {
    const low = Math.max(priceBounds[0] ?? 0, Math.min(minPrice, maxPrice));
    const high = Math.min(priceBounds[1] ?? Infinity, Math.max(minPrice, maxPrice));

    const base = itineraries.filter((it) => {
      // 1. Price
      const itPrice = displayPriceOfItin(it);
      const priceOk = itPrice >= low && itPrice <= high;

      // 2. Stops
      const stopClass = it.outboundStops >= 2 ? "oneway_2" : `oneway_${it.outboundStops}`;
      const stopsOk = currentStop === "mix" || currentStop === stopClass;

      // 3. Airlines (FIXED: Using accurate segment extraction)
      const obCarriers = getLegCarriers(it.outbound);
      const rtCarriers = getLegCarriers(it.return);
      
      const owOk = checkedOnewayValue.length === 0 || obCarriers.some(c => checkedOnewayValue.includes(`oneway_${c}`));
      const rtOk = !it.return || checkedReturnValue.length === 0 || rtCarriers.some(c => checkedReturnValue.includes(`return_${c}`));

      // 4. Time windows
      const owHour = new Date(it.outbound?.departureTime || 0).getHours();
      const owTimeOk = owHour >= depTimeRange[0] && owHour <= depTimeRange[1];
      
      let rtTimeOk = true;
      if (it.return) {
        const rtHour = new Date(it.return?.departureTime || 0).getHours();
        rtTimeOk = rtHour >= retTimeRange[0] && rtHour <= retTimeRange[1];
      }

      // 5. Duration & Baggage
      const durHrs = it.journeyTime / 60;
      const durationOk = durHrs <= maxDurationHours;
      const bagOk = !baggageOnly || !!it.baggageLabel;

      // 6. Cabin
      const cabinOk = selectedCabins.length === 0 || selectedCabins.includes(normalizeCabinKey(it.cabin));

      return priceOk && stopsOk && owOk && rtOk && owTimeOk && rtTimeOk && durationOk && bagOk && cabinOk;
    });

    // Sort
    if (sortOrder === "cheapest") return [...base].sort((a, b) => displayPriceOfItin(a) - displayPriceOfItin(b));
    if (sortOrder === "quickest") return [...base].sort((a, b) => a.journeyTime - b.journeyTime);
    return base; // recommended default
  }, [
    itineraries, minPrice, maxPrice, priceBounds, currentStop,
    checkedOnewayValue, checkedReturnValue, depTimeRange, retTimeRange,
    maxDurationHours, baggageOnly, sortOrder, selectedCabins, displayPriceOfItin
  ]);

  // Summaries for SortNavigation
  const sortSummaries = useMemo(() => {
    if (!filteredItineraries.length) {
      return {
        recommended: { price: "—", duration: "—", loading },
        cheapest: { price: "—", duration: "—", loading },
        quickest: { price: "—", duration: "—", loading },
      };
    }
    const cheapest = [...filteredItineraries].sort((a, b) => displayPriceOfItin(a) - displayPriceOfItin(b))[0];
    const quickest = [...filteredItineraries].sort((a, b) => a.journeyTime - b.journeyTime)[0];
    const recommended = filteredItineraries[0];

    return {
      recommended: { price: fmtCurrency(displayPriceOfItin(recommended), currency), duration: `${fmtDuration(recommended.journeyTime)} (avg)`, loading },
      cheapest: { price: fmtCurrency(displayPriceOfItin(cheapest), currency), duration: `${fmtDuration(cheapest.journeyTime)} (avg)`, loading },
      quickest: { price: fmtCurrency(displayPriceOfItin(quickest), currency), duration: `${fmtDuration(quickest.journeyTime)} (avg)`, loading },
    };
  }, [filteredItineraries, currency, loading, displayPriceOfItin]);

  // Sidebar dynamic airline lists (FIXED: Using accurate segment extraction)
  const outboundPrimary = useMemo(() => Array.from(new Set(itineraries.flatMap(it => getLegCarriers(it.outbound)))).sort(), [itineraries]);
  const returnPrimary = useMemo(() => Array.from(new Set(itineraries.flatMap(it => getLegCarriers(it.return)))).sort(), [itineraries]);

  const airlineCountsOutbound = useMemo(() => {
    const m = {};
    itineraries.forEach(it => getLegCarriers(it.outbound).forEach(c => m[c] = (m[c] || 0) + 1));
    return m;
  }, [itineraries]);

  const airlineCountsReturn = useMemo(() => {
    const m = {};
    itineraries.forEach(it => getLegCarriers(it.return).forEach(c => m[c] = (m[c] || 0) + 1));
    return m;
  }, [itineraries]);

  // Cabin / Page Handlers
  const toggleCabin = (key) => { setSelectedCabins(p => p.includes(key) ? p.filter(k => k !== key) : [...p, key]); resetToTop(); };
  const resetCabins = () => { setSelectedCabins([]); resetToTop(); };

  const totalPages = useMemo(() => Math.ceil(filteredItineraries.length / flightsPerPage), [filteredItineraries]);
  const safePage = useMemo(() => Math.min(Math.max(currentPage, 1), totalPages || 1), [currentPage, totalPages]);
  const pageItems = useMemo(() => filteredItineraries.slice((safePage - 1) * flightsPerPage, safePage * flightsPerPage), [filteredItineraries, safePage]);

  const scrollToList = () => { const el = document.getElementById("flight--list-targets"); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); };
  const resetToTop = () => { setCurrentPage(1); setOpenDetailsId(null); scrollToList(); };

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    setOpenDetailsId(null);
    scrollToList();
  };

  const handlePriceChange = (value) => { setMinPrice(value[0]); setMaxPrice(value[1]); resetToTop(); };
  const handleStopChange = (value) => { setCurrentStop(value); resetToTop(); };
  const handleOnewayChange = (e, code) => { const v = `oneway_${code}`; setCheckedOnewayValue(p => e.target.checked ? [...p, v] : p.filter(x => x !== v)); resetToTop(); };
  const handleReturnChange = (e, code) => { const v = `return_${code}`; setCheckedReturnValue(p => e.target.checked ? [...p, v] : p.filter(x => x !== v)); resetToTop(); };

  const uniqueAirlines = useMemo(() => Array.from(new Set(itineraries.flatMap(it => it.airlines))), [itineraries]);

  
  // ---------- UI Skeletons ----------
  const HeaderSkeleton = () => (
    <div className="animate-pulse rounded-xl border border-gray-200 bg-white p-4 mb-4">
      <div className="h-5 w-48 bg-gray-200 rounded mb-2"></div>
      <div className="h-4 w-80 bg-gray-200 rounded"></div>
    </div>
  );
  
  const ListSkeleton = () => (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-2xl border border-gray-100 bg-white p-4">
          <div className="h-6 w-2/3 bg-gray-200 rounded mb-3" />
          <div className="h-4 w-1/3 bg-gray-200 rounded" />
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F7F8F9]">
      <BookingHeader searchParams={new URLSearchParams(location.search)} tripType={tripType} getAirportName={getAirportName} formatDate={formatDate} currentStep={1} />

      <motion.div className="top-0 z-20 bg-[#452003] py-3">
        <div className="container py-4">
          <div className="border-x border-b rounded-2xl border-gray-200 bg-white p-3">
            <FlightSearchForm searchParams={searchParams} setAvailableFlights={setAvailableFlights} />
          </div>
        </div>
      </motion.div>

      <div className="position-relative container-fluid pt-4 pb-4">
        <div className="container">
          {/* Mobile filter toggle */}
          <div className="mb-3 lg:hidden">
            <button className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50" onClick={() => setFiltersOpenMobile(v => !v)}>
              {filtersOpenMobile ? "Hide filters" : "Show filters"}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 9l-7 7-7-7" /></svg>
            </button>
          </div>

          <div className="row g-3">
            <div className="col-12 col-lg-5 col-xl-3">
              <AnimatePresence initial={false}>
                {filtersOpenMobile && (
                  <motion.div key="filters-mobile" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }} className="lg:hidden">
                    <div className="rounded-2xl border border-gray-200 bg-white/60 backdrop-blur p-3">
                      {/* Insert FilterSidebar component here */}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="hidden lg:block lg:top-28">
                <div className="bg-white rounded-2xl">
                  <FilterSidebar
                    currentStop={currentStop} handleStopChange={handleStopChange}
                    priceRange={[minPrice, maxPrice]} priceBounds={priceBounds} handlePriceChange={handlePriceChange}
                    uniqueAirlines={uniqueAirlines} checkedOnewayValue={checkedOnewayValue} handleOnewayChange={handleOnewayChange}
                    checkedReturnValue={checkedReturnValue} handleReturnChange={handleReturnChange}
                    getAirlineName={getAirlineName} getAirlineLogo={getAirlineLogo}
                    depTimeRange={depTimeRange} onDepTimeChange={setDepTimeRange}
                    retTimeRange={retTimeRange} onRetTimeChange={setRetTimeRange}
                    maxDurationHours={maxDurationHours} onMaxDurationChange={setMaxDurationHours}
                    baggageOnly={baggageOnly} onBaggageOnlyChange={setBaggageOnly}
                    selectedCabins={selectedCabins} onToggleCabin={toggleCabin} onResetCabins={resetCabins}
                    airlinesOutboundExact={outboundPrimary} airlinesReturnExact={returnPrimary}
                    airlineCountsOutbound={airlineCountsOutbound} airlineCountsReturn={airlineCountsReturn}
                    tripType={tripType} legsCount={legsCount}
                    onClearAll={() => {
                      setCurrentStop("mix"); setMinPrice(priceBounds[0]); setMaxPrice(priceBounds[1]);
                      setDepTimeRange([0, 24]); setRetTimeRange([0, 24]); setMaxDurationHours(48);
                      setBaggageOnly(false); setCheckedOnewayValue([]); setCheckedReturnValue([]); setSelectedCabins([]);
                      resetToTop();
                    }}
                    totalCount={filteredItineraries.length} currentPage={safePage} pageSize={flightsPerPage}
                  />
                </div>
              </div>
            </div>

            <div className="col-12 col-lg-7 col-xl-9">
              {error && (
                <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-red-800">
                  <div className="flex items-center justify-between">
                    <span>{error}</span>
                    <button className="rounded border border-red-300 px-3 py-1 text-sm hover:bg-red-100" onClick={() => window.location.reload()}>Retry</button>
                  </div>
                </div>
              )}

              {isExpired && !loading ? null : (
                <>
                  <SortNavigation sortOrder={sortOrder} handleSortChange={o => { setSortOrder(o); resetToTop(); }} loading={loading} summaries={sortSummaries} isSearchFormVisible={isSearchFormVisible} toggleSearchForm={toggleSearchForm} />
                  <div id="flight--list-targets" className="scroll-mt-28" />

                  {loading ? <ListSkeleton /> : filteredItineraries.length ? (
                    <ItineraryList
                      paginatedItineraries={pageItems}
                      searchParams={searchParams}
                      openDetailsId={openDetailsId}
                      setOpenDetailsId={setOpenDetailsId}
                      getAirlineLogo={getAirlineLogo}
                      getAirlineName={getAirlineName}
                      formatToYMD={formatToYMD}
                      formatDate={formatDate}
                      formatTime={formatTime}
                      formatTimeOnly={formatTimeOnly}
                      calculateDuration={calculateDuration}
                      getAirportName={getAirportName}
                      agentMarkupPercent={agentMarkupPercent}
                      currency={currency}
                    />
                  ) : (
                    <div className="rounded-xl border border-gray-200 bg-white p-6 text-center text-gray-600">
                      No results match your search or filters. Try widening time windows or clearing some filters.
                    </div>
                  )}

                  <Pagination currentPage={safePage} totalPages={totalPages} handlePageChange={handlePageChange} />
                </>
              )}

              {/* Expired Modal Portal */}
              {createPortal(
                <AnimatePresence>

                  {isExpired && !loading && (
                    <>
                      {/* Backdrop with blur */}
                      <motion.div
                        key="expired-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[99] bg-black/20 backdrop-blur-md"
                      />

                      {/* Centered card */}
                      <motion.div
                        key="expired-card"
                        initial={{ opacity: 0, y: 12, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.98 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Search results expired"
                      >
                        <div className="w-full max-w-[640px] overflow-hidden rounded-3xl border border-[#F68221]/20 bg-white shadow-2xl">
                          {/* Top bar / badge */}
                          <div className="flex items-center gap-2 border-b border-[#F68221]/10 bg-[#FFF6EF] px-5 py-3">
                            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#8B400E] ring-1 ring-[#F68221]/30">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#F68221]" />
                              Session timed out
                            </span>
                            <span className="ml-auto text-[12px] text-[#8B400E]/80">
                              Fares refresh every few minutes
                            </span>
                          </div>

                          {/* Body */}
                          <div className="px-6 py-6">
                            <div className="flex items-start gap-4">
                              {/* Icon */}
                              <div className="shrink-0 grid h-12 w-12 place-items-center rounded-2xl bg-[#F68221]/10 ring-1 ring-[#F68221]/20">
                                {/* Brand clock icon */}
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F68221" strokeWidth="2">
                                  <circle cx="12" cy="12" r="9" />
                                  <path d="M12 7v5l3 3" />
                                </svg>
                              </div>

                              {/* Text + actions */}
                              <div className="flex-1">
                                <h3 className="text-lg font-bold text-[#2B1A0F] tracking-tight">
                                  Your search results expired
                                </h3>
                                <p className="mt-1 text-[14px] leading-6 text-[#6A4A3A]">
                                  Prices and availability change fast. Run your search again to get fresh results,
                                  or tweak your dates and filters.
                                </p>

                                {/* Action buttons */}
                                <div className="mt-4 flex flex-wrap gap-2">
                                  <button
                                    className="inline-flex items-center gap-2 rounded-full bg-[#F68221] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#F5740A] active:bg-[#E96806] transition"
                                    onClick={() => window.location.reload()}
                                  >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <path d="M23 4v6h-6" />
                                      <path d="M20.49 15A9 9 0 1 1 6 6" />
                                    </svg>
                                    Refresh results
                                  </button>

                                  <button
                                    className="inline-flex items-center gap-2 rounded-full border border-[#F68221]/30 bg-white px-4 py-2 text-sm font-semibold text-[#8B400E] hover:bg-[#FFF2E6]"
                                    onClick={() => setIsSearchFormVisible(true)}
                                  >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <path d="M12 20h9" />
                                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
                                    </svg>
                                    Modify search
                                  </button>
                                </div>

                                {/* Tiny helper row */}
                                <div className="mt-3 flex flex-wrap items-center gap-3 text-[12px] text-[#6A4A3A]">
                                  <span className="inline-flex items-center gap-1">
                                    <span className="h-1.5 w-1.5 rounded-full bg-[#F68221]" />
                                    Live pricing
                                  </span>
                                  <span className="inline-flex items-center gap-1">
                                    <span className="h-1.5 w-1.5 rounded-full bg-[#FDBA74]" />
                                    Availability can change
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Bottom subtle bar */}
                          <div className="border-t border-[#F68221]/10 bg-[#FFF9F4] px-6 py-3 text-[12px] text-[#8B400E]">
                            Tip: acting quickly helps secure the best fare.
                          </div>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>,
                document.body
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlightPage;