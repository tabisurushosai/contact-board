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

  return fallback;
};

if (app) {
  const contactBoardApp = createContactBoardApp({
    root: app,
    storage: createChromeBoardStorage(),
    message
  });

  void contactBoardApp.bootstrap();
}
