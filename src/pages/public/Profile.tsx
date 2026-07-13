import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { readStorage, writeStorage, storageKeys } from "@/lib/storage";
import { formatPhoneInput } from "@/lib/phone";
import vehiclesData from "@/data/vehicles.json";
import productsData from "@/data/products.json";
import { Order, TestDrive, User, Vehicle } from "@/types";
import { vehicleType } from "@/data/vehicleTranslations";
import { Link, useNavigate } from "react-router-dom";

export function Profile() {
  const { t, language, formatPrice } = useLanguage();
  const { session, logout, refreshSession } = useAuth();
  const { showToast, confirmToast } = useToast();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAvatar, setEditAvatar] = useState("");
  const [, forceRefresh] = useState(0);

  // Redirect after logout
  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // If not logged in, show premium login invitation
  if (!session) {
    return (
      <div className="space-y-8 pt-28 pb-10 max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-xs uppercase tracking-[0.3em] text-accent font-semibold block">
            {language === "en" ? "ACCESS RESTRICTED" : "ERİŞİM KISITLI"}
          </span>
          <h1 className="text-4xl font-extralight tracking-widest uppercase text-white">
            {t("nav.profile")}
          </h1>
          <div className="w-16 h-px bg-accent/40 mx-auto mt-4" />
        </div>

        <div className="max-w-md mx-auto border border-white/10 bg-white/[0.02] rounded-3xl p-8 text-center space-y-6 shadow-xl backdrop-blur-md">
          <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-slate-400">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-light uppercase tracking-wider text-white">
              {language === "en" ? "Authentication Required" : "Giriş Yapılması Gerekli"}
            </h2>
            <p className="text-xs text-slate-400 font-light leading-relaxed">
              {language === "en"
                ? "Please sign in to view your profile dashboard, order receipts, and booked test drives."
                : "Profil panelinizi, sipariş geçmişinizi ve test sürüşlerinizi görüntülemek için lütfen giriş yapın."}
            </p>
          </div>
          <Link
            to="/login"
            className="block w-full py-3 rounded-full bg-white text-black text-xs font-bold uppercase tracking-widest hover:bg-slate-200 transition text-center"
          >
            {t("cta.login")}
          </Link>
        </div>
      </div>
    );
  }

  const { user } = session;

  // 1. Load user's registered vehicles
  const vehicles = vehiclesData as Vehicle[];
  const userVehicles = vehicles.filter((v) => user.ownedVehicleIds.includes(v.id));

  // 2. Load user's checkout orders
  const allOrders = readStorage<Order[]>(storageKeys.orders, []);
  const userOrders = allOrders.filter((ord) => ord.userId === user.id);

  // 3. Load user's booked test drives (match by account id when available, falling back to email for older bookings)
  const allTestDrives = readStorage<TestDrive[]>(storageKeys.testDrives, []);
  const userTestDrives = allTestDrives.filter((td) =>
    td.userId ? td.userId === user.id : td.email.toLowerCase() === user.email.toLowerCase()
  );

  const handleStartEdit = () => {
    setEditName(user.name);
    setEditPhone(user.phone);
    setEditAvatar(user.avatar || "");
    setIsEditing(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    const allUsers = readStorage<User[]>(storageKeys.users, []);
    const updatedUsers = allUsers.map((u) =>
      u.id === user.id
        ? { ...u, name: editName, phone: editPhone, avatar: editAvatar || undefined }
        : u
    );
    writeStorage(storageKeys.users, updatedUsers);
    refreshSession();
    setIsEditing(false);
    showToast(
      language === "en" ? "Profile updated successfully" : "Profil başarıyla güncellendi",
      "success"
    );
  };

  const orderStatusLabel = (status: Order["status"]) => {
    if (language === "tr") {
      switch (status) {
        case "processing": return "İşleniyor";
        case "shipped": return "Kargoda";
        case "delivered": return "Teslim Edildi";
        case "cancellation_requested": return "İptal Talep Edildi";
        case "cancelled": return "İptal Edildi";
      }
    }
    switch (status) {
      case "cancellation_requested": return "Cancellation Requested";
      case "cancelled": return "Cancelled";
      default: return status;
    }
  };

  const testDriveStatusLabel = (status: TestDrive["status"]) => {
    if (language === "tr") {
      switch (status) {
        case "pending": return "Beklemede";
        case "confirmed": return "Onaylandı";
        case "completed": return "Tamamlandı";
      }
    }
    switch (status) {
      case "pending": return "Pending";
      case "confirmed": return "Confirmed";
      case "completed": return "Completed";
    }
  };

  const orderStatusStyle = (status: Order["status"]) => {
    switch (status) {
      case "delivered": return "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400";
      case "cancellation_requested": return "bg-red-500/10 border border-red-500/20 text-red-400";
      case "cancelled": return "bg-slate-500/10 border border-slate-500/20 text-slate-400";
      default: return "bg-amber-500/10 border border-amber-500/20 text-amber-400";
    }
  };

  const handleRequestCancelOrder = async (order: Order) => {
    const confirmed = await confirmToast(
      language === "en"
        ? "Request cancellation for this order? An admin will need to approve it."
        : "Bu sipariş için iptal talep edilsin mi? Bir yöneticinin onaylaması gerekecek.",
      {
        confirmLabel: language === "en" ? "Request Cancellation" : "İptal Talep Et",
        cancelLabel: language === "en" ? "Keep Order" : "Siparişi Koru",
        tone: "danger"
      }
    );
    if (!confirmed) return;

    const updated = allOrders.map((o) =>
      o.id === order.id ? { ...o, status: "cancellation_requested" as const } : o
    );
    writeStorage(storageKeys.orders, updated);
    showToast(
      language === "en" ? "Cancellation requested — pending admin approval" : "İptal talep edildi — yönetici onayı bekleniyor",
      "info"
    );
    forceRefresh((n) => n + 1);
  };

  const handleCancelTestDrive = async (drive: TestDrive) => {
    const confirmMessage =
      language === "en"
        ? "Cancel this test drive booking?"
        : "Bu test sürüşü rezervasyonunu iptal etmek istiyor musunuz?";
    const confirmed = await confirmToast(confirmMessage, {
      confirmLabel: language === "en" ? "Cancel Booking" : "Rezervasyonu İptal Et",
      cancelLabel: language === "en" ? "Keep Booking" : "Rezervasyonu Koru",
      tone: "danger"
    });
    if (!confirmed) return;

    const updated = allTestDrives.filter((td) => td.id !== drive.id);
    writeStorage(storageKeys.testDrives, updated);
    showToast(
      language === "en" ? "Test drive cancelled" : "Test sürüşü iptal edildi",
      "info"
    );
    forceRefresh((n) => n + 1);
  };

  return (
    <div className="space-y-12 pt-28 pb-10 max-w-7xl mx-auto px-6">
      {/* Profile Header Details card */}
      <div className="border border-white/5 bg-white/[0.01] rounded-3xl p-6 md:p-8 shadow-md">
        {isEditing ? (
          <form onSubmit={handleSaveEdit} className="space-y-5">
            <h2 className="text-sm uppercase tracking-widest text-white font-semibold">
              {language === "en" ? "Edit Profile" : "Profili Düzenle"}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <span className="text-[9px] text-slate-400 uppercase tracking-widest block font-medium">
                  {language === "en" ? "Full Name" : "Ad Soyad"}
                </span>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-slate-200 outline-none focus:border-accent transition"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <span className="text-[9px] text-slate-400 uppercase tracking-widest block font-medium">
                  {language === "en" ? "Phone Number" : "Telefon Numarası"}
                </span>
                <input
                  type="tel"
                  inputMode="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(formatPhoneInput(e.target.value))}
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-slate-200 outline-none focus:border-accent transition"
                  required
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <span className="text-[9px] text-slate-400 uppercase tracking-widest block font-medium">
                  {language === "en" ? "Avatar Image URL (optional)" : "Avatar Görsel URL'si (opsiyonel)"}
                </span>
                <input
                  type="text"
                  value={editAvatar}
                  onChange={(e) => setEditAvatar(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-slate-200 outline-none focus:border-accent transition"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="px-6 py-3 rounded-full bg-white text-black text-xs font-semibold uppercase tracking-widest hover:bg-slate-200 transition cursor-pointer"
              >
                {language === "en" ? "Save Changes" : "Değişiklikleri Kaydet"}
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-6 py-3 rounded-full border border-white/15 text-xs text-slate-300 uppercase tracking-widest hover:border-white transition cursor-pointer"
              >
                {language === "en" ? "Cancel" : "Vazgeç"}
              </button>
            </div>
          </form>
        ) : (
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
          {/* Avatar Initials circle */}
          <div className="w-20 h-20 rounded-full bg-accent/15 border border-accent/35 flex items-center justify-center text-accent text-2xl font-bold uppercase shadow-sm">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover rounded-full" />
            ) : (
              user.name.substring(0, 2)
            )}
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <h1 className="text-2xl font-light uppercase tracking-wider text-white">
                {user.name}
              </h1>
              <span className="text-[9px] font-bold tracking-widest bg-accent text-black px-2 py-0.5 rounded-md uppercase">
                {user.role === "admin" ? (language === "en" ? "Admin" : "Yönetici") : (language === "en" ? "Customer" : "Müşteri")}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-light">{user.email}</p>
            <p className="text-[10px] text-slate-500 font-light font-mono">{user.phone}</p>
          </div>
        </div>

        {/* CTA Actions */}
        <div className="flex gap-4 w-full md:w-auto">
          <Link
            to={user.role === "admin" ? "/admin" : "/dashboard"}
            className="flex-1 md:flex-none inline-flex justify-center items-center px-6 py-3 bg-white text-black text-xs font-semibold uppercase tracking-widest rounded-full hover:bg-slate-200 transition"
          >
            {user.role === "admin" ? t("nav.admin") : t("nav.dashboard")}
          </Link>
          <button
            onClick={handleStartEdit}
            className="flex-1 md:flex-none px-6 py-3 rounded-full border border-white/15 text-xs text-slate-300 uppercase tracking-widest hover:border-white transition cursor-pointer"
          >
            {language === "en" ? "Edit Profile" : "Profili Düzenle"}
          </button>
          <button
            onClick={handleLogout}
            className="flex-1 md:flex-none px-6 py-3 rounded-full border border-white/15 text-xs text-slate-300 uppercase tracking-widest hover:border-white transition cursor-pointer"
          >
            {t("nav.logout")}
          </button>
        </div>
        </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Col: My Registered Vehicles */}
        <div className="lg:col-span-1 space-y-6">
          <h3 className="text-xs uppercase tracking-[0.25em] text-slate-450 font-bold block pb-3 border-b border-white/5">
            {language === "en" ? "MY REGISTERED VEHICLES" : "KAYITLI ARAÇLARIM"}
          </h3>

          {userVehicles.length === 0 ? (
            <div className="border border-white/5 bg-white/[0.01] rounded-2xl p-8 text-center text-xs text-slate-500 uppercase tracking-widest">
              {language === "en" ? "No registered vehicles" : "Kayıtlı araç bulunamadı"}
            </div>
          ) : (
            <div className="space-y-4">
              {userVehicles.map((vehicle) => (
                <div
                  key={vehicle.id}
                  className="group border border-white/5 bg-white/[0.01] hover:border-white/10 rounded-2xl overflow-hidden flex flex-col justify-between transition duration-300"
                >
                  <div className="aspect-[16/10] bg-slate-900 overflow-hidden border-b border-white/5">
                    <img
                      src={vehicle.image}
                      alt={vehicle.name}
                      className="w-full h-full object-cover transition duration-500 group-hover:scale-103"
                    />
                  </div>
                  <div className="p-4">
                    <span className="text-[9px] text-accent uppercase tracking-widest block font-medium">
                      {vehicleType(vehicle.id, vehicle.type, language)}
                    </span>
                    <h4 className="text-sm font-light uppercase tracking-wider text-slate-200 mt-1">
                      {vehicle.name}
                    </h4>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Col: Orders & Test Drives */}
        <div className="lg:col-span-2 space-y-8">
          {/* Recent Orders */}
          <div className="space-y-6">
            <h3 className="text-xs uppercase tracking-[0.25em] text-slate-455 font-bold block pb-3 border-b border-white/5">
              {language === "en" ? "RECENT SHOP ORDERS" : "SON MAĞAZA SİPARİŞLERİ"}
            </h3>

            {userOrders.length === 0 ? (
              <div className="border border-white/5 bg-white/[0.01] rounded-2xl p-8 text-center text-xs text-slate-500 uppercase tracking-widest">
                {language === "en" ? "No completed orders" : "Sipariş geçmişi bulunamadı"}
              </div>
            ) : (
              <div className="space-y-4">
                {userOrders.map((order) => (
                  <div
                    key={order.id}
                    className="border border-white/5 bg-black/20 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs font-light text-slate-400"
                  >
                    <div className="space-y-1">
                      <p className="font-semibold text-white uppercase tracking-wider">{order.id}</p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-[10px] text-slate-350">
                        {order.items.length} {language === "en" ? "item(s) purchased" : "ürün satın alındı"}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                      <span className="text-accent font-semibold text-sm">
                        {formatPrice(
                          order.currency === "$" ? order.subtotal : order.subtotal / 34,
                          order.currency === "₺" ? order.subtotal : order.subtotal * 34
                        )}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-[9px] font-bold tracking-widest uppercase ${orderStatusStyle(order.status)}`}>
                        {orderStatusLabel(order.status)}
                      </span>
                      {order.status === "processing" && (
                        <button
                          onClick={() => handleRequestCancelOrder(order)}
                          className="text-[9px] font-bold uppercase tracking-widest text-red-400 hover:text-red-300 transition cursor-pointer"
                        >
                          {language === "en" ? "Cancel" : "İptal Et"}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Booked Test Drives */}
          <div className="space-y-6">
            <h3 className="text-xs uppercase tracking-[0.25em] text-slate-460 font-bold block pb-3 border-b border-white/5">
              {language === "en" ? "BOOKED TEST DRIVES" : "TEST SÜRÜŞÜ REZERVASYONLARI"}
            </h3>

            {userTestDrives.length === 0 ? (
              <div className="border border-white/5 bg-white/[0.01] rounded-2xl p-8 text-center text-xs text-slate-500 uppercase tracking-widest">
                {language === "en" ? "No test drives booked" : "Test sürüşü rezervasyonu bulunamadı"}
              </div>
            ) : (
              <div className="space-y-4">
                {userTestDrives.map((drive) => {
                  const vehicleObj = vehicles.find((v) => v.id === drive.vehicleId);
                  return (
                    <div
                      key={drive.id}
                      className="border border-white/5 bg-black/20 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs font-light text-slate-400"
                    >
                      <div className="space-y-1">
                        <p className="font-semibold text-white uppercase tracking-wider">
                          {vehicleObj ? vehicleObj.name : drive.vehicleId}
                        </p>
                        <p className="text-[10px] text-slate-500 font-mono">
                          📍 {drive.location}
                        </p>
                        <p className="text-[10px] text-slate-350">
                          📅 {drive.date} | ⏰ {drive.time}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                        <span className="px-3 py-1 rounded-full text-[9px] font-bold tracking-widest bg-accent/10 border border-accent/20 text-accent uppercase">
                          {testDriveStatusLabel(drive.status)}
                        </span>
                        {drive.status !== "completed" && (
                          <button
                            onClick={() => handleCancelTestDrive(drive)}
                            className="text-[9px] font-bold uppercase tracking-widest text-red-400 hover:text-red-300 transition cursor-pointer"
                          >
                            {language === "en" ? "Cancel" : "İptal Et"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
