import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import vehiclesData from "@/data/vehicles.json";
import { Vehicle } from "@/types";

// Mock battery pack capacity (kWh) per model — not present in vehicles.json,
// range is derived from vehicles.json so the two can't drift apart.
const batteryCapacityKWh: Record<string, number> = {
  vector: 95,
  cloud: 110,
  bullet: 18
};

export function Charging() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const vehicles = vehiclesData as Vehicle[];

  // Selected vehicle for charging simulation slider
  const [selectedVehicle, setSelectedVehicle] = useState<"vector" | "cloud" | "bullet">("vector");
  const [chargeTarget, setChargeTarget] = useState(80);

  const selectedVehicleData = vehicles.find((v) => v.id === selectedVehicle);
  const currentStats = {
    battery: batteryCapacityKWh[selectedVehicle],
    range: selectedVehicleData ? parseInt(selectedVehicleData.specs.range, 10) : 0
  };
  const calculatedRange = Math.round((currentStats.range * chargeTarget) / 100);

  // Calculate charge duration in minutes
  const getChargeTimeText = (powerKW: number) => {
    // Basic mock physics
    const batteryCapacityKWh = currentStats.battery;
    const requiredKWh = (batteryCapacityKWh * chargeTarget) / 100;
    
    if (powerKW === 2.3) {
      const hours = requiredKWh / 2.3;
      return hours > 24 ? "24+ hours" : `${Math.round(hours)} hrs`;
    }
    if (powerKW === 22) {
      const hours = requiredKWh / 22;
      return `${hours.toFixed(1)} hrs`;
    }
    if (powerKW === 250) {
      const minutes = (requiredKWh / 250) * 60;
      return `${Math.round(minutes + 8)} mins`; // Include ramp-up delay
    }
    return "N/A";
  };

  return (
    <div className="space-y-24 pt-28 pb-20 max-w-7xl mx-auto px-6">
      {/* Cinematic Hero Header */}
      <section className="text-center max-w-3xl mx-auto space-y-4 animate-fade-in-up">
        <span className="text-xs uppercase tracking-[0.35em] text-accent font-semibold block">
          {language === "en" ? "POWER THE JOURNEY" : "YOLCULUĞU GÜÇLENDİRİN"}
        </span>
        <h1 className="text-4xl md:text-6xl font-extralight tracking-[0.2em] uppercase text-white font-orbitron">
          {language === "en" ? "CHARGING GRID" : "ŞARJ AĞI"}
        </h1>
        <p className="text-slate-400 font-light tracking-[0.08em] text-sm md:text-base leading-relaxed">
          {language === "en"
            ? "Effortless, intelligent charging products for your home, garage, or long-distance highway journeys."
            : "Eviniz, garajınız veya uzun mesafeli otoyol yolculuklarınız için zahmetsiz, akıllı şarj ürünleri."}
        </p>
      </section>

      {/* Section 1: Home Charging (EVALIS Wallbox) */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center border-t border-white/5 pt-16">
        <div className="space-y-6">
          <span className="text-[10px] uppercase tracking-[0.25em] text-accent font-semibold block">
            {language === "en" ? "HOME CHARGING" : "EVDE ŞARJ"}
          </span>
          <h2 className="text-2xl md:text-4xl font-light uppercase tracking-widest text-white leading-tight">
            {language === "en" ? "EVALIS Wallbox" : "EVALIS Duvar Kutusu"}
          </h2>
          <p className="text-sm text-slate-400 font-light leading-relaxed">
            {language === "en"
              ? "Recharge your vehicle overnight from the comfort of your garage. The EVALIS Wallbox delivers high-speed AC power, weather-proof security, and intelligent mobile app connectivity to configure scheduling options."
              : "Garajınızın konforunda aracınızı gece boyunca şarj edin. EVALIS Duvar Kutusu, yüksek hızlı AC güç, hava koşullarına dayanıklı güvenlik ve şarj planlama seçeneklerini yapılandırmak için akıllı mobil uygulama bağlantısı sunar."}
          </p>

          <ul className="space-y-3 text-xs text-slate-300 font-light">
            <li className="flex items-center gap-3">
              <span className="text-accent text-md">✔</span> 
              {language === "en" ? "Up to 22 kW charging speeds (10x faster than standard wall outlets)" : "22 kW'a kadar şarj hızları (standart duvar prizlerinden 10 kat daha hızlı)"}
            </li>
            <li className="flex items-center gap-3">
              <span className="text-accent text-md">✔</span> 
              {language === "en" ? "Wi-Fi and Bluetooth enabled for off-peak smart scheduling" : "Yoğun olmayan saatlerde akıllı planlama için Wi-Fi ve Bluetooth etkinleştirildi"}
            </li>
            <li className="flex items-center gap-3">
              <span className="text-accent text-md">✔</span> 
              {language === "en" ? "IP66 rated waterproof, weather-proof design for outdoor installation" : "Açık havada kurulum için IP66 sınıfı su geçirmez, hava koşullarına dayanıklı tasarım"}
            </li>
            <li className="flex items-center gap-3">
              <span className="text-accent text-md">✔</span> 
              {language === "en" ? "Integrated 7.5 meter high-flex Type 2 charging cable" : "Entegre 7.5 metrelik yüksek esneklikli Tip 2 şarj kablosu"}
            </li>
          </ul>

          <div className="pt-4 flex gap-4">
            <Link
              to="/shop"
              className="rounded-full bg-accent text-black px-6 py-2.5 text-xs font-semibold uppercase tracking-widest hover:bg-[#348c70] transition duration-300"
            >
              {language === "en" ? "Shop Wallbox" : "Wallbox Satın Al"}
            </Link>
          </div>
        </div>

        {/* Home Charger Image & Specs Container */}
        <div className="space-y-6 max-w-lg mx-auto w-full">
          {/* New Photo */}
          <div className="aspect-[16/10] rounded-3xl overflow-hidden border border-white/10 shadow-xl bg-slate-900 group">
            <img
              src="/images/charging-home.png"
              alt="EVALIS Home Charging Wallbox"
              className="w-full h-full object-cover group-hover:scale-[1.02] transition duration-500"
            />
          </div>

          {/* Home Charger Specs Card */}
          <div className="bg-[#0b0f19]/60 border border-white/5 rounded-3xl p-8 space-y-6 shadow-xl">
            <h3 className="text-sm font-semibold tracking-wider text-white uppercase border-b border-white/5 pb-3">
              {language === "en" ? "Wallbox Specifications" : "Wallbox Teknik Özellikleri"}
            </h3>
            <div className="grid grid-cols-2 gap-6 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-widest block">Output Power</span>
                <span className="text-sm text-slate-200 mt-1 block font-mono">22 kW AC (3-Phase)</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-widest block">Connector Type</span>
                <span className="text-sm text-slate-200 mt-1 block font-mono">Type 2 (IEC 62196)</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-widest block">Voltage / Current</span>
                <span className="text-sm text-slate-200 mt-1 block font-mono">400 V / 32 A</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-widest block">Connectivity</span>
                <span className="text-sm text-slate-200 mt-1 block font-mono">Wi-Fi, BLE, OCPP</span>
              </div>
            </div>
            <div className="bg-white/5 border border-white/5 rounded-2xl p-4 text-[11px] text-slate-400 font-light leading-relaxed">
              {language === "en" 
                ? "Includes the dynamic smart power monitor, which automatically adjusts vehicle draw depending on household consumption to prevent circuit breaker trips."
                : "Ev tüketimine bağlı olarak araç çekimini otomatik olarak ayarlayan ve sigorta atmasını önleyen dinamik akıllı güç monitörünü içerir."}
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: On The Road (EVALIS Supercharger Network) */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center border-t border-white/5 pt-16">
        {/* Public Supercharger Image & Specs Container */}
        <div className="space-y-6 max-w-lg mx-auto w-full order-2 lg:order-1">
          {/* New Photo */}
          <div className="aspect-[16/10] rounded-3xl overflow-hidden border border-white/10 shadow-xl bg-slate-900 group">
            <img
              src="/images/supercharger.png"
              alt="EVALIS Supercharger Terminal"
              className="w-full h-full object-cover group-hover:scale-[1.02] transition duration-500"
            />
          </div>

          {/* Public Specs Card */}
          <div className="bg-[#0b0f19]/60 border border-white/5 rounded-3xl p-8 space-y-6 shadow-xl">
            <h3 className="text-sm font-semibold tracking-wider text-white uppercase border-b border-white/5 pb-3">
              {language === "en" ? "Supercharger Performance" : "Supercharger Performansı"}
            </h3>
            <div className="grid grid-cols-2 gap-6 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-widest block">Charging Power</span>
                <span className="text-sm text-accent mt-1 block font-mono">Up to 250 kW DC</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-widest block">Charge Rate</span>
                <span className="text-sm text-slate-200 mt-1 block font-mono">150 km in 7 mins</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-widest block">Cable System</span>
                <span className="text-sm text-slate-200 mt-1 block font-mono">Liquid-Cooled</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-widest block">Authorization</span>
                <span className="text-sm text-slate-200 mt-1 block font-mono">Plug & Charge</span>
              </div>
            </div>
            <div className="bg-white/5 border border-white/5 rounded-2xl p-4 text-[11px] text-slate-400 font-light leading-relaxed">
              {language === "en" 
                ? "All EVALIS vehicles pre-condition their battery packs automatically on the road when navigating to a Supercharger station, enabling instant peak charging rates on plug-in."
                : "Tüm EVALIS araçları, bir Supercharger istasyonuna giderken batarya paketlerini otomatik olarak ön koşullandırır ve fişe takıldığında anında en yüksek şarj hızlarına ulaşır."}
            </div>
          </div>
        </div>

        {/* Text Description */}
        <div className="space-y-6 order-1 lg:order-2">
          <span className="text-[10px] uppercase tracking-[0.25em] text-accent font-semibold block">
            {language === "en" ? "PUBLIC CHARGING" : "GENEL ŞARJ AĞI"}
          </span>
          <h2 className="text-2xl md:text-4xl font-light uppercase tracking-widest text-white leading-tight">
            {language === "en" ? "Supercharger Network" : "Supercharger Ağı"}
          </h2>
          <p className="text-sm text-slate-400 font-light leading-relaxed">
            {language === "en"
              ? "Long-distance travel is fully seamless with the EVALIS high-voltage public charging grid. Situated along major highways and key locations in Istanbul, our liquid-cooled chargers get you back on the road in minutes."
              : "EVALIS yüksek voltajlı genel şarj ağı ile uzun mesafeli seyahatler tamamen sorunsuzdur. İstanbul'daki ana otoyollar ve kilit konumlar boyunca yer alan sıvı soğutmalı şarj cihazlarımız, sizi dakikalar içinde yola geri döndürür."}
          </p>

          <ul className="space-y-3 text-xs text-slate-300 font-light">
            <li className="flex items-center gap-3">
              <span className="text-accent text-md">✔</span> 
              {language === "en" ? "Plug & Charge: No credit card sweeps, starts automatically on plug-in" : "Tak ve Şarj Et: Kredi kartı okutmaya gerek yok, fişe takıldığında otomatik başlar"}
            </li>
            <li className="flex items-center gap-3">
              <span className="text-accent text-md">✔</span> 
              {language === "en" ? "Real-time port availability display integrated directly in vehicle navigation" : "Araç navigasyonuna doğrudan entegre edilmiş gerçek zamanlı soket kullanılabilirlik göstergesi"}
            </li>
            <li className="flex items-center gap-3">
              <span className="text-accent text-md">✔</span> 
              {language === "en" ? "99.9% network uptime commitment for stress-free long journeys" : "Stresiz uzun yolculuklar için %99,9 ağ çalışma süresi taahhüdü"}
            </li>
          </ul>

          <div className="pt-4 flex gap-4">
            <Link
              to="/#find-charger"
              className="rounded-full bg-white/5 border border-white/15 px-6 py-2.5 text-xs font-semibold uppercase tracking-widest hover:bg-white/10 hover:text-white transition duration-300"
            >
              {language === "en" ? "Find Charging Terminal" : "Şarj Noktası Bul"}
            </Link>
          </div>
        </div>
      </section>

      {/* Section 3: Charging Speed Interactive Calculator */}
      <section className="space-y-12 border-t border-white/5 pt-16">
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <span className="text-xs uppercase tracking-[0.3em] text-accent font-semibold block">
            {language === "en" ? "CALCULATE SPEED" : "ŞARJ SÜRESİ HESAPLAMA"}
          </span>
          <h2 className="text-3xl font-light tracking-widest uppercase text-white">
            {language === "en" ? "CHARGE TIME ESTIMATOR" : "ŞARJ SÜRESİ HESAPLAYICI"}
          </h2>
          <p className="text-xs text-slate-400 font-light tracking-wide">
            {language === "en"
              ? "Select your model and drag target charge capacity to estimate durations depending on power ratings."
              : "Güç değerlerine göre süreleri tahmin etmek için modelinizi seçin ve hedef şarj kapasitesini sürükleyin."}
          </p>
        </div>

        {/* Calculator Widget Card */}
        <div className="bg-[#0b0f19]/40 border border-white/5 rounded-3xl p-6 md:p-10 max-w-4xl mx-auto space-y-8 shadow-2xl">
          {/* Model Selector tabs */}
          <div className="flex gap-4 border-b border-white/5 pb-4 justify-center">
            {["vector", "cloud", "bullet"].map((m) => {
              const isSelected = selectedVehicle === m;
              return (
                <button
                  key={m}
                  onClick={() => setSelectedVehicle(m as any)}
                  className={`text-xs uppercase tracking-widest font-semibold px-4 py-2 border rounded-full transition cursor-pointer ${
                    isSelected
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-white/5 hover:border-white/20 text-slate-400 hover:text-white"
                  }`}
                >
                  {m.toUpperCase()}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Left Column: Sliders */}
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="uppercase text-slate-400 tracking-wider">Target Charge Percent</span>
                  <span className="font-semibold text-white text-sm">{chargeTarget}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={chargeTarget}
                  onChange={(e) => setChargeTarget(Number(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-accent"
                />
              </div>

              {/* Specs Summary */}
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 grid grid-cols-2 gap-4 text-xs font-light">
                <div>
                  <span className="text-slate-500 uppercase tracking-widest text-[9px]">Battery Capacity</span>
                  <span className="text-slate-200 mt-1 block font-mono">{currentStats.battery} kWh</span>
                </div>
                <div>
                  <span className="text-slate-500 uppercase tracking-widest text-[9px]">Estimated Range</span>
                  <span className="text-slate-200 mt-1 block font-mono">{calculatedRange} km</span>
                </div>
              </div>
            </div>

            {/* Right Column: Speed Estimations */}
            <div className="space-y-4">
              {/* Row 1: Wall Outlet */}
              <div className="flex justify-between items-center bg-white/[0.01] border border-white/5 p-4 rounded-2xl hover:border-white/10 transition">
                <div>
                  <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">Standard Outlet</h4>
                  <p className="text-[10px] text-slate-500 font-light mt-0.5">2.3 kW AC (Grid Outlet)</p>
                </div>
                <span className="text-xs text-red-400 font-mono font-bold">
                  ~ {getChargeTimeText(2.3)}
                </span>
              </div>

              {/* Row 2: Wallbox */}
              <div className="flex justify-between items-center bg-white/[0.01] border border-white/5 p-4 rounded-2xl hover:border-white/10 transition">
                <div>
                  <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">EVALIS Wallbox</h4>
                  <p className="text-[10px] text-slate-500 font-light mt-0.5">22 kW AC (Home/Office Charger)</p>
                </div>
                <span className="text-xs text-accent font-mono font-bold">
                  ~ {getChargeTimeText(22)}
                </span>
              </div>

              {/* Row 3: Supercharger */}
              <div className="flex justify-between items-center bg-white/[0.01] border border-white/5 p-4 rounded-2xl hover:border-white/10 transition">
                <div>
                  <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">EVALIS Supercharger</h4>
                  <p className="text-[10px] text-slate-500 font-light mt-0.5">250 kW DC (High-voltage terminal)</p>
                </div>
                <span className="text-xs text-emerald-400 font-mono font-bold">
                  ~ {getChargeTimeText(250)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Smart Charging benefits */}
      <section className="space-y-12 border-t border-white/5 pt-16">
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <span className="text-xs uppercase tracking-[0.3em] text-accent font-semibold block">
            {language === "en" ? "INTELLIGENT ENERGY" : "AKILLI ENERJİ"}
          </span>
          <h2 className="text-3xl font-light tracking-widest uppercase text-white">
            {language === "en" ? "WHY CHARGE INTELLIGENTLY?" : "NEDEN AKILLI ŞARJ?"}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white/[0.01] border border-white/5 rounded-3xl p-6 space-y-4 hover:border-white/10 transition duration-300">
            <h3 className="text-sm font-semibold tracking-wider text-white uppercase">Off-Peak Cost Reduction</h3>
            <p className="text-xs text-slate-400 font-light leading-relaxed">
              {language === "en"
                ? "Schedule your EVALIS to charge during overnight hours when electrical grid tariffs are significantly cheaper, lowering your monthly energy expenditures automatically."
                : "Aylık enerji harcamalarınızı otomatik olarak düşürmek için EVALIS'inizi elektrik şebekesi tarifelerinin önemli ölçüde daha ucuz olduğu gece saatlerinde şarj olacak şekilde planlayın."}
            </p>
          </div>

          <div className="bg-white/[0.01] border border-white/5 rounded-3xl p-6 space-y-4 hover:border-white/10 transition duration-300">
            <h3 className="text-sm font-semibold tracking-wider text-white uppercase">Active Battery Conditioning</h3>
            <p className="text-xs text-slate-400 font-light leading-relaxed">
              {language === "en"
                ? "Using thermal management technologies, the charging control system heats or cools battery cells before charging, preserving battery longevity and peak cycles."
                : "Termal yönetim teknolojilerini kullanan şarj kontrol sistemi, şarjdan önce batarya hücrelerini ısıtır veya soğutur; böylece batarya ömrünü ve en yüksek döngüleri korur."}
            </p>
          </div>

          <div className="bg-white/[0.01] border border-white/5 rounded-3xl p-6 space-y-4 hover:border-white/10 transition duration-300">
            <h3 className="text-sm font-semibold tracking-wider text-white uppercase">Green Grid Optimization</h3>
            <p className="text-xs text-slate-400 font-light leading-relaxed">
              {language === "en"
                ? "EVALIS aligns charging starts to match times when renewable energy production (solar/wind) is at its peak output on the grid, maximizing environmental benefits."
                : "EVALIS, çevresel faydaları en üst düzeye çıkarmak için şarj başlangıçlarını, şebekedeki yenilenebilir enerji üretiminin (güneş/rüzgar) en yüksek olduğu zamanlara göre ayarlar."}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
export default Charging;
