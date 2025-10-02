// Small helpers used by both transformers
export function humanizePenaltyType(t) {
  switch (t) {
    case 0: return 'Refund';
    case 1: return 'Change';
    case 2: return 'No-show';
    case 3: return 'Reissue / Reroute';
    default: return `Penalty_${t ?? 'NA'}`;
  }
}

export const dt = (ms) => (ms ? new Date(Number(ms)) : null);
export const toNum = (v) => (v == null ? 0 : Number(v) || 0);

/** Provider sometimes uses `segmengtIds` (sic). */
export function getSegIdsFromFlight(f) {
  return (f?.segmentIds ?? f?.segmengtIds ?? []).filter(Boolean);
}
