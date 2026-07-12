import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { readStorage, writeStorage, storageKeys, userStorageKeys } from "@/lib/storage";
import vehiclesData from "@/data/vehicles.json";
import sessionsData from "@/data/sessions.json";
import notificationsData from "@/data/notifications.json";
import stationsData from "@/data/stations.json";
import { Vehicle, ChargingSession, Notification, Station } from "@/types";
import { useToast } from "@/context/ToastContext";
import { vehicleTelemetry, defaultVehicleTelemetry } from "@/data/vehicleTelemetry";
import { VehicleTopView } from "@/components/dashboard/VehicleTopView";

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
    return readStorage<string>(userStorageKeys.activeVehicleId(user?.id || "guest"), "vector");
  });
  const [ownedIds, setOwnedIds] = useState<string[]>(() =>
    readStorage<string[]>(userStorageKeys.ownedVehicles(user?.id || "guest"), user?.ownedVehicleIds || ["vector"])
  );

  useEffect(() => {
    const handleSync = () => {
      setActiveVehicleId(readStorage<string>(userStorageKeys.activeVehicleId(user?.id || "guest"), "vector"));
      setOwnedIds(readStorage<string[]>(userStorageKeys.ownedVehicles(user?.id || "guest"), user?.ownedVehicleIds || ["vector"]));
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

  // Telemetry states bound to selected vehicle
  const [batteryLevel, setBatteryLevel] = useState(78);
  const [chargeLimit, setChargeLimit] = useState(85);
  const [climateOn, setClimateOn] = useState(false);
  const [isCharging, setIsCharging] = useState(false);

  useEffect(() => {
    const settings = readStorage<any>(
      userStorageKeys.vehicleSettings(user?.id || "guest", activeVehicle.id),
      { batteryLevel: activeVehicle.batteryPercent || 78, chargeLimit: 85, climateOn: false }
    );
    setBatteryLevel(settings.batteryLevel);
    setChargeLimit(settings.chargeLimit);
    setClimateOn(settings.climateOn);
    setIsCharging(false); // Reset charging state on vehicle switch
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

  // Simulated charging tick
  useEffect(() => {
    let interval: any;
    if (isCharging) {
      interval = setInterval(() => {
        setBatteryLevel((prev) => {
          if (prev >= chargeLimit) {
            setIsCharging(false);
            showToast(
              language === "en"
                ? "Charging completed to limit!"
                : "Şarj limitleme sınırına ulaştı!",
              "success"
            );
            
            // Add a new completed session to history
            const sessions = readStorage<ChargingSession[]>(storageKeys.sessions, sessionsData as ChargingSession[]);
            const newSession: ChargingSession = {
              id: `sess-${Date.now().toString().slice(-5)}`,
              userId: user?.id || "guest",
              vehicleId: activeVehicle.id,
              stationId: "sta-01",
              energyKWh: Math.round((chargeLimit - prev) * 0.9),
              cost: Math.round((chargeLimit - prev) * 0.9 * 3.5),
              status: "completed",
              startedAt: new Date(Date.now() - 3600000).toISOString(),
              endedAt: new Date().toISOString()
            };
            writeStorage(storageKeys.sessions, [newSession, ...sessions]);
            window.dispatchEvent(new Event("evalis:sessionsUpdated"));

            // Add notification
            const notifications = readStorage<Notification[]>(storageKeys.notifications, notificationsData as Notification[]);
            const newNotif: Notification = {
              id: `notif-${Date.now()}`,
              userId: user?.id || "guest",
              title: language === "en" ? "Charging Complete" : "Şarj Tamamlandı",
              message: language === "en" 
                ? `${activeVehicle.name} has finished charging to ${chargeLimit}%.` 
                : `${activeVehicle.name} bataryası %${chargeLimit} seviyesine şarj edildi.`,
              read: false,
              createdAt: new Date().toISOString()
            };
            writeStorage(storageKeys.notifications, [newNotif, ...notifications]);
            window.dispatchEvent(new Event("evalis:notificationsUpdated"));

            saveTelemetry(chargeLimit, chargeLimit, climateOn);
            return chargeLimit;
          }
          const next = prev + 1;
          saveTelemetry(next, chargeLimit, climateOn);
          return next;
        });
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [isCharging, chargeLimit, language, activeVehicle.name, activeVehicle.id, user?.id, showToast, climateOn]);

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
            to="/dashboard/stations"
            className="dash-pill px-5 py-2.5 hover:text-white text-[10px] font-bold uppercase tracking-wider transition border border-accent/20 text-accent hover:bg-accent/5 flex items-center gap-2"
          >
            <span>🔍</span>
            {language === "en" ? "Find Charging Station" : "Şarj Noktası Bul"}
          </Link>

          {/* Weather Widget */}
          <div className="dash-inset px-4 py-2 rounded-xl flex items-center gap-3">
            <span className="text-lg" aria-hidden="true">☀️</span>
            <div>
              <p className="font-semibold text-slate-200">Istanbul · 24°C</p>
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
                <VehicleTopView vehicleId={activeVehicle.id} isCharging={isCharging} className="h-full" />
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

              {/* Şarj Et Button */}
              <button
                onClick={() => setIsCharging(!isCharging)}
                className={`w-full py-4 rounded-full border text-sm font-bold uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-2 ${
                  isCharging
                    ? "bg-accent/20 border-accent text-accent animate-pulse"
                    : "bg-white text-black border-transparent hover:bg-slate-200"
                }`}
              >
                <span className="text-lg" aria-hidden="true">⚡</span>
                {isCharging ? (language === "en" ? "Charging" : "Şarj Oluyor") : (language === "en" ? "Start Charging" : "Şarj Et")}
              </button>

              {/* Progress info labels */}
              <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                <div>
                  <span className="text-[8px] text-slate-500 uppercase tracking-widest block font-bold">Batarya %</span>
                  <span className="text-xl font-bold text-slate-200 mt-0.5 block">{batteryLevel}%</span>
                </div>
                <div>
                  <span className="text-[8px] text-slate-500 uppercase tracking-widest block font-bold">Menzil km</span>
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
                          to="/dashboard/stations"
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
                        title={isFavorite ? "Remove Favorite" : "Add Favorite"}
                        aria-label={isFavorite ? "Remove Favorite" : "Add Favorite"}
                      >
                        {isFavorite ? "★" : "☆"}
                      </button>
                      <Link to="/dashboard/stations" className="text-slate-500 hover:text-white transition">
                        →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-1">
              <Link
                to="/dashboard/stations"
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
