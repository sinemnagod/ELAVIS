import { useState, useEffect } from "react";
import { readStorage, writeStorage, storageKeys, userStorageKeys } from "@/lib/storage";
import vehiclesData from "@/data/vehicles.json";
import usersData from "@/data/users.json";
import { Vehicle, User } from "@/types";
import { useLanguage } from "@/i18n/LanguageContext";
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

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const emptyForm = {
  name: "",
  type: "",
  tagline: "",
  description: "",
  image: "",
  detailImage: "",
  range: "",
  maxPower: "",
  acceleration: "",
  topSpeed: "",
  extraLabel: "",
  extraValue: ""
};

export function AdminVehicles() {
  const { language } = useLanguage();
  const { showToast, confirmToast } = useToast();

  // Load vehicle catalog (create/update/delete persist here, seeded from vehicles.json)
  const [vehicles, setVehicles] = useState<Vehicle[]>(() =>
    readStorage<Vehicle[]>(storageKeys.vehicles, vehiclesData as Vehicle[])
  );

  useEffect(() => {
    writeStorage(storageKeys.vehicles, vehicles);
  }, [vehicles]);

  // Load users to count ownerships
  const [users, setUsers] = useState<User[]>(() =>
    readStorage<User[]>(storageKeys.users, usersData as User[])
  );

  // Load registration requests
  const [requests, setRequests] = useState<VehicleRequest[]>(() =>
    readStorage<VehicleRequest[]>(storageKeys.vehicleRequests, [])
  );

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [form, setForm] = useState(emptyForm);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingVehicle(null);
    setIsFormOpen(false);
  };

  const handleOpenCreate = () => {
    setForm(emptyForm);
    setEditingVehicle(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setForm({
      name: vehicle.name,
      type: vehicle.type,
      tagline: vehicle.tagline,
      description: vehicle.description,
      image: vehicle.image,
      detailImage: vehicle.detailImage,
      range: vehicle.specs.range,
      maxPower: vehicle.specs.maxPower,
      acceleration: vehicle.specs.acceleration,
      topSpeed: vehicle.specs.topSpeed,
      extraLabel: vehicle.specs.extraLabel || "",
      extraValue: vehicle.specs.extraValue || ""
    });
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return;

    const specs = {
      range: form.range,
      maxPower: form.maxPower,
      acceleration: form.acceleration,
      topSpeed: form.topSpeed,
      ...(form.extraLabel && form.extraValue ? { extraLabel: form.extraLabel, extraValue: form.extraValue } : {})
    };

    if (editingVehicle) {
      setVehicles((prev) =>
        prev.map((v) =>
          v.id === editingVehicle.id
            ? {
                ...v,
                name: form.name,
                type: form.type,
                tagline: form.tagline,
                description: form.description,
                image: form.image,
                detailImage: form.detailImage,
                specs
              }
            : v
        )
      );
      showToast(language === "en" ? "Vehicle updated" : "Araç güncellendi", "success");
    } else {
      let id = slugify(form.name);
      if (vehicles.some((v) => v.id === id)) {
        id = `${id}-${Date.now().toString().slice(-4)}`;
      }
      const newVehicle: Vehicle = {
        id,
        slug: id,
        name: form.name,
        type: form.type,
        tagline: form.tagline,
        description: form.description,
        image: form.image,
        detailImage: form.detailImage || form.image,
        specs,
        features: []
      };
      setVehicles((prev) => [...prev, newVehicle]);
      showToast(language === "en" ? "Vehicle added to catalog" : "Araç kataloğa eklendi", "success");
    }
    resetForm();
  };

  const handleDelete = async (vehicle: Vehicle) => {
    const confirmed = await confirmToast(
      language === "en"
        ? `Remove ${vehicle.name} from the catalog?`
        : `${vehicle.name} kataloğdan kaldırılsın mı?`,
      {
        confirmLabel: language === "en" ? "Delete" : "Sil",
        cancelLabel: language === "en" ? "Cancel" : "Vazgeç",
        tone: "danger"
      }
    );
    if (!confirmed) return;
    setVehicles((prev) => prev.filter((v) => v.id !== vehicle.id));
    showToast(language === "en" ? "Vehicle removed" : "Araç kaldırıldı", "info");
  };

  const getOwnershipCount = (vehicleId: string) => {
    return users.filter((u) => u.ownedVehicleIds?.includes(vehicleId)).length;
  };

  const handleApprove = (req: VehicleRequest) => {
    // 1. Update request status to approved
    const updatedRequests = requests.map((r) => r.id === req.id ? { ...r, status: "approved" as const } : r);
    setRequests(updatedRequests);
    writeStorage(storageKeys.vehicleRequests, updatedRequests);

    // 2. Update user's owned list in users store
    const targetUser = users.find((u) => u.id === req.userId);
    const recordOwned = targetUser?.ownedVehicleIds || [];
    const updatedUsers = users.map((u) => {
      if (u.id === req.userId) {
        if (!recordOwned.includes(req.modelId)) {
          return { ...u, ownedVehicleIds: [...recordOwned, req.modelId] };
        }
      }
      return u;
    });
    setUsers(updatedUsers);
    writeStorage(storageKeys.users, updatedUsers);

    // 3. Update active owned list for user fleet. Merge with the user record's
    // ownedVehicleIds rather than trusting this key alone or a hardcoded default —
    // if this key was never initialized for the user, falling back to just
    // ["vector"] would silently drop any other vehicle (e.g. Cloud) they already own.
    const storedOwned = readStorage<string[]>(userStorageKeys.ownedVehicles(req.userId), []);
    const ownedList = Array.from(new Set([...recordOwned, ...storedOwned]));
    if (ownedList.length === 0) ownedList.push("vector");
    if (!ownedList.includes(req.modelId)) {
      ownedList.push(req.modelId);
    }
    writeStorage(userStorageKeys.ownedVehicles(req.userId), ownedList);

    // 4. Save dynamic registration plate & VIN numbers for cockpits
    writeStorage(userStorageKeys.telemetry(req.userId, req.modelId), {
      plate: req.plate,
      vin: req.vin
    });

    // Trigger custom events so other open pages sync up immediately
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new Event("activeVehicleChanged"));

    showToast(
      language === "en" ? "Registration request approved!" : "Kayıt talebi onaylandı!",
      "success"
    );
  };

  const handleReject = (req: VehicleRequest) => {
    // Update request status to rejected
    const updatedRequests = requests.map((r) => r.id === req.id ? { ...r, status: "rejected" as const } : r);
    setRequests(updatedRequests);
    writeStorage(storageKeys.vehicleRequests, updatedRequests);

    showToast(
      language === "en" ? "Registration request rejected" : "Kayıt talebi reddedildi",
      "info"
    );
  };

  const pendingRequests = requests.filter((r) => r.status === "pending");

  return (
    <div className="space-y-8 animate-fade-in pb-10 text-slate-800 dark:text-slate-100">

      {/* Header Segment */}
      <div className="dash-panel p-6">
        <h1 className="text-xl font-light uppercase tracking-widest text-slate-800 dark:text-white">
          {language === "en" ? "Fleet & Registrations" : "Filo ve Araç Kayıtları"}
        </h1>
        <p className="text-[9px] text-slate-500 font-light tracking-wide mt-1">
          {language === "en"
            ? "Manage the vehicle catalog and process customer vehicle registration requests."
            : "Araç kataloğunu yönetin ve müşteri araç kayıt taleplerini işleyin."}
        </p>
      </div>

      {/* Pending Requests Control Center */}
      <div className="dash-panel p-6 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-[0.2em] border-b border-slate-200 dark:border-white/5 pb-2">
          {language === "en" ? "Pending Registration Requests" : "Onay Bekleyen Kayıt Başvuruları"}
        </h3>

        {pendingRequests.length === 0 ? (
          <p className="text-[9px] text-slate-500 uppercase tracking-widest text-center py-6 font-light">
            {language === "en" ? "No pending registrations" : "Onay bekleyen kayıt talebi bulunmuyor"}
          </p>
        ) : (
          <div className="space-y-3">
            {pendingRequests.map((req) => {
              const vehicleObj = vehicles.find((v) => v.id === req.modelId);
              return (
                <div
                  key={req.id}
                  className="dash-pill flex justify-between items-center p-3 text-xs"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-5 flex items-center justify-center bg-black/20 rounded overflow-hidden border border-white/5 shrink-0">
                      <img src={vehicleObj?.image} alt={req.modelId} className="max-h-full max-w-full object-contain" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        {req.userName}
                      </p>
                      <p className="text-[9px] text-slate-500 font-mono mt-0.5">
                        {vehicleObj?.name || req.modelId} · Plate: {req.plate} · VIN: {req.vin}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 text-[9px] font-bold uppercase tracking-wider">
                    <button
                      onClick={() => handleApprove(req)}
                      className="px-3 py-1.5 rounded-full border border-accent/35 hover:bg-accent/10 text-accent transition cursor-pointer"
                    >
                      {language === "en" ? "Approve" : "Onayla"}
                    </button>
                    <button
                      onClick={() => handleReject(req)}
                      className="px-3 py-1.5 rounded-full border border-red-500/25 hover:bg-red-500/10 text-red-400 transition cursor-pointer"
                    >
                      {language === "en" ? "Reject" : "Reddet"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Vehicle Catalog CRUD */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-2 gap-4 flex-wrap">
          <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
            {language === "en" ? "Fleet Catalog" : "Filo Kataloğu"}
          </h3>
          <button
            onClick={handleOpenCreate}
            className="rounded-full bg-accent text-black px-6 py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-[#348c70] transition duration-300 cursor-pointer"
          >
            {language === "en" ? "Add Vehicle" : "Araç Ekle"}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map((vehicle) => {
            const ownerCount = getOwnershipCount(vehicle.id);
            return (
              <div
                key={vehicle.id}
                className="dash-panel overflow-hidden flex flex-col justify-between"
              >
                {/* Image */}
                <div className="aspect-[16/10] bg-slate-900/10 border-b border-slate-200 dark:border-white/5 flex items-center justify-center p-4">
                  {vehicle.image && (
                    <img src={vehicle.image} alt={vehicle.name} className="max-h-full max-w-full object-contain" />
                  )}
                </div>

                {/* Specs & Stats info */}
                <div className="p-6 space-y-6">
                  <div>
                    <span className="text-[9px] text-accent uppercase tracking-widest block font-bold">
                      {vehicle.type}
                    </span>
                    <h3 className="text-lg font-light uppercase tracking-widest text-slate-800 dark:text-white mt-1">
                      {vehicle.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-light mt-1.5 leading-relaxed">
                      {vehicle.tagline}
                    </p>
                  </div>

                  {/* Specs list */}
                  <div className="grid grid-cols-2 gap-4 border-y border-slate-200 dark:border-white/5 py-4 text-xs font-light text-slate-500 dark:text-slate-450">
                    <div>
                      <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold">Range</span>
                      <span className="text-slate-800 dark:text-slate-250 mt-1 block font-semibold">{vehicle.specs.range}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold">Power</span>
                      <span className="text-slate-800 dark:text-slate-250 mt-1 block font-semibold">{vehicle.specs.maxPower}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold font-mono">0-100 KM/H</span>
                      <span className="text-slate-800 dark:text-slate-250 mt-1 block font-semibold">{vehicle.specs.acceleration}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold">Top Speed</span>
                      <span className="text-slate-800 dark:text-slate-250 mt-1 block font-semibold">{vehicle.specs.topSpeed}</span>
                    </div>
                  </div>

                  {/* Active drivers count + actions */}
                  <div className="flex justify-between items-center text-xs">
                    <div className="space-y-0.5">
                      <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold">Active Owners</span>
                      <span className="text-slate-800 dark:text-white font-semibold text-sm">{ownerCount} {language === "en" ? "drivers" : "sürücü"}</span>
                    </div>
                    <div className="flex gap-2 text-[9px] font-bold uppercase tracking-wider">
                      <button
                        onClick={() => handleOpenEdit(vehicle)}
                        className="px-3 py-1.5 rounded-full border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-accent/40 hover:text-accent transition cursor-pointer"
                      >
                        {language === "en" ? "Edit" : "Düzenle"}
                      </button>
                      <button
                        onClick={() => handleDelete(vehicle)}
                        className="px-3 py-1.5 rounded-full border border-red-500/20 text-red-400 hover:bg-red-500/10 transition cursor-pointer"
                      >
                        {language === "en" ? "Delete" : "Sil"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Create / Edit vehicle modal */}
      {isFormOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6"
          onClick={resetForm}
        >
          <div
            className="dash-panel max-w-2xl w-full p-6 space-y-6 shadow-2xl bg-white dark:bg-[#0e1423] max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-white/5 pb-3">
              <h3 className="text-xs font-bold tracking-wider text-slate-800 dark:text-white uppercase">
                {editingVehicle
                  ? `${language === "en" ? "Edit Vehicle" : "Aracı Düzenle"} (${editingVehicle.id})`
                  : (language === "en" ? "Add New Vehicle" : "Yeni Araç Ekle")}
              </h3>
              <button
                onClick={resetForm}
                aria-label={language === "en" ? "Close form" : "Formu kapat"}
                className="text-slate-450 hover:text-slate-700 dark:hover:text-white text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 text-xs font-light text-slate-700 dark:text-slate-350">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase tracking-widest block font-semibold">
                    {language === "en" ? "Model Name" : "Model Adı"}
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Nimbus"
                    className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-200 outline-none"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase tracking-widest block font-semibold">
                    {language === "en" ? "Category / Type" : "Kategori / Tip"}
                  </label>
                  <input
                    type="text"
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    placeholder="e.g. Electric Crossover"
                    className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-200 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 uppercase tracking-widest block font-semibold">
                  {language === "en" ? "Tagline" : "Slogan"}
                </label>
                <input
                  type="text"
                  value={form.tagline}
                  onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-200 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 uppercase tracking-widest block font-semibold">
                  {language === "en" ? "Description" : "Açıklama"}
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-200 outline-none h-20 resize-none font-sans"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase tracking-widest block font-semibold">
                    {language === "en" ? "Card Image URL" : "Kart Görsel URL'si"}
                  </label>
                  <input
                    type="text"
                    value={form.image}
                    onChange={(e) => setForm({ ...form, image: e.target.value })}
                    placeholder="/images/model.png"
                    className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-200 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase tracking-widest block font-semibold">
                    {language === "en" ? "Detail Hero Image URL" : "Detay Görsel URL'si"}
                  </label>
                  <input
                    type="text"
                    value={form.detailImage}
                    onChange={(e) => setForm({ ...form, detailImage: e.target.value })}
                    placeholder="/images/model-detail.png"
                    className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-200 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase tracking-widest block font-semibold">
                    {language === "en" ? "Range" : "Menzil"}
                  </label>
                  <input
                    type="text"
                    value={form.range}
                    onChange={(e) => setForm({ ...form, range: e.target.value })}
                    placeholder="620 km"
                    className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-3 text-slate-800 dark:text-slate-200 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase tracking-widest block font-semibold">
                    {language === "en" ? "Max Power" : "Maks. Güç"}
                  </label>
                  <input
                    type="text"
                    value={form.maxPower}
                    onChange={(e) => setForm({ ...form, maxPower: e.target.value })}
                    placeholder="350 kW"
                    className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-3 text-slate-800 dark:text-slate-200 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase tracking-widest block font-semibold">
                    0-100 km/h
                  </label>
                  <input
                    type="text"
                    value={form.acceleration}
                    onChange={(e) => setForm({ ...form, acceleration: e.target.value })}
                    placeholder="3.8 s"
                    className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-3 text-slate-800 dark:text-slate-200 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase tracking-widest block font-semibold">
                    {language === "en" ? "Top Speed" : "Maks. Hız"}
                  </label>
                  <input
                    type="text"
                    value={form.topSpeed}
                    onChange={(e) => setForm({ ...form, topSpeed: e.target.value })}
                    placeholder="200 km/h"
                    className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-3 text-slate-800 dark:text-slate-200 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase tracking-widest block font-semibold">
                    {language === "en" ? "Extra Spec Label (optional)" : "Ek Özellik Etiketi (opsiyonel)"}
                  </label>
                  <input
                    type="text"
                    value={form.extraLabel}
                    onChange={(e) => setForm({ ...form, extraLabel: e.target.value })}
                    placeholder="Seats"
                    className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-200 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase tracking-widest block font-semibold">
                    {language === "en" ? "Extra Spec Value (optional)" : "Ek Özellik Değeri (opsiyonel)"}
                  </label>
                  <input
                    type="text"
                    value={form.extraValue}
                    onChange={(e) => setForm({ ...form, extraValue: e.target.value })}
                    placeholder="7 Seats"
                    className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-200 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2 font-sans text-[10px] font-bold uppercase tracking-wider">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-5 py-2.5 rounded-full border border-slate-200 dark:border-white/10 text-slate-650 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-white/5 transition"
                >
                  {language === "en" ? "Cancel" : "Vazgeç"}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-accent text-black hover:bg-[#348c70] transition"
                >
                  {editingVehicle
                    ? (language === "en" ? "Save Changes" : "Değişiklikleri Kaydet")
                    : (language === "en" ? "Add Vehicle" : "Araç Ekle")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
export default AdminVehicles;
