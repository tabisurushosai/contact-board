import {
  MAX_NAME_LENGTH,
  MAX_NOTE_LENGTH,
  removeContact,
  upsertContact
} from "./core/contactBoard";
import { getPremiumStatus, STRIPE_PAYMENT_LINK } from "./core/premium";
import type { ContactBoardState, ContactEntry } from "./core/types";
import { createChromeBoardStorage } from "./storage/chromeStorageAdapter";
import "./styles.css";

const storage = createChromeBoardStorage();
const app = document.querySelector<HTMLDivElement>("#app");

let boardState: ContactBoardState | null = null;
let editingContactId: string | null = null;
let statusMessage = "";

function message(key: string, fallback: string, substitutions?: string | string[]): string {
  if (typeof chrome !== "undefined" && chrome.i18n?.getMessage) {
    const localized = chrome.i18n.getMessage(key, substitutions);
    if (localized) {
      return localized;
    }
  }

  return fallback;
}

function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(new Date(timestamp));
}

async function bootstrap(): Promise<void> {
  if (!app) {
    return;
  }

  try {
    boardState = await storage.load();
    render();
  } catch {
    app.replaceChildren(
      createElement("main", "app-shell", message("loadError", "Could not load local data."))
    );
  }
}

function render(): void {
  if (!app || !boardState) {
    return;
  }

  const root = createElement("main", "app-shell");
  root.append(createHeader(), createContactList(boardState.contacts), createEditor(boardState), createPremiumPanel(boardState));

  if (statusMessage) {
    root.append(createElement("p", "status-message", statusMessage));
  }

  app.replaceChildren(root);
}

function createHeader(): HTMLElement {
  const header = createElement("header", "hero");
  header.append(
    createElement("p", "eyebrow", message("singlePurposeLabel", "Memo display only")),
    createElement("h1", "", message("appTitle", "れんらくボード")),
    createElement(
      "p",
      "lead",
      message(
        "appLead",
        "Frequently-contacted family names and short notes are shown in large text. No calling or sending."
      )
    )
  );
  return header;
}

function createContactList(contacts: ContactEntry[]): HTMLElement {
  const section = createElement("section", "contacts-section");
  section.setAttribute("aria-labelledby", "contacts-title");
  const title = createElement("h2", "", message("contactsTitle", "Family contacts"));
  title.id = "contacts-title";
  section.append(title);

  if (contacts.length === 0) {
    const empty = createElement("div", "empty-card");
    empty.append(
      createElement("p", "empty-title", message("emptyTitle", "No names yet")),
      createElement("p", "", message("emptyBody", "Add a name and short note to show it here."))
    );
    section.append(empty);
    return section;
  }

  const list = createElement("div", "contact-list");
  contacts.forEach((contact) => {
    const card = createElement("article", "contact-card");
    const text = createElement("div", "contact-text");
    text.append(createElement("h3", "", contact.name), createElement("p", "", contact.note || message("noNote", "No note")));

    const actions = createElement("div", "card-actions");
    const editButton = createButton(message("editButton", "Edit"), "secondary-button");
    editButton.addEventListener("click", () => {
      editingContactId = contact.id;
      statusMessage = "";
      render();
    });

    const removeButton = createButton(message("deleteButton", "Delete"), "danger-button");
    removeButton.addEventListener("click", async () => {
      if (!boardState) {
        return;
      }
      boardState = removeContact(boardState, contact.id);
      editingContactId = null;
      statusMessage = message("deletedStatus", "Deleted.");
      await storage.save(boardState);
      render();
    });

    actions.append(editButton, removeButton);
    card.append(text, actions);
    list.append(card);
  });

  section.append(list);
  return section;
}

function createEditor(state: ContactBoardState): HTMLElement {
  const editingContact = state.contacts.find((contact) => contact.id === editingContactId) ?? null;
  const section = createElement("section", "editor-section");
  section.setAttribute("aria-labelledby", "editor-title");
  const title = createElement(
    "h2",
    "",
    editingContact ? message("editContactTitle", "Edit displayed name") : message("addContactTitle", "Add displayed name")
  );
  title.id = "editor-title";
  section.append(title);

  const form = document.createElement("form");
  form.className = "contact-form";
  form.append(
    createLabelInput("name", message("nameLabel", "Name"), editingContact?.name ?? "", MAX_NAME_LENGTH),
    createLabelInput("note", message("noteLabel", "Short note"), editingContact?.note ?? "", MAX_NOTE_LENGTH)
  );

  const buttonRow = createElement("div", "form-actions");
  buttonRow.append(createButton(message("saveButton", "Save"), "primary-button", "submit"));

  if (editingContact) {
    const cancelButton = createButton(message("cancelButton", "Cancel"), "secondary-button", "button");
    cancelButton.addEventListener("click", () => {
      editingContactId = null;
      statusMessage = "";
      render();
    });
    buttonRow.append(cancelButton);
  }

  form.append(buttonRow);
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const name = String(formData.get("name") ?? "");
    const note = String(formData.get("note") ?? "");

    if (!name.trim()) {
      statusMessage = message("nameRequired", "Please enter a name.");
      render();
      return;
    }

    boardState = upsertContact(state, { id: editingContact?.id, name, note });
    editingContactId = null;
    statusMessage = message("savedStatus", "Saved locally.");
    await storage.save(boardState);
    render();
  });

  section.append(form);
  return section;
}

function createPremiumPanel(state: ContactBoardState): HTMLElement {
  const status = getPremiumStatus(state);
  const section = createElement("section", "premium-panel");
  section.setAttribute("aria-labelledby", "premium-title");
  const title = createElement("h2", "", message("premiumTitle", "Premium framework"));
  title.id = "premium-title";
  section.append(title);

  const statusText = state.premium.enabled
    ? message("premiumActive", "Premium is active.")
    : status.isTrialActive
      ? message("trialRemaining", "Trial: $1 days remaining.", String(status.trialDaysRemaining))
      : message("trialEnded", "Trial ended. Basic display and editing still work.");

  section.append(
    createElement("p", "", statusText),
    createElement("p", "premium-note", message("premiumPrice", "Premium is planned as a one-time $3 purchase.")),
    createElement("p", "premium-note", message("premiumPlaceholder", "Payment link placeholder is kept for owner setup."))
  );

  const hiddenPlaceholder = document.createElement("data");
  hiddenPlaceholder.value = STRIPE_PAYMENT_LINK;
  section.append(hiddenPlaceholder, createElement("p", "premium-date", message("trialEndsAt", "Trial ends: $1", formatDate(status.trialEndsAt))));

  return section;
}

function createLabelInput(name: string, labelText: string, value: string, maxLength: number): HTMLElement {
  const wrapper = createElement("label", "field");
  const span = createElement("span", "", labelText);
  const input = document.createElement("input");
  input.name = name;
  input.value = value;
  input.maxLength = maxLength;
  input.autocomplete = "off";
  input.inputMode = "text";
  input.required = name === "name";
  input.setAttribute("aria-describedby", `${name}-help`);

  const help = createElement(
    "small",
    "field-help",
    message("fieldHelp", "Up to $1 characters.", String(maxLength))
  );
  help.id = `${name}-help`;

  wrapper.append(span, input, help);
  return wrapper;
}

function createButton(label: string, className: string, type: "button" | "submit" = "button"): HTMLButtonElement {
  const button = document.createElement("button");
  button.className = className;
  button.type = type;
  button.textContent = label;
  return button;
}

function createElement<K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  className = "",
  textContent = ""
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tagName);
  if (className) {
    element.className = className;
  }
  if (textContent) {
    element.textContent = textContent;
  }
  return element;
}

void bootstrap();
