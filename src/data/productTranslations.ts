// Turkish translations for the English-only `name`/`shortDescription`/`fullDescription`
// fields stored on each product in products.json (that file has no language variants).
export const productTranslations: Record<string, { name: string; shortDescription: string; fullDescription: string }> = {
  "home-charger": {
    name: "Ev Şarj Cihazı",
    shortDescription: "İmza ışıklı halkaya sahip şık duvar şarj cihazı.",
    fullDescription: "EVALIS Ev Şarj Cihazı, dinamik yük yönetimi ve panel üzerinden akıllı programlama özellikleriyle 22 kW'a kadar şarj gücü sağlar."
  },
  "charging-cable": {
    name: "Şarj Kablosu",
    shortDescription: "Ağır hizmet tipi Type 2 şarj kablosu.",
    fullDescription: "Genel şarj için idealdir. Maksimum 32A'ya kadar verim sağlayan, dayanıklı, hava koşullarına dayanıklı taşıma çantalı Type 2 kablo."
  },
  "key-card": {
    name: "Anahtar Kart",
    shortDescription: "Şık RFID anahtar kart erişimi.",
    fullDescription: "EVALIS NFC/RFID Anahtar Kart, cüzdanınıza kolayca sığan dayanıklı bir yedek anahtardır. Araç içi ekran üzerinden programlanabilir."
  },
  "floor-mats": {
    name: "Her Hava Koşuluna Uygun Paspaslar",
    shortDescription: "Özel kesim koruyucu taban paspasları.",
    fullDescription: "Vector, Cloud veya Bullet'a özel kesim, her hava koşuluna dayanıklı kauçuk taban paspasları. Kolay yıkanır ve temizlenir."
  },
  "tire-set": {
    name: "EVALIS Premium Lastik Seti",
    shortDescription: "Maksimum elektrikli araç verimliliği için düşük yuvarlanma dirençli lastikler.",
    fullDescription: "Yol gürültüsünü en aza indirmek ve sürüş menzilini optimize etmek için özel olarak EVALIS araçları için geliştirilmiştir. Kuru ve ıslak zeminlerde yüksek tutuş derecesi."
  },
  "vector-cover": {
    name: "Vector Hava Koşullarına Dayanıklı Araç Örtüsü",
    shortDescription: "Vector sedan için özel kesim dış mekan örtüsü.",
    fullDescription: "Vector'ın tam siluetine göre şekillendirilen bu hava koşullarına dayanıklı örtü, boya yüzeyini koruyan yumuşak astarlı iç yapısıyla sedanınızı UV ışınlarına, yağmura ve toza karşı korur."
  },
  "bullet-cover": {
    name: "Bullet Hava Koşullarına Dayanıklı Motosiklet Örtüsü",
    shortDescription: "Bullet motosiklet için özel kesim dış mekan örtüsü.",
    fullDescription: "Bullet'ın profiline uyacak şekilde tasarlanan bu ağır hizmet tipi örtü, yansıtıcı güvenlik şeritleri ve kilitlenebilir taban kayışıyla yağmura, UV maruziyetine ve toza karşı koruma sağlar."
  },
  "snow-chains": {
    name: "Her Arazi Kar Zinciri",
    shortDescription: "Kışın sürüş için acil durum çekiş zincirleri.",
    fullDescription: "EVALIS jant boyutları için tasarlanmış, buzlu ve karla kaplı yollarda güvenilir çekiş sağlayan, sürüş konforundan ödün vermeyen hızlı takılabilir çelik kar zincirleri."
  },
  "portable-power-station": {
    name: "EVALIS Taşınabilir Güç İstasyonu",
    shortDescription: "AC, DC ve USB çıkışlı 3.2 kWh mobil batarya.",
    fullDescription: "AC, DC, USB-A ve USB-C çıkışlarına sahip kompakt bir 3.2 kWh güç istasyonu; kamp, şantiye veya şebeke dışı acil durum yedek güç için idealdir."
  }
};

export const productCategoryLabelsTr: Record<string, string> = {
  chargers: "Şarj Cihazları ve Hublar",
  cables: "Kablolar",
  accessories: "Araç Aksesuarları",
  parts: "Parçalar"
};

export function productName(productId: string, fallback: string, language: "en" | "tr"): string {
  if (language === "en") return fallback;
  return productTranslations[productId]?.name || fallback;
}

export function productShortDescription(productId: string, fallback: string, language: "en" | "tr"): string {
  if (language === "en") return fallback;
  return productTranslations[productId]?.shortDescription || fallback;
}

export function productFullDescription(productId: string, fallback: string, language: "en" | "tr"): string {
  if (language === "en") return fallback;
  return productTranslations[productId]?.fullDescription || fallback;
}
