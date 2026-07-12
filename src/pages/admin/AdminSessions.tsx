import { useState, useEffect } from "react";
import { readStorage, storageKeys } from "@/lib/storage";
import { useLanguage } from "@/i18n/LanguageContext";
import sessionsData from "@/data/sessions.json";
import usersData from "@/data/users.json";
import vehiclesData from "@/data/vehicles.json";
import stationsData from "@/data/stations.json";
import { ChargingSession, User, Vehicle, Station } from "@/types";

function loadSessions(): ChargingSession[] {
  return readStorage<ChargingSession[]>(storageKeys.sessions, sessionsData as ChargingSession[]);
}

export function AdminSessions() {
  const { formatPrice, language } = useLanguage();

  // Load sessions list, refreshing when other tabs/pages write new sessions
  const [sessions, setSessions] = useState<ChargingSession[]>(loadSessions);

  useEffect(() => {
    const handleSync = () => setSessions(loadSessions());
    window.addEventListener("storage", handleSync);
    window.addEventListener("evalis:sessionsUpdated", handleSync);
    return () => {
      window.removeEventListener("storage", handleSync);
      window.removeEventListener("evalis:sessionsUpdated", handleSync);
    };
  }, []);

  const users = usersData as User[];
  const vehicles = vehiclesData as Vehicle[];
  const stations = stationsData as Station[];

  // Filter states
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  const filteredSessions = sessions.filter((s) => {
    const customer = users.find((u) => u.id === s.userId);
    const userMatch = !selectedUser || 
      customer?.name.toLowerCase().includes(selectedUser.toLowerCase()) ||
      customer?.email.toLowerCase().includes(selectedUser.toLowerCase());
    const vehicleMatch = !selectedVehicle || s.vehicleId === selectedVehicle;
    const statusMatch = !selectedStatus || s.status === selectedStatus;
    
    return userMatch && vehicleMatch && statusMatch;
  });

  // Metric summaries
  const totalEnergy = filteredSessions.reduce((acc, s) => acc + s.energyKWh, 0);
  const totalRevenue = filteredSessions.reduce((acc, s) => acc + s.cost, 0);
  const completedCount = filteredSessions.filter((s) => s.status === "completed").length;

  return (
    <div className="space-y-6 animate-fade-in pb-10 text-slate-800 dark:text-slate-100">
      
      {/* Header Segment */}
      <div className="dash-panel p-6">
        <h1 className="text-xl font-light uppercase tracking-widest text-slate-800 dark:text-white">
          {language === "en" ? "Grid Charging Sessions" : "Şebeke Şarj Seansları"}
        </h1>
        <p className="text-[9px] text-slate-500 font-light tracking-wide mt-1">
          {language === "en"
            ? "Review, filter, and audit active and historic charging grid transactions across the fleet."
            : "Filodaki aktif ve geçmiş şarj seansı işlemlerini inceleyin, filtreleyin ve denetleyin."}
        </p>
      </div>

      {/* Grid Summaries */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="dash-card p-6 shadow-md">
          <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold">
            {language === "en" ? "Total Energy Delivered" : "Toplam Aktarılan Enerji"}
          </span>
          <span className="text-2xl font-light text-slate-800 dark:text-slate-100 font-mono mt-2 block">
            {totalEnergy.toFixed(1)} kWh
          </span>
        </div>
        <div className="dash-card p-6 shadow-md">
          <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold">
            {language === "en" ? "Gross Revenues" : "Brüt Gelir"}
          </span>
          <span className="text-2xl font-light text-slate-800 dark:text-slate-100 font-mono mt-2 block">
            {formatPrice(totalRevenue, totalRevenue * 34)}
          </span>
        </div>
        <div className="dash-card p-6 shadow-md">
          <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold">
            {language === "en" ? "Completed Transactions" : "Tamamlanan İşlemler"}
          </span>
          <span className="text-2xl font-light text-slate-800 dark:text-slate-100 font-mono mt-2 block">
            {completedCount} {language === "en" ? "sessions" : "seans"}
          </span>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="dash-panel p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* User Filter */}
        <div className="space-y-1">
          <label className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold">
            {language === "en" ? "Search Customer" : "Müşteri Ara"}
          </label>
          <input
            type="text"
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            placeholder={language === "en" ? "Name or email..." : "Ad veya e-posta..."}
            className="w-full bg-slate-100/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-accent/40 transition"
          />
        </div>

        {/* Vehicle Filter */}
        <div className="space-y-1">
          <label className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold">
            {language === "en" ? "Vehicle Model" : "Araç Modeli"}
          </label>
          <select
            value={selectedVehicle}
            onChange={(e) => setSelectedVehicle(e.target.value)}
            className="w-full bg-slate-100/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-accent/40 transition"
          >
            <option value="" className="bg-white dark:bg-[#0a0f18] text-slate-800 dark:text-slate-200">
              {language === "en" ? "All Models" : "Tüm Modeller"}
            </option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id} className="bg-white dark:bg-[#0a0f18] text-slate-800 dark:text-slate-200">
                {v.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="space-y-1">
          <label className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold">
            {language === "en" ? "Status" : "Durum"}
          </label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full bg-slate-100/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-accent/40 transition"
          >
            <option value="" className="bg-white dark:bg-[#0a0f18] text-slate-800 dark:text-slate-200">
              {language === "en" ? "All Statuses" : "Tüm Durumlar"}
            </option>
            <option value="completed" className="bg-white dark:bg-[#0a0f18] text-slate-800 dark:text-slate-200">
              {language === "en" ? "Completed" : "Tamamlandı"}
            </option>
            <option value="charging" className="bg-white dark:bg-[#0a0f18] text-slate-800 dark:text-slate-200">
              {language === "en" ? "Charging" : "Şarj Oluyor"}
            </option>
          </select>
        </div>
      </div>

      {/* Sessions list */}
      <div className="dash-panel overflow-hidden shadow-lg">
        {filteredSessions.length === 0 ? (
          <p className="text-xs text-slate-500 uppercase tracking-widest text-center py-20 font-light">
            {language === "en" ? "No grid sessions found in logs" : "Günlüklerde şarj seansı bulunamadı"}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-light text-slate-500 dark:text-slate-400">
              <thead className="bg-slate-100/80 dark:bg-[#0e1423]/25 text-slate-600 dark:text-slate-450 uppercase tracking-widest text-[9px] font-bold border-b border-slate-200 dark:border-white/5">
                <tr>
                  <th className="px-6 py-4">{language === "en" ? "Session ID" : "Seans Kodu"}</th>
                  <th className="px-6 py-4">{language === "en" ? "Customer" : "Müşteri"}</th>
                  <th className="px-6 py-4">{language === "en" ? "Vehicle Model" : "Araç Modeli"}</th>
                  <th className="px-6 py-4">{language === "en" ? "Station Terminal" : "Şarj İstasyonu"}</th>
                  <th className="px-6 py-4">{language === "en" ? "Energy" : "Enerji"}</th>
                  <th className="px-6 py-4">{language === "en" ? "Invoice Cost" : "Fatura Tutarı"}</th>
                  <th className="px-6 py-4 text-right">{language === "en" ? "Status" : "Durum"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 dark:divide-white/5 font-mono text-[11px]">
                {filteredSessions.map((sess) => {
                  const customer = users.find((u) => u.id === sess.userId);
                  const vehicleObj = vehicles.find((v) => v.id === sess.vehicleId);
                  const stationObj = stations.find((s) => s.id === sess.stationId);
                  
                  return (
                    <tr key={sess.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.01] transition duration-200">
                      <td className="px-6 py-4 font-semibold text-slate-400 dark:text-slate-450">{sess.id}</td>
                      <td className="px-6 py-4 font-sans">
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{customer ? customer.name : sess.userId}</p>
                        <p className="text-[9px] text-slate-500 font-mono mt-0.5">{customer?.email}</p>
                      </td>
                      <td className="px-6 py-4 font-sans font-semibold text-slate-650 dark:text-slate-350 uppercase tracking-wider text-xs">
                        {vehicleObj ? vehicleObj.name : sess.vehicleId}
                      </td>
                      <td className="px-6 py-4 font-sans font-semibold text-slate-650 dark:text-slate-350 uppercase tracking-wider text-xs">
                        {stationObj ? stationObj.name : "EVALIS Supercharger"}
                      </td>
                      <td className="px-6 py-4 text-slate-700 dark:text-slate-200">{sess.energyKWh} kWh</td>
                      <td className="px-6 py-4 text-accent font-semibold">
                        {formatPrice(sess.cost, sess.cost * 34)}
                      </td>
                      <td className="px-6 py-4 text-right font-sans">
                        <span className="px-2.5 py-0.5 rounded-full text-[8px] font-bold tracking-widest uppercase bg-accent/10 border border-accent/20 text-accent">
                          {sess.status}
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
    </div>
  );
}
export default AdminSessions;
