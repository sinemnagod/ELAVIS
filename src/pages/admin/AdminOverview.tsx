import { useEffect, useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { readStorage, storageKeys } from "@/lib/storage";
import vehiclesData from "@/data/vehicles.json";
import stationsData from "@/data/stations.json";
import usersData from "@/data/users.json";
import { Order, TestDrive, User, Station, Vehicle } from "@/types";

export function AdminOverview() {
  const { language, formatPrice } = useLanguage();

  // Clock state
  const [timeText, setTimeText] = useState("");
  useEffect(() => {
    const updateTime = () => {
      setTimeText(
        new Date().toLocaleTimeString(language === "en" ? "en-US" : "tr-TR", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit"
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [language]);

  // Load datasets
  const users = readStorage<User[]>(storageKeys.users, usersData as User[]);
  const vehicles = vehiclesData as Vehicle[];
  const stations = readStorage<Station[]>(storageKeys.stations, stationsData as Station[]);
  const orders = readStorage<Order[]>(storageKeys.orders, []);
  const testDrives = readStorage<TestDrive[]>(storageKeys.testDrives, []);

  // Calculations — normalize to USD first since orders may have been placed in either currency
  const orderUSD = (o: Order) => (o.currency === "$" ? o.subtotal : o.subtotal / 34);
  const totalRevenueUSD = orders.reduce((acc, o) => acc + orderUSD(o), 0);
  const pendingTestDrives = testDrives.filter((td) => td.status === "pending").length;
  const activeStations = stations.filter((s) => s.status === "active").length;

  const testDriveStatusLabels: Record<TestDrive["status"], { en: string; tr: string }> = {
    pending: { en: "Pending", tr: "Beklemede" },
    confirmed: { en: "Confirmed", tr: "Onaylandı" },
    completed: { en: "Completed", tr: "Tamamlandı" }
  };
  const orderStatusLabels: Record<Order["status"], { en: string; tr: string }> = {
    processing: { en: "Processing", tr: "İşleniyor" },
    shipped: { en: "Shipped", tr: "Kargoda" },
    delivered: { en: "Delivered", tr: "Teslim Edildi" },
    cancellation_requested: { en: "Cancellation Requested", tr: "İptal Talep Edildi" },
    cancelled: { en: "Cancelled", tr: "İptal Edildi" }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10 text-slate-800 dark:text-slate-100">
      
      {/* Header Segment */}
      <div className="dash-panel p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <span className="text-[9px] uppercase tracking-[0.3em] text-accent font-bold block">
            {language === "en" ? "ADMIN MANAGEMENT PORTAL" : "YÖNETİCİ YÖNETİM PORTALI"}
          </span>
          <h1 className="text-xl font-light uppercase tracking-widest text-slate-800 dark:text-white mt-1">
            {language === "en" ? "System Control Overview" : "Sistem Kontrol Genel Bakışı"}
          </h1>
          <p className="text-[9px] text-slate-500 font-light tracking-wide mt-1">
            {language === "en"
              ? "Monitor real-time reservations, customer order receipts, and infrastructure performance."
              : "Gerçek zamanlı rezervasyonları, müşteri sipariş makbuzlarını ve altyapı performansını izleyin."}
          </p>
        </div>

        {/* Widgets Strip */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-light shrink-0">
          {/* Weather Widget */}
          <div className="dash-inset px-4 py-2 rounded-xl flex items-center gap-3">
            <span className="text-lg" aria-hidden="true">☀️</span>
            <div>
              <p className="font-semibold text-slate-800 dark:text-slate-200">{language === "en" ? "Istanbul" : "İstanbul"} · 24°C</p>
              <p className="text-[9px] text-slate-500 font-mono mt-0.5">
                {language === "en" ? "Sunny" : "Güneşli"}
              </p>
            </div>
          </div>

          {/* Date / Time Widget */}
          <div className="dash-inset px-4 py-2 rounded-xl flex items-center gap-2 font-mono text-accent">
            <span aria-hidden="true">🕒</span>
            <span className="font-semibold">{timeText || "12:00:00"}</span>
          </div>
        </div>
      </div>

      {/* Metric summary row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {/* Total Customers */}
        <div className="dash-card p-5 space-y-2">
          <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold">
            {language === "en" ? "Total Customers" : "Toplam Müşteri"}
          </span>
          <div className="flex justify-between items-baseline pt-2">
            <span className="text-3xl font-light text-slate-800 dark:text-white font-mono">{users.length}</span>
            <span className="text-[9px] text-accent font-bold uppercase">{language === "en" ? "Active" : "Aktif"}</span>
          </div>
        </div>

        {/* Fleet Vehicles */}
        <div className="dash-card p-5 space-y-2">
          <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold">
            {language === "en" ? "Fleet Models" : "Filo Modeli"}
          </span>
          <div className="flex justify-between items-baseline pt-2">
            <span className="text-3xl font-light text-slate-800 dark:text-white font-mono">{vehicles.length}</span>
            <span className="text-[9px] text-slate-500 font-bold uppercase">{language === "en" ? "E-Catalog" : "E-Katalog"}</span>
          </div>
        </div>

        {/* Active Grid Ports */}
        <div className="dash-card p-5 space-y-2">
          <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold">
            {language === "en" ? "Active Stations" : "Aktif İstasyon"}
          </span>
          <div className="flex justify-between items-baseline pt-2">
            <span className="text-3xl font-light text-slate-800 dark:text-white font-mono">{activeStations}</span>
            <span className="text-[9px] text-accent font-bold uppercase">{stations.length} {language === "en" ? "Total" : "Toplam"}</span>
          </div>
        </div>

        {/* Shop Revenue */}
        <div className="dash-card p-5 space-y-2">
          <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold">
            {language === "en" ? "Shop Revenue" : "Mağaza Geliri"}
          </span>
          <div className="flex justify-between items-baseline pt-2">
            <span className="text-2xl font-bold text-accent font-mono">
              {formatPrice(totalRevenueUSD, totalRevenueUSD * 34)}
            </span>
            <span className="text-[9px] text-slate-500 font-bold uppercase font-mono">{orders.length} {language === "en" ? "Orders" : "Sipariş"}</span>
          </div>
        </div>

        {/* Test Drives Confirmed */}
        <div className="dash-card p-5 space-y-2">
          <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold">
            {language === "en" ? "Pending Drives" : "Bekleyen Sürüşler"}
          </span>
          <div className="flex justify-between items-baseline pt-2">
            <span className="text-3xl font-light text-slate-800 dark:text-white font-mono">{pendingTestDrives}</span>
            <span className="text-[9px] text-amber-500 font-bold uppercase font-mono">{testDrives.length} {language === "en" ? "Total" : "Toplam"}</span>
          </div>
        </div>
      </div>

      {/* Grid: Recent bookings & checkouts lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Recent Test Drive Requests */}
        <div className="dash-panel p-6 shadow-md space-y-4">
          <h3 className="text-xs uppercase tracking-[0.25em] text-slate-600 dark:text-slate-455 font-bold block pb-2 border-b border-slate-200 dark:border-white/5">
            {language === "en" ? "Recent Test Drive Requests" : "Son Test Sürüşü Talepleri"}
          </h3>

          {testDrives.length === 0 ? (
            <p className="text-[10px] text-slate-500 uppercase tracking-widest text-center py-8">
              {language === "en" ? "No drive requests registered" : "Kayıtlı sürüş talebi bulunmuyor"}
            </p>
          ) : (
            <div className="space-y-3">
              {testDrives.slice(0, 5).map((drive) => (
                <div
                  key={drive.id}
                  className="dash-pill flex justify-between items-center px-4 py-3 text-xs font-light"
                >
                  <div className="space-y-0.5">
                    <p className="font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                      {drive.firstName} {drive.lastName}
                    </p>
                    <p className="text-[9px] text-slate-500 font-mono">
                      📍 {drive.location} | 📅 {drive.date}
                    </p>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-bold tracking-widest uppercase ${
                    drive.status === "pending"
                      ? "bg-amber-500/10 border border-amber-500/20 text-amber-500"
                      : "bg-accent/10 border border-accent/20 text-accent"
                  }`}>
                    {language === "en" ? testDriveStatusLabels[drive.status].en : testDriveStatusLabels[drive.status].tr}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div className="dash-panel p-6 shadow-md space-y-4">
          <h3 className="text-xs uppercase tracking-[0.25em] text-slate-600 dark:text-slate-455 font-bold block pb-2 border-b border-slate-200 dark:border-white/5">
            {language === "en" ? "Recent Shop Orders" : "Son Mağaza Siparişleri"}
          </h3>

          {orders.length === 0 ? (
            <p className="text-[10px] text-slate-500 uppercase tracking-widest text-center py-8">
              {language === "en" ? "No shop orders placed" : "Sipariş bulunmuyor"}
            </p>
          ) : (
            <div className="space-y-3">
              {orders.slice(0, 5).map((order) => (
                <div
                  key={order.id}
                  className="dash-pill flex justify-between items-center px-4 py-3 text-xs font-light"
                >
                  <div className="space-y-0.5">
                    <p className="font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider font-mono">{order.id}</p>
                    <p className="text-[9px] text-slate-500 font-mono">
                      📅 {new Date(order.createdAt).toLocaleDateString()} | {order.items.length} {language === "en" ? "item(s)" : "ürün"}
                    </p>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <span className="text-accent font-semibold font-mono">
                      {order.currency}{order.subtotal.toLocaleString()}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[8px] font-bold tracking-widest bg-amber-500/15 border border-amber-500/25 text-amber-500 uppercase">
                      {language === "en" ? orderStatusLabels[order.status].en : orderStatusLabels[order.status].tr}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
export default AdminOverview;
