import { useEffect, useState } from "react";
import { readStorage, storageKeys } from "@/lib/storage";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import sessionsData from "@/data/sessions.json";
import stationsData from "@/data/stations.json";
import vehiclesData from "@/data/vehicles.json";
import { ChargingSession, Station, Vehicle } from "@/types";

function loadSessions(): ChargingSession[] {
  return readStorage<ChargingSession[]>(storageKeys.sessions, sessionsData as ChargingSession[]);
}

export function ChargingHistory() {
  const { formatPrice, language } = useLanguage();
  const { session } = useAuth();
  const userId = session?.user.id;

  const stations = stationsData as Station[];
  const vehicles = vehiclesData as Vehicle[];

  // Load sessions, refreshing when new sessions are created elsewhere (live charging, etc.)
  const [allSessions, setAllSessions] = useState<ChargingSession[]>(loadSessions);

  useEffect(() => {
    const handleSync = () => setAllSessions(loadSessions());
    window.addEventListener("storage", handleSync);
    window.addEventListener("evalis:sessionsUpdated", handleSync);
    return () => {
      window.removeEventListener("storage", handleSync);
      window.removeEventListener("evalis:sessionsUpdated", handleSync);
    };
  }, []);

  const [vehicleFilter, setVehicleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedSession, setSelectedSession] = useState<ChargingSession | null>(null);

  const userSessions = allSessions
    .filter((s) => s.userId === userId)
    .filter((s) => !vehicleFilter || s.vehicleId === vehicleFilter)
    .filter((s) => !statusFilter || s.status === statusFilter)
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

  const ownedVehicles = vehicles.filter((v) => session?.user.ownedVehicleIds?.includes(v.id));

  return (
    <div className="space-y-8 animate-fade-in pb-10">

      {/* Header Segment */}
      <div className="dash-panel p-6">
        <h1 className="text-xl font-light uppercase tracking-widest text-slate-100">
          {language === "en" ? "Charging History" : "Şarj Geçmişi"}
        </h1>
        <p className="text-[9px] text-slate-500 font-light tracking-wide mt-1">
          {language === "en"
            ? "Review details, power consumption logs, and transaction invoices of your previous charging sessions."
            : "Önceki şarj seanslarınızın ayrıntılarını, güç tüketim günlüklerini ve faturalarını inceleyin."}
        </p>
      </div>

      {/* Filters Toolbar */}
      <div className="dash-panel p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold">
            {language === "en" ? "Vehicle" : "Araç"}
          </label>
          <select
            value={vehicleFilter}
            onChange={(e) => setVehicleFilter(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-slate-200 outline-none focus:border-accent/40 transition"
          >
            <option value="" className="bg-[#0a0f18] text-slate-200">
              {language === "en" ? "All Vehicles" : "Tüm Araçlar"}
            </option>
            {(ownedVehicles.length > 0 ? ownedVehicles : vehicles).map((v) => (
              <option key={v.id} value={v.id} className="bg-[#0a0f18] text-slate-200">
                {v.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold">
            {language === "en" ? "Status" : "Durum"}
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-slate-200 outline-none focus:border-accent/40 transition"
          >
            <option value="" className="bg-[#0a0f18] text-slate-200">
              {language === "en" ? "All Statuses" : "Tüm Durumlar"}
            </option>
            <option value="completed" className="bg-[#0a0f18] text-slate-200">
              {language === "en" ? "Completed" : "Tamamlandı"}
            </option>
            <option value="charging" className="bg-[#0a0f18] text-slate-200">
              {language === "en" ? "Charging" : "Şarj Oluyor"}
            </option>
          </select>
        </div>
      </div>

      {/* Sessions list */}
      <div className="dash-panel overflow-hidden shadow-lg">
        {userSessions.length === 0 ? (
          <p className="text-xs text-slate-500 uppercase tracking-widest text-center py-20 font-light">
            {allSessions.filter((s) => s.userId === userId).length === 0
              ? (language === "en" ? "No charging sessions logged" : "Kayıtlı şarj seansı bulunmuyor")
              : (language === "en" ? "No sessions match this filter" : "Bu filtreyle eşleşen seans yok")}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-light text-slate-400">
              <thead className="bg-[#0e1423]/20 text-slate-450 uppercase tracking-widest text-[9px] font-bold border-b border-white/5">
                <tr>
                  <th className="px-6 py-4">{language === "en" ? "Session ID" : "Seans Kodu"}</th>
                  <th className="px-6 py-4">{language === "en" ? "Station" : "İstasyon"}</th>
                  <th className="px-6 py-4">{language === "en" ? "Duration" : "Süre / Tarih"}</th>
                  <th className="px-6 py-4">{language === "en" ? "Energy" : "Enerji"}</th>
                  <th className="px-6 py-4">{language === "en" ? "Cost" : "Maliyet"}</th>
                  <th className="px-6 py-4 text-right">{language === "en" ? "Status" : "Durum"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono text-[11px]">
                {userSessions.map((sess) => {
                  const stationObj = stations.find((s) => s.id === sess.stationId);
                  const started = new Date(sess.startedAt);
                  const ended = new Date(sess.endedAt || sess.startedAt);
                  const durationMins = Math.round((ended.getTime() - started.getTime()) / 60000);

                  return (
                    <tr
                      key={sess.id}
                      onClick={() => setSelectedSession(sess)}
                      className="hover:bg-white/[0.01] transition duration-200 cursor-pointer"
                    >
                      <td className="px-6 py-4 font-semibold text-slate-450">{sess.id}</td>
                      <td className="px-6 py-4 font-sans">
                        <p className="font-semibold text-slate-200 uppercase tracking-wider text-xs">
                          {stationObj ? stationObj.name : "EVALIS Charger"}
                        </p>
                        <p className="text-[9px] text-slate-500 font-mono mt-0.5">
                          {stationObj ? `${stationObj.type} (${stationObj.connector})` : "DC (CCS2)"}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-slate-400 font-sans">
                        <span className="font-mono">{started.toLocaleDateString()}</span>
                        <span className="text-slate-500 mx-2">|</span>
                        <span>{durationMins} {language === "en" ? "mins" : "dk"}</span>
                      </td>
                      <td className="px-6 py-4 text-slate-250">{sess.energyKWh} kWh</td>
                      <td className="px-6 py-4 text-accent font-semibold">
                        {formatPrice(sess.cost, sess.cost * 34)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="px-2.5 py-0.5 rounded-full text-[8px] font-bold tracking-widest uppercase bg-accent/10 border border-accent/20 text-accent font-sans">
                          {sess.status === "completed"
                            ? (language === "en" ? "Completed" : "Tamamlandı")
                            : (language === "en" ? "Charging" : "Şarj Oluyor")}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Session Detail / Invoice Modal */}
      {selectedSession && (() => {
        const stationObj = stations.find((s) => s.id === selectedSession.stationId);
        const vehicleObj = vehicles.find((v) => v.id === selectedSession.vehicleId);
        const started = new Date(selectedSession.startedAt);
        const ended = new Date(selectedSession.endedAt || selectedSession.startedAt);
        const durationMins = Math.round((ended.getTime() - started.getTime()) / 60000);

        return (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6"
            onClick={() => setSelectedSession(null)}
          >
            <div
              className="dash-panel max-w-md w-full p-6 space-y-5 shadow-2xl bg-[#0e1423]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <h3 className="text-xs font-bold tracking-wider text-white uppercase font-mono">
                  {selectedSession.id}
                </h3>
                <button
                  onClick={() => setSelectedSession(null)}
                  aria-label={language === "en" ? "Close" : "Kapat"}
                  className="text-slate-450 hover:text-white text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 uppercase tracking-widest text-[9px] font-bold">
                    {language === "en" ? "Vehicle" : "Araç"}
                  </span>
                  <span className="font-mono text-slate-200">{vehicleObj?.name || selectedSession.vehicleId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 uppercase tracking-widest text-[9px] font-bold">
                    {language === "en" ? "Station" : "İstasyon"}
                  </span>
                  <span className="font-mono text-slate-200">{stationObj?.name || selectedSession.stationId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 uppercase tracking-widest text-[9px] font-bold">
                    {language === "en" ? "Started" : "Başlangıç"}
                  </span>
                  <span className="font-mono text-slate-200">{started.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 uppercase tracking-widest text-[9px] font-bold">
                    {language === "en" ? "Ended" : "Bitiş"}
                  </span>
                  <span className="font-mono text-slate-200">
                    {selectedSession.endedAt ? ended.toLocaleString() : (language === "en" ? "In progress" : "Devam ediyor")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 uppercase tracking-widest text-[9px] font-bold">
                    {language === "en" ? "Duration" : "Süre"}
                  </span>
                  <span className="font-mono text-slate-200">{durationMins} {language === "en" ? "mins" : "dk"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 uppercase tracking-widest text-[9px] font-bold">
                    {language === "en" ? "Energy Delivered" : "Aktarılan Enerji"}
                  </span>
                  <span className="font-mono text-slate-200">{selectedSession.energyKWh} kWh</span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-white/5 text-sm">
                <span className="text-slate-500 uppercase tracking-widest text-[9px] font-bold">
                  {language === "en" ? "Total Cost" : "Toplam Tutar"}
                </span>
                <span className="text-accent font-mono font-bold text-lg">
                  {formatPrice(selectedSession.cost, selectedSession.cost * 34)}
                </span>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
export default ChargingHistory;
