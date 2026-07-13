import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useLanguage } from "@/i18n/LanguageContext";
import { useCart } from "@/context/CartContext";
import { readStorage, writeStorage, storageKeys } from "@/lib/storage";
import vehiclesData from "@/data/vehicles.json";
import productsDataRaw from "@/data/products.json";
import productCategoriesData from "@/data/productCategories.json";
import stationsData from "@/data/stations.json";
import { Station, Product, ProductCategory } from "@/types";
import { vehicleType } from "@/data/vehicleTranslations";
import { productName, productShortDescription, productFullDescription, productCategoryLabelsTr } from "@/data/productTranslations";

const productsData = productsDataRaw as Product[];

// Helper component to pan map smoothly on center change
function ChangeMapView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true, duration: 1.5 });
  }, [center, zoom, map]);
  return null;
}

function StationStars({ rating }: { rating: number }) {
  const filled = Math.round(rating);
  return (
    <span className="inline-flex items-center gap-0.5" aria-hidden="true">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={`w-2.5 h-2.5 ${i < filled ? "text-amber-400" : "text-slate-600"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M10 1.5l2.6 5.6 6.1.6-4.6 4.1 1.3 6-5.4-3.1-5.4 3.1 1.3-6-4.6-4.1 6.1-.6z" />
        </svg>
      ))}
    </span>
  );
}

export function Home() {
  const { t, formatPrice, language } = useLanguage();
  const { addToCart, setIsCartOpen } = useCart();

  const [quickViewProduct, setQuickViewProduct] = useState<any | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);

  const categoryLabel = (categoryId: string) => {
    const cat = readStorage<ProductCategory[]>(storageKeys.productCategories, productCategoriesData as ProductCategory[]).find(
      (c) => c.id === categoryId
    );
    if (!cat) return categoryId;
    return language === "en" ? cat.name : productCategoryLabelsTr[categoryId] || cat.name;
  };

  // Bestsellers row scroll controls
  const bestSellersRef = useRef<HTMLDivElement>(null);
  const scrollBestSellers = (direction: "left" | "right") => {
    const container = bestSellersRef.current;
    if (!container) return;
    const amount = Math.round(container.clientWidth * 0.8);
    container.scrollBy({ left: direction === "left" ? -amount : amount, behavior: "smooth" });
  };

  // Load vehicles and filter best-selling products from mock data
  const vehicles = vehiclesData;

  // Load stations from local storage to keep CRUD operations synchronized
  const [stations] = useState<Station[]>(() => {
    const stored = readStorage<Station[]>(storageKeys.stations, []);
    if (stored.length === 0 || stored.some((s) => !s.type || s.rating === undefined)) {
      writeStorage(storageKeys.stations, stationsData as Station[]);
      return stationsData as Station[];
    }
    return stored;
  });

  const [filterType, setFilterType] = useState<"ALL" | "DC" | "AC">("ALL");
  const [selectedStationId, setSelectedStationId] = useState<string>("sta-01");
  const [mapCenter, setMapCenter] = useState<[number, number]>([40.9901, 29.0292]);
  const [mapZoom, setMapZoom] = useState<number>(12);

  const filteredStations = stations.filter(
    (s) => filterType === "ALL" || s.type === filterType
  );

  const handleSelectStation = (station: Station) => {
    setSelectedStationId(station.id);
    setMapCenter([station.latitude, station.longitude]);
    setMapZoom(14);
  };

  // Scroll to hash element on load/change
  useEffect(() => {
    const handleScrollToHash = () => {
      if (window.location.hash === "#find-charger") {
        const element = document.getElementById("find-charger");
        if (element) {
          setTimeout(() => {
            element.scrollIntoView({ behavior: "smooth" });
          }, 200);
        }
      }
    };

    handleScrollToHash();
    window.addEventListener("hashchange", handleScrollToHash);
    return () => window.removeEventListener("hashchange", handleScrollToHash);
  }, []);

  // Custom marker generator (glowing green for active DC, glowing blue for active AC, solid red for offline)
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



  return (
    <div className="space-y-24 pb-20">
      {/* Cinematic Hero Banner */}
      <section className="relative h-screen min-h-[600px] w-full overflow-hidden flex flex-col justify-between pt-32 pb-16 items-center text-center p-8 bg-site">
        {/* Background Image with Dark Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/hero.png"
            alt="EVALIS Lineup"
            className="w-full h-full object-cover opacity-85"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-site via-site/10 to-transparent" />
        </div>

        {/* Centered Futuristic Title and Subtitle with load animation */}
        <div className="relative z-10 space-y-6 max-w-4xl mx-auto px-6 animate-fade-in-up">
          <h1 className="text-6xl md:text-9xl tracking-[0.35em] uppercase text-white font-extralight font-orbitron pl-[0.35em]">
            EVALIS
          </h1>
          <div className="w-24 h-px bg-white/10 mx-auto my-4 animate-pulse" />
          <p className="text-[11px] md:text-[13px] tracking-[0.65em] uppercase text-slate-455 font-extralight font-orbitron pl-[0.65em]">
            {language === "en" ? "DRIVE THE FUTURE" : "GELECEĞİ SÜR"}
          </p>
        </div>

        {/* Bottom Tagline */}
        <div className="relative z-10 text-[10px] md:text-xs uppercase tracking-[0.4em] text-slate-500 font-extralight pl-[0.4em] animate-fade-in-up">
          {language === "en" ? "Intelligent • Electric • Effortless" : "Akıllı • Elektrikli • Zahmetsiz"}
        </div>
      </section>

      {/* Our Lineup Section */}
      <section className="space-y-12 max-w-7xl mx-auto px-6">
        <div className="space-y-2">
          <span className="text-xs uppercase tracking-[0.3em] text-accent font-semibold block">
            {t("vehicles.lineup")}
          </span>
          <h2 className="text-3xl font-light tracking-widest uppercase text-white">
            {t("vehicles.lineupTitle")}
          </h2>
        </div>

        {/* Vehicle Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {vehicles.map((vehicle) => {
            // Determine vehicle-specific specs for Home preview (matching Image 1)
            let specLabel1 = t("vehicles.range");
            let specVal1 = vehicle.specs.range;
            let specLabel2 = "";
            let specVal2 = "";
            let specLabel3 = "0-100 km/h";
            let specVal3 = vehicle.specs.acceleration;

            if (vehicle.id === "vector") {
              specLabel2 = language === "en" ? "MAX POWER" : "MAKS. GÜÇ";
              specVal2 = vehicle.specs.maxPower;
            } else if (vehicle.id === "cloud") {
              specLabel2 = language === "en" ? "CARGO" : "BAGAJ";
              specVal2 = "850 L";
            } else if (vehicle.id === "bullet") {
              specLabel2 = language === "en" ? "WEIGHT" : "AĞIRLIK";
              specVal2 = "140 kg";
              specLabel3 = "0-50 km/h";
            }

            return (
              <Link
                key={vehicle.id}
                to={`/vehicles/${vehicle.id}`}
                className="group relative rounded-3xl border border-white/5 bg-white/[0.01] overflow-hidden flex flex-col justify-between hover:border-white/10 hover:bg-white/[0.02] transition duration-300 cursor-pointer"
              >
                {/* Image container */}
                <div className="relative aspect-[16/10] overflow-hidden bg-slate-900">
                  <img
                    src={vehicle.image}
                    alt={vehicle.name}
                    className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                </div>

                {/* Info and specs */}
                <div className="p-6 space-y-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-light tracking-widest uppercase text-white flex items-center gap-2">
                        {vehicle.name}
                      </h3>
                      <p className="text-xs text-slate-400 font-light mt-1">
                        {vehicleType(vehicle.id, vehicle.type, language)}
                      </p>
                    </div>
                    <div className="w-8 h-8 rounded-full border border-white/15 flex items-center justify-center text-slate-400 group-hover:border-accent group-hover:text-accent transition duration-300">
                      →
                    </div>
                  </div>

                  {/* Specs Row */}
                  <div className="grid grid-cols-3 gap-2 border-t border-white/10 pt-4 text-center">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                        {specLabel1}
                      </span>
                      <span className="text-sm font-light text-slate-200 mt-1 block">
                        {specVal1}
                      </span>
                    </div>
                    <div className="border-x border-white/10">
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                        {specLabel2}
                      </span>
                      <span className="text-sm font-light text-slate-200 mt-1 block">
                        {specVal2}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                        {specLabel3}
                      </span>
                      <span className="text-sm font-light text-slate-200 mt-1 block">
                        {specVal3}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Charging & Accessories Section */}
      <section className="space-y-12 max-w-7xl mx-auto px-6 overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-white/5 pb-6">
          <div className="space-y-2">
            <span className="text-xs uppercase tracking-[0.3em] text-accent font-semibold block">
              {t("shop.bestSellers")}
            </span>
            <h2 className="text-3xl font-light tracking-widest uppercase text-white">
              {t("shop.title")}
            </h2>
          </div>
          <div className="flex items-center gap-5">
            <Link
              to="/shop"
              className="text-xs uppercase tracking-widest text-[#2a7a5f] hover:text-emerald-400 font-semibold border-b border-accent/40 pb-1.5 transition duration-300"
            >
              {language === "en" ? "See All Products →" : "Tüm Ürünleri Gör →"}
            </Link>

            {/* Scroll controls */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => scrollBestSellers("left")}
                aria-label={language === "en" ? "Scroll left" : "Sola kaydır"}
                className="w-9 h-9 rounded-full border border-white/10 hover:border-accent/40 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => scrollBestSellers("right")}
                aria-label={language === "en" ? "Scroll right" : "Sağa kaydır"}
                className="w-9 h-9 rounded-full border border-white/10 hover:border-accent/40 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Product Cards Slidable Container */}
        <div
          ref={bestSellersRef}
          className="flex gap-6 overflow-x-auto pb-8 scroll-smooth snap-x snap-mandatory scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
        >
          {productsData.map((product) => {
            return (
              <div
                key={product.id}
                onClick={() => {
                  setQuickViewProduct(product);
                  setCarouselIndex(0);
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setQuickViewProduct(product);
                    setCarouselIndex(0);
                  }
                }}
                className="group border border-white/5 bg-white/[0.01] hover:border-white/10 rounded-3xl overflow-hidden flex flex-col justify-between transition duration-300 w-[290px] md:w-[350px] shrink-0 snap-start cursor-pointer hover:bg-white/[0.02]"
              >
                <div>
                  {/* Product Image */}
                  <div className="relative aspect-[4/3] bg-white/[0.02] flex items-center justify-center p-8 overflow-hidden">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="max-h-full max-w-full object-contain rounded-2xl transition duration-500 group-hover:scale-105"
                    />
                  </div>

                  {/* Product Info */}
                  <div className="p-6 pb-2 space-y-2 border-t border-white/5">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="text-md font-light uppercase tracking-wider text-white">
                        {productName(product.id, product.name, language)}
                      </h3>
                      <span className="text-sm font-semibold text-accent shrink-0">
                        {formatPrice(product.priceUSD, product.priceTRY)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-light mt-0.5 line-clamp-2">
                      {productShortDescription(product.id, product.shortDescription, language)}
                    </p>
                  </div>
                </div>

                {/* CTAs outside Link to keep functionality separate */}
                <div className="p-6 pt-2">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart(product);
                      setIsCartOpen(true);
                    }}
                    className="w-full py-2.5 rounded-full bg-accent text-black text-[10px] font-semibold uppercase tracking-widest hover:bg-[#348c70] transition cursor-pointer"
                  >
                    {t("shop.addToCart")}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Find a Charger Section (Map view) - RIGHT ABOVE FOOTER */}
      <section id="find-charger" className="space-y-12 max-w-7xl mx-auto px-6">
        <div className="space-y-2">
          <span className="text-xs uppercase tracking-[0.3em] text-accent font-semibold block">
            {language === "en" ? "LOCATE TERMINALS" : "ŞARJ AĞINI KEŞFEDİN"}
          </span>
          <h2 className="text-3xl font-light tracking-widest uppercase text-white">
            {language === "en" ? "FIND A CHARGER" : "ŞARJ NOKTASI BULUN"}
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8 items-start">
          {/* Station List Panel */}
          <div className="space-y-4">
            {/* Charger Type Filter toggles */}
            <div className="flex gap-1.5 text-[9px] uppercase font-bold tracking-wider">
              <button
                onClick={() => setFilterType("ALL")}
                className={`flex-1 py-2 rounded-xl border text-center transition cursor-pointer ${
                  filterType === "ALL" ? "bg-accent border-accent text-black font-extrabold" : "border-white/10 text-slate-400 hover:text-white"
                }`}
              >
                {language === "en" ? "All" : "Tümü"} ({stations.length})
              </button>
              <button
                onClick={() => setFilterType("DC")}
                className={`flex-1 py-2 rounded-xl border text-center transition cursor-pointer ${
                  filterType === "DC" ? "bg-accent border-accent text-black font-extrabold" : "border-white/10 text-slate-400 hover:text-white"
                }`}
              >
                DC ({stations.filter((s) => s.type === "DC").length})
              </button>
              <button
                onClick={() => setFilterType("AC")}
                className={`flex-1 py-2 rounded-xl border text-center transition cursor-pointer ${
                  filterType === "AC" ? "bg-accent border-accent text-black font-extrabold" : "border-white/10 text-slate-400 hover:text-white"
                }`}
              >
                AC ({stations.filter((s) => s.type === "AC").length})
              </button>
            </div>

            <div className="border border-white/5 bg-[#0a0f18]/60 backdrop-blur-md rounded-3xl p-5 shadow-lg space-y-4 max-h-[345px] overflow-y-auto pr-2">
              <h3 className="text-[10px] uppercase tracking-[0.25em] text-slate-450 font-bold block pb-2 border-b border-white/5">
                {language === "en" ? "NEARBY STATIONS" : "YAKINDAKİ İSTASYONLAR"}
              </h3>

              <div className="space-y-3">
                {filteredStations.map((station) => {
                  const isSelected = selectedStationId === station.id;
                  const isActive = station.status === "active";
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
                          <h4 className="font-semibold text-white uppercase tracking-wider text-[11px] truncate max-w-[190px]">
                            {station.name.replace("EVALIS ", "")}
                          </h4>
                          <span className={`w-2 h-2 rounded-full shrink-0 mt-1 ${isActive ? "bg-accent shadow-[0_0_6px_#2a7a5f]" : "bg-red-500"}`} />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <StationStars rating={station.rating} />
                          <span className="text-[8px] text-slate-500 font-mono">
                            {station.rating.toFixed(1)} ({station.reviewCount})
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5 flex-wrap">
                          <span>⚡ {station.power}</span>
                          <span>•</span>
                          <span className="text-[8px] font-bold px-1 py-0.2 rounded bg-white/5 border border-white/10 text-slate-300">
                            {station.type} ({station.connector})
                          </span>
                        </p>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-[10px] border-t border-white/5 pt-2">
                          <span>{language === "en" ? "Available Ports" : "Kullanılabilir Soket"}</span>
                          <span className={`font-semibold ${station.availablePorts > 0 ? "text-accent" : "text-red-400"}`}>
                            {station.availablePorts} / {station.totalPorts}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[10px]">
                          <span>{language === "en" ? "Price" : "Fiyat"}</span>
                          <span className="text-slate-300 font-mono">
                            {formatPrice(station.pricePerKwhUSD, station.pricePerKwhTRY)}/kWh
                          </span>
                        </div>
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${station.latitude},${station.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="block text-center text-[9px] uppercase tracking-widest text-accent hover:text-white font-bold transition pt-1"
                        >
                          {language === "en" ? "Get Directions" : "Yol Tarifi Al"}
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Leaflet Map panel */}
          <div className="w-full h-[400px] rounded-3xl overflow-hidden border border-white/5 relative z-10 shadow-xl bg-slate-950">
            <MapContainer
              center={mapCenter}
              zoom={mapZoom}
              scrollWheelZoom={false}
              className="w-full h-full"
            >
              <ChangeMapView center={mapCenter} zoom={mapZoom} />
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              />
              {filteredStations.map((station) => {
                const isActive = station.status === "active";
                return (
                  <Marker
                    key={station.id}
                    position={[station.latitude, station.longitude]}
                    icon={getCustomMarkerIcon(isActive, station.type)}
                  >
                    <Popup>
                      <div className="text-slate-900 p-1 space-y-1 min-w-[160px]">
                        <h4 className="font-bold text-xs uppercase tracking-wide border-b border-slate-200 pb-1">{station.name}</h4>
                        <div className="flex items-center gap-1.5">
                          <StationStars rating={station.rating} />
                          <span className="text-[9px] font-mono text-slate-600">{station.rating.toFixed(1)} ({station.reviewCount})</span>
                        </div>
                        <p className="text-[10px] font-mono">{language === "en" ? "Power" : "Güç"}: <span className="font-semibold">{station.power}</span></p>
                        <p className="text-[10px] font-mono">{language === "en" ? "Type" : "Tip"}: <span className="font-semibold text-emerald-600 font-bold">{station.type} ({station.connector})</span></p>
                        <p className="text-[10px] font-mono">{language === "en" ? "Ports" : "Soket"}: <span className="font-semibold">{station.availablePorts} / {station.totalPorts}</span></p>
                        <p className="text-[10px] font-mono">{language === "en" ? "Price" : "Fiyat"}: <span className="font-semibold">{formatPrice(station.pricePerKwhUSD, station.pricePerKwhTRY)}/kWh</span></p>
                        <p className="text-[10px] font-mono">{language === "en" ? "Status" : "Durum"}: <span className={`font-bold ${isActive ? "text-emerald-600" : "text-red-500"}`}>{isActive ? (language === "en" ? "ACTIVE" : "AKTİF") : (language === "en" ? "MAINTENANCE" : "BAKIMDA")}</span></p>
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${station.latitude},${station.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-center mt-1 pt-1 border-t border-slate-200 text-[9px] uppercase tracking-widest font-bold text-emerald-600 hover:text-emerald-700 transition"
                        >
                          {language === "en" ? "Get Directions" : "Yol Tarifi Al"}
                        </a>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>
        </div>
      </section>

      {/* Quick View Details Modal */}
      {quickViewProduct && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 text-left">
          {/* Backdrop */}
          <div
            onClick={() => setQuickViewProduct(null)}
            className="absolute inset-0 bg-black/80 backdrop-blur-md animate-fade-in"
          />

          {/* Modal Content */}
          <div className="relative w-full max-w-4xl bg-site border border-white/10 rounded-3xl shadow-2xl p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 z-10 animate-scale-up max-h-[90vh] overflow-y-auto">
            {/* Close trigger */}
            <button
              onClick={() => setQuickViewProduct(null)}
              aria-label={language === "en" ? "Close" : "Kapat"}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-lg cursor-pointer transition"
            >
              ✕
            </button>

            {/* Left Column: Image / Image Carousel */}
            <div className="relative bg-white/[0.01] border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[300px]">
              {quickViewProduct.images && quickViewProduct.images.length > 1 ? (
                /* Multi-image Carousel */
                <div className="relative w-full h-full flex flex-col items-center justify-center">
                  <img
                    src={quickViewProduct.images[carouselIndex]}
                    alt={quickViewProduct.name}
                    className="max-h-[250px] object-contain rounded-xl transition-all duration-300"
                  />
                  {/* Controls */}
                  <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-2">
                    <button
                      onClick={() =>
                        setCarouselIndex((prev) =>
                          prev === 0 ? quickViewProduct.images!.length - 1 : prev - 1
                        )
                      }
                      className="w-8 h-8 rounded-full bg-black/70 border border-white/10 flex items-center justify-center text-white hover:bg-black/90 transition cursor-pointer"
                    >
                      ←
                    </button>
                    <button
                      onClick={() =>
                        setCarouselIndex((prev) =>
                          prev === quickViewProduct.images!.length - 1 ? 0 : prev + 1
                        )
                      }
                      className="w-8 h-8 rounded-full bg-black/70 border border-white/10 flex items-center justify-center text-white hover:bg-black/90 transition cursor-pointer"
                    >
                      →
                    </button>
                  </div>
                  {/* Indicators */}
                  <div className="flex gap-2 mt-4">
                    {quickViewProduct.images.map((_: any, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => setCarouselIndex(idx)}
                        className={`w-2 h-2 rounded-full transition cursor-pointer ${
                          carouselIndex === idx ? "bg-accent" : "bg-white/20"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                /* Single Image product */
                <img
                  src={quickViewProduct.image}
                  alt={quickViewProduct.name}
                  className="max-h-[250px] object-contain rounded-xl"
                />
              )}
            </div>

            {/* Right Column: Product specs and description */}
            <div className="flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] text-accent uppercase tracking-widest block font-medium">
                    {categoryLabel(quickViewProduct.category)}
                  </span>
                  <h2 className="text-3xl font-light uppercase tracking-widest text-white mt-1">
                    {productName(quickViewProduct.id, quickViewProduct.name, language)}
                  </h2>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-2xl font-semibold text-accent">
                    {formatPrice(quickViewProduct.priceUSD, quickViewProduct.priceTRY)}
                  </span>
                  <span className="text-xs text-accent bg-accent/10 border border-accent/20 px-3 py-1 rounded-full font-medium">
                    ✓ {t("shop.inStock")} ({quickViewProduct.stock})
                  </span>
                </div>

                <p className="text-slate-300 font-light text-sm leading-relaxed">
                  {productFullDescription(quickViewProduct.id, quickViewProduct.fullDescription, language)}
                </p>
              </div>

              <div className="pt-6 border-t border-white/10 flex gap-4">
                <button
                  onClick={() => {
                    addToCart(quickViewProduct);
                    setIsCartOpen(true);
                    setQuickViewProduct(null);
                  }}
                  className="flex-grow py-3 rounded-full bg-white text-black text-xs font-bold uppercase tracking-widest hover:bg-slate-200 transition cursor-pointer"
                >
                  {t("shop.addToCart")}
                </button>
                <button
                  onClick={() => setQuickViewProduct(null)}
                  className="px-6 py-3 rounded-full border border-white/15 text-xs text-slate-300 uppercase tracking-widest hover:border-white transition cursor-pointer"
                >
                  {language === "en" ? "Close" : "Kapat"}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
export default Home;
