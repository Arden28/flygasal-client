// src/lib/transformPKFareData.js

// Human-readable mapping for PKFare "penaltyType"
function humanizePenaltyType(t) {
  switch (t) {
    case 0: return 'Refund';
    case 1: return 'Change';
    case 2: return 'No-show';
    case 3: return 'Reissue / Reroute';
    default: return `Penalty_${t}`;
  }
}

/**
 * Normalize PKFare payload into UI-friendly offers
 * @param {object} pkData The "data" object returned by PKFare (solutions, flights, segments, shoppingKey, etc.)
 * @returns {Array<object>}
 */
export function transformPKFareData(pkData) {
  if (!pkData) return [];

  const segmentsById = Object.fromEntries(
    (pkData.segments || []).map(seg => [seg.segmentId, seg])
  );

  const flightsById = Object.fromEntries(
    (pkData.flights || []).map(f => [f.flightId, f])
  );

  const solutions = pkData.solutions || [];

  const offers = solutions.map(solution => {
    // Collect flightIds in journey order
    const journeyKeys = Object.keys(solution.journeys || {});
    const flightIds = journeyKeys.map(k => solution.journeys[k]).flat();
    if (!flightIds.length) return null;

    // Flatten segmentIds in order
    const segIds = flightIds
      .map(fid => flightsById[fid]?.segmengtIds || []) // provider typo key: segmengtIds
      .flat();

    const tripSegments = segIds
      .map(id => segmentsById[id])
      .filter(Boolean);

    if (!tripSegments.length) return null;

    const firstSeg = tripSegments[0];
    const lastSeg  = tripSegments[tripSegments.length - 1];
    const firstFlight = flightsById[flightIds[0]] || null;

    // Build 1-based index → segmentId map (because baggage/rules refer to segment indices)
    const idxToSegId = {};
    tripSegments.forEach((seg, i) => { idxToSegId[i + 1] = seg.segmentId; });

    // Baggage (ADT only in sample)
    const adt = (solution.baggageMap && solution.baggageMap.ADT) ? solution.baggageMap.ADT : [];
    const checkedBySegment = {};
    const carryOnBySegment = {};
    adt.forEach(bag => {
      (bag.segmentIndexList || []).forEach(n => {
        const segId = idxToSegId[n];
        if (!segId) return;
        checkedBySegment[segId] = {
          amount: bag.baggageAmount ?? null,
          weight: bag.baggageWeight ?? null,
        };
        carryOnBySegment[segId] = {
          amount: bag.carryOnAmount ?? null,
          weight: bag.carryOnWeight ?? null,
          size:   bag.carryOnSize ?? null,
        };
      });
    });

    // Rules (ADT)
    const rulesADTBlocks = (solution.miniRuleMap && solution.miniRuleMap.ADT) ? solution.miniRuleMap.ADT : [];
    const rulesADT = rulesADTBlocks.map(block => {
      const segmentIds = (block.segmentIndex || [])
        .map(n => idxToSegId[n])
        .filter(Boolean);
      const miniRules = (block.miniRules || []).map(r => ({
        ...r,
        label: humanizePenaltyType(r.penaltyType),
      }));
      return { segmentIds, miniRules };
    });

    // Price breakdown
    const currency = solution.currency || 'USD';
    const base     = Number(solution.adtFare ?? 0);
    const taxes    = Number(solution.adtTax ?? 0);
    const qCharge  = Number(solution.qCharge ?? 0);
    const tktFee   = Number(solution.tktFee ?? 0);
    const platformServiceFee = Number(solution.platformServiceFee ?? 0);
    const merchantFee = Number(solution.merchantFee ?? 0);
    const total = base + taxes + qCharge + tktFee + platformServiceFee + merchantFee;

    // Carriers & misc
    const marketingCarriers = Array.from(new Set(tripSegments.map(s => s.airline))).filter(Boolean);
    const operatingCarriers = tripSegments.map(s => s.opFltAirline ?? null);
    const lastTkt = firstFlight && firstFlight.lastTktTime ? new Date(firstFlight.lastTktTime) : null;
    const expired = lastTkt ? lastTkt < new Date() : false;
    const isVI = Array.isArray(solution.category) && solution.category.includes('VI');

    return {
      id: firstSeg.segmentId,
      solutionKey: solution.solutionKey,
      solutionId: solution.solutionId,
      shoppingKey: pkData.shoppingKey ?? null,

      platingCarrier: solution.platingCarrier ?? null,
      marketingCarriers,
      operatingCarriers,
      flightNumber: `${firstSeg.airline}${firstSeg.flightNum}`,
      origin: firstSeg.departure,
      destination: lastSeg.arrival,
      departureTime: new Date(firstSeg.departureDate),
      arrivalTime: new Date(lastSeg.arrivalDate),
      journeyTime: firstFlight?.journeyTime ?? null,
      transferCount: firstFlight?.transferCount ?? null,
      stops: Math.max(tripSegments.length - 1, 0),
      terminals: { from: firstSeg.departureTerminal ?? null, to: lastSeg.arrivalTerminal ?? null },
      equipment: firstSeg.equipment ?? null,
      cabin: firstSeg.cabinClass,
      bookingCode: firstSeg.bookingCode,
      availabilityCount: firstSeg.availabilityCount ?? 0,

      isVI,

      priceBreakdown: {
        currency,
        base,
        taxes,
        qCharge,
        tktFee,
        platformServiceFee,
        merchantFee,
        total,
      },

      baggage: {
        adt: {
          checkedBySegment,
          carryOnBySegment,
        },
      },

      rules: { adt: rulesADT },

      flightIds,
      segments: tripSegments,
      lastTktTime: lastTkt,
      expired,
    };
  }).filter(Boolean);

  return offers;
}
