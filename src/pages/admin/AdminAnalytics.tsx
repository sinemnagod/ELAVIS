import { readStorage, storageKeys } from "@/lib/storage";
import { useLanguage } from "@/i18n/LanguageContext";
import { useToast } from "@/context/ToastContext";
import { HOME_STATION_ID } from "@/lib/chargingSession";
import { createReport, addSectionTitle, addStatGrid, addTable, addEmptyNote, finalizeReport } from "@/lib/pdfReport";
import ordersData from "@/data/orders.json";
import sessionsData from "@/data/sessions.json";
import stationsData from "@/data/stations.json";
import usersData from "@/data/users.json";
import vehiclesData from "@/data/vehicles.json";
import testDrivesData from "@/data/test-drives.json";
import productsData from "@/data/products.json";
import { Order, ChargingSession, Station, User, Vehicle, TestDrive, Product, SupportTicket } from "@/types";

const BAR_SLOTS = [10, 42, 74, 106, 138, 170];
const BAR_WIDTH = 16;
const CHART_HEIGHT = 90;
const USD_TO_TRY = 34;

function buildBars(values: number[]) {
  const max = Math.max(1, ...values);
  return values.slice(0, BAR_SLOTS.length).map((value, idx) => {
    const height = Math.max(3, (value / max) * CHART_HEIGHT);
    return { x: BAR_SLOTS[idx], height, y: 100 - height };
  });
}

function StatCard({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="dash-card p-5 space-y-2">
      <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold">{label}</span>
      <span className="text-2xl font-light text-slate-800 dark:text-white font-mono block">
        {value} {unit && <span className="text-sm text-slate-450">{unit}</span>}
      </span>
    </div>
  );
}

function BarChartCard({
  title,
  entries,
  emptyLabel,
  highlightIndex = -1
}: {
  title: string;
  entries: { label: string; value: number }[];
  emptyLabel: string;
  highlightIndex?: number;
}) {
  const bars = buildBars(entries.map((e) => e.value));
  return (
    <div className="dash-panel p-6 shadow-md space-y-4">
      <h3 className="text-xs uppercase tracking-[0.25em] text-slate-600 dark:text-slate-450 font-bold block pb-2 border-b border-slate-200 dark:border-white/5">
        {title}
      </h3>
      {entries.length === 0 ? (
        <p className="text-[10px] text-slate-500 uppercase tracking-widest text-center py-14 font-light">{emptyLabel}</p>
      ) : (
        <div className="w-full flex flex-col justify-end">
          <svg className="w-full h-44" viewBox="0 0 200 100" preserveAspectRatio="none">
            <line x1="0" y1="20" x2="200" y2="20" stroke="rgba(0, 0, 0, 0.05)" strokeWidth="1" className="dark:stroke-white/5" />
            <line x1="0" y1="55" x2="200" y2="55" stroke="rgba(0, 0, 0, 0.05)" strokeWidth="1" className="dark:stroke-white/5" />
            <line x1="0" y1="90" x2="200" y2="90" stroke="rgba(0, 0, 0, 0.05)" strokeWidth="1" className="dark:stroke-white/5" />
            {bars.map((bar, idx) => (
              <rect
                key={idx}
                x={bar.x}
                y={bar.y}
                width={BAR_WIDTH}
                height={bar.height}
                rx="3"
                fill={idx === highlightIndex ? "var(--color-accent, #2a7a5f)" : "currentColor"}
                className={idx === highlightIndex ? "" : "text-slate-300/40 dark:text-white/5"}
              />
            ))}
          </svg>
          <div className="flex justify-between items-center text-[8px] text-slate-500 font-bold tracking-wider uppercase mt-3 px-1 gap-1">
            {entries.map((e, i) => (
              <span key={i} className="truncate max-w-[15%] text-center" title={e.label}>{e.label}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BreakdownCard({
  title,
  items,
  emptyLabel
}: {
  title: string;
  items: { label: string; count: number; colorClass: string }[];
  emptyLabel: string;
}) {
  const total = items.reduce((acc, i) => acc + i.count, 0);
  return (
    <div className="dash-panel p-6 shadow-md space-y-4">
      <h3 className="text-xs uppercase tracking-[0.25em] text-slate-600 dark:text-slate-450 font-bold block pb-2 border-b border-slate-200 dark:border-white/5">
        {title}
      </h3>
      {total === 0 ? (
        <p className="text-[10px] text-slate-500 uppercase tracking-widest text-center py-6 font-light">{emptyLabel}</p>
      ) : (
        <div className="space-y-3.5">
          {items.map((item) => (
            <div key={item.label} className="space-y-1.5">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-slate-600 dark:text-slate-300 uppercase tracking-wider font-semibold">{item.label}</span>
                <span className="text-slate-800 dark:text-white font-mono font-semibold">{item.count}</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-200/60 dark:bg-white/5 overflow-hidden">
                <div
                  className={`h-full rounded-full ${item.colorClass}`}
                  style={{ width: `${Math.max(2, (item.count / total) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function AdminAnalytics() {
  const { language, formatPrice } = useLanguage();
  const { showToast } = useToast();

  const orders = readStorage<Order[]>(storageKeys.orders, ordersData as Order[]);
  const sessions = readStorage<ChargingSession[]>(storageKeys.sessions, sessionsData as ChargingSession[]);
  const stations = readStorage<Station[]>(storageKeys.stations, stationsData as Station[]);
  const users = readStorage<User[]>(storageKeys.users, usersData as User[]);
  const vehicles = vehiclesData as Vehicle[];
  const testDrives = readStorage<TestDrive[]>(storageKeys.testDrives, testDrivesData as TestDrive[]);
  const products = readStorage<Product[]>(storageKeys.products, productsData as Product[]);
  const supportTickets = readStorage<SupportTicket[]>(storageKeys.supportTickets, []);

  // --- Revenue (normalized to USD since orders may have been placed in either currency) ---
  const orderUSD = (o: Order) => (o.currency === "$" ? o.subtotal : o.subtotal / USD_TO_TRY);
  const totalOrderRevenueUSD = orders.reduce((acc, o) => acc + orderUSD(o), 0);
  const avgOrderValueUSD = orders.length ? totalOrderRevenueUSD / orders.length : 0;

  const sessionUSD = (s: ChargingSession) => s.cost; // session cost is already stored in USD terms
  const totalChargingRevenueUSD = sessions.reduce((acc, s) => acc + Math.max(0, sessionUSD(s)), 0);
  const totalPlatformRevenueUSD = totalOrderRevenueUSD + totalChargingRevenueUSD;

  const revenueByMonth = new Map<string, number>();
  orders.forEach((o) => {
    const monthKey = new Date(o.createdAt).toLocaleDateString(language === "en" ? "en-US" : "tr-TR", { month: "short" });
    revenueByMonth.set(monthKey, (revenueByMonth.get(monthKey) || 0) + orderUSD(o));
  });
  const revenueEntries = [...revenueByMonth.entries()].slice(-6).map(([label, value]) => ({ label, value }));

  const orderStatusCounts: Record<Order["status"], number> = {
    processing: 0, shipped: 0, delivered: 0, cancellation_requested: 0, cancelled: 0
  };
  orders.forEach((o) => { orderStatusCounts[o.status]++; });
  const orderStatusLabels: Record<Order["status"], { en: string; tr: string }> = {
    processing: { en: "Processing", tr: "İşleniyor" },
    shipped: { en: "Shipped", tr: "Kargoda" },
    delivered: { en: "Delivered", tr: "Teslim Edildi" },
    cancellation_requested: { en: "Cancel Requested", tr: "İptal Talep Edildi" },
    cancelled: { en: "Cancelled", tr: "İptal Edildi" }
  };
  const orderStatusColors: Record<Order["status"], string> = {
    processing: "bg-amber-500", shipped: "bg-sky-500", delivered: "bg-emerald-500",
    cancellation_requested: "bg-orange-500", cancelled: "bg-red-500"
  };

  // --- Top products by revenue ---
  const productRevenue = new Map<string, number>();
  orders.forEach((o) => {
    o.items.forEach((item) => {
      const usd = o.currency === "$" ? item.price * item.quantity : (item.price * item.quantity) / USD_TO_TRY;
      productRevenue.set(item.productId, (productRevenue.get(item.productId) || 0) + usd);
    });
  });
  const topProducts = [...productRevenue.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([productId, usd]) => ({
      name: products.find((p) => p.id === productId)?.name || productId,
      usd
    }));

  // --- Charging & energy (home charging split out from station network) ---
  const stationSessions = sessions.filter((s) => s.stationId !== HOME_STATION_ID);
  const homeSessions = sessions.filter((s) => s.stationId === HOME_STATION_ID);
  const totalEnergy = sessions.reduce((acc, s) => acc + Math.max(0, s.energyKWh), 0);
  const stationEnergy = stationSessions.reduce((acc, s) => acc + Math.max(0, s.energyKWh), 0);
  const homeEnergy = homeSessions.reduce((acc, s) => acc + Math.max(0, s.energyKWh), 0);
  const completedSessions = sessions.filter((s) => s.status === "completed").length;
  const activeSessions = sessions.filter((s) => s.status === "charging").length;

  const energyByStation = new Map<string, number>();
  stationSessions.forEach((s) => {
    energyByStation.set(s.stationId, (energyByStation.get(s.stationId) || 0) + Math.max(0, s.energyKWh));
  });
  const stationEntries = [...energyByStation.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([stationId, value]) => ({
      label: stations.find((s) => s.id === stationId)?.name.replace("EVALIS ", "") || stationId,
      value
    }));

  const chargingModeItems = [
    { label: language === "en" ? "Station Charging" : "İstasyon Şarjı", count: Math.round(stationEnergy), colorClass: "bg-accent" },
    { label: language === "en" ? "Home Charging" : "Ev Şarjı", count: Math.round(homeEnergy), colorClass: "bg-sky-500" }
  ];

  const sessionStatusItems = [
    { label: language === "en" ? "Completed" : "Tamamlandı", count: completedSessions, colorClass: "bg-emerald-500" },
    { label: language === "en" ? "Active Now" : "Şu An Aktif", count: activeSessions, colorClass: "bg-accent" }
  ];

  // --- Fleet & vehicle ownership ---
  const ownershipByModel = new Map<string, number>();
  users.forEach((u) => {
    (u.ownedVehicleIds || []).forEach((vid) => {
      ownershipByModel.set(vid, (ownershipByModel.get(vid) || 0) + 1);
    });
  });
  const fleetEntries = vehicles.map((v) => ({
    label: v.name,
    value: ownershipByModel.get(v.id) || 0
  }));
  const totalFleetSize = [...ownershipByModel.values()].reduce((a, b) => a + b, 0);

  // --- Test drives ---
  const testDriveStatusCounts: Record<TestDrive["status"], number> = { pending: 0, confirmed: 0, completed: 0 };
  testDrives.forEach((t) => { testDriveStatusCounts[t.status]++; });
  const testDriveStatusItems = [
    { label: language === "en" ? "Pending" : "Beklemede", count: testDriveStatusCounts.pending, colorClass: "bg-amber-500" },
    { label: language === "en" ? "Confirmed" : "Onaylandı", count: testDriveStatusCounts.confirmed, colorClass: "bg-sky-500" },
    { label: language === "en" ? "Completed" : "Tamamlandı", count: testDriveStatusCounts.completed, colorClass: "bg-emerald-500" }
  ];

  // --- Users ---
  const customerCount = users.filter((u) => u.role === "customer").length;
  const adminCount = users.filter((u) => u.role === "admin").length;
  const fleetOwnerCount = users.filter((u) => (u.ownedVehicleIds || []).length > 0).length;

  // --- Support tickets ---
  const ticketStatusCounts: Record<SupportTicket["status"], number> = { open: 0, in_progress: 0, resolved: 0, closed: 0 };
  supportTickets.forEach((t) => { ticketStatusCounts[t.status]++; });
  const ticketStatusItems = [
    { label: language === "en" ? "Open" : "Açık", count: ticketStatusCounts.open, colorClass: "bg-accent" },
    { label: language === "en" ? "In Progress" : "İşlemde", count: ticketStatusCounts.in_progress, colorClass: "bg-sky-500" },
    { label: language === "en" ? "Resolved" : "Çözüldü", count: ticketStatusCounts.resolved, colorClass: "bg-emerald-500" },
    { label: language === "en" ? "Closed" : "Kapatıldı", count: ticketStatusCounts.closed, colorClass: "bg-slate-400" }
  ];

  const handleExportPdf = () => {
    const ctx = createReport(
      language === "en" ? "System Analytics Report" : "Sistem Analitiği Raporu",
      language === "en"
        ? "Revenue, fleet, charging, bookings, and support activity across the whole platform."
        : "Platform genelindeki gelir, filo, şarj, rezervasyon ve destek faaliyetleri.",
      language
    );

    addSectionTitle(ctx, language === "en" ? "Key Metrics" : "Temel Metrikler");
    addStatGrid(ctx, [
      { label: language === "en" ? "Total Platform Revenue" : "Toplam Platform Geliri", value: formatPrice(totalPlatformRevenueUSD, totalPlatformRevenueUSD * USD_TO_TRY) },
      { label: language === "en" ? "Shop Orders" : "Mağaza Siparişleri", value: String(orders.length) },
      { label: language === "en" ? "Avg Order Value" : "Ortalama Sipariş", value: formatPrice(avgOrderValueUSD, avgOrderValueUSD * USD_TO_TRY) },
      { label: language === "en" ? "Charging Revenue" : "Şarj Geliri", value: formatPrice(totalChargingRevenueUSD, totalChargingRevenueUSD * USD_TO_TRY) },
      { label: language === "en" ? "Registered Users" : "Kayıtlı Kullanıcı", value: String(users.length) },
      { label: language === "en" ? "Fleet Size" : "Filo Büyüklüğü", value: String(totalFleetSize) },
      { label: language === "en" ? "Energy Delivered" : "Sağlanan Enerji", value: `${totalEnergy.toFixed(0)} kWh` },
      { label: language === "en" ? "Open Tickets" : "Açık Talepler", value: String(ticketStatusCounts.open + ticketStatusCounts.in_progress) }
    ]);

    addSectionTitle(ctx, language === "en" ? "Order Status Breakdown" : "Sipariş Durum Dağılımı");
    const orderStatusRows = (Object.keys(orderStatusCounts) as Order["status"][])
      .filter((s) => orderStatusCounts[s] > 0)
      .map((s) => [language === "en" ? orderStatusLabels[s].en : orderStatusLabels[s].tr, String(orderStatusCounts[s])]);
    if (orderStatusRows.length === 0) {
      addEmptyNote(ctx, language === "en" ? "No orders yet." : "Henüz sipariş yok.");
    } else {
      addTable(ctx, [language === "en" ? "Status" : "Durum", language === "en" ? "Count" : "Adet"], orderStatusRows);
    }

    addSectionTitle(ctx, language === "en" ? "Top Selling Products" : "En Çok Satan Ürünler");
    if (topProducts.length === 0) {
      addEmptyNote(ctx, language === "en" ? "No sales data yet." : "Henüz satış verisi yok.");
    } else {
      addTable(
        ctx,
        ["#", language === "en" ? "Product" : "Ürün", language === "en" ? "Revenue" : "Gelir"],
        topProducts.map((p, i) => [String(i + 1), p.name, formatPrice(p.usd, p.usd * USD_TO_TRY)])
      );
    }

    addSectionTitle(ctx, language === "en" ? "Charging & Energy" : "Şarj ve Enerji");
    addStatGrid(ctx, [
      { label: language === "en" ? "Station Charging (kWh)" : "İstasyon Şarjı (kWh)", value: stationEnergy.toFixed(0) },
      { label: language === "en" ? "Home Charging (kWh)" : "Ev Şarjı (kWh)", value: homeEnergy.toFixed(0) },
      { label: language === "en" ? "Completed Sessions" : "Tamamlanan Seans", value: String(completedSessions) },
      { label: language === "en" ? "Active Now" : "Şu An Aktif", value: String(activeSessions) }
    ], 4);
    if (stationEntries.length === 0) {
      addEmptyNote(ctx, language === "en" ? "No station charging data yet." : "Henüz istasyon şarj verisi yok.");
    } else {
      addTable(
        ctx,
        [language === "en" ? "Station" : "İstasyon", language === "en" ? "Energy (kWh)" : "Enerji (kWh)"],
        stationEntries.map((e) => [e.label, e.value.toFixed(1)])
      );
    }

    addSectionTitle(ctx, language === "en" ? "Fleet Ownership by Model" : "Modele Göre Filo Sahipliği");
    if (fleetEntries.every((e) => e.value === 0)) {
      addEmptyNote(ctx, language === "en" ? "No vehicles registered yet." : "Henüz kayıtlı araç yok.");
    } else {
      addTable(
        ctx,
        [language === "en" ? "Model" : "Model", language === "en" ? "Owners" : "Sahip Sayısı"],
        fleetEntries.map((e) => [e.label, String(e.value)])
      );
    }

    addSectionTitle(ctx, language === "en" ? "Test Drives & Support" : "Test Sürüşleri ve Destek");
    addTable(
      ctx,
      [language === "en" ? "Test Drives" : "Test Sürüşleri", language === "en" ? "Count" : "Adet"],
      testDriveStatusItems.map((i) => [i.label, String(i.count)])
    );
    addTable(
      ctx,
      [language === "en" ? "Support Tickets" : "Destek Talepleri", language === "en" ? "Count" : "Adet"],
      ticketStatusItems.map((i) => [i.label, String(i.count)])
    );

    addSectionTitle(ctx, language === "en" ? "User Base" : "Kullanıcı Tabanı");
    addStatGrid(ctx, [
      { label: language === "en" ? "Customers" : "Müşteriler", value: String(customerCount) },
      { label: language === "en" ? "Admins" : "Yöneticiler", value: String(adminCount) },
      { label: language === "en" ? "Fleet Owners" : "Filo Sahibi", value: String(fleetOwnerCount) },
      { label: language === "en" ? "No Vehicle" : "Aracı Yok", value: String(Math.max(0, users.length - fleetOwnerCount)) }
    ], 4);

    finalizeReport(ctx, `evalis-analytics-${new Date().toISOString().slice(0, 10)}.pdf`);
    showToast(language === "en" ? "PDF report downloaded" : "PDF raporu indirildi", "success");
  };

  return (
    <div className="space-y-8 animate-fade-in text-slate-800 dark:text-slate-100 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-light uppercase tracking-widest text-slate-800 dark:text-white">
            {language === "en" ? "System Analytics" : "Sistem Analitiği"}
          </h1>
          <p className="text-[10px] text-slate-500 font-light tracking-wide mt-1">
            {language === "en"
              ? "A complete view of revenue, fleet, charging, bookings, and support activity across the platform."
              : "Platform genelindeki gelir, filo, şarj, rezervasyon ve destek faaliyetlerinin tam görünümü."}
          </p>
        </div>
        <button
          onClick={handleExportPdf}
          className="dash-pill px-5 py-2.5 text-[10px] font-bold uppercase tracking-wider transition border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 flex items-center gap-2 cursor-pointer shrink-0"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16" />
          </svg>
          {language === "en" ? "Export Data" : "Verileri Dışa Aktar"}
        </button>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label={language === "en" ? "Total Platform Revenue" : "Toplam Platform Geliri"} value={formatPrice(totalPlatformRevenueUSD, totalPlatformRevenueUSD * USD_TO_TRY)} />
        <StatCard label={language === "en" ? "Shop Orders" : "Mağaza Siparişleri"} value={String(orders.length)} />
        <StatCard label={language === "en" ? "Avg Order Value" : "Ortalama Sipariş"} value={formatPrice(avgOrderValueUSD, avgOrderValueUSD * USD_TO_TRY)} />
        <StatCard label={language === "en" ? "Charging Revenue" : "Şarj Geliri"} value={formatPrice(totalChargingRevenueUSD, totalChargingRevenueUSD * USD_TO_TRY)} />
        <StatCard label={language === "en" ? "Registered Users" : "Kayıtlı Kullanıcı"} value={String(users.length)} />
        <StatCard label={language === "en" ? "Fleet Size" : "Filo Büyüklüğü"} value={String(totalFleetSize)} />
        <StatCard label={language === "en" ? "Energy Delivered" : "Sağlanan Enerji"} value={totalEnergy.toFixed(0)} unit="kWh" />
        <StatCard label={language === "en" ? "Open Tickets" : "Açık Talepler"} value={String(ticketStatusCounts.open + ticketStatusCounts.in_progress)} />
      </div>

      {/* Revenue & Orders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <BarChartCard
          title={language === "en" ? "Shop Revenue by Month (USD)" : "Aylık Mağaza Geliri (USD)"}
          entries={revenueEntries}
          emptyLabel={language === "en" ? "No order data yet" : "Henüz sipariş verisi yok"}
          highlightIndex={revenueEntries.length - 1}
        />
        <BreakdownCard
          title={language === "en" ? "Order Status Breakdown" : "Sipariş Durum Dağılımı"}
          items={(Object.keys(orderStatusCounts) as Order["status"][])
            .filter((s) => orderStatusCounts[s] > 0)
            .map((s) => ({
              label: language === "en" ? orderStatusLabels[s].en : orderStatusLabels[s].tr,
              count: orderStatusCounts[s],
              colorClass: orderStatusColors[s]
            }))}
          emptyLabel={language === "en" ? "No orders yet" : "Henüz sipariş yok"}
        />
      </div>

      {/* Top products */}
      <div className="dash-panel p-6 shadow-md space-y-4">
        <h3 className="text-xs uppercase tracking-[0.25em] text-slate-600 dark:text-slate-450 font-bold block pb-2 border-b border-slate-200 dark:border-white/5">
          {language === "en" ? "Top Selling Products" : "En Çok Satan Ürünler"}
        </h3>
        {topProducts.length === 0 ? (
          <p className="text-[10px] text-slate-500 uppercase tracking-widest text-center py-6 font-light">
            {language === "en" ? "No sales data yet" : "Henüz satış verisi yok"}
          </p>
        ) : (
          <div className="space-y-3">
            {topProducts.map((p, i) => {
              const maxUsd = topProducts[0].usd || 1;
              return (
                <div key={p.name} className="space-y-1.5">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-600 dark:text-slate-300 font-semibold">
                      <span className="text-slate-400 font-mono mr-2">#{i + 1}</span>{p.name}
                    </span>
                    <span className="text-slate-800 dark:text-white font-mono font-semibold">
                      {formatPrice(p.usd, p.usd * USD_TO_TRY)}
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-200/60 dark:bg-white/5 overflow-hidden">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${Math.max(2, (p.usd / maxUsd) * 100)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Charging & Energy */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <BarChartCard
          title={language === "en" ? "Station Energy Output (kWh)" : "İstasyon Enerji Çıkışı (kWh)"}
          entries={stationEntries}
          emptyLabel={language === "en" ? "No station charging data yet" : "Henüz istasyon şarj verisi yok"}
          highlightIndex={0}
        />
        <div className="grid grid-cols-1 gap-8">
          <BreakdownCard
            title={language === "en" ? "Home vs Station Charging (kWh)" : "Ev / İstasyon Şarjı (kWh)"}
            items={chargingModeItems}
            emptyLabel={language === "en" ? "No charging data yet" : "Henüz şarj verisi yok"}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <BreakdownCard
          title={language === "en" ? "Session Status" : "Seans Durumu"}
          items={sessionStatusItems}
          emptyLabel={language === "en" ? "No sessions yet" : "Henüz seans yok"}
        />
        <BarChartCard
          title={language === "en" ? "Fleet Ownership by Model" : "Modele Göre Filo Sahipliği"}
          entries={fleetEntries}
          emptyLabel={language === "en" ? "No vehicles registered yet" : "Henüz kayıtlı araç yok"}
          highlightIndex={fleetEntries.reduce((best, e, i, arr) => (e.value > arr[best].value ? i : best), 0)}
        />
      </div>

      {/* Test Drives & Support */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <BreakdownCard
          title={language === "en" ? "Test Drive Bookings" : "Test Sürüşü Rezervasyonları"}
          items={testDriveStatusItems}
          emptyLabel={language === "en" ? "No test drives booked yet" : "Henüz test sürüşü rezervasyonu yok"}
        />
        <BreakdownCard
          title={language === "en" ? "Support Tickets" : "Destek Talepleri"}
          items={ticketStatusItems}
          emptyLabel={language === "en" ? "No support tickets yet" : "Henüz destek talebi yok"}
        />
      </div>

      {/* Users */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <BreakdownCard
          title={language === "en" ? "User Roles" : "Kullanıcı Rolleri"}
          items={[
            { label: language === "en" ? "Customers" : "Müşteriler", count: customerCount, colorClass: "bg-accent" },
            { label: language === "en" ? "Admins" : "Yöneticiler", count: adminCount, colorClass: "bg-red-500" }
          ]}
          emptyLabel={language === "en" ? "No users yet" : "Henüz kullanıcı yok"}
        />
        <BreakdownCard
          title={language === "en" ? "Fleet Ownership Rate" : "Filo Sahiplik Oranı"}
          items={[
            { label: language === "en" ? "Own a Vehicle" : "Aracı Var", count: fleetOwnerCount, colorClass: "bg-accent" },
            { label: language === "en" ? "No Vehicle" : "Aracı Yok", count: Math.max(0, users.length - fleetOwnerCount), colorClass: "bg-slate-400" }
          ]}
          emptyLabel={language === "en" ? "No users yet" : "Henüz kullanıcı yok"}
        />
      </div>
    </div>
  );
}
export default AdminAnalytics;
