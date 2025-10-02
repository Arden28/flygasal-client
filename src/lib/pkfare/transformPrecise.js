import { dt, toNum, humanizePenaltyType, getSegIdsFromFlight } from './utils.js';

/**
 * Normalize PRECISE PRICING into array of one offer.
 * JS version matching your desired behavior.
 */
export function transformPreciseData(pkData) {
  if (!pkData) return [];

  // If backend already normalized (single offer or {offer})
  const maybeOffer = pkData?.offer ?? (pkData?.type === 'precise_pricing' ? pkData : null);
  if (maybeOffer && typeof maybeOffer === 'object') return [maybeOffer];

  const data = pkData?.data ?? pkData;
  const solution = data?.solution ?? null;
  const flightsArr = data?.flights ?? [];
  const segmentsArr = data?.segments ?? [];
  const ancillaries = data?.ancillaryAvailability ?? {};

  if (!solution) return [];
  const passengers = {
    adults:   Number(solution?.adults ?? 0),
    children: Number(solution?.children ?? 0),
    infants:  Number(solution?.infants ?? 0),
  };
  passengers.total = passengers.adults + passengers.children + passengers.infants;

  const flightsById = Object.fromEntries(flightsArr.map((f) => [f.flightId, f]));
  const segmentsById = Object.fromEntries(segmentsArr.map((s) => [s.segmentId, s]));

  const journeyKeys = Object.keys(solution.journeys ?? {});
  const flightIds = journeyKeys.map((k) => solution.journeys[k]).flat();
  if (!flightIds.length) return [];

  const segIdsOrdered = flightIds
    .map((fid) => getSegIdsFromFlight(flightsById[fid]))
    .flat()
    .filter(Boolean);

  const segToFlight = {};
  flightIds.forEach((fid) => {
    getSegIdsFromFlight(flightsById[fid]).forEach((sid) => { segToFlight[sid] = fid; });
  });

  const tripSegments = segIdsOrdered.map((sid) => {
    const seg = segmentsById[sid];
    return seg ? { ...seg, flightId: segToFlight[sid] ?? null } : null;
  }).filter(Boolean);

  if (!tripSegments.length) return [];

  const firstSeg = tripSegments[0];
  const lastSeg  = tripSegments[tripSegments.length - 1];
  const firstFlight = flightsById[flightIds[0]] ?? null;

  const idxToSegId = {};
  tripSegments.forEach((seg, i) => (idxToSegId[i + 1] = seg.segmentId));

  // Baggage (ADT)
  const adtBags = solution?.baggageMap?.ADT ?? [];
  const checkedBySegment = {};
  const carryOnBySegment = {};
  adtBags.forEach((bag) => {
    (bag.segmentIndexList ?? []).forEach((n) => {
      const segId = idxToSegId[n];
      if (!segId) return;
      checkedBySegment[segId] = { amount: bag.baggageAmount ?? null, weight: bag.baggageWeight ?? null };
      carryOnBySegment[segId] = { amount: bag.carryOnAmount ?? null, weight: bag.carryOnWeight ?? null, size: bag.carryOnSize ?? null };
    });
  });
  const baggageRawByIndex = solution?.baggages ?? null;

  // Rules (ADT)
  const rulesADTBlocks = solution?.miniRuleMap?.ADT ?? [];
  const rulesADT = rulesADTBlocks.map((block) => {
    const segmentIds = (block.segmentIndex ?? []).map((n) => idxToSegId[n]).filter(Boolean);
    const miniRules = (block.miniRules ?? []).map((r) => ({ ...r, label: humanizePenaltyType(r.penaltyType) }));
    return { segmentIds, miniRules };
  });

  // Pricing (per PTC + fees + grand total)
  const currency = solution?.currency ?? 'USD';
  const ADT = { count: Number(solution?.adults ?? 0),   fare: toNum(solution?.adtFare), tax: toNum(solution?.adtTax) };
  const CHD = { count: Number(solution?.children ?? 0), fare: toNum(solution?.chdFare), tax: toNum(solution?.chdTax) };
  const INF = { count: Number(solution?.infants ?? 0),  fare: toNum(solution?.infFare), tax: toNum(solution?.infTax) };

  const fees = {
    qCharge: toNum(solution?.qCharge),
    tktFee: toNum(solution?.tktFee),
    platformServiceFee: toNum(solution?.platformServiceFee),
    merchantFee: toNum(solution?.merchantFee),
  };
  const per = (ptc) => {
    const perPax = Math.max(0, ptc.fare + ptc.tax);
    const total  = perPax * Math.max(0, ptc.count);
    return { perPax, total };
  };
  const adtTotals = per(ADT), chdTotals = per(CHD), infTotals = per(INF);
  const feesTotal = Object.values(fees).reduce((s, v) => s + (Number(v) || 0), 0);
  const grandTotal = adtTotals.total + chdTotals.total + infTotals.total + feesTotal;

  const marketingCarriers = Array.from(new Set(tripSegments.map((s) => s.airline).filter(Boolean)));
  const operatingCarriers = tripSegments.map((s) => s.opFltAirline ?? null);

  const lastTkt = firstFlight?.lastTktTime ? dt(firstFlight.lastTktTime) : null;
  const expired = !!(lastTkt && lastTkt.getTime() < Date.now());

  const offer = {
    id: firstSeg.segmentId,
    type: 'precise_pricing',

    solutionKey: solution?.solutionKey ?? null,
    solutionId:  solution?.solutionId  ?? null,

    fareType: solution?.fareType ?? null,
    platingCarrier: solution?.platingCarrier ?? null,
    bookingWithoutCard: Number(solution?.bookingWithoutCard ?? 0),

    marketingCarriers,
    operatingCarriers,

    flightIds,
    segments: tripSegments,

    origin: firstSeg.departure,
    destination: lastSeg.arrival,
    departureTime: dt(firstSeg.departureDate),
    arrivalTime: dt(lastSeg.arrivalDate),

    passengers,

    journeyTime: firstFlight?.journeyTime ?? null,
    transferCount: firstFlight?.transferCount ?? null,
    stops: Math.max(tripSegments.length - 1, 0),
    terminals: { from: firstSeg?.departureTerminal ?? null, to: lastSeg?.arrivalTerminal ?? null },

    equipment: firstSeg?.equipment ?? null,
    cabin: firstSeg?.cabinClass ?? null,
    bookingCode: firstSeg?.bookingCode ?? null,
    availabilityCount: firstSeg?.availabilityCount ?? 0,

    baggage: {
      adt: { checkedBySegment, carryOnBySegment },
      rawByIndex: baggageRawByIndex,
    },

    rules: { adt: rulesADT },

    priceBreakdown: {
      currency,
      ADT: { count: ADT.count, fare: ADT.fare, taxes: ADT.tax, perPax: adtTotals.perPax, total: adtTotals.total },
      CHD: { count: CHD.count, fare: CHD.fare, taxes: CHD.tax, perPax: chdTotals.perPax, total: chdTotals.total },
      INF: { count: INF.count, fare: INF.fare, taxes: INF.tax, perPax: infTotals.perPax, total: infTotals.total },
      fees,
      feesTotal,
      grandTotal,
    },

    ancillaryAvailability: {
      paidBag: Boolean(ancillaries?.paidBag),
      paidSeat: Boolean(ancillaries?.paidSeat),
    },

    lastTktTime: lastTkt,
    expired,
  };

  return [offer];
}
