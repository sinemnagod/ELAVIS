import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";

const faqs = [
  {
    questionEn: "Where is EVALIS based?",
    questionTr: "EVALIS nerede konumlanıyor?",
    answerEn: "EVALIS is a mock premium EV brand experience centered around Istanbul, Turkey.",
    answerTr: "EVALIS, İstanbul merkezli kurgusal bir premium elektrikli araç marka deneyimidir."
  },
  {
    questionEn: "Can I book a test drive?",
    questionTr: "Test sürüşü rezerve edebilir miyim?",
    answerEn: "Yes. You can book a model-specific test drive from each vehicle page.",
    answerTr: "Evet. Her araç sayfasından modele özel test sürüşü rezervasyonu yapabilirsiniz."
  },
  {
    questionEn: "Are shop orders real?",
    questionTr: "Mağaza siparişleri gerçek mi?",
    answerEn: "No. Orders, users, charging sessions, and bookings are mock data persisted locally.",
    answerTr: "Hayır. Siparişler, kullanıcılar, şarj oturumları ve rezervasyonlar yerel olarak saklanan mock verilerdir."
  }
];

export function AboutFaq() {
  const { language } = useLanguage();

  return (
    <div className="space-y-16 pt-28 pb-16 max-w-7xl mx-auto px-6">
      <section className="text-center max-w-3xl mx-auto space-y-4">
        <span className="text-xs uppercase tracking-[0.3em] text-accent font-semibold block">
          {language === "en" ? "About EVALIS" : "EVALIS Hakkında"}
        </span>
        <h1 className="text-4xl md:text-5xl font-extralight tracking-widest uppercase text-white">
          {language === "en" ? "Support & FAQ" : "Destek ve SSS"}
        </h1>
        <div className="w-16 h-px bg-accent/40 mx-auto mt-4" />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-10 items-start">
        <div className="border border-white/5 bg-white/[0.01] rounded-2xl p-8 space-y-5">
          <span className="text-[10px] uppercase tracking-[0.3em] text-accent font-semibold">
            {language === "en" ? "Our Direction" : "Yaklaşımımız"}
          </span>
          <h2 className="text-3xl font-light uppercase tracking-widest text-white">
            {language === "en" ? "Quiet electric luxury." : "Sessiz elektrikli lüks."}
          </h2>
          <p className="text-sm leading-relaxed text-slate-400 font-light">
            {language === "en"
              ? "EVALIS brings together cinematic vehicle presentation, charging tools, shopping, and customer dashboards in one connected EV experience."
              : "EVALIS; sinematik araç sunumu, şarj araçları, mağaza ve müşteri panellerini tek bir bağlı elektrikli araç deneyiminde birleştirir."}
          </p>
          <Link
            to="/vehicles"
            className="inline-flex px-6 py-3 rounded-full bg-white text-black text-xs font-semibold uppercase tracking-widest hover:bg-slate-200 transition"
          >
            {language === "en" ? "Explore Vehicles" : "Araçları İncele"}
          </Link>
        </div>

        <div className="space-y-4">
          {faqs.map((item) => (
            <article
              key={item.questionEn}
              className="border border-white/5 bg-white/[0.01] rounded-2xl p-6 space-y-3"
            >
              <h3 className="text-sm uppercase tracking-widest text-white font-semibold">
                {language === "en" ? item.questionEn : item.questionTr}
              </h3>
              <p className="text-sm leading-relaxed text-slate-400 font-light">
                {language === "en" ? item.answerEn : item.answerTr}
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
