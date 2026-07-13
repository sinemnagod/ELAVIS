// Shared "is this vehicle currently charging" model, used by both the Overview
// page's Home charging button and the Charging Control page's station charging
// flow, so the two can never disagree about — or double-book — a vehicle's
// charging state.

export const HOME_STATION_ID = "home";

export interface LiveChargingState {
  sessionId: string;
  vehicleId: string;
  mode: "home" | "station";
  stationId: string;
  startPercent: number;
  targetPercent: number;
  startedAt: string;
  /** Seconds of real time per 1% of charge, so progress can be recomputed after a reload or navigation. */
  tickSeconds: number;
}

export function computeLiveProgress(liveState: LiveChargingState): { percent: number; done: boolean } {
  const elapsedSeconds = (Date.now() - new Date(liveState.startedAt).getTime()) / 1000;
  const elapsedTicks = Math.floor(elapsedSeconds / liveState.tickSeconds);
  const percent = Math.min(liveState.targetPercent, liveState.startPercent + elapsedTicks);
  return { percent, done: percent >= liveState.targetPercent };
}

/** Straight-line distance between two coordinates, in kilometers. */
export function haversineDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Parses a station's "250 kW" power label into a plain number. */
export function parsePowerKw(power: string): number {
  const match = power.match(/[\d.]+/);
  return match ? Number(match[0]) : 0;
}

/** A vehicle's onboard AC charger can't accept power faster than this, even at a high-power AC station. */
const AC_ONBOARD_LIMIT_KW = 11;

export interface ChargeEstimate {
  minutes: number;
  energyKWh: number;
  costUSD: number;
  costTRY: number;
}

/** Estimated time and cost to charge a vehicle from its current battery % to 100% at a given station. */
export function estimateChargeToFull(
  currentPercent: number,
  batteryCapacityKWh: number,
  stationType: "AC" | "DC",
  stationPower: string,
  pricePerKwhUSD: number,
  pricePerKwhTRY: number
): ChargeEstimate {
  const energyKWh = Math.max(0, ((100 - currentPercent) / 100) * batteryCapacityKWh);
  const stationKw = parsePowerKw(stationPower);
  const effectiveKw = stationType === "AC" ? Math.min(stationKw, AC_ONBOARD_LIMIT_KW) : stationKw;
  const minutes = effectiveKw > 0 ? Math.round((energyKWh / effectiveKw) * 60) : 0;
  return {
    minutes,
    energyKWh: Number(energyKWh.toFixed(1)),
    costUSD: Number((energyKWh * pricePerKwhUSD).toFixed(2)),
    costTRY: Number((energyKWh * pricePerKwhTRY).toFixed(2))
  };
}

export function formatDuration(minutes: number, language: "en" | "tr"): string {
  if (minutes <= 0) return language === "en" ? "0 min" : "0 dk";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return language === "en" ? `${mins} min` : `${mins} dk`;
  if (mins === 0) return language === "en" ? `${hours}h` : `${hours}s`;
  return language === "en" ? `${hours}h ${mins}m` : `${hours}s ${mins}d`;
}
