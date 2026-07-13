import { useState } from "react";
import { readStorage, writeStorage, storageKeys } from "@/lib/storage";
import productsData from "@/data/products.json";
import usersData from "@/data/users.json";
import { Order, Product, User } from "@/types";
import { useLanguage } from "@/i18n/LanguageContext";
import { useToast } from "@/context/ToastContext";

type ShippingDetails = { name: string; address: string; city: string; zipCode: string };
type StoredOrder = Order & { shippingDetails?: ShippingDetails };

const statusOrder: Order["status"][] = ["processing", "shipped", "delivered"];
const allStatuses: Order["status"][] = ["processing", "shipped", "delivered", "cancellation_requested", "cancelled"];

const statusStyles: Record<Order["status"], string> = {
  processing: "bg-amber-500/10 border border-amber-500/20 text-amber-500",
  shipped: "bg-accent/10 border border-accent/20 text-accent",
  delivered: "bg-emerald-500/10 border border-emerald-500/20 text-emerald-500",
  cancellation_requested: "bg-red-500/10 border border-red-500/20 text-red-400",
  cancelled: "bg-slate-400/10 border border-slate-400/20 text-slate-500"
};

export function AdminOrders() {
  const { language } = useLanguage();
  const { showToast } = useToast();

  const [orders, setOrders] = useState<StoredOrder[]>(() =>
    readStorage<StoredOrder[]>(storageKeys.orders, [])
  );
  const products = readStorage<Product[]>(storageKeys.products, productsData as Product[]);
  const users = readStorage<User[]>(storageKeys.users, usersData as User[]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | Order["status"]>("");
  const [selectedOrder, setSelectedOrder] = useState<StoredOrder | null>(null);

  const getCustomer = (order: StoredOrder) => users.find((u) => u.id === order.userId);

  const filteredOrders = orders.filter((o) => {
    const customer = getCustomer(o);
    const query = search.trim().toLowerCase();
    const searchMatch =
      !query ||
      o.id.toLowerCase().includes(query) ||
      o.shippingDetails?.name?.toLowerCase().includes(query) ||
      customer?.name.toLowerCase().includes(query) ||
      customer?.email.toLowerCase().includes(query);
    const statusMatch = !statusFilter || o.status === statusFilter;
    return searchMatch && statusMatch;
  });

  const setOrderStatus = (order: StoredOrder, nextStatus: Order["status"]) => {
    const updated = orders.map((o) => (o.id === order.id ? { ...o, status: nextStatus } : o));
    setOrders(updated);
    writeStorage(storageKeys.orders, updated);
    if (selectedOrder?.id === order.id) {
      setSelectedOrder({ ...order, status: nextStatus });
    }
  };

  const advanceStatus = (order: StoredOrder) => {
    const currentIndex = statusOrder.indexOf(order.status);
    if (currentIndex === -1 || currentIndex === statusOrder.length - 1) return;
    setOrderStatus(order, statusOrder[currentIndex + 1]);
  };

  const handleApproveCancellation = (order: StoredOrder) => {
    setOrderStatus(order, "cancelled");
    showToast(
      language === "en" ? "Cancellation approved" : "İptal talebi onaylandı",
      "success"
    );
  };

  const handleRejectCancellation = (order: StoredOrder) => {
    setOrderStatus(order, "processing");
    showToast(
      language === "en" ? "Cancellation request rejected" : "İptal talebi reddedildi",
      "info"
    );
  };

  const statusLabel = (status: Order["status"]) => {
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

  return (
    <div className="space-y-6 animate-fade-in text-slate-800 dark:text-slate-100">
      <div>
        <h1 className="text-2xl font-light uppercase tracking-widest text-slate-800 dark:text-white">
          {language === "en" ? "Shop Transactions" : "Mağaza İşlemleri"}
        </h1>
        <p className="text-[10px] text-slate-500 font-light tracking-wide mt-1">
          {language === "en"
            ? "Review invoices, checkouts, and shipping statuses for completed shop cart purchases."
            : "Tamamlanan alışverişler için faturaları, ödemeleri ve kargo durumlarını inceleyin."}
        </p>
      </div>

      {/* Filters Toolbar */}
      <div className="dash-panel p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1 md:col-span-2">
          <label className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold">
            {language === "en" ? "Search Orders" : "Sipariş Ara"}
          </label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={language === "en" ? "Order ID, customer name, or email..." : "Sipariş No, müşteri adı veya e-posta..."}
            className="w-full bg-slate-100/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-accent/40 transition"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold">
            {language === "en" ? "Status" : "Durum"}
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "" | Order["status"])}
            className="w-full bg-slate-100/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-accent/40 transition"
          >
            <option value="" className="bg-white dark:bg-[#0a0f18] text-slate-800 dark:text-slate-200">
              {language === "en" ? "All Statuses" : "Tüm Durumlar"}
            </option>
            {allStatuses.map((s) => (
              <option key={s} value={s} className="bg-white dark:bg-[#0a0f18] text-slate-800 dark:text-slate-200">
                {statusLabel(s)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="dash-panel overflow-hidden shadow-lg">
        {filteredOrders.length === 0 ? (
          <p className="text-xs text-slate-500 uppercase tracking-widest text-center py-20 font-light">
            {orders.length === 0
              ? (language === "en" ? "No transaction records found" : "İşlem kaydı bulunamadı")
              : (language === "en" ? "No orders match this search" : "Bu aramayla eşleşen sipariş yok")}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-light text-slate-550 dark:text-slate-400">
              <thead className="bg-slate-100/80 dark:bg-[#0e1423]/25 text-slate-650 dark:text-slate-455 uppercase tracking-widest text-[9px] font-bold border-b border-slate-200 dark:border-white/5">
                <tr>
                  <th className="px-6 py-4">{language === "en" ? "Order ID" : "Sipariş No"}</th>
                  <th className="px-6 py-4">{language === "en" ? "Date" : "Tarih"}</th>
                  <th className="px-6 py-4">{language === "en" ? "Customer" : "Müşteri"}</th>
                  <th className="px-6 py-4">{language === "en" ? "Items Purchased" : "Satın Alınan Ürünler"}</th>
                  <th className="px-6 py-4">{language === "en" ? "Subtotal Cost" : "Ara Toplam"}</th>
                  <th className="px-6 py-4">{language === "en" ? "Status" : "Durum"}</th>
                  <th className="px-6 py-4 text-right">{language === "en" ? "Actions" : "İşlemler"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 dark:divide-white/5 font-mono text-[11px]">
                {filteredOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.01] transition duration-200">
                    <td
                      className="px-6 py-4 font-mono font-semibold text-slate-700 dark:text-white uppercase tracking-wider cursor-pointer"
                      onClick={() => setSelectedOrder(o)}
                    >
                      {o.id}
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-500">
                      {new Date(o.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-sans">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{o.shippingDetails?.name || (language === "en" ? "Customer" : "Müşteri")}</p>
                      <p className="text-[9px] text-slate-500 font-mono mt-0.5">
                        {o.shippingDetails?.address}, {o.shippingDetails?.city}
                      </p>
                    </td>
                    <td className="px-6 py-4 font-sans">
                      <div className="space-y-1">
                        {o.items.map((item, idx) => {
                          const prodObj = products.find((p) => p.id === item.productId);
                          return (
                            <p key={idx} className="text-slate-600 dark:text-slate-350">
                              • {prodObj ? prodObj.name : item.productId} <span className="text-[10px] text-slate-500">x{item.quantity}</span>
                            </p>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-accent font-semibold text-sm">
                      {o.currency} {o.subtotal.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-sans">
                      <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-bold tracking-widest uppercase ${statusStyles[o.status]}`}>
                        {statusLabel(o.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-sans">
                      <div className="flex justify-end gap-2 text-[9px] font-bold uppercase tracking-wider">
                        <button
                          onClick={() => setSelectedOrder(o)}
                          className="px-3 py-1.5 rounded-full border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-slate-400 dark:hover:border-white transition cursor-pointer"
                        >
                          {language === "en" ? "Details" : "Detay"}
                        </button>
                        {o.status === "cancellation_requested" ? (
                          <>
                            <button
                              onClick={() => handleApproveCancellation(o)}
                              className="px-3 py-1.5 rounded-full border border-red-500/35 text-red-400 hover:bg-red-500/10 transition cursor-pointer"
                            >
                              {language === "en" ? "Approve Cancel" : "İptali Onayla"}
                            </button>
                            <button
                              onClick={() => handleRejectCancellation(o)}
                              className="px-3 py-1.5 rounded-full border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-slate-400 dark:hover:border-white transition cursor-pointer"
                            >
                              {language === "en" ? "Reject" : "Reddet"}
                            </button>
                          </>
                        ) : (
                          o.status !== "delivered" && o.status !== "cancelled" && (
                            <button
                              onClick={() => advanceStatus(o)}
                              className="px-3 py-1.5 rounded-full border border-accent/35 text-accent hover:bg-accent/10 transition cursor-pointer"
                            >
                              {language === "en" ? "Advance" : "İlerlet"}
                            </button>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="rounded-[28px] border border-slate-200 dark:border-white/10 max-w-lg w-full p-6 space-y-5 shadow-2xl bg-white dark:bg-[#0e1423] max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-white/5 pb-3">
              <h3 className="text-xs font-bold tracking-wider text-slate-800 dark:text-white uppercase font-mono">
                {selectedOrder.id}
              </h3>
              <button
                onClick={() => setSelectedOrder(null)}
                aria-label={language === "en" ? "Close" : "Kapat"}
                className="text-slate-450 hover:text-slate-700 dark:hover:text-white text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex justify-between items-center text-xs gap-3">
              <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-bold tracking-widest uppercase ${statusStyles[selectedOrder.status]}`}>
                {statusLabel(selectedOrder.status)}
              </span>
              {selectedOrder.status === "cancellation_requested" ? (
                <div className="flex gap-2 text-[9px] font-bold uppercase tracking-wider">
                  <button
                    onClick={() => handleApproveCancellation(selectedOrder)}
                    className="px-3 py-1.5 rounded-full border border-red-500/35 text-red-400 hover:bg-red-500/10 transition cursor-pointer"
                  >
                    {language === "en" ? "Approve Cancellation" : "İptali Onayla"}
                  </button>
                  <button
                    onClick={() => handleRejectCancellation(selectedOrder)}
                    className="px-3 py-1.5 rounded-full border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-slate-400 dark:hover:border-white transition cursor-pointer"
                  >
                    {language === "en" ? "Reject" : "Reddet"}
                  </button>
                </div>
              ) : (
                selectedOrder.status !== "delivered" && selectedOrder.status !== "cancelled" && (
                  <button
                    onClick={() => advanceStatus(selectedOrder)}
                    className="px-3 py-1.5 rounded-full border border-accent/35 text-accent hover:bg-accent/10 transition cursor-pointer text-[9px] font-bold uppercase tracking-wider"
                  >
                    {language === "en" ? "Advance Status" : "Durumu İlerlet"}
                  </button>
                )
              )}
            </div>

            <div className="space-y-2 text-xs">
              <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">
                {language === "en" ? "Shipping To" : "Teslimat Adresi"}
              </p>
              <p className="text-slate-700 dark:text-slate-200 font-sans">
                {selectedOrder.shippingDetails?.name}<br />
                {selectedOrder.shippingDetails?.address}, {selectedOrder.shippingDetails?.city} {selectedOrder.shippingDetails?.zipCode}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">
                {language === "en" ? "Items" : "Ürünler"}
              </p>
              <div className="divide-y divide-slate-150 dark:divide-white/5">
                {selectedOrder.items.map((item, idx) => {
                  const prodObj = products.find((p) => p.id === item.productId);
                  return (
                    <div key={idx} className="flex items-center gap-3 py-2 text-xs">
                      <div className="w-9 h-9 bg-slate-100 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/5 flex items-center justify-center p-1 shrink-0">
                        {prodObj && <img src={prodObj.image} alt={prodObj.name} className="max-h-full max-w-full object-contain" />}
                      </div>
                      <span className="flex-grow font-sans text-slate-700 dark:text-slate-200">
                        {prodObj ? prodObj.name : item.productId}
                      </span>
                      <span className="text-slate-500 font-mono">x{item.quantity}</span>
                      <span className="text-accent font-mono font-semibold">
                        {selectedOrder.currency}{item.price.toLocaleString()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-200 dark:border-white/5 text-sm">
              <span className="text-slate-500 uppercase tracking-widest text-[9px] font-bold">
                {language === "en" ? "Subtotal" : "Ara Toplam"}
              </span>
              <span className="text-accent font-mono font-bold text-lg">
                {selectedOrder.currency}{selectedOrder.subtotal.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default AdminOrders;
