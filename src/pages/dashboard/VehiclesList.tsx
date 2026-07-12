import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { readStorage, writeStorage, storageKeys, userStorageKeys } from "@/lib/storage";
import vehiclesData from "@/data/vehicles.json";
import { User, Vehicle } from "@/types";
import { useToast } from "@/context/ToastContext";

interface VehicleRequest {
  id: string;
  userId: string;
  userName: string;
  modelId: string;
  plate: string;
  vin: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

export function VehiclesList() {
  const { session, refreshSession } = useAuth();
  const { showToast } = useToast();
  const { language } = useLanguage();
  const user = session?.user;

  // Load owned vehicle IDs from local storage or session
  const [ownedIds, setOwnedIds] = useState<string[]>(() => {
    if (!user) return ["vector"];
    return readStorage<string[]>(userStorageKeys.ownedVehicles(user.id), user.ownedVehicleIds || ["vector"]);
  });

  // Load vehicle registration requests
  const [requests, setRequests] = useState<VehicleRequest[]>(() =>
    readStorage<VehicleRequest[]>(storageKeys.vehicleRequests, [])
  );

  const vehicles = vehiclesData as Vehicle[];
  const ownedVehicles = vehicles.filter((v) => ownedIds.includes(v.id));

  // Form Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState("vector");
  const [plate, setPlate] = useState("");
  const [vin, setVin] = useState("");

  const handleOpenForm = () => {
    setSelectedModel("vector");
    setPlate("");
    setVin("");
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
  };

  const handleRemoveFromFleet = (vehicleId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;
    if (ownedIds.length <= 1) {
      showToast(
        language === "en"
          ? "You must keep at least one vehicle in your fleet"
          : "Filonuzda en az bir araç bulundurmalısınız",
        "error"
      );
      return;
    }

    const nextOwnedIds = ownedIds.filter((id) => id !== vehicleId);

    // Write synchronously before dispatching sync events below — dispatching
    // first would let other components (sidebar, overview) re-read storage
    // before this write lands, so they'd sync to the stale pre-release list.
    writeStorage(userStorageKeys.ownedVehicles(user.id), nextOwnedIds);

    // Keep the user record (and therefore session.user.ownedVehicleIds) consistent
    const allUsers = readStorage<User[]>(storageKeys.users, []);
    writeStorage(
      storageKeys.users,
      allUsers.map((u) => (u.id === user.id ? { ...u, ownedVehicleIds: nextOwnedIds } : u))
    );

    // If the released vehicle was the active one, switch to a vehicle still owned
    const currentActiveId = readStorage<string>(userStorageKeys.activeVehicleId(user.id), nextOwnedIds[0]);
    if (currentActiveId === vehicleId) {
      writeStorage(userStorageKeys.activeVehicleId(user.id), nextOwnedIds[0]);
    }

    setOwnedIds(nextOwnedIds);
    refreshSession();

    showToast(
      language === "en" ? "Vehicle removed from fleet" : "Araç filodan çıkarıldı",
      "info"
    );
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new Event("activeVehicleChanged"));
  };

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!plate || !vin || !user) return;

    // Build request
    const newRequest: VehicleRequest = {
      id: "req-" + Date.now().toString().slice(-6),
      userId: user.id,
      userName: user.name,
      modelId: selectedModel,
      plate: plate.toUpperCase(),
      vin: vin.toUpperCase(),
      status: "pending",
      createdAt: new Date().toISOString()
    };

    const updated = [newRequest, ...requests];
    setRequests(updated);
    writeStorage(storageKeys.vehicleRequests, updated);

    showToast(
      language === "en"
        ? "Vehicle registration request submitted for admin approval!"
        : "Araç kayıt talebi yönetici onayına gönderildi!",
      "success"
    );
    setIsFormOpen(false);
  };

  // Filter user's requests
  const userRequests = requests.filter((r) => r.userId === user?.id);

  return (
    <div className="space-y-8 animate-fade-in pb-10 text-slate-800 dark:text-slate-100">
      
      {/* Header Segment */}
      <div className="dash-panel p-6 flex justify-between items-center gap-4">
        <div>
          <h1 className="text-xl font-light uppercase tracking-widest text-slate-800 dark:text-slate-100">
            {language === "en" ? "My Vehicles" : "Araçlarım"}
          </h1>
          <p className="text-[9px] text-slate-500 font-light tracking-wide mt-1">
            {language === "en"
              ? "Monitor real-time stats, battery health, and telemetry connectivity for your active fleet."
              : "Aktif filonuz için gerçek zamanlı istatistikleri, batarya sağlığını ve telemetri bağlantısını izleyin."}
          </p>
        </div>

        {/* Add a Vehicle Button */}
        <button
          onClick={handleOpenForm}
          className="rounded-full bg-accent text-black px-5 py-2 text-xs font-bold uppercase tracking-widest hover:bg-[#348c70] transition duration-300 cursor-pointer"
        >
          {language === "en" ? "Add a Vehicle" : "Araç Ekle"}
        </button>
      </div>

      {/* Add a Vehicle Form Modal */}
      {isFormOpen && (
        <div className="dash-panel p-6 shadow-2xl animate-fade-in bg-white dark:bg-[#0e1423]">
          <div className="flex justify-between items-center border-b border-slate-200 dark:border-white/5 pb-3">
            <h3 className="text-xs font-bold tracking-wider text-slate-800 dark:text-white uppercase">
              {language === "en" ? "Register New Vehicle" : "Yeni Araç Kaydı"}
            </h3>
            <button
              onClick={handleCloseForm}
              aria-label={language === "en" ? "Close form" : "Formu kapat"}
              className="text-slate-450 hover:text-slate-700 dark:hover:text-white text-sm cursor-pointer"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmitRequest} className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs font-light text-slate-700 dark:text-slate-350">
            {/* Model Selector */}
            <div className="space-y-2">
              <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold">
                {language === "en" ? "Vehicle Model" : "Araç Modeli"}
              </span>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-4 py-2.5 text-slate-800 dark:text-slate-200 outline-none focus:border-accent"
              >
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id} className="bg-white dark:bg-[#0a0f18] text-slate-800 dark:text-slate-200">
                    {v.name}
                  </option>
                ))}
              </select>
            </div>

            {/* License Plate */}
            <div className="space-y-2">
              <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold">
                {language === "en" ? "License Plate" : "Plaka"}
              </span>
              <input
                type="text"
                value={plate}
                onChange={(e) => setPlate(e.target.value)}
                placeholder="e.g. 34 EV 100"
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-4 py-2.5 text-slate-800 dark:text-slate-200 outline-none focus:border-accent"
                required
              />
            </div>

            {/* VIN / Chassis Number */}
            <div className="space-y-2">
              <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold">
                {language === "en" ? "Chassis No (VIN)" : "Şasi No"}
              </span>
              <input
                type="text"
                value={vin}
                onChange={(e) => setVin(e.target.value)}
                placeholder="e.g. EV100987VCTR"
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-4 py-2.5 text-slate-800 dark:text-slate-200 outline-none focus:border-accent font-mono"
                required
              />
            </div>

            <div className="md:col-span-3 flex justify-end gap-3 pt-2 font-sans text-[10px] font-bold uppercase tracking-wider">
              <button
                type="button"
                onClick={handleCloseForm}
                className="px-5 py-2.5 rounded-full border border-slate-200 dark:border-white/10 text-slate-650 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition"
              >
                {language === "en" ? "Cancel" : "İptal"}
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-full bg-accent text-black hover:bg-[#348c70] transition"
              >
                {language === "en" ? "Submit Registration" : "Kaydı Gönder"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Owned Vehicles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {ownedVehicles.map((vehicle) => {
          const battery = vehicle.batteryPercent || 78;
          const range = Math.round(battery * (vehicle.id === "vector" ? 6.2 : vehicle.id === "cloud" ? 6.5 : 2.0));
          
          return (
            <Link
              key={vehicle.id}
              to={`/dashboard/vehicles/${vehicle.id}`}
              className="group dash-panel p-6 flex flex-col justify-between transition duration-300 relative overflow-hidden"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[9px] uppercase tracking-widest text-accent font-bold">
                      {vehicle.type}
                    </span>
                    <h3 className="text-lg font-light uppercase tracking-wider text-slate-800 dark:text-slate-100 mt-1">
                      {vehicle.name}
                    </h3>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[8px] font-bold tracking-widest uppercase bg-accent/10 border border-accent/20 text-accent">
                    {language === "en" ? "Connected" : "Bağlı"}
                  </span>
                </div>

                <div className="aspect-[16/9] w-full bg-black/20 rounded-2xl overflow-hidden flex items-center justify-center p-4 border border-white/5">
                  <img
                    src={vehicle.image}
                    alt={vehicle.name}
                    className="max-h-full max-w-full object-contain group-hover:scale-105 transition duration-500"
                  />
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-4 py-2 border-t border-slate-200 dark:border-white/5">
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold">
                      {language === "en" ? "Battery Level" : "Şarj Seviyesi"}
                    </span>
                    <span className="text-md font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block font-mono">
                      {battery}%
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold">
                      {language === "en" ? "Est. Range" : "Tahmini Menzil"}
                    </span>
                    <span className="text-md font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block font-mono">
                      {range} km
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t border-slate-200 dark:border-white/5 justify-between items-center">
                <span className="text-[9px] uppercase tracking-wider text-accent font-bold group-hover:underline">
                  {language === "en" ? "Manage Vehicle" : "Aracı Yönet"} →
                </span>
                <button
                  onClick={(e) => handleRemoveFromFleet(vehicle.id, e)}
                  className="px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-wider border border-red-500/25 text-red-400 hover:bg-red-500/10 transition cursor-pointer"
                >
                  {language === "en" ? "Release" : "Kaldır"}
                </button>
              </div>
            </Link>
          );
        })}
      </div>

      {/* User's Pending Registration Requests */}
      {userRequests.length > 0 && (
        <div className="space-y-4 pt-6 border-t border-slate-200 dark:border-white/5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">
            {language === "en" ? "Pending Approvals" : "Onay Bekleyen Başvurular"}
          </h2>
          <div className="space-y-3">
            {userRequests.map((req) => {
              const vehicleObj = vehicles.find((v) => v.id === req.modelId);
              return (
                <div
                  key={req.id}
                  className="dash-pill flex justify-between items-center px-4 py-3 text-xs"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-5 flex items-center justify-center bg-black/20 rounded overflow-hidden border border-white/5">
                      <img src={vehicleObj?.image} alt={req.modelId} className="max-h-full max-w-full object-contain" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                        {vehicleObj?.name || req.modelId}
                      </p>
                      <p className="text-[8px] text-slate-500 font-mono mt-0.5">
                        Plate: {req.plate} | VIN: {req.vin}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-bold tracking-widest uppercase ${
                    req.status === "pending"
                      ? "bg-amber-500/10 border border-amber-500/20 text-amber-500"
                      : req.status === "approved"
                      ? "bg-accent/10 border border-accent/20 text-accent"
                      : "bg-red-500/10 border border-red-500/20 text-red-400"
                  }`}>
                    {req.status === "pending" 
                      ? (language === "en" ? "Pending" : "Beklemede") 
                      : req.status === "approved"
                      ? (language === "en" ? "Approved" : "Onaylandı")
                      : (language === "en" ? "Rejected" : "Reddedildi")}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
export default VehiclesList;
