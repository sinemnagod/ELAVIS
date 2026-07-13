import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import vehiclesData from "@/data/vehicles.json";
import { readStorage, writeStorage, storageKeys } from "@/lib/storage";
import { formatPhoneInput } from "@/lib/phone";
import { TestDrive as TestDriveType, Vehicle } from "@/types";
import { useToast } from "@/context/ToastContext";
import { vehicleType, vehicleTagline } from "@/data/vehicleTranslations";

// Helper component to pan/zoom the map smoothly when the selected showroom changes
function ChangeMapView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true, duration: 1 });
  }, [center, zoom, map]);
  return null;
}

export function TestDrive() {
  const { t, language } = useLanguage();
  const { session } = useAuth();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();

  // Available showrooms with real-world coordinates for the map. `name` is the
  // canonical value stored on the booking (matches Profile.tsx / admin displays);
  // `nameTr` is only used to render this page's own UI in Turkish.
  const showrooms = [
    { name: "Kadıköy Showroom (Istanbul)", nameTr: "Kadıköy Showroom (İstanbul)", lat: 40.9927, lng: 29.0275 },
    { name: "Beşiktaş Showroom (Istanbul)", nameTr: "Beşiktaş Showroom (İstanbul)", lat: 41.0422, lng: 29.0061 },
    { name: "Ataşehir Showroom (Istanbul)", nameTr: "Ataşehir Showroom (İstanbul)", lat: 40.9923, lng: 29.1244 },
    { name: "Çankaya Showroom (Ankara)", nameTr: "Çankaya Showroom (Ankara)", lat: 39.9179, lng: 32.8627 },
    { name: "Alsancak Showroom (Izmir)", nameTr: "Alsancak Showroom (İzmir)", lat: 38.4326, lng: 27.1428 },
    { name: "Nilüfer Showroom (Bursa)", nameTr: "Nilüfer Showroom (Bursa)", lat: 40.2148, lng: 28.9636 },
    { name: "Lara Showroom (Antalya)", nameTr: "Lara Showroom (Antalya)", lat: 36.8562, lng: 30.7802 },
    { name: "Seyhan Showroom (Adana)", nameTr: "Seyhan Showroom (Adana)", lat: 37.0000, lng: 35.3213 }
  ];

  // Looks up the localized display label for a stored (English) showroom name.
  const showroomLabel = (storedName: string) =>
    language === "en" ? storedName : (showrooms.find((s) => s.name === storedName)?.nameTr || storedName);

  const defaultMapCenter: [number, number] = [39.2, 32.0];
  const [mapCenter, setMapCenter] = useState<[number, number]>(defaultMapCenter);
  const [mapZoom, setMapZoom] = useState(5.5);

  const showroomMarkerIcon = (isSelected: boolean) =>
    L.divIcon({
      className: "custom-leaflet-marker",
      html: `<div class="w-8 h-8 rounded-full flex items-center justify-center bg-slate-900/90 border border-white/10 shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
        <span class="w-3 h-3 rounded-full ${isSelected ? "bg-accent shadow-[0_0_8px_#2a7a5f] animate-pulse" : "bg-sky-400 shadow-[0_0_6px_#38bdf8]"}" />
      </div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

  // Available time slots
  const timeSlots = ["10:00", "11:30", "13:00", "14:30", "16:00", "17:30"];

  // Load vehicles from mock database
  const vehicles = vehiclesData as Vehicle[];

  // Form states
  const [vehicleId, setVehicleId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [validationError, setValidationError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [createdBooking, setCreatedBooking] = useState<TestDriveType | null>(null);

  // Auto-select vehicle if passed in query parameters (?model=vector)
  useEffect(() => {
    const modelParam = searchParams.get("model");
    if (modelParam && vehicles.some((v) => v.id === modelParam)) {
      setVehicleId(modelParam);
    } else if (vehicles.length > 0) {
      setVehicleId(vehicles[0].id);
    }
  }, [searchParams, vehicles]);

  // Prefill contact details from the logged-in account so the booking reliably links back to their profile
  useEffect(() => {
    if (session?.user) {
      setFirstName((prev) => prev || session.user.name.split(" ")[0] || "");
      setLastName((prev) => prev || session.user.name.split(" ").slice(1).join(" ") || "");
      setEmail((prev) => prev || session.user.email);
      setPhone((prev) => prev || session.user.phone || "");
    }
  }, [session]);

  // Find currently selected vehicle details for preview
  const selectedVehicle = vehicles.find((v) => v.id === vehicleId) || null;

  const handleSelectShowroom = (showroom: { name: string; lat: number; lng: number }) => {
    setLocation(showroom.name);
    setMapCenter([showroom.lat, showroom.lng]);
    setMapZoom(12);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError("");

    // Validate fields
    if (!vehicleId || !date || !time || !location || !firstName || !lastName || !email || !phone) {
      setValidationError(t("testDrive.validationError"));
      return;
    }

    setSubmitting(true);

    // Simulate network latency (1s)
    setTimeout(() => {
      const newBooking: TestDriveType = {
        id: `td-${Date.now()}`,
        vehicleId,
        date,
        time,
        location,
        firstName,
        lastName,
        email,
        phone,
        status: "pending",
        userId: session?.user.id
      };

      // Read existing bookings, merge and write back to localStorage
      const existingBookings = readStorage<TestDriveType[]>(storageKeys.testDrives, []);
      writeStorage(storageKeys.testDrives, [newBooking, ...existingBookings]);

      setCreatedBooking(newBooking);
      setSubmitting(false);
      setSuccess(true);
      showToast(
        language === "en" ? "Test drive requested successfully!" : "Test sürüşü talebiniz başarıyla alındı!",
        "success"
      );
    }, 1000);
  };

  const handleReset = () => {
    setDate("");
    setTime("");
    setLocation("");
    if (!session?.user) {
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
    }
    setMapCenter(defaultMapCenter);
    setMapZoom(5.5);
    setSuccess(false);
    setCreatedBooking(null);
  };

  return (
    <div className="space-y-16 pt-28 pb-10 max-w-7xl mx-auto px-6">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="text-xs uppercase tracking-[0.3em] text-accent font-semibold block">
          EVALIS EXPERIENCE
        </span>
        <h1 className="text-4xl md:text-5xl font-extralight tracking-widest uppercase text-white">
          {t("cta.bookTestDrive")}
        </h1>
        <div className="w-16 h-px bg-accent/40 mx-auto mt-4" />
      </div>

      {success && createdBooking && selectedVehicle ? (
        /* Success Screen */
        <div className="max-w-xl mx-auto border border-white/10 bg-white/[0.02] rounded-3xl p-8 md:p-12 text-center space-y-8 animate-fade-in shadow-xl">
          {/* Confirmed Icon */}
          <div className="w-16 h-16 rounded-full bg-accent/15 border border-accent/25 flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl font-light uppercase tracking-widest text-white">
              {t("testDrive.successTitle")}
            </h2>
            <p className="text-slate-400 font-light text-sm leading-relaxed max-w-md mx-auto">
              {t("testDrive.successSub")}
            </p>
          </div>

          {/* Booking Summary Box */}
          <div className="border border-white/5 bg-black/40 rounded-2xl p-6 text-left space-y-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <span className="text-xs text-slate-500 uppercase tracking-widest">{t("testDrive.selectedVehicle")}</span>
              <span className="text-sm font-medium text-white uppercase tracking-wider">{selectedVehicle.name}</span>
            </div>
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <span className="text-xs text-slate-500 uppercase tracking-widest">{t("testDrive.selectedLocation")}</span>
              <span className="text-sm font-medium text-slate-200">{showroomLabel(createdBooking.location)}</span>
            </div>
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <span className="text-xs text-slate-500 uppercase tracking-widest">{t("testDrive.selectedDate")}</span>
              <span className="text-sm font-medium text-slate-200">{createdBooking.date}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500 uppercase tracking-widest">{t("testDrive.selectedTime")}</span>
              <span className="text-sm font-medium text-slate-200">{createdBooking.time}</span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button
              onClick={handleReset}
              className="flex-1 py-3 text-center rounded-full border border-white/10 text-white text-xs font-semibold uppercase tracking-[0.18em] hover:bg-white/5 hover:border-white transition cursor-pointer"
            >
              {t("testDrive.reset")}
            </button>
            <Link
              to="/vehicles"
              className="flex-1 py-3 text-center rounded-full bg-white text-black text-xs font-semibold uppercase tracking-[0.18em] hover:bg-slate-200 transition"
            >
              {t("testDrive.backToCatalog")}
            </Link>
          </div>
        </div>
      ) : (
        /* Form & Preview Panel */
        <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-12 items-start">
          {/* Booking Form */}
          <form
            onSubmit={handleSubmit}
            className="border border-white/5 bg-white/[0.01] rounded-3xl p-6 md:p-8 space-y-8 shadow-md"
          >
            {validationError && (
              <div className="bg-red-950/20 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-xs tracking-wider">
                {validationError}
              </div>
            )}

            {/* Step 1: Select Vehicle */}
            <div className="space-y-3">
              <label className="text-xs text-slate-400 uppercase tracking-widest font-semibold block">
                1. {language === "en" ? "Select a Vehicle to Test" : "Test Etmek İçin Bir Araç Seçin"}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {vehicles.map((v) => {
                  const isSelected = vehicleId === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setVehicleId(v.id)}
                      aria-pressed={isSelected}
                      className={`group relative rounded-2xl border p-4 flex flex-col items-center text-center gap-2 transition cursor-pointer ${
                        isSelected
                          ? "border-accent bg-accent/10"
                          : "border-white/10 bg-black/20 hover:border-white/25 hover:bg-white/[0.03]"
                      }`}
                    >
                      {isSelected && (
                        <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                          <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                      )}
                      <div className="w-full aspect-[4/3] flex items-center justify-center">
                        <img
                          src={v.image}
                          alt={v.name}
                          className="max-h-full max-w-full object-contain transition duration-300 group-hover:scale-105"
                        />
                      </div>
                      <div>
                        <p className={`text-xs font-semibold uppercase tracking-wider ${isSelected ? "text-accent" : "text-white"}`}>
                          {v.name}
                        </p>
                        <p className="text-[9px] text-slate-500 uppercase tracking-wide mt-0.5">
                          {vehicleType(v.id, v.type, language)}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Showroom Location */}
            <div className="space-y-3">
              <label className="text-xs text-slate-400 uppercase tracking-widest font-semibold block">
                2. {t("testDrive.location")}
              </label>
              <select
                value={location}
                onChange={(e) => {
                  const showroom = showrooms.find((s) => s.name === e.target.value);
                  if (showroom) handleSelectShowroom(showroom);
                }}
                required
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-slate-200 outline-none focus:border-accent transition cursor-pointer"
              >
                <option value="" className="bg-site" disabled>
                  -- {language === "en" ? "Select Showroom" : "Showroom Seçiniz"} --
                </option>
                {showrooms.map((showroom) => (
                  <option key={showroom.name} value={showroom.name} className="bg-site">
                    {showroomLabel(showroom.name)}
                  </option>
                ))}
              </select>

              {/* Showroom map */}
              <div className="h-[280px] rounded-xl overflow-hidden border border-white/10 relative bg-slate-950 z-0">
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
                  {showrooms.map((showroom) => (
                    <Marker
                      key={showroom.name}
                      position={[showroom.lat, showroom.lng]}
                      icon={showroomMarkerIcon(location === showroom.name)}
                      eventHandlers={{ click: () => handleSelectShowroom(showroom) }}
                    >
                      <Popup className="custom-leaflet-popup">
                        <div className="text-xs space-y-2 p-1 font-light text-slate-350">
                          <h4 className="font-semibold text-white uppercase tracking-wider">{showroomLabel(showroom.name)}</h4>
                          <button
                            type="button"
                            onClick={() => handleSelectShowroom(showroom)}
                            className={`w-full rounded-lg py-1.5 text-[9px] font-bold uppercase tracking-wider transition ${
                              location === showroom.name
                                ? "bg-accent/15 border border-accent/30 text-accent"
                                : "bg-white text-black hover:bg-slate-200"
                            }`}
                          >
                            {location === showroom.name
                              ? (language === "en" ? "Selected" : "Seçildi")
                              : (language === "en" ? "Select this showroom" : "Bu showroomu seç")}
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
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
              `}</style>
            </div>

            {/* Step 3: Date & Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-xs text-slate-400 uppercase tracking-widest font-semibold block">
                  3. {t("testDrive.date")}
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  required
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-slate-200 outline-none focus:border-accent transition cursor-pointer"
                />
              </div>

              <div className="space-y-3">
                <label className="text-xs text-slate-400 uppercase tracking-widest font-semibold block">
                  4. {t("testDrive.time")}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {timeSlots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setTime(slot)}
                      className={`py-2 text-xs rounded-lg border text-center transition cursor-pointer ${
                        time === slot
                          ? "bg-accent border-accent text-black font-semibold"
                          : "bg-black/40 border-white/10 text-slate-300 hover:border-slate-400"
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Step 4: Contact details */}
            <div className="space-y-4 pt-4 border-t border-white/5">
              <label className="text-xs text-slate-400 uppercase tracking-widest font-semibold block">
                5. {language === "en" ? "Driver details" : "Sürücü Bilgileri"}
              </label>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest block">
                    {t("testDrive.firstName")}
                  </span>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Sinem"
                    required
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-slate-200 outline-none focus:border-accent transition"
                  />
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest block">
                    {t("testDrive.lastName")}
                  </span>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doğan"
                    required
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-slate-200 outline-none focus:border-accent transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest block">
                    {t("testDrive.email")}
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="customer@evalis.com"
                    required
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-slate-200 outline-none focus:border-accent transition"
                  />
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest block">
                    {t("testDrive.phone")}
                  </span>
                  <input
                    type="tel"
                    inputMode="tel"
                    value={phone}
                    onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
                    placeholder="+90 555 123 45 67"
                    required
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-slate-200 outline-none focus:border-accent transition"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className={`w-full py-4 text-center rounded-full bg-white text-black text-xs font-bold uppercase tracking-[0.2em] transition-all duration-300 ${
                submitting
                  ? "bg-slate-300 opacity-80 cursor-wait"
                  : "hover:bg-slate-200 cursor-pointer"
              }`}
            >
              {submitting ? t("testDrive.submitting") : t("testDrive.submit")}
            </button>
          </form>

          {/* Vehicle Sidebar Preview Panel */}
          {selectedVehicle && (
            <div className="border border-white/5 bg-white/[0.01] rounded-3xl overflow-hidden flex flex-col sticky top-28 shadow-md">
              <div className="aspect-[16/10] bg-slate-900 overflow-hidden border-b border-white/5">
                <img
                  src={selectedVehicle.image}
                  alt={selectedVehicle.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="p-6 md:p-8 space-y-6">
                <div>
                  <span className="text-[10px] uppercase tracking-[0.25em] text-accent block font-medium">
                    {vehicleType(selectedVehicle.id, selectedVehicle.type, language)}
                  </span>
                  <h3 className="text-2xl font-light tracking-widest uppercase text-white mt-1">
                    {selectedVehicle.name}
                  </h3>
                  <p className="text-slate-400 font-light text-xs mt-2 leading-relaxed">
                    {vehicleTagline(selectedVehicle.id, selectedVehicle.tagline, language)}
                  </p>
                </div>

                {/* Specs */}
                <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-6">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest">
                      {t("vehicles.range")}
                    </span>
                    <span className="text-md font-light text-slate-200 mt-1 block">
                      {selectedVehicle.specs.range}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest">
                      {t("vehicles.power")}
                    </span>
                    <span className="text-md font-light text-slate-200 mt-1 block">
                      {selectedVehicle.specs.maxPower}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">
                      {selectedVehicle.id === "bullet" ? "0-50 KM/H" : "0-100 KM/H"}
                    </span>
                    <span className="text-md font-light text-slate-200 mt-1 block">
                      {selectedVehicle.specs.acceleration}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest">
                      {t("vehicles.topSpeed")}
                    </span>
                    <span className="text-md font-light text-slate-200 mt-1 block">
                      {selectedVehicle.specs.topSpeed}
                    </span>
                  </div>
                </div>

                {/* Selected Appointment Review Summary */}
                {(location || date || time) && (
                  <div className="border-t border-white/10 pt-6 space-y-3">
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest block">
                      {language === "en" ? "APPOINTMENT REVIEW" : "REZERVASYON ÖZETİ"}
                    </span>
                    <div className="text-xs font-light text-slate-300 space-y-1">
                      {location && <p>📍 {showroomLabel(location)}</p>}
                      {date && <p>📅 {date}</p>}
                      {time && <p>⏰ {time}</p>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
