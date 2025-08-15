import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { airports, airlines } from "../../data/fakeData";
import FilterModal from "../../components/client/FilterModal";
import FlightHeader from "../../components/client/FlightHeader";
import SortNavigation from "../../components/client/SortNavigation";
import ItineraryList from "../../components/client/ItineraryList";
import Pagination from "../../components/client/Pagination";
import FlightSearchForm from "../../components/client/FlightSearchForm";
import flygasal from "../../api/flygasalService";
import { motion, AnimatePresence } from "framer-motion";

const flightsPerPage = 25;
const MAX_RETURNS_PER_OUTBOUND = 6;
const MAX_RESULTS = 500; // 100 results max

const FlightPage = () => {
  const location = useLocation();

  // Core search state
  const [searchParams, setSearchParams] = useState(null);
  const [searchKey, setSearchKey] = useState(null);
  const [availableFlights, setAvailableFlights] = useState([]);
  const [returnFlights, setReturnFlights] = useState([]);

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
  const [sortOrder, setSortOrder] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);

  // UI
  const [openDetailsId, setOpenDetailsId] = useState(null);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isSearchFormVisible, setIsSearchFormVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Expiration timer
  const [timeRemaining, setTimeRemaining] = useState(900);
  const [isExpired, setIsExpired] = useState(false);
  const timerRef = useRef(null);

  // Markup
  const agentMarkupPercent =
    typeof window !== "undefined" && window.__AGENT__?.agent_markup != null
      ? Number(window.__AGENT__.agent_markup)
      : 0;
  const currency = "USD";

  // ---------- Helpers ----------
  const formatTimer = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec < 10 ? "0" : ""}${sec}`;
  };

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" }) : "";
  const formatTime = (d) =>
    d ? new Date(d).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "";
  const formatTimeOnly = (d) =>
    d ? new Date(d).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: false }) : "";
  const formatToYMD = (d) => {
    const dt = new Date(d);
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, "0");
    const day = String(dt.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const calculateDuration = (dep, arr) => {
    const diffMins = (new Date(arr) - new Date(dep)) / (1000 * 60);
    const h = Math.floor(diffMins / 60);
    const m = Math.round(diffMins % 60);
    return `${h}h ${m}m`;
  };

  const getAirportName = (code) => airports.find((a) => a.value === code)?.label || code;
  const getAirlineName = (code) => airlines.find((x) => x.code === code)?.name || code;
  const getAirlineLogo = (code) => airlines.find((x) => x.code === code)?.logo || `/assets/img/airlines/${code}.png`;
  const toggleSearchForm = () => setIsSearchFormVisible((v) => !v);

  // Advanced filters helpers
  const getHour = (dt) => (dt ? new Date(dt).getHours() : 0);
  const hasBaggage = (obj) => {
    const b = obj?.baggage || obj?.segments?.[0]?.baggage || "";
    return typeof b === "string" ? /([1-9]PC|KG)/i.test(b) : !!b;
  };
  const totalDurationMins = (outbound, ret) => {
    const dep1 = new Date(outbound?.segments?.[0]?.departureTime || outbound?.departureTime);
    const arr1 = new Date(outbound?.segments?.slice(-1)?.[0]?.arrivalTime || outbound?.arrivalTime);
    let mins = Math.max(0, (arr1 - dep1) / 60000);
    if (ret) {
      const dep2 = new Date(ret?.segments?.[0]?.departureTime || ret?.departureTime);
      const arr2 = new Date(ret?.segments?.slice(-1)?.[0]?.arrivalTime || ret?.arrivalTime);
      mins += Math.max(0, (arr2 - dep2) / 60000);
    }
    return Math.round(mins);
  };

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
          setAvailableFlights([]);
          setReturnFlights([]);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // ---------- Fetch flights ----------
  useEffect(() => {
    let abort = new AbortController();
    const fetchFlights = async () => {
      setLoading(true);
      setError("");
      setIsExpired(false);
      try {
        const qp = new URLSearchParams(location.search);

        // Legs
        const legs = [];
        let i = 0;
        while (qp.has(`flights[${i}][origin]`)) {
          legs.push({
            origin: qp.get(`flights[${i}][origin]`),
            destination: qp.get(`flights[${i}][destination]`),
            depart: qp.get(`flights[${i}][depart]`),
          });
          i++;
        }

        const first = legs[0] || { origin: "HKG", destination: "BKK", depart: "2024-12-15" };
        const rawTrip = (qp.get("tripType") || "oneway").toLowerCase();
        const tripType = rawTrip === "return" ? "return" : "oneway";
        const flightType = qp.get("flightType") || "Economy";

        const params = {
          flights: legs.length ? legs : [first],
          tripType,
          cabinType: flightType,
          origin: first.origin,
          destination: first.destination,
          departureDate: first.depart,
          returnDate: qp.get("returnDate") || null,
          adults: parseInt(qp.get("adults") || "1", 10),
          children: parseInt(qp.get("children") || "0", 10),
          infants: parseInt(qp.get("infants") || "0", 10),
        };

        setSearchParams(params);

        // Outbound
        const res = await flygasal.searchFlights(params, { signal: abort.signal });
        const data = res.data;
        const newKey = data?.searchKey || null;
        const outbound = flygasal.transformPKFareData(data) || [];

        // Return
        let rtn = [];
        if (tripType === "return" && params.returnDate) {
          const returnParams = {
            ...params,
            flights: [{ origin: params.destination, destination: params.origin, depart: params.returnDate }],
          };
          const r = await flygasal.searchFlights(returnParams, { signal: abort.signal });
          rtn = flygasal.transformPKFareData(r.data) || [];
        }

        setAvailableFlights(outbound);
        setReturnFlights(rtn);

        // Dynamic price bounds
        const allPrices = [...outbound, ...rtn].map((f) => f.price).filter((p) => typeof p === "number");
        if (allPrices.length) {
          const absMin = Math.floor(Math.min(...allPrices));
          const absMax = Math.ceil(Math.max(...allPrices));
          setPriceBounds([absMin, absMax]);
          setMinPrice(absMin);
          setMaxPrice(absMax);
        } else {
          setPriceBounds([100, 4000]);
          setMinPrice(0);
          setMaxPrice(10000);
        }

        // searchKey
        if (newKey) {
          setSearchKey(newKey);
          qp.set("searchKey", newKey);
          const newUrl = `${window.location.pathname}?${qp.toString()}`;
          window.history.replaceState(null, "", newUrl);
        }

        startTimer();
      } catch (err) {
        if (err?.name === "AbortError") return;
        console.error("Failed to fetch flights:", err);
        setError("We couldn’t load flights for your search. Please try again.");
        setAvailableFlights([]);
        setReturnFlights([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFlights();
    return () => {
      abort.abort();
      stopTimer();
    };
  }, [location.search]);

  // ---------- Derived lists ----------
  const itineraries = useMemo(() => {
    if (!searchParams) return [];

    if (searchParams.tripType === "return") {
      const items = [];
      // sort returns once (cheapest first) and reuse for all outbounds
      const sortedReturns = [...returnFlights].sort(
        (a, b) => (a.price || 0) - (b.price || 0)
      );

      for (const out of availableFlights) {
        const topReturns = sortedReturns.slice(0, MAX_RETURNS_PER_OUTBOUND);
        for (const ret of topReturns) {
          items.push({
            id: `${out.id}-${ret.id}`,
            outbound: out,
            return: ret,
            totalPrice: (out.price || 0) + (ret.price || 0),
            totalStops: (out.stops || 0) + (ret.stops || 0),
            airlines: [...new Set([out.airline, ret.airline])],
            cabin: out.segments?.[0]?.cabinClass || "Economy",
            baggage: out.segments?.[0]?.baggage || "1PC 7KG carry-on",
            refundable: false,
          });
          // if (items.length >= MAX_RESULTS) break;
        }
        // if (items.length >= MAX_RESULTS) break;
      }
      return items;
    }

    // oneway
    return (availableFlights || []).map((f) => ({
      id: f.id,
      outbound: f,
      return: null,
      totalPrice: f.price || 0,
      totalStops: f.stops || 0,
      airlines: [f.airline],
      cabin: f.segments?.[0]?.cabinClass || "Economy",
      baggage: f.segments?.[0]?.baggage || "1PC 7KG carry-on",
      refundable: false,
    }));
  }, [searchParams, availableFlights, returnFlights]);

  // Filter + sort
  const filteredItineraries = useMemo(() => {
    return itineraries
      .filter((it) => {
        const priceOk = it.totalPrice >= minPrice && it.totalPrice <= maxPrice;

        // normalize stops: 0 / 1 / 2+
        const stopsCount = Math.max(0, Number.isFinite(it.totalStops) ? it.totalStops : 0);
        const stopClass = stopsCount >= 2 ? "oneway_2" : `oneway_${stopsCount}`;
        const stopsOk = currentStop === "mix" || currentStop === stopClass;

        // outbound vs return airline filters
        const obCode = it.outbound?.airline || "";
        const rtCode = it.return?.airline || "";

        const owOk =
          checkedOnewayValue.length === 0 || (obCode && checkedOnewayValue.includes(`oneway_${obCode}`));

        const rtOk =
          !it.return ||
          checkedReturnValue.length === 0 ||
          (rtCode && checkedReturnValue.includes(`return_${rtCode}`));

        // time windows
        const owDep = getHour(it.outbound?.segments?.[0]?.departureTime || it.outbound?.departureTime);
        const owTimeOk = owDep >= depTimeRange[0] && owDep <= depTimeRange[1];

        let rtTimeOk = true;
        if (it.return) {
          const rtDep = getHour(it.return?.segments?.[0]?.departureTime || it.return?.departureTime);
          rtTimeOk = rtDep >= retTimeRange[0] && rtDep <= retTimeRange[1];
        }

        // duration + baggage
        const durHrs = totalDurationMins(it.outbound, it.return) / 60;
        const durationOk = durHrs <= maxDurationHours;
        const bagOk = !baggageOnly || hasBaggage(it.outbound) || (it.return && hasBaggage(it.return));

        return priceOk && stopsOk && owOk && rtOk && owTimeOk && rtTimeOk && durationOk && bagOk;
      })
      .sort((a, b) => (sortOrder === "asc" ? a.totalPrice - b.totalPrice : b.totalPrice - a.totalPrice));
  }, [
    itineraries,
    minPrice,
    maxPrice,
    currentStop,
    checkedOnewayValue,
    checkedReturnValue,
    depTimeRange,
    retTimeRange,
    maxDurationHours,
    baggageOnly,
    sortOrder,
  ]);

  // ---------- Pagination guards (fix blank on return) ----------
  const totalPages = useMemo(
    () => Math.ceil(filteredItineraries.length / flightsPerPage),
    [filteredItineraries]
  );

  // clamp the page the UI will actually use
  const safePage = useMemo(
    () => Math.min(Math.max(currentPage, 1), totalPages || 1),
    [currentPage, totalPages]
  );

  // keep state in sync if it drifted out of range (esp. after filters/sort)
  useEffect(() => {
    if (currentPage !== safePage) {
      setCurrentPage(safePage);
      setOpenDetailsId(null); // also collapse any open drawer on correction
    }
  }, [safePage]); // eslint-disable-line react-hooks/exhaustive-deps

  // slice once based on the clamped page
  const pageItems = useMemo(
    () =>
      filteredItineraries.slice(
        (safePage - 1) * flightsPerPage,
        safePage * flightsPerPage
      ),
    [filteredItineraries, safePage]
  );

  // (optional) keep your listKey but use the clamped page
  const listKey = useMemo(
    () =>
      JSON.stringify({
        minPrice, maxPrice, currentStop,
        checkedOnewayValue, checkedReturnValue,
        depTimeRange, retTimeRange,
        maxDurationHours, baggageOnly, sortOrder,
        page: safePage,            // <-- was currentPage
      }),
    [minPrice,maxPrice,currentStop,checkedOnewayValue,checkedReturnValue,depTimeRange,retTimeRange,maxDurationHours,baggageOnly,sortOrder,safePage]
  );

  // ---------- Smooth scrolling + details reset ----------
  const scrollToList = () => {
    const el = document.getElementById("flight--list-targets");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const resetToTop = () => {
    setCurrentPage(1);
    setOpenDetailsId(null);
    scrollToList();
  };

  // ---------- Handlers ----------
  const handlePageChange = (page) => {
    const total = Math.ceil(filteredItineraries.length / flightsPerPage);
    if (page < 1 || page > total) return;
    setCurrentPage(page);
    setOpenDetailsId(null);
    scrollToList();
  };

  const handlePriceChange = (value) => {
    setMinPrice(value[0]);
    setMaxPrice(value[1]);
    resetToTop();
  };
  const handleStopChange = (value) => {
    setCurrentStop(value);
    resetToTop();
  };
  const handleOnewayChange = (e, airline) => {
    const v = `oneway_${airline}`;
    setCheckedOnewayValue((prev) => (e.target.checked ? [...prev, v] : prev.filter((x) => x !== v)));
    resetToTop();
  };
  const handleReturnChange = (e, airline) => {
    const v = `return_${airline}`;
    setCheckedReturnValue((prev) => (e.target.checked ? [...prev, v] : prev.filter((x) => x !== v)));
    resetToTop();
  };

  const uniqueAirlines = useMemo(
    () =>
      [...new Set([...availableFlights, ...returnFlights].map((f) => f?.airline).filter(Boolean))],
    [availableFlights, returnFlights]
  );

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

  // ---------- Render ----------
  return (
    <div className="">
      {/* Sticky modify search */}
      <motion.div className="sticky top-0 z-20 bg-[rgba(255,255,255,.75)] backdrop-blur border-b border-gray-200">
        <div className="container py-2">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {searchParams ? (
                <>
                  <span className="font-medium text-gray-800">{getAirportName(searchParams.origin)}</span>
                  <span className="mx-2">→</span>
                  <span className="font-medium text-gray-800">{getAirportName(searchParams.destination)}</span>
                  {searchParams.departureDate && (
                    <span className="ml-3">
                      {formatDate(searchParams.departureDate)}
                      {searchParams.returnDate ? ` – ${formatDate(searchParams.returnDate)}` : ""}
                    </span>
                  )}
                  <span className="ml-3">
                    {(searchParams.adults || 1) + (searchParams.children || 0) + (searchParams.infants || 0)} pax
                  </span>
                </>
              ) : (
                <span>Loading…</span>
              )}
            </div>
            <button
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
              onClick={() => setIsSearchFormVisible((v) => !v)}
            >
              {isSearchFormVisible ? "Hide search" : "Modify search"}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
        <AnimatePresence initial={false}>
          {isSearchFormVisible && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
            >
              <div className="container">
                <div className="border-x border-b rounded-b-2xl border-gray-200 bg-white p-3">
                  <FlightSearchForm
                    searchParams={searchParams}
                    setAvailableFlights={setAvailableFlights}
                    setReturnFlights={setReturnFlights}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <div className="position-relative container-fluid pt-4 pb-4">
        <div className="container">
          <div className="row g-3">
            <div className="col-lg-12">
              {/* Error / Expired */}
              {error && (
                <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-red-800">
                  <div className="flex items-center justify-between">
                    <span>{error}</span>
                    <button
                      className="rounded border border-red-300 px-3 py-1 text-sm hover:bg-red-100"
                      onClick={() => window.location.reload()}
                    >
                      Retry
                    </button>
                  </div>
                </div>
              )}

              {isExpired && !loading ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center text-yellow-800">
                  Search results have expired. Please modify your search above.
                </div>
              ) : (
                <>
                  {/* Header */}
                  {loading ? (
                    <HeaderSkeleton />
                  ) : (
                    <FlightHeader
                      onOpen={() => setIsFilterModalOpen(true)}
                      filteredItineraries={filteredItineraries}
                      searchParams={searchParams}
                      formatDate={formatDate}
                      loading={loading}
                    />
                  )}

                  {/* Timer */}
                  <motion.div
                    className="flex items-center justify-between gap-3 bg-white border border-gray-300 rounded-lg py-2 px-4 mb-4 text-sm text-gray-700"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <span className="text-start">
                      <i className="bi bi-clock" /> Time Remaining
                    </span>
                    <div className="flex-1 mx-3 h-2 bg-gray-200 rounded overflow-hidden">
                      <div
                        className="h-full bg-blue-600"
                        style={{ width: `${(timeRemaining / 900) * 100}%`, transition: "width 1s linear" }}
                      />
                    </div>
                    <span className="text-end fw-bold">{formatTimer(timeRemaining)}</span>
                  </motion.div>

                  {/* Sort */}
                  <SortNavigation
                    sortOrder={sortOrder}
                    handleSortChange={(order) => {
                      setSortOrder(order);
                      resetToTop();
                    }}
                    isSearchFormVisible={isSearchFormVisible}
                    toggleSearchForm={toggleSearchForm}
                  />

                  {/* Anchor for smooth scroll */}
                  <div id="flight--list-targets" className="scroll-mt-28" />

                  {/* List */}
                  {loading ? (
                    <ListSkeleton />
                  ) : filteredItineraries.length ? (
                    <ItineraryList
                      key={listKey}
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
                      totalCount={filteredItineraries.length}
                      currentPage={safePage}                        
                      pageSize={flightsPerPage}
                    />
                  ) : (
                    <div className="rounded-xl border border-gray-200 bg-white p-6 text-center text-gray-600">
                      No results match your filters. Try widening time windows or clearing some filters.
                    </div>
                  )}

                  {/* Pagination */}
                  <Pagination
                    currentPage={safePage}                           
                    totalPages={totalPages}
                    handlePageChange={handlePageChange}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filters Modal */}
      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        currentStop={currentStop}
        handleStopChange={handleStopChange}
        priceRange={[minPrice, maxPrice]}
        priceBounds={priceBounds}
        handlePriceChange={handlePriceChange}
        uniqueAirlines={uniqueAirlines}
        checkedOnewayValue={checkedOnewayValue}
        handleOnewayChange={handleOnewayChange}
        checkedReturnValue={checkedReturnValue}
        handleReturnChange={handleReturnChange}
        getAirlineName={getAirlineName}
        getAirlineLogo={getAirlineLogo}
        depTimeRange={depTimeRange}
        onDepTimeChange={setDepTimeRange}
        retTimeRange={retTimeRange}
        onRetTimeChange={setRetTimeRange}
        maxDurationHours={maxDurationHours}
        onMaxDurationChange={setMaxDurationHours}
        baggageOnly={baggageOnly}
        onBaggageOnlyChange={setBaggageOnly}
        returnFlights={returnFlights}
        onClearAll={() => {
          setCurrentStop("mix");
          setMinPrice(priceBounds[0]);
          setMaxPrice(priceBounds[1]);
          setDepTimeRange([0, 24]);
          setRetTimeRange([0, 24]);
          setMaxDurationHours(48);
          setBaggageOnly(false);
          setCheckedOnewayValue([]);
          setCheckedReturnValue([]);
          resetToTop();
        }}
      />
    </div>
  );
};

export default FlightPage;
