import { createContactBoardApp } from "./app/contactBoardApp";
import type { MessageResolver } from "./app/contactBoardApp";
import { createChromeBoardStorage } from "./storage/chromeStorageAdapter";
import "./styles.css";

const app = document.querySelector<HTMLDivElement>("#app");

const message: MessageResolver = (key, fallback, substitutions) => {
  if (typeof chrome !== "undefined" && chrome.i18n?.getMessage) {
    const localized = chrome.i18n.getMessage(key, substitutions);
    if (localized) {
      return localized;
    }
  }

  return applySubstitutions(fallback, substitutions);
};

const locale = getUiLocale();

document.documentElement.lang = locale;
document.title = message("appTitle", "Contact Board");

if (app) {
  const contactBoardApp = createContactBoardApp({
    root: app,
    storage: createChromeBoardStorage(),
    message,
    locale
  });

  void contactBoardApp.bootstrap();
}

function applySubstitutions(fallback: string, substitutions?: string | string[]): string {
  if (substitutions === undefined) {
    return fallback;
  }

  const values = Array.isArray(substitutions) ? substitutions : [substitutions];
  return values.reduce((text, value, index) => text.split(`$${index + 1}`).join(value), fallback);
}

function getUiLocale(): string {
  if (typeof chrome !== "undefined" && chrome.i18n?.getUILanguage) {
    return chrome.i18n.getUILanguage() || navigator.language || "ja";
  }

  return navigator.language || "ja";
}
