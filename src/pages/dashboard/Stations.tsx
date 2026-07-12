import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { readStorage, writeStorage, storageKeys, userStorageKeys } from "@/lib/storage";
import stationsData from "@/data/stations.json";
import { Station } from "@/types";

// Helper component to pan map smoothly on center change
function ChangeMapView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true, duration: 1.5 });
  }, [center, zoom, map]);
  return null;
}

export function Stations() {
  const { language } = useLanguage();
  const { session } = useAuth();
  const { showToast } = useToast();
  const userId = session?.user.id || "guest";

  const [stations] = useState<Station[]>(() => {
    const stored = readStorage<Station[]>(storageKeys.stations, []);
    if (stored.length === 0 || stored.some((s) => !s.type)) {
      writeStorage(storageKeys.stations, stationsData as Station[]);
      return stationsData as Station[];
    }
    return stored;
  });

  const [favoriteStationIds, setFavoriteStationIds] = useState<string[]>(() =>
    readStorage<string[]>(userStorageKeys.favoriteStations(userId), [])
  );

  const [reservedStationIds, setReservedStationIds] = useState<string[]>(() =>
    readStorage<string[]>(userStorageKeys.reservations(userId), [])
  );

  const RESERVATION_DURATION_MS = 15 * 60 * 1000;

  const [reservationExpiries, setReservationExpiries] = useState<Record<string, number>>(() =>
    readStorage<Record<string, number>>(userStorageKeys.reservationExpiry(userId), {})
  );
  const [now, setNow] = useState(Date.now());

  const [filterType, setFilterType] = useState<"ALL" | "DC" | "AC">("ALL");
  const [mapCenter, setMapCenter] = useState<[number, number]>([41.0082, 28.9784]); // Istanbul center
  const [mapZoom, setMapZoom] = useState(11);
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);

  useEffect(() => {
    setFavoriteStationIds(readStorage<string[]>(userStorageKeys.favoriteStations(userId), []));
    setReservedStationIds(readStorage<string[]>(userStorageKeys.reservations(userId), []));
    setReservationExpiries(readStorage<Record<string, number>>(userStorageKeys.reservationExpiry(userId), {}));
  }, [userId]);

  useEffect(() => {
    writeStorage(userStorageKeys.favoriteStations(userId), favoriteStationIds);
  }, [favoriteStationIds, userId]);

  useEffect(() => {
    writeStorage(userStorageKeys.reservations(userId), reservedStationIds);

    // Sync reserved stations list to global store for admin dashboard visibility
    const globalReservations = readStorage<Record<string, string[]>>(storageKeys.allReservations, {});
    globalReservations[userId] = reservedStationIds;
    writeStorage(storageKeys.allReservations, globalReservations);
  }, [reservedStationIds, userId]);

  useEffect(() => {
    writeStorage(userStorageKeys.reservationExpiry(userId), reservationExpiries);
  }, [reservationExpiries, userId]);

  // Tick every second to keep the countdown live and auto-release expired reservations
  useEffect(() => {
    const interval = setInterval(() => {
      const currentTime = Date.now();
      setNow(currentTime);
      setReservationExpiries((prevExpiries) => {
        const expiredIds = Object.keys(prevExpiries).filter((id) => prevExpiries[id] <= currentTime);
        if (expiredIds.length === 0) return prevExpiries;

        setReservedStationIds((prevReserved) => prevReserved.filter((id) => !expiredIds.includes(id)));
        expiredIds.forEach((stationId) => {
          const stationObj = stations.find((s) => s.id === stationId);
          showToast(
            language === "en"
              ? `Reservation at ${stationObj?.name || stationId} expired`
              : `${stationObj?.name || stationId} istasyonundaki rezervasyon süresi doldu`,
            "info"
          );
        });

        const nextExpiries = { ...prevExpiries };
        expiredIds.forEach((id) => delete nextExpiries[id]);
        return nextExpiries;
      });
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  const handleToggleReserve = (station: Station) => {
    const isReserved = reservedStationIds.includes(station.id);
    if (isReserved) {
      setReservedStationIds((prev) => prev.filter((id) => id !== station.id));
      setReservationExpiries((prev) => {
        const next = { ...prev };
        delete next[station.id];
        return next;
      });
      showToast(
        language === "en"
          ? "Reservation cancelled successfully"
          : "Rezervasyon başarıyla iptal edildi",
        "info"
      );

      // Add system notification
      const notifs = readStorage<any[]>(storageKeys.notifications, []);
      const newNotif = {
        id: `notif-${Date.now()}`,
        userId,
        title: language === "en" ? "Reservation Cancelled" : "Rezervasyon İptal Edildi",
        message: language === "en"
          ? `Your reservation at ${station.name} has been cancelled.`
          : `${station.name} istasyonundaki rezervasyonunuz iptal edildi.`,
        read: false,
        createdAt: new Date().toISOString()
      };
      writeStorage(storageKeys.notifications, [newNotif, ...notifs]);
      window.dispatchEvent(new Event("evalis:notificationsUpdated"));
    } else {
      if (station.availablePorts <= 0) {
        showToast(
          language === "en"
            ? "No ports available for reservation"
            : "Rezervasyon için kullanılabilir soket yok",
          "error"
        );
        return;
      }
      setReservedStationIds((prev) => [...prev, station.id]);
      setReservationExpiries((prev) => ({ ...prev, [station.id]: Date.now() + RESERVATION_DURATION_MS }));
      showToast(
        language === "en"
          ? "Port reserved for 15 minutes!"
          : "Soket 15 dakika boyunca rezerve edildi!",
        "success"
      );

      // Add system notification
      const notifs = readStorage<any[]>(storageKeys.notifications, []);
      const newNotif = {
        id: `notif-${Date.now()}`,
        userId,
        title: language === "en" ? "Port Reserved" : "Soket Rezerve Edildi",
        message: language === "en"
          ? `Port at ${station.name} is reserved for 15 minutes.`
          : `${station.name} istasyonundaki şarj soketi 15 dakika boyunca rezerve edildi.`,
        read: false,
        createdAt: new Date().toISOString()
      };
      writeStorage(storageKeys.notifications, [newNotif, ...notifs]);
      window.dispatchEvent(new Event("evalis:notificationsUpdated"));
    }
  };

  const formatCountdown = (stationId: string) => {
    const expiresAt = reservationExpiries[stationId];
    if (!expiresAt) return null;
    const remainingMs = Math.max(0, expiresAt - now);
    const minutes = Math.floor(remainingMs / 60000);
    const seconds = Math.floor((remainingMs % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const filteredStations = stations
    .filter((s) => filterType === "ALL" || s.type === filterType)
    .sort((a, b) => {
      const aFavorite = favoriteStationIds.includes(a.id);
      const bFavorite = favoriteStationIds.includes(b.id);
      if (aFavorite === bFavorite) {
        return b.availablePorts - a.availablePorts;
      }
      return aFavorite ? -1 : 1;
    });

  const getCustomMarkerIcon = (isActive: boolean, type: "AC" | "DC") => {
    let colorClass = "bg-red-500 shadow-[0_0_8px_#ef4444]";
    if (isActive) {
      if (type === "DC") {
        colorClass = "bg-accent shadow-[0_0_8px_#2a7a5f] animate-pulse";
      } else {
        colorClass = "bg-sky-400 shadow-[0_0_8px_#38bdf8] animate-pulse";
      }
    }
    return L.divIcon({
      className: "custom-leaflet-marker",
      html: `<div class="w-8 h-8 rounded-full flex items-center justify-center bg-slate-900/90 border border-white/10 shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
        <span class="w-3 h-3 rounded-full ${colorClass}" />
      </div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
  };

  const handleSelectStation = (station: Station) => {
    setMapCenter([station.latitude, station.longitude]);
    setMapZoom(14);
    setSelectedStationId(station.id);
  };

  const handleToggleFavorite = (station: Station) => {
    setFavoriteStationIds((prev) => {
      const isFavorite = prev.includes(station.id);
      showToast(
        isFavorite
          ? language === "en"
            ? "Station removed from favorites"
            : "İstasyon favorilerden kaldırıldı"
          : language === "en"
            ? "Station added to favorites"
            : "İstasyon favorilere eklendi",
        isFavorite ? "info" : "success"
      );
      return isFavorite ? prev.filter((id) => id !== station.id) : [...prev, station.id];
    });
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      
      {/* 1. Header Segment using soft raised design */}
      <div className="dash-panel p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-light uppercase tracking-widest text-slate-100">
            {language === "en" ? "Supercharger Stations" : "Supercharger İstasyonları"}
          </h1>
          <p className="text-[9px] text-slate-500 font-light tracking-wide mt-1">
            {language === "en"
              ? "Locate and review real-time EVALIS charging port networks in Istanbul."
              : "İstanbul genelindeki anlık EVALIS şarj noktası ağını bulun ve inceleyin."}
          </p>
        </div>

        {/* Legend Indicator */}
        <div className="flex items-center gap-4 text-[9px] font-mono text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
            <span>DC (Emerald)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-pulse" />
            <span>AC (Sky-Blue)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span>Offline</span>
          </div>
        </div>
      </div>

      {/* 2. Main content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8 items-start">
        
        {/* Left Side: Station List Panel */}
        <div className="space-y-4">
          
          {/* Charger Type Filter toggles */}
          <div className="flex gap-2 text-[9px] uppercase font-bold tracking-wider">
            {(["ALL", "DC", "AC"] as const).map((item) => {
              const count = item === "ALL" 
                ? stations.length 
                : stations.filter((s) => s.type === item).length;
              const isActive = filterType === item;
              return (
                <button
                  key={item}
                  onClick={() => setFilterType(item)}
                  className={`flex-1 py-2.5 rounded-xl border text-center transition cursor-pointer font-bold ${
                    isActive 
                      ? "border-accent/40 bg-accent/15 text-accent font-extrabold" 
                      : "border-white/10 bg-white/5 text-slate-400 hover:text-white"
                  }`}
                >
                  {item} ({count})
                </button>
              );
            })}
          </div>

          {/* List panel */}
          <div className="dash-panel p-5 shadow-lg space-y-4 max-h-[50vh] lg:max-h-[520px] overflow-y-auto pr-2">
            <h3 className="text-[10px] uppercase tracking-[0.25em] text-slate-500 font-bold block pb-2 border-b border-white/5">
              {language === "en" ? "NEARBY STATIONS" : "YAKINDAKİ İSTASYONLAR"}
            </h3>

            <div className="space-y-3">
              {filteredStations.map((station) => {
                const isSelected = selectedStationId === station.id;
                const isActive = station.status === "active";
                const isFavorite = favoriteStationIds.includes(station.id);
                const isReserved = reservedStationIds.includes(station.id);
                const currentAvailable = isReserved ? Math.max(0, station.availablePorts - 1) : station.availablePorts;

                return (
                  <div
                    key={station.id}
                    onClick={() => handleSelectStation(station)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleSelectStation(station);
                      }
                    }}
                    className={`border p-4 rounded-2xl cursor-pointer transition flex flex-col justify-between gap-3 text-xs font-light text-slate-400 ${
                      isSelected
                        ? "border-accent bg-accent/5 text-slate-200"
                        : "border-white/5 bg-white/[0.01] hover:border-white/10 hover:text-slate-350"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="font-semibold text-white uppercase tracking-wider text-[11px] truncate max-w-[170px]">
                          {station.name.replace("EVALIS ", "")}
                        </h4>
                        
                        <div className="flex items-center gap-1.5 shrink-0">
                          {isReserved && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[8px] font-bold uppercase tracking-wider font-mono">
                              {language === "en" ? "RESERVED" : "REZERVE"} · {formatCountdown(station.id)}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleToggleFavorite(station);
                            }}
                            title={isFavorite ? (language === "en" ? "Remove favorite" : "Favoriden çıkar") : (language === "en" ? "Add favorite" : "Favorilere ekle")}
                            aria-label={isFavorite ? (language === "en" ? "Remove favorite" : "Favoriden çıkar") : (language === "en" ? "Add favorite" : "Favorilere ekle")}
                            className={`w-7 h-7 rounded-full border flex items-center justify-center text-sm transition cursor-pointer ${
                              isFavorite
                                ? "border-accent/40 bg-accent/15 text-accent"
                                : "border-white/10 bg-white/5 text-slate-500 hover:text-accent"
                            }`}
                          >
                            {isFavorite ? "★" : "☆"}
                          </button>
                          <span className={`w-2 h-2 rounded-full ${isActive ? "bg-accent shadow-[0_0_6px_#2a7a5f]" : "bg-red-500"}`} />
                        </div>
                      </div>

                      <p className="text-[9px] text-slate-500 font-mono flex items-center gap-1.5 flex-wrap">
                        <span>⚡ {station.power}</span>
                        <span>•</span>
                        <span className="text-[8px] font-bold px-1.5 py-0.2 rounded bg-white/5 border border-white/10 text-slate-300">
                          {station.type} ({station.connector})
                        </span>
                      </p>
                    </div>

                    <div className="flex justify-between items-center text-[10px] border-t border-white/5 pt-2">
                      <span>
                        {language === "en" ? "Available Ports" : "Kullanılabilir Soket"}
                      </span>
                      <span className={`font-semibold ${currentAvailable > 0 ? "text-accent" : "text-red-400"}`}>
                        {currentAvailable} / {station.totalPorts}
                      </span>
                    </div>

                    {/* Reserve Actions inside sidebar items */}
                    {isActive && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleReserve(station);
                        }}
                        className={`w-full py-1.5 rounded-xl border text-[9px] font-bold uppercase tracking-wider transition ${
                          isReserved
                            ? "bg-amber-500/10 border-amber-500/30 text-amber-500 hover:bg-amber-500/20"
                            : "bg-white text-black border-transparent hover:bg-slate-200"
                        }`}
                      >
                        {isReserved 
                          ? (language === "en" ? "Cancel Reservation" : "Rezervasyonu İptal Et") 
                          : (language === "en" ? "Reserve Port" : "Soket Rezerve Et")}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side: Map Display */}
        <div className="h-[450px] lg:h-[580px] rounded-[28px] overflow-hidden border border-white/5 shadow-lg relative bg-slate-950 z-0">
          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            style={{ width: "100%", height: "100%" }}
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              className="map-tiles-dark"
            />

            <ChangeMapView center={mapCenter} zoom={mapZoom} />

            {filteredStations.map((station) => {
              const isActive = station.status === "active";
              const isFavorite = favoriteStationIds.includes(station.id);
              const isReserved = reservedStationIds.includes(station.id);
              const currentAvailable = isReserved ? Math.max(0, station.availablePorts - 1) : station.availablePorts;

              return (
                <Marker
                  key={station.id}
                  position={[station.latitude, station.longitude]}
                  icon={getCustomMarkerIcon(isActive, station.type)}
                  eventHandlers={{
                    click: () => {
                      setSelectedStationId(station.id);
                      setMapCenter([station.latitude, station.longitude]);
                    }
                  }}
                >
                  <Popup className="custom-leaflet-popup">
                    <div className="text-xs space-y-2.5 p-1.5 font-light text-slate-350">
                      <h4 className="font-semibold text-white uppercase tracking-wider border-b border-white/10 pb-1.5 flex justify-between items-center gap-4">
                        <span>{station.name}</span>
                        {isReserved && (
                          <span className="px-1.5 py-0.2 bg-amber-500/20 border border-amber-500/30 text-amber-500 rounded text-[7px] font-bold tracking-widest font-mono">
                            RESERVED · {formatCountdown(station.id)}
                          </span>
                        )}
                      </h4>
                      <p>🔋 {language === "en" ? "Power Rating" : "Şarj Hızı"}: <span className="font-semibold text-white">{station.power} ({station.type} - {station.connector})</span></p>
                      <p>⚡ {language === "en" ? "Available" : "Kullanılabilir"}: <span className="font-semibold text-accent">{currentAvailable} / {station.totalPorts}</span></p>
                      <p>⚙️ {language === "en" ? "Status" : "Durum"}: <span className={`font-semibold uppercase tracking-wider ${isActive ? "text-accent" : "text-red-400"}`}>{station.status}</span></p>
                      
                      <div className="flex gap-2 mt-2 pt-1 border-t border-white/5">
                        <button
                          type="button"
                          onClick={() => handleToggleFavorite(station)}
                          title={isFavorite ? (language === "en" ? "Remove favorite" : "Favoriden çıkar") : (language === "en" ? "Add favorite" : "Favorilere ekle")}
                          aria-label={isFavorite ? (language === "en" ? "Remove favorite" : "Favoriden çıkar") : (language === "en" ? "Add favorite" : "Favorilere ekle")}
                          className={`flex-1 rounded-xl border py-1.5 text-[8px] font-bold uppercase tracking-wider transition ${
                            isFavorite
                              ? "border-accent/40 bg-accent/15 text-accent"
                              : "border-white/10 bg-white/5 text-slate-200 hover:text-accent"
                          }`}
                        >
                          {isFavorite ? "★" : "☆"}
                        </button>
                        
                        {isActive && (
                          <button
                            type="button"
                            onClick={() => handleToggleReserve(station)}
                            className={`flex-[2] rounded-xl py-1.5 text-[8px] font-bold uppercase tracking-wider transition ${
                              isReserved
                                ? "bg-amber-500/10 border border-amber-500/30 text-amber-500 hover:bg-amber-500/20"
                                : "bg-white text-black hover:bg-slate-200"
                            }`}
                          >
                            {isReserved 
                              ? (language === "en" ? "Cancel" : "İptal Et") 
                              : (language === "en" ? "Reserve" : "Rezerve Et")}
                          </button>
                        )}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>

      </div>

      <style>{`
        .map-tiles-dark {
          filter: invert(100%) hue-rotate(185deg) brightness(85%) contrast(90%);
        }
        .leaflet-popup-content-wrapper {
          background: #0a0f18 !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          border-radius: 12px !important;
          box-shadow: 0 8px 24px rgba(0,0,0,0.5) !important;
        }
        .leaflet-popup-tip {
          background: #0a0f18 !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
        }
        .leaflet-popup-close-button {
          color: #94a3b8 !important;
        }
      `}</style>
    </div>
  );
}
export default Stations;
