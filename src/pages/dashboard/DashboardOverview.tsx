import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { readStorage, writeStorage, removeStorage, storageKeys, userStorageKeys } from "@/lib/storage";
import vehiclesData from "@/data/vehicles.json";
import sessionsData from "@/data/sessions.json";
import notificationsData from "@/data/notifications.json";
import stationsData from "@/data/stations.json";
import { Vehicle, ChargingSession, ChargingSchedule, Notification, Station } from "@/types";
import { useToast } from "@/context/ToastContext";
import { vehicleTelemetry, defaultVehicleTelemetry } from "@/data/vehicleTelemetry";
import { VehicleTopView } from "@/components/dashboard/VehicleTopView";
import { LiveChargingState, computeLiveProgress, HOME_STATION_ID } from "@/lib/chargingSession";
import { getNextScheduledCharge, formatNextCharge } from "@/lib/scheduleRunner";

const HOME_TICK_SECONDS = 4;

function getTimeGreeting(hour: number, language: "en" | "tr") {
  if (hour >= 5 && hour < 12) return language === "en" ? "Good Morning" : "Günaydın";
  if (hour >= 12 && hour < 17) return language === "en" ? "Good Afternoon" : "İyi Günler";
  if (hour >= 17 && hour < 21) return language === "en" ? "Good Evening" : "İyi Akşamlar";
  return language === "en" ? "Good Night" : "İyi Geceler";
}

export function DashboardOverview() {
  const { language, formatPrice } = useLanguage();
  const { session } = useAuth();
  const { showToast } = useToast();
  const user = session?.user;

  // Active Vehicle state synced with Sidebar switcher
  const [activeVehicleId, setActiveVehicleId] = useState(() => {
    return readStorage<string>(userStorageKeys.activeVehicleId(user?.id || "guest"), "");
  });
  const [ownedIds, setOwnedIds] = useState<string[]>(() =>
    readStorage<string[]>(userStorageKeys.ownedVehicles(user?.id || "guest"), user?.ownedVehicleIds || [])
  );

  useEffect(() => {
    const handleSync = () => {
      setActiveVehicleId(readStorage<string>(userStorageKeys.activeVehicleId(user?.id || "guest"), ""));
      setOwnedIds(readStorage<string[]>(userStorageKeys.ownedVehicles(user?.id || "guest"), user?.ownedVehicleIds || []));
    };
    window.addEventListener("activeVehicleChanged", handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener("activeVehicleChanged", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, [user?.id]);

  const vehicles = vehiclesData as Vehicle[];
  // Only ever resolve to a vehicle the user actually still owns, even if a
  // stale activeVehicleId is left pointing at one that was released.
  const activeVehicle =
    (ownedIds.includes(activeVehicleId) && vehicles.find((v) => v.id === activeVehicleId)) ||
    vehicles.find((v) => v.id === ownedIds[0]) ||
    vehicles[0];

  const allSchedules = readStorage<ChargingSchedule[]>(userStorageKeys.schedules(user?.id || "guest"), []);
  const nextCharge = getNextScheduledCharge(allSchedules, activeVehicle.id);

  // Charge limit / climate preference bound to the selected vehicle (edited on Settings)
  const [chargeLimit, setChargeLimit] = useState(85);
  const [climateOn, setClimateOn] = useState(false);

  // The one shared "is this vehicle charging" record — this page's Home
  // charging button and the Charging Control page's station charging both
  // read/write it, keyed per vehicle, so the two can never disagree about a
  // vehicle's charging state or double-book it.
  const [liveState, setLiveState] = useState<LiveChargingState | null>(() =>
    readStorage<LiveChargingState | null>(userStorageKeys.liveCharging(user?.id || "guest", activeVehicle.id), null)
  );
  const isHomeActive = liveState?.mode === "home";
  const isStationActive = liveState?.mode === "station";

  const [batteryLevel, setBatteryLevel] = useState(() =>
    liveState ? computeLiveProgress(liveState).percent : (activeVehicle.batteryPercent || 78)
  );

  useEffect(() => {
    const settings = readStorage<any>(
      userStorageKeys.vehicleSettings(user?.id || "guest", activeVehicle.id),
      { batteryLevel: activeVehicle.batteryPercent || 78, chargeLimit: 85, climateOn: false }
    );
    setChargeLimit(settings.chargeLimit);
    setClimateOn(settings.climateOn);

    const currentLiveState = readStorage<LiveChargingState | null>(
      userStorageKeys.liveCharging(user?.id || "guest", activeVehicle.id),
      null
    );
    setLiveState(currentLiveState);
    setBatteryLevel(currentLiveState ? computeLiveProgress(currentLiveState).percent : settings.batteryLevel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeVehicle.id, user?.id]);

  useEffect(() => {
    const handleSync = () => {
      setLiveState(
        readStorage<LiveChargingState | null>(userStorageKeys.liveCharging(user?.id || "guest", activeVehicle.id), null)
      );
    };
    window.addEventListener("activeVehicleChanged", handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener("activeVehicleChanged", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, [activeVehicle.id, user?.id]);

  // Save changes to localStorage on change
  const saveTelemetry = (level: number, limitVal: number, climate: boolean) => {
    writeStorage(userStorageKeys.vehicleSettings(user?.id || "guest", activeVehicle.id), {
      batteryLevel: level,
      chargeLimit: limitVal,
      climateOn: climate
    });
  };

  // Clock state
  const [timeText, setTimeText] = useState("");
  const [greeting, setGreeting] = useState("");
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setTimeText(
        d.toLocaleTimeString(language === "en" ? "en-US" : "tr-TR", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit"
        })
      );
      setGreeting(getTimeGreeting(d.getHours(), language));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [language]);

  const finalizeHomeSession = (percent: number, reason: "completed" | "stopped") => {
    if (!liveState || liveState.mode !== "home") return;
    const sessions = readStorage<ChargingSession[]>(storageKeys.sessions, sessionsData as ChargingSession[]);
    const energyKWh = Math.max(1, Math.round((percent - liveState.startPercent) * 0.9));
    const nextSessions = sessions.map((s) =>
      s.id === liveState.sessionId
        ? { ...s, energyKWh, cost: Math.round(energyKWh * 3.5), status: "completed" as const, endedAt: new Date().toISOString() }
        : s
    );
    writeStorage(storageKeys.sessions, nextSessions);
    window.dispatchEvent(new Event("evalis:sessionsUpdated"));

    if (reason === "completed") {
      const notifications = readStorage<Notification[]>(storageKeys.notifications, notificationsData as Notification[]);
      const newNotif: Notification = {
        id: `notif-${Date.now()}`,
        userId: user?.id || "guest",
        title: language === "en" ? "Charging Complete" : "Şarj Tamamlandı",
        message: language === "en"
          ? `${activeVehicle.name} has finished home charging to ${percent}%.`
          : `${activeVehicle.name} evde şarj edilerek %${percent} seviyesine ulaştı.`,
        read: false,
        createdAt: new Date().toISOString()
      };
      writeStorage(storageKeys.notifications, [newNotif, ...notifications]);
      window.dispatchEvent(new Event("evalis:notificationsUpdated"));
    }

    removeStorage(userStorageKeys.liveCharging(user?.id || "guest", activeVehicle.id));
    saveTelemetry(percent, chargeLimit, climateOn);
    setLiveState(null);
    window.dispatchEvent(new Event("activeVehicleChanged"));
  };

  // Live ticking while a session is active for this vehicle — Home sessions are
  // owned (started/stopped/finalized) here; Station sessions are only ever
  // reflected read-only, since the Charging Control page owns finalizing those.
  useEffect(() => {
    if (!liveState) return;
    const interval = setInterval(() => {
      const { percent, done } = computeLiveProgress(liveState);
      setBatteryLevel(percent);
      if (liveState.mode === "home") {
        saveTelemetry(percent, chargeLimit, climateOn);
        if (done) {
          finalizeHomeSession(percent, "completed");
          showToast(
            language === "en" ? "Charging completed to limit!" : "Şarj limitleme sınırına ulaştı!",
            "success"
          );
        }
      }
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveState]);

  // If a Home session finished its target while the user was away, finalize it now
  useEffect(() => {
    if (liveState?.mode === "home") {
      const { percent, done } = computeLiveProgress(liveState);
      if (done) {
        setBatteryLevel(percent);
        finalizeHomeSession(percent, "completed");
        showToast(
          language === "en" ? "Charging completed while you were away" : "Siz uzaktayken şarj tamamlandı",
          "success"
        );
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveState?.sessionId]);

  const handleStartHomeCharging = () => {
    if (!user) return;
    if (batteryLevel >= chargeLimit) {
      showToast(
        language === "en"
          ? "Battery is already at or above your charge limit"
          : "Batarya zaten hedef şarj sınırında veya üzerinde",
        "info"
      );
      return;
    }
    const sessions = readStorage<ChargingSession[]>(storageKeys.sessions, sessionsData as ChargingSession[]);
    const newSession: ChargingSession = {
      id: `sess-${Date.now().toString().slice(-5)}`,
      userId: user.id,
      vehicleId: activeVehicle.id,
      stationId: HOME_STATION_ID,
      energyKWh: 0,
      cost: 0,
      status: "charging",
      startedAt: new Date().toISOString()
    };
    writeStorage(storageKeys.sessions, [newSession, ...sessions]);
    window.dispatchEvent(new Event("evalis:sessionsUpdated"));

    const nextLiveState: LiveChargingState = {
      sessionId: newSession.id,
      vehicleId: activeVehicle.id,
      mode: "home",
      stationId: HOME_STATION_ID,
      startPercent: batteryLevel,
      targetPercent: chargeLimit,
      startedAt: new Date().toISOString(),
      tickSeconds: HOME_TICK_SECONDS
    };
    writeStorage(userStorageKeys.liveCharging(user.id, activeVehicle.id), nextLiveState);
    setLiveState(nextLiveState);
    window.dispatchEvent(new Event("activeVehicleChanged"));
    showToast(language === "en" ? "Home charging started" : "Ev şarjı başlatıldı", "success");
  };

  const handleStopHomeCharging = () => {
    finalizeHomeSession(batteryLevel, "stopped");
    showToast(language === "en" ? "Home charging stopped" : "Ev şarjı durduruldu", "info");
  };

  // Load notifications, favorites, and schedules
  const sessions = readStorage<ChargingSession[]>(storageKeys.sessions, sessionsData as ChargingSession[]);
  const userSessions = sessions.filter((s) => s.userId === user?.id).slice(0, 3);

  const notifications = readStorage<Notification[]>(storageKeys.notifications, notificationsData as Notification[]);
  const unreadNotifications = notifications.filter((n) => n.userId === user?.id && !n.read).slice(0, 3);

  const stations = readStorage<Station[]>(storageKeys.stations, stationsData as Station[]);
  const favoriteStationIds = readStorage<string[]>(
    userStorageKeys.favoriteStations(user?.id || "guest"),
    []
  );

  const userSchedules = readStorage<any[]>(
    userStorageKeys.schedules(user?.id || "guest"),
    [
      {
        id: "sch-01",
        vehicleId: activeVehicle.id,
        stationId: "sta-01",
        departureTime: "07:30",
        days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
        limit: 80,
        precondition: true,
        active: true
      }
    ]
  );

  const handleToggleSchedule = (schId: string) => {
    const updated = userSchedules.map((s) => (s.id === schId ? { ...s, active: !s.active } : s));
    writeStorage(userStorageKeys.schedules(user?.id || "guest"), updated);
    showToast(
      language === "en" ? "Schedule status updated" : "Plan durumu güncellendi",
      "success"
    );
  };

  const handleToggleFavorite = (stationId: string) => {
    let updated: string[];
    const isFav = favoriteStationIds.includes(stationId);
    if (isFav) {
      updated = favoriteStationIds.filter((id) => id !== stationId);
      showToast(
        language === "en" ? "Removed from favorites" : "Favorilerden çıkarıldı",
        "info"
      );
    } else {
      updated = [...favoriteStationIds, stationId];
      showToast(
        language === "en" ? "Added to favorites" : "Favorilere eklendi",
        "success"
      );
    }
    writeStorage(userStorageKeys.favoriteStations(user?.id || "guest"), updated);
  };

  const favoriteStations = stations.filter((s) => favoriteStationIds.includes(s.id));
  const nearbyStations = [
    ...favoriteStations,
    ...stations.filter((s) => !favoriteStationIds.includes(s.id))
  ].slice(0, 3);

  const licensePlates: Record<string, string> = {
    vector: "34 EV 620",
    cloud: "34 EV 650",
    bullet: "34 EV 200"
  };

  const chassisNumbers: Record<string, string> = {
    vector: "VIN: EV100987VCTR",
    cloud: "VIN: EV100987CLD",
    bullet: "VIN: EV100987BLT"
  };

  // Load custom telemetry metadata if registered
  const customTelemetry = readStorage<any>(userStorageKeys.telemetry(user?.id || "guest", activeVehicle.id), null);
  const plateNo = customTelemetry?.plate || licensePlates[activeVehicle.id] || "34 EV 620";
  const vinNo = customTelemetry?.vin ? `VIN: ${customTelemetry.vin}` : (chassisNumbers[activeVehicle.id] || "VIN: EV100987VCTR");

  const telemetry = vehicleTelemetry[activeVehicle.id] || defaultVehicleTelemetry;

  // A brand-new account owns nothing yet — show an empty state instead of
  // fabricated telemetry for a vehicle they never registered.
  if (ownedIds.length === 0) {
    return (
      <div className="space-y-8 animate-fade-in text-slate-100">
        <div className="dash-panel p-6">
          <span className="text-[9px] uppercase tracking-[0.3em] text-accent font-bold block">
            {language === "en" ? "EVALIS SYSTEM COCKPIT" : "EVALIS SİSTEM KOKPİTİ"}
          </span>
          <h1 className="text-xl font-light uppercase tracking-widest text-slate-100 mt-1">
            {getTimeGreeting(new Date().getHours(), language)}, {user?.name || ""}
          </h1>
        </div>

        <div className="dash-panel p-12 flex flex-col items-center text-center gap-5">
          <div className="w-16 h-16 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 18h.01M8 21h8a2 2 0 002-2V9a2 2 0 00-2-2H8a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="space-y-2 max-w-sm">
            <h2 className="text-lg font-light uppercase tracking-widest text-slate-100">
              {language === "en" ? "No Vehicles Yet" : "Henüz Aracınız Yok"}
            </h2>
            <p className="text-xs text-slate-500 font-light leading-relaxed">
              {language === "en"
                ? "Register your first EVALIS vehicle to unlock charging control, telemetry, and your personal cockpit."
                : "Şarj kontrolü, telemetri ve kişisel kokpitinizin kilidini açmak için ilk EVALIS aracınızı kaydedin."}
            </p>
          </div>
          <Link
            to="/dashboard/vehicles"
            className="rounded-full bg-accent text-black px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-[#348c70] transition duration-300"
          >
            {language === "en" ? "Add a Vehicle" : "Araç Ekle"}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in text-slate-100">
      
      {/* Top Strip Utility Bar (Greeting & Widgets) */}
      <div className="dash-panel p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <span className="text-[9px] uppercase tracking-[0.3em] text-accent font-bold block">
            {language === "en" ? "EVALIS SYSTEM COCKPIT" : "EVALIS SİSTEM KOKPİTİ"}
          </span>
          <h1 className="text-xl font-light uppercase tracking-widest text-slate-100 mt-1">
            {greeting || getTimeGreeting(new Date().getHours(), language)}, {user?.name || "Ahmet"}
          </h1>
        </div>

        {/* Widgets Strip */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-light">
          {/* Find Charging Station */}
          <Link
            to="/dashboard/charging"
            className="dash-pill px-5 py-2.5 hover:text-white text-[10px] font-bold uppercase tracking-wider transition border border-accent/20 text-accent hover:bg-accent/5 flex items-center gap-2"
          >
            <span>🔍</span>
            {language === "en" ? "Find Charging Station" : "Şarj Noktası Bul"}
          </Link>

          {/* Weather Widget */}
          <div className="dash-inset px-4 py-2 rounded-xl flex items-center gap-3">
            <span className="text-lg" aria-hidden="true">☀️</span>
            <div>
              <p className="font-semibold text-slate-200">{language === "en" ? "Istanbul" : "İstanbul"} · 24°C</p>
              <p className="text-[9px] text-slate-500 font-mono mt-0.5">
                {language === "en" ? "Sunny" : "Güneşli"}
              </p>
            </div>
          </div>

          {/* Date / Time Widget */}
          <div className="dash-inset px-4 py-2 rounded-xl flex items-center gap-2 font-mono text-accent">
            <span>🕒</span>
            <span className="font-semibold">{timeText || "12:00:00"}</span>
          </div>
        </div>
      </div>

      {/* Main Redesigned Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Span: Vehicle Cockpit */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* First Row: My Vehicle Card */}
          <div className="dash-panel p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden">
            {/* GPS crosshair reticle overlay */}
            <div className="absolute inset-0 border border-white/[0.01] pointer-events-none z-0">
              <div className="absolute top-1/2 left-0 right-0 h-px bg-white/[0.015]" />
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/[0.015]" />
            </div>

            {/* Left side: Vehicle outline, VIN, Plate */}
            <div className="space-y-4 z-10 w-full md:w-1/2 flex flex-col justify-center">
              <span className="text-[9px] uppercase tracking-[0.25em] text-accent font-bold">
                {language === "en" ? "MY VEHICLE" : "ARACIM"}
              </span>
              
              <div className="w-full h-44 rounded-2xl overflow-hidden bg-black/20 border border-white/5 flex items-center justify-center p-3">
                <VehicleTopView vehicleId={activeVehicle.id} isCharging={!!liveState} className="h-full" />
              </div>

              <div className="space-y-0.5 text-xs text-slate-400">
                <p className="font-semibold text-slate-200 uppercase tracking-wider">{activeVehicle.name}</p>
                <p className="text-[9px] text-slate-500 font-mono">{vinNo}</p>
                <p className="text-[9px] text-slate-500 font-mono">{language === "en" ? "Plate:" : "Plaka:"} {plateNo}</p>
              </div>
            </div>

            {/* Right side: Charge Button & Battery metrics & progress bar */}
            <div className="w-full md:w-1/2 space-y-5 z-10">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block">
                {language === "en" ? "CHARGE TELEMETRY" : "ŞARJ TELEMETRİSİ"}
              </span>

              {/* Home / Station charging actions */}
              {isStationActive ? (
                <div className="w-full py-4 rounded-full border border-accent bg-accent/10 text-accent text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 animate-pulse">
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  {language === "en" ? "Charging at" : "Şarj ediliyor:"}{" "}
                  {stations.find((s) => s.id === liveState?.stationId)?.name || (language === "en" ? "Station" : "İstasyon")}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={isHomeActive ? handleStopHomeCharging : handleStartHomeCharging}
                    className={`py-4 rounded-full border text-sm font-bold uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-2 ${
                      isHomeActive
                        ? "bg-accent/20 border-accent text-accent animate-pulse"
                        : "bg-white text-black border-transparent hover:bg-slate-200"
                    }`}
                  >
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    {isHomeActive
                      ? (language === "en" ? "Charging" : "Şarj Oluyor")
                      : (language === "en" ? "Charge at Home" : "Evde Şarj Et")}
                  </button>
                  <Link
                    to="/dashboard/charging"
                    className="py-4 rounded-full border border-white/10 text-slate-300 text-sm font-bold uppercase tracking-wider transition hover:border-accent/40 hover:text-white flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {language === "en" ? "Charge at Station" : "İstasyonda Şarj Et"}
                  </Link>
                </div>
              )}
              {isStationActive && (
                <Link
                  to="/dashboard/charging"
                  className="block text-center text-[10px] text-slate-500 hover:text-accent uppercase tracking-widest font-semibold transition"
                >
                  {language === "en" ? "Manage on Charging Control" : "Şarj Kontrolü'nden Yönet"}
                </Link>
              )}

              {/* Progress info labels */}
              <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                <div>
                  <span className="text-[8px] text-slate-500 uppercase tracking-widest block font-bold">{language === "en" ? "Battery %" : "Batarya %"}</span>
                  <span className="text-xl font-bold text-slate-200 mt-0.5 block">{batteryLevel}%</span>
                </div>
                <div>
                  <span className="text-[8px] text-slate-500 uppercase tracking-widest block font-bold">{language === "en" ? "Range km" : "Menzil km"}</span>
                  <span className="text-xl font-bold text-slate-200 mt-0.5 block">
                    {Math.round(batteryLevel * telemetry.rangeFactor)} km
                  </span>
                </div>
              </div>

              {/* Battery level progress bar */}
              <div className="space-y-1">
                <div className="w-full bg-white/5 rounded-full h-3 p-0.5 border border-white/10 dash-inset">
                  <div
                    style={{ width: `${batteryLevel}%` }}
                    className="bg-accent h-full rounded-full transition-all duration-700 ease-out shadow-[0_0_8px_#2a7a5f]"
                  />
                </div>
                <div className="flex justify-between text-[8px] text-slate-600 font-bold uppercase tracking-wider">
                  <span>0%</span>
                  <span>Limit: {chargeLimit}%</span>
                  <span>100%</span>
                </div>
              </div>

              {!liveState && nextCharge && (
                <p className="text-[9px] text-slate-500 font-mono">
                  {language === "en" ? "Next scheduled charge" : "Sonraki planlı şarj"}: {formatNextCharge(nextCharge, language)}
                </p>
              )}
            </div>
          </div>

          {/* Second Row: Telemetry Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Left Card: Lastik Basıncı (Tire Pressure Coordinates Crosshair) */}
            <div className="dash-panel p-6 space-y-4">
              <h3 className="text-[9px] uppercase tracking-[0.25em] text-slate-500 font-bold">
                {language === "en" ? "Tire Pressure" : "Lastik Basıncı"}
              </h3>

              {/* Coordinates HUD reticle */}
              <div className="relative w-full h-44 border border-slate-200 dark:border-white/[0.02] bg-slate-100/70 dark:bg-black/15 rounded-2xl flex items-center justify-center">
                {/* Horizontal line */}
                <div className="absolute top-1/2 left-4 right-4 h-px bg-slate-300/70 dark:bg-white/10" />
                {/* Vertical line */}
                <div className="absolute left-1/2 top-4 bottom-4 w-px bg-slate-300/70 dark:bg-white/10" />

                {activeVehicle.id === "bullet" ? (
                  <>
                    {/* Motorcycles have two wheels: front and rear */}
                    <div className="absolute top-6 left-1/2 -translate-x-1/2 text-center">
                      <span className="text-[8px] text-slate-500 block uppercase font-bold">{language === "en" ? "Front" : "Ön"}</span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono">{telemetry.tireFL} bar</span>
                    </div>
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center">
                      <span className="text-[8px] text-slate-500 block uppercase font-bold">{language === "en" ? "Rear" : "Arka"}</span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono">{telemetry.tireRL} bar</span>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Pressure indicators at four corners */}
                    <div className="absolute top-6 left-6 text-center">
                      <span className="text-[8px] text-slate-500 block uppercase font-bold">FL</span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono">{telemetry.tireFL} bar</span>
                    </div>
                    <div className="absolute top-6 right-6 text-center">
                      <span className="text-[8px] text-slate-500 block uppercase font-bold">FR</span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono">{telemetry.tireFR} bar</span>
                    </div>
                    <div className="absolute bottom-6 left-6 text-center">
                      <span className="text-[8px] text-slate-500 block uppercase font-bold">RL</span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono">{telemetry.tireRL} bar</span>
                    </div>
                    <div className="absolute bottom-6 right-6 text-center">
                      <span className="text-[8px] text-slate-500 block uppercase font-bold">RR</span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono">{telemetry.tireRR} bar</span>
                    </div>
                  </>
                )}

                {/* Status indicator center badge */}
                <div className="absolute bg-white dark:bg-[#0a0f18]/90 border border-emerald-500/30 px-3 py-1 rounded-lg text-[9px] font-bold text-emerald-500 dark:text-emerald-400 uppercase tracking-widest font-sans z-10 shadow-lg">
                  {language === "en" ? "OK" : "NORMAL"}
                </div>
              </div>
            </div>

            {/* Right Card: Akü Seviyesi % (12V Battery Health) */}
            <div className="dash-panel p-6 space-y-6 flex flex-col justify-between">
              <div>
                <h3 className="text-[9px] uppercase tracking-[0.25em] text-slate-500 font-bold">
                  {language === "en" ? "12V Battery Level" : "Akü Seviyesi %"}
                </h3>
                <span className="text-[8px] text-slate-650 block mt-0.5 uppercase tracking-wider font-semibold">
                  {language === "en" ? "Auxiliary power supply" : "Yardımcı güç kaynağı"}
                </span>
              </div>
              
              <div className="flex flex-col items-center justify-center py-4 relative">
                <div className="dash-inset w-28 h-28 rounded-full flex items-center justify-center">
                  <div className="text-center">
                    <span className="text-3xl font-light text-slate-100 font-mono block">{telemetry.battery12v}%</span>
                    <span className="text-[8px] text-accent font-bold uppercase tracking-widest mt-1 block">
                      {language === "en" ? "HEALTH" : "SAĞLIK"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-[9px] text-slate-500 font-light leading-relaxed">
                {language === "en" 
                  ? "Standard auxiliary lead-acid cell health is optimal. Operating voltage stable at 14.1V." 
                  : "Standart yardımcı kurşun-asit hücresi sağlığı optimaldir. Çalışma voltajı 14.1V'ta sabit."}
              </div>
            </div>
          </div>

          {/* Third Row: Trip Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Left Card: Yolculuk verileri / Ortalama tüketim */}
            <div className="dash-card p-6 space-y-4">
              <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold">
                {language === "en" ? "Trip Data / Avg Consumption" : "Yolculuk Verileri / Ortalama Tüketim"}
              </span>
              <div className="pt-2">
                <span className="text-3xl font-light text-slate-100 font-mono block">{telemetry.avgConsumption} kWh</span>
                <span className="text-[9px] text-slate-500 uppercase tracking-widest mt-1.5 block">
                  {language === "en" ? "Per 100 kilometers" : "100 kilometre başına"}
                </span>
              </div>
            </div>

            {/* Right Card: Toplam mesafe */}
            <div className="dash-card p-6 space-y-4">
              <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold">
                {language === "en" ? "Total Distance" : "Toplam Mesafe"}
              </span>
              <div className="pt-2">
                <span className="text-3xl font-light text-slate-100 font-mono block">{telemetry.odometer.toLocaleString()} km</span>
                <span className="text-[9px] text-slate-500 uppercase tracking-widest mt-1.5 block">
                  {language === "en" ? "Odometer reading" : "Kilometre sayacı değeri"}
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Chart & Stations */}
        <div className="space-y-8">
          
          {/* Charge History (Wave Line Chart) */}
          <div className="dash-panel p-6 shadow-md space-y-6">
            <div className="flex justify-between items-center">
              <h4 className="text-[9px] uppercase tracking-[0.25em] text-slate-500 font-bold block">
                {language === "en" ? "CHARGE HISTORY" : "ŞARJ GEÇMİŞİ"}
              </h4>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8px] font-bold font-mono">
                24H
              </span>
            </div>

            {/* Smooth wave line chart in Inset well */}
            <div className="dash-inset p-4 rounded-2xl">
              <div className="flex gap-2">
                {/* Y-axis: battery percentage labels */}
                <div className="relative h-32 w-7 shrink-0 text-[8px] font-mono text-slate-500">
                  <span className="absolute left-0" style={{ top: "20%", transform: "translateY(-50%)" }}>80%</span>
                  <span className="absolute left-0" style={{ top: "50%", transform: "translateY(-50%)" }}>50%</span>
                  <span className="absolute left-0" style={{ top: "80%", transform: "translateY(-50%)" }}>20%</span>
                </div>

                <svg className="w-full h-32" viewBox="0 0 200 100" preserveAspectRatio="none">
                  {/* Horizontal lines */}
                  <line x1="0" y1="20" x2="200" y2="20" stroke="rgba(255, 255, 255, 0.03)" strokeWidth="1" />
                  <line x1="0" y1="50" x2="200" y2="50" stroke="rgba(255, 255, 255, 0.03)" strokeWidth="1" />
                  <line x1="0" y1="80" x2="200" y2="80" stroke="rgba(255, 255, 255, 0.03)" strokeWidth="1" />

                  {/* Smooth sine wave curve path */}
                  <path
                    d={telemetry.chargeHistoryPath}
                    fill="none"
                    stroke="var(--color-accent, #2a7a5f)"
                    strokeWidth="2.5"
                  />

                  {/* Smooth wave area fill */}
                  <path
                    d={`${telemetry.chargeHistoryPath} L 200,100 L 0,100 Z`}
                    fill="url(#wave-gradient)"
                    opacity="0.12"
                  />

                  <defs>
                    <linearGradient id="wave-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="var(--color-accent, #2a7a5f)" />
                      <stop offset="100%" stopColor="transparent" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>

              {/* X-axis: hour labels */}
              <div className="flex justify-between text-[8px] font-mono text-slate-500 mt-2 pl-9">
                <span>-24h</span>
                <span>-18h</span>
                <span>-12h</span>
                <span>-6h</span>
                <span>{language === "en" ? "Now" : "Şimdi"}</span>
              </div>
            </div>
          </div>

          {/* Scheduled Charging Summary */}
          <div className="dash-panel p-6 shadow-md space-y-4">
            <h4 className="text-[9px] uppercase tracking-[0.25em] text-slate-500 font-bold block">
              {language === "en" ? "SCHEDULED CHARGING" : "PROGRAMLI ŞARJ"}
            </h4>

            {userSchedules.length === 0 ? (
              <p className="text-[9px] text-slate-500 uppercase tracking-widest text-center py-4">
                {language === "en" ? "No schedules configured" : "Program ayarlı değil"}
              </p>
            ) : (
              <div className="space-y-3">
                {userSchedules.slice(0, 2).map((schedule) => {
                  const scheduleVehicle = vehicles.find((v) => v.id === schedule.vehicleId);
                  return (
                    <div
                      key={schedule.id}
                      className="dash-pill flex items-center justify-between gap-3 px-4 py-3 text-xs"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-200 font-mono">{schedule.departureTime}</p>
                        <p className="text-[8px] text-slate-500 font-mono mt-0.5 truncate">
                          {scheduleVehicle?.name || schedule.vehicleId} · {language === "en" ? "Limit" : "Limit"} {schedule.limit}%
                        </p>
                      </div>
                      <button
                        onClick={() => handleToggleSchedule(schedule.id)}
                        className={`w-9 h-5 rounded-full p-0.5 transition duration-200 cursor-pointer shrink-0 ${
                          schedule.active ? "bg-accent" : "bg-white/10"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full bg-[#0b0f19] transform transition duration-200 ${
                            schedule.active ? "translate-x-4" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex justify-end pt-1">
              <Link
                to="/dashboard/schedules"
                className="text-[9px] uppercase tracking-widest text-slate-500 hover:text-accent font-bold transition"
              >
                {language === "en" ? "manage schedules" : "programları yönet"}
              </Link>
            </div>
          </div>

          {/* Nearby Stations */}
          <div className="dash-panel p-6 shadow-md space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h4 className="text-[9px] uppercase tracking-[0.25em] text-slate-500 font-bold block">
                {language === "en" ? "NEARBY STATIONS" : "YAKIN İSTASYONLAR"}
              </h4>
            </div>

            <div className="space-y-3">
              {nearbyStations.map((station, index) => {
                const isFavorite = favoriteStationIds.includes(station.id);
                const distance = `${(3.4 + index * 1.1).toFixed(1)} km`;
                const charCode = String.fromCharCode(65 + index); // A, B, C

                return (
                  <div
                    key={station.id}
                    className="dash-pill flex items-center justify-between gap-3 px-4 py-3 text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Character avatar index box */}
                      <div className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-mono text-[10px] font-bold text-slate-350 shrink-0">
                        {charCode}
                      </div>
                      <div className="min-w-0">
                        <Link
                          to="/dashboard/charging"
                          className="font-semibold text-slate-200 uppercase tracking-wider truncate block hover:text-accent"
                        >
                          {station.name.replace("EVALIS ", "")}
                        </Link>
                        <span className="text-[8px] text-slate-500 font-mono block mt-0.5">
                          {distance} · {station.power}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {/* Star Button */}
                      <button
                        onClick={() => handleToggleFavorite(station.id)}
                        className={`text-sm cursor-pointer transition ${isFavorite ? "text-amber-400 hover:text-slate-400" : "text-slate-500 hover:text-amber-400"}`}
                        title={isFavorite ? (language === "en" ? "Remove Favorite" : "Favoriden Çıkar") : (language === "en" ? "Add Favorite" : "Favoriye Ekle")}
                        aria-label={isFavorite ? (language === "en" ? "Remove Favorite" : "Favoriden Çıkar") : (language === "en" ? "Add Favorite" : "Favoriye Ekle")}
                      >
                        {isFavorite ? "★" : "☆"}
                      </button>
                      <Link to="/dashboard/charging" className="text-slate-500 hover:text-white transition">
                        →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-1">
              <Link
                to="/dashboard/charging"
                className="text-[9px] uppercase tracking-widest text-slate-500 hover:text-accent font-bold transition"
              >
                {language === "en" ? "see more" : "daha fazla gör"}
              </Link>
            </div>
          </div>

          {/* System Alerts */}
          <div className="dash-panel p-6 shadow-md space-y-4">
            <h4 className="text-[9px] uppercase tracking-[0.25em] text-slate-500 font-bold block">
              {language === "en" ? "SYSTEM ALERTS" : "SİSTEM UYARILARI"}
            </h4>

            {unreadNotifications.length === 0 ? (
              <p className="text-[9px] text-slate-500 uppercase tracking-widest text-center py-4">
                {language === "en" ? "No active alerts" : "Aktif uyarı bulunmuyor"}
              </p>
            ) : (
              <div className="space-y-2.5">
                {unreadNotifications.map((notif) => (
                  <div
                    key={notif.id}
                    className="dash-inset rounded-xl p-3 space-y-1 text-xs"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-slate-200">{notif.title}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                    </div>
                    <p className="text-[9px] text-slate-450 leading-relaxed font-light">{notif.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
      
    </div>
  );
}
export default DashboardOverview;
