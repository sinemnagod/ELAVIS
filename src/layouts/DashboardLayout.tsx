import { useEffect, useState } from "react";
import { NavLink, Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { readStorage, writeStorage, storageKeys, userStorageKeys } from "@/lib/storage";
import vehiclesData from "@/data/vehicles.json";
import notificationsData from "@/data/notifications.json";
import { Notification, Vehicle } from "@/types";

function LogoText({ className = "" }: { className?: string }) {
  return (
    <span className={`font-extralight font-orbitron uppercase tracking-[0.38em] text-xl md:text-2xl leading-none text-white pl-[0.38em] ${className}`}>
      EVALIS
    </span>
  );
}

// Custom modern SVG icons instead of emojis
const dashboardLinks = [
  { 
    to: "/dashboard", 
    labelKey: "dashboard.nav.overview", 
    end: true,
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    )
  },
  { 
    to: "/dashboard/vehicles", 
    labelKey: "dashboard.nav.vehicles", 
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 18h.01M8 21h8a2 2 0 002-2V9a2 2 0 00-2-2H8a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    )
  },
  { 
    to: "/dashboard/charging", 
    labelKey: "dashboard.nav.charging", 
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    )
  },
  { 
    to: "/dashboard/stations", 
    labelKey: "dashboard.nav.stations", 
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )
  },
  { 
    to: "/dashboard/history", 
    labelKey: "dashboard.nav.history", 
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  },
  {
    to: "/dashboard/schedules",
    labelKey: "dashboard.nav.schedules",
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3M5 11h14M7 5h10a2 2 0 012 2v11a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 15h2l1-2 1 4 1-2h1" />
      </svg>
    )
  },
  {
    to: "/dashboard/energy",
    labelKey: "dashboard.nav.energy",
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 2L4 14h7l-1 8 10-13h-7l0-7z" />
      </svg>
    )
  },
  {
    to: "/dashboard/notifications",
    labelKey: "dashboard.nav.notifications",
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h5" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10 19a2 2 0 004 0" />
      </svg>
    )
  },
  {
    to: "/dashboard/rewards",
    labelKey: "dashboard.nav.rewards",
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15a4 4 0 100-8 4 4 0 000 8z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8.5 13.5L6 21l6-3 6 3-2.5-7.5" />
      </svg>
    )
  },
  {
    to: "/dashboard/settings",
    labelKey: "dashboard.nav.settings",
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )
  }
];

export function DashboardLayout() {
  const { language, changeLanguage, t } = useLanguage();
  const { session, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Persistent theme state
  const [theme, setTheme] = useState(() => readStorage<string>(storageKeys.dashboardTheme, "dark"));
  
  // Collapsible sidebar state
  const [isCollapsed, setIsCollapsed] = useState(() =>
    readStorage<boolean>(storageKeys.dashboardSidebarCollapsed, false)
  );

  // Active Vehicle state for sync
  const userId = session?.user?.id || "guest";
  const [activeVehicleId, setActiveVehicleId] = useState(() => {
    const defaultVid = session?.user?.ownedVehicleIds?.[0] || "vector";
    return readStorage<string>(userStorageKeys.activeVehicleId(userId), defaultVid);
  });

  const [ownedIds, setOwnedIds] = useState<string[]>(() => {
    return readStorage<string[]>(userStorageKeys.ownedVehicles(userId), session?.user?.ownedVehicleIds || ["vector"]);
  });

  // Unread notification count for the sidebar badge
  const countUnread = () =>
    readStorage<Notification[]>(storageKeys.notifications, notificationsData as Notification[])
      .filter((n) => n.userId === userId && !n.read).length;
  const [unreadCount, setUnreadCount] = useState(countUnread);

  useEffect(() => {
    const handleNotifSync = () => setUnreadCount(countUnread());
    window.addEventListener("storage", handleNotifSync);
    window.addEventListener("evalis:notificationsUpdated", handleNotifSync);
    return () => {
      window.removeEventListener("storage", handleNotifSync);
      window.removeEventListener("evalis:notificationsUpdated", handleNotifSync);
    };
  }, [userId]);

  useEffect(() => {
    writeStorage(storageKeys.dashboardTheme, theme);
  }, [theme]);

  useEffect(() => {
    writeStorage(storageKeys.dashboardSidebarCollapsed, isCollapsed);
  }, [isCollapsed]);

  useEffect(() => {
    const handleSync = () => {
      setOwnedIds(readStorage<string[]>(userStorageKeys.ownedVehicles(userId), session?.user?.ownedVehicleIds || ["vector"]));
      setActiveVehicleId(readStorage<string>(userStorageKeys.activeVehicleId(userId), "vector"));
    };
    window.addEventListener("storage", handleSync);
    window.addEventListener("activeVehicleChanged", handleSync);
    return () => {
      window.removeEventListener("storage", handleSync);
      window.removeEventListener("activeVehicleChanged", handleSync);
    };
  }, [userId, session]);

  const selectVehicle = (id: string) => {
    setActiveVehicleId(id);
    writeStorage(userStorageKeys.activeVehicleId(userId), id);
    window.dispatchEvent(new Event("activeVehicleChanged"));
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate("/");
    window.scrollTo(0, 0);
  };

  // Auth Guard
  if (!session) {
    return (
      <div className="min-h-screen bg-[#070b10] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <h2 className="text-xl uppercase tracking-widest text-red-400">Access Denied</h2>
        <p className="text-xs text-slate-500 max-w-xs font-light">
          Please log in to access your customer dashboard portal. Redirecting to login...
        </p>
        <div className="w-12 h-0.5 bg-accent/40 animate-pulse mt-2" />
        <button
          onClick={() => navigate("/login")}
          className="rounded-full border border-white/10 px-5 py-2 text-xs uppercase tracking-widest text-slate-400 hover:text-white"
        >
          Go to Login
        </button>
      </div>
    );
  }

  const user = session.user;

  return (
    <div className={`h-screen max-h-screen overflow-hidden font-sans flex flex-col lg:flex-row transition-colors duration-300 ${
      theme === "light"
        ? "bg-[#ecf0f3] text-[#0f172a] dashboard-light-theme"
        : "bg-[#070b10] text-slate-100 dashboard-dark-theme"
    }`}>
      {/* Sidebar Navigation */}
      <aside className={`dash-raised w-full ${isCollapsed ? "lg:w-[90px]" : "lg:w-[260px]"} border-b lg:border-b-0 lg:border-r p-6 flex flex-col justify-between shrink-0 transition-all duration-300 ease-in-out lg:m-5 lg:h-[calc(100vh-40px)] lg:rounded-[28px] ${
        theme === "light"
          ? "text-slate-800"
          : "text-slate-100"
      }`}>
        <div className="dash-scroll space-y-8 flex flex-col min-h-0 overflow-y-auto pr-1">
          <div className="flex items-center justify-between gap-2 shrink-0">
            <Link
              to="/"
              className={`hover:opacity-85 flex items-center shrink-0 ${
                theme === "light" ? "text-slate-900" : "text-white"
              }`}
            >
              {isCollapsed ? (
                <span className="font-extralight font-orbitron text-xl leading-none tracking-widest text-accent pl-[0.1em]">
                  E
                </span>
              ) : (
                <LogoText />
              )}
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1 shrink-0">
            {dashboardLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                title={isCollapsed ? t(link.labelKey) : ""}
                className={({ isActive }) =>
                  `flex items-center ${isCollapsed ? "justify-center px-0" : "gap-3 px-4"} rounded-xl py-3 text-xs uppercase tracking-wider font-semibold transition ${
                    isActive
                      ? "dash-active"
                      : (theme === "light"
                          ? "text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent"
                          : "text-slate-400 hover:bg-white/5 hover:text-white border border-transparent")
                  }`
                }
              >
                <span className="relative flex items-center shrink-0">
                  {link.icon}
                  {link.to === "/dashboard/notifications" && unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[15px] h-[15px] px-1 rounded-full bg-red-500 text-white text-[8px] font-bold flex items-center justify-center leading-none">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </span>
                {!isCollapsed && <span>{t(link.labelKey)}</span>}
              </NavLink>
            ))}
          </nav>

          {/* My Vehicles list slots segment */}
          <div className="pt-6 border-t border-white/5 shrink-0 space-y-3">
            {!isCollapsed ? (
              <>
                <span className="text-[9px] uppercase tracking-[0.25em] text-slate-500 font-bold block px-2">
                  {language === "en" ? "My Vehicles" : "Araçlarım"}
                </span>
                <div className="space-y-2">
                  {ownedIds?.map((vid) => {
                    const isSelected = activeVehicleId === vid;
                    const vname = vid.charAt(0).toUpperCase() + vid.slice(1);
                    const vehicleObj = (vehiclesData as Vehicle[]).find((v) => v.id === vid);
                    const vehicleImage = vehicleObj?.image || "";
                    
                    return (
                      <button
                        key={vid}
                        onClick={() => selectVehicle(vid)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition ${
                          isSelected
                            ? "dash-inset text-accent font-bold"
                            : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                        }`}
                      >
                        <div className="w-8 h-5 flex items-center justify-center bg-black/20 rounded overflow-hidden shrink-0 border border-white/5">
                          <img src={vehicleImage} alt={vname} className="max-h-full max-w-full object-contain" />
                        </div>
                        <span className="truncate">{vname}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2.5">
                {ownedIds?.map((vid) => {
                  const isSelected = activeVehicleId === vid;
                  const vehicleObj = (vehiclesData as Vehicle[]).find((v) => v.id === vid);
                  const vehicleImage = vehicleObj?.image || "";
                  
                  return (
                    <button
                      key={vid}
                      onClick={() => selectVehicle(vid)}
                      title={vid.toUpperCase()}
                      className={`w-8 h-8 rounded-full flex items-center justify-center p-1.5 transition border ${
                        isSelected
                          ? "border-accent bg-accent/15 text-accent shadow-sm"
                          : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10"
                      }`}
                    >
                      <img src={vehicleImage} alt={vid} className="max-h-full max-w-full object-contain" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Actions & User Profile Block */}
        <div className="space-y-4 pt-6 border-t border-white/5 shrink-0 mt-auto">
          {/* User Profile Block */}
          {!isCollapsed ? (
            <div className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-2xl bg-white/[0.02] border border-white/5 shadow-sm text-xs text-slate-350 select-none">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center text-accent text-xs font-bold uppercase shrink-0">
                  {user.name.substring(0, 2)}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-200 truncate">{user.name}</p>
                  <p className="text-[9px] text-slate-500 truncate font-mono">{user.email}</p>
                </div>
              </div>
              <span className="text-slate-500 font-bold shrink-0 pr-1">✓</span>
            </div>
          ) : (
            <div className="flex justify-center py-1">
              <div className="w-8 h-8 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center text-accent text-xs font-bold uppercase" title={`${user.name} (${user.email})`}>
                {user.name.substring(0, 2)}
              </div>
            </div>
          )}

          <Link
            to="/"
            title={isCollapsed ? t("dashboard.nav.backToSite") : ""}
            className={`flex items-center ${isCollapsed ? "justify-center" : "gap-2 px-1"} text-xs uppercase tracking-wider font-semibold ${
              theme === "light" ? "text-slate-500 hover:text-slate-800" : "text-slate-400 hover:text-white"
            }`}
          >
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            {!isCollapsed && <span>{t("dashboard.nav.backToSite")}</span>}
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
      <div className="flex-grow flex flex-col overflow-x-hidden">
        {/* Top Header Utilities */}
        <header className={`dash-raised-sm border-b px-8 py-5 flex justify-between items-center transition-colors duration-300 lg:mx-5 lg:mt-5 lg:rounded-[26px] ${
          theme === "light"
            ? "border-slate-200"
            : "border-white/5"
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
                {t("nav.dashboard")}
              </h2>
              <p className="text-[10px] text-slate-500 font-light tracking-wide mt-0.5">
                {t("dashboard.header.welcomeBack")}, <span className="font-semibold">{user.name}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs uppercase tracking-[0.2em]">
            {/* Language switcher */}
            <button
              onClick={() => changeLanguage(language === "en" ? "tr" : "en")}
              className={`rounded-full border px-3 py-1.5 text-[10px] cursor-pointer uppercase transition ${
                theme === "light"
                  ? "border-slate-200 hover:border-slate-400 text-slate-600"
                  : "border-white/10 hover:border-accent/40 text-slate-350"
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
                  : "border-white/10 hover:border-accent/40 text-slate-350"
              }`}
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </button>

            {/* Profile Avatar indicator */}
            <div className="w-8 h-8 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center text-accent text-xs font-bold uppercase shadow-sm shrink-0">
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
export default DashboardLayout;
