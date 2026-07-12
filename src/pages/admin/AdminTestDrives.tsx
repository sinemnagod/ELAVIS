import { useState, useEffect } from "react";
import { readStorage, writeStorage, storageKeys } from "@/lib/storage";
import { TestDrive, Vehicle } from "@/types";
import vehiclesData from "@/data/vehicles.json";
import { useToast } from "@/context/ToastContext";
import { useLanguage } from "@/i18n/LanguageContext";

export function AdminTestDrives() {
  const { showToast } = useToast();
  const { language } = useLanguage();
  const vehicles = vehiclesData as Vehicle[];

  // Load test drives with state
  const [testDrives, setTestDrives] = useState<TestDrive[]>(() =>
    readStorage<TestDrive[]>(storageKeys.testDrives, [])
  );

  useEffect(() => {
    writeStorage(storageKeys.testDrives, testDrives);
  }, [testDrives]);

  const handleUpdateStatus = (driveId: string, nextStatus: "confirmed" | "completed" | "pending") => {
    setTestDrives((prev) =>
      prev.map((td) => (td.id === driveId ? { ...td, status: nextStatus } : td))
    );
    showToast(
      language === "en"
        ? `Appointment status updated to ${nextStatus}`
        : `Randevu durumu ${nextStatus === "confirmed" ? "onaylandı" : nextStatus === "completed" ? "tamamlandı" : "beklemede"} olarak güncellendi`,
      "info"
    );
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-800 dark:text-slate-100">
      
      {/* Header Segment */}
      <div className="dash-panel p-6">
        <h1 className="text-xl font-light uppercase tracking-widest text-slate-800 dark:text-white">
          {language === "en" ? "Test Drive Bookings" : "Test Sürüşü Randevuları"}
        </h1>
        <p className="text-[9px] text-slate-500 font-light tracking-wide mt-1">
          {language === "en"
            ? "Review, approve, and finalize scheduled test drive appointments for prospective buyers."
            : "Potansiyel alıcılar için planlanan test sürüşü randevularını inceleyin, onaylayın ve tamamlayın."}
        </p>
      </div>

      {/* Bookings Table */}
      <div className="dash-panel overflow-hidden shadow-lg">
        {testDrives.length === 0 ? (
          <p className="text-xs text-slate-500 uppercase tracking-widest text-center py-20 font-light">
            {language === "en" ? "No test drive appointments booked" : "Kayıtlı test sürüşü randevusu bulunmuyor"}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-light text-slate-550 dark:text-slate-400">
              <thead className="bg-slate-100/80 dark:bg-[#0e1423]/25 text-slate-650 dark:text-slate-455 uppercase tracking-widest text-[9px] font-bold border-b border-slate-200 dark:border-white/5">
                <tr>
                  <th className="px-6 py-4">{language === "en" ? "Appointment" : "Randevu"}</th>
                  <th className="px-6 py-4">{language === "en" ? "Customer Details" : "Müşteri Bilgileri"}</th>
                  <th className="px-6 py-4">{language === "en" ? "Model" : "Model"}</th>
                  <th className="px-6 py-4">{language === "en" ? "Showroom" : "Showroom"}</th>
                  <th className="px-6 py-4">{language === "en" ? "Schedule Time" : "Planlanan Zaman"}</th>
                  <th className="px-6 py-4">{language === "en" ? "Status" : "Durum"}</th>
                  <th className="px-6 py-4 text-right">{language === "en" ? "Actions" : "İşlemler"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 dark:divide-white/5 font-mono text-[11px]">
                {testDrives.map((td) => {
                  const vehicleObj = vehicles.find((v) => v.id === td.vehicleId);
                  return (
                    <tr key={td.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.01] transition duration-200">
                      <td className="px-6 py-4 font-semibold text-slate-400 dark:text-slate-500">{td.id}</td>
                      <td className="px-6 py-4 font-sans">
                        <p className="font-semibold text-slate-800 dark:text-slate-200">
                          {td.firstName} {td.lastName}
                        </p>
                        <p className="text-[9px] text-slate-500 font-mono mt-0.5">{td.email}</p>
                        <p className="text-[9px] text-slate-500 font-mono">{td.phone}</p>
                      </td>
                      <td className="px-6 py-4 font-sans font-semibold text-slate-700 dark:text-white uppercase tracking-wider text-xs">
                        {vehicleObj ? vehicleObj.name : td.vehicleId}
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-350">📍 {td.location}</td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-350">
                        {td.date} | {td.time}
                      </td>
                      <td className="px-6 py-4 font-sans">
                        <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-bold tracking-widest uppercase ${
                          td.status === "pending"
                            ? "bg-amber-500/10 border border-amber-500/20 text-amber-400"
                            : td.status === "confirmed"
                            ? "bg-accent/10 border border-accent/20 text-accent"
                            : "bg-blue-500/10 border border-blue-500/20 text-blue-400"
                        }`}>
                          {td.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-sans">
                        <div className="flex justify-end gap-2 text-[9px] font-bold uppercase tracking-wider">
                          {td.status === "pending" && (
                            <button
                              onClick={() => handleUpdateStatus(td.id, "confirmed")}
                              className="px-3 py-1.5 rounded-full uppercase cursor-pointer border border-accent/35 hover:bg-accent/10 text-accent transition"
                            >
                              {language === "en" ? "Confirm" : "Onayla"}
                            </button>
                          )}
                          {td.status === "confirmed" && (
                            <button
                              onClick={() => handleUpdateStatus(td.id, "completed")}
                              className="px-3 py-1.5 rounded-full uppercase cursor-pointer border border-blue-500/35 hover:bg-blue-550/10 text-blue-400 transition"
                            >
                              {language === "en" ? "Complete" : "Tamamla"}
                            </button>
                          )}
                          <button
                            onClick={() => handleUpdateStatus(td.id, "pending")}
                            disabled={td.status === "pending"}
                            className="px-3 py-1.5 rounded-full uppercase border border-slate-200 dark:border-white/10 text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition"
                          >
                            {language === "en" ? "Reset" : "Sıfırla"}
                          </button>
                        </div>
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
export default AdminTestDrives;
