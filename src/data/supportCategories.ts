import { SupportTicket } from "@/types";

export interface IssueTypeOption {
  en: string;
  tr: string;
}

export interface SupportCategoryOption {
  value: SupportTicket["category"];
  labelEn: string;
  labelTr: string;
  descriptionEn: string;
  descriptionTr: string;
  needsContext: "vehicle" | "station" | null;
  issueTypes: IssueTypeOption[];
}

export const supportCategories: SupportCategoryOption[] = [
  {
    value: "vehicle",
    labelEn: "My Vehicle",
    labelTr: "Aracım",
    descriptionEn: "Tires, battery, software, damage, or anything else about the car itself.",
    descriptionTr: "Lastikler, batarya, yazılım, hasar veya aracın kendisiyle ilgili her şey.",
    needsContext: "vehicle",
    issueTypes: [
      { en: "Tire / Wheel Issue", tr: "Lastik / Jant Sorunu" },
      { en: "Battery Not Charging", tr: "Batarya Şarj Olmuyor" },
      { en: "Software / UI Bug", tr: "Yazılım / Arayüz Hatası" },
      { en: "Unusual Noise or Vibration", tr: "Anormal Ses veya Titreşim" },
      { en: "Physical Damage", tr: "Fiziksel Hasar" },
      { en: "Interior / Electronics Issue", tr: "İç Mekan / Elektronik Sorunu" },
      { en: "Other", tr: "Diğer" }
    ]
  },
  {
    value: "station",
    labelEn: "Charging Station",
    labelTr: "Şarj İstasyonu",
    descriptionEn: "A specific EVALIS or partner charging station.",
    descriptionTr: "Belirli bir EVALIS veya ortak şarj istasyonu.",
    needsContext: "station",
    issueTypes: [
      { en: "Charger Not Working", tr: "Şarj Cihazı Çalışmıyor" },
      { en: "Payment / Billing Issue", tr: "Ödeme / Faturalama Sorunu" },
      { en: "Port Physically Damaged", tr: "Soket Fiziksel Olarak Hasarlı" },
      { en: "Station Info Incorrect on Map", tr: "Haritadaki İstasyon Bilgisi Yanlış" },
      { en: "Long Wait / No Availability", tr: "Uzun Bekleme / Müsaitlik Yok" },
      { en: "Other", tr: "Diğer" }
    ]
  },
  {
    value: "charging",
    labelEn: "Charging Session",
    labelTr: "Şarj Oturumu",
    descriptionEn: "A charging session that behaved unexpectedly.",
    descriptionTr: "Beklenmedik şekilde davranan bir şarj oturumu.",
    needsContext: "vehicle",
    issueTypes: [
      { en: "Session Won't Start", tr: "Oturum Başlamıyor" },
      { en: "Session Stuck / Frozen", tr: "Oturum Takıldı / Donuk" },
      { en: "Charging Too Slow", tr: "Şarj Çok Yavaş" },
      { en: "Incorrect Energy / Cost Reading", tr: "Yanlış Enerji / Maliyet Bilgisi" },
      { en: "Unexpected Stop", tr: "Beklenmedik Durma" },
      { en: "Other", tr: "Diğer" }
    ]
  },
  {
    value: "billing",
    labelEn: "Billing & Orders",
    labelTr: "Fatura ve Siparişler",
    descriptionEn: "Shop orders, charges, or refunds.",
    descriptionTr: "Mağaza siparişleri, ücretler veya iadeler.",
    needsContext: null,
    issueTypes: [
      { en: "Incorrect Charge", tr: "Yanlış Ücretlendirme" },
      { en: "Refund Request", tr: "İade Talebi" },
      { en: "Order Not Received", tr: "Sipariş Ulaşmadı" },
      { en: "Subscription / Payment Issue", tr: "Abonelik / Ödeme Sorunu" },
      { en: "Other", tr: "Diğer" }
    ]
  },
  {
    value: "account",
    labelEn: "Account & Access",
    labelTr: "Hesap ve Erişim",
    descriptionEn: "Login, profile, or ownership record problems.",
    descriptionTr: "Giriş, profil veya sahiplik kaydı sorunları.",
    needsContext: null,
    issueTypes: [
      { en: "Can't Log In", tr: "Giriş Yapamıyorum" },
      { en: "Profile Information Incorrect", tr: "Profil Bilgisi Yanlış" },
      { en: "Vehicle Ownership Issue", tr: "Araç Sahipliği Sorunu" },
      { en: "Notifications Not Working", tr: "Bildirimler Çalışmıyor" },
      { en: "Other", tr: "Diğer" }
    ]
  },
  {
    value: "other",
    labelEn: "Something Else",
    labelTr: "Diğer",
    descriptionEn: "Anything that doesn't fit the categories above.",
    descriptionTr: "Yukarıdaki kategorilere uymayan her şey.",
    needsContext: null,
    issueTypes: [
      { en: "General Inquiry", tr: "Genel Soru" },
      { en: "Feedback / Suggestion", tr: "Geri Bildirim / Öneri" },
      { en: "Other", tr: "Diğer" }
    ]
  }
];

export const priorityOptions: { value: SupportTicket["priority"]; en: string; tr: string }[] = [
  { value: "low", en: "Low", tr: "Düşük" },
  { value: "medium", en: "Medium", tr: "Orta" },
  { value: "high", en: "High", tr: "Yüksek" },
  { value: "urgent", en: "Urgent", tr: "Acil" }
];

export const statusOptions: { value: SupportTicket["status"]; en: string; tr: string }[] = [
  { value: "open", en: "Open", tr: "Açık" },
  { value: "in_progress", en: "In Progress", tr: "İşlemde" },
  { value: "resolved", en: "Resolved", tr: "Çözüldü" },
  { value: "closed", en: "Closed", tr: "Kapatıldı" }
];

export function getCategoryOption(value: SupportTicket["category"]): SupportCategoryOption {
  return supportCategories.find((c) => c.value === value) || supportCategories[5];
}
