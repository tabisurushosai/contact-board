import enMessages from "../../public/_locales/en/messages.json";
import jaMessages from "../../public/_locales/ja/messages.json";

export type SupportedLocale = "ja" | "en";
export type IntlLocale = "ja-JP" | "en-US";

type LocalizedMessage = {
  message: string;
};

type LocalizedMessages = Record<string, LocalizedMessage>;

const fallbackMessages: Record<SupportedLocale, LocalizedMessages> = {
  ja: jaMessages,
  en: enMessages
};

export function getSupportedLocale(uiLanguage: string): SupportedLocale {
  return uiLanguage.toLowerCase().startsWith("en") ? "en" : "ja";
}

export function getIntlLocale(locale: SupportedLocale): IntlLocale {
  return locale === "en" ? "en-US" : "ja-JP";
}

export function getFallbackMessage(locale: SupportedLocale, key: string, fallback: string): string {
  return fallbackMessages[locale][key]?.message ?? fallback;
}

export function applyMessageSubstitutions(template: string, substitutions?: string | string[]): string {
  if (substitutions === undefined) {
    return template;
  }

  const values = Array.isArray(substitutions) ? substitutions : [substitutions];
  return values.reduce((text, value, index) => text.split(`$${index + 1}`).join(value), template);
}
