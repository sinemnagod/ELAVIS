import { useEffect, useState } from "react";
import { readStorage, writeStorage, storageKeys } from "@/lib/storage";
import { useLanguage } from "@/i18n/LanguageContext";

const defaultSettings = {
  simMode: true,
  autoApprove: false,
  notifSync: true,
  devLogs: false
};

export function AdminSettings() {
  const { language } = useLanguage();
  const [settings, setSettings] = useState(() =>
    readStorage(storageKeys.adminSettings, defaultSettings)
  );

  useEffect(() => {
    writeStorage(storageKeys.adminSettings, settings);
  }, [settings]);

  const handleToggle = (key: keyof typeof settings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-xl text-slate-800 dark:text-slate-100">
      <div>
        <h1 className="text-2xl font-light uppercase tracking-widest text-slate-800 dark:text-white">
          {language === "en" ? "System Settings" : "Sistem Ayarları"}
        </h1>
        <p className="text-[10px] text-slate-500 font-light tracking-wide mt-1">
          {language === "en"
            ? "Adjust simulation rates, automatic test drive scheduler rules, and developer diagnostics."
            : "Simülasyon hızlarını, otomatik test sürüşü planlama kurallarını ve geliştirici tanılamalarını ayarlayın."}
        </p>
      </div>

      <div className="dash-panel p-6 shadow-md space-y-6">
        {/* Toggle options */}
        <div className="space-y-4">

          <div className="flex justify-between items-center py-2 text-xs font-light text-slate-655 dark:text-slate-400">
            <div className="space-y-0.5 max-w-[80%]">
              <span className="font-semibold text-slate-800 dark:text-slate-200 block uppercase tracking-wider">
                {language === "en" ? "Charging Simulation Mode" : "Şarj Simülasyon Modu"}
              </span>
              <span className="text-[10px] text-slate-500 leading-relaxed block">
                {language === "en"
                  ? "Enable simulated 3-second battery charge increments when active chargers are in use."
                  : "Aktif şarj cihazları kullanımdayken 3 saniyelik simüle edilmiş batarya artışlarını etkinleştirin."}
              </span>
            </div>
            <button
              onClick={() => handleToggle("simMode")}
              className={`w-10 h-5 rounded-full p-0.5 cursor-pointer transition ${settings.simMode ? "bg-accent" : "bg-slate-200 dark:bg-white/10"}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white dark:bg-black transition transform ${settings.simMode ? "translate-x-5" : "translate-x-0"}`} />
            </button>
          </div>

          <div className="flex justify-between items-center py-2 text-xs font-light text-slate-655 dark:text-slate-400 border-t border-slate-200 dark:border-white/5">
            <div className="space-y-0.5 max-w-[80%]">
              <span className="font-semibold text-slate-800 dark:text-slate-200 block uppercase tracking-wider">
                {language === "en" ? "Auto-Approve Test Drives" : "Test Sürüşlerini Otomatik Onayla"}
              </span>
              <span className="text-[10px] text-slate-500 leading-relaxed block">
                {language === "en"
                  ? "Automatically confirm new public test drive requests upon booking submission."
                  : "Yeni test sürüşü taleplerini rezervasyon anında otomatik olarak onaylayın."}
              </span>
            </div>
            <button
              onClick={() => handleToggle("autoApprove")}
              className={`w-10 h-5 rounded-full p-0.5 cursor-pointer transition ${settings.autoApprove ? "bg-accent" : "bg-slate-200 dark:bg-white/10"}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white dark:bg-black transition transform ${settings.autoApprove ? "translate-x-5" : "translate-x-0"}`} />
            </button>
          </div>

          <div className="flex justify-between items-center py-2 text-xs font-light text-slate-655 dark:text-slate-400 border-t border-slate-200 dark:border-white/5">
            <div className="space-y-0.5 max-w-[80%]">
              <span className="font-semibold text-slate-800 dark:text-slate-200 block uppercase tracking-wider">
                {language === "en" ? "Notifications Syncing" : "Bildirim Senkronizasyonu"}
              </span>
              <span className="text-[10px] text-slate-500 leading-relaxed block">
                {language === "en"
                  ? "Push real-time charging level alerts to customer accounts upon status completions."
                  : "Durum tamamlandığında müşteri hesaplarına gerçek zamanlı şarj seviyesi bildirimleri gönderin."}
              </span>
            </div>
            <button
              onClick={() => handleToggle("notifSync")}
              className={`w-10 h-5 rounded-full p-0.5 cursor-pointer transition ${settings.notifSync ? "bg-accent" : "bg-slate-200 dark:bg-white/10"}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white dark:bg-black transition transform ${settings.notifSync ? "translate-x-5" : "translate-x-0"}`} />
            </button>
          </div>

          <div className="flex justify-between items-center py-2 text-xs font-light text-slate-655 dark:text-slate-400 border-t border-slate-200 dark:border-white/5">
            <div className="space-y-0.5 max-w-[80%]">
              <span className="font-semibold text-slate-800 dark:text-slate-200 block uppercase tracking-wider">
                {language === "en" ? "Developer Diagnostics Logs" : "Geliştirici Tanılama Kayıtları"}
              </span>
              <span className="text-[10px] text-slate-500 leading-relaxed block">
                {language === "en"
                  ? "Print background database serialization triggers to terminal outputs."
                  : "Arka plan veritabanı serileştirme tetikleyicilerini terminal çıktısına yazdırın."}
              </span>
            </div>
            <button
              onClick={() => handleToggle("devLogs")}
              className={`w-10 h-5 rounded-full p-0.5 cursor-pointer transition ${settings.devLogs ? "bg-accent" : "bg-slate-200 dark:bg-white/10"}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white dark:bg-black transition transform ${settings.devLogs ? "translate-x-5" : "translate-x-0"}`} />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
export default AdminSettings;
