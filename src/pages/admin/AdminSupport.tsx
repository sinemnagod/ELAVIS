import { useState } from "react";
import { readStorage, writeStorage, storageKeys } from "@/lib/storage";
import { SupportTicket, Notification } from "@/types";
import { getCategoryOption, priorityOptions, statusOptions } from "@/data/supportCategories";
import { useLanguage } from "@/i18n/LanguageContext";
import { useToast } from "@/context/ToastContext";

const PRIORITY_COLORS: Record<SupportTicket["priority"], string> = {
  low: "border-slate-400/30 bg-slate-400/10 text-slate-500",
  medium: "border-sky-400/30 bg-sky-400/10 text-sky-500",
  high: "border-amber-500/30 bg-amber-500/10 text-amber-500",
  urgent: "border-red-500/30 bg-red-500/10 text-red-500"
};

const STATUS_COLORS: Record<SupportTicket["status"], string> = {
  open: "border-accent/30 bg-accent/10 text-accent",
  in_progress: "border-sky-400/30 bg-sky-400/10 text-sky-500",
  resolved: "border-emerald-500/30 bg-emerald-500/10 text-emerald-500",
  closed: "border-slate-400/30 bg-slate-400/10 text-slate-500"
};

export function AdminSupport() {
  const { language } = useLanguage();
  const { showToast, confirmToast } = useToast();

  const [tickets, setTickets] = useState<SupportTicket[]>(() =>
    readStorage<SupportTicket[]>(storageKeys.supportTickets, [])
  );

  const [statusFilter, setStatusFilter] = useState<SupportTicket["status"] | "">("");
  const [categoryFilter, setCategoryFilter] = useState<SupportTicket["category"] | "">("");
  const [priorityFilter, setPriorityFilter] = useState<SupportTicket["priority"] | "">("");
  const [search, setSearch] = useState("");

  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replyStatus, setReplyStatus] = useState<SupportTicket["status"]>("in_progress");

  const activeTicket = tickets.find((t) => t.id === activeTicketId) || null;

  const persist = (next: SupportTicket[]) => {
    writeStorage(storageKeys.supportTickets, next);
    setTickets(next);
  };

  const handleSelectTicket = (ticket: SupportTicket) => {
    setActiveTicketId(ticket.id);
    setReplyText(ticket.adminReply || "");
    setReplyStatus(ticket.status === "open" ? "in_progress" : ticket.status);
  };

  const closePanel = () => {
    setActiveTicketId(null);
    setReplyText("");
    setReplyStatus("in_progress");
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket) return;

    const next = tickets.map((t) =>
      t.id === activeTicket.id
        ? { ...t, adminReply: replyText.trim() || t.adminReply, status: replyStatus, updatedAt: new Date().toISOString() }
        : t
    );
    persist(next);

    // Notify the customer
    const notification: Notification = {
      id: "notif-" + Date.now().toString().slice(-6),
      userId: activeTicket.userId,
      title: language === "en" ? "Support Ticket Updated" : "Destek Talebi Güncellendi",
      message: language === "en"
        ? `Your ticket ${activeTicket.id} (${activeTicket.issueType}) is now ${statusOptions.find((s) => s.value === replyStatus)?.en}.${replyText.trim() ? " A reply was added." : ""}`
        : `${activeTicket.id} numaralı talebiniz (${activeTicket.issueType}) artık ${statusOptions.find((s) => s.value === replyStatus)?.tr}. ${replyText.trim() ? "Bir yanıt eklendi." : ""}`,
      read: false,
      createdAt: new Date().toISOString()
    };
    const notifications = readStorage<Notification[]>(storageKeys.notifications, []);
    writeStorage(storageKeys.notifications, [notification, ...notifications]);
    window.dispatchEvent(new Event("evalis:notificationsUpdated"));
    window.dispatchEvent(new Event("storage"));

    showToast(
      language === "en" ? "Reply sent and customer notified" : "Yanıt gönderildi ve müşteri bilgilendirildi",
      "success"
    );
    closePanel();
  };

  const handleQuickStatus = async (ticket: SupportTicket, status: SupportTicket["status"]) => {
    if (status === "closed") {
      const confirmed = await confirmToast(
        language === "en" ? "Close this ticket without a reply?" : "Bu talep yanıt vermeden kapatılsın mı?",
        { confirmLabel: language === "en" ? "Close" : "Kapat", cancelLabel: language === "en" ? "Cancel" : "Vazgeç" }
      );
      if (!confirmed) return;
    }
    persist(tickets.map((t) => (t.id === ticket.id ? { ...t, status, updatedAt: new Date().toISOString() } : t)));
    showToast(language === "en" ? "Status updated" : "Durum güncellendi", "info");
  };

  const getLabel = (opt: { en: string; tr: string }) => (language === "en" ? opt.en : opt.tr);

  const filteredTickets = tickets.filter((t) => {
    const matchStatus = !statusFilter || t.status === statusFilter;
    const matchCategory = !categoryFilter || t.category === categoryFilter;
    const matchPriority = !priorityFilter || t.priority === priorityFilter;
    const q = search.trim().toLowerCase();
    const matchSearch =
      !q ||
      t.userName.toLowerCase().includes(q) ||
      t.userEmail.toLowerCase().includes(q) ||
      t.id.toLowerCase().includes(q);
    return matchStatus && matchCategory && matchPriority && matchSearch;
  });

  const counts = {
    open: tickets.filter((t) => t.status === "open").length,
    in_progress: tickets.filter((t) => t.status === "in_progress").length,
    resolved: tickets.filter((t) => t.status === "resolved").length,
    urgent: tickets.filter((t) => t.priority === "urgent" && t.status !== "closed" && t.status !== "resolved").length
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10 text-slate-800 dark:text-slate-100">
      {/* Header */}
      <div className="dash-panel p-6">
        <h1 className="text-xl font-light uppercase tracking-widest text-slate-800 dark:text-white">
          {language === "en" ? "Customer Support" : "Müşteri Desteği"}
        </h1>
        <p className="text-[9px] text-slate-500 font-light tracking-wide mt-1">
          {language === "en"
            ? "Review and respond to customer support tickets across vehicles, stations, and orders."
            : "Araçlar, istasyonlar ve siparişlerle ilgili müşteri destek taleplerini inceleyin ve yanıtlayın."}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="dash-card p-5">
          <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold">
            {language === "en" ? "Open" : "Açık"}
          </span>
          <span className="text-2xl font-light text-accent font-mono mt-1 block">{counts.open}</span>
        </div>
        <div className="dash-card p-5">
          <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold">
            {language === "en" ? "In Progress" : "İşlemde"}
          </span>
          <span className="text-2xl font-light text-sky-500 font-mono mt-1 block">{counts.in_progress}</span>
        </div>
        <div className="dash-card p-5">
          <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold">
            {language === "en" ? "Resolved" : "Çözüldü"}
          </span>
          <span className="text-2xl font-light text-emerald-500 font-mono mt-1 block">{counts.resolved}</span>
        </div>
        <div className="dash-card p-5">
          <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold">
            {language === "en" ? "Urgent (Active)" : "Acil (Aktif)"}
          </span>
          <span className="text-2xl font-light text-red-500 font-mono mt-1 block">{counts.urgent}</span>
        </div>
      </div>

      {/* Reply panel */}
      {activeTicket && (
        <div className="dash-panel p-6 space-y-5 shadow-2xl animate-fade-in border-accent/25 bg-white dark:bg-[#0e1423]">
          <div className="flex justify-between items-start border-b border-slate-200 dark:border-white/5 pb-3">
            <div>
              <h3 className="text-xs font-bold tracking-wider text-slate-800 dark:text-white uppercase">
                {language === "en" ? "Ticket" : "Talep"} {activeTicket.id}
              </h3>
              <p className="text-[10px] text-slate-500 mt-1">
                {activeTicket.userName} · {activeTicket.userEmail}
              </p>
            </div>
            <button
              onClick={closePanel}
              aria-label={language === "en" ? "Close" : "Kapat"}
              className="text-slate-450 hover:text-slate-700 dark:hover:text-white text-sm cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold">
                {language === "en" ? "Topic" : "Konu"}
              </span>
              <span className="text-slate-800 dark:text-slate-200 font-semibold">
                {language === "en" ? getCategoryOption(activeTicket.category).labelEn : getCategoryOption(activeTicket.category).labelTr}
                {activeTicket.contextLabel && ` · ${activeTicket.contextLabel}`}
              </span>
            </div>
            <div>
              <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold">
                {language === "en" ? "Issue Type" : "Sorun Türü"}
              </span>
              <span className="text-slate-800 dark:text-slate-200 font-semibold">{activeTicket.issueType}</span>
            </div>
          </div>

          <div className="text-xs bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/5 rounded-xl p-4">
            <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold mb-1.5">
              {language === "en" ? "Customer Description" : "Müşteri Açıklaması"}
            </span>
            <p className="text-slate-700 dark:text-slate-300 font-light leading-relaxed">{activeTicket.description}</p>
          </div>

          <form onSubmit={handleSendReply} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 uppercase tracking-widest block font-semibold">
                {language === "en" ? "Reply to Customer" : "Müşteriye Yanıt"}
              </label>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={language === "en" ? "Explain the resolution or next steps..." : "Çözümü veya sonraki adımları açıklayın..."}
                className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-xs text-slate-800 dark:text-slate-200 outline-none h-24 resize-none"
              />
            </div>

            <div className="flex flex-wrap justify-between items-center gap-4">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 uppercase tracking-widest block font-semibold">
                  {language === "en" ? "Set Status" : "Durum Belirle"}
                </label>
                <div className="flex flex-wrap gap-2">
                  {statusOptions.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setReplyStatus(s.value)}
                      className={`px-3 py-1.5 rounded-xl border text-[9px] uppercase tracking-wider font-bold cursor-pointer transition ${
                        replyStatus === s.value ? STATUS_COLORS[s.value] : "border-slate-200 dark:border-white/10 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                      }`}
                    >
                      {getLabel(s)}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="px-6 py-2.5 rounded-full bg-accent text-black text-[10px] font-bold uppercase tracking-widest hover:bg-[#348c70] transition cursor-pointer"
              >
                {language === "en" ? "Send & Update" : "Gönder ve Güncelle"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="dash-panel p-5 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="space-y-1 md:col-span-2">
          <label className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold">
            {language === "en" ? "Search" : "Ara"}
          </label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={language === "en" ? "Customer, email, or ticket ID..." : "Müşteri, e-posta veya talep no..."}
            className="w-full bg-slate-100/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-accent/40 transition"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold">
            {language === "en" ? "Status" : "Durum"}
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as SupportTicket["status"] | "")}
            className="w-full bg-slate-100/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none"
          >
            <option value="" className="bg-white dark:bg-[#0a0f18]">{language === "en" ? "All Statuses" : "Tüm Durumlar"}</option>
            {statusOptions.map((s) => (
              <option key={s.value} value={s.value} className="bg-white dark:bg-[#0a0f18]">{getLabel(s)}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold">
            {language === "en" ? "Priority" : "Öncelik"}
          </label>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as SupportTicket["priority"] | "")}
            className="w-full bg-slate-100/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none"
          >
            <option value="" className="bg-white dark:bg-[#0a0f18]">{language === "en" ? "All Priorities" : "Tüm Öncelikler"}</option>
            {priorityOptions.map((p) => (
              <option key={p.value} value={p.value} className="bg-white dark:bg-[#0a0f18]">{getLabel(p)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tickets table */}
      <div className="dash-panel overflow-hidden shadow-lg">
        {filteredTickets.length === 0 ? (
          <p className="text-xs text-slate-500 uppercase tracking-widest text-center py-20 font-light">
            {language === "en" ? "No support tickets match this filter" : "Bu filtreyle eşleşen destek talebi yok"}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-light text-slate-550 dark:text-slate-400">
              <thead className="bg-slate-100/80 dark:bg-[#0e1423]/25 text-slate-650 dark:text-slate-455 uppercase tracking-widest text-[9px] font-bold border-b border-slate-200 dark:border-white/5">
                <tr>
                  <th className="px-6 py-4">{language === "en" ? "Ticket" : "Talep"}</th>
                  <th className="px-6 py-4">{language === "en" ? "Customer" : "Müşteri"}</th>
                  <th className="px-6 py-4">{language === "en" ? "Topic" : "Konu"}</th>
                  <th className="px-6 py-4">{language === "en" ? "Priority" : "Öncelik"}</th>
                  <th className="px-6 py-4">{language === "en" ? "Status" : "Durum"}</th>
                  <th className="px-6 py-4">{language === "en" ? "Updated" : "Güncellendi"}</th>
                  <th className="px-6 py-4 text-right">{language === "en" ? "Actions" : "İşlemler"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 dark:divide-white/5 font-mono text-[11px]">
                {filteredTickets.map((ticket) => {
                  const catOption = getCategoryOption(ticket.category);
                  const statusOpt = statusOptions.find((s) => s.value === ticket.status);
                  return (
                    <tr
                      key={ticket.id}
                      onClick={() => handleSelectTicket(ticket)}
                      className={`hover:bg-slate-50 dark:hover:bg-white/[0.01] transition duration-200 cursor-pointer ${
                        activeTicketId === ticket.id ? "bg-accent/5" : ""
                      }`}
                    >
                      <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-200">{ticket.id}</td>
                      <td className="px-6 py-4 font-sans">
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{ticket.userName}</p>
                        <p className="text-[9px] text-slate-500 mt-0.5">{ticket.userEmail}</p>
                      </td>
                      <td className="px-6 py-4 font-sans text-slate-650 dark:text-slate-350">
                        {language === "en" ? catOption.labelEn : catOption.labelTr}
                        {ticket.contextLabel && <span className="text-slate-500"> · {ticket.contextLabel}</span>}
                        <p className="text-[9px] text-slate-500 mt-0.5">{ticket.issueType}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-bold tracking-widest uppercase border font-sans ${PRIORITY_COLORS[ticket.priority]}`}>
                          {getLabel(priorityOptions.find((p) => p.value === ticket.priority)!)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-bold tracking-widest uppercase border font-sans ${STATUS_COLORS[ticket.status]}`}>
                          {statusOpt ? getLabel(statusOpt) : ticket.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {new Date(ticket.updatedAt).toLocaleDateString(language === "en" ? "en-US" : "tr-TR")}
                      </td>
                      <td className="px-6 py-4 text-right font-sans" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-2 text-[9px] font-bold uppercase tracking-wider">
                          <button
                            onClick={() => handleSelectTicket(ticket)}
                            className="px-3 py-1.5 rounded-full border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-accent/40 hover:text-accent transition cursor-pointer"
                          >
                            {language === "en" ? "Reply" : "Yanıtla"}
                          </button>
                          {ticket.status !== "resolved" && ticket.status !== "closed" && (
                            <button
                              onClick={() => handleQuickStatus(ticket, "resolved")}
                              className="px-3 py-1.5 rounded-full border border-emerald-500/25 text-emerald-500 hover:bg-emerald-500/10 transition cursor-pointer"
                            >
                              {language === "en" ? "Resolve" : "Çözüldü"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
export default AdminSupport;
