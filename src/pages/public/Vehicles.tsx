import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import vehiclesData from "@/data/vehicles.json";

export function Vehicles() {
  const { t, language } = useLanguage();
  const vehicles = vehiclesData;

  return (
    <div className="space-y-16 pt-28 pb-10 max-w-7xl mx-auto px-6">
      {/* Page Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="text-xs uppercase tracking-[0.3em] text-accent font-semibold block">
          {t("vehicles.lineup")}
        </span>
        <h1 className="text-4xl md:text-5xl font-extralight tracking-widest uppercase text-white">
          {t("vehicles.lineupTitle")}
        </h1>
        <div className="w-16 h-px bg-accent/40 mx-auto mt-4" />
      </div>

      {/* Vehicles Grid list */}
      <div className="space-y-12">
        {vehicles.map((vehicle, index) => {
          return (
            <div
              key={vehicle.id}
              className={`flex flex-col lg:flex-row gap-8 items-center border border-white/5 bg-white/[0.01] rounded-3xl p-6 lg:p-8 hover:border-white/10 transition duration-300 ${
                index % 2 === 1 ? "lg:flex-row-reverse" : ""
              }`}
            >
              {/* Vehicle Image Link */}
              <Link
                to={`/vehicles/${vehicle.id}`}
                className="w-full lg:w-3/5 aspect-[16/10] rounded-2xl overflow-hidden bg-slate-900 border border-white/5 cursor-pointer block"
              >
                <img
                  src={vehicle.image}
                  alt={vehicle.name}
                  className="w-full h-full object-cover hover:scale-[1.02] transition duration-500"
                />
              </Link>

              {/* Vehicle Content & Specifications */}
              <div className="w-full lg:w-2/5 space-y-6 flex flex-col justify-between">
                <div className="space-y-3">
                  <span className="text-[10px] uppercase tracking-[0.25em] text-accent">
                    {vehicle.type}
                  </span>
                  <h2 className="text-3xl font-light tracking-widest uppercase text-white hover:text-accent transition">
                    <Link to={`/vehicles/${vehicle.id}`}>{vehicle.name}</Link>
                  </h2>
                  <p className="text-slate-300 font-light text-sm leading-relaxed">
                    {vehicle.tagline}
                  </p>
                  <p className="text-slate-400 font-light text-xs leading-relaxed">
                    {vehicle.description}
                  </p>
                </div>

                {/* Specs Row */}
                <div className="grid grid-cols-2 gap-4 border-y border-white/10 py-4">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest">
                      {t("vehicles.range")}
                    </span>
                    <span className="text-lg font-light text-slate-200 mt-1 block">
                      {vehicle.specs.range}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest">
                      {t("vehicles.power")}
                    </span>
                    <span className="text-lg font-light text-slate-200 mt-1 block">
                      {vehicle.specs.maxPower}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest">
                      {t("vehicles.acceleration")}
                    </span>
                    <span className="text-lg font-light text-slate-200 mt-1 block">
                      {vehicle.specs.acceleration}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest">
                      {t("vehicles.topSpeed")}
                    </span>
                    <span className="text-lg font-light text-slate-200 mt-1 block">
                      {vehicle.specs.topSpeed}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Link
                    to={`/test-drive?model=${vehicle.id}`}
                    className="flex-1 py-3 text-center rounded-full bg-white text-black text-xs font-semibold uppercase tracking-[0.18em] hover:bg-slate-200 transition"
                  >
                    {t("cta.bookTestDrive")}
                  </Link>
                  <Link
                    to={`/vehicles/${vehicle.id}`}
                    className="flex-1 py-3 text-center rounded-full border border-white/15 text-white text-xs font-semibold uppercase tracking-[0.18em] hover:bg-white/5 hover:border-white transition"
                  >
                    {language === "en" ? "See Details" : "Detayları Gör"}
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
