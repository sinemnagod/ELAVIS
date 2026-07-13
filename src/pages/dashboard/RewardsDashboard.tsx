import { useEffect, useState } from "react";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { readStorage, writeStorage, userStorageKeys } from "@/lib/storage";

interface RewardItem {
  id: string;
  titleEn: string;
  titleTr: string;
  descriptionEn: string;
  descriptionTr: string;
  costPoints: number;
}

const rewardsCatalog: RewardItem[] = [
  {
    id: "rew-01",
    titleEn: "100 kWh Free Charging",
    titleTr: "100 kWh Ücretsiz Şarj",
    descriptionEn: "Complementary charging credits at any public EVALIS Supercharger terminal.",
    descriptionTr: "Herhangi bir genel EVALIS Supercharger istasyonunda ücretsiz şarj kredisi.",
    costPoints: 800
  },
  {
    id: "rew-02",
    titleEn: "Custom Alcantara Key Case",
    titleTr: "Özel Alcantara Anahtar Kılıfı",
    descriptionEn: "Premium handcrafted key fob protective case matching your vehicle's trim.",
    descriptionTr: "Aracınızın döşemesiyle uyumlu, el yapımı premium anahtar kılıfı.",
    costPoints: 1200
  },
  {
    id: "rew-03",
    titleEn: "Cabin Air Filter Replacement",
    titleTr: "Kabin Hava Filtresi Değişimi",
    descriptionEn: "High-efficiency HEPA cabin filter package delivered and fitted at your showroom.",
    descriptionTr: "Yüksek verimli HEPA kabin filtresi, showroomunuzda teslim edilir ve takılır.",
    costPoints: 2000
  }
];

export function RewardsDashboard() {
  const { showToast } = useToast();
  const { session } = useAuth();
  const { language } = useLanguage();
  const userId = session?.user?.id || "guest";

  // New accounts start at zero — points are only ever earned, never granted by default.
  const [points, setPoints] = useState(() => readStorage(userStorageKeys.rewardsPoints(userId), 0));

  useEffect(() => {
    setPoints(readStorage(userStorageKeys.rewardsPoints(userId), 0));
  }, [userId]);

  useEffect(() => {
    writeStorage(userStorageKeys.rewardsPoints(userId), points);
  }, [points, userId]);

  const handleRedeem = (reward: RewardItem) => {
    if (points < reward.costPoints) {
      showToast(
        language === "en" ? "Insufficient green points to redeem this reward" : "Bu ödülü almak için yeterli puanınız yok",
        "error"
      );
      return;
    }

    setPoints((prev) => prev - reward.costPoints);
    const title = language === "en" ? reward.titleEn : reward.titleTr;
    showToast(
      language === "en"
        ? `Successfully redeemed: ${title}! Check your email for details.`
        : `${title} başarıyla alındı! Detaylar için e-postanızı kontrol edin.`,
      "success"
    );
  };

  const howItWorks = [
    {
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15a4 4 0 100-8 4 4 0 000 8z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8.5 13.5L6 21l6-3 6 3-2.5-7.5" />
        </svg>
      ),
      titleEn: "What are Green Points?",
      titleTr: "Yeşil Puan Nedir?",
      bodyEn: "Green Points are EVALIS's loyalty currency, rewarding you for driving and charging in ways that reduce emissions.",
      bodyTr: "Yeşil Puanlar, emisyonu azaltan sürüş ve şarj alışkanlıklarınızı ödüllendiren EVALIS sadakat puanlarıdır."
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      titleEn: "How to Earn",
      titleTr: "Nasıl Kazanılır",
      bodyEn: "Earn points automatically for off-peak charging sessions, completed charging schedules, and zero-emission highway trips.",
      bodyTr: "Düşük yoğunluklu saatlerde şarj, tamamlanan şarj programları ve emisyonsuz otoyol seyahatleri için otomatik olarak puan kazanırsınız."
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      titleEn: "How to Redeem",
      titleTr: "Nasıl Kullanılır",
      bodyEn: "Once you have enough points, tap \"Redeem Reward\" on any unlocked item below to claim it instantly.",
      bodyTr: "Yeterli puanınız olduğunda, aşağıdaki kilidi açık ödüllerden birinde \"Ödülü Kullan\" butonuna basarak anında talep edebilirsiniz."
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div>
        <h1 className="text-2xl font-light uppercase tracking-widest text-slate-100">
          {language === "en" ? "Green Rewards" : "Yeşil Ödüller"}
        </h1>
        <p className="text-[10px] text-slate-500 font-light tracking-wide mt-1">
          {language === "en"
            ? "Redeem point metrics accrued from off-peak charging schedules and zero-emission highway travel."
            : "Düşük yoğunluklu şarj programları ve emisyonsuz otoyol seyahatlerinden kazanılan puanları kullanın."}
        </p>
      </div>

      {/* How It Works info section */}
      <div className="dash-panel p-6 space-y-5">
        <h2 className="text-xs uppercase tracking-widest text-slate-450 font-bold">
          {language === "en" ? "How Green Rewards Work" : "Yeşil Ödüller Nasıl Çalışır"}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {howItWorks.map((item, i) => (
            <div key={i} className="flex gap-3">
              <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 text-accent flex items-center justify-center shrink-0">
                {item.icon}
              </div>
              <div className="space-y-1">
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-200">
                  {language === "en" ? item.titleEn : item.titleTr}
                </h3>
                <p className="text-[11px] text-slate-500 font-light leading-relaxed">
                  {language === "en" ? item.bodyEn : item.bodyTr}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Point Balance Header */}
      <div className="dash-panel p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden">
        {/* Decorative Glow */}
        <div className="absolute -right-20 -top-20 w-44 h-44 bg-accent/10 rounded-full blur-2xl pointer-events-none" />

        <div className="space-y-1 relative">
          <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-mono">
            {language === "en" ? "Point Ledger" : "Puan Bakiyesi"}
          </span>
          <span className="text-4xl font-extralight text-accent block font-orbitron">{points} {language === "en" ? "pts" : "puan"}</span>
          <span className="text-[9px] text-slate-500 block leading-tight font-light mt-1">
            {language === "en"
              ? "Points accrue automatically as you charge off-peak and drive emission-free."
              : "Düşük yoğunluklu saatlerde şarj ettikçe ve emisyonsuz sürdükçe puanlarınız otomatik birikir."}
          </span>
        </div>

        <div className="flex gap-4 text-xs font-mono text-slate-500 relative">
          <div className="border-r border-white/10 pr-4">
            <span className="text-[9px] text-slate-500 uppercase tracking-widest block">
              {language === "en" ? "ICE Fuel Saved" : "Tasarruf Edilen Yakıt"}
            </span>
            <span className="text-md font-semibold text-slate-200 mt-1 block">420 {language === "en" ? "Liters" : "Litre"}</span>
          </div>
          <div>
            <span className="text-[9px] text-slate-500 uppercase tracking-widest block">
              {language === "en" ? "Emissions Avoided" : "Önlenen Emisyon"}
            </span>
            <span className="text-md font-semibold text-slate-200 mt-1 block">988 kg CO2</span>
          </div>
        </div>
      </div>

      {/* Rewards Catalog */}
      <div className="space-y-4">
        <h2 className="text-sm font-light uppercase tracking-widest text-slate-450">
          {language === "en" ? "Redeemable Rewards" : "Kullanılabilir Ödüller"}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {rewardsCatalog.map((reward) => {
            const canAfford = points >= reward.costPoints;
            const title = language === "en" ? reward.titleEn : reward.titleTr;
            const description = language === "en" ? reward.descriptionEn : reward.descriptionTr;

            return (
              <div
                key={reward.id}
                className={`dash-card p-6 flex flex-col justify-between transition duration-300 ${
                  canAfford ? "hover:border-accent/30" : "opacity-60"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="text-xs uppercase tracking-wider text-slate-200 font-semibold">{title}</h3>
                    <span className="text-xs font-semibold text-accent font-mono shrink-0">{reward.costPoints} {language === "en" ? "pts" : "puan"}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-light leading-relaxed">{description}</p>
                </div>

                <button
                  onClick={() => handleRedeem(reward)}
                  disabled={!canAfford}
                  className={`mt-6 w-full py-2.5 rounded-full text-[9px] font-bold uppercase tracking-widest transition ${
                    canAfford
                      ? "bg-white text-black hover:bg-slate-200 cursor-pointer"
                      : "dash-inset text-slate-500 cursor-not-allowed"
                  }`}
                >
                  {canAfford
                    ? (language === "en" ? "Redeem Reward" : "Ödülü Kullan")
                    : (language === "en" ? "Locked (Insufficient points)" : "Kilitli (Yetersiz Puan)")}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
