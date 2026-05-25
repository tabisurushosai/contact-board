import { createContactBoardApp } from "./app/contactBoardApp";
import type { MessageResolver } from "./app/contactBoardApp";
import {
  applyMessageSubstitutions,
  getFallbackMessage,
  getIntlLocale,
  getSupportedLocale
} from "./app/localizedMessages";
import { createChromeBoardStorage } from "./storage/chromeStorageAdapter";
import "./styles.css";

const app = document.querySelector<HTMLDivElement>("#app");
const locale = getSupportedLocale(getUiLanguage());

const message: MessageResolver = (key, fallback, substitutions) => {
  if (typeof chrome !== "undefined" && chrome.i18n?.getMessage) {
    const localized = chrome.i18n.getMessage(key, substitutions);
    if (localized) {
      return localized;
    }
  }

  return applyMessageSubstitutions(getFallbackMessage(locale, key, fallback), substitutions);
};

document.documentElement.lang = locale;
document.title = message("appTitle", "Contact Board");

if (app) {
  const contactBoardApp = createContactBoardApp({
    root: app,
    storage: createChromeBoardStorage(),
    message,
    locale: getIntlLocale(locale)
  });

  void contactBoardApp.bootstrap();
}

function getUiLanguage(): string {
  return (
    typeof chrome !== "undefined" && chrome.i18n?.getUILanguage
      ? chrome.i18n.getUILanguage() || navigator.language || "ja"
      : navigator.language || "ja"
  );
}
