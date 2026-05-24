import {
  MAX_CONTACTS,
  MAX_NAME_LENGTH,
  MAX_NOTE_LENGTH,
  removeContact,
  upsertContact
} from "../core/contactBoard";
import { getPremiumStatus } from "../core/premium";
import type { ContactBoardState, ContactEntry } from "../core/types";
import type { BoardStorage } from "../storage/types";

const PREMIUM_PRICE_USD = 3;
const CONTACT_EDITOR_ID = "contact-editor";
const APP_STATUS_MESSAGE_ID = "app-status-message";
const NAME_FIELD_NAME = "name";
const NOTE_FIELD_NAME = "note";
const NAME_FIELD_SELECTOR = `input[name="${NAME_FIELD_NAME}"]`;

export type MessageResolver = (key: string, fallback: string, substitutions?: string | string[]) => string;

export type ContactBoardApp = {
  bootstrap(): Promise<void>;
};

export type ContactBoardAppOptions = {
  root: HTMLElement;
  storage: BoardStorage;
  message: MessageResolver;
  locale?: string;
};

type StatusTone = "success" | "error";

type StatusMessage = {
  text: string;
  tone: StatusTone;
};

type EditorFieldName = typeof NAME_FIELD_NAME | typeof NOTE_FIELD_NAME;
type FocusTarget = typeof NAME_FIELD_NAME | "status";

export function createContactBoardApp({ root, storage, message, locale }: ContactBoardAppOptions): ContactBoardApp {
  let boardState: ContactBoardState | null = null;
  let editingContactId: string | null = null;
  let statusMessage: StatusMessage | null = null;
  let nameFieldHasError = false;
  let pendingFocusTarget: FocusTarget | null = null;
  const numberFormatter = new Intl.NumberFormat(locale);
  const usdFormatter = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  });
  const dateFormatter = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  async function bootstrap(): Promise<void> {
    root.replaceChildren(
      createStateShell(
        "loading-card",
        message("loadingTitle", "Loading board"),
        message("loadingBody", "Checking the display list saved on this device."),
        "status"
      )
    );

    try {
      boardState = await storage.load();
      render();
    } catch {
      root.replaceChildren(
        createStateShell(
          "error-card",
          message("loadError", "Could not load local data."),
          message("loadErrorBody", "Please close and reopen the popup."),
          "alert"
        )
      );
    }
  }

  function render(): void {
    if (!boardState) {
      return;
    }

    const appShell = createElement("main", "app-shell");
    appShell.append(createEditorLink(message("skipToEditor", "Skip to the input fields"), "skip-link"));
    appShell.append(createHeader());

    if (statusMessage) {
      appShell.append(createStatusMessage(statusMessage));
    }

    if (boardState.contacts.length === 0) {
      appShell.append(createOnboardingGuide());
    }

    appShell.append(createContactList(boardState.contacts), createEditor(boardState), createPremiumPanel(boardState));
    root.replaceChildren(appShell);
    restoreFocus();
  }

  function createHeader(): HTMLElement {
    const header = createElement("header", "hero");
    header.append(
      createElement("p", "eyebrow", message("singlePurposeLabel", "Memo display only")),
      createElement("h1", "", message("appTitle", "Contact Board")),
      createElement(
        "p",
        "lead",
        message(
          "appLead",
          "Shows names and short notes for family members you contact often in large, easy-to-read text. Calling and messaging are not available."
        )
      )
    );
    return header;
  }

  function createOnboardingGuide(): HTMLElement {
    const section = createElement("section", "onboarding-guide");
    section.setAttribute("aria-labelledby", "onboarding-title");
    const title = createElement("h2", "", message("onboardingTitle", "One-line guide"));
    title.id = "onboarding-title";
    const action = createEditorLink(message("onboardingAction", "Add the first name"), "onboarding-action");
    section.append(
      title,
      createElement(
        "p",
        "",
        message(
          "onboardingGuide",
          "Start by saving just a name; the first large card will appear here, and a short note can be added later."
        )
      ),
      action
    );
    return section;
  }

  function createContactList(contacts: ContactEntry[]): HTMLElement {
    const section = createElement("section", "contacts-section");
    section.setAttribute("aria-labelledby", "contacts-title");
    const heading = createElement("div", "section-heading");
    const title = createElement("h2", "", message("contactsTitle", "Family contact list"));
    title.id = "contacts-title";
    heading.append(
      title,
      createElement(
        "p",
        "section-meta",
        message("contactCount", "Showing $1 of $2 names", [formatNumber(contacts.length), formatNumber(MAX_CONTACTS)])
      )
    );
    section.append(heading);

    if (contacts.length === 0) {
      const empty = createElement("div", "empty-card state-card");
      const action = createEditorLink(message("emptyAction", "Go to the input fields"), "empty-action");
      const emptyBody = createElement(
        "p",
        "",
        message("emptyBody", "There are no saved names yet. The first name you save will appear here as an easy-to-read card.")
      );
      const emptyNextStep = createElement(
        "p",
        "",
        message("emptyNextStep", "Go to the input fields below, enter a name, and save it. The short note is optional.")
      );
      emptyNextStep.id = "empty-next-step";
      action.setAttribute("aria-describedby", "empty-next-step");
      empty.append(
        createElement("p", "empty-title", message("emptyTitle", "No names yet")),
        emptyBody,
        emptyNextStep,
        action
      );
      section.append(empty);
      return section;
    }

    const list = createElement("div", "contact-list");
    list.setAttribute("role", "list");
    contacts.forEach((contact, index) => {
      const card = createElement("article", "contact-card");
      card.setAttribute("role", "listitem");
      card.setAttribute("aria-labelledby", `contact-name-${index}`);
      card.setAttribute("aria-describedby", `contact-note-${index}`);

      const text = createElement("div", "contact-text");
      const contactName = createElement("h3", "contact-name", contact.name);
      contactName.id = `contact-name-${index}`;
      const contactNote = createElement(
        "p",
        contact.note ? "contact-note" : "contact-note muted-note",
        contact.note || message("noNote", "No note")
      );
      contactNote.id = `contact-note-${index}`;
      text.append(contactName, contactNote);

      const actions = createElement("div", "card-actions");
      actions.setAttribute("role", "group");
      actions.setAttribute("aria-label", message("contactActionsLabel", "Actions for $1", contact.name));
      const editButton = createButton(message("editButton", "Edit"), "secondary-button");
      editButton.setAttribute("aria-label", message("editContactButtonLabel", `Edit ${contact.name}`, contact.name));
      editButton.setAttribute("aria-controls", CONTACT_EDITOR_ID);
      editButton.addEventListener("click", () => {
        editingContactId = contact.id;
        statusMessage = null;
        nameFieldHasError = false;
        pendingFocusTarget = NAME_FIELD_NAME;
        render();
      });

      const removeButton = createButton(message("deleteButton", "Delete"), "danger-button");
      removeButton.setAttribute("aria-label", message("deleteContactButtonLabel", `Delete ${contact.name}`, contact.name));
      removeButton.addEventListener("click", async () => {
        if (!boardState) {
          return;
        }
        boardState = removeContact(boardState, contact.id);
        editingContactId = null;
        nameFieldHasError = false;
        statusMessage = { text: message("deletedStatus", "Deleted."), tone: "success" };
        pendingFocusTarget = "status";
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

  function createEditorLink(label: string, className: string): HTMLAnchorElement {
    const action = createElement("a", className, label);
    action.href = `#${CONTACT_EDITOR_ID}`;
    action.setAttribute("aria-controls", CONTACT_EDITOR_ID);
    action.addEventListener("click", (event) => {
      const nameInput = root.querySelector<HTMLInputElement>(NAME_FIELD_SELECTOR);
      if (!nameInput) {
        return;
      }

      event.preventDefault();
      nameInput.focus();
    });
    return action;
  }

  function createEditor(state: ContactBoardState): HTMLElement {
    const editingContact = state.contacts.find((contact) => contact.id === editingContactId) ?? null;
    const section = createElement("section", "editor-section");
    section.id = CONTACT_EDITOR_ID;
    section.setAttribute("aria-labelledby", "editor-title");
    section.setAttribute("aria-describedby", "editor-help");
    const title = createElement(
      "h2",
      "",
      editingContact
        ? message("editContactTitle", "Edit name and note")
        : message("addContactTitle", "Add name and note")
    );
    title.id = "editor-title";
    const intro = createElement(
      "p",
      "section-intro",
      editingContact
        ? message("editContactHint", "Update the name and note shown on the board.")
        : message("addContactHint", "Add one name and a short note for the board display.")
    );
    intro.id = "editor-help";
    section.append(title, intro);

    const form = document.createElement("form");
    form.className = "contact-form";
    form.noValidate = true;
    form.setAttribute("aria-labelledby", "editor-title");
    form.setAttribute("aria-describedby", "editor-help");
    form.append(
      createLabelInput(NAME_FIELD_NAME, message("nameLabel", "Name"), editingContact?.name ?? "", MAX_NAME_LENGTH, {
        invalid: nameFieldHasError,
        required: true
      }),
      createLabelInput(NOTE_FIELD_NAME, message("noteLabel", "Short note"), editingContact?.note ?? "", MAX_NOTE_LENGTH)
    );

    const buttonRow = createElement("div", "form-actions");
    buttonRow.append(createButton(message("saveButton", "Save"), "primary-button", "submit"));

    if (editingContact) {
      const cancelButton = createButton(message("cancelButton", "Cancel"), "secondary-button", "button");
      cancelButton.addEventListener("click", () => {
        editingContactId = null;
        statusMessage = null;
        nameFieldHasError = false;
        pendingFocusTarget = NAME_FIELD_NAME;
        render();
      });
      buttonRow.append(cancelButton);
    }

    form.append(buttonRow);
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const formData = new FormData(form);
      const name = String(formData.get(NAME_FIELD_NAME) ?? "");
      const note = String(formData.get(NOTE_FIELD_NAME) ?? "");

      if (!name.trim()) {
        nameFieldHasError = true;
        statusMessage = { text: message("nameRequired", "Please enter a name."), tone: "error" };
        pendingFocusTarget = NAME_FIELD_NAME;
        render();
        return;
      }

      boardState = upsertContact(
        state,
        editingContact ? { id: editingContact.id, name, note } : { name, note }
      );
      editingContactId = null;
      nameFieldHasError = false;
      statusMessage = { text: message("savedStatus", "Saved on this device."), tone: "success" };
      pendingFocusTarget = "status";
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
    const title = createElement("h2", "", message("premiumTitle", "Premium details"));
    title.id = "premium-title";
    section.append(title);

    const statusText = state.premium.enabled
      ? message("premiumActive", "Premium is active.")
      : status.isTrialActive
        ? formatTrialRemaining(status.trialDaysRemaining)
        : message("trialEnded", "Trial ended. Basic display and editing still work.");

    section.append(
      createElement("p", "", statusText),
      createElement(
        "p",
        "premium-note",
        message(
          "premiumPrice",
          "Premium is planned as a one-time purchase of $1.",
          formatUsd(PREMIUM_PRICE_USD)
        )
      ),
      createElement(
        "p",
        "premium-note",
        message("premiumPlaceholder", "The payment link is not ready yet.")
      )
    );

    section.append(
      createElement("p", "premium-date", message("trialEndsAt", "Trial ends: $1", formatDate(status.trialEndsAt)))
    );

    return section;
  }

  function createLabelInput(
    name: EditorFieldName,
    labelText: string,
    value: string,
    maxLength: number,
    options: { invalid?: boolean; required?: boolean } = {}
  ): HTMLElement {
    const wrapper = createElement("label", "field");
    const label = createElement("span", "field-label", labelText);
    label.id = `${name}-label`;
    if (options.required) {
      label.append(" ", createElement("span", "required-hint", message("requiredFieldHint", "Required")));
    }
    const input = document.createElement("input");
    input.id = `${name}-field`;
    input.name = name;
    input.value = value;
    input.maxLength = maxLength;
    input.autocomplete = "off";
    input.inputMode = "text";
    input.required = options.required === true;
    input.setAttribute("aria-labelledby", `${name}-label`);
    input.setAttribute("aria-describedby", options.invalid ? `${name}-help ${APP_STATUS_MESSAGE_ID}` : `${name}-help`);
    if (options.required) {
      input.setAttribute("aria-required", "true");
    }
    if (options.invalid) {
      input.setAttribute("aria-invalid", "true");
      input.setAttribute("aria-errormessage", APP_STATUS_MESSAGE_ID);
    }

    const help = createElement(
      "small",
      "field-help",
      message("fieldHelp", "Use up to $1 characters.", formatNumber(maxLength))
    );
    help.id = `${name}-help`;

    wrapper.append(label, input, help);
    return wrapper;
  }

  function createButton(label: string, className: string, type: "button" | "submit" = "button"): HTMLButtonElement {
    const button = document.createElement("button");
    button.className = className;
    button.type = type;
    button.textContent = label;
    return button;
  }

  function createStatusMessage(statusMessage: StatusMessage): HTMLElement {
    const status = createElement("div", `status-message status-message--${statusMessage.tone}`);
    const label = createElement(
      "span",
      "status-label",
      statusMessage.tone === "success"
        ? message("successStatusLabel", "Done")
        : message("errorStatusLabel", "Check")
    );
    const text = createElement("span", "status-text", statusMessage.text);
    status.id = APP_STATUS_MESSAGE_ID;
    status.tabIndex = -1;
    status.setAttribute("role", statusMessage.tone === "error" ? "alert" : "status");
    status.setAttribute("aria-live", statusMessage.tone === "error" ? "assertive" : "polite");
    status.setAttribute("aria-atomic", "true");
    status.append(label, text);
    return status;
  }

  function createStateShell(className: string, title: string, body: string, role: "alert" | "status"): HTMLElement {
    const appShell = createElement("main", "app-shell app-shell--state");
    const card = createElement("section", `state-card ${className}`);
    card.setAttribute("role", role);
    if (className === "loading-card") {
      card.setAttribute("aria-busy", "true");
    }
    card.append(
      createElement("p", "state-kicker", message("singlePurposeLabel", "Memo display only")),
      createElement("h1", "", title),
      createElement("p", "state-body", body)
    );
    appShell.append(card);
    return appShell;
  }

  function restoreFocus(): void {
    if (!pendingFocusTarget) {
      return;
    }

    const focusTarget = pendingFocusTarget;
    pendingFocusTarget = null;
    const target =
      focusTarget === NAME_FIELD_NAME
        ? root.querySelector<HTMLElement>(NAME_FIELD_SELECTOR)
        : root.querySelector<HTMLElement>(".status-message");

    target?.focus({ preventScroll: true });
  }

  return {
    bootstrap
  };

  function formatNumber(value: number): string {
    return numberFormatter.format(value);
  }

  function formatUsd(value: number): string {
    return usdFormatter.format(value);
  }

  function formatTrialRemaining(days: number): string {
    const formattedDays = formatNumber(days);
    return days === 1
      ? message("trialRemainingOne", "Trial: $1 day left.", formattedDays)
      : message("trialRemainingOther", "Trial: $1 days left.", formattedDays);
  }

  function formatDate(timestamp: number): string {
    return dateFormatter.format(new Date(timestamp));
  }
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
