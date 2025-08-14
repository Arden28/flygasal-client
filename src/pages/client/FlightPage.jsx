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

/**
 * FlightPage (Refined + Advanced Filters)
 * - Adds dep/return time windows, max duration, baggage-only, dynamic price bounds
 * - Keeps your stable searchKey, timer, skeletons, and error handling
 */

const flightsPerPage = 25;

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
  const [priceBounds, setPriceBounds] = useState([100, 4000]); // NEW absolute min/max
  const [currentStop, setCurrentStop] = useState("mix");
  const [checkedOnewayValue, setCheckedOnewayValue] = useState([]);
  const [checkedReturnValue, setCheckedReturnValue] = useState([]);
  const [depTimeRange, setDepTimeRange] = useState([0, 24]);   // NEW outbound depart window
  const [retTimeRange, setRetTimeRange] = useState([0, 24]);   // NEW return depart window
  const [maxDurationHours, setMaxDurationHours] = useState(48);// NEW total duration cap
  const [baggageOnly, setBaggageOnly] = useState(false);       // NEW baggage filter
  const [sortOrder, setSortOrder] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);

  // UI
  const [openDetailsId, setOpenDetailsId] = useState(null);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isSearchFormVisible, setIsSearchFormVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Expiration timer
  const [timeRemaining, setTimeRemaining] = useState(900); // 15m
  const [isExpired, setIsExpired] = useState(false);
  const timerRef = useRef(null);

  // ---------- Helpers ----------
  const formatTimer = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec < 10 ? "0" : ""}${sec}`;
  };

  const formatDate = (d) => (d ? new Date(d).toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" }) : "");
  const formatTime = (d) => (d ? new Date(d).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "");
  const formatTimeOnly = (d) => (d ? new Date(d).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: false }) : "");
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
  const getAirlineName = (code) => {
    const a = airlines.find((x) => x.code === code);
    return a?.name || code;
  };
  const getAirlineLogo = (code) => {
    const a = airlines.find((x) => x.code === code);
    // Prefer dataset logo; fall back to your assets folder pattern
    return a?.logo || `/assets/img/airlines/${code}.png`;
  };
  const toggleSearchForm = () => setIsSearchFormVisible((v) => !v);

  // NEW helpers for advanced filters
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

  // ---------- Fetch flights whenever URL params change ----------
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

        // Normalize params (align with FlightSearchForm)
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

        // --- Outbound ---
        const res = await flygasal.searchFlights(params, { signal: abort.signal });
        const data = res.data;
        const newKey = data?.searchKey || null;
        const outbound = flygasal.transformPKFareData(data) || [];

        // --- Return (if needed) ---
        let rtn = [];
        if (tripType === "return" && params.returnDate) {
          const returnParams = {
            ...params,
            flights: [{ origin: params.destination, destination: params.origin, depart: params.returnDate }],
          };
          const r = await flygasal.searchFlights(returnParams, { signal: abort.signal });
          rtn = flygasal.transformPKFareData(r.data) || [];
        }

        // Lists
        setAvailableFlights(outbound);
        setReturnFlights(rtn);

        // Dynamic price bounds + initialize current range
        const allPrices = [...outbound, ...rtn].map((f) => f.price).filter((p) => typeof p === "number");
        if (allPrices.length) {
          const absMin = Math.floor(Math.min(...allPrices));
          const absMax = Math.ceil(Math.max(...allPrices));
          setPriceBounds([absMin, absMax]); // NEW bounds
          setMinPrice(absMin);
          setMaxPrice(absMax);
        } else {
          setPriceBounds([100, 4000]);
          setMinPrice(0);
          setMaxPrice(10000);
        }

        // searchKey only after success
        if (newKey) {
          setSearchKey(newKey);
          qp.set("searchKey", newKey);
          const newUrl = `${window.location.pathname}?${qp.toString()}`;
          window.history.replaceState(null, "", newUrl);
        }

        // Timer
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
      availableFlights.forEach((out) => {
        returnFlights.forEach((ret) => {
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
        });
      });
      return items;
    }
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

  const filteredItineraries = useMemo(() => {
    return itineraries
      .filter((it) => {
        // price
        const priceOk = it.totalPrice >= minPrice && it.totalPrice <= maxPrice;

        // stops
        const stopsOk = currentStop === "mix" || `oneway_${it.totalStops}` === currentStop;

        // airlines
        const owOk = checkedOnewayValue.length === 0 || it.airlines.some((a) => checkedOnewayValue.includes(`oneway_${a}`));
        const rtOk = checkedReturnValue.length === 0 || it.airlines.some((a) => checkedReturnValue.includes(`return_${a}`));

        // time windows
        const owDep = getHour(it.outbound?.segments?.[0]?.departureTime || it.outbound?.departureTime);
        const owTimeOk = owDep >= depTimeRange[0] && owDep <= depTimeRange[1];

        let rtTimeOk = true;
        if (it.return) {
          const rtDep = getHour(it.return?.segments?.[0]?.departureTime || it.return?.departureTime);
          rtTimeOk = rtDep >= retTimeRange[0] && rtDep <= retTimeRange[1];
        }

        // total duration cap
        const durHrs = totalDurationMins(it.outbound, it.return) / 60;
        const durationOk = durHrs <= maxDurationHours;

        // baggage
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

  // ---------- Handlers ----------
  const handlePageChange = (page) => {
    const total = Math.ceil(filteredItineraries.length / flightsPerPage);
    if (page < 1 || page > total) return;
    setCurrentPage(page);
    const target = document.getElementById("flight--list-targets");
    if (target) {
      window.scrollTo({ top: target.getBoundingClientRect().top + window.pageYOffset - 250, behavior: "smooth" });
    }
  };

  const handlePriceChange = (value) => {
    setMinPrice(value[0]);
    setMaxPrice(value[1]);
    setCurrentPage(1);
    const target = document.getElementById("flight--list-targets");
    if (target) {
      window.scrollTo({ top: target.getBoundingClientRect().top + window.pageYOffset - 250, behavior: "smooth" });
    }
  };

  const handleStopChange = (value) => {
    setCurrentStop(value);
    setCurrentPage(1);
    const target = document.getElementById("flight--list-targets");
    if (target) {
      window.scrollTo({ top: target.getBoundingClientRect().top + window.pageYOffset - 250, behavior: "smooth" });
    }
  };

  const handleOnewayChange = (e, airline) => {
    const v = `oneway_${airline}`;
    setCheckedOnewayValue((prev) => (e.target.checked ? [...prev, v] : prev.filter((x) => x !== v)));
    setCurrentPage(1);
  };

  const handleReturnChange = (e, airline) => {
    const v = `return_${airline}`;
    setCheckedReturnValue((prev) => (e.target.checked ? [...prev, v] : prev.filter((x) => x !== v)));
    setCurrentPage(1);
  };

  const uniqueAirlines = useMemo(
    () => [...new Set([...availableFlights, ...returnFlights].map((f) => f.airline))],
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
      {/* Modify search collapsible */}
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
              {/* Error / Expired banners */}
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

                  {/* Timer with progress */}
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

                  {/* Sort Navigation */}
                  <SortNavigation
                    sortOrder={sortOrder}
                    handleSortChange={setSortOrder}
                    isSearchFormVisible={isSearchFormVisible}
                    toggleSearchForm={toggleSearchForm}
                  />

                  {/* List */}
                  <div id="flight--list-targets" />
                  {loading ? (
                    <ListSkeleton />
                  ) : filteredItineraries.length ? (
                    <ItineraryList
                      paginatedItineraries={filteredItineraries.slice(
                        (currentPage - 1) * flightsPerPage,
                        currentPage * flightsPerPage
                      )}
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
                      availableFlights={availableFlights}
                      returnFlights={returnFlights}
                      loading={loading}
                    />
                  ) : (
                    <div className="rounded-xl border border-gray-200 bg-white p-6 text-center text-gray-600">
                      No results match your filters. Try widening time windows or clearing some filters.
                    </div>
                  )}

                  {/* Pagination */}
                  <Pagination
                    currentPage={currentPage}
                    totalPages={Math.ceil(filteredItineraries.length / flightsPerPage)}
                    handlePageChange={handlePageChange}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filters Modal (NEW props wired) */}
      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}

        // Stops
        currentStop={currentStop}
        handleStopChange={handleStopChange}

        // Price
        priceRange={[minPrice, maxPrice]}
        priceBounds={priceBounds}
        handlePriceChange={handlePriceChange}

        // Airlines
        uniqueAirlines={uniqueAirlines}
        checkedOnewayValue={checkedOnewayValue}
        handleOnewayChange={handleOnewayChange}
        checkedReturnValue={checkedReturnValue}
        handleReturnChange={handleReturnChange}
        getAirlineName={getAirlineName}
        getAirlineLogo={getAirlineLogo}

        // Time windows
        depTimeRange={depTimeRange}
        onDepTimeChange={setDepTimeRange}
        retTimeRange={retTimeRange}
        onRetTimeChange={setRetTimeRange}

        // Duration + baggage
        maxDurationHours={maxDurationHours}
        onMaxDurationChange={setMaxDurationHours}
        baggageOnly={baggageOnly}
        onBaggageOnlyChange={setBaggageOnly}

        // Context
        returnFlights={returnFlights}

        // Global clear
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
          setCurrentPage(1);
        }}
      />
    </div>
  );
};

export default FlightPage;
