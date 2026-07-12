import { useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import vehiclesData from "@/data/vehicles.json";
import { Vehicle } from "@/types";

interface VehicleDetailViewProps {
  vehicleId: string;
}

export function VehicleDetailView({ vehicleId }: VehicleDetailViewProps) {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState("overview");

  // Load the specific vehicle details
  const vehicle = (vehiclesData as Vehicle[]).find((v) => v.id === vehicleId);

  if (!vehicle) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-light text-white">Vehicle Not Found</h2>
        <Link to="/vehicles" className="text-accent hover:underline mt-4 inline-block">
          Back to lineup
        </Link>
      </div>
    );
  }

  const heroImg = vehicle.image;

  // Specs row keys
  const specList = [
    { label: t("vehicles.range"), val: vehicle.specs.range },
    { label: t("vehicles.power"), val: vehicle.specs.maxPower },
    { label: vehicle.id === "bullet" ? "0-50 km/h" : "0-100 km/h", val: vehicle.specs.acceleration },
    { label: t("vehicles.topSpeed"), val: vehicle.specs.topSpeed }
  ];

  if (vehicle.specs.extraLabel && vehicle.specs.extraValue) {
    let localizedLabel = vehicle.specs.extraLabel;
    if (vehicle.specs.extraLabel === "Seats") {
      localizedLabel = language === "en" ? "Seats" : "Koltuk";
    } else if (vehicle.specs.extraLabel === "Weight") {
      localizedLabel = language === "en" ? "Weight" : "Ağırlık";
    }

    specList.push({
      label: localizedLabel.toUpperCase(),
      val: vehicle.specs.extraValue
    });
  }

  // Tabs navigation
  const tabs = ["overview", "design", "performance", "technology", "safety", "specs"];

  // Tab-specific details content generators
  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-6 animate-fade-in">
            <span className="text-xs uppercase tracking-[0.2em] text-accent font-semibold block">
              {language === "en" ? "Overview" : "Genel Bakış"}
            </span>
            <h2 className="text-3xl font-light tracking-wide uppercase text-white leading-snug">
              {vehicle.id === "vector" && "Designed to move you."}
              {vehicle.id === "cloud" && "Space for every moment."}
              {vehicle.id === "bullet" && "Built for the city. Born to ride."}
            </h2>
            <p className="text-slate-300 font-light text-sm leading-relaxed">
              {vehicle.description} {language === "en" ? "Experience luxury electric transport engineered to push borders and refine expectations." : "Sınırları zorlamak ve beklentileri yeniden tanımlamak için tasarlanmış lüks elektrikli ulaşımı deneyimleyin."}
            </p>
            <div className="pt-2">
              <Link
                to={`/test-drive?model=${vehicle.id}`}
                className="inline-flex justify-center items-center px-6 py-2.5 bg-accent text-black text-[10px] font-bold uppercase tracking-widest rounded-full hover:bg-[#348c70] transition"
              >
                {t("cta.bookTestDrive")}
              </Link>
            </div>
          </div>
        );

      case "design":
        return (
          <div className="space-y-6 animate-fade-in">
              <span className="text-xs uppercase tracking-[0.2em] text-accent font-semibold block">
                {language === "en" ? "Aerodynamics & Craftsmanship" : "Aerodinamik ve İşçilik"}
              </span>
              <h2 className="text-3xl font-light tracking-wide uppercase text-white leading-snug">
                {language === "en" ? "Form Meets Pure Utility" : "Form Saf İşlevsellikle Buluşuyor"}
              </h2>
              <p className="text-slate-355 font-light text-sm leading-relaxed">
                {vehicle.id === "vector" && "Vector's sculpted silhouette is crafted with absolute aerodynamic precision. With a drag coefficient of 0.208 Cd, air slips around the body effortlessly, maximizing electric range."}
                {vehicle.id === "cloud" && "Cloud SUV redefines space. Features an ultra-wide panoramic ceiling canopy that captures and reflects natural light, framing your journeys beautifully."}
                {vehicle.id === "bullet" && "Bullet motorcycle boasts a minimalist cybernetic structure built with aircraft-grade aluminum. Its aggressive stance lowers the center of gravity for maximum handling cornering."}
              </p>
              
              {/* Highlight items migrated from features list */}
              <div className="space-y-4 pt-2">
                {vehicle.id === "vector" && (
                  <div className="flex gap-4 p-4 rounded-2xl bg-white/[0.01] border border-white/5">
                    <span className="text-accent text-lg shrink-0 mt-0.5">✔</span>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Premium Sound Acoustics</h4>
                      <p className="text-xs text-slate-400 font-light mt-0.5">23-speaker custom surround audio system delivers pure acoustic immersion throughout the cabin.</p>
                    </div>
                  </div>
                )}
                {vehicle.id === "cloud" && (
                  <>
                    <div className="flex gap-4 p-4 rounded-2xl bg-white/[0.01] border border-white/5">
                      <span className="text-accent text-lg shrink-0 mt-0.5">✔</span>
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Panoramic Ceiling Vista</h4>
                        <p className="text-xs text-slate-400 font-light mt-0.5">A massive UV-insulated glass canopy wraps the ceiling, creating an open air greenhouse aesthetic.</p>
                      </div>
                    </div>
                    <div className="flex gap-4 p-4 rounded-2xl bg-white/[0.01] border border-white/5">
                      <span className="text-accent text-lg shrink-0 mt-0.5">✔</span>
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Large Cargo Bay</h4>
                        <p className="text-xs text-slate-400 font-light mt-0.5">Unlock up to 2,100 Liters of versatile utility space with flat-folding seat layouts.</p>
                      </div>
                    </div>
                  </>
                )}
                {vehicle.id === "bullet" && (
                  <div className="flex gap-4 p-4 rounded-2xl bg-white/[0.01] border border-white/5">
                    <span className="text-accent text-lg shrink-0 mt-0.5">✔</span>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Portable Urban Charging</h4>
                      <p className="text-xs text-slate-400 font-light mt-0.5">Removable lightweight battery system enables charging inside your home or office on any standard outlet.</p>
                    </div>
                  </div>
                )}
              </div>
          </div>
        );

      case "performance":
        return (
          <div className="space-y-6 animate-fade-in">
              <span className="text-xs uppercase tracking-[0.2em] text-accent font-semibold block">
                {language === "en" ? "Electric Powertrain" : "Elektrikli Motor"}
              </span>
              <h2 className="text-3xl font-light tracking-wide uppercase text-white leading-snug">
                {language === "en" ? "Unmatched Torque & Output" : "Eşsiz Tork ve Güç"}
              </h2>
              <p className="text-slate-355 font-light text-sm leading-relaxed">
                {vehicle.id === "vector" && "Equipped with dual electric motors delivering a combined 350 kW of peak power, Vector rockets to 100 km/h in 3.8 seconds. Features intelligent active roll stabilization."}
                {vehicle.id === "cloud" && "Cloud's intelligent All-Wheel Drive matches instant torque demands to all conditions. Standard high-efficiency dual electric motors deliver 315 kW capacity."}
                {vehicle.id === "bullet" && "Bullet motorcycle pushes direct belt-driven acceleration, bringing instant electric torque directly to the pavement. High torque response lets you dominate traffic."}
              </p>

              {/* Performance highlights migrated from features list */}
              <div className="space-y-4 pt-2">
                {vehicle.id === "vector" && (
                  <div className="flex gap-4 p-4 rounded-2xl bg-white/[0.01] border border-white/5">
                    <span className="text-accent text-lg shrink-0 mt-0.5">✔</span>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">800V Ultra-Fast Charging Architecture</h4>
                      <p className="text-xs text-slate-400 font-light mt-0.5">Charges from 10% to 80% capacity in just 18 minutes on high-speed DC Supercharger stations.</p>
                    </div>
                  </div>
                )}
                {vehicle.id === "cloud" && (
                  <>
                    <div className="flex gap-4 p-4 rounded-2xl bg-white/[0.01] border border-white/5">
                      <span className="text-accent text-lg shrink-0 mt-0.5">✔</span>
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Dynamic All-Wheel Drive</h4>
                        <p className="text-xs text-slate-400 font-light mt-0.5">Torque is redistributed to individual axles in 10 milliseconds, enhancing traction under rain or snow.</p>
                      </div>
                    </div>
                    <div className="flex gap-4 p-4 rounded-2xl bg-white/[0.01] border border-white/5">
                      <span className="text-accent text-lg shrink-0 mt-0.5">✔</span>
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Intelligent Heat Pump System</h4>
                        <p className="text-xs text-slate-400 font-light mt-0.5">Optimizes battery thermal efficiency in sub-zero climates, recovering up to 15% range loss.</p>
                      </div>
                    </div>
                  </>
                )}
                {vehicle.id === "bullet" && (
                  <>
                    <div className="flex gap-4 p-4 rounded-2xl bg-white/[0.01] border border-white/5">
                      <span className="text-accent text-lg shrink-0 mt-0.5">✔</span>
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Instant Acceleration</h4>
                        <p className="text-xs text-slate-400 font-light mt-0.5">Launches from 0 to 60 km/h in an adrenaline-filled 2.7 seconds.</p>
                      </div>
                    </div>
                    <div className="flex gap-4 p-4 rounded-2xl bg-white/[0.01] border border-white/5">
                      <span className="text-accent text-lg shrink-0 mt-0.5">✔</span>
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Regenerative Braking Feedback</h4>
                        <p className="text-xs text-slate-400 font-light mt-0.5">Intelligent kinetic recovery feeds energy back to the battery pack while braking.</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
          </div>
        );

      case "technology":
        return (
          <div className="space-y-6 animate-fade-in">
              <span className="text-xs uppercase tracking-[0.2em] text-accent font-semibold block">
                {language === "en" ? "Intelligent Cabin" : "Akıllı Kokpit"}
              </span>
              <h2 className="text-3xl font-light tracking-wide uppercase text-white leading-snug">
                {language === "en" ? "Digital Cockpit Interface" : "Dijital Kokpit Arayüzü"}
              </h2>
              <p className="text-slate-355 font-light text-sm leading-relaxed">
                Powered by our proprietary EVOS platform, EVALIS vehicles run intelligent trip routing, integrated music ecosystem, custom navigation overlays, and over-the-air firmware updates.
              </p>

              {/* Technology highlights migrated from features list */}
              <div className="space-y-4 pt-2">
                {vehicle.id === "vector" && (
                  <div className="flex gap-4 p-4 rounded-2xl bg-white/[0.01] border border-white/5">
                    <span className="text-accent text-lg shrink-0 mt-0.5">✔</span>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">15.6" Center Command Console</h4>
                      <p className="text-xs text-slate-400 font-light mt-0.5">Stunning UHD central display equipped with AI voice assistance, off-peak charging schedules, and ambient climate rules.</p>
                    </div>
                  </div>
                )}
                {vehicle.id === "cloud" && (
                  <div className="flex gap-4 p-4 rounded-2xl bg-white/[0.01] border border-white/5">
                    <span className="text-accent text-lg shrink-0 mt-0.5">✔</span>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Intelligent Cockpit OS</h4>
                      <p className="text-xs text-slate-400 font-light mt-0.5">Front dashboard screen combined with wireless passenger casting and intelligent supercharging map layouts.</p>
                    </div>
                  </div>
                )}
                {vehicle.id === "bullet" && (
                  <div className="flex gap-4 p-4 rounded-2xl bg-white/[0.01] border border-white/5">
                    <span className="text-accent text-lg shrink-0 mt-0.5">✔</span>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">TFT Display Cockpit</h4>
                      <p className="text-xs text-slate-400 font-light mt-0.5">High-definition TFT dashboard with integrated rider profiles, route telemetry, and custom throttle modes.</p>
                    </div>
                  </div>
                )}
              </div>
          </div>
        );

      case "safety":
        return (
          <div className="space-y-6 animate-fade-in">
              <span className="text-xs uppercase tracking-[0.2em] text-accent font-semibold block">
                {language === "en" ? "Active Guard Safety" : "Aktif Koruma Güvenliği"}
              </span>
              <h2 className="text-3xl font-light tracking-wide uppercase text-white leading-snug">
                {language === "en" ? "Fortified Protection" : "Güçlendirilmiş Koruma"}
              </h2>
              <p className="text-slate-350 font-light text-sm leading-relaxed">
                EVALIS structures are engineered to exceed worldwide safety testing standards. Features active steel cages, bottom armor plates protecting battery grids, and dynamic passenger protection.
              </p>

              {/* Safety highlights migrated from features list */}
              <div className="space-y-4 pt-2">
                {vehicle.id === "vector" && (
                  <div className="flex gap-4 p-4 rounded-2xl bg-white/[0.01] border border-white/5">
                    <span className="text-accent text-lg shrink-0 mt-0.5">✔</span>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">L2+ Autopilot Driver Assist</h4>
                      <p className="text-xs text-slate-400 font-light mt-0.5">EVALIS Guard pilot leverages 12 ultrasonic cameras for automatic blind-spot prevention, lane alignment, and cruise assistance.</p>
                    </div>
                  </div>
                )}
                {vehicle.id === "cloud" && (
                  <div className="flex gap-4 p-4 rounded-2xl bg-white/[0.01] border border-white/5">
                    <span className="text-accent text-lg shrink-0 mt-0.5">✔</span>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">5-Star Safety Cage Structure</h4>
                      <p className="text-xs text-slate-400 font-light mt-0.5">Chassis built with ultra-high strength boron steel, providing superior cabin crash protection and rollover shield.</p>
                    </div>
                  </div>
                )}
                {vehicle.id === "bullet" && (
                  <div className="flex gap-4 p-4 rounded-2xl bg-white/[0.01] border border-white/5">
                    <span className="text-accent text-lg shrink-0 mt-0.5">✔</span>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Dual-Channel Hydraulic ABS</h4>
                      <p className="text-xs text-slate-400 font-light mt-0.5">Advanced anti-lock braking controls front/rear wheel torque on wet asphalt to prevent skid conditions.</p>
                    </div>
                  </div>
                )}
              </div>
          </div>
        );

      case "specs":
        return (
          <div className="border border-white/5 bg-[#0b0f19]/40 rounded-3xl p-6 md:p-8 animate-fade-in shadow-xl">
            <h3 className="text-xs font-bold uppercase tracking-widest text-white border-b border-white/5 pb-4 mb-6">
              {language === "en" ? "Technical Specs" : "Teknik Özellikler"}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs font-light">
              <div className="space-y-4">
                <div className="flex justify-between py-2.5 border-b border-white/5">
                  <span className="text-slate-500 uppercase tracking-widest">{t("vehicles.range")}</span>
                  <span className="text-slate-200 font-mono font-semibold">{vehicle.specs.range} (WLTP)</span>
                </div>
                <div className="flex justify-between py-2.5 border-b border-white/5">
                  <span className="text-slate-500 uppercase tracking-widest">{t("vehicles.power")}</span>
                  <span className="text-slate-200 font-mono font-semibold">{vehicle.specs.maxPower}</span>
                </div>
                <div className="flex justify-between py-2.5 border-b border-white/5">
                  <span className="text-slate-500 uppercase tracking-widest">{language === "en" ? "Acceleration" : "Hızlanma"}</span>
                  <span className="text-slate-200 font-mono font-semibold">{vehicle.specs.acceleration}</span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between py-2.5 border-b border-white/5">
                  <span className="text-slate-500 uppercase tracking-widest">{t("vehicles.topSpeed")}</span>
                  <span className="text-slate-200 font-mono font-semibold">{vehicle.specs.topSpeed}</span>
                </div>
                {vehicle.specs.extraLabel && (
                  <div className="flex justify-between py-2.5 border-b border-white/5">
                    <span className="text-slate-500 uppercase tracking-widest">
                      {vehicle.specs.extraLabel === "Seats" ? (language === "en" ? "Seats" : "Koltuk") : (language === "en" ? "Weight" : "Ağırlık")}
                    </span>
                    <span className="text-slate-200 font-mono font-semibold">{vehicle.specs.extraValue}</span>
                  </div>
                )}
                <div className="flex justify-between py-2.5 border-b border-white/5">
                  <span className="text-slate-500 uppercase tracking-widest">{language === "en" ? "Battery Class" : "Batarya Sınıfı"}</span>
                  <span className="text-slate-200 font-mono font-semibold">{vehicle.id === "bullet" ? "Lithium-Ion Air" : "Lithium-Nickel Silicon"}</span>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-16 pb-20">
      {/* Premium Detail Hero */}
      <section className="relative h-[94vh] w-full overflow-hidden flex flex-col justify-between p-8 bg-site">
        {/* Hero Background */}
        <div className="absolute inset-0 z-0">
          <img src={heroImg} alt={vehicle.name} className="w-full h-full object-cover opacity-85" />
          <div className="absolute inset-0 bg-gradient-to-t from-site via-site/10 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-site/60 via-transparent to-transparent" />
        </div>

        {/* Hero Meta Header */}
        <div className="relative z-10 max-w-7xl mx-auto w-full pt-24 px-6">
          <span className="text-[10px] uppercase tracking-[0.35em] text-accent block font-medium">
            EVALIS
          </span>
          <h1 className="text-5xl md:text-6xl font-light tracking-[0.2em] uppercase text-white mt-1">
            {vehicle.name}
          </h1>
          <p className="text-slate-300 font-light text-xs tracking-widest mt-1">
            {vehicle.type}
          </p>
        </div>

        {/* Tagline and Actions */}
        <div className="relative z-10 max-w-7xl mx-auto w-full mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 px-6">
          <p className="max-w-xl text-md md:text-lg font-light text-slate-200 tracking-wide leading-relaxed">
            {vehicle.tagline}
          </p>
          <div className="flex gap-4 w-full md:w-auto">
            <Link
              to={`/test-drive?model=${vehicle.id}`}
              className="flex-1 md:flex-none inline-flex justify-center items-center px-8 py-3 bg-white text-black text-xs font-semibold uppercase tracking-[0.18em] rounded-full hover:bg-slate-200 transition"
            >
              {t("cta.bookTestDrive")}
            </Link>
          </div>
        </div>
      </section>

      {/* Detail image stuck on the left, tab content on the right */}
      <section className="w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 items-start">
          {/* Sticky detail image, half the page, shown whole, no crop or border */}
          <div className="lg:sticky lg:top-24 px-6 lg:px-12 py-6">
            <img
              src={vehicle.detailImage}
              alt={`${vehicle.name} detail view`}
              className="w-full h-auto max-h-[88vh] object-contain"
            />
          </div>

          {/* Specs, tabs, and tab content */}
          <div className="space-y-10 px-6 lg:pr-12 py-6">
            <div className="grid grid-cols-2 gap-6 text-left border-b border-white/10 pb-8">
              {specList.map((spec, i) => (
                <div key={i} className="space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest block">
                    {spec.label}
                  </span>
                  <span className="text-2xl font-light text-white tracking-wide block">
                    {spec.val}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-start border-b border-white/10 overflow-x-auto">
              <div className="flex gap-8 whitespace-nowrap">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-4 text-[10px] uppercase tracking-[0.25em] font-semibold cursor-pointer border-b-2 transition duration-200 ${
                      activeTab === tab
                        ? "border-accent text-accent"
                        : "border-transparent text-slate-400 hover:text-white"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {renderTabContent()}
          </div>
        </div>
      </section>
    </div>
  );
}
