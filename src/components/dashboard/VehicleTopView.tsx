import { useLanguage } from "@/i18n/LanguageContext";

interface VehicleTopViewProps {
  vehicleId: string;
  isCharging: boolean;
  className?: string;
}

function ChargePortBadge({ isCharging, style }: { isCharging: boolean; style: React.CSSProperties }) {
  return (
    <div
      className="absolute w-6 h-6 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
      style={style}
    >
      <div
        className={`w-full h-full rounded-full flex items-center justify-center border transition-colors duration-500 ${
          isCharging
            ? "bg-accent border-accent shadow-[0_0_10px_var(--color-accent,#2a7a5f)]"
            : "bg-[#0f172a] border-slate-500/50"
        }`}
      >
        <svg
          viewBox="0 0 24 24"
          className={`w-3 h-3 ${isCharging ? "text-[#0b0f19] animate-pulse" : "text-slate-400"}`}
          fill="currentColor"
        >
          <path d="M13 2L4.5 14h6l-1.5 8L18.5 10h-6L13 2z" />
        </svg>
      </div>
    </div>
  );
}

export function VehicleTopView({ vehicleId, isCharging, className = "" }: VehicleTopViewProps) {
  const { language } = useLanguage();
  const isMotorcycle = vehicleId === "bullet";
  const src = isMotorcycle ? "/images/vehicles/motorcycle-top.png" : "/images/vehicles/car-top.png";
  const alt = isMotorcycle ? "Bullet" : (language === "en" ? "Vehicle" : "Araç");

  // Rough charge-port position over the artwork: front-center for the car,
  // over the tank cap already drawn on the motorcycle
  const portStyle: React.CSSProperties = isMotorcycle
    ? { top: "40%", left: "50%" }
    : { top: "9%", left: "50%" };

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <img
        src={src}
        alt={alt}
        className={`max-h-full max-w-full object-contain transition-[filter] duration-700 ${
          isCharging ? "animate-charge-glow" : ""
        }`}
      />
      <ChargePortBadge isCharging={isCharging} style={portStyle} />
    </div>
  );
}
export default VehicleTopView;
