import { useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import vehiclesData from "@/data/vehicles.json";
import { Vehicle } from "@/types";
import { vehicleType, vehicleTagline, vehicleDescription } from "@/data/vehicleTranslations";

interface VehicleDetailViewProps {
  vehicleId: string;
}

type Bilingual = { en: string; tr: string };
type Highlight = { title: Bilingual; desc: Bilingual };

const overviewHeadlines: Record<string, Bilingual> = {
  vector: { en: "Designed to move you.", tr: "Sizi harekete geçirmek için tasarlandı." },
  cloud: { en: "Space for every moment.", tr: "Her an için geniş alan." },
  bullet: { en: "Built for the city. Born to ride.", tr: "Şehir için inşa edildi. Sürmek için doğdu." }
};

const designContent: Record<string, { paragraph: Bilingual; highlights: Highlight[] }> = {
  vector: {
    paragraph: {
      en: "Vector's sculpted silhouette is crafted with absolute aerodynamic precision. With a drag coefficient of 0.208 Cd, air slips around the body effortlessly, maximizing electric range.",
      tr: "Vector'ın yontulmuş silüeti, mutlak aerodinamik hassasiyetle şekillendirilmiştir. 0.208 Cd'lik sürükleme katsayısı sayesinde hava, gövdenin etrafından zahmetsizce akarak elektrikli menzili en üst düzeye çıkarır."
    },
    highlights: [
      {
        title: { en: "Premium Sound Acoustics", tr: "Premium Ses Akustiği" },
        desc: {
          en: "23-speaker custom surround audio system delivers pure acoustic immersion throughout the cabin.",
          tr: "23 hoparlörlü özel surround ses sistemi, kabin genelinde saf akustik deneyim sunar."
        }
      }
    ]
  },
  cloud: {
    paragraph: {
      en: "Cloud SUV redefines space. Features an ultra-wide panoramic ceiling canopy that captures and reflects natural light, framing your journeys beautifully.",
      tr: "Cloud SUV, alan kavramını yeniden tanımlıyor. Doğal ışığı yakalayıp yansıtan ultra geniş panoramik tavan camı, yolculuklarınızı güzelce çerçeveliyor."
    },
    highlights: [
      {
        title: { en: "Panoramic Ceiling Vista", tr: "Panoramik Tavan Manzarası" },
        desc: {
          en: "A massive UV-insulated glass canopy wraps the ceiling, creating an open air greenhouse aesthetic.",
          tr: "UV yalıtımlı devasa bir cam tavan, açık hava serası estetiği yaratır."
        }
      },
      {
        title: { en: "Large Cargo Bay", tr: "Geniş Bagaj Alanı" },
        desc: {
          en: "Unlock up to 2,100 Liters of versatile utility space with flat-folding seat layouts.",
          tr: "Düz katlanabilir koltuk düzenleriyle 2.100 Litreye kadar çok amaçlı kullanım alanı."
        }
      }
    ]
  },
  bullet: {
    paragraph: {
      en: "Bullet motorcycle boasts a minimalist cybernetic structure built with aircraft-grade aluminum. Its aggressive stance lowers the center of gravity for maximum handling cornering.",
      tr: "Bullet motosiklet, uçak sınıfı alüminyumdan inşa edilmiş minimalist sibernetik bir yapıya sahiptir. Agresif duruşu, maksimum viraj hakimiyeti için ağırlık merkezini alçaltır."
    },
    highlights: [
      {
        title: { en: "Portable Urban Charging", tr: "Taşınabilir Şehir Şarjı" },
        desc: {
          en: "Removable lightweight battery system enables charging inside your home or office on any standard outlet.",
          tr: "Çıkarılabilir hafif batarya sistemi, evinizde veya ofisinizde herhangi bir standart prizle şarj imkânı sunar."
        }
      }
    ]
  }
};

const performanceContent: Record<string, { paragraph: Bilingual; highlights: Highlight[] }> = {
  vector: {
    paragraph: {
      en: "Equipped with dual electric motors delivering a combined 350 kW of peak power, Vector rockets to 100 km/h in 3.8 seconds. Features intelligent active roll stabilization.",
      tr: "Toplamda 350 kW tepe güç sunan çift elektrikli motorla donatılan Vector, 100 km/s hıza 3.8 saniyede ulaşır. Akıllı aktif yalpa stabilizasyonuna sahiptir."
    },
    highlights: [
      {
        title: { en: "800V Ultra-Fast Charging Architecture", tr: "800V Ultra Hızlı Şarj Mimarisi" },
        desc: {
          en: "Charges from 10% to 80% capacity in just 18 minutes on high-speed DC Supercharger stations.",
          tr: "Yüksek hızlı DC Supercharger istasyonlarında sadece 18 dakikada %10'dan %80 kapasiteye şarj olur."
        }
      }
    ]
  },
  cloud: {
    paragraph: {
      en: "Cloud's intelligent All-Wheel Drive matches instant torque demands to all conditions. Standard high-efficiency dual electric motors deliver 315 kW capacity.",
      tr: "Cloud'un akıllı Dört Tekerlekten Çekiş sistemi, ani tork taleplerini tüm koşullara uyarlar. Standart yüksek verimli çift elektrikli motor, 315 kW kapasite sunar."
    },
    highlights: [
      {
        title: { en: "Dynamic All-Wheel Drive", tr: "Dinamik Dört Tekerlekten Çekiş" },
        desc: {
          en: "Torque is redistributed to individual axles in 10 milliseconds, enhancing traction under rain or snow.",
          tr: "Tork, yağmur veya kar altında tutuşu artırmak için 10 milisaniyede tekerleklere yeniden dağıtılır."
        }
      },
      {
        title: { en: "Intelligent Heat Pump System", tr: "Akıllı Isı Pompası Sistemi" },
        desc: {
          en: "Optimizes battery thermal efficiency in sub-zero climates, recovering up to 15% range loss.",
          tr: "Sıfırın altındaki iklimlerde batarya termal verimliliğini optimize ederek %15'e varan menzil kaybını telafi eder."
        }
      }
    ]
  },
  bullet: {
    paragraph: {
      en: "Bullet motorcycle pushes direct belt-driven acceleration, bringing instant electric torque directly to the pavement. High torque response lets you dominate traffic.",
      tr: "Bullet motosiklet, doğrudan kayışla tahrikli ivmelenmeyle anlık elektrikli torku doğrudan asfalta aktarır. Yüksek tork tepkisiyle trafiğe hakim olun."
    },
    highlights: [
      {
        title: { en: "Instant Acceleration", tr: "Anlık İvmelenme" },
        desc: {
          en: "Launches from 0 to 60 km/h in an adrenaline-filled 2.7 seconds.",
          tr: "0'dan 60 km/s hıza adrenalin dolu 2.7 saniyede ulaşır."
        }
      },
      {
        title: { en: "Regenerative Braking Feedback", tr: "Rejeneratif Fren Geri Beslemesi" },
        desc: {
          en: "Intelligent kinetic recovery feeds energy back to the battery pack while braking.",
          tr: "Akıllı kinetik geri kazanım, frenleme sırasında enerjiyi batarya paketine geri besler."
        }
      }
    ]
  }
};

const technologyIntro: Bilingual = {
  en: "Powered by our proprietary EVOS platform, EVALIS vehicles run intelligent trip routing, integrated music ecosystem, custom navigation overlays, and over-the-air firmware updates.",
  tr: "Kendi geliştirdiğimiz EVOS platformuyla çalışan EVALIS araçları; akıllı yolculuk rotalama, entegre müzik ekosistemi, özel navigasyon katmanları ve kablosuz (OTA) yazılım güncellemeleri sunar."
};

const technologyHighlights: Record<string, Highlight> = {
  vector: {
    title: { en: `15.6" Center Command Console`, tr: `15.6" Merkezi Komuta Konsolu` },
    desc: {
      en: "Stunning UHD central display equipped with AI voice assistance, off-peak charging schedules, and ambient climate rules.",
      tr: "Yapay zeka destekli sesli asistan, düşük tarife şarj programları ve ortam iklim kurallarıyla donatılmış etkileyici UHD merkezi ekran."
    }
  },
  cloud: {
    title: { en: "Intelligent Cockpit OS", tr: "Akıllı Kokpit İşletim Sistemi" },
    desc: {
      en: "Front dashboard screen combined with wireless passenger casting and intelligent supercharging map layouts.",
      tr: "Kablosuz yolcu yayını ve akıllı süper şarj harita düzenleriyle birleşen ön gösterge paneli ekranı."
    }
  },
  bullet: {
    title: { en: "TFT Display Cockpit", tr: "TFT Ekranlı Kokpit" },
    desc: {
      en: "High-definition TFT dashboard with integrated rider profiles, route telemetry, and custom throttle modes.",
      tr: "Entegre sürücü profilleri, rota telemetrisi ve özel gaz modlarına sahip yüksek çözünürlüklü TFT gösterge paneli."
    }
  }
};

const safetyIntro: Bilingual = {
  en: "EVALIS structures are engineered to exceed worldwide safety testing standards. Features active steel cages, bottom armor plates protecting battery grids, and dynamic passenger protection.",
  tr: "EVALIS yapıları, dünya genelindeki güvenlik test standartlarını aşacak şekilde tasarlanmıştır. Aktif çelik kafesler, batarya gruplarını koruyan alt zırh plakaları ve dinamik yolcu koruması içerir."
};

const safetyHighlights: Record<string, Highlight> = {
  vector: {
    title: { en: "L2+ Autopilot Driver Assist", tr: "L2+ Otopilot Sürücü Asistanı" },
    desc: {
      en: "EVALIS Guard pilot leverages 12 ultrasonic cameras for automatic blind-spot prevention, lane alignment, and cruise assistance.",
      tr: "EVALIS Guard pilot, otomatik kör nokta önleme, şerit hizalama ve hız sabitleme desteği için 12 ultrasonik kamera kullanır."
    }
  },
  cloud: {
    title: { en: "5-Star Safety Cage Structure", tr: "5 Yıldızlı Güvenlik Kafesi Yapısı" },
    desc: {
      en: "Chassis built with ultra-high strength boron steel, providing superior cabin crash protection and rollover shield.",
      tr: "Ultra yüksek mukavemetli bor çelikten inşa edilen şasi, üstün kabin çarpışma koruması ve devrilme kalkanı sağlar."
    }
  },
  bullet: {
    title: { en: "Dual-Channel Hydraulic ABS", tr: "Çift Kanallı Hidrolik ABS" },
    desc: {
      en: "Advanced anti-lock braking controls front/rear wheel torque on wet asphalt to prevent skid conditions.",
      tr: "Gelişmiş kilitlenme önleyici fren sistemi, ıslak asfaltta kayma durumlarını önlemek için ön/arka tekerlek torkunu kontrol eder."
    }
  }
};

const tabLabels: Record<string, Bilingual> = {
  overview: { en: "Overview", tr: "Genel Bakış" },
  design: { en: "Design", tr: "Tasarım" },
  performance: { en: "Performance", tr: "Performans" },
  technology: { en: "Technology", tr: "Teknoloji" },
  safety: { en: "Safety", tr: "Güvenlik" },
  specs: { en: "Specs", tr: "Özellikler" }
};

export function VehicleDetailView({ vehicleId }: VehicleDetailViewProps) {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState("overview");

  // Load the specific vehicle details
  const vehicle = (vehiclesData as Vehicle[]).find((v) => v.id === vehicleId);

  if (!vehicle) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-light text-white">{language === "en" ? "Vehicle Not Found" : "Araç Bulunamadı"}</h2>
        <Link to="/vehicles" className="text-accent hover:underline mt-4 inline-block">
          {language === "en" ? "Back to lineup" : "Modellere Dön"}
        </Link>
      </div>
    );
  }

  const heroImg = vehicle.image;

  // Specs row keys
  const specList = [
    { label: t("vehicles.range"), val: vehicle.specs.range },
    { label: t("vehicles.power"), val: vehicle.specs.maxPower },
    { label: vehicle.id === "bullet" ? "0-50 km/h" : "0-100 km/h", val: vehicle.specs.acceleration },
    { label: t("vehicles.topSpeed"), val: vehicle.specs.topSpeed }
  ];

  if (vehicle.specs.extraLabel && vehicle.specs.extraValue) {
    let localizedLabel = vehicle.specs.extraLabel;
    if (vehicle.specs.extraLabel === "Seats") {
      localizedLabel = language === "en" ? "Seats" : "Koltuk";
    } else if (vehicle.specs.extraLabel === "Weight") {
      localizedLabel = language === "en" ? "Weight" : "Ağırlık";
    }

    specList.push({
      label: localizedLabel.toUpperCase(),
      val: vehicle.specs.extraValue
    });
  }

  // Tabs navigation
  const tabs = ["overview", "design", "performance", "technology", "safety", "specs"];

  // Tab-specific details content generators
  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-6 animate-fade-in">
            <span className="text-xs uppercase tracking-[0.2em] text-accent font-semibold block">
              {language === "en" ? "Overview" : "Genel Bakış"}
            </span>
            <h2 className="text-3xl font-light tracking-wide uppercase text-white leading-snug">
              {overviewHeadlines[vehicle.id]?.[language] || ""}
            </h2>
            <p className="text-slate-300 font-light text-sm leading-relaxed">
              {vehicleDescription(vehicle.id, vehicle.description, language)} {language === "en" ? "Experience luxury electric transport engineered to push borders and refine expectations." : "Sınırları zorlamak ve beklentileri yeniden tanımlamak için tasarlanmış lüks elektrikli ulaşımı deneyimleyin."}
            </p>
            <div className="pt-2">
              <Link
                to={`/test-drive?model=${vehicle.id}`}
                className="inline-flex justify-center items-center px-6 py-2.5 bg-accent text-black text-[10px] font-bold uppercase tracking-widest rounded-full hover:bg-[#348c70] transition"
              >
                {t("cta.bookTestDrive")}
              </Link>
            </div>
          </div>
        );

      case "design":
        return (
          <div className="space-y-6 animate-fade-in">
              <span className="text-xs uppercase tracking-[0.2em] text-accent font-semibold block">
                {language === "en" ? "Aerodynamics & Craftsmanship" : "Aerodinamik ve İşçilik"}
              </span>
              <h2 className="text-3xl font-light tracking-wide uppercase text-white leading-snug">
                {language === "en" ? "Form Meets Pure Utility" : "Form Saf İşlevsellikle Buluşuyor"}
              </h2>
              <p className="text-slate-355 font-light text-sm leading-relaxed">
                {designContent[vehicle.id]?.paragraph[language] || ""}
              </p>

              {/* Highlight items migrated from features list */}
              <div className="space-y-4 pt-2">
                {(designContent[vehicle.id]?.highlights || []).map((h, i) => (
                  <div key={i} className="flex gap-4 p-4 rounded-2xl bg-white/[0.01] border border-white/5">
                    <span className="text-accent text-lg shrink-0 mt-0.5">✔</span>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">{h.title[language]}</h4>
                      <p className="text-xs text-slate-400 font-light mt-0.5">{h.desc[language]}</p>
                    </div>
                  </div>
                ))}
              </div>
          </div>
        );

      case "performance":
        return (
          <div className="space-y-6 animate-fade-in">
              <span className="text-xs uppercase tracking-[0.2em] text-accent font-semibold block">
                {language === "en" ? "Electric Powertrain" : "Elektrikli Motor"}
              </span>
              <h2 className="text-3xl font-light tracking-wide uppercase text-white leading-snug">
                {language === "en" ? "Unmatched Torque & Output" : "Eşsiz Tork ve Güç"}
              </h2>
              <p className="text-slate-355 font-light text-sm leading-relaxed">
                {performanceContent[vehicle.id]?.paragraph[language] || ""}
              </p>

              {/* Performance highlights migrated from features list */}
              <div className="space-y-4 pt-2">
                {(performanceContent[vehicle.id]?.highlights || []).map((h, i) => (
                  <div key={i} className="flex gap-4 p-4 rounded-2xl bg-white/[0.01] border border-white/5">
                    <span className="text-accent text-lg shrink-0 mt-0.5">✔</span>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">{h.title[language]}</h4>
                      <p className="text-xs text-slate-400 font-light mt-0.5">{h.desc[language]}</p>
                    </div>
                  </div>
                ))}
              </div>
          </div>
        );

      case "technology":
        return (
          <div className="space-y-6 animate-fade-in">
              <span className="text-xs uppercase tracking-[0.2em] text-accent font-semibold block">
                {language === "en" ? "Intelligent Cabin" : "Akıllı Kokpit"}
              </span>
              <h2 className="text-3xl font-light tracking-wide uppercase text-white leading-snug">
                {language === "en" ? "Digital Cockpit Interface" : "Dijital Kokpit Arayüzü"}
              </h2>
              <p className="text-slate-355 font-light text-sm leading-relaxed">
                {technologyIntro[language]}
              </p>

              {/* Technology highlights migrated from features list */}
              <div className="space-y-4 pt-2">
                {technologyHighlights[vehicle.id] && (
                  <div className="flex gap-4 p-4 rounded-2xl bg-white/[0.01] border border-white/5">
                    <span className="text-accent text-lg shrink-0 mt-0.5">✔</span>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">{technologyHighlights[vehicle.id].title[language]}</h4>
                      <p className="text-xs text-slate-400 font-light mt-0.5">{technologyHighlights[vehicle.id].desc[language]}</p>
                    </div>
                  </div>
                )}
              </div>
          </div>
        );

      case "safety":
        return (
          <div className="space-y-6 animate-fade-in">
              <span className="text-xs uppercase tracking-[0.2em] text-accent font-semibold block">
                {language === "en" ? "Active Guard Safety" : "Aktif Koruma Güvenliği"}
              </span>
              <h2 className="text-3xl font-light tracking-wide uppercase text-white leading-snug">
                {language === "en" ? "Fortified Protection" : "Güçlendirilmiş Koruma"}
              </h2>
              <p className="text-slate-350 font-light text-sm leading-relaxed">
                {safetyIntro[language]}
              </p>

              {/* Safety highlights migrated from features list */}
              <div className="space-y-4 pt-2">
                {safetyHighlights[vehicle.id] && (
                  <div className="flex gap-4 p-4 rounded-2xl bg-white/[0.01] border border-white/5">
                    <span className="text-accent text-lg shrink-0 mt-0.5">✔</span>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">{safetyHighlights[vehicle.id].title[language]}</h4>
                      <p className="text-xs text-slate-400 font-light mt-0.5">{safetyHighlights[vehicle.id].desc[language]}</p>
                    </div>
                  </div>
                )}
              </div>
          </div>
        );

      case "specs":
        return (
          <div className="border border-white/5 bg-[#0b0f19]/40 rounded-3xl p-6 md:p-8 animate-fade-in shadow-xl">
            <h3 className="text-xs font-bold uppercase tracking-widest text-white border-b border-white/5 pb-4 mb-6">
              {language === "en" ? "Technical Specs" : "Teknik Özellikler"}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs font-light">
              <div className="space-y-4">
                <div className="flex justify-between py-2.5 border-b border-white/5">
                  <span className="text-slate-500 uppercase tracking-widest">{t("vehicles.range")}</span>
                  <span className="text-slate-200 font-mono font-semibold">{vehicle.specs.range} (WLTP)</span>
                </div>
                <div className="flex justify-between py-2.5 border-b border-white/5">
                  <span className="text-slate-500 uppercase tracking-widest">{t("vehicles.power")}</span>
                  <span className="text-slate-200 font-mono font-semibold">{vehicle.specs.maxPower}</span>
                </div>
                <div className="flex justify-between py-2.5 border-b border-white/5">
                  <span className="text-slate-500 uppercase tracking-widest">{language === "en" ? "Acceleration" : "Hızlanma"}</span>
                  <span className="text-slate-200 font-mono font-semibold">{vehicle.specs.acceleration}</span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between py-2.5 border-b border-white/5">
                  <span className="text-slate-500 uppercase tracking-widest">{t("vehicles.topSpeed")}</span>
                  <span className="text-slate-200 font-mono font-semibold">{vehicle.specs.topSpeed}</span>
                </div>
                {vehicle.specs.extraLabel && (
                  <div className="flex justify-between py-2.5 border-b border-white/5">
                    <span className="text-slate-500 uppercase tracking-widest">
                      {vehicle.specs.extraLabel === "Seats" ? (language === "en" ? "Seats" : "Koltuk") : (language === "en" ? "Weight" : "Ağırlık")}
                    </span>
                    <span className="text-slate-200 font-mono font-semibold">{vehicle.specs.extraValue}</span>
                  </div>
                )}
                <div className="flex justify-between py-2.5 border-b border-white/5">
                  <span className="text-slate-500 uppercase tracking-widest">{language === "en" ? "Battery Class" : "Batarya Sınıfı"}</span>
                  <span className="text-slate-200 font-mono font-semibold">{vehicle.id === "bullet" ? "Lithium-Ion Air" : "Lithium-Nickel Silicon"}</span>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-16 pb-20">
      {/* Premium Detail Hero */}
      <section className="relative h-[94vh] w-full overflow-hidden flex flex-col justify-between p-8 bg-site">
        {/* Hero Background */}
        <div className="absolute inset-0 z-0">
          <img src={heroImg} alt={vehicle.name} className="w-full h-full object-cover opacity-85" />
          <div className="absolute inset-0 bg-gradient-to-t from-site via-site/10 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-site/60 via-transparent to-transparent" />
        </div>

        {/* Hero Meta Header */}
        <div className="relative z-10 max-w-7xl mx-auto w-full pt-24 px-6">
          <span className="text-[10px] uppercase tracking-[0.35em] text-accent block font-medium">
            EVALIS
          </span>
          <h1 className="text-5xl md:text-6xl font-light tracking-[0.2em] uppercase text-white mt-1">
            {vehicle.name}
          </h1>
          <p className="text-slate-300 font-light text-xs tracking-widest mt-1">
            {vehicleType(vehicle.id, vehicle.type, language)}
          </p>
        </div>

        {/* Tagline and Actions */}
        <div className="relative z-10 max-w-7xl mx-auto w-full mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 px-6">
          <p className="max-w-xl text-md md:text-lg font-light text-slate-200 tracking-wide leading-relaxed">
            {vehicleTagline(vehicle.id, vehicle.tagline, language)}
          </p>
          <div className="flex gap-4 w-full md:w-auto">
            <Link
              to={`/test-drive?model=${vehicle.id}`}
              className="flex-1 md:flex-none inline-flex justify-center items-center px-8 py-3 bg-white text-black text-xs font-semibold uppercase tracking-[0.18em] rounded-full hover:bg-slate-200 transition"
            >
              {t("cta.bookTestDrive")}
            </Link>
          </div>
        </div>
      </section>

      {/* Detail image stuck on the left, tab content on the right */}
      <section className="w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 items-start">
          {/* Sticky detail image, half the page, shown whole, no crop or border */}
          <div className="lg:sticky lg:top-24 px-6 lg:px-12 py-6">
            <img
              src={vehicle.detailImage}
              alt={`${vehicle.name} detail view`}
              className="w-full h-auto max-h-[88vh] object-contain"
            />
          </div>

          {/* Specs, tabs, and tab content */}
          <div className="space-y-10 px-6 lg:pr-12 py-6">
            <div className="grid grid-cols-2 gap-6 text-left border-b border-white/10 pb-8">
              {specList.map((spec, i) => (
                <div key={i} className="space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest block">
                    {spec.label}
                  </span>
                  <span className="text-2xl font-light text-white tracking-wide block">
                    {spec.val}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-start border-b border-white/10 overflow-x-auto">
              <div className="flex gap-8 whitespace-nowrap">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-4 text-[10px] uppercase tracking-[0.25em] font-semibold cursor-pointer border-b-2 transition duration-200 ${
                      activeTab === tab
                        ? "border-accent text-accent"
                        : "border-transparent text-slate-400 hover:text-white"
                    }`}
                  >
                    {tabLabels[tab]?.[language] || tab}
                  </button>
                ))}
              </div>
            </div>

            {renderTabContent()}
          </div>
        </div>
      </section>
    </div>
  );
}
