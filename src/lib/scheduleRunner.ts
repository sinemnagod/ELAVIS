import { readStorage, writeStorage, storageKeys, userStorageKeys } from "@/lib/storage";
import { ChargingSchedule, ChargingSession, Notification, Station, Vehicle } from "@/types";
import { LiveChargingState, HOME_STATION_ID } from "@/lib/chargingSession";
import sessionsData from "@/data/sessions.json";
import stationsData from "@/data/stations.json";
import vehiclesData from "@/data/vehicles.json";

const HOME_TICK_SECONDS = 4;
const STATION_TICK_SECONDS = 3;

// Sunday-first to match Date.getDay()'s 0-6 index
const DAY_CODES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getCurrentHHMM(): string {
  const d = new Date();
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

export interface TriggeredSchedule {
  scheduleId: string;
  vehicleId: string;
  vehicleName: string;
  mode: "home" | "station";
  limit: number;
  destinationName: string;
}

/**
 * Checks every active schedule for the given user's owned vehicles against the
 * current day/time, and starts a real liveCharging session for any that are due
 * and haven't already fired today. Meant to be polled periodically while any
 * dashboard page is mounted (see DashboardLayout).
 */
export function runDueSchedules(userId: string, ownedVehicleIds: string[], language: "en" | "tr"): TriggeredSchedule[] {
  if (!userId || ownedVehicleIds.length === 0) return [];

  const schedules = readStorage<ChargingSchedule[]>(userStorageKeys.schedules(userId), []);
  if (schedules.length === 0) return [];

  const now = new Date();
  const today = DAY_CODES[now.getDay()];
  const nowHHMM = getCurrentHHMM();
  const todayKey = now.toISOString().slice(0, 10);

  const firedLog = readStorage<Record<string, string>>(userStorageKeys.scheduleLastFired(userId), {});
  const vehicles = vehiclesData as Vehicle[];
  const stations = readStorage<Station[]>(storageKeys.stations, stationsData as Station[]);

  const triggered: TriggeredSchedule[] = [];
  let firedLogChanged = false;

  for (const schedule of schedules) {
    if (!schedule.active) continue;
    if (!ownedVehicleIds.includes(schedule.vehicleId)) continue;
    if (!schedule.days.includes(today)) continue;
    if (schedule.departureTime !== nowHHMM) continue;
    if (firedLog[schedule.id] === todayKey) continue; // already fired today

    // Skip if this vehicle is already charging (home or station)
    const existingLive = readStorage<LiveChargingState | null>(
      userStorageKeys.liveCharging(userId, schedule.vehicleId),
      null
    );
    if (existingLive) continue;

    const settings = readStorage<any>(
      userStorageKeys.vehicleSettings(userId, schedule.vehicleId),
      { batteryLevel: 78 }
    );
    const currentBattery = Number(settings.batteryLevel ?? 78);
    if (currentBattery >= schedule.limit) continue; // already at or above target

    const stationObj = schedule.mode === "station" && schedule.stationId
      ? stations.find((s) => s.id === schedule.stationId)
      : null;
    const stationId = stationObj ? stationObj.id : HOME_STATION_ID;

    const sessions = readStorage<ChargingSession[]>(storageKeys.sessions, sessionsData as ChargingSession[]);
    const sessionId = "sess-" + Date.now().toString().slice(-6) + Math.floor(Math.random() * 90 + 10);
    const newSession: ChargingSession = {
      id: sessionId,
      userId,
      vehicleId: schedule.vehicleId,
      stationId,
      energyKWh: 0,
      cost: 0,
      status: "charging",
      startedAt: new Date().toISOString()
    };
    writeStorage(storageKeys.sessions, [newSession, ...sessions]);

    const liveState: LiveChargingState = {
      sessionId,
      vehicleId: schedule.vehicleId,
      mode: schedule.mode,
      stationId,
      startPercent: currentBattery,
      targetPercent: schedule.limit,
      startedAt: new Date().toISOString(),
      tickSeconds: schedule.mode === "station" ? STATION_TICK_SECONDS : HOME_TICK_SECONDS
    };
    writeStorage(userStorageKeys.liveCharging(userId, schedule.vehicleId), liveState);

    const vehicleName = vehicles.find((v) => v.id === schedule.vehicleId)?.name || schedule.vehicleId;
    const destinationName = stationObj ? stationObj.name : (language === "en" ? "Home" : "Ev");

    const notification: Notification = {
      id: "notif-" + Date.now().toString().slice(-6) + Math.floor(Math.random() * 90 + 10),
      userId,
      title: language === "en" ? "Scheduled Charging Started" : "Planlı Şarj Başladı",
      message: language === "en"
        ? `${vehicleName} started charging to ${schedule.limit}% at ${destinationName} (scheduled ${schedule.departureTime}).`
        : `${vehicleName}, ${destinationName} konumunda %${schedule.limit} hedefine kadar şarj olmaya başladı (planlanan saat: ${schedule.departureTime}).`,
      read: false,
      createdAt: new Date().toISOString()
    };
    const notifications = readStorage<Notification[]>(storageKeys.notifications, []);
    writeStorage(storageKeys.notifications, [notification, ...notifications]);

    firedLog[schedule.id] = todayKey;
    firedLogChanged = true;
    triggered.push({
      scheduleId: schedule.id,
      vehicleId: schedule.vehicleId,
      vehicleName,
      mode: schedule.mode,
      limit: schedule.limit,
      destinationName
    });
  }

  if (firedLogChanged) {
    writeStorage(userStorageKeys.scheduleLastFired(userId), firedLog);
  }
  if (triggered.length > 0) {
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new Event("activeVehicleChanged"));
    window.dispatchEvent(new Event("evalis:sessionsUpdated"));
    window.dispatchEvent(new Event("evalis:notificationsUpdated"));
  }
  return triggered;
}

export interface NextScheduledCharge {
  when: Date;
  schedule: ChargingSchedule;
}

/** Finds the soonest upcoming occurrence (within the next 7 days) of any active schedule for a vehicle. */
export function getNextScheduledCharge(schedules: ChargingSchedule[], vehicleId: string): NextScheduledCharge | null {
  const relevant = schedules.filter((s) => s.active && s.vehicleId === vehicleId && s.days.length > 0);
  if (relevant.length === 0) return null;

  const now = new Date();
  let best: NextScheduledCharge | null = null;

  for (const schedule of relevant) {
    const [hh, mm] = schedule.departureTime.split(":").map(Number);
    for (let offset = 0; offset < 8; offset++) {
      const candidate = new Date(now);
      candidate.setDate(now.getDate() + offset);
      candidate.setHours(hh, mm, 0, 0);
      if (!schedule.days.includes(DAY_CODES[candidate.getDay()])) continue;
      if (candidate.getTime() <= now.getTime()) continue;
      if (!best || candidate.getTime() < best.when.getTime()) {
        best = { when: candidate, schedule };
      }
      break;
    }
  }
  return best;
}

export function formatNextCharge(next: NextScheduledCharge, language: "en" | "tr"): string {
  const now = new Date();
  const isToday = next.when.toDateString() === now.toDateString();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const isTomorrow = next.when.toDateString() === tomorrow.toDateString();

  const dayLabel = isToday
    ? (language === "en" ? "Today" : "Bugün")
    : isTomorrow
      ? (language === "en" ? "Tomorrow" : "Yarın")
      : next.when.toLocaleDateString(language === "en" ? "en-US" : "tr-TR", { weekday: "short" });

  return `${dayLabel} ${next.schedule.departureTime}`;
}
