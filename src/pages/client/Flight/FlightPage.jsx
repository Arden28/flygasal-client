import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { airports, airlines } from "../../../data/fakeData";
import FilterModal from "../../../components/client/Modals/FilterModal";
import FlightHeader from "../../../components/client/Flight/FlightHeader";
import SortNavigation from "../../../components/client/Flight/SortNavigation";
import ItineraryList from "../../../components/client/Flight/ItineraryList";
import Pagination from "../../../components/client/Pagination";
import FlightSearchForm from "../../../components/client/Flight/FlightSearchForm";
import flygasal from "../../../api/flygasalService";
import { motion, AnimatePresence } from "framer-motion";
import { AuthContext } from "../../../context/AuthContext";

const flightsPerPage = 25;
const MAX_RETURNS_PER_OUTBOUND = 6;
const MAX_RESULTS = 500;

const FlightPage = () => {
  const { user } = useContext(AuthContext);
  const location = useLocation();

  // Core search state
  const [searchParams, setSearchParams] = useState(null);
  const [searchKey, setSearchKey] = useState(null);
  const [availableFlights, setAvailableFlights] = useState([]);
  const [returnFlights, setReturnFlights] = useState([]);

  // Currency to display (from offers)
  const [currency, setCurrency] = useState("USD");

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
  const agentMarkupPercent = user?.agency_markup || 0;

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

  // Baggage: the normalized offer has per-segment baggage maps. We convert to a simple truthy flag.
  const hasBaggage = (offer) => {
    const seg0 = offer?.segments?.[0]?.segmentId;
    const carry = offer?.baggage?.adt?.carryOnBySegment?.[seg0];
    const checked = offer?.baggage?.adt?.checkedBySegment?.[seg0];
    return Boolean(
      (carry && ((carry.amount ?? 0) > 0 || (carry.weight ?? 0) > 0)) ||
      (checked && ((checked.amount ?? 0) > 0 || (checked.weight ?? 0) > 0))
    );
  };

  const totalDurationMins = (outbound, ret) => {
    const dep1 = new Date(outbound?.segments?.[0]?.departureDate || outbound?.departureTime);
    const arr1 = new Date(outbound?.segments?.slice(-1)?.[0]?.arrivalDate || outbound?.arrivalTime);
    let mins = Math.max(0, (arr1 - dep1) / 60000);
    if (ret) {
      const dep2 = new Date(ret?.segments?.[0]?.departureDate || ret?.departureTime);
      const arr2 = new Date(ret?.segments?.slice(-1)?.[0]?.arrivalDate || ret?.arrivalTime);
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

  // ---- Return-offer carving helpers (for suppliers that return both legs in one offer) ----
  const norm3 = (s = "") =>
    String(s).trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 3);

  const normalizeSegsForCarve = (flightLike) => {
    const raw = Array.isArray(flightLike?.segments) && flightLike.segments.length
      ? flightLike.segments
      : [flightLike];

    return raw
      .filter(Boolean)
      .map((s) => ({
        airline: s.airline ?? s.carrier ?? "",
        flightNo: s.flightNum ?? s.flightNumber ?? "",
        departure: s.departure ?? s.origin ?? s.departureAirport ?? "",
        arrival: s.arrival ?? s.destination ?? s.arrivalAirport ?? "",
        departureAt: s.departureDate ?? s.departureTime ?? s.depTime ?? "",
        arrivalAt: s.arrivalDate ?? s.arrivalTime ?? s.arrTime ?? "",
        bookingCode: s.bookingCode ?? s.bookingClass ?? "",
        refundable: !!s.refundable,
      }))
      .filter((s) => s.departureAt && s.arrivalAt)
      .sort((a, b) => new Date(a.departureAt) - new Date(b.departureAt));
  };

  const findContiguousChain = (segs, ORIGIN, DEST, { prefer = "earliest", notBefore } = {}) => {
    const O = norm3(ORIGIN), D = norm3(DEST);
    if (!O || !D || !segs?.length) return null;

    const chains = [];
    for (let i = 0; i < segs.length; i++) {
      if (norm3(segs[i].departure) !== O) continue;
      if (notBefore && new Date(segs[i].departureAt) < new Date(notBefore)) continue;

      const chain = [segs[i]];
      if (norm3(segs[i].arrival) === D) {
        chains.push(chain.slice());
        continue;
      }
      for (let j = i + 1; j < segs.length; j++) {
        const prev = chain[chain.length - 1];
        const cur = segs[j];
        if (norm3(cur.departure) !== norm3(prev.arrival)) break; // lost continuity
        chain.push(cur);
        if (norm3(cur.arrival) === D) {
          chains.push(chain.slice());
          break;
        }
      }
    }
    if (!chains.length) return null;
    if (prefer === "latest") {
      return chains.reduce((best, c) => new Date(c[0].departureAt) > new Date(best[0].departureAt) ? c : best);
    }
    return chains.reduce((best, c) => new Date(c[0].departureAt) < new Date(best[0].departureAt) ? c : best);
  };

  const carveReturnFromSingleOffer = (offer, { origin, destination }) => {
    const segs = normalizeSegsForCarve(offer);
    const out = findContiguousChain(segs, origin, destination, { prefer: "earliest" }) || [];
    const outArr = out[out.length - 1]?.arrivalAt || null;

    let ret =
      findContiguousChain(segs, destination, origin, { prefer: "earliest", notBefore: outArr }) ||
      findContiguousChain(segs, destination, origin, { prefer: "earliest" }) ||
      findContiguousChain(segs, origin, destination, { prefer: "latest" }) ||
      [];

    const wrap = (chain) => {
      if (!chain.length) return null;
      const first = chain[0], last = chain[chain.length - 1];
      return {
        ...offer,
        segments: chain.map(s => ({
          airline: s.airline,
          flightNum: s.flightNo,
          departure: s.departure,
          arrival: s.arrival,
          departureDate: s.departureAt,
          arrivalDate: s.arrivalAt,
          bookingCode: s.bookingCode,
          refundable: s.refundable,
        })),
        origin: first.departure,
        destination: last.arrival,
        departureTime: first.departureAt,
        arrivalTime: last.arrivalAt,
      };
    };

    return { outbound: wrap(out), ret: wrap(ret) };
  };

  // ---------- Fetch flights ----------
  useEffect(() => {
    let abort = new AbortController();

    async function fetchFlights() {
      setLoading(true);
      setError("");
      setIsExpired(false);

      try {
        const qp = new URLSearchParams(location.search);

        // ---- Parse incoming query params into a normalized "params" ----
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

        const fallbackFirst = { origin: "HKG", destination: "BKK", depart: "2024-12-15" };
        const first = legs[0] || fallbackFirst;

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

        // ---- Call backend once; many suppliers return BOTH legs in one offer for round-trips ----
        const res = await flygasal.searchFlights(params, { signal: abort.signal });

        console.info("Flight search response:", res?.offers);

        let offers = [];
        let displayCurrency = "USD";

        if (Array.isArray(res?.offers)) {
          offers = res.offers;
          displayCurrency = offers[0]?.priceBreakdown?.currency || "USD";
          if (res.searchKey) {
            qp.set("searchKey", res.searchKey);
            const newUrl = `${window.location.pathname}?${qp.toString()}`;
            window.history.replaceState(null, "", newUrl);
            setSearchKey(res.searchKey);
          }
        } else {
          // Backend returned raw PKFare; normalize client-side
          const data = res?.data;
          const newKey = data?.searchKey || null;
          offers = flygasal.transformPKFareData(data) || [];
          displayCurrency = offers[0]?.priceBreakdown?.currency || "USD";
          if (newKey) {
            qp.set("searchKey", newKey);
            const newUrl = `${window.location.pathname}?${qp.toString()}`;
            window.history.replaceState(null, "", newUrl);
            setSearchKey(newKey);
          }
        }

        // ---- Helper: recompute leg fields from a segment array ----
        const buildLegFromSegments = (baseOffer, segs, suffix) => {
          const firstSeg = segs[0];
          const lastSeg  = segs[segs.length - 1];

          // Derive a sensible total if not present
          const originalTotal =
            baseOffer?.priceBreakdown?.total ??
            ((baseOffer?.priceBreakdown?.base || 0) +
              (baseOffer?.priceBreakdown?.taxes || 0) +
              (baseOffer?.priceBreakdown?.qCharge || 0) +
              (baseOffer?.priceBreakdown?.tktFee || 0));

          // Split the grand total across the two legs so out+ret ~= original total.
          const perLegTotal = Math.round((originalTotal / 2) * 100) / 100;

          return {
            // keep a stable id but ensure uniqueness between legs
            id: `${baseOffer.id}-${suffix}`,
            solutionId: baseOffer.solutionId,
            marketingCarriers: baseOffer.marketingCarriers || [],
            operatingCarriers: baseOffer.operatingCarriers || [],
            platingCarrier: baseOffer.platingCarrier,
            isVI: !!baseOffer.isVI,
            cabin: baseOffer.cabin,
            bookingCode: baseOffer.bookingCode,

            // recomputed leg fields
            origin: firstSeg?.departure || baseOffer.origin,
            destination: lastSeg?.arrival || baseOffer.destination,
            departureTime: firstSeg?.departureDate || baseOffer.departureTime,
            arrivalTime: lastSeg?.arrivalDate || baseOffer.arrivalTime,
            segments: segs.slice(),
            equipment: baseOffer.equipment,

            // stops = connections within this leg (segments - 1), bounded at 0
            stops: Math.max(0, (segs?.length || 1) - 1),
            transferCount: baseOffer.transferCount,

            // price: copy pb & inject a per-leg total
            priceBreakdown: {
              ...baseOffer.priceBreakdown,
              total: perLegTotal,
            },

            // pass through convenience fields when present
            rules: baseOffer.rules,
            availabilityCount: baseOffer.availabilityCount,
            expired: baseOffer.expired,
            flightNumber: baseOffer.flightNumber,
            journeyTime: baseOffer.journeyTime, // optional; your UI can recompute if you prefer
          };
        };

        // ---- If one-way: keep as-is. If return: split each offer by flightIds into 2 legs ----
        let outbounds = [];
        let returns = [];

        if (tripType === "return") {
          for (const offer of offers) {
            const fids = Array.isArray(offer?.flightIds) ? offer.flightIds.filter(Boolean) : [];
            const segs = Array.isArray(offer?.segments) ? offer.segments : [];

            if (fids.length >= 2) {
              // Outbound = segments belonging to first flightId; Return = second flightId
              const segsOut = segs.filter(s => s.flightId === fids[0]);
              const segsRet = segs.filter(s => s.flightId === fids[1]);

              // Fallbacks: if filtering yields nothing (some suppliers omit flightId on segs),
              // we fallback to chronological split: first half vs second half.
              const half = Math.floor(segs.length / 2) || 1;
              const finalOutSegs = segsOut.length ? segsOut : segs.slice(0, half);
              const finalRetSegs = segsRet.length ? segsRet : segs.slice(half);

              outbounds.push(buildLegFromSegments(offer, finalOutSegs, "OUT"));
              returns.push(buildLegFromSegments(offer, finalRetSegs, "RET"));
            } else {
              // No distinct flightIds: best-effort chronological split for a return trip
              const half = Math.floor((offer?.segments?.length || 2) / 2) || 1;
              const finalOutSegs = segs.slice(0, half);
              const finalRetSegs = segs.slice(half);

              outbounds.push(buildLegFromSegments(offer, finalOutSegs, "OUT"));
              returns.push(buildLegFromSegments(offer, finalRetSegs, "RET"));
            }
          }
        } else {
          // oneway
          outbounds = offers.slice();
          returns = [];
        }

        // ---- Sort by price then duration for deterministic UI ----
        const sortByTotal = (a, b) => {
          const ta = a?.priceBreakdown?.total ?? Number.MAX_SAFE_INTEGER;
          const tb = b?.priceBreakdown?.total ?? Number.MAX_SAFE_INTEGER;
          if (ta !== tb) return ta - tb;
          const da = a?.journeyTime ?? ((new Date(a.arrivalTime) - new Date(a.departureTime)) / 60000);
          const db = b?.journeyTime ?? ((new Date(b.arrivalTime) - new Date(b.departureTime)) / 60000);
          return da - db;
        };

        outbounds.sort(sortByTotal);
        returns.sort(sortByTotal);

        // ---- Push into state expected by the rest of your page ----
        setAvailableFlights(outbounds);
        setReturnFlights(returns);
        setCurrency(displayCurrency);

        // ---- Dynamic price slider bounds (across both arrays) ----
        const allPrices = [...outbounds, ...returns]
          .map(f => f?.priceBreakdown?.total)
          .filter(p => typeof p === "number" && !Number.isNaN(p));

        if (allPrices.length) {
          const absMin = Math.floor(Math.min(...allPrices));
          const absMax = Math.ceil(Math.max(...allPrices));
          setPriceBounds([absMin, absMax]);
          setMinPrice(absMin);
          setMaxPrice(absMax);
        } else {
          setPriceBounds([0, 0]);
          setMinPrice(0);
          setMaxPrice(0);
        }

        // startTimer(); // optional
      } catch (err) {
        if (err?.name === "AbortError") return;
        console.error("Failed to fetch flights:", err);
        setError("We couldn’t load flights for your search. Please try again.");
        setAvailableFlights([]);
        setReturnFlights([]);
      } finally {
        setLoading(false);
      }
    }

    fetchFlights();

    return () => {
      abort.abort();
      // stopTimer();
    };
  }, [location.search]);


  // ---------- Derive display helpers ----------
  // Simple baggage label for the list pills
  const makeBaggageLabel = (offer) => {
    const seg0 = offer?.segments?.[0]?.segmentId;
    const carry = offer?.baggage?.adt?.carryOnBySegment?.[seg0];
    const checked = offer?.baggage?.adt?.checkedBySegment?.[seg0];
    const carryTxt =
      carry && ((carry.amount ?? 0) > 0 || (carry.weight ?? 0) > 0)
        ? `${carry.amount ?? ""}${carry.amount ? "PC" : ""}${carry.weight ? ` ${carry.weight}KG` : ""} carry-on`
        : "";
    const checkedTxt =
      checked && ((checked.amount ?? 0) > 0 || (checked.weight ?? 0) > 0)
        ? `${checked.amount ?? ""}${checked.amount ? "PC" : ""}${checked.weight ? ` ${checked.weight}KG` : ""} checked`
        : "";
    const both = [carryTxt, checkedTxt].filter(Boolean).join(" + ");
    return both || null;
  };

  // ---------- Build itineraries from normalized offers ----------
  const itineraries = useMemo(() => {
    if (!searchParams) return [];

    const price = (o) => Number(o?.priceBreakdown?.total || 0);
    const carriers = (o) =>
      Array.from(new Set(
        (o?.marketingCarriers || [])
          .concat(o?.operatingCarriers || [])
          .concat(o?.segments?.map(s => s?.airline).filter(Boolean) || [])
      )).filter(Boolean);

    // ROUND TRIP
    if (searchParams.tripType === "return") {
      const hasSeparateReturnList = Array.isArray(returnFlights) && returnFlights.length > 0;

      // A) Single-offer with both legs embedded (fallback carve)
      if (!hasSeparateReturnList) {
        const items = [];
        for (const offer of (availableFlights || [])) {
          const { outbound, ret } = carveReturnFromSingleOffer(offer, {
            origin: searchParams.origin,
            destination: searchParams.destination,
          });

          if (!outbound || !ret) continue;

          items.push({
            id: `${offer.id || offer.solutionId || Math.random().toString(36).slice(2)}`,
            outbound,
            return: ret,
            totalPrice: price(offer), // single-offer total includes both legs
            totalStops:
              (outbound.stops || (Array.isArray(outbound.segments) ? Math.max(0, outbound.segments.length - 1) : 0)) +
              (ret.stops || (Array.isArray(ret.segments) ? Math.max(0, ret.segments.length - 1) : 0)),
            airlines: Array.from(new Set([...carriers(outbound), ...carriers(ret)])),
            cabin: outbound.cabin || outbound.segments?.[0]?.cabinClass || "Economy",
            baggage: makeBaggageLabel(outbound),
            refundable: false,
          });

          if (items.length >= MAX_RESULTS) break;
        }
        items.sort((a, b) => a.totalPrice - b.totalPrice);
        return items;
      }

      // B) Separate return list: pair the cheapest returns with each outbound
      const items = [];
      const sortedReturns = [...returnFlights].sort((a, b) => price(a) - price(b));

      for (const out of availableFlights) {
        const topReturns = sortedReturns.slice(0, MAX_RETURNS_PER_OUTBOUND);
        for (const ret of topReturns) {
          items.push({
            id: `${out.id}-${ret.id}`,
            outbound: out,
            return: ret,
            totalPrice: price(out) + price(ret),
            totalStops: (out.stops || 0) + (ret.stops || 0),
            airlines: Array.from(new Set([...carriers(out), ...carriers(ret)])),
            cabin: out.cabin || out.segments?.[0]?.cabinClass || "Economy",
            baggage: makeBaggageLabel(out),
            refundable: false,
          });
          if (items.length >= MAX_RESULTS) break;
        }
        if (items.length >= MAX_RESULTS) break;
      }
      return items;
    }

    // ONE WAY
    return (availableFlights || []).map((f) => ({
      id: f.id,
      outbound: f,
      return: null,
      totalPrice: Number(f?.priceBreakdown?.total || 0),
      totalStops: f.stops || 0,
      airlines: carriers(f),
      cabin: f.cabin || f.segments?.[0]?.cabinClass || "Economy",
      baggage: makeBaggageLabel(f),
      refundable: false,
    }));
  }, [searchParams, availableFlights, returnFlights]);

    console.info('Itineraries offers:', itineraries);
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
        const obCode = it.outbound?.marketingCarriers?.[0] || it.outbound?.segments?.[0]?.airline || "";
        const rtCode = it.return?.marketingCarriers?.[0] || it.return?.segments?.[0]?.airline || "";

        const owOk =
          checkedOnewayValue.length === 0 || (obCode && checkedOnewayValue.includes(`oneway_${obCode}`));

        const rtOk =
          !it.return ||
          checkedReturnValue.length === 0 ||
          (rtCode && checkedReturnValue.includes(`return_${rtCode}`));

        // time windows (use normalized top-level or first segment)
        const owDep =
          getHour(it.outbound?.segments?.[0]?.departureDate || it.outbound?.departureTime);
        const owTimeOk = owDep >= depTimeRange[0] && owDep <= depTimeRange[1];

        let rtTimeOk = true;
        if (it.return) {
          const rtDep = getHour(it.return?.segments?.[0]?.departureDate || it.return?.departureTime);
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

  // ---------- Pagination guards ----------
  const totalPages = useMemo(
    () => Math.ceil(filteredItineraries.length / flightsPerPage),
    [filteredItineraries]
  );

  const safePage = useMemo(
    () => Math.min(Math.max(currentPage, 1), totalPages || 1),
    [currentPage, totalPages]
  );

  useEffect(() => {
    if (currentPage !== safePage) {
      setCurrentPage(safePage);
      setOpenDetailsId(null);
    }
  }, [safePage]); // eslint-disable-line react-hooks/exhaustive-deps

  const pageItems = useMemo(
    () =>
      filteredItineraries.slice(
        (safePage - 1) * flightsPerPage,
        safePage * flightsPerPage
      ),
    [filteredItineraries, safePage]
  );

  const listKey = useMemo(
    () =>
      JSON.stringify({
        minPrice, maxPrice, currentStop,
        checkedOnewayValue, checkedReturnValue,
        depTimeRange, retTimeRange,
        maxDurationHours, baggageOnly, sortOrder,
        page: safePage,
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

  // Unique airline codes from normalized carriers
  const uniqueAirlines = useMemo(() => {
    const all = [...availableFlights, ...returnFlights]
      .flatMap(f =>
        (f?.marketingCarriers || [])
          .concat(f?.operatingCarriers || [])
          .concat(f?.segments?.map(s => s?.airline).filter(Boolean) || [])
      )
      .filter(Boolean);
    return Array.from(new Set(all));
  }, [availableFlights, returnFlights]);

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
