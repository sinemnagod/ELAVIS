import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { readStorage, writeStorage, storageKeys, userStorageKeys } from "@/lib/storage";
import { formatPhoneInput } from "@/lib/phone";
import { useToast } from "@/context/ToastContext";
import vehiclesData from "@/data/vehicles.json";
import { User, Vehicle } from "@/types";

export function SettingsDashboard() {
  const { session, refreshSession } = useAuth();
  const { language, changeLanguage } = useLanguage();
  const { showToast } = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [maxChargeLimit, setMaxChargeLimit] = useState(85);

  const userId = session?.user?.id || "guest";
  const ownedVehicleIds = session?.user?.ownedVehicleIds || [];
  const activeVehicleId = readStorage<string>(
    userStorageKeys.activeVehicleId(userId),
    ownedVehicleIds[0] || ""
  );
  const activeVehicleName =
    (vehiclesData as Vehicle[]).find((v) => v.id === activeVehicleId)?.name || activeVehicleId;

  useEffect(() => {
    if (session) {
      setName(session.user.name);
      setEmail(session.user.email);
      setPhone(session.user.phone);
      const vehicleSettings = readStorage<any>(
        userStorageKeys.vehicleSettings(session.user.id, activeVehicleId),
        { chargeLimit: 85 }
      );
      setMaxChargeLimit(vehicleSettings.chargeLimit ?? 85);
    }
  }, [session, activeVehicleId]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    const allUsers = readStorage<User[]>(storageKeys.users, []);
    writeStorage(
      storageKeys.users,
      allUsers.map((u) => (u.id === session.user.id ? { ...u, name, phone } : u))
    );
    refreshSession();
    showToast(
      language === "en" ? "Profile settings saved successfully" : "Profil ayarları başarıyla kaydedildi",
      "success"
    );
  };

  const handleSaveCharging = (e: React.FormEvent) => {
    e.preventDefault();
    if (session) {
      const existing = readStorage<any>(
        userStorageKeys.vehicleSettings(session.user.id, activeVehicleId),
        {}
      );
      writeStorage(userStorageKeys.vehicleSettings(session.user.id, activeVehicleId), {
        ...existing,
        chargeLimit: maxChargeLimit
      });
      showToast(
        language === "en" ? "Vehicle configuration updated" : "Araç yapılandırması güncellendi",
        "success"
      );
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      
      {/* Header Segment */}
      <div className="dash-panel p-6">
        <h1 className="text-xl font-light uppercase tracking-widest text-slate-100">
          {language === "en" ? "Account Settings" : "Hesap Ayarları"}
        </h1>
        <p className="text-[9px] text-slate-500 font-light tracking-wide mt-1">
          {language === "en"
            ? "Configure profile details, system languages, notification channels, and vehicle charging targets."
            : "Profil detaylarını, sistem dillerini, bildirim kanallarını ve araç şarj hedeflerini yapılandırın."}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Profile Card */}
        <div className="dash-panel p-6 space-y-6">
          <h3 className="text-xs uppercase tracking-widest text-slate-450 font-bold border-b border-white/5 pb-2">
            {language === "en" ? "Personal Profile" : "Kişisel Profil"}
          </h3>
          
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold">
                {language === "en" ? "Full Name" : "Ad Soyad"}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-slate-200 outline-none focus:border-accent/40 transition font-mono"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold">
                {language === "en" ? "Email Address" : "E-posta Adresi"}
              </label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-slate-400 outline-none cursor-not-allowed font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold">
                {language === "en" ? "Phone Number" : "Telefon Numarası"}
              </label>
              <input
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-slate-200 outline-none focus:border-accent/40 transition font-mono"
                required
              />
            </div>

            <button
              type="submit"
              className="py-2.5 px-6 rounded-full bg-white text-black text-xs font-bold uppercase tracking-widest hover:bg-slate-250 transition cursor-pointer"
            >
              {language === "en" ? "Save Profile" : "Profili Kaydet"}
            </button>
          </form>
        </div>

        {/* System Config Card */}
        <div className="space-y-8">

          {/* Vehicle default charge limit — set per-schedule preconditioning from Schedules instead */}
          {ownedVehicleIds.length > 0 && (
            <div className="dash-panel p-6 space-y-6">
              <h3 className="text-xs uppercase tracking-widest text-slate-455 font-bold border-b border-white/5 pb-2">
                {language === "en" ? "Charging Defaults" : "Şarj Varsayılanları"}
              </h3>

              <form onSubmit={handleSaveCharging} className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-[9px] text-slate-500 uppercase tracking-widest font-bold font-mono">
                    <span>
                      {language === "en" ? "Charge Target Limit" : "Hedef Şarj Limiti"}
                      {activeVehicleName && (
                        <span className="text-slate-600 normal-case tracking-normal"> · {activeVehicleName}</span>
                      )}
                    </span>
                    <span className="text-accent font-semibold">{maxChargeLimit}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="100"
                    step="5"
                    value={maxChargeLimit}
                    onChange={(e) => setMaxChargeLimit(Number(e.target.value))}
                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-accent"
                  />
                </div>

                <button
                  type="submit"
                  className="py-2.5 px-6 rounded-full bg-accent text-black text-xs font-bold uppercase tracking-widest hover:bg-[#348c70] transition cursor-pointer"
                >
                  {language === "en" ? "Update Configuration" : "Yapılandırmayı Güncelle"}
                </button>
              </form>
            </div>
          )}

          {/* Regional Settings */}
          <div className="dash-card p-6 space-y-4">
            <h3 className="text-xs uppercase tracking-widest text-slate-450 font-bold border-b border-white/5 pb-2">
              {language === "en" ? "Preferences" : "Tercihler"}
            </h3>
            
            <div className="flex justify-between items-center py-2 text-xs text-slate-350">
              <span>{language === "en" ? "Display Language" : "Görüntüleme Dili"}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    changeLanguage("en");
                    showToast("Language changed to English", "info");
                  }}
                  className={`px-3 py-1.5 rounded-xl border text-[9px] uppercase tracking-wider font-semibold cursor-pointer transition ${
                    language === "en" ? "bg-accent/15 border-accent/35 text-accent" : "border-white/10 hover:bg-white/5"
                  }`}
                >
                  English
                </button>
                <button
                  onClick={() => {
                    changeLanguage("tr");
                    showToast("Dil Türkçe olarak değiştirildi", "info");
                  }}
                  className={`px-3 py-1.5 rounded-xl border text-[9px] uppercase tracking-wider font-semibold cursor-pointer transition ${
                    language === "tr" ? "bg-accent/15 border-accent/35 text-accent" : "border-white/10 hover:bg-white/5"
                  }`}
                >
                  Türkçe
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
export default SettingsDashboard;
