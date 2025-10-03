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

export const calculateLayover = (arrivalTime, nextDepartureTime) => {
  if (!arrivalTime || !nextDepartureTime) return "";

  const diffMs = new Date(nextDepartureTime) - new Date(arrivalTime);
  if (diffMs <= 0) return "Invalid layover";

  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;

  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m layover`;
  } else if (hours > 0) {
    return `${hours}h layover`;
  } else {
    return `${minutes}m layover`;
  }
};
