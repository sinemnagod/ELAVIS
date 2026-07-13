import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { readStorage, storageKeys } from "@/lib/storage";
import sessionsData from "@/data/sessions.json";
import { ChargingSession } from "@/types";

export function EnergyDashboard() {
  const { formatPrice, language } = useLanguage();
  const { session } = useAuth();
  const userId = session?.user?.id;

  // Last 7 calendar days ending today
  const last7Dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (6 - i));
    return d;
  });

  const sessions = readStorage<ChargingSession[]>(storageKeys.sessions, sessionsData as ChargingSession[]);
  const userSessions = sessions.filter((s) => s.userId === userId && s.status === "completed");

  const locale = language === "en" ? "en-US" : "tr-TR";
  const dailyConsumption = last7Dates.map((date) => {
    const daySessions = userSessions.filter(
      (s) => new Date(s.startedAt).toDateString() === date.toDateString()
    );
    // Clamp defensively — a stray session record should never drag the totals negative
    const kwh = daySessions.reduce((acc, s) => acc + Math.max(0, s.energyKWh), 0);
    const costUSD = daySessions.reduce((acc, s) => acc + Math.max(0, s.cost), 0);
    return {
      day: date.toLocaleDateString(locale, { weekday: "short" }),
      kwh: Math.round(kwh * 10) / 10,
      costUSD: Math.round(costUSD * 100) / 100
    };
  });

  const rangeLabel = `${last7Dates[0].toLocaleDateString(locale, { month: "short", day: "numeric" })} - ${last7Dates[6].toLocaleDateString(locale, { month: "short", day: "numeric" })}`;

  const totalKwh = dailyConsumption.reduce((acc, d) => acc + d.kwh, 0);
  const totalCostUSD = dailyConsumption.reduce((acc, d) => acc + d.costUSD, 0);
  const co2SavedKg = Math.round(totalKwh * 0.475); // 0.475kg CO2 saved per kWh compared to ICE
  const treesEquivalent = Math.max(1, Math.round(co2SavedKg / 21)); // ~21kg CO2 absorbed per tree/year

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      
      {/* Header Segment */}
      <div className="dash-panel p-6">
        <h1 className="text-xl font-light uppercase tracking-widest text-slate-100">
          {language === "en" ? "Energy Analytics" : "Enerji Analitiği"}
        </h1>
        <p className="text-[9px] text-slate-500 font-light tracking-wide mt-1">
          {language === "en"
            ? "Track power grid consumption, sustainability indices, and financial savings reports."
            : "Şebeke tüketimini, sürdürülebilirlik endekslerini ve finansal tasarruf raporlarını takip edin."}
        </p>
      </div>

      {/* Analytics Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        
        {/* Total consumption */}
        <div className="dash-card p-6">
          <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold">
            {language === "en" ? "Total Consumption" : "Toplam Tüketim"}
          </span>
          <span className="text-2xl font-light text-slate-100 font-mono mt-2 block">
            {totalKwh} <span className="text-sm text-slate-450">kWh</span>
          </span>
          <span className="text-[8px] text-accent font-bold tracking-wider uppercase mt-2 block font-mono">
            {language === "en" ? "Last 7 days" : "Son 7 gün"}
          </span>
        </div>

        {/* Total Cost */}
        <div className="dash-card p-6">
          <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold">
            {language === "en" ? "Total Cost" : "Toplam Maliyet"}
          </span>
          <span className="text-2xl font-light text-slate-100 font-mono mt-2 block">
            {formatPrice(totalCostUSD, totalCostUSD * 34)}
          </span>
          <span className="text-[8px] text-slate-500 tracking-wider uppercase mt-2 block font-mono">
            {language === "en" ? "Avg." : "Ort."} {formatPrice(0.35, 12)} / kWh
          </span>
        </div>

        {/* CO2 Emissions Saved */}
        <div className="dash-card p-6">
          <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold">
            {language === "en" ? "CO2 Emissions Saved" : "Önlenen CO2 Salınımı"}
          </span>
          <span className="text-2xl font-light text-accent font-mono mt-2 block">
            {co2SavedKg} <span className="text-sm">kg</span>
          </span>
          <span className="text-[8px] text-accent font-bold tracking-wider uppercase mt-2 block font-mono">
            {language === "en"
              ? `Equivalent to ${treesEquivalent} trees planted`
              : `Dikilen ${treesEquivalent} ağaca eşdeğer`}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Weekly chart representation */}
        <div className="lg:col-span-2 dash-panel p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xs uppercase tracking-widest text-slate-450 font-bold">
              {language === "en" ? "Weekly Consumption Grid" : "Haftalık Tüketim Dağılımı"}
            </h3>
            <span className="text-[9px] text-slate-500 font-mono">{rangeLabel}</span>
          </div>

          {/* Simple custom responsive SVG bar chart in Inset plot well */}
          <div className="dash-inset p-4 rounded-2xl">
            <div className="relative h-56 w-full flex items-end justify-between px-2 pb-2">
              {dailyConsumption.map((item, i) => {
                const maxKwh = Math.max(...dailyConsumption.map((d) => d.kwh));
                // Pixel height, not a CSS percentage — the column wrapper below has no
                // explicit height of its own, so a percentage height on the bar would
                // resolve against an undefined containing block and silently collapse to 0.
                const heightPx = maxKwh > 0 ? Math.max(4, (item.kwh / maxKwh) * 160) : 0;
                return (
                  <div key={i} className="flex flex-col items-center justify-end gap-2 h-full w-[12%] group relative">
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 bg-[#0a0f18] border border-white/10 rounded-lg p-2 text-[9px] font-mono text-slate-200 opacity-0 group-hover:opacity-100 pointer-events-none transition duration-200 z-10 text-center whitespace-nowrap shadow-xl">
                      <p className="font-semibold text-accent">{item.kwh} kWh</p>
                      <p className="text-slate-450">{formatPrice(item.costUSD, item.costUSD * 34)}</p>
                    </div>
                    {/* Bar */}
                    <div
                      style={{ height: `${heightPx}px` }}
                      className={`w-full rounded-t-lg transition-all duration-700 ${
                        item.kwh > 0
                          ? "bg-accent/20 border border-accent/35 group-hover:bg-accent/30"
                          : "bg-white/5 border border-white/10"
                      }`}
                    />
                    {/* Label */}
                    <span className="text-[8px] text-slate-500 uppercase tracking-widest font-mono font-bold mt-1">
                      {item.day}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sustainability index details */}
        <div className="dash-card p-6 space-y-4">
          <h3 className="text-xs uppercase tracking-widest text-slate-400 font-bold">
            {language === "en" ? "Sustainability Score" : "Sürdürülebilirlik Skoru"}
          </h3>
          <div className="text-center py-4 space-y-2">
            <span className="text-5xl font-extralight text-accent block font-orbitron">A+</span>
            <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold">
              {language === "en" ? "Grid Eco Rating" : "Şebeke Çevre Puanı"}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-light leading-relaxed">
            {language === "en"
              ? "Your EV charging carbon intensity is minimized. 92% of your power intake was sourced from solar, wind, or low-carbon nuclear utilities during off-peak windows."
              : "Elektrikli araç şarjınızın karbon yoğunluğu en aza indirilmiştir. Güç alımınızın %92'si, yoğun olmayan saatlerde güneş, rüzgar veya düşük karbonlu nükleer santrallerden sağlanmıştır."}
          </p>
        </div>
      </div>
    </div>
  );
}
export default EnergyDashboard;
