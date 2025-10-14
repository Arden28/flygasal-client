import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { airports, airlines } from "../../../data/fakeData";
import FilterSidebar from "../../../components/client/Flight/FilterSidebar";
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

const normalizeCabinKey = (raw = "") => {
  const s = String(raw).toUpperCase();
  if (/(^|[^A-Z])W($|[^A-Z])|PREM/.test(s)) return "PREMIUM_ECONOMY";
  if (/BUSI|(^|[^A-Z])[CJ]($|[^A-Z])/.test(s)) return "BUSINESS";
  if (/FIRST|(^|[^A-Z])F($|[^A-Z])/.test(s)) return "FIRST";
  return "ECONOMY";
};

/* ---------- Canonical signatures + dedupe helpers ---------- */
const iso = (d) => (d ? new Date(d).toISOString() : "");
const segSignature = (s) =>
  [
    (s.airline || s.carrier || "").toUpperCase(),
    String(s.flightNum || s.flightNumber || "").toUpperCase(),
    String(s.departure || s.origin || s.departureAirport || "").toUpperCase(),
    String(s.arrival || s.destination || s.arrivalAirport || "").toUpperCase(),
    iso(s.departureDate || s.departureTime || s.depTime),
    iso(s.arrivalDate || s.arrivalTime || s.arrTime),
  ].join("~");

const legSignature = (legLike) => {
  const segs = Array.isArray(legLike?.segments) && legLike.segments.length ? legLike.segments : [legLike];
  return segs.map(segSignature).join(">");
};

const onewayKey = (legLike, cabin) =>
  `${legSignature(legLike)}|${normalizeCabinKey(cabin || legLike?.cabin || legLike?.segments?.[0]?.cabinClass || "")}`;

const returnKey = (out, ret, cabin) =>
  `${legSignature(out)}|${legSignature(ret)}|${normalizeCabinKey(cabin || out?.cabin || ret?.cabin || "")}`;

const multiKey = (legs, cabin) =>
  `${(legs || []).map(legSignature).join("||")}|${normalizeCabinKey(
    cabin || legs?.[0]?.cabin || legs?.[0]?.segments?.[0]?.cabinClass || ""
  )}`;

/* ---------- priceOf() reads backend totals raw (no normalization) ---------- */
const priceOf = (o) => {
  const pb = o?.priceBreakdown;
  const grand = pb?.totals?.grand ?? pb?.total;
  return Number(grand || 0);
};

/* ---------- Small helper: drop any visible priceBreakdown field from leg/offer objects when embedding ---------- */
const stripPB = (obj) => {
  if (!obj) return obj;
  const { priceBreakdown, ...rest } = obj; // keep __sourcePB if present
  return rest;
};

/* ---------- Multi carving (respect requested legs order) ---------- */
const carveLegsForMulti = (offer, requestedLegs = [], normalizeSegsForCarve, findContiguousChain) => {
  const segs = normalizeSegsForCarve(offer);
  if (!Array.isArray(requestedLegs) || requestedLegs.length < 2) return null;

  let notBefore = null;
  const legs = [];
  for (let i = 0; i < requestedLegs.length; i++) {
    const rq = requestedLegs[i] || {};
    const chain =
      findContiguousChain(segs, rq.origin, rq.destination, { prefer: "earliest", notBefore }) ||
      findContiguousChain(segs, rq.origin, rq.destination, { prefer: "earliest" });

    if (!chain || !chain.length) return null;

    const first = chain[0],
      last = chain[chain.length - 1];
    legs.push({
      ...offer,
      id: `${offer.id || offer.solutionId || "OFF"}-L${i + 1}`,
      origin: first.departure,
      destination: last.arrival,
      departureTime: first.departureAt,
      arrivalTime: last.arrivalAt,
      cabin: offer.cabin,
      bookingCode: offer.bookingCode,
      segments: chain.map((s) => ({
        airline: s.airline,
        flightNum: s.flightNo,
        departure: s.departure,
        arrival: s.arrival,
        departureDate: s.departureDate ?? s.strDepartureDate ?? "",
        departureTime: s.departureTime ?? s.strDepartureTime ?? "",
        arrivalDate: s.arrivalDate ?? s.strArrivalDate ?? "",
        arrivalTime: s.arrivalTime ?? s.strArrivalTime ?? "",
        bookingCode: s.bookingCode,
        refundable: s.refundable,
      })),
      stops: Math.max(0, chain.length - 1),
      // keep raw backend PB hidden here for itinerary to reuse
      __sourcePB: offer.priceBreakdown,
    });

    notBefore = last.arrivalAt; // next leg cannot depart before previous arrives
  }

  const totalStops = legs.reduce((acc, l) => acc + (l.stops || 0), 0);
  const airlines = Array.from(
    new Set(
      legs.flatMap((l) =>
        (l.marketingCarriers || [])
          .concat(l.operatingCarriers || [])
          .concat((l.segments || []).map((s) => s.airline).filter(Boolean))
      )
    )
  );

  return {
    id: `${offer.id || offer.solutionId || Math.random().toString(36).slice(2)}`,
    legs,
    totalStops,
    totalPrice: priceOf(offer),
    airlines,
    cabin: offer.cabin || offer.segments?.[0]?.cabinClass || "Economy",
    // itinerary-level raw breakdown from the offer
    priceBreakdown: offer.priceBreakdown,
  };
};

const FlightPage = () => {
  const { user } = useContext(AuthContext);
  const location = useLocation();

  // Core search state
  const [searchParams, setSearchParams] = useState(null);
  const [searchKey, setSearchKey] = useState(null);
  const [availableFlights, setAvailableFlights] = useState([]);
  const [returnFlights, setReturnFlights] = useState([]);
  const [selectedCabins, setSelectedCabins] = useState([]); // empty = all

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
  const [isSearchFormVisible, setIsSearchFormVisible] = useState(false);
  const [filtersOpenMobile, setFiltersOpenMobile] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Expiration timer
  const [timeRemaining, setTimeRemaining] = useState(900);
  const [isExpired, setIsExpired] = useState(false);
  const timerRef = useRef(null);

  const tripType = searchParams?.tripType || "oneway";
  const legsCount =
    tripType === "multi" ? (searchParams?.flights?.length || 2) : tripType === "return" ? 2 : 1;

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
  const getAirlineLogo = (code) =>
    airlines.find((x) => x.code === code)?.logo || `/assets/img/airlines/${code}.png`;
  const toggleSearchForm = () => setIsSearchFormVisible((v) => !v);

  // Advanced filters helpers
  const getHour = (dt) => (dt ? new Date(dt).getHours() : 0);

  // Baggage: simple truthy flag from segment baggage maps
  const hasBaggage = (offer) => {
    const seg0 = offer?.segments?.[0]?.segmentId;
    const carry = offer?.baggage?.adt?.carryOnBySegment?.[seg0];
    const checked = offer?.baggage?.adt?.checkedBySegment?.[seg0];
    return Boolean(
      (carry && ((carry.amount ?? 0) > 0 || (carry.weight ?? 0) > 0)) ||
        (checked && ((checked.amount ?? 0) > 0 || (checked.weight ?? 0) > 0))
    );
  };

  const totalDurationMins = (outbound, ret, legsForMulti) => {
    if (Array.isArray(legsForMulti) && legsForMulti.length) {
      const first = legsForMulti[0];
      const last = legsForMulti[legsForMulti.length - 1];
      const dep = new Date(first?.segments?.[0]?.departureDate || first?.departureTime);
      const arr = new Date(last?.segments?.slice(-1)?.[0]?.arrivalDate || last?.arrivalTime);
      return Math.max(0, Math.round((arr - dep) / 60000));
    }
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

  // Stable identity: pure utility, keeps deps empty.
  const normalizeSegsForCarve = useCallback((flightLike) => {
    const raw =
      Array.isArray(flightLike?.segments) && flightLike.segments.length ? flightLike.segments : [flightLike];

    return raw
      .filter(Boolean)
      .map((s) => ({
        airline: s.airline ?? s.carrier ?? "",
        flightNo: s.flightNum ?? s.flightNumber ?? "",
        departure: s.departure ?? s.origin ?? s.departureAirport ?? "",
        arrival: s.arrival ?? s.destination ?? s.arrivalAirport ?? "",
        departureAt: s.departureDate ?? s.departureTime ?? s.depTime ?? "",
        arrivalAt: s.arrivalDate ?? s.arrivalTime ?? s.arrTime ?? "",
        departureDate: s.strDepartureDate ?? "",
        departureTime: s.strDepartureTime ?? "",
        arrivalDate: s.strArrivalDate ?? "",
        arrivalTime: s.strArrivalTime ?? "",
        bookingCode: s.bookingCode ?? s.bookingClass ?? "",
        refundable: !!s.refundable,
      }))
      .filter((s) => s.departureAt && s.arrivalAt)
      .sort((a, b) => new Date(a.departureAt) - new Date(b.departureAt));
  }, []);

  // Stable identity: pure utility, keeps deps empty.
  const findContiguousChain = useCallback((segs, ORIGIN, DEST, { prefer = "earliest", notBefore } = {}) => {
    const O = norm3(ORIGIN),
      D = norm3(DEST);
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
      return chains.reduce((best, c) => (new Date(c[0].departureAt) > new Date(best[0].departureAt) ? c : best));
    }
    return chains.reduce((best, c) => (new Date(c[0].departureAt) < new Date(best[0].departureAt) ? c : best));
  }, []);

  //Stable identity: depends on the two helpers above.
  const carveReturnFromSingleOffer = useCallback((offer, { origin, destination }) => {
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
      const first = chain[0],
        last = chain[chain.length - 1];
      return {
        ...offer,
        segments: chain.map((s) => ({
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
        // Keep raw backend PB on a private field for the itinerary
        __sourcePB: offer.priceBreakdown,
      };
    };

    return { outbound: wrap(out), ret: wrap(ret) };
  }, [normalizeSegsForCarve, findContiguousChain]);

  /* ============================================================
   * carriers **per leg** (prevents cross-leg bleed)
   * Stable identity so hooks that depend on it don't warn.
   * ============================================================ */
  const carriersOfLeg = useCallback((leg) =>
    Array.from(
      new Set(
        (leg?.segments || [])
          .map((s) => s?.airline)
          .filter(Boolean)
          .map((c) => String(c).toUpperCase())
      )
    ),
  []);

  // ---------- Fetch flights ----------
  useEffect(() => {
    let abort = new AbortController();

    async function fetchFlights() {
      setLoading(true);
      setError("");
      setIsExpired(false);

      try {
        const qp = new URLSearchParams(location.search);

        // Parse incoming query params into a normalized "params" (supports MULTI)
        const legs = [];
        let i = 0;
        while (
          qp.has(`flights[${i}][origin]`) ||
          qp.has(`flights[${i}][destination]`) ||
          qp.has(`flights[${i}][depart]`)
        ) {
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
        const flightType = qp.get("flightType") || "";

        const params = {
          tripType,
          cabinType: flightType,
          flights: legs.length ? legs : [first],
          // single-field fallbacks for header display
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

        console.info('Search Results: ', res);

        // Keep offers as-is, but stash a raw copy on __sourcePB for safety
        let offers = (res.offers || []).map((o) => ({ ...o, __sourcePB: o.priceBreakdown }));
        let displayCurrency =
          offers[0]?.priceBreakdown?.currency || offers[0]?.currency || "USD";

        /* ---- Build outbounds/returns with dedupe & multi aware ---- */
        let outbounds = [];
        let returns = [];

        // Dedupe maps
        const seenOneWay = new Map();
        const seenReturns = new Map();
        const seenItinPairs = new Map();

        if (tripType === "multi") {
          const multiSet = new Map();
          for (const offer of offers) {
            const carved = carveLegsForMulti(offer, params.flights, normalizeSegsForCarve, findContiguousChain);
            if (!carved) continue;

            const key = multiKey(carved.legs, carved.cabin);
            if (multiSet.has(key)) {
              if (priceOf(offer) < multiSet.get(key).totalPrice) multiSet.set(key, carved);
            } else {
              multiSet.set(key, carved);
            }
            if (multiSet.size >= MAX_RESULTS) break;
          }

          // Store multi itineraries in outbounds (so rest of code paths can reuse)
          outbounds = Array.from(multiSet.values());
          returns = [];
        } else if (tripType === "return") {
          /* -----------------------------------------------------------
           * Split return offers using server-normalized legs
           * (summary.legs[0] outbound, summary.legs[1] return).
           * ----------------------------------------------------------- */
          for (const offer of offers) {
            const legs = offer?.summary?.legs || [];
            let outLeg, retLeg;

            if (legs.length >= 2) {
              const buildLegFromNormalized = (baseOffer, leg, suffix) => {
                const firstSeg = leg.segments?.[0] || {};

                return {
                  id: `${baseOffer.id || baseOffer.solutionId || "OFF"}-${suffix}`,
                  solutionId: baseOffer.solutionId,
                  platingCarrier: baseOffer.platingCarrier,
                  isVI: !!baseOffer.isVI,

                  // Per-leg carriers (no cross-leg bleed)
                  marketingCarriers: carriersOfLeg(leg),
                  operatingCarriers: [],

                  cabin: baseOffer.cabin || firstSeg.cabinClass,
                  bookingCode: firstSeg.bookingCode,

                  origin: leg.origin,
                  destination: leg.destination,
                  departureTime: leg.departureTime,
                  arrivalTime: leg.arrivalTime,

                  segments: (leg.segments || []).map((s) => ({
                    ...s,
                    // keep both names compatible with rest of code
                    departureDate: s.departureDate ?? s.departureTime,
                    arrivalDate: s.arrivalDate ?? s.arrivalTime,
                  })),

                  stops: Math.max(0, (leg.segments?.length || 1) - 1),
                  transferCount: leg.transferCount ?? Math.max(0, (leg.segments?.length || 1) - 1),
                  journeyTime: leg.journeyTime,

                  // keep raw backend PB hidden for itinerary
                  __sourcePB: baseOffer.priceBreakdown,

                  rules: baseOffer.rules,
                  availabilityCount: baseOffer.availabilityCount,
                  expired: baseOffer.expired,
                  flightNumber: `${firstSeg.airline || ""}${firstSeg.flightNum || ""}`,
                  equipment: firstSeg.equipment,
                };
              };

              outLeg = buildLegFromNormalized(offer, legs[0], "OUT");
              retLeg = buildLegFromNormalized(offer, legs[1], "RET");
            } else {
              // Fallback if legs are absent (rare)
              const { outbound, ret } = carveReturnFromSingleOffer(offer, {
                origin: params.origin,
                destination: params.destination,
              });
              outLeg = outbound;
              retLeg = ret;
            }

            if (!outLeg || !retLeg) continue;

            // Dedup keys
            const outKey = onewayKey(outLeg, outLeg.cabin);
            if (!seenOneWay.has(outKey) || priceOf(outLeg) < priceOf(seenOneWay.get(outKey))) {
              seenOneWay.set(outKey, outLeg);
            }
            const retKey = onewayKey(retLeg, retLeg.cabin);
            if (!seenReturns.has(retKey) || priceOf(retLeg) < priceOf(seenReturns.get(retKey))) {
              seenReturns.set(retKey, retLeg);
            }

            const pairKey = returnKey(outLeg, retLeg, outLeg.cabin || retLeg.cabin);
            const pairTotal = priceOf(offer);
            const existing = seenItinPairs.get(pairKey);
            if (!existing || pairTotal < existing.total) {
              seenItinPairs.set(pairKey, { out: outLeg, ret: retLeg, total: pairTotal });
            }

            if (seenItinPairs.size >= MAX_RESULTS) break;
          }

          outbounds = Array.from(seenOneWay.values()).sort(
            (a, b) => priceOf(a) - priceOf(b) || (a.journeyTime ?? 0) - (b.journeyTime ?? 0)
          );
          returns = Array.from(seenReturns.values()).sort(
            (a, b) => priceOf(a) - priceOf(b) || (a.journeyTime ?? 0) - (b.journeyTime ?? 0)
          );
        } else {
          // ONEWAY dedupe
          const oneMap = new Map();
          for (const offer of offers) {
            const key = onewayKey(offer, offer.cabin);
            if (!oneMap.has(key) || priceOf(offer) < priceOf(oneMap.get(key))) {
              oneMap.set(key, offer);
            }
            if (oneMap.size >= MAX_RESULTS) break;
          }
          outbounds = Array.from(oneMap.values()).sort(
            (a, b) => priceOf(a) - priceOf(b) || (a.journeyTime ?? 0) - (b.journeyTime ?? 0)
          );
          returns = [];
        }

        setAvailableFlights(outbounds);
        setReturnFlights(returns);
        setCurrency(displayCurrency);
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
  }, [location.search]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------- Derive display helpers ----------
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

    const cabinOf = (x) => x?.cabin || x?.segments?.[0]?.cabinClass || "Economy";

    // MULTI
    if (searchParams.tripType === "multi") {
      const dedup = new Map();
      for (const m of availableFlights || []) {
        if (!Array.isArray(m?.legs) || !m.legs.length) continue;
        const key = multiKey(m.legs, m.cabin);
        const totalStops = m.totalStops ?? m.legs.reduce((acc, l) => acc + (l.stops || 0), 0);
        const airlines = m.airlines?.length
          ? m.airlines
          : Array.from(new Set(m.legs.flatMap((l) => carriersOfLeg(l))));

        const rec = {
          id: m.id,
          legs: m.legs.map(stripPB), // ensure legs[] have no PB
          totalPrice: Number(m.totalPrice || 0),
          totalStops,
          airlines,
          cabin: m.cabin || cabinOf(m.legs?.[0]),
          baggage: null,
          refundable: false,
          // itinerary-level priceBreakdown: prefer container's, else from first leg's __sourcePB
          priceBreakdown: m.priceBreakdown || m.legs?.[0]?.__sourcePB || null,
        };

        const exist = dedup.get(key);
        if (!exist || rec.totalPrice < exist.totalPrice) dedup.set(key, rec);
        if (dedup.size >= MAX_RESULTS) break;
      }
      return Array.from(dedup.values()).sort((a, b) => a.totalPrice - b.totalPrice);
    }

    // RETURN
    if (searchParams.tripType === "return") {
      const items = [];
      const hasSeparateReturnList = Array.isArray(returnFlights) && returnFlights.length > 0;

      if (!hasSeparateReturnList) {
        for (const out of availableFlights || []) {
          const { outbound, ret } = carveReturnFromSingleOffer(out, {
            origin: searchParams.origin,
            destination: searchParams.destination,
          });
          const ob = outbound || out;
          const rt = ret;
          if (!ob || !rt) continue;

          items.push({
            id: `${ob.id}-${rt.id}`,
            outbound: stripPB(ob),
            return: stripPB(rt),
            totalPrice: priceOf(out), // take offer's grand (no sums)
            totalStops: (ob.stops || 0) + (rt.stops || 0),
            // compute per-leg carriers, then merge
            airlines: Array.from(new Set([...carriersOfLeg(ob), ...carriersOfLeg(rt)])),
            cabin: cabinOf(ob),
            baggage: makeBaggageLabel(ob),
            refundable: false,
            // Always prefer the raw backend PB stashed on the outbound leg/offer
            priceBreakdown: ob?.__sourcePB || out?.__sourcePB || out?.priceBreakdown || null,
          });
          if (items.length >= MAX_RESULTS) break;
        }
        items.sort((a, b) => a.totalPrice - b.totalPrice);
        const final = new Map();
        for (const it of items) {
          const k = returnKey(it.outbound, it.return, it.cabin);
          if (!final.has(k) || it.totalPrice < final.get(k).totalPrice) final.set(k, it);
        }
        return Array.from(final.values());
      }

      // When returns are provided separately, still treat like oneway for totals
      const sortedReturns = [...returnFlights].sort((a, b) => priceOf(a) - priceOf(b));
      const final = new Map();

      for (const out of availableFlights || []) {
        let added = 0;
        for (let i = 0; i < sortedReturns.length && added < MAX_RETURNS_PER_OUTBOUND; i++) {
          const rt = sortedReturns[i];
          const rec = {
            id: `${out.id}-${rt.id}`,
            outbound: stripPB(out),
            return: stripPB(rt),
            totalPrice: priceOf(out), // DO NOT SUM out+ret
            totalStops: (out.stops || 0) + (rt.stops || 0),
            // compute per-leg carriers, then merge
            airlines: Array.from(new Set([...carriersOfLeg(out), ...carriersOfLeg(rt)])),
            cabin: cabinOf(out),
            baggage: makeBaggageLabel(out),
            refundable: false,
            // Raw backend breakdown from outbound offer only
            priceBreakdown: out.__sourcePB || out.priceBreakdown || null,
          };
          const k = returnKey(rec.outbound, rec.return, rec.cabin);
          if (!final.has(k) || rec.totalPrice < final.get(k).totalPrice) {
            final.set(k, rec);
            added++;
            if (final.size >= MAX_RESULTS) break;
          }
        }
        if (final.size >= MAX_RESULTS) break;
      }

      return Array.from(final.values()).sort((a, b) => a.totalPrice - b.totalPrice);
    }

    // ONEWAY
    const oneDedup = new Map();
    for (const f of availableFlights || []) {
      const rec = {
        id: f.id,
        outbound: stripPB(f),
        return: null,
        totalPrice: Number(priceOf(f)), // from f.priceBreakdown.totals.grand
        totalStops: f.stops || 0,
        // carriers from the (only) leg
        airlines: carriersOfLeg(f),
        cabin: cabinOf(f),
        baggage: makeBaggageLabel(f),
        refundable: false,
        // pass raw backend breakdown up to itinerary
        priceBreakdown: f.__sourcePB || f.priceBreakdown || null,
      };
      const k = onewayKey(rec.outbound, rec.cabin);
      if (!oneDedup.has(k) || rec.totalPrice < oneDedup.get(k).totalPrice) oneDedup.set(k, rec);
      if (oneDedup.size >= MAX_RESULTS) break;
    }
    return Array.from(oneDedup.values()).sort((a, b) => a.totalPrice - b.totalPrice);
  // include carved helper + carriersOfLeg to satisfy exhaustive-deps
  }, [searchParams, availableFlights, returnFlights, carveReturnFromSingleOffer, carriersOfLeg]);

  // ======= Recompute price bounds from actual itineraries =======
  useEffect(() => {
    if (Array.isArray(itineraries) && itineraries.length) {
      const prices = itineraries.map((it) => Number(it.totalPrice)).filter((p) => Number.isFinite(p));
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
  }, [itineraries]);

  // Filter + sort (with small guard for price values)
  const filteredItineraries = useMemo(() => {
    const [absMin, absMax] = priceBounds;
    const low = Math.max(absMin ?? 0, Math.min(minPrice, maxPrice));
    const high = Math.min(absMax ?? Infinity, Math.max(minPrice, maxPrice));

    return itineraries
      .filter((it) => {
        const priceOk = it.totalPrice >= low && it.totalPrice <= high;

            // ----- Robust stops across oneway/return/multi -----
            // Prefer itinerary.totalStops; if missing, derive from segments.
            const deriveLegStops = (leg) =>
            Math.max(0,
                Number.isFinite(leg?.stops)
                ? leg.stops
                : Math.max(0, (leg?.segments?.length || 1) - 1)
            );

            let stopsCount = 0;

            if (Number.isFinite(it.totalStops)) {
            // trusted field when present
            stopsCount = Math.max(0, it.totalStops);
            } else if (Array.isArray(it.legs) && it.legs.length) {
            // multi: sum per-leg stops
            stopsCount = it.legs.reduce((acc, l) => acc + deriveLegStops(l), 0);
            } else {
            // oneway/return: add outbound (+ return if present)
            stopsCount = deriveLegStops(it.outbound) + (it.return ? deriveLegStops(it.return) : 0);
            }

            // Collapse "2 or more" into the UI key we use in the sidebar
            const stopClass = stopsCount >= 2 ? "oneway_2" : `oneway_${stopsCount}`;
            const stopsOk = currentStop === "mix" || currentStop === stopClass;


        /* Outbound/return airline filters:
         * match if ANY carrier on that leg is selected (not just first carrier)
         */
        const obCarriers = carriersOfLeg(it.outbound || it.legs?.[0] || null);
        const rtCarriers = it.return ? carriersOfLeg(it.return) : [];

        const owOk =
          checkedOnewayValue.length === 0 ||
          obCarriers.some((code) => checkedOnewayValue.includes(`oneway_${code}`));

        const rtOk =
          !it.return ||
          checkedReturnValue.length === 0 ||
          rtCarriers.some((code) => checkedReturnValue.includes(`return_${code}`));

        // time windows
        const owDep = new Date(it.outbound?.segments?.[0]?.departureDate || it.outbound?.departureTime);
        const owHour = Number.isNaN(owDep.getTime()) ? 0 : owDep.getHours();
        const owTimeOk = owHour >= depTimeRange[0] && owHour <= depTimeRange[1];

        let rtTimeOk = true;
        if (it.return) {
          const rtDep = new Date(it.return?.segments?.[0]?.departureDate || it.return?.departureTime);
          const rtHour = Number.isNaN(rtDep.getTime()) ? 0 : rtDep.getHours();
          rtTimeOk = rtHour >= retTimeRange[0] && rtHour <= retTimeRange[1];
        }

        // CABIN FILTER
        const outCabinKey = normalizeCabinKey(
          it.cabin || it.outbound?.cabin || it.outbound?.segments?.[0]?.cabinClass
        );
        const retCabinKey = it.return
          ? normalizeCabinKey(it.return?.cabin || it.return?.segments?.[0]?.cabinClass)
          : null;

        const cabinOk =
          selectedCabins.length === 0 ||
          (selectedCabins.includes(outCabinKey) && (!retCabinKey || selectedCabins.includes(retCabinKey)));

        // duration + baggage
        const durHrs = totalDurationMins(it.outbound, it.return, it.legs) / 60;
        const durationOk = durHrs <= maxDurationHours;
        const bagOk =
          !baggageOnly ||
          hasBaggage(it.outbound) ||
          (it.return && hasBaggage(it.return)) ||
          (Array.isArray(it.legs) && it.legs.some((l) => hasBaggage(l)));

        return priceOk && stopsOk && owOk && rtOk && owTimeOk && rtTimeOk && durationOk && bagOk && cabinOk;
      })
      .sort((a, b) => (sortOrder === "asc" ? a.totalPrice - b.totalPrice : b.totalPrice - a.totalPrice));
  }, [
    itineraries,
    minPrice,
    maxPrice,
    priceBounds,
    currentStop,
    checkedOnewayValue,
    checkedReturnValue,
    depTimeRange,
    retTimeRange,
    maxDurationHours,
    baggageOnly,
    sortOrder,
    selectedCabins,
    carriersOfLeg, // <- include helper as dep
  ]);

  // Primary codes (exactly like your filter uses)
  /* Sidebar airline lists from **leg carriers**. */
  const outboundPrimary = useMemo(() => {
    const set = new Set();
    itineraries.forEach((it) => {
      const carriers = carriersOfLeg(it.outbound || it.legs?.[0]);
      carriers.forEach((c) => set.add(c));
    });
    return Array.from(set).sort();
  }, [itineraries, carriersOfLeg]);

  const returnPrimary = useMemo(() => {
    const set = new Set();
    itineraries.forEach((it) => {
      if (!it.return) return;
      carriersOfLeg(it.return).forEach((c) => set.add(c));
    });
    return Array.from(set).sort();
  }, [itineraries, carriersOfLeg]);

  // Live counts (accurate badges).
  const airlineCountsOutbound = useMemo(() => {
    const m = {};
    itineraries.forEach((it) => {
      carriersOfLeg(it.outbound || it.legs?.[0]).forEach((code) => {
        m[code] = (m[code] || 0) + 1;
      });
    });
    return m;
  }, [itineraries, carriersOfLeg]);

  const airlineCountsReturn = useMemo(() => {
    const m = {};
    itineraries.forEach((it) => {
      if (!it.return) return;
      carriersOfLeg(it.return).forEach((code) => {
        m[code] = (m[code] || 0) + 1;
      });
    });
    return m;
  }, [itineraries, carriersOfLeg]);

  // Cabin handlers
  const toggleCabin = (key) => {
    setSelectedCabins((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
    setCurrentPage(1);
    setOpenDetailsId(null);
  };
  const resetCabins = () => {
    setSelectedCabins([]);
    setCurrentPage(1);
    setOpenDetailsId(null);
  };

  // ---------- Pagination guards ----------
  const totalPages = useMemo(() => Math.ceil(filteredItineraries.length / flightsPerPage), [filteredItineraries]);

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
    () => filteredItineraries.slice((safePage - 1) * flightsPerPage, safePage * flightsPerPage),
    [filteredItineraries, safePage]
  );

  const listKey = useMemo(
    () =>
      JSON.stringify({
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
        page: safePage,
      }),
    [
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
      safePage,
    ]
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

  // Unique airline codes for filter checklists (include multi legs)
  const uniqueAirlines = useMemo(() => {
    const all = [
      ...availableFlights.flatMap((f) => {
        if (Array.isArray(f?.legs) && f.legs.length) {
          return f.legs.flatMap((l) =>
            (l?.marketingCarriers || [])
              .concat(l?.operatingCarriers || [])
              .concat((l?.segments || []).map((s) => s?.airline).filter(Boolean) || [])
          );
        }
        return (f?.marketingCarriers || [])
          .concat(f?.operatingCarriers || [])
          .concat(f?.segments?.map((s) => s?.airline).filter(Boolean) || []);
      }),
      ...returnFlights.flatMap((f) =>
        (f?.marketingCarriers || [])
          .concat(f?.operatingCarriers || [])
          .concat(f?.segments?.map((s) => s?.airline).filter(Boolean) || [])
      ),
    ].filter(Boolean);
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
          {/* Mobile: filter toggle */}
          <div className="mb-3 lg:hidden">
            <button
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
              onClick={() => setFiltersOpenMobile((v) => !v)}
            >
              {filtersOpenMobile ? "Hide filters" : "Show filters"}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          <div className="row g-3">
            {/* LEFT: Filters */}
            <div className="col-12 col-lg-5 col-xl-3">
              {/* Mobile collapse */}
              <AnimatePresence initial={false}>
                {filtersOpenMobile && (
                  <motion.div
                    key="filters-mobile"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="lg:hidden"
                  >
                    <div className="rounded-2xl border border-gray-200 bg-white/60 backdrop-blur p-3">
                      <FilterSidebar
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
                        selectedCabins={selectedCabins}
                        onToggleCabin={toggleCabin}
                        onResetCabins={resetCabins}
                        airlinesOutboundExact={outboundPrimary}
                        airlinesReturnExact={returnPrimary}
                        airlineCountsOutbound={airlineCountsOutbound}
                        airlineCountsReturn={airlineCountsReturn}
                        tripType={tripType}
                        legsCount={legsCount}
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
                          setSelectedCabins([]);
                          resetToTop();
                        }}
                        onCloseMobile={() => setFiltersOpenMobile(false)}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Desktop sticky sidebar */}
              <div className="hidden lg:block lg:top-28">
                <div className="bg-white">
                  <FilterSidebar
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
                    selectedCabins={selectedCabins}
                    onToggleCabin={toggleCabin}
                    onResetCabins={resetCabins}
                    airlinesOutboundExact={outboundPrimary}
                    airlinesReturnExact={returnPrimary}
                    airlineCountsOutbound={airlineCountsOutbound}
                    airlineCountsReturn={airlineCountsReturn}
                    tripType={tripType}
                    legsCount={legsCount}
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
                      setSelectedCabins([]);
                      resetToTop();
                    }}
                  />
                </div>
              </div>
            </div>

            {/* RIGHT: Results */}
            <div className="col-12 col-lg-7 col-xl-9">
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
                      onOpen={() => setFiltersOpenMobile(true)}
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
                  <Pagination currentPage={safePage} totalPages={totalPages} handlePageChange={handlePageChange} />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlightPage;
