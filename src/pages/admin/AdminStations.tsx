import { useState, useEffect } from "react";
import { readStorage, writeStorage, storageKeys } from "@/lib/storage";
import stationsData from "@/data/stations.json";
import { Station } from "@/types";
import { useToast } from "@/context/ToastContext";
import { useLanguage } from "@/i18n/LanguageContext";

export function AdminStations() {
  const { showToast, confirmToast } = useToast();
  const { language } = useLanguage();

  // Load stations from storage or fall back to seed JSON
  const [stations, setStations] = useState<Station[]>(() => {
    const stored = readStorage<Station[]>(storageKeys.stations, []);
    if (stored.length === 0 || stored.some((s) => !s.type)) {
      writeStorage(storageKeys.stations, stationsData as Station[]);
      return stationsData as Station[];
    }
    return stored;
  });

  // Load reservations map
  const [allReservations, setAllReservations] = useState<Record<string, string[]>>(() =>
    readStorage<Record<string, string[]>>(storageKeys.allReservations, {})
  );

  useEffect(() => {
    writeStorage(storageKeys.stations, stations);
  }, [stations]);

  // Sync reservations periodically
  useEffect(() => {
    setAllReservations(readStorage<Record<string, string[]>>(storageKeys.allReservations, {}));
  }, [stations]);

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStation, setEditingStation] = useState<Station | null>(null);

  // Input states
  const [name, setName] = useState("");
  const [latitude, setLatitude] = useState(41.0082);
  const [longitude, setLongitude] = useState(28.9784);
  const [power, setPower] = useState("250 kW");
  const [totalPorts, setTotalPorts] = useState(8);
  const [availablePorts, setAvailablePorts] = useState(8);
  const [status, setStatus] = useState<"active" | "maintenance">("active");
  const [type, setType] = useState<Station["type"]>("DC");
  const [connector, setConnector] = useState<Station["connector"]>("CCS2");

  // Filters state
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");

  // Reset form inputs
  const resetForm = () => {
    setName("");
    setLatitude(41.0082);
    setLongitude(28.9784);
    setPower("250 kW");
    setTotalPorts(8);
    setAvailablePorts(8);
    setStatus("active");
    setType("DC");
    setConnector("CCS2");
    setEditingStation(null);
    setIsFormOpen(false);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const handleOpenEdit = (station: Station) => {
    setEditingStation(station);
    setName(station.name);
    setLatitude(station.latitude);
    setLongitude(station.longitude);
    setPower(station.power);
    setTotalPorts(station.totalPorts);
    setAvailablePorts(station.availablePorts);
    setStatus(station.status);
    setType(station.type || "DC");
    setConnector(station.connector || "CCS2");
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    if (editingStation) {
      setStations((prev) =>
        prev.map((s) =>
          s.id === editingStation.id
            ? {
                ...s,
                name,
                latitude: Number(latitude),
                longitude: Number(longitude),
                power,
                totalPorts: Number(totalPorts),
                availablePorts: Math.min(Number(availablePorts), Number(totalPorts)),
                status,
                type,
                connector
              }
            : s
        )
      );
      showToast(
        language === "en" ? "Station updated successfully" : "İstasyon başarıyla güncellendi",
        "success"
      );
    } else {
      const newStation: Station = {
        id: "sta-" + Date.now().toString().slice(-6),
        name,
        latitude: Number(latitude),
        longitude: Number(longitude),
        power,
        totalPorts: Number(totalPorts),
        availablePorts: Math.min(Number(availablePorts), Number(totalPorts)),
        status,
        type,
        connector
      };
      setStations((prev) => [...prev, newStation]);
      showToast(
        language === "en" ? "Station created successfully" : "İstasyon başarıyla oluşturuldu",
        "success"
      );
    }
    resetForm();
  };

  const handleDelete = async (stationId: string) => {
    const msg = language === "en"
      ? "Are you sure you want to delete this charging station?"
      : "Bu şarj istasyonunu silmek istediğinizden emin misiniz?";
    const confirmed = await confirmToast(msg, {
      confirmLabel: language === "en" ? "Delete" : "Sil",
      cancelLabel: language === "en" ? "Cancel" : "Vazgeç",
      tone: "danger"
    });
    if (confirmed) {
      setStations((prev) => prev.filter((s) => s.id !== stationId));
      showToast(
        language === "en" ? "Station deleted successfully" : "İstasyon silindi",
        "info"
      );
    }
  };

  const handleToggleStatus = (stationId: string) => {
    setStations((prev) =>
      prev.map((s) => {
        if (s.id === stationId) {
          const nextStatus = s.status === "active" ? "maintenance" : "active";
          showToast(
            language === "en" 
              ? `Station set to ${nextStatus}` 
              : `İstasyon durumu ${nextStatus === "active" ? "aktif" : "bakımda"} olarak güncellendi`,
            "info"
          );
          return {
            ...s,
            status: nextStatus,
            availablePorts: nextStatus === "maintenance" ? 0 : s.totalPorts
          };
        }
        return s;
      })
    );
  };

  // Filter stations logic
  const filteredStations = stations.filter((s) => {
    const matchStatus = statusFilter === "ALL" || s.status === statusFilter;
    const matchType = typeFilter === "ALL" || s.type === typeFilter;
    return matchStatus && matchType;
  });

  return (
    <div className="space-y-6 animate-fade-in pb-12 text-slate-800 dark:text-slate-100">
      
      {/* Header Segment */}
      <div className="dash-panel p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-light uppercase tracking-widest text-slate-800 dark:text-white">
            {language === "en" ? "Charging Grid Status" : "Şarj Şebeke Yönetimi"}
          </h1>
          <p className="text-[9px] text-slate-500 font-light tracking-wide mt-1">
            {language === "en"
              ? "Monitor and configure supercharger grid coordinates, availability ratios, and offline status triggers."
              : "Süperşarj koordinatlarını, doluluk oranlarını ve çevrimdışı durum tetikleyicilerini izleyin ve yapılandırın."}
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="rounded-full bg-accent text-black px-6 py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-[#348c70] transition duration-300 cursor-pointer"
        >
          {language === "en" ? "Add New Station" : "Yeni İstasyon Ekle"}
        </button>
      </div>

      {/* Filters Toolbar */}
      <div className="dash-panel p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Status filter */}
        <div className="space-y-1">
          <label className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold">
            {language === "en" ? "Filter by Status" : "Duruma Göre Filtrele"}
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-slate-100/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-accent/40 transition"
          >
            <option value="ALL" className="bg-white dark:bg-[#0a0f18] text-slate-800 dark:text-slate-200">{language === "en" ? "All Statuses" : "Tüm Durumlar"}</option>
            <option value="active" className="bg-white dark:bg-[#0a0f18] text-slate-800 dark:text-slate-200">{language === "en" ? "Active (Online)" : "Aktif (Çevrimiçi)"}</option>
            <option value="maintenance" className="bg-white dark:bg-[#0a0f18] text-slate-800 dark:text-slate-200">{language === "en" ? "Maintenance" : "Bakımda"}</option>
          </select>
        </div>

        {/* Type filter */}
        <div className="space-y-1">
          <label className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold">
            {language === "en" ? "Filter by Charger Type" : "Şarj Tipi Filtrele"}
          </label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full bg-slate-100/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-accent/40 transition"
          >
            <option value="ALL" className="bg-white dark:bg-[#0a0f18] text-slate-800 dark:text-slate-200">{language === "en" ? "All Types" : "Tüm Tipler"}</option>
            <option value="DC" className="bg-white dark:bg-[#0a0f18] text-slate-800 dark:text-slate-200">DC (Fast Charging)</option>
            <option value="AC" className="bg-white dark:bg-[#0a0f18] text-slate-800 dark:text-slate-200">AC (Slow Charging)</option>
          </select>
        </div>
      </div>

      {/* CRUD Form overlay card */}
      {isFormOpen && (
        <div className="dash-panel p-6 space-y-6 shadow-2xl animate-fade-in border-accent/25 bg-white dark:bg-[#0e1423]">
          <div className="flex justify-between items-center border-b border-slate-200 dark:border-white/5 pb-3">
            <h3 className="text-xs font-bold tracking-wider text-slate-800 dark:text-white uppercase">
              {editingStation 
                ? (language === "en" ? `Edit Station (${editingStation.id})` : `İstasyonu Düzenle (${editingStation.id})`) 
                : (language === "en" ? "Create New Charger Station" : "Yeni Şarj İstasyonu Oluştur")}
            </h3>
            <button
              onClick={resetForm}
              aria-label={language === "en" ? "Close form" : "Formu kapat"}
              className="text-slate-450 hover:text-slate-700 dark:hover:text-white text-sm cursor-pointer"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs font-light text-slate-700 dark:text-slate-350">
            <div className="space-y-2 md:col-span-2">
              <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold">
                {language === "en" ? "Station Location Name" : "İstasyon Lokasyon Adı"}
              </span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. EVALIS Kadıköy Supercharger"
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-4 py-2.5 text-slate-800 dark:text-slate-200 outline-none focus:border-accent"
                required
              />
            </div>

            <div className="space-y-2">
              <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold">
                {language === "en" ? "Charging Power (kW)" : "Şarj Gücü (kW)"}
              </span>
              <input
                type="text"
                value={power}
                onChange={(e) => setPower(e.target.value)}
                placeholder="e.g. 250 kW"
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-4 py-2.5 text-slate-800 dark:text-slate-200 outline-none focus:border-accent"
                required
              />
            </div>

            <div className="space-y-2">
              <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold">Latitude</span>
              <input
                type="number"
                step="any"
                value={latitude}
                onChange={(e) => setLatitude(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-4 py-2.5 text-slate-800 dark:text-slate-200 outline-none focus:border-accent font-mono"
                required
              />
            </div>

            <div className="space-y-2">
              <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold">Longitude</span>
              <input
                type="number"
                step="any"
                value={longitude}
                onChange={(e) => setLongitude(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-4 py-2.5 text-slate-800 dark:text-slate-200 outline-none focus:border-accent font-mono"
                required
              />
            </div>

            <div className="space-y-2">
              <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold">Status</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as "active" | "maintenance")}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-4 py-2.5 text-slate-800 dark:text-slate-200 outline-none focus:border-accent"
              >
                <option value="active" className="bg-white dark:bg-[#0a0f18] text-slate-800 dark:text-slate-200">{language === "en" ? "Active (Online)" : "Aktif (Çevrimiçi)"}</option>
                <option value="maintenance" className="bg-white dark:bg-[#0a0f18] text-slate-800 dark:text-slate-200">{language === "en" ? "Maintenance (Offline)" : "Bakımda (Çevrimdışı)"}</option>
              </select>
            </div>

            <div className="space-y-2">
              <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold">Charger Type</span>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as Station["type"])}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-4 py-2.5 text-slate-800 dark:text-slate-200 outline-none focus:border-accent"
              >
                <option value="DC" className="bg-white dark:bg-[#0a0f18] text-slate-800 dark:text-slate-200">DC (Fast Charging)</option>
                <option value="AC" className="bg-white dark:bg-[#0a0f18] text-slate-800 dark:text-slate-200">AC (Slow/Standard)</option>
              </select>
            </div>

            <div className="space-y-2">
              <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold">Connector Standard</span>
              <select
                value={connector}
                onChange={(e) => setConnector(e.target.value as Station["connector"])}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-4 py-2.5 text-slate-800 dark:text-slate-200 outline-none focus:border-accent"
              >
                <option value="CCS2" className="bg-white dark:bg-[#0a0f18] text-slate-800 dark:text-slate-200">CCS2 (Standard DC)</option>
                <option value="Type 2" className="bg-white dark:bg-[#0a0f18] text-slate-800 dark:text-slate-200">Type 2 (Standard AC)</option>
                <option value="NACS" className="bg-white dark:bg-[#0a0f18] text-slate-800 dark:text-slate-200">NACS (Tesla Global)</option>
              </select>
            </div>

            <div className="space-y-2">
              <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold">
                {language === "en" ? "Total Ports" : "Toplam Soket"}
              </span>
              <input
                type="number"
                value={totalPorts}
                onChange={(e) => setTotalPorts(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-4 py-2.5 text-slate-800 dark:text-slate-200 outline-none focus:border-accent font-mono"
                required
              />
            </div>

            <div className="space-y-2">
              <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold">
                {language === "en" ? "Available Ports" : "Kullanılabilir Soket"}
              </span>
              <input
                type="number"
                value={availablePorts}
                onChange={(e) => setAvailablePorts(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-4 py-2.5 text-slate-800 dark:text-slate-200 outline-none focus:border-accent font-mono"
                required
              />
            </div>

            <div className="md:col-span-3 flex justify-end gap-3 pt-2 font-sans text-[10px] font-bold uppercase tracking-wider">
              <button
                type="button"
                onClick={resetForm}
                className="px-5 py-2.5 rounded-full border border-slate-200 dark:border-white/10 text-slate-650 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition"
              >
                {language === "en" ? "Cancel" : "İptal"}
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-full bg-accent text-black hover:bg-[#348c70] transition"
              >
                {editingStation 
                  ? (language === "en" ? "Save Changes" : "Değişiklikleri Kaydet") 
                  : (language === "en" ? "Create Charger" : "Şarj Cihazı Oluştur")}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Stations Table */}
      <div className="dash-panel overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-light text-slate-500 dark:text-slate-400">
            <thead className="bg-slate-100/80 dark:bg-[#0e1423]/20 text-slate-600 dark:text-slate-450 uppercase tracking-widest text-[9px] font-bold border-b border-slate-200 dark:border-white/5">
              <tr>
                <th className="px-6 py-4">{language === "en" ? "Station ID" : "İstasyon Kodu"}</th>
                <th className="px-6 py-4">{language === "en" ? "Location Name" : "Konum Adı"}</th>
                <th className="px-6 py-4">{language === "en" ? "Charging Speed" : "Şarj Hızı"}</th>
                <th className="px-6 py-4">{language === "en" ? "Type/Plug" : "Tip/Soket"}</th>
                <th className="px-6 py-4">{language === "en" ? "Available Ports" : "Kullanılabilir Soket"}</th>
                <th className="px-6 py-4">{language === "en" ? "Reservations" : "Rezervasyonlar"}</th>
                <th className="px-6 py-4">{language === "en" ? "Status" : "Durum"}</th>
                <th className="px-6 py-4 text-right">{language === "en" ? "Actions" : "İşlemler"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 dark:divide-white/5 font-mono text-[11px]">
              {filteredStations.map((s) => {
                const isActive = s.status === "active";
                
                // Count user reservations for this station
                const reservedCount = Object.values(allReservations).filter((stationIds) =>
                  stationIds.includes(s.id)
                ).length;
                const netAvailable = Math.max(0, s.availablePorts - reservedCount);

                return (
                  <tr key={s.id} className="hover:bg-slate-55 dark:hover:bg-white/[0.01] transition duration-200">
                    <td className="px-6 py-4 font-semibold text-slate-400 dark:text-slate-500">{s.id}</td>
                    <td className="px-6 py-4 font-sans font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-xs">{s.name}</td>
                    <td className="px-6 py-4 text-accent font-semibold">⚡ {s.power}</td>
                    <td className="px-6 py-4 font-sans font-semibold text-slate-650 dark:text-slate-350 text-xs">
                      {s.type || "DC"} ({s.connector || "CCS2"})
                    </td>
                    <td className="px-6 py-4 text-slate-650 dark:text-slate-350">
                      <span className={netAvailable > 0 ? "text-accent" : "text-red-400 font-bold"}>
                        {netAvailable}
                      </span>{" "}
                      / {s.totalPorts}
                    </td>
                    <td className="px-6 py-4 font-sans">
                      {reservedCount > 0 ? (
                        <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[8px] font-bold uppercase tracking-wider font-mono">
                          {reservedCount} {language === "en" ? "Reserved" : "Rezerve"}
                        </span>
                      ) : (
                        <span className="text-slate-600 font-mono">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-sans">
                      <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-bold tracking-widest uppercase ${
                        isActive
                          ? "bg-accent/10 border border-accent/20 text-accent"
                          : "bg-red-500/10 border border-red-500/20 text-red-400"
                      }`}>
                        {isActive ? (language === "en" ? "active" : "aktif") : (language === "en" ? "bakımda" : "bakımda")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-sans">
                      <div className="flex justify-end gap-2 text-[9px] font-bold uppercase tracking-wider">
                        <button
                          onClick={() => handleToggleStatus(s.id)}
                          className={`px-3 py-1.5 rounded-full cursor-pointer border transition duration-300 ${
                            isActive
                              ? "border-red-500/35 hover:bg-red-500/10 text-red-400"
                              : "border-accent/35 hover:bg-accent/10 text-accent"
                          }`}
                        >
                          {isActive ? (language === "en" ? "Offline" : "Çevrimdışı") : (language === "en" ? "Online" : "Çevrimiçi")}
                        </button>
                        <button
                          onClick={() => handleOpenEdit(s)}
                          className="px-3 py-1.5 rounded-full cursor-pointer border border-slate-200 dark:border-white/10 hover:border-slate-350 dark:hover:border-white/30 text-slate-600 dark:text-slate-350 transition"
                        >
                          {language === "en" ? "Edit" : "Düzenle"}
                        </button>
                        <button
                          onClick={() => handleDelete(s.id)}
                          className="px-3 py-1.5 rounded-full cursor-pointer border border-red-500/25 hover:bg-red-500/15 text-red-450 transition"
                        >
                          {language === "en" ? "Delete" : "Sil"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
export default AdminStations;
