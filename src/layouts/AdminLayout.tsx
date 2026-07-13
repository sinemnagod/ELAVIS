import { useEffect, useState } from "react";
import { NavLink, Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { readStorage, writeStorage, storageKeys } from "@/lib/storage";
import vehiclesData from "@/data/vehicles.json";
import stationsData from "@/data/stations.json";
import usersData from "@/data/users.json";
import { Order, TestDrive, User, Station, Vehicle } from "@/types";
import { createReport, addSectionTitle, addStatGrid, addTable, addEmptyNote, finalizeReport } from "@/lib/pdfReport";

function LogoText({ className = "" }: { className?: string }) {
  return (
    <span className={`font-extralight font-orbitron uppercase tracking-[0.38em] text-xl md:text-2xl leading-none text-white pl-[0.38em] ${className}`}>
      EVALIS
    </span>
  );
}

// Custom modern SVG icons instead of emojis
const adminLinks = [
  {
    to: "/admin",
    labelEn: "Overview",
    labelTr: "Genel Bakış",
    end: true,
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    )
  },
  {
    to: "/admin/users",
    labelEn: "Users List",
    labelTr: "Kullanıcı Listesi",
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )
  },
  {
    to: "/admin/vehicles",
    labelEn: "Fleet Info",
    labelTr: "Filo Bilgisi",
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 18h.01M8 21h8a2 2 0 002-2V9a2 2 0 00-2-2H8a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    )
  },
  {
    to: "/admin/stations",
    labelEn: "Grid Ports",
    labelTr: "Şarj Ağı",
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )
  },
  {
    to: "/admin/sessions",
    labelEn: "Charging Sessions",
    labelTr: "Şarj Seansları",
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    )
  },
  {
    to: "/admin/products",
    labelEn: "Products",
    labelTr: "Ürünler",
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20.59 13.41L13.42 20.58a2 2 0 01-2.83 0L3 13V3h10l7.59 7.59a2 2 0 010 2.82z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 7h.01" />
      </svg>
    )
  },
  {
    to: "/admin/orders",
    labelEn: "Shop Orders",
    labelTr: "Mağaza Siparişleri",
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    )
  },
  {
    to: "/admin/test-drives",
    labelEn: "Test Drives",
    labelTr: "Test Sürüşleri",
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    )
  },
  {
    to: "/admin/support",
    labelEn: "Support",
    labelTr: "Destek",
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  },
  {
    to: "/admin/analytics",
    labelEn: "Analytics",
    labelTr: "Analitik",
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 12l3-3 3 3 4-4M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    )
  },
  {
    to: "/admin/settings",
    labelEn: "System Config",
    labelTr: "Sistem Ayarları",
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )
  }
];

export function AdminLayout() {
  const { language, changeLanguage, t, formatPrice } = useLanguage();
  const { session, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Persistent theme state
  const [theme, setTheme] = useState(() => readStorage<string>(storageKeys.adminTheme, "dark"));

  // Collapsible sidebar state
  const [isCollapsed, setIsCollapsed] = useState(() => readStorage<boolean>(storageKeys.adminSidebarCollapsed, false));

  // Redirect to login if user is absent or not an admin
  useEffect(() => {
    if (!session) {
      navigate("/login");
    } else if (session.user.role !== "admin") {
      navigate("/");
    }
  }, [session, navigate]);

  useEffect(() => {
    writeStorage(storageKeys.adminSidebarCollapsed, isCollapsed);
  }, [isCollapsed]);

  useEffect(() => {
    writeStorage(storageKeys.adminTheme, theme);
  }, [theme]);

  // Builds and downloads the platform-wide PDF report. Lives in the layout
  // (not the Overview page) so the sidebar button works from any admin route.
  const handleExportPdf = () => {
    const usersAll = readStorage<User[]>(storageKeys.users, usersData as User[]);
    const vehiclesAll = vehiclesData as Vehicle[];
    const stationsAll = readStorage<Station[]>(storageKeys.stations, stationsData as Station[]);
    const orders = readStorage<Order[]>(storageKeys.orders, []);
    const testDrives = readStorage<TestDrive[]>(storageKeys.testDrives, []);

    const orderUSD = (o: Order) => (o.currency === "$" ? o.subtotal : o.subtotal / 34);
    const totalRevenueUSD = orders.reduce((acc, o) => acc + orderUSD(o), 0);
    const pendingTestDrives = testDrives.filter((td) => td.status === "pending").length;
    const activeStationsCount = stationsAll.filter((s) => s.status === "active").length;

    const ctx = createReport(
      language === "en" ? "Admin Overview Report" : "Yönetici Genel Bakış Raporu",
      language === "en"
        ? "Snapshot of customers, fleet, stations, orders, and test drive activity."
        : "Müşteriler, filo, istasyonlar, siparişler ve test sürüşü faaliyetlerinin anlık görünümü.",
      language
    );

    addSectionTitle(ctx, language === "en" ? "Platform Snapshot" : "Platform Anlık Görünümü");
    addStatGrid(ctx, [
      { label: language === "en" ? "Total Customers" : "Toplam Müşteri", value: String(usersAll.length) },
      { label: language === "en" ? "Fleet Models" : "Filo Modeli", value: String(vehiclesAll.length) },
      { label: language === "en" ? "Active Stations" : "Aktif İstasyon", value: `${activeStationsCount} / ${stationsAll.length}` },
      { label: language === "en" ? "Shop Revenue" : "Mağaza Geliri", value: formatPrice(totalRevenueUSD, totalRevenueUSD * 34) },
      { label: language === "en" ? "Total Orders" : "Toplam Sipariş", value: String(orders.length) },
      { label: language === "en" ? "Pending Test Drives" : "Bekleyen Test Sürüşü", value: `${pendingTestDrives} / ${testDrives.length}` }
    ]);

    addSectionTitle(ctx, language === "en" ? "Test Drive Requests" : "Test Sürüşü Talepleri");
    if (testDrives.length === 0) {
      addEmptyNote(ctx, language === "en" ? "No test drives booked." : "Rezerve edilmiş test sürüşü yok.");
    } else {
      addTable(
        ctx,
        [
          language === "en" ? "Customer" : "Müşteri",
          language === "en" ? "Showroom" : "Showroom",
          language === "en" ? "Date" : "Tarih",
          language === "en" ? "Time" : "Saat",
          language === "en" ? "Status" : "Durum"
        ],
        testDrives.map((d) => [
          `${d.firstName} ${d.lastName}`,
          d.location,
          d.date,
          d.time,
          d.status === "pending"
            ? (language === "en" ? "Pending" : "Beklemede")
            : d.status === "confirmed"
              ? (language === "en" ? "Confirmed" : "Onaylandı")
              : (language === "en" ? "Completed" : "Tamamlandı")
        ])
      );
    }

    addSectionTitle(ctx, language === "en" ? "Shop Orders" : "Mağaza Siparişleri");
    if (orders.length === 0) {
      addEmptyNote(ctx, language === "en" ? "No shop orders placed." : "Sipariş bulunmuyor.");
    } else {
      addTable(
        ctx,
        [
          language === "en" ? "Order" : "Sipariş",
          language === "en" ? "Date" : "Tarih",
          language === "en" ? "Items" : "Ürün",
          language === "en" ? "Total" : "Toplam",
          language === "en" ? "Status" : "Durum"
        ],
        orders.map((o) => {
          const orderStatusLabels: Record<Order["status"], { en: string; tr: string }> = {
            processing: { en: "Processing", tr: "İşleniyor" },
            shipped: { en: "Shipped", tr: "Kargoda" },
            delivered: { en: "Delivered", tr: "Teslim Edildi" },
            cancellation_requested: { en: "Cancellation Requested", tr: "İptal Talep Edildi" },
            cancelled: { en: "Cancelled", tr: "İptal Edildi" }
          };
          return [
            o.id,
            new Date(o.createdAt).toLocaleDateString(language === "en" ? "en-US" : "tr-TR"),
            String(o.items.length),
            `${o.currency}${o.subtotal.toLocaleString()}`,
            language === "en" ? orderStatusLabels[o.status].en : orderStatusLabels[o.status].tr
          ];
        })
      );
    }

    finalizeReport(ctx, `evalis-admin-overview-${new Date().toISOString().slice(0, 10)}.pdf`);
    showToast(language === "en" ? "PDF report downloaded" : "PDF raporu indirildi", "success");
  };

  if (!session || session.user.role !== "admin") {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-8">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center mx-auto text-slate-400 animate-spin">
            🔄
          </div>
          <p className="text-xs uppercase tracking-widest text-slate-500">
            {language === "en" ? "Verifying Administrator Credentials..." : "Yönetici Yetkileri Doğrulanıyor..."}
          </p>
        </div>
      </div>
    );
  }

  const { user } = session;

  const handleLogout = () => {
    logout();
    navigate("/");
    window.scrollTo(0, 0);
  };

  return (
    <div className={`h-screen max-h-screen overflow-hidden font-sans flex flex-col lg:flex-row transition-colors duration-300 ${
      theme === "light"
        ? "bg-[#ecf0f3] text-[#0f172a] dashboard-light-theme"
        : "bg-[#070b10] text-slate-100 dashboard-dark-theme"
    }`}>
      {/* Admin Sidebar Navigation */}
      <aside className={`dash-raised w-full ${isCollapsed ? "lg:w-[90px]" : "lg:w-[260px]"} border-b lg:border-b-0 lg:border-r p-6 flex flex-col justify-between shrink-0 transition-all duration-300 ease-in-out lg:m-5 lg:h-[calc(100vh-40px)] lg:rounded-[28px] ${
        theme === "light"
          ? "bg-white border-slate-200 text-slate-800"
          : "border-white/5 bg-[#0b0f19] text-slate-100"
      }`}>
        <div className="dash-scroll space-y-8 flex flex-col min-h-0 overflow-y-auto pr-1">
          {/* Logo & Platform Name */}
          <div className="flex items-center justify-between gap-2 shrink-0">
            <Link to="/" className={`hover:opacity-85 flex items-center shrink-0 ${theme === "light" ? "text-slate-900" : "text-white"}`}>
              {isCollapsed ? (
                <span className="font-extralight font-orbitron text-xl leading-none tracking-widest text-red-500 pl-[0.1em]">
                  E
                </span>
              ) : (
                <LogoText />
              )}
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1 shrink-0">
            {adminLinks.map((link) => {
              const label = language === "en" ? link.labelEn : link.labelTr;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  title={isCollapsed ? label : ""}
                  className={({ isActive }) =>
                    `flex items-center ${isCollapsed ? "justify-center px-0" : "gap-3 px-4"} rounded-xl py-3 text-xs uppercase tracking-wider font-semibold transition ${
                      isActive
                        ? "bg-red-500/10 text-red-400 border border-red-500/20"
                        : (theme === "light"
                            ? "text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent"
                            : "text-slate-400 hover:bg-white/5 hover:text-white border border-transparent")
                    }`
                  }
                >
                  {link.icon}
                  {!isCollapsed && <span>{label}</span>}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="space-y-4 pt-6 border-t border-white/5 shrink-0 mt-auto">
          {/* User Profile Block */}
          {!isCollapsed ? (
            <div className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-2xl bg-white/[0.02] border border-white/5 shadow-sm text-xs text-slate-350 select-none">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 text-xs font-bold uppercase shrink-0">
                  {user.name.substring(0, 2)}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-200 truncate">{user.name}</p>
                  <p className="text-[9px] text-slate-500 truncate font-mono">{user.email}</p>
                </div>
              </div>
              <span className="text-red-400 font-bold shrink-0 pr-1">✓</span>
            </div>
          ) : (
            <div className="flex justify-center py-1">
              <div className="w-8 h-8 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 text-xs font-bold uppercase" title={`${user.name} (${user.email})`}>
                {user.name.substring(0, 2)}
              </div>
            </div>
          )}

          <button
            onClick={handleExportPdf}
            title={isCollapsed ? (language === "en" ? "Export Data" : "Verileri Dışa Aktar") : ""}
            className={`w-full flex items-center ${isCollapsed ? "justify-center px-0" : "gap-3 px-4"} rounded-xl py-3 text-xs uppercase tracking-wider font-semibold transition cursor-pointer ${
              theme === "light"
                ? "text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent"
                : "text-slate-400 hover:bg-white/5 hover:text-white border border-transparent"
            }`}
          >
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16" />
            </svg>
            {!isCollapsed && <span>{language === "en" ? "Export Data" : "Verileri Dışa Aktar"}</span>}
          </button>

          <Link
            to="/"
            title={isCollapsed ? (language === "en" ? "Main Site" : "Ana Site") : ""}
            className={`flex items-center ${isCollapsed ? "justify-center" : "gap-2 px-1"} text-xs uppercase tracking-wider font-semibold ${
              theme === "light" ? "text-slate-500 hover:text-slate-800" : "text-slate-400 hover:text-white"
            }`}
          >
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            {!isCollapsed && <span>{language === "en" ? "Main Site" : "Ana Site"}</span>}
          </Link>

          <button
            onClick={handleLogout}
            title={isCollapsed ? t("nav.logout") : ""}
            className={`w-full py-2.5 rounded-full border border-white/10 text-xs text-red-400 hover:text-red-300 uppercase tracking-widest font-semibold cursor-pointer transition hover:bg-white/5 flex items-center justify-center ${
              isCollapsed ? "px-0 border-0" : ""
            }`}
          >
            {isCollapsed ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            ) : (
              t("nav.logout")
            )}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-grow flex flex-col h-full max-h-screen overflow-hidden">
        {/* Top Header Utilities */}
        <header className={`dash-raised-sm border-b px-8 py-5 flex justify-between items-center transition-colors duration-300 lg:mx-5 lg:mt-5 lg:rounded-[26px] ${
          theme === "light"
            ? "bg-white border-slate-200"
            : "bg-[#0b0f19]/40 border-white/5 backdrop-blur-md"
        }`}>
          <div className="flex items-center gap-4">
            {/* Collapse toggle button */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              title={isCollapsed ? t("dashboard.actions.expandSidebar") : t("dashboard.actions.collapseSidebar")}
              aria-label={isCollapsed ? t("dashboard.actions.expandSidebar") : t("dashboard.actions.collapseSidebar")}
              className={`hidden lg:flex items-center justify-center w-8 h-8 rounded-lg border cursor-pointer transition ${
                theme === "light"
                  ? "border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                  : "border-white/10 text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {isCollapsed ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7M19 19l-7-7 7-7" />
                </svg>
              )}
            </button>

            <div>
              <h2 className={`text-sm font-semibold tracking-wider ${theme === "light" ? "text-slate-800" : "text-slate-200"}`}>
                {language === "en" ? "EVALIS Administration Panel" : "EVALIS Yönetim Paneli"}
              </h2>
              <p className="text-[10px] text-slate-500 font-light tracking-wide mt-0.5">
                {language === "en" ? "System Wide Operations Dashboard" : "Sistem Geneli İşletim Paneli"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs uppercase tracking-[0.2em]">
            {/* Language toggle */}
            <button
              onClick={() => changeLanguage(language === "en" ? "tr" : "en")}
              className={`rounded-full border px-3 py-1.5 text-[10px] cursor-pointer uppercase transition ${
                theme === "light"
                  ? "border-slate-200 hover:border-slate-400 text-slate-600"
                  : "border-white/10 hover:border-red-400/40 text-slate-350"
              }`}
            >
              {language === "en" ? "TR" : "EN"}
            </button>

            {/* Theme Toggle Trigger */}
            <button
              onClick={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
              title={theme === "dark" ? t("dashboard.actions.lightTheme") : t("dashboard.actions.darkTheme")}
              aria-label={theme === "dark" ? t("dashboard.actions.lightTheme") : t("dashboard.actions.darkTheme")}
              className={`rounded-full border p-2 cursor-pointer transition flex items-center justify-center ${
                theme === "light"
                  ? "border-slate-200 hover:border-slate-400 text-slate-600"
                  : "border-white/10 hover:border-red-400/40 text-slate-350"
              }`}
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </button>

            {/* Profile Avatar indicator */}
            <div className="w-8 h-8 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-450 text-xs font-bold uppercase shadow-sm shrink-0">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover rounded-full" />
              ) : (
                user.name.substring(0, 2)
              )}
            </div>
          </div>
        </header>

        {/* Content Outlet */}
        <main key={location.pathname} className="flex-grow p-8 overflow-y-auto animate-page-fade">
          <Outlet />
        </main>
      </div>

      {/* Embedded light theme styling overrides for sub-components */}
      <style>{`
        .dashboard-light-theme .border-white\\/5 {
          border-color: #e2e8f0 !important;
        }
        .dashboard-light-theme .bg-white\\/\\[0\\.01\\] {
          background-color: #ffffff !important;
          border-color: #e2e8f0 !important;
        }
        .dashboard-light-theme .bg-\\[\\#0a0f18\\]\\/60 {
          background-color: #ffffff !important;
          border-color: #e2e8f0 !important;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03) !important;
        }
        .dashboard-light-theme .bg-\\[\\#0a0f18\\]\\/40 {
          background-color: #f8fafc !important;
          border-color: #e2e8f0 !important;
        }
        .dashboard-light-theme .bg-black\\/20 {
          background-color: #ffffff !important;
          border-color: #e2e8f0 !important;
        }
        .dashboard-light-theme .bg-black\\/40 {
          background-color: #ffffff !important;
          border-color: #e2e8f0 !important;
        }
        .dashboard-light-theme .text-white {
          color: #0f172a !important;
        }
        .dashboard-light-theme .text-slate-100 {
          color: #1e293b !important;
        }
        .dashboard-light-theme .text-slate-200 {
          color: #1e293b !important;
        }
        .dashboard-light-theme .text-slate-300 {
          color: #334155 !important;
        }
        .dashboard-light-theme .text-slate-350 {
          color: #475569 !important;
        }
        .dashboard-light-theme .text-slate-400 {
          color: #64748b !important;
        }
        .dashboard-light-theme .text-slate-500 {
          color: #94a3b8 !important;
        }
        .dashboard-light-theme circle[stroke="rgba(255, 255, 255, 0.03)"] {
          stroke: rgba(0, 0, 0, 0.05) !important;
        }
        .dashboard-light-theme rect[fill="rgba(255, 255, 255, 0.05)"] {
          fill: rgba(0, 0, 0, 0.05) !important;
        }
        .dashboard-light-theme line[stroke="rgba(255, 255, 255, 0.03)"] {
          stroke: rgba(0, 0, 0, 0.05) !important;
        }
      `}</style>
    </div>
  );
}
export default AdminLayout;
