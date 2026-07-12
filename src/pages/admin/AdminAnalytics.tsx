import { readStorage, storageKeys } from "@/lib/storage";
import { useLanguage } from "@/i18n/LanguageContext";
import ordersData from "@/data/orders.json";
import sessionsData from "@/data/sessions.json";
import stationsData from "@/data/stations.json";
import { Order, ChargingSession, Station } from "@/types";

const BAR_SLOTS = [10, 42, 74, 106, 138, 170];
const BAR_WIDTH = 16;
const CHART_HEIGHT = 90;

function buildBars(values: number[]) {
  const max = Math.max(1, ...values);
  return values.slice(0, BAR_SLOTS.length).map((value, idx) => {
    const height = Math.max(3, (value / max) * CHART_HEIGHT);
    return { x: BAR_SLOTS[idx], height, y: 100 - height };
  });
}

export function AdminAnalytics() {
  const { language } = useLanguage();
  const currency = language === "en" ? "$" : "₺";

  const orders = readStorage<Order[]>(storageKeys.orders, ordersData as Order[]);
  const sessions = readStorage<ChargingSession[]>(storageKeys.sessions, sessionsData as ChargingSession[]);
  const stations = readStorage<Station[]>(storageKeys.stations, stationsData as Station[]);

  // Revenue grouped by month (YYYY-MM), chronological, last 6 months of data
  const revenueByMonth = new Map<string, number>();
  orders.forEach((o) => {
    const monthKey = new Date(o.createdAt).toLocaleDateString(language === "en" ? "en-US" : "tr-TR", {
      month: "short"
    });
    revenueByMonth.set(monthKey, (revenueByMonth.get(monthKey) || 0) + o.subtotal);
  });
  const revenueEntries = [...revenueByMonth.entries()].slice(-6);
  const revenueBars = buildBars(revenueEntries.map(([, v]) => v));

  // Energy delivered grouped by station, top 6
  const energyByStation = new Map<string, number>();
  sessions.forEach((s) => {
    energyByStation.set(s.stationId, (energyByStation.get(s.stationId) || 0) + s.energyKWh);
  });
  const stationEntries = [...energyByStation.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const stationBars = buildBars(stationEntries.map(([, v]) => v));

  const totalRevenue = orders.reduce((acc, o) => acc + o.subtotal, 0);
  const totalEnergy = sessions.reduce((acc, s) => acc + s.energyKWh, 0);
  const avgOrderValue = orders.length ? totalRevenue / orders.length : 0;
  const completedSessions = sessions.filter((s) => s.status === "completed").length;

  return (
    <div className="space-y-8 animate-fade-in text-slate-800 dark:text-slate-100">
      <div>
        <h1 className="text-2xl font-light uppercase tracking-widest text-slate-800 dark:text-white">
          {language === "en" ? "System Analytics" : "Sistem Analitiği"}
        </h1>
        <p className="text-[10px] text-slate-500 font-light tracking-wide mt-1">
          {language === "en"
            ? "Review business revenues, station grid utilization logs, and platform conversions."
            : "İşletme gelirlerini, istasyon kullanım kayıtlarını ve platform dönüşümlerini inceleyin."}
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="dash-card p-5 space-y-2">
          <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold">
            {language === "en" ? "Total Orders" : "Toplam Sipariş"}
          </span>
          <span className="text-2xl font-light text-slate-800 dark:text-white font-mono block">{orders.length}</span>
        </div>
        <div className="dash-card p-5 space-y-2">
          <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold">
            {language === "en" ? "Avg Order Value" : "Ortalama Sipariş"}
          </span>
          <span className="text-2xl font-light text-slate-800 dark:text-white font-mono block">
            {currency}{avgOrderValue.toFixed(0)}
          </span>
        </div>
        <div className="dash-card p-5 space-y-2">
          <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold">
            {language === "en" ? "Completed Sessions" : "Tamamlanan Seans"}
          </span>
          <span className="text-2xl font-light text-slate-800 dark:text-white font-mono block">{completedSessions}</span>
        </div>
        <div className="dash-card p-5 space-y-2">
          <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold">
            {language === "en" ? "Total Energy Delivered" : "Toplam Enerji"}
          </span>
          <span className="text-2xl font-light text-slate-800 dark:text-white font-mono block">{totalEnergy.toFixed(0)} kWh</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Revenue Distribution SVG */}
        <div className="dash-panel p-6 shadow-md space-y-4">
          <h3 className="text-xs uppercase tracking-[0.25em] text-slate-600 dark:text-slate-450 font-bold block pb-2 border-b border-slate-200 dark:border-white/5">
            {language === "en" ? `Store Revenue Streams (${currency})` : `Mağaza Gelir Akışı (${currency})`}
          </h3>
          {revenueEntries.length === 0 ? (
            <p className="text-[10px] text-slate-500 uppercase tracking-widest text-center py-14 font-light">
              {language === "en" ? "No order data yet" : "Henüz sipariş verisi yok"}
            </p>
          ) : (
            <div className="w-full flex flex-col justify-end">
              <svg className="w-full h-44" viewBox="0 0 200 100" preserveAspectRatio="none">
                <line x1="0" y1="20" x2="200" y2="20" stroke="rgba(0, 0, 0, 0.05)" strokeWidth="1" className="dark:stroke-white/5" />
                <line x1="0" y1="55" x2="200" y2="55" stroke="rgba(0, 0, 0, 0.05)" strokeWidth="1" className="dark:stroke-white/5" />
                <line x1="0" y1="90" x2="200" y2="90" stroke="rgba(0, 0, 0, 0.05)" strokeWidth="1" className="dark:stroke-white/5" />
                {revenueBars.map((bar, idx) => (
                  <rect
                    key={idx}
                    x={bar.x}
                    y={bar.y}
                    width={BAR_WIDTH}
                    height={bar.height}
                    rx="3"
                    fill={idx === revenueBars.length - 1 ? "var(--color-accent, #2a7a5f)" : "currentColor"}
                    className={idx === revenueBars.length - 1 ? "" : "text-slate-300/40 dark:text-white/5"}
                  />
                ))}
              </svg>
              <div className="flex justify-between items-center text-[8px] text-slate-500 font-bold tracking-wider uppercase mt-3 px-1">
                {revenueEntries.map(([month]) => (
                  <span key={month}>{month}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Station Energy SVG */}
        <div className="dash-panel p-6 shadow-md space-y-4">
          <h3 className="text-xs uppercase tracking-[0.25em] text-slate-600 dark:text-slate-450 font-bold block pb-2 border-b border-slate-200 dark:border-white/5">
            {language === "en" ? "Supercharger Energy Output (kWh)" : "Şarj İstasyonu Enerji Çıkışı (kWh)"}
          </h3>
          {stationEntries.length === 0 ? (
            <p className="text-[10px] text-slate-500 uppercase tracking-widest text-center py-14 font-light">
              {language === "en" ? "No session data yet" : "Henüz seans verisi yok"}
            </p>
          ) : (
            <div className="w-full flex flex-col justify-end">
              <svg className="w-full h-44" viewBox="0 0 200 100" preserveAspectRatio="none">
                <line x1="0" y1="20" x2="200" y2="20" stroke="rgba(0, 0, 0, 0.05)" strokeWidth="1" className="dark:stroke-white/5" />
                <line x1="0" y1="55" x2="200" y2="55" stroke="rgba(0, 0, 0, 0.05)" strokeWidth="1" className="dark:stroke-white/5" />
                <line x1="0" y1="90" x2="200" y2="90" stroke="rgba(0, 0, 0, 0.05)" strokeWidth="1" className="dark:stroke-white/5" />
                {stationBars.map((bar, idx) => (
                  <rect
                    key={idx}
                    x={bar.x}
                    y={bar.y}
                    width={BAR_WIDTH}
                    height={bar.height}
                    rx="3"
                    fill={idx === 0 ? "red" : "currentColor"}
                    opacity={idx === 0 ? 0.75 : undefined}
                    className={idx === 0 ? "" : "text-slate-300/40 dark:text-white/5"}
                  />
                ))}
              </svg>
              <div className="flex justify-between items-center text-[8px] text-slate-500 font-bold tracking-wider uppercase mt-3 px-1">
                {stationEntries.map(([stationId]) => {
                  const station = stations.find((s) => s.id === stationId);
                  return <span key={stationId}>{station?.name || stationId}</span>;
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
export default AdminAnalytics;
