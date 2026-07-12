import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { readStorage, writeStorage, userStorageKeys } from "@/lib/storage";
import vehiclesData from "@/data/vehicles.json";
import { Vehicle } from "@/types";
import { useToast } from "@/context/ToastContext";
import { vehicleTelemetry, defaultVehicleTelemetry } from "@/data/vehicleTelemetry";

export function VehicleDetails() {
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { language } = useLanguage();
  const { session } = useAuth();
  const userId = session?.user?.id || "guest";

  const vehicle = (vehiclesData as Vehicle[]).find((v) => v.id === vehicleId);

  // States for controls
  const [isLocked, setIsLocked] = useState(true);
  const [isPreconditioning, setIsPreconditioning] = useState(false);
  const [chargeLimit, setChargeLimit] = useState(80);

  useEffect(() => {
    if (!vehicle) {
      navigate("/dashboard/vehicles");
      return;
    }
    const settings = readStorage<any>(userStorageKeys.vehicleSettings(userId, vehicle.id), { chargeLimit: 80 });
    setChargeLimit(settings.chargeLimit ?? 80);
  }, [vehicle, navigate, userId]);

  if (!vehicle) return null;

  const telemetry = vehicleTelemetry[vehicle.id] || defaultVehicleTelemetry;

  const handleChargeLimitChange = (value: number) => {
    setChargeLimit(value);
    const existing = readStorage<any>(userStorageKeys.vehicleSettings(userId, vehicle.id), {});
    writeStorage(userStorageKeys.vehicleSettings(userId, vehicle.id), { ...existing, chargeLimit: value });
  };

  const handleLockToggle = () => {
    setIsLocked((prev) => {
      const next = !prev;
      showToast(
        next 
          ? (language === "en" ? "Doors locked securely" : "Kapılar güvenle kilitlendi")
          : (language === "en" ? "Doors unlocked" : "Kapı kilitleri açıldı"), 
        "info"
      );
      return next;
    });
  };

  const handlePreconditionToggle = () => {
    setIsPreconditioning((prev) => {
      const next = !prev;
      showToast(
        next 
          ? (language === "en" ? "Climate preconditioning active. Cooling to 21°C." : "Klima ön koşullandırma aktif. 21°C'ye soğutuluyor.") 
          : (language === "en" ? "Climate preconditioning off" : "Klima ön koşullandırma kapatıldı"), 
        "success"
      );
      return next;
    });
  };

  const handleHonk = () => {
    showToast(
      language === "en" ? "Horn triggered 🔊" : "Korna çalındı 🔊", 
      "info"
    );
  };

  const handleFlash = () => {
    showToast(
      language === "en" ? "Headlights flashed ⚡" : "Farlar yakıldı ⚡", 
      "info"
    );
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      
      {/* Header breadcrumb & navigation */}
      <div className="dash-panel p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-[9px] uppercase tracking-wider text-slate-500 font-bold font-mono">
            <Link to="/dashboard/vehicles" className="hover:text-slate-350">{language === "en" ? "My Vehicles" : "Araçlarım"}</Link>
            <span>/</span>
            <span className="text-slate-400">{vehicle.name}</span>
          </div>
          <h1 className="text-xl font-light uppercase tracking-widest text-slate-100 mt-1">
            {vehicle.name} {language === "en" ? "Telemetry" : "Telemetrisi"}
          </h1>
        </div>
        <Link
          to="/dashboard/vehicles"
          className="px-5 py-2 rounded-full border border-white/10 hover:border-white/20 text-[9px] font-bold uppercase tracking-widest text-slate-300 transition"
        >
          {language === "en" ? "Back" : "Geri"}
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Visual Render and Primary Metrics */}
        <div className="lg:col-span-2 space-y-6">
          <div className="dash-panel p-6 flex flex-col justify-between aspect-[16/10] relative overflow-hidden">
            
            {/* GPS Grid Reticle HUD */}
            <div className="absolute inset-0 border border-white/[0.01] pointer-events-none z-0">
              <div className="absolute top-1/2 left-0 right-0 h-px bg-white/[0.015]" />
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/[0.015]" />
            </div>

            <div className="flex justify-between items-start z-10">
              <div>
                <span className="text-[9px] uppercase tracking-widest text-accent font-bold font-mono block">Status: Online</span>
                <span className="text-3xl font-light tracking-wide text-white mt-1 block">
                  {vehicle.batteryPercent || 78}% Charged
                </span>
              </div>
              <div className="text-right">
                <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold">Signal</span>
                <span className="text-xs font-semibold text-accent font-mono block">LTE 5/5</span>
              </div>
            </div>

            <div className="w-full flex items-center justify-center p-8 z-10 flex-grow max-h-[60%]">
              <img
                src={vehicle.image}
                alt={vehicle.name}
                className="max-h-full max-w-full object-contain animate-pulse"
                style={{ animationDuration: "4s" }}
              />
            </div>

            <div className="grid grid-cols-3 gap-4 border-t border-white/5 pt-4 text-center z-10">
              <div>
                <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold">Odometer</span>
                <span className="text-sm font-semibold text-slate-200 mt-0.5 block font-mono">{telemetry.odometer.toLocaleString()} km</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold">Est. Range</span>
                <span className="text-sm font-semibold text-slate-200 mt-0.5 block font-mono">
                  {Math.round((vehicle.batteryPercent || 78) * telemetry.rangeFactor)} km
                </span>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold">Cabin Temp</span>
                <span className="text-sm font-semibold text-slate-200 mt-0.5 block font-mono">
                  {isPreconditioning ? "21°C" : "28°C"}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="dash-panel p-6 space-y-4">
            <h3 className="text-xs uppercase tracking-widest text-slate-450 font-bold border-b border-white/5 pb-2">
              {language === "en" ? "Remote Telematics" : "Uzaktan Telemetri Kontrolleri"}
            </h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <button
                onClick={handleLockToggle}
                className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-2.5 cursor-pointer transition ${
                  isLocked 
                    ? "bg-white/5 border-white/10 text-slate-350 hover:bg-white/10" 
                    : "bg-accent/10 border-accent/25 text-accent hover:bg-accent/15"
                }`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {isLocked ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                  )}
                </svg>
                <span className="text-[9px] uppercase font-bold tracking-widest font-mono">
                  {isLocked ? (language === "en" ? "Unlock" : "Kilidi Aç") : (language === "en" ? "Lock" : "Kilitle")}
                </span>
              </button>

              <button
                onClick={handlePreconditionToggle}
                className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-2.5 cursor-pointer transition ${
                  isPreconditioning 
                    ? "bg-accent/15 border-accent/35 text-accent hover:bg-accent/20" 
                    : "bg-white/5 border-white/10 text-slate-350 hover:bg-white/10"
                }`}
              >
                <svg className="w-5 h-5 animate-spin" style={{ animationDuration: isPreconditioning ? "4s" : "0s" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707" />
                </svg>
                <span className="text-[9px] uppercase font-bold tracking-widest font-mono">
                  {language === "en" ? "Climate" : "Klima"}
                </span>
              </button>

              <button
                onClick={handleHonk}
                className="p-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-350 flex flex-col items-center justify-center gap-2.5 cursor-pointer transition"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
                <span className="text-[9px] uppercase font-bold tracking-widest font-mono">
                  {language === "en" ? "Honk" : "Korna"}
                </span>
              </button>

              <button
                onClick={handleFlash}
                className="p-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-350 flex flex-col items-center justify-center gap-2.5 cursor-pointer transition"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="text-[9px] uppercase font-bold tracking-widest font-mono">
                  {language === "en" ? "Flash" : "Selektör"}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Specifications and Limits Sidebar */}
        <div className="space-y-6">
          
          {/* Charge Limits card */}
          <div className="dash-panel p-6 space-y-4">
            <h3 className="text-xs uppercase tracking-widest text-slate-450 font-bold border-b border-white/5 pb-2">
              {language === "en" ? "Charge Settings" : "Şarj Ayarları"}
            </h3>
            
            <div className="space-y-3">
              <div className="flex justify-between text-xs text-slate-300 font-mono font-bold">
                <span>{language === "en" ? "Charge Target Limit" : "Hedef Şarj Limiti"}</span>
                <span className="text-accent font-semibold">{chargeLimit}%</span>
              </div>
              <div className="dash-inset p-1 rounded-xl">
                <input
                  type="range"
                  min="50"
                  max="100"
                  step="5"
                  value={chargeLimit}
                  onChange={(e) => handleChargeLimitChange(Number(e.target.value))}
                  className="w-full h-1 bg-transparent rounded-lg appearance-none cursor-pointer accent-accent p-2"
                />
              </div>
              <span className="text-[9px] text-slate-500 block leading-relaxed font-light">
                {language === "en"
                  ? "Limiting daily charging limit to 80-90% preserves battery lifespan longevity."
                  : "Günlük şarj limitini %80-90 ile sınırlamak, pil ömrü uzunluğunu korur."}
              </span>
            </div>
          </div>

          {/* Vehicle Specifications */}
          <div className="dash-card p-6 space-y-4">
            <h3 className="text-xs uppercase tracking-widest text-slate-450 font-bold border-b border-white/5 pb-2">
              {language === "en" ? "Vehicle Profile" : "Araç Profili"}
            </h3>
            
            <div className="divide-y divide-white/5 text-xs">
              <div className="py-3 flex justify-between">
                <span className="text-slate-500 font-bold uppercase text-[9px]">{language === "en" ? "Model Category" : "Model Kategorisi"}</span>
                <span className="text-slate-200 font-semibold uppercase">{vehicle.type}</span>
              </div>
              <div className="py-3 flex justify-between">
                <span className="text-slate-500 font-bold uppercase text-[9px]">{language === "en" ? "Range Rating" : "Menzil Değeri"}</span>
                <span className="text-slate-200 font-mono">{vehicle.specs.range}</span>
              </div>
              <div className="py-3 flex justify-between">
                <span className="text-slate-500 font-bold uppercase text-[9px]">{language === "en" ? "Maximum Power" : "Maksimum Güç"}</span>
                <span className="text-slate-200 font-mono">{vehicle.specs.maxPower}</span>
              </div>
              <div className="py-3 flex justify-between">
                <span className="text-slate-500 font-bold uppercase text-[9px]">0 - 100 km/h</span>
                <span className="text-slate-200 font-mono">{vehicle.specs.acceleration}</span>
              </div>
              <div className="py-3 flex justify-between">
                <span className="text-slate-500 font-bold uppercase text-[9px]">{language === "en" ? "Top Speed" : "Maks. Hız"}</span>
                <span className="text-slate-200 font-mono">{vehicle.specs.topSpeed}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
export default VehicleDetails;
