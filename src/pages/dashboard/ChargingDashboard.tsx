import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { readStorage, writeStorage, removeStorage, storageKeys, userStorageKeys } from "@/lib/storage";
import sessionsData from "@/data/sessions.json";
import notificationsData from "@/data/notifications.json";
import vehiclesData from "@/data/vehicles.json";
import stationsData from "@/data/stations.json";
import { ChargingSchedule, ChargingSession, Notification, Station, Vehicle } from "@/types";
import { getNextScheduledCharge, formatNextCharge } from "@/lib/scheduleRunner";
import {
  LiveChargingState,
  computeLiveProgress,
  haversineDistanceKm,
  estimateChargeToFull,
  formatDuration
} from "@/lib/chargingSession";
import { vehicleTelemetry, defaultVehicleTelemetry } from "@/data/vehicleTelemetry";
import { VehicleTopView } from "@/components/dashboard/VehicleTopView";

const STATION_TICK_SECONDS = 3;
const CHARGE_SESSION_TARGET = 80;
const RESERVATION_DURATION_MS = 15 * 60 * 1000;
// Reference point used for the "distance from you" flavor metric (central Istanbul)
const USER_LOCATION: [number, number] = [41.0082, 28.9784];

type SortMode = "recommended" | "distance" | "rating" | "price" | "power";

// Helper component to pan/zoom the map smoothly when the selected station changes
function ChangeMapView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true, duration: 1 });
  }, [center, zoom, map]);
  return null;
}

const AMENITY_LABELS: Record<string, { en: string; tr: string }> = {
  wifi: { en: "WiFi", tr: "WiFi" },
  cafe: { en: "Café", tr: "Kafe" },
  restroom: { en: "Restroom", tr: "Tuvalet" },
  covered: { en: "Covered", tr: "Kapalı Alan" },
  "247": { en: "24/7", tr: "7/24" }
};

export function ChargingDashboard() {
  const { showToast } = useToast();
  const { session } = useAuth();
  const { language, formatPrice } = useLanguage();
  const user = session?.user;
  const userId = user?.id || "guest";

  // Active vehicle, synced with the sidebar switcher exactly like Overview —
  // Home and Station charging must always agree on which vehicle they're talking about.
  const [activeVehicleId, setActiveVehicleId] = useState(() =>
    readStorage<string>(userStorageKeys.activeVehicleId(userId), "")
  );
  const [ownedIds, setOwnedIds] = useState<string[]>(() =>
    readStorage<string[]>(userStorageKeys.ownedVehicles(userId), user?.ownedVehicleIds || [])
  );

  useEffect(() => {
    const handleSync = () => {
      setActiveVehicleId(readStorage<string>(userStorageKeys.activeVehicleId(userId), ""));
      setOwnedIds(readStorage<string[]>(userStorageKeys.ownedVehicles(userId), user?.ownedVehicleIds || []));
    };
    window.addEventListener("activeVehicleChanged", handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener("activeVehicleChanged", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, [userId, user?.ownedVehicleIds]);

  const vehicles = vehiclesData as Vehicle[];
  const activeVehicle =
    (ownedIds.includes(activeVehicleId) && vehicles.find((v) => v.id === activeVehicleId)) ||
    vehicles.find((v) => v.id === ownedIds[0]) ||
    vehicles[0];
  const telemetry = vehicleTelemetry[activeVehicle.id] || defaultVehicleTelemetry;

  // Stations catalog, favorites, reservations (merged in from the old Stations Map page)
  const [stations] = useState<Station[]>(() => {
    const stored = readStorage<Station[]>(storageKeys.stations, []);
    if (stored.length === 0 || stored.some((s) => !s.type || s.rating === undefined)) {
      writeStorage(storageKeys.stations, stationsData as Station[]);
      return stationsData as Station[];
    }
    return stored;
  });

  const [favoriteStationIds, setFavoriteStationIds] = useState<string[]>(() =>
    readStorage<string[]>(userStorageKeys.favoriteStations(userId), [])
  );
  const [reservedStationIds, setReservedStationIds] = useState<string[]>(() =>
    readStorage<string[]>(userStorageKeys.reservations(userId), [])
  );
  const [reservationExpiries, setReservationExpiries] = useState<Record<string, number>>(() =>
    readStorage<Record<string, number>>(userStorageKeys.reservationExpiry(userId), {})
  );
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    writeStorage(userStorageKeys.favoriteStations(userId), favoriteStationIds);
  }, [favoriteStationIds, userId]);

  useEffect(() => {
    writeStorage(userStorageKeys.reservations(userId), reservedStationIds);
    const globalReservations = readStorage<Record<string, string[]>>(storageKeys.allReservations, {});
    globalReservations[userId] = reservedStationIds;
    writeStorage(storageKeys.allReservations, globalReservations);
  }, [reservedStationIds, userId]);

  useEffect(() => {
    writeStorage(userStorageKeys.reservationExpiry(userId), reservationExpiries);
  }, [reservationExpiries, userId]);

  // Tick every second to keep countdowns live and auto-release expired reservations
  useEffect(() => {
    const interval = setInterval(() => {
      const currentTime = Date.now();
      setNow(currentTime);
      setReservationExpiries((prevExpiries) => {
        const expiredIds = Object.keys(prevExpiries).filter((id) => prevExpiries[id] <= currentTime);
        if (expiredIds.length === 0) return prevExpiries;

        setReservedStationIds((prevReserved) => prevReserved.filter((id) => !expiredIds.includes(id)));
        expiredIds.forEach((stationId) => {
          const stationObj = stations.find((s) => s.id === stationId);
          showToast(
            language === "en"
              ? `Reservation at ${stationObj?.name || stationId} expired`
              : `${stationObj?.name || stationId} istasyonundaki rezervasyon süresi doldu`,
            "info"
          );
        });

        const nextExpiries = { ...prevExpiries };
        expiredIds.forEach((id) => delete nextExpiries[id]);
        return nextExpiries;
      });
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  // Filters / search / sort / map focus
  const [filterType, setFilterType] = useState<"ALL" | "DC" | "AC">("ALL");
  const [networkFilter, setNetworkFilter] = useState<"ALL" | "EVALIS" | "PARTNER">("ALL");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("recommended");
  const [mapCenter, setMapCenter] = useState<[number, number]>(USER_LOCATION);
  const [mapZoom, setMapZoom] = useState(11);
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);

  // The one shared "is this vehicle charging" record — also written to by the
  // Overview page's Home charging button, keyed per vehicle so each vehicle in
  // a fleet tracks its own state independently.
  const [liveState, setLiveState] = useState<LiveChargingState | null>(() =>
    readStorage<LiveChargingState | null>(userStorageKeys.liveCharging(userId, activeVehicle.id), null)
  );

  useEffect(() => {
    const handleSync = () => {
      setLiveState(readStorage<LiveChargingState | null>(userStorageKeys.liveCharging(userId, activeVehicle.id), null));
    };
    handleSync();
    window.addEventListener("activeVehicleChanged", handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener("activeVehicleChanged", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, [userId, activeVehicle.id]);

  // This page only ever drives a "station" session — a "home" session means
  // the Overview page's Home charging button already claimed this vehicle.
  const isHomeActive = liveState?.mode === "home";
  const stationLiveState = liveState?.mode === "station" ? liveState : null;
  const resumedProgress = stationLiveState ? computeLiveProgress(stationLiveState) : null;
  const activeStation = stations.find((s) => s.id === stationLiveState?.stationId) || null;

  const storedBatteryLevel = readStorage<any>(
    userStorageKeys.vehicleSettings(userId, activeVehicle.id),
    { batteryLevel: activeVehicle.batteryPercent || 78 }
  ).batteryLevel ?? (activeVehicle.batteryPercent || 78);

  const [isCharging, setIsCharging] = useState(() => !!stationLiveState && !resumedProgress?.done);
  const [chargePercent, setChargePercent] = useState<number>(() =>
    resumedProgress ? resumedProgress.percent : Number(storedBatteryLevel)
  );
  const [powerKw, setPowerKw] = useState(0);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(stationLiveState?.sessionId || null);
  const chargeStartPercentRef = useRef(stationLiveState?.startPercent ?? chargePercent);

  // Current battery % to use for "estimate to 100%" calculations while browsing
  const currentBatteryPercent = isCharging ? chargePercent : Number(storedBatteryLevel);

  // Same estimate formula used in the station list, so the active-session stat always matches it exactly
  const activeEstimate = activeStation
    ? estimateChargeToFull(
        currentBatteryPercent,
        telemetry.batteryCapacityKWh,
        activeStation.type,
        activeStation.power,
        activeStation.pricePerKwhUSD,
        activeStation.pricePerKwhTRY
      )
    : null;

  const allSchedules = readStorage<ChargingSchedule[]>(userStorageKeys.schedules(userId), []);
  const nextCharge = getNextScheduledCharge(allSchedules, activeVehicle.id);

  const writeCompletionNotification = (percent: number, station: Station) => {
    if (!user) return;
    const storedNotifications = readStorage<Notification[]>(
      storageKeys.notifications,
      notificationsData as Notification[]
    );
    const nextNotification: Notification = {
      id: "notif-" + Date.now().toString().slice(-6),
      userId: user.id,
      title: language === "en" ? "Charging Complete" : "Şarj Tamamlandı",
      message: language === "en"
        ? `${activeVehicle.name} reached ${percent}% charge at ${station.name}.`
        : `${activeVehicle.name}, ${station.name} noktasında %${percent} şarj seviyesine ulaştı.`,
      read: false,
      createdAt: new Date().toISOString()
    };
    writeStorage(storageKeys.notifications, [nextNotification, ...storedNotifications]);
    window.dispatchEvent(new Event("evalis:notificationsUpdated"));
  };

  const completeStoredSession = (percent: number, reason: "completed" | "stopped") => {
    if (!activeSessionId || !activeStation) return;
    const storedSessions = readStorage<ChargingSession[]>(
      storageKeys.sessions,
      sessionsData as ChargingSession[]
    );
    const energyKWh = Math.max(1, Number(((percent - chargeStartPercentRef.current) * 0.82).toFixed(1)));
    const nextSessions = storedSessions.map((storedSession) =>
      storedSession.id === activeSessionId
        ? {
            ...storedSession,
            energyKWh,
            cost: Number((energyKWh * activeStation.pricePerKwhUSD).toFixed(2)),
            status: "completed" as const,
            endedAt: new Date().toISOString()
          }
        : storedSession
    );
    writeStorage(storageKeys.sessions, nextSessions);
    window.dispatchEvent(new Event("evalis:sessionsUpdated"));
    if (reason === "completed") {
      writeCompletionNotification(percent, activeStation);
    }
    removeStorage(userStorageKeys.liveCharging(userId, activeVehicle.id));
    window.dispatchEvent(new Event("activeVehicleChanged"));
    setActiveSessionId(null);
    setLiveState(null);
  };

  useEffect(() => {
    let interval: any;
    if (isCharging && activeStation) {
      setPowerKw(activeStation.type === "DC" ? 150 : 22); // kW charging rate
      interval = setInterval(() => {
        setChargePercent((prev) => {
          if (prev >= CHARGE_SESSION_TARGET) {
            setIsCharging(false);
            completeStoredSession(CHARGE_SESSION_TARGET, "completed");
            showToast(
              language === "en"
                ? `Charging complete to ${CHARGE_SESSION_TARGET}% target limit`
                : `Şarj %${CHARGE_SESSION_TARGET} hedef sınırına başarıyla ulaştı`,
              "success"
            );
            return CHARGE_SESSION_TARGET;
          }
          return prev + 1;
        });
      }, STATION_TICK_SECONDS * 1000);
    } else {
      setPowerKw(0);
    }
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSessionId, isCharging, showToast, language, activeStation?.type]);

  // If a charging session finished its target while the user was away, finalize it now
  useEffect(() => {
    if (stationLiveState && resumedProgress?.done) {
      completeStoredSession(resumedProgress.percent, "completed");
      showToast(
        language === "en"
          ? "Charging completed while you were away"
          : "Siz uzaktayken şarj tamamlandı",
        "success"
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the local ticking state in sync whenever the active vehicle (or its
  // live session) changes — without this, switching vehicles from the sidebar
  // left chargePercent pointing at the previously selected vehicle's battery.
  useEffect(() => {
    if (stationLiveState) {
      const progress = computeLiveProgress(stationLiveState);
      setChargePercent(progress.percent);
      setActiveSessionId(stationLiveState.sessionId);
      chargeStartPercentRef.current = stationLiveState.startPercent;
      setIsCharging(!progress.done);
    } else {
      setChargePercent(Number(storedBatteryLevel));
      setActiveSessionId(null);
      setIsCharging(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeVehicle.id, liveState]);

  const createStoredSession = (station: Station) => {
    if (!user) return null;
    const storedSessions = readStorage<ChargingSession[]>(
      storageKeys.sessions,
      sessionsData as ChargingSession[]
    );
    const nextSession: ChargingSession = {
      id: "sess-" + Date.now().toString().slice(-6),
      userId: user.id,
      vehicleId: activeVehicle.id,
      stationId: station.id,
      energyKWh: 0,
      cost: 0,
      status: "charging",
      startedAt: new Date().toISOString()
    };
    writeStorage(storageKeys.sessions, [nextSession, ...storedSessions]);
    window.dispatchEvent(new Event("evalis:sessionsUpdated"));
    return nextSession.id;
  };

  const handleStartChargingAt = (station: Station) => {
    if (isHomeActive) {
      showToast(
        language === "en"
          ? "This vehicle is already charging at home"
          : "Bu araç zaten evde şarj oluyor",
        "info"
      );
      return;
    }
    if (currentBatteryPercent >= CHARGE_SESSION_TARGET) {
      showToast(
        language === "en"
          ? "Battery is already at or above your charge limit"
          : "Batarya zaten hedef şarj sınırında veya üzerinde",
        "info"
      );
      return;
    }
    const storedSessionId = createStoredSession(station);
    if (!storedSessionId) return;
    setActiveSessionId(storedSessionId);
    chargeStartPercentRef.current = currentBatteryPercent;
    setChargePercent(currentBatteryPercent);
    setIsCharging(true);

    const nextLiveState: LiveChargingState = {
      sessionId: storedSessionId,
      vehicleId: activeVehicle.id,
      mode: "station",
      stationId: station.id,
      startPercent: currentBatteryPercent,
      targetPercent: CHARGE_SESSION_TARGET,
      startedAt: new Date().toISOString(),
      tickSeconds: STATION_TICK_SECONDS
    };
    writeStorage(userStorageKeys.liveCharging(userId, activeVehicle.id), nextLiveState);
    setLiveState(nextLiveState);
    window.dispatchEvent(new Event("activeVehicleChanged"));
    showToast(
      language === "en" ? `Charging started at ${station.name}` : `${station.name} noktasında şarj başlatıldı`,
      "success"
    );
  };

  const handleStopCharging = () => {
    setIsCharging(false);
    completeStoredSession(chargePercent, "stopped");
    showToast(language === "en" ? "Charging session stopped" : "Şarj işlemi durduruldu", "info");
  };

  const handleToggleFavorite = (station: Station) => {
    setFavoriteStationIds((prev) => {
      const isFavorite = prev.includes(station.id);
      showToast(
        isFavorite
          ? language === "en" ? "Station removed from favorites" : "İstasyon favorilerden kaldırıldı"
          : language === "en" ? "Station added to favorites" : "İstasyon favorilere eklendi",
        isFavorite ? "info" : "success"
      );
      return isFavorite ? prev.filter((id) => id !== station.id) : [...prev, station.id];
    });
  };

  const formatCountdown = (stationId: string) => {
    const expiresAt = reservationExpiries[stationId];
    if (!expiresAt) return null;
    const remainingMs = Math.max(0, expiresAt - now);
    const minutes = Math.floor(remainingMs / 60000);
    const seconds = Math.floor((remainingMs % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleToggleReserve = (station: Station) => {
    const isReserved = reservedStationIds.includes(station.id);
    if (isReserved) {
      setReservedStationIds((prev) => prev.filter((id) => id !== station.id));
      setReservationExpiries((prev) => {
        const next = { ...prev };
        delete next[station.id];
        return next;
      });
      showToast(language === "en" ? "Reservation cancelled successfully" : "Rezervasyon başarıyla iptal edildi", "info");
    } else {
      if (station.availablePorts <= 0) {
        showToast(
          language === "en" ? "No ports available for reservation" : "Rezervasyon için kullanılabilir soket yok",
          "error"
        );
        return;
      }
      setReservedStationIds((prev) => [...prev, station.id]);
      setReservationExpiries((prev) => ({ ...prev, [station.id]: Date.now() + RESERVATION_DURATION_MS }));
      showToast(language === "en" ? "Port reserved for 15 minutes!" : "Soket 15 dakika boyunca rezerve edildi!", "success");
    }
  };

  const handleSelectStation = (station: Station) => {
    setMapCenter([station.latitude, station.longitude]);
    setMapZoom(14);
    setSelectedStationId(station.id);
  };

  // Build the enriched, filtered, sorted station list
  const enrichedStations = stations.map((station) => {
    const distanceKm = haversineDistanceKm(USER_LOCATION[0], USER_LOCATION[1], station.latitude, station.longitude);
    const estimate = estimateChargeToFull(
      currentBatteryPercent,
      telemetry.batteryCapacityKWh,
      station.type,
      station.power,
      station.pricePerKwhUSD,
      station.pricePerKwhTRY
    );
    return { station, distanceKm, estimate };
  });

  const filteredStations = enrichedStations
    .filter(({ station }) => filterType === "ALL" || station.type === filterType)
    .filter(({ station }) =>
      networkFilter === "ALL" ||
      (networkFilter === "EVALIS" ? station.network === "EVALIS" : station.network !== "EVALIS")
    )
    .filter(({ station }) => !favoritesOnly || favoriteStationIds.includes(station.id))
    .filter(({ station }) =>
      !searchQuery.trim() || station.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
    )
    .sort((a, b) => {
      if (sortMode === "distance") return a.distanceKm - b.distanceKm;
      if (sortMode === "rating") return b.station.rating - a.station.rating;
      if (sortMode === "price") return a.station.pricePerKwhUSD - b.station.pricePerKwhUSD;
      if (sortMode === "power") return a.estimate.minutes - b.estimate.minutes;
      // recommended: favorites first, then by available ports
      const aFav = favoriteStationIds.includes(a.station.id);
      const bFav = favoriteStationIds.includes(b.station.id);
      if (aFav !== bFav) return aFav ? -1 : 1;
      return b.station.availablePorts - a.station.availablePorts;
    });

  const getCustomMarkerIcon = (station: Station, isReserved: boolean) => {
    const isActive = station.status === "active";
    const netAvailable = isReserved ? Math.max(0, station.availablePorts - 1) : station.availablePorts;
    let colorClass = "bg-red-500 shadow-[0_0_8px_#ef4444]";
    if (isActive && netAvailable > 0) {
      colorClass = station.type === "DC"
        ? "bg-accent shadow-[0_0_8px_#2a7a5f] animate-pulse"
        : "bg-sky-400 shadow-[0_0_8px_#38bdf8] animate-pulse";
    } else if (isActive) {
      colorClass = "bg-amber-500 shadow-[0_0_8px_#f59e0b]";
    }
    const isPartner = station.network !== "EVALIS";
    return L.divIcon({
      className: "custom-leaflet-marker",
      html: `<div class="w-8 h-8 rounded-full flex items-center justify-center bg-slate-900/90 border ${isPartner ? "border-2 border-dashed border-slate-400" : "border-white/10"} shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
        <span class="w-3 h-3 rounded-full ${colorClass}" />
      </div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
  };

  const renderStars = (rating: number) => {
    const filled = Math.round(rating);
    return (
      <span className="inline-flex items-center gap-0.5" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, i) => (
          <svg
            key={i}
            className={`w-2.5 h-2.5 ${i < filled ? "text-amber-400" : "text-slate-600"}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M10 1.5l2.6 5.6 6.1.6-4.6 4.1 1.3 6-5.4-3.1-5.4 3.1 1.3-6-4.6-4.1 6.1-.6z" />
          </svg>
        ))}
      </span>
    );
  };

  if (ownedIds.length === 0) {
    return (
      <div className="dash-panel p-12 flex flex-col items-center text-center gap-4 animate-fade-in">
        <h2 className="text-lg font-light uppercase tracking-widest text-slate-100">
          {language === "en" ? "No Vehicle to Charge" : "Şarj Edilecek Araç Yok"}
        </h2>
        <p className="text-xs text-slate-500 font-light max-w-sm">
          {language === "en"
            ? "Add a vehicle to your fleet before starting a charging session."
            : "Şarj işlemi başlatmadan önce filonuza bir araç ekleyin."}
        </p>
        <Link
          to="/dashboard/vehicles"
          className="rounded-full bg-accent text-black px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-[#348c70] transition duration-300"
        >
          {language === "en" ? "Add a Vehicle" : "Araç Ekle"}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-10">

      {/* Header Segment */}
      <div className="dash-panel p-6">
        <h1 className="text-xl font-light uppercase tracking-widest text-slate-100">
          {language === "en" ? "Charging" : "Şarj"}
        </h1>
        <p className="text-[9px] text-slate-500 font-light tracking-wide mt-1">
          {language === "en"
            ? `Find a station for ${activeVehicle.name}, compare price and speed, and start charging.`
            : `${activeVehicle.name} için bir istasyon bulun, fiyat ve hızı karşılaştırın, şarjı başlatın.`}
        </p>
      </div>

      {/* Home charging conflict banner */}
      {isHomeActive && (
        <div className="dash-panel p-5 flex items-center gap-4 border-amber-500/30">
          <div className="w-9 h-9 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-500 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <p className="text-xs text-slate-300 font-light">
            {language === "en"
              ? `${activeVehicle.name} is already charging at home. Stop it from Overview before starting a station session.`
              : `${activeVehicle.name} zaten evde şarj oluyor. Bir istasyon oturumu başlatmadan önce Genel Bakış'tan durdurun.`}
          </p>
          <Link
            to="/dashboard"
            className="ml-auto shrink-0 text-[10px] uppercase tracking-widest text-amber-500 hover:text-amber-400 font-bold transition"
          >
            {language === "en" ? "Go to Overview" : "Genel Bakış'a Git"}
          </Link>
        </div>
      )}

      {/* Vehicle status strip — also hosts the active charging session inline, using the spare space beside the animation */}
      <div className="dash-panel p-6 flex items-center gap-8 flex-wrap">
        <div className="w-56 h-36 rounded-2xl overflow-hidden bg-black/20 border border-white/5 flex items-center justify-center p-3 shrink-0">
          <VehicleTopView vehicleId={activeVehicle.id} isCharging={!!liveState} className="h-full" />
        </div>
        <div className="min-w-0 space-y-1.5 shrink-0">
          <p className="font-semibold text-slate-200 uppercase tracking-wider text-xl">{activeVehicle.name}</p>
          <p className="text-sm text-slate-400 font-mono">
            {language === "en" ? "Battery" : "Batarya"}: <span className="text-accent font-semibold">{Math.round(currentBatteryPercent)}%</span>
            {" · "}
            {Math.round(currentBatteryPercent * telemetry.rangeFactor)} km {language === "en" ? "range" : "menzil"}
          </p>
          {!liveState && nextCharge && (
            <p className="text-[10px] text-slate-500 font-mono">
              {language === "en" ? "Next scheduled charge" : "Sonraki planlı şarj"}: {formatNextCharge(nextCharge, language)}
            </p>
          )}
        </div>

        {stationLiveState && activeStation && (
          <div className="flex items-center gap-8 flex-wrap ml-auto pl-8 border-l border-white/5">
            <div>
              <span className="px-2.5 py-0.5 rounded-full text-[8px] font-bold tracking-widest uppercase bg-accent/15 border border-accent/25 text-accent animate-pulse">
                {language === "en" ? "Charging" : "Şarj Oluyor"}
              </span>
              <p className="text-xs text-slate-300 font-mono mt-1.5 uppercase tracking-wider">{activeStation.name}</p>
            </div>
            <div>
              <span className="text-[8px] text-slate-500 uppercase tracking-widest block font-bold">
                {language === "en" ? "Power" : "Güç"}
              </span>
              <span className="text-lg font-light text-slate-100 font-mono block">
                {powerKw} <span className="text-xs text-slate-450">kW</span>
              </span>
            </div>
            <div>
              <span className="text-[8px] text-slate-500 uppercase tracking-widest block font-bold">
                {language === "en" ? "Est. to 100%" : "%100'e Tahmini"}
              </span>
              <span className="text-lg font-light text-slate-100 font-mono block">
                {activeEstimate ? formatDuration(activeEstimate.minutes, language) : "—"}
              </span>
            </div>
            <button
              onClick={handleStopCharging}
              className="py-2.5 px-6 rounded-full text-[10px] font-bold uppercase tracking-widest transition cursor-pointer bg-red-500 hover:bg-red-650 text-white shrink-0"
            >
              {language === "en" ? "Stop Charging" : "Şarjı Durdur"}
            </button>
          </div>
        )}
      </div>

      {/* Toolbar: search, sort, filters */}
      <div className="dash-panel p-5 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === "en" ? "Search stations by name..." : "İstasyon adına göre ara..."}
            className="flex-grow rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-accent transition"
          />
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as SortMode)}
            className="rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-xs text-slate-300 outline-none focus:border-accent transition cursor-pointer"
          >
            <option value="recommended" className="bg-[#0a0f18]">{language === "en" ? "Recommended" : "Önerilen"}</option>
            <option value="distance" className="bg-[#0a0f18]">{language === "en" ? "Nearest" : "En Yakın"}</option>
            <option value="rating" className="bg-[#0a0f18]">{language === "en" ? "Highest Rated" : "En Yüksek Puan"}</option>
            <option value="price" className="bg-[#0a0f18]">{language === "en" ? "Cheapest" : "En Ucuz"}</option>
            <option value="power" className="bg-[#0a0f18]">{language === "en" ? "Fastest" : "En Hızlı"}</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[9px] uppercase font-bold tracking-wider">
          {(["ALL", "DC", "AC"] as const).map((item) => (
            <button
              key={item}
              onClick={() => setFilterType(item)}
              className={`px-3.5 py-2 rounded-full border transition cursor-pointer ${
                filterType === item
                  ? "border-accent/40 bg-accent/15 text-accent"
                  : "border-white/10 bg-white/5 text-slate-400 hover:text-white"
              }`}
            >
              {item}
            </button>
          ))}
          <span className="w-px h-4 bg-white/10 mx-1" />
          {([
            ["ALL", language === "en" ? "All Networks" : "Tüm Şebekeler"],
            ["EVALIS", "EVALIS"],
            ["PARTNER", language === "en" ? "Partners" : "Ortaklar"]
          ] as const).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setNetworkFilter(value)}
              className={`px-3.5 py-2 rounded-full border transition cursor-pointer ${
                networkFilter === value
                  ? "border-accent/40 bg-accent/15 text-accent"
                  : "border-white/10 bg-white/5 text-slate-400 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
          <span className="w-px h-4 bg-white/10 mx-1" />
          <button
            onClick={() => setFavoritesOnly((prev) => !prev)}
            className={`px-3.5 py-2 rounded-full border transition cursor-pointer ${
              favoritesOnly
                ? "border-amber-500/40 bg-amber-500/15 text-amber-400"
                : "border-white/10 bg-white/5 text-slate-400 hover:text-white"
            }`}
          >
            {favoritesOnly ? "★" : "☆"} {language === "en" ? "Favorites" : "Favoriler"}
          </button>
        </div>
      </div>

      {/* Station browser: list + map */}
      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-8 items-start">

        {/* Station list */}
        <div className="dash-panel p-5 shadow-lg space-y-3 max-h-[50vh] lg:max-h-[640px] overflow-y-auto pr-2">
          {filteredStations.length === 0 && (
            <p className="text-[10px] text-slate-500 uppercase tracking-widest text-center py-8">
              {language === "en" ? "No stations match your filters" : "Filtrelerinize uyan istasyon yok"}
            </p>
          )}

          {filteredStations.map(({ station, distanceKm, estimate }) => {
            const isSelected = selectedStationId === station.id;
            const isFavorite = favoriteStationIds.includes(station.id);
            const isReserved = reservedStationIds.includes(station.id);
            const isActive = station.status === "active";
            const netAvailable = isReserved ? Math.max(0, station.availablePorts - 1) : station.availablePorts;
            const isChargingHere = stationLiveState?.stationId === station.id;
            const canStart = isActive && netAvailable > 0 && !isHomeActive && (!stationLiveState || isChargingHere);

            return (
              <div
                key={station.id}
                onClick={() => handleSelectStation(station)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleSelectStation(station);
                  }
                }}
                className={`border p-4 rounded-2xl cursor-pointer transition flex flex-col gap-3 text-xs font-light text-slate-400 ${
                  isSelected
                    ? "border-accent bg-accent/5 text-slate-200"
                    : "border-white/5 bg-white/[0.01] hover:border-white/10 hover:text-slate-350"
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <h4 className="font-semibold text-white uppercase tracking-wider text-[11px] truncate">
                        {station.name}
                      </h4>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className={`px-1.5 py-0.2 rounded text-[7px] font-bold uppercase tracking-wider ${
                          station.network === "EVALIS"
                            ? "bg-accent/10 border border-accent/20 text-accent"
                            : "bg-white/5 border border-white/10 text-slate-300"
                        }`}>
                          {station.network}
                        </span>
                        {renderStars(station.rating)}
                        <span className="text-[8px] text-slate-500 font-mono">
                          {station.rating.toFixed(1)} ({station.reviewCount})
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isReserved && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[8px] font-bold uppercase tracking-wider font-mono">
                          {formatCountdown(station.id)}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleToggleFavorite(station);
                        }}
                        title={isFavorite ? (language === "en" ? "Remove favorite" : "Favoriden çıkar") : (language === "en" ? "Add favorite" : "Favorilere ekle")}
                        aria-label={isFavorite ? (language === "en" ? "Remove favorite" : "Favoriden çıkar") : (language === "en" ? "Add favorite" : "Favorilere ekle")}
                        className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs transition cursor-pointer shrink-0 ${
                          isFavorite ? "border-accent/40 bg-accent/15 text-accent" : "border-white/10 bg-white/5 text-slate-500 hover:text-accent"
                        }`}
                      >
                        {isFavorite ? "★" : "☆"}
                      </button>
                      <span className={`w-2 h-2 rounded-full shrink-0 ${isActive ? "bg-accent shadow-[0_0_6px_#2a7a5f]" : "bg-red-500"}`} />
                    </div>
                  </div>

                  <p className="text-[9px] text-slate-500 font-mono flex items-center gap-1.5 flex-wrap">
                    <span>{station.power}</span>
                    <span>•</span>
                    <span className="font-bold px-1.5 py-0.2 rounded bg-white/5 border border-white/10 text-slate-300">
                      {station.type} ({station.connector})
                    </span>
                    <span>•</span>
                    <span>{distanceKm.toFixed(1)} km</span>
                  </p>

                  {station.amenities.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {station.amenities.map((a) => (
                        <span key={a} className="text-[7px] px-1.5 py-0.2 rounded bg-white/[0.03] border border-white/5 text-slate-450 uppercase tracking-wider">
                          {AMENITY_LABELS[a] ? (language === "en" ? AMENITY_LABELS[a].en : AMENITY_LABELS[a].tr) : a}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t border-white/5 pt-2 space-y-1.5">
                  <div className="flex justify-between items-center text-[10px]">
                    <span>{language === "en" ? "Available Ports" : "Kullanılabilir Soket"}</span>
                    <span className={`font-semibold ${netAvailable > 0 ? "text-accent" : "text-red-400"}`}>
                      {netAvailable} / {station.totalPorts}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px]">
                    <span>{language === "en" ? "Price" : "Fiyat"}</span>
                    <span className="text-slate-300 font-mono">{formatPrice(station.pricePerKwhUSD, station.pricePerKwhTRY)}/kWh</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px]">
                    <span>{language === "en" ? "Est. to 100%" : "%100'e Tahmini"}</span>
                    <span className="text-accent font-semibold font-mono">
                      {formatDuration(estimate.minutes, language)} · {formatPrice(estimate.costUSD, estimate.costTRY)}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleReserve(station);
                    }}
                    disabled={!isActive}
                    className="flex-1 py-1.5 rounded-xl border text-[9px] font-bold uppercase tracking-wider transition disabled:opacity-40 disabled:cursor-not-allowed bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                  >
                    {isReserved
                      ? (language === "en" ? "Cancel Hold" : "Rezervi İptal Et")
                      : (language === "en" ? "Reserve Port" : "Soket Rezerve Et")}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      isChargingHere ? handleStopCharging() : handleStartChargingAt(station);
                    }}
                    disabled={!canStart}
                    title={
                      isHomeActive
                        ? (language === "en" ? "Vehicle is charging at home" : "Araç evde şarj oluyor")
                        : stationLiveState && !isChargingHere
                          ? (language === "en" ? "Already charging at another station" : "Zaten başka bir istasyonda şarj oluyor")
                          : ""
                    }
                    className={`flex-[1.4] py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-wider transition disabled:opacity-40 disabled:cursor-not-allowed ${
                      isChargingHere
                        ? "bg-red-500 hover:bg-red-650 text-white"
                        : "bg-white text-black hover:bg-slate-200"
                    }`}
                  >
                    {isChargingHere
                      ? (language === "en" ? "Stop Charging" : "Şarjı Durdur")
                      : (language === "en" ? "Start Charging" : "Şarjı Başlat")}
                  </button>
                </div>

                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${station.latitude},${station.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-[8px] uppercase tracking-widest text-slate-500 hover:text-accent font-bold transition text-center"
                >
                  {language === "en" ? "Get Directions" : "Yol Tarifi Al"}
                </a>
              </div>
            );
          })}
        </div>

        {/* Map */}
        <div className="h-[450px] lg:h-[640px] rounded-[28px] overflow-hidden border border-white/5 shadow-lg relative bg-slate-950 z-0">
          <MapContainer center={mapCenter} zoom={mapZoom} style={{ width: "100%", height: "100%" }} zoomControl={false}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              className="map-tiles-dark"
            />
            <ChangeMapView center={mapCenter} zoom={mapZoom} />

            {filteredStations.map(({ station, estimate }) => {
              const isFavorite = favoriteStationIds.includes(station.id);
              const isReserved = reservedStationIds.includes(station.id);
              const isActive = station.status === "active";
              const netAvailable = isReserved ? Math.max(0, station.availablePorts - 1) : station.availablePorts;
              const isChargingHere = stationLiveState?.stationId === station.id;
              const canStart = isActive && netAvailable > 0 && !isHomeActive && (!stationLiveState || isChargingHere);

              return (
                <Marker
                  key={station.id}
                  position={[station.latitude, station.longitude]}
                  icon={getCustomMarkerIcon(station, isReserved)}
                  eventHandlers={{
                    click: () => {
                      setSelectedStationId(station.id);
                      setMapCenter([station.latitude, station.longitude]);
                    }
                  }}
                >
                  <Popup className="custom-leaflet-popup">
                    <div className="text-xs space-y-2 p-1.5 font-light text-slate-350 min-w-[180px]">
                      <h4 className="font-semibold text-white uppercase tracking-wider border-b border-white/10 pb-1.5">
                        {station.name}
                      </h4>
                      <p>{language === "en" ? "Network" : "Şebeke"}: <span className="font-semibold text-white">{station.network}</span></p>
                      <p>{language === "en" ? "Power" : "Güç"}: <span className="font-semibold text-white">{station.power} ({station.type})</span></p>
                      <p>{language === "en" ? "Available" : "Kullanılabilir"}: <span className="font-semibold text-accent">{netAvailable} / {station.totalPorts}</span></p>
                      <p>{language === "en" ? "Rating" : "Puan"}: <span className="font-semibold text-white">{station.rating.toFixed(1)} ({station.reviewCount})</span></p>
                      <p>{language === "en" ? "Est. to 100%" : "%100'e Tahmini"}: <span className="font-semibold text-accent">{formatDuration(estimate.minutes, language)}</span></p>

                      <div className="flex gap-2 mt-2 pt-1 border-t border-white/5">
                        <button
                          type="button"
                          onClick={() => handleToggleFavorite(station)}
                          className={`flex-1 rounded-xl border py-1.5 text-[8px] font-bold uppercase tracking-wider transition ${
                            isFavorite ? "border-accent/40 bg-accent/15 text-accent" : "border-white/10 bg-white/5 text-slate-200 hover:text-accent"
                          }`}
                        >
                          {isFavorite ? "★" : "☆"}
                        </button>
                        <button
                          type="button"
                          onClick={() => (isChargingHere ? handleStopCharging() : handleStartChargingAt(station))}
                          disabled={!canStart}
                          className={`flex-[2] rounded-xl py-1.5 text-[8px] font-bold uppercase tracking-wider transition disabled:opacity-40 disabled:cursor-not-allowed ${
                            isChargingHere ? "bg-red-500 hover:bg-red-650 text-white" : "bg-white text-black hover:bg-slate-200"
                          }`}
                        >
                          {isChargingHere
                            ? (language === "en" ? "Stop" : "Durdur")
                            : (language === "en" ? "Charge Here" : "Burada Şarj Et")}
                        </button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      </div>

      <style>{`
        .map-tiles-dark {
          filter: invert(100%) hue-rotate(185deg) brightness(85%) contrast(90%);
        }
        .leaflet-popup-content-wrapper {
          background: #0a0f18 !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          border-radius: 12px !important;
          box-shadow: 0 8px 24px rgba(0,0,0,0.5) !important;
        }
        .leaflet-popup-tip {
          background: #0a0f18 !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
        }
        .leaflet-popup-close-button {
          color: #94a3b8 !important;
        }
        .dashboard-light-theme .leaflet-popup-content-wrapper {
          background: #ffffff !important;
          border: 1px solid #e2e8f0 !important;
          box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12) !important;
        }
        .dashboard-light-theme .leaflet-popup-tip {
          background: #ffffff !important;
          border: 1px solid #e2e8f0 !important;
        }
        .dashboard-light-theme .leaflet-popup-close-button {
          color: #64748b !important;
        }
        .dashboard-light-theme .custom-leaflet-popup .text-white {
          color: #0f172a !important;
        }
        .dashboard-light-theme .custom-leaflet-popup .text-slate-350 {
          color: #475569 !important;
        }
        .dashboard-light-theme .custom-leaflet-popup .border-white\\/10,
        .dashboard-light-theme .custom-leaflet-popup .border-white\\/5 {
          border-color: #e2e8f0 !important;
        }
        .dashboard-light-theme .custom-leaflet-popup .bg-white\\/5 {
          background: #f1f5f9 !important;
        }
      `}</style>
    </div>
  );
}
export default ChargingDashboard;
