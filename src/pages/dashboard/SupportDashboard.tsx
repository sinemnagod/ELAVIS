import { useState, type ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { useToast } from "@/context/ToastContext";
import { readStorage, writeStorage, storageKeys } from "@/lib/storage";
import vehiclesData from "@/data/vehicles.json";
import stationsData from "@/data/stations.json";
import { supportCategories, priorityOptions, statusOptions, getCategoryOption } from "@/data/supportCategories";
import { SupportTicket, Station, Vehicle } from "@/types";

const CATEGORY_ICONS: Record<SupportTicket["category"], ReactNode> = {
  vehicle: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 18h.01M8 21h8a2 2 0 002-2V9a2 2 0 00-2-2H8a2 2 0 00-2 2v10a2 2 0 002 2z" />
  ),
  station: (
    <>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </>
  ),
  charging: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z" />
  ),
  billing: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  ),
  account: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  ),
  other: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  )
};

const PRIORITY_COLORS: Record<SupportTicket["priority"], string> = {
  low: "border-slate-400/30 bg-slate-400/10 text-slate-400",
  medium: "border-sky-400/30 bg-sky-400/10 text-sky-400",
  high: "border-amber-500/30 bg-amber-500/10 text-amber-500",
  urgent: "border-red-500/30 bg-red-500/10 text-red-400"
};

const STATUS_COLORS: Record<SupportTicket["status"], string> = {
  open: "border-accent/30 bg-accent/10 text-accent",
  in_progress: "border-sky-400/30 bg-sky-400/10 text-sky-400",
  resolved: "border-emerald-500/30 bg-emerald-500/10 text-emerald-500",
  closed: "border-slate-400/30 bg-slate-400/10 text-slate-500"
};

export function SupportDashboard() {
  const { session } = useAuth();
  const { language } = useLanguage();
  const { showToast, confirmToast } = useToast();
  const user = session?.user;
  const userId = user?.id || "guest";

  const vehicles = vehiclesData as Vehicle[];
  const stations = readStorage<Station[]>(storageKeys.stations, stationsData as Station[]);
  const ownedVehicles = vehicles.filter((v) => user?.ownedVehicleIds.includes(v.id));

  const [tickets, setTickets] = useState<SupportTicket[]>(() =>
    readStorage<SupportTicket[]>(storageKeys.supportTickets, []).filter((t) => t.userId === userId)
  );

  const [category, setCategory] = useState<SupportTicket["category"] | "">("");
  const [contextValue, setContextValue] = useState("");
  const [issueType, setIssueType] = useState("");
  const [priority, setPriority] = useState<SupportTicket["priority"]>("medium");
  const [description, setDescription] = useState("");

  const selectedCategory = category ? getCategoryOption(category) : null;

  const resetForm = () => {
    setCategory("");
    setContextValue("");
    setIssueType("");
    setPriority("medium");
    setDescription("");
  };

  const handleSelectCategory = (value: SupportTicket["category"]) => {
    setCategory(value);
    setContextValue("");
    setIssueType("");
  };

  const contextLabel = (): string => {
    if (!selectedCategory || !selectedCategory.needsContext) return "";
    if (selectedCategory.needsContext === "vehicle") {
      return vehicles.find((v) => v.id === contextValue)?.name || "";
    }
    return stations.find((s) => s.id === contextValue)?.name || "";
  };

  const canSubmit =
    !!category &&
    !!issueType &&
    description.trim().length > 0 &&
    (!selectedCategory?.needsContext || !!contextValue);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !canSubmit || !category) return;

    const newTicket: SupportTicket = {
      id: "tkt-" + Date.now().toString().slice(-6),
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      category,
      contextLabel: contextLabel(),
      issueType,
      priority,
      description: description.trim(),
      status: "open",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const allTickets = readStorage<SupportTicket[]>(storageKeys.supportTickets, []);
    const nextAll = [newTicket, ...allTickets];
    writeStorage(storageKeys.supportTickets, nextAll);
    setTickets(nextAll.filter((t) => t.userId === user.id));

    showToast(
      language === "en" ? "Support ticket submitted — we'll get back to you soon" : "Destek talebi gönderildi — en kısa sürede size döneceğiz",
      "success"
    );
    resetForm();
  };

  const handleCloseTicket = async (ticket: SupportTicket) => {
    const confirmed = await confirmToast(
      language === "en" ? "Close this ticket? You can't reopen it yourself afterward." : "Bu talebi kapatmak istiyor musunuz? Sonrasında kendiniz yeniden açamazsınız.",
      {
        confirmLabel: language === "en" ? "Close Ticket" : "Talebi Kapat",
        cancelLabel: language === "en" ? "Keep Open" : "Açık Bırak"
      }
    );
    if (!confirmed) return;

    const allTickets = readStorage<SupportTicket[]>(storageKeys.supportTickets, []);
    const nextAll = allTickets.map((t) =>
      t.id === ticket.id ? { ...t, status: "closed" as const, updatedAt: new Date().toISOString() } : t
    );
    writeStorage(storageKeys.supportTickets, nextAll);
    setTickets(nextAll.filter((t) => t.userId === userId));
    showToast(language === "en" ? "Ticket closed" : "Talep kapatıldı", "info");
  };

  const getLabel = (opt: { en: string; tr: string }) => (language === "en" ? opt.en : opt.tr);

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* Header */}
      <div className="dash-panel p-6">
        <h1 className="text-xl font-light uppercase tracking-widest text-slate-100">
          {language === "en" ? "Support" : "Destek"}
        </h1>
        <p className="text-[9px] text-slate-500 font-light tracking-wide mt-1">
          {language === "en"
            ? "Tell us what's wrong and we'll help — pick a topic, describe the issue, and we'll follow up."
            : "Sorununuzu bize anlatın — bir konu seçin, sorunu açıklayın, en kısa sürede dönüş yapalım."}
        </p>
      </div>

      {/* Quick tips */}
      <div className="dash-card p-6 space-y-3">
        <h3 className="text-[10px] uppercase tracking-widest text-accent font-bold">
          {language === "en" ? "Before You Submit" : "Göndermeden Önce"}
        </h3>
        <ul className="text-[10px] text-slate-400 leading-relaxed font-light space-y-1.5 list-disc list-inside">
          <li>{language === "en" ? "Charger not responding? Try stopping and restarting the session from the Charging page." : "Şarj cihazı yanıt vermiyor mu? Şarj sayfasından oturumu durdurup yeniden başlatmayı deneyin."}</li>
          <li>{language === "en" ? "Battery percentage looks wrong? Check Vehicle Details for the latest telemetry." : "Batarya yüzdesi yanlış mı görünüyor? En güncel veriler için Araç Detaylarını kontrol edin."}</li>
          <li>{language === "en" ? "Roadside or safety issue? Mark priority as Urgent so we see it first." : "Yol yardımı veya güvenlik sorunu mu? En hızlı yanıt için önceliği Acil olarak işaretleyin."}</li>
        </ul>
      </div>

      {/* Ticket form */}
      <div className="dash-panel p-6 space-y-6">
        <h3 className="text-xs uppercase tracking-widest text-slate-450 font-bold border-b border-white/5 pb-2">
          {language === "en" ? "New Support Ticket" : "Yeni Destek Talebi"}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Category */}
          <div className="space-y-3">
            <label className="text-[10px] text-slate-500 uppercase tracking-widest block font-bold">
              1. {language === "en" ? "What's this about?" : "Bu ne ile ilgili?"}
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {supportCategories.map((cat) => {
                const isSelected = category === cat.value;
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => handleSelectCategory(cat.value)}
                    aria-pressed={isSelected}
                    className={`text-left p-4 rounded-2xl border transition cursor-pointer space-y-2 ${
                      isSelected
                        ? "border-accent bg-accent/10"
                        : "border-white/10 bg-white/[0.01] hover:border-white/25 hover:bg-white/[0.03]"
                    }`}
                  >
                    <svg className={`w-5 h-5 ${isSelected ? "text-accent" : "text-slate-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      {CATEGORY_ICONS[cat.value]}
                    </svg>
                    <div>
                      <p className={`text-[11px] font-semibold uppercase tracking-wider ${isSelected ? "text-accent" : "text-slate-200"}`}>
                        {language === "en" ? cat.labelEn : cat.labelTr}
                      </p>
                      <p className="text-[9px] text-slate-500 font-light mt-0.5 leading-snug">
                        {language === "en" ? cat.descriptionEn : cat.descriptionTr}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Context (vehicle or station) */}
          {selectedCategory?.needsContext === "vehicle" && (
            <div className="space-y-2">
              <label className="text-[10px] text-slate-500 uppercase tracking-widest block font-bold">
                2. {language === "en" ? "Which vehicle?" : "Hangi araç?"}
              </label>
              {ownedVehicles.length === 0 ? (
                <p className="text-[10px] text-slate-500 font-light">
                  {language === "en" ? "You don't own any vehicles yet." : "Henüz bir aracınız yok."}
                </p>
              ) : (
                <select
                  value={contextValue}
                  onChange={(e) => setContextValue(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-slate-200 outline-none focus:border-accent/40 transition"
                  required
                >
                  <option value="" className="bg-[#0a0f18]" disabled>
                    -- {language === "en" ? "Select a vehicle" : "Bir araç seçin"} --
                  </option>
                  {ownedVehicles.map((v) => (
                    <option key={v.id} value={v.id} className="bg-[#0a0f18]">
                      {v.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {selectedCategory?.needsContext === "station" && (
            <div className="space-y-2">
              <label className="text-[10px] text-slate-500 uppercase tracking-widest block font-bold">
                2. {language === "en" ? "Which station?" : "Hangi istasyon?"}
              </label>
              <select
                value={contextValue}
                onChange={(e) => setContextValue(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-slate-200 outline-none focus:border-accent/40 transition"
                required
              >
                <option value="" className="bg-[#0a0f18]" disabled>
                  -- {language === "en" ? "Select a station" : "Bir istasyon seçin"} --
                </option>
                {stations.map((s) => (
                  <option key={s.id} value={s.id} className="bg-[#0a0f18]">
                    {s.name} ({s.network})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Step 3: Issue type */}
          {selectedCategory && (
            <div className="space-y-2">
              <label className="text-[10px] text-slate-500 uppercase tracking-widest block font-bold">
                {selectedCategory.needsContext ? "3" : "2"}. {language === "en" ? "What's the problem?" : "Sorun ne?"}
              </label>
              <div className="flex flex-wrap gap-2">
                {selectedCategory.issueTypes.map((issue) => {
                  const label = getLabel(issue);
                  const isSelected = issueType === label;
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setIssueType(label)}
                      aria-pressed={isSelected}
                      className={`px-3.5 py-2 rounded-xl border text-[10px] uppercase tracking-wider font-semibold cursor-pointer transition ${
                        isSelected
                          ? "border-accent/40 bg-accent/15 text-accent"
                          : "border-white/10 bg-white/5 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 4: Priority */}
          {selectedCategory && (
            <div className="space-y-2">
              <label className="text-[10px] text-slate-500 uppercase tracking-widest block font-bold">
                {selectedCategory.needsContext ? "4" : "3"}. {language === "en" ? "Priority" : "Öncelik"}
              </label>
              <div className="flex flex-wrap gap-2">
                {priorityOptions.map((p) => {
                  const isSelected = priority === p.value;
                  return (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setPriority(p.value)}
                      aria-pressed={isSelected}
                      className={`px-3.5 py-2 rounded-xl border text-[10px] uppercase tracking-wider font-semibold cursor-pointer transition ${
                        isSelected ? PRIORITY_COLORS[p.value] : "border-white/10 bg-white/5 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {getLabel(p)}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 5: Description */}
          {selectedCategory && (
            <div className="space-y-2">
              <label className="text-[10px] text-slate-500 uppercase tracking-widest block font-bold">
                {selectedCategory.needsContext ? "5" : "4"}. {language === "en" ? "Describe the issue" : "Sorunu açıklayın"}
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={language === "en" ? "The more detail, the faster we can help..." : "Ne kadar detay verirseniz o kadar hızlı yardımcı olabiliriz..."}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-slate-200 outline-none focus:border-accent/40 transition h-28 resize-none"
                required
              />
            </div>
          )}

          {selectedCategory && (
            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full py-3.5 rounded-full bg-white text-black text-xs font-bold uppercase tracking-widest hover:bg-slate-200 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {language === "en" ? "Submit Ticket" : "Talebi Gönder"}
            </button>
          )}
        </form>
      </div>

      {/* My Tickets */}
      <div className="dash-panel p-6 space-y-4">
        <h3 className="text-xs uppercase tracking-widest text-slate-450 font-bold border-b border-white/5 pb-2">
          {language === "en" ? "My Tickets" : "Taleplerim"}
        </h3>

        {tickets.length === 0 ? (
          <p className="text-[10px] text-slate-500 uppercase tracking-widest text-center py-10 font-light">
            {language === "en" ? "No support tickets yet" : "Henüz destek talebiniz yok"}
          </p>
        ) : (
          <div className="space-y-3">
            {tickets.map((ticket) => {
              const catOption = getCategoryOption(ticket.category);
              const statusOpt = statusOptions.find((s) => s.value === ticket.status);
              return (
                <div key={ticket.id} className="border border-white/5 bg-white/[0.01] rounded-2xl p-4 space-y-3">
                  <div className="flex flex-wrap justify-between items-start gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono text-slate-500">{ticket.id}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest border ${STATUS_COLORS[ticket.status]}`}>
                          {statusOpt ? getLabel(statusOpt) : ticket.status}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest border ${PRIORITY_COLORS[ticket.priority]}`}>
                          {getLabel(priorityOptions.find((p) => p.value === ticket.priority)!)}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                        {language === "en" ? catOption.labelEn : catOption.labelTr}
                        {ticket.contextLabel && <span className="text-slate-500 normal-case"> · {ticket.contextLabel}</span>}
                        {" — "}{ticket.issueType}
                      </p>
                    </div>
                    <span className="text-[9px] text-slate-500 font-mono shrink-0">
                      {new Date(ticket.createdAt).toLocaleDateString(language === "en" ? "en-US" : "tr-TR")}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 font-light leading-relaxed">{ticket.description}</p>

                  {ticket.adminReply && (
                    <div className="border-l-2 border-accent/40 pl-3 py-1 bg-accent/[0.03] rounded-r-lg">
                      <p className="text-[9px] text-accent uppercase tracking-widest font-bold mb-1">
                        {language === "en" ? "Support Team Reply" : "Destek Ekibi Yanıtı"}
                      </p>
                      <p className="text-[11px] text-slate-300 font-light leading-relaxed">{ticket.adminReply}</p>
                    </div>
                  )}

                  {ticket.status !== "closed" && (
                    <div className="flex justify-end">
                      <button
                        onClick={() => handleCloseTicket(ticket)}
                        className="text-[9px] uppercase tracking-widest font-bold text-slate-500 hover:text-red-400 transition cursor-pointer"
                      >
                        {language === "en" ? "Close Ticket" : "Talebi Kapat"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
export default SupportDashboard;
