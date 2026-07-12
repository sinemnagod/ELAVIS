import { readStorage, storageKeys, writeStorage } from "@/lib/storage";

export const supportedLanguages = ["en", "tr"] as const;

export type SupportedLanguage = (typeof supportedLanguages)[number];

export function getStoredLanguage() {
  return readStorage<SupportedLanguage>(storageKeys.language, "en");
}

export function setStoredLanguage(language: SupportedLanguage) {
  writeStorage(storageKeys.language, language);
}
