import { useState, useEffect } from "react";
import { readStorage, writeStorage, storageKeys } from "@/lib/storage";
import notificationsData from "@/data/notifications.json";
import { Notification } from "@/types";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";

export function NotificationsDashboard() {
  const { showToast, confirmToast } = useToast();
  const { session } = useAuth();
  const { language } = useLanguage();
  const userId = session?.user.id;
  
  // Load notifications with state
  const [notifications, setNotifications] = useState<Notification[]>(() =>
    readStorage<Notification[]>(storageKeys.notifications, notificationsData as Notification[])
  );

  useEffect(() => {
    writeStorage(storageKeys.notifications, notifications);
    window.dispatchEvent(new Event("evalis:notificationsUpdated"));
  }, [notifications]);

  const userNotifications = userId
    ? notifications.filter((notification) => notification.userId === userId)
    : notifications;

  const handleMarkAsRead = (notifId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, read: true } : n))
    );
    showToast(
      language === "en" ? "Notification marked as read" : "Bildirim okundu olarak işaretlendi",
      "info"
    );
  };

  const handleDelete = async (notifId: string) => {
    const confirmed = await confirmToast(
      language === "en" ? "Delete this notification?" : "Bu bildirim silinsin mi?",
      {
        confirmLabel: language === "en" ? "Delete" : "Sil",
        cancelLabel: language === "en" ? "Cancel" : "Vazgeç",
        tone: "danger"
      }
    );
    if (!confirmed) return;
    setNotifications((prev) => prev.filter((n) => n.id !== notifId));
    showToast(
      language === "en" ? "Notification deleted" : "Bildirim silindi",
      "info"
    );
  };

  const handleClearAll = async () => {
    const confirmed = await confirmToast(
      language === "en"
        ? "Delete all notifications? This cannot be undone."
        : "Tüm bildirimler silinsin mi? Bu işlem geri alınamaz.",
      {
        confirmLabel: language === "en" ? "Clear All" : "Tümünü Temizle",
        cancelLabel: language === "en" ? "Cancel" : "Vazgeç",
        tone: "danger"
      }
    );
    if (!confirmed) return;
    setNotifications((prev) =>
      userId ? prev.filter((notification) => notification.userId !== userId) : []
    );
    showToast(
      language === "en" ? "All notifications cleared" : "Tüm bildirimler temizlendi",
      "info"
    );
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      
      {/* Header Segment */}
      <div className="dash-panel p-6 flex justify-between items-center gap-4">
        <div>
          <h1 className="text-xl font-light uppercase tracking-widest text-slate-100">
            {language === "en" ? "Notifications" : "Bildirimler"}
          </h1>
          <p className="text-[9px] text-slate-500 font-light tracking-wide mt-1">
            {language === "en"
              ? "Stay up to date with updates, charging completions, and scheduling telemetry alerts."
              : "Güncellemeler, şarj tamamlanmaları ve zamanlama bildirimleri ile güncel kalın."}
          </p>
        </div>
        {userNotifications.length > 0 && (
          <button
            onClick={handleClearAll}
            className="px-4 py-2 rounded-full border border-red-500/25 text-red-400 hover:bg-red-500/10 text-[9px] font-bold uppercase tracking-widest transition cursor-pointer"
          >
            {language === "en" ? "Clear All" : "Tümünü Temizle"}
          </button>
        )}
      </div>

      {/* Notifications container */}
      <div className="dash-panel p-6 shadow-md">
        {userNotifications.length === 0 ? (
          <div className="text-center py-20 text-slate-500 uppercase tracking-widest text-[10px] font-bold space-y-2">
            <svg className="w-8 h-8 mx-auto text-slate-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <p className="pt-2">{language === "en" ? "Your inbox is clear" : "Bildirim kutunuz boş"}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {userNotifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => !notif.read && handleMarkAsRead(notif.id)}
                className={`dash-pill p-4 flex justify-between items-start gap-4 transition duration-200 border ${
                  notif.read ? "border-white/5 bg-white/[0.005]" : "border-accent/20 bg-accent/[0.01] cursor-pointer"
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h4 className="text-xs uppercase tracking-wider text-slate-200 font-semibold">{notif.title}</h4>
                    {!notif.read && (
                      <span className="w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-450 font-light leading-relaxed">{notif.message}</p>
                  <span className="text-[8px] font-mono text-slate-500 block pt-1">
                    {new Date(notif.createdAt).toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center gap-3 shrink-0 pt-0.5 font-mono text-[9px]">
                  {!notif.read && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsRead(notif.id);
                      }}
                      className="uppercase font-bold tracking-wider text-accent hover:underline cursor-pointer"
                    >
                      {language === "en" ? "Read" : "Oku"}
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(notif.id);
                    }}
                    className="uppercase font-bold tracking-wider text-red-400 hover:text-red-350 cursor-pointer"
                  >
                    {language === "en" ? "Delete" : "Sil"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
export default NotificationsDashboard;
