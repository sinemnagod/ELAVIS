// Turkish translations for the English-only `type`/`tagline`/`description` fields
// stored on each vehicle record in vehicles.json (that file has no language variants).
export const vehicleTranslations: Record<string, { type: string; tagline: string; description: string }> = {
  vector: {
    type: "Lüks Elektrikli Sedan",
    tagline: "Şık, akıllı ve her yolculukta daha fazlasını talep edenler için üretildi.",
    description: "Vector, aerodinamik hassasiyeti; saf konfor ve tam kontrol için tasarlanmış premium bir iç mekanla birleştirir."
  },
  cloud: {
    type: "Elektrikli SUV",
    tagline: "Geniş, çok yönlü ve hayatın en büyük maceralarına hazır.",
    description: "Cloud; her yolda, her havada konfor, çok yönlülük ve güven için tasarlanmıştır."
  },
  bullet: {
    type: "Elektrikli Motosiklet",
    tagline: "Anlık tork. Sıfır emisyon. Saf adrenalin.",
    description: "Bullet; çevik sürüş kabiliyeti ve öne çıkan tasarımıyla heyecan verici bir performans sunar."
  }
};

export function vehicleType(vehicleId: string, fallback: string, language: "en" | "tr"): string {
  if (language === "en") return fallback;
  return vehicleTranslations[vehicleId]?.type || fallback;
}

export function vehicleTagline(vehicleId: string, fallback: string, language: "en" | "tr"): string {
  if (language === "en") return fallback;
  return vehicleTranslations[vehicleId]?.tagline || fallback;
}

export function vehicleDescription(vehicleId: string, fallback: string, language: "en" | "tr"): string {
  if (language === "en") return fallback;
  return vehicleTranslations[vehicleId]?.description || fallback;
}
