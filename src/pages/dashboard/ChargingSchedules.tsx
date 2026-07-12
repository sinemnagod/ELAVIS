import { useEffect, useMemo, useState } from "react";
import { readStorage, writeStorage, storageKeys, userStorageKeys } from "@/lib/storage";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import vehiclesData from "@/data/vehicles.json";
import stationsData from "@/data/stations.json";
import { ChargingSchedule, Station, Vehicle } from "@/types";

const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function createSeedSchedule(userId: string, vehicleId: string): ChargingSchedule[] {
  return [
    {
      id: "sch-01",
      userId,
      vehicleId,
      mode: "home",
      departureTime: "07:30",
      days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
      precondition: true,
      limit: 80,
      active: true,
      createdAt: new Date().toISOString()
    }
  ];
}

export function ChargingSchedules() {
  const { showToast } = useToast();
  const { session } = useAuth();
  const { language } = useLanguage();
  const user = session?.user;
  const userId = user?.id || "guest";

  const vehicles = vehiclesData as Vehicle[];
  const stations = readStorage<Station[]>(storageKeys.stations, stationsData as Station[]);
  const ownedVehicles = vehicles.filter((vehicle) => user?.ownedVehicleIds.includes(vehicle.id));
  const fallbackVehicle = ownedVehicles[0] || vehicles[0];

  const seedSchedules = useMemo(
    () => createSeedSchedule(userId, fallbackVehicle.id),
    [fallbackVehicle.id, userId]
  );

  const [schedules, setSchedules] = useState<ChargingSchedule[]>(() =>
    readStorage<ChargingSchedule[]>(userStorageKeys.schedules(userId), seedSchedules)
  );

  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [vehicleId, setVehicleId] = useState(fallbackVehicle.id);
  const [mode, setMode] = useState<ChargingSchedule["mode"]>("home");
  const [stationId, setStationId] = useState(stations[0]?.id || "");
  const [departureTime, setDepartureTime] = useState("08:00");
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [precondition, setPrecondition] = useState(false);
  const [limit, setLimit] = useState(80);

  useEffect(() => {
    const next = readStorage<ChargingSchedule[]>(userStorageKeys.schedules(userId), seedSchedules);
    setSchedules(next);
    setVehicleId(fallbackVehicle.id);
  }, [fallbackVehicle.id, seedSchedules, userId]);

  useEffect(() => {
    writeStorage(userStorageKeys.schedules(userId), schedules);
    writeStorage(storageKeys.schedules, schedules);
  }, [schedules, userId]);

  const resetForm = () => {
    setEditingScheduleId(null);
    setVehicleId(fallbackVehicle.id);
    setMode("home");
    setStationId(stations[0]?.id || "");
    setDepartureTime("08:00");
    setSelectedDays([]);
    setPrecondition(false);
    setLimit(80);
  };

  const handleDayToggle = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((item) => item !== day) : [...prev, day]
    );
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (selectedDays.length === 0) {
      showToast(
        language === "en" ? "Please select at least one day" : "Lütfen en az bir gün seçin",
        "error"
      );
      return;
    }

    const nextSchedule: ChargingSchedule = {
      id: editingScheduleId || "sch-" + Date.now().toString().slice(-6),
      userId,
      vehicleId,
      mode,
      stationId: mode === "station" ? stationId : undefined,
      departureTime,
      days: selectedDays,
      precondition,
      limit,
      active: true,
      createdAt:
        schedules.find((schedule) => schedule.id === editingScheduleId)?.createdAt ||
        new Date().toISOString()
    };

    setSchedules((prev) =>
      editingScheduleId
        ? prev.map((schedule) => (schedule.id === editingScheduleId ? nextSchedule : schedule))
        : [...prev, nextSchedule]
    );
    showToast(
      editingScheduleId
        ? language === "en" ? "Charging schedule updated" : "Şarj programı güncellendi"
        : language === "en" ? "Charging schedule added" : "Şarj programı eklendi",
      "success"
    );
    resetForm();
  };

  const handleEdit = (schedule: ChargingSchedule) => {
    setEditingScheduleId(schedule.id);
    setVehicleId(schedule.vehicleId);
    setMode(schedule.mode);
    setStationId(schedule.stationId || stations[0]?.id || "");
    setDepartureTime(schedule.departureTime);
    setSelectedDays(schedule.days);
    setPrecondition(schedule.precondition);
    setLimit(schedule.limit);
  };

  const handleToggleActive = (scheduleId: string) => {
    setSchedules((prev) =>
      prev.map((schedule) => {
        if (schedule.id !== scheduleId) return schedule;
        const next = !schedule.active;
        showToast(
          next
            ? language === "en" ? "Schedule enabled" : "Program etkinleştirildi"
            : language === "en" ? "Schedule disabled" : "Program devre dışı bırakıldı",
          "info"
        );
        return { ...schedule, active: next };
      })
    );
  };

  const handleDelete = (scheduleId: string) => {
    setSchedules((prev) => prev.filter((schedule) => schedule.id !== scheduleId));
    if (editingScheduleId === scheduleId) resetForm();
    showToast(language === "en" ? "Schedule removed" : "Program kaldırıldı", "info");
  };

  const getVehicleName = (id: string) => vehicles.find((vehicle) => vehicle.id === id)?.name || id;
  const getStationName = (id?: string) =>
    id ? stations.find((station) => station.id === id)?.name || id : language === "en" ? "Home Charging" : "Ev Şarjı";

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div>
        <h1 className="text-2xl font-light uppercase tracking-widest text-slate-100">
          {language === "en" ? "Charge Schedules" : "Şarj Programları"}
        </h1>
        <p className="text-[10px] text-slate-500 font-light tracking-wide mt-1">
          {language === "en"
            ? "Configure vehicle-specific departure times, station plans, and cabin preconditioning."
            : "Araca özel hareket saatlerini, istasyon planlarını ve kabin hazırlığını ayarlayın."}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="dash-panel p-6 space-y-6">
          <h3 className="text-xs uppercase tracking-widest text-slate-400 font-semibold">
            {editingScheduleId
              ? language === "en" ? "Edit Schedule" : "Programı Düzenle"
              : language === "en" ? "New Schedule" : "Yeni Program"}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 uppercase tracking-widest block">
                {language === "en" ? "Vehicle" : "Araç"}
              </label>
              <select
                value={vehicleId}
                onChange={(event) => setVehicleId(event.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-slate-200 outline-none focus:border-accent/40 transition"
              >
                {(ownedVehicles.length > 0 ? ownedVehicles : vehicles).map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {(["home", "station"] as ChargingSchedule["mode"][]).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setMode(item)}
                  className={`rounded-xl border py-2.5 text-[10px] uppercase tracking-widest font-bold transition ${
                    mode === item
                      ? "border-accent/40 bg-accent/15 text-accent"
                      : "border-white/10 bg-white/5 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {item === "home"
                    ? language === "en" ? "Home" : "Ev"
                    : language === "en" ? "Station" : "İstasyon"}
                </button>
              ))}
            </div>

            {mode === "station" && (
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 uppercase tracking-widest block">
                  {language === "en" ? "Charging Station" : "Şarj İstasyonu"}
                </label>
                <select
                  value={stationId}
                  onChange={(event) => setStationId(event.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-slate-200 outline-none focus:border-accent/40 transition"
                >
                  {stations.map((station) => (
                    <option key={station.id} value={station.id}>
                      {station.name} · {station.power}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 uppercase tracking-widest block">
                {language === "en" ? "Departure Time" : "Hareket Saati"}
              </label>
              <input
                type="time"
                value={departureTime}
                onChange={(event) => setDepartureTime(event.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-slate-200 outline-none focus:border-accent/40 transition"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 uppercase tracking-widest block">
                {language === "en" ? "Repeat Days" : "Tekrar Günleri"}
              </label>
              <div className="flex flex-wrap gap-2 pt-1">
                {daysOfWeek.map((day) => {
                  const active = selectedDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleDayToggle(day)}
                      className={`px-3 py-1.5 rounded-xl border text-[9px] uppercase tracking-wider font-semibold cursor-pointer transition ${
                        active
                          ? "bg-accent/15 border-accent/35 text-accent"
                          : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10"
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-between items-center py-2 border-t border-white/5">
              <div>
                <span className="text-[10px] text-slate-350 uppercase tracking-wider block font-semibold">
                  {language === "en" ? "Precondition Cabin" : "Kabini Hazırla"}
                </span>
                <span className="text-[8px] text-slate-500 block leading-tight">
                  {language === "en" ? "Heat/cool cabin before departure" : "Hareketten önce kabini ısıt/soğut"}
                </span>
              </div>
              <input
                type="checkbox"
                checked={precondition}
                onChange={(event) => setPrecondition(event.target.checked)}
                className="w-4 h-4 rounded-md accent-accent border-white/10"
              />
            </div>

            <div className="space-y-2 border-t border-white/5 pt-3">
              <div className="flex justify-between text-[10px] text-slate-500 uppercase tracking-widest font-mono">
                <span>{language === "en" ? "Charge Target" : "Şarj Hedefi"}</span>
                <span className="text-accent font-semibold">{limit}%</span>
              </div>
              <input
                type="range"
                min="60"
                max="100"
                step="5"
                value={limit}
                onChange={(event) => setLimit(Number(event.target.value))}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-accent"
              />
            </div>

            <div className="flex gap-3 pt-2">
              {editingScheduleId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 py-3 rounded-full border border-white/10 text-slate-300 text-xs font-bold uppercase tracking-widest hover:bg-white/5 transition cursor-pointer"
                >
                  {language === "en" ? "Cancel" : "Vazgeç"}
                </button>
              )}
              <button
                type="submit"
                className="flex-1 py-3 rounded-full bg-white text-black text-xs font-bold uppercase tracking-widest hover:bg-slate-200 transition cursor-pointer"
              >
                {editingScheduleId
                  ? language === "en" ? "Save" : "Kaydet"
                  : language === "en" ? "Add Schedule" : "Program Ekle"}
              </button>
            </div>
          </form>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="dash-panel p-6 space-y-6">
            <h3 className="text-xs uppercase tracking-widest text-slate-400 font-semibold">
              {language === "en" ? "Active Schedules" : "Aktif Programlar"}
            </h3>

            {schedules.length === 0 ? (
              <p className="text-xs text-slate-500 uppercase tracking-widest text-center py-10 font-light">
                {language === "en" ? "No schedule plans configured" : "Program ayarı bulunmuyor"}
              </p>
            ) : (
              <div className="space-y-4">
                {schedules.map((schedule) => (
                  <div
                    key={schedule.id}
                    className={`border rounded-2xl p-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 transition duration-200 ${
                      schedule.active ? "border-accent/20 bg-accent/[0.01]" : "border-white/5 bg-white/[0.005]"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-light text-slate-200 font-mono">{schedule.departureTime}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold tracking-widest uppercase ${
                          schedule.active ? "bg-accent/10 text-accent border border-accent/20" : "bg-white/5 text-slate-500 border border-white/5"
                        }`}>
                          {schedule.active
                            ? language === "en" ? "Enabled" : "Etkin"
                            : language === "en" ? "Disabled" : "Kapalı"}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                        {getVehicleName(schedule.vehicleId)} · {getStationName(schedule.stationId)}
                      </div>
                      <div className="flex flex-wrap gap-1.5 text-[8px] uppercase tracking-wider text-slate-400 font-semibold">
                        {schedule.days.map((day) => (
                          <span key={day} className="px-1.5 py-0.5 bg-white/5 rounded-md">{day}</span>
                        ))}
                      </div>
                      <div className="flex items-center gap-4 text-[9px] text-slate-500 font-mono pt-1">
                        <span>{language === "en" ? "Limit" : "Limit"}: {schedule.limit}%</span>
                        <span>·</span>
                        <span>{language === "en" ? "Precondition" : "Hazırlık"}: {schedule.precondition ? "ON" : "OFF"}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      <button
                        onClick={() => handleToggleActive(schedule.id)}
                        className={`w-9 h-5 rounded-full p-0.5 transition duration-200 cursor-pointer ${
                          schedule.active ? "bg-accent" : "bg-white/10"
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-[#0b0f19] transform transition duration-200 ${
                          schedule.active ? "translate-x-4" : "translate-x-0"
                        }`} />
                      </button>
                      <button
                        onClick={() => handleEdit(schedule)}
                        className="text-slate-300 hover:text-white transition text-[10px] uppercase font-bold cursor-pointer"
                      >
                        {language === "en" ? "Edit" : "Düzenle"}
                      </button>
                      <button
                        onClick={() => handleDelete(schedule.id)}
                        className="text-red-400 hover:text-red-300 transition text-[10px] uppercase font-bold cursor-pointer"
                      >
                        {language === "en" ? "Remove" : "Kaldır"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
