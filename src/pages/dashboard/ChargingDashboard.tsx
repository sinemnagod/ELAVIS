import { useState, useEffect, useRef } from "react";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { readStorage, writeStorage, removeStorage, storageKeys, userStorageKeys } from "@/lib/storage";
import sessionsData from "@/data/sessions.json";
import notificationsData from "@/data/notifications.json";
import vehiclesData from "@/data/vehicles.json";
import stationsData from "@/data/stations.json";
import { ChargingSession, Notification, Station, Vehicle } from "@/types";

interface LiveChargingState {
  sessionId: string;
  stationId: string;
  startPercent: number;
  targetPercent: number;
  startedAt: string;
}

export function ChargingDashboard() {
  const { showToast } = useToast();
  const { session } = useAuth();
  const { language } = useLanguage();
  const user = session?.user;
  const userId = user?.id || "guest";

  const vehicles = vehiclesData as Vehicle[];
  const stations = readStorage<Station[]>(storageKeys.stations, stationsData as Station[]);
  const activeVehicle = vehicles.find((vehicle) => user?.ownedVehicleIds.includes(vehicle.id)) || vehicles[0];
  const availableStations = stations.filter((station) => station.status === "active");
  const defaultStation =
    availableStations.find((station) => station.availablePorts > 0) || stations[0];

  // Resume an in-progress session left running when the user last navigated away
  const [liveState] = useState<LiveChargingState | null>(() =>
    readStorage<LiveChargingState | null>(userStorageKeys.liveCharging(userId), null)
  );
  const resumedProgress = (() => {
    if (!liveState) return null;
    const elapsedSeconds = (Date.now() - new Date(liveState.startedAt).getTime()) / 1000;
    const elapsedTicks = Math.floor(elapsedSeconds / 3);
    const percent = Math.min(liveState.targetPercent, liveState.startPercent + elapsedTicks);
    return { percent, done: percent >= liveState.targetPercent };
  })();

  const [selectedStationId, setSelectedStationId] = useState(
    liveState?.stationId || defaultStation?.id
  );
  const activeStation = stations.find((station) => station.id === selectedStationId) || defaultStation;

  const storedBatteryLevel = readStorage<any>(
    userStorageKeys.vehicleSettings(userId, activeVehicle.id),
    { batteryLevel: activeVehicle.batteryPercent || 78 }
  ).batteryLevel ?? (activeVehicle.batteryPercent || 78);

  const [isCharging, setIsCharging] = useState(() => !!liveState && !resumedProgress?.done);
  const [chargePercent, setChargePercent] = useState<number>(() =>
    resumedProgress ? resumedProgress.percent : Number(storedBatteryLevel)
  );
  const [powerKw, setPowerKw] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(liveState?.sessionId || null);
  const chargeStartPercentRef = useRef(liveState?.startPercent ?? chargePercent);

  const writeCompletionNotification = (percent: number) => {
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
        ? `${activeVehicle.name} reached ${percent}% charge at ${activeStation.name}.`
        : `${activeVehicle.name}, ${activeStation.name} noktasında %${percent} şarj seviyesine ulaştı.`,
      read: false,
      createdAt: new Date().toISOString()
    };
    writeStorage(storageKeys.notifications, [nextNotification, ...storedNotifications]);
    window.dispatchEvent(new Event("evalis:notificationsUpdated"));
  };

  const completeStoredSession = (percent: number, reason: "completed" | "stopped") => {
    if (!activeSessionId) return;
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
            cost: Number((energyKWh * 3.5).toFixed(2)),
            status: "completed" as const,
            endedAt: new Date().toISOString()
          }
        : storedSession
    );
    writeStorage(storageKeys.sessions, nextSessions);
    window.dispatchEvent(new Event("evalis:sessionsUpdated"));
    if (reason === "completed") {
      writeCompletionNotification(percent);
    }
    removeStorage(userStorageKeys.liveCharging(userId));
    setActiveSessionId(null);
  };

  useEffect(() => {
    let interval: any;
    if (isCharging) {
      setPowerKw(activeStation.type === "DC" ? 150 : 22); // kW charging rate
      interval = setInterval(() => {
        setChargePercent((prev) => {
          if (prev >= 80) {
            setIsCharging(false);
            completeStoredSession(80, "completed");
            showToast(
              language === "en" 
                ? "Charging complete to 80% target limit" 
                : "Şarj %80 hedef sınırına başarıyla ulaştı", 
              "success"
            );
            return 80;
          }
          const next = prev + 1;
          setTimeRemaining((80 - next) * (activeStation.type === "DC" ? 1 : 4)); // DC is faster
          return next;
        });
      }, 3000);
    } else {
      setPowerKw(0);
      setTimeRemaining(0);
    }
    return () => clearInterval(interval);
  }, [activeSessionId, isCharging, showToast, language, activeStation.type]);

  // If a charging session finished its target while the user was away, finalize it now
  useEffect(() => {
    if (liveState && resumedProgress?.done) {
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

  const createStoredSession = () => {
    if (!user) return null;
    const storedSessions = readStorage<ChargingSession[]>(
      storageKeys.sessions,
      sessionsData as ChargingSession[]
    );
    const nextSession: ChargingSession = {
      id: "sess-" + Date.now().toString().slice(-6),
      userId: user.id,
      vehicleId: activeVehicle.id,
      stationId: activeStation.id,
      energyKWh: 0,
      cost: 0,
      status: "charging",
      startedAt: new Date().toISOString()
    };
    writeStorage(storageKeys.sessions, [nextSession, ...storedSessions]);
    window.dispatchEvent(new Event("evalis:sessionsUpdated"));
    return nextSession.id;
  };

  const handleToggleCharging = () => {
    setIsCharging((prev) => {
      const next = !prev;
      if (next) {
        if (chargePercent >= 80) {
          showToast(
            language === "en"
              ? "Battery is already at or above your charge limit"
              : "Batarya zaten hedef şarj sınırında veya üzerinde",
            "info"
          );
          return false;
        }
        const storedSessionId = createStoredSession();
        setActiveSessionId(storedSessionId);
        chargeStartPercentRef.current = chargePercent;
        if (storedSessionId) {
          writeStorage<LiveChargingState>(userStorageKeys.liveCharging(userId), {
            sessionId: storedSessionId,
            stationId: activeStation.id,
            startPercent: chargePercent,
            targetPercent: 80,
            startedAt: new Date().toISOString()
          });
        }
        showToast(
          language === "en" ? "Charging session initiated" : "Şarj işlemi başlatıldı",
          "success"
        );
      } else {
        completeStoredSession(chargePercent, "stopped");
        showToast(
          language === "en" ? "Charging session stopped" : "Şarj işlemi durduruldu",
          "info"
        );
      }
      return next;
    });
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      
      {/* Header Segment */}
      <div className="dash-panel p-6">
        <h1 className="text-xl font-light uppercase tracking-widest text-slate-100">
          {language === "en" ? "Live Charging Control" : "Canlı Şarj Kontrolü"}
        </h1>
        <p className="text-[9px] text-slate-500 font-light tracking-wide mt-1">
          {language === "en"
            ? "Monitor your active power intake rate, speed metrics, and charge complete predictions."
            : "Aktif güç alım oranınızı, şarj hızı ölçümlerini ve tamamlanma tahminlerini izleyin."}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Real-time charging progress ring and controller */}
        <div className="md:col-span-2 dash-panel p-6 flex flex-col justify-between items-center text-center space-y-6">
          <div className="w-full flex justify-between items-center text-xs gap-3">
            <select
              value={activeStation.id}
              onChange={(e) => setSelectedStationId(e.target.value)}
              disabled={isCharging}
              title={isCharging ? (language === "en" ? "Stop charging to switch stations" : "İstasyon değiştirmek için şarjı durdurun") : ""}
              className="uppercase text-slate-400 font-mono tracking-wider text-[10px] bg-transparent border border-white/10 rounded-lg px-2 py-1.5 outline-none focus:border-accent/40 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {availableStations.map((station) => (
                <option key={station.id} value={station.id} className="bg-[#0a0f18] text-slate-200 normal-case">
                  {station.name} ({station.type} - {station.connector})
                </option>
              ))}
            </select>
            <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-bold tracking-widest uppercase shrink-0 ${
              isCharging ? "bg-accent/15 border border-accent/25 text-accent animate-pulse" : "bg-white/5 border border-white/10 text-slate-400"
            }`}>
              {isCharging
                ? (language === "en" ? "Charging" : "Şarj Oluyor")
                : (language === "en" ? "Idle" : "Hazır")}
            </span>
          </div>

          {/* Battery level ring */}
          <div className="relative flex items-center justify-center w-60 h-60 dash-inset rounded-full p-6">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 240 240">
              <circle
                cx="120"
                cy="120"
                r="95"
                fill="transparent"
                stroke="rgba(0, 0, 0, 0.2)"
                strokeWidth="8"
              />
              <circle
                cx="120"
                cy="120"
                r="95"
                fill="transparent"
                stroke="var(--color-accent, #2a7a5f)"
                strokeWidth="8"
                strokeDasharray={2 * Math.PI * 95}
                strokeDashoffset={2 * Math.PI * 95 * (1 - chargePercent / 100)}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-4xl font-extralight tracking-tight text-white">{chargePercent}%</span>
              <span className="text-[8px] text-slate-500 uppercase tracking-widest mt-1 font-bold">
                {language === "en" ? "Current Charge" : "Mevcut Şarj"}
              </span>
            </div>
          </div>

          {/* Controller button */}
          <button
            onClick={handleToggleCharging}
            className={`w-full max-w-sm py-3.5 rounded-full text-xs font-bold uppercase tracking-widest transition cursor-pointer ${
              isCharging 
                ? "bg-red-500 hover:bg-red-650 text-white" 
                : "bg-white text-black hover:bg-slate-200"
            }`}
          >
            {isCharging 
              ? (language === "en" ? "Stop Charging" : "Şarjı Durdur") 
              : (language === "en" ? "Start Charging" : "Şarjı Başlat")}
          </button>
        </div>

        {/* Real-time telemetry indicators */}
        <div className="space-y-6">
          
          {/* Charger specs */}
          <div className="dash-panel p-6 space-y-4">
            <h3 className="text-[10px] uppercase tracking-widest text-slate-400 font-bold border-b border-white/5 pb-2">
              {language === "en" ? "Live Intake Metrics" : "Canlı Tüketim Değerleri"}
            </h3>
            <div className="space-y-4">
              <div>
                <span className="text-[8px] text-slate-500 uppercase tracking-widest block font-bold">
                  {language === "en" ? "Charging Power" : "Şarj Gücü"}
                </span>
                <span className="text-2xl font-light text-slate-100 font-mono mt-0.5 block">
                  {powerKw} <span className="text-sm text-slate-450">kW</span>
                </span>
              </div>
              <div>
                <span className="text-[8px] text-slate-500 uppercase tracking-widest block font-bold">
                  {language === "en" ? "Time Remaining (to 80%)" : "Kalan Süre (%80'e)"}
                </span>
                <span className="text-2xl font-light text-slate-100 font-mono mt-0.5 block">
                  {timeRemaining} <span className="text-sm text-slate-450">{language === "en" ? "mins" : "dk"}</span>
                </span>
              </div>
              <div>
                <span className="text-[8px] text-slate-500 uppercase tracking-widest block font-bold">
                  {language === "en" ? "Voltage" : "Voltaj"}
                </span>
                <span className="text-sm font-semibold text-slate-350 font-mono block mt-1">
                  {isCharging ? "392 V" : "0 V"}
                </span>
              </div>
            </div>
          </div>

          {/* Tips card */}
          <div className="dash-card p-6 space-y-3">
            <h3 className="text-[10px] uppercase tracking-widest text-accent font-bold">
              {language === "en" ? "Smart Charging Recommendation" : "Akıllı Şarj Tavsiyesi"}
            </h3>
            <p className="text-[10px] text-slate-400 leading-relaxed font-light">
              {language === "en"
                ? "Charging during off-peak grid hours (10:00 PM - 07:00 AM) reduces energy costs by up to 40% and minimizes local grid stress."
                : "Yoğun olmayan saatlerde (22:00 - 07:00) şarj etmek, enerji maliyetlerini %40'a varan oranda azaltır ve yerel şebeke stresini en aza indirir."}
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
export default ChargingDashboard;
