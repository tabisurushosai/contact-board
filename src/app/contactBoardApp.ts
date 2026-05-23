import {
  MAX_CONTACTS,
  MAX_NAME_LENGTH,
  MAX_NOTE_LENGTH,
  removeContact,
  upsertContact
} from "../core/contactBoard";
import { getPremiumStatus, STRIPE_PAYMENT_LINK } from "../core/premium";
import type { ContactBoardState, ContactEntry } from "../core/types";
import type { BoardStorage } from "../storage/boardStorage";

export type MessageResolver = (key: string, fallback: string, substitutions?: string | string[]) => string;

export type ContactBoardApp = {
  bootstrap(): Promise<void>;
};

export type ContactBoardAppOptions = {
  root: HTMLElement;
  storage: BoardStorage;
  message: MessageResolver;
};

type StatusTone = "success" | "error";

type StatusMessage = {
  text: string;
  tone: StatusTone;
};

type FocusTarget = "name" | "status";

export function createContactBoardApp({ root, storage, message }: ContactBoardAppOptions): ContactBoardApp {
  let boardState: ContactBoardState | null = null;
  let editingContactId: string | null = null;
  let statusMessage: StatusMessage | null = null;
  let nameFieldHasError = false;
  let pendingFocusTarget: FocusTarget | null = null;

  async function bootstrap(): Promise<void> {
    root.replaceChildren(
      createStateShell(
        "loading-card",
        message("loadingTitle", "Loading board"),
        message("loadingBody", "Checking saved names on this device."),
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
          message("loadErrorBody", "Please close and reopen this popup."),
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
    appShell.append(createHeader());

    if (statusMessage) {
      appShell.append(createStatusMessage(statusMessage));
    }

    appShell.append(createContactList(boardState.contacts), createEditor(boardState), createPremiumPanel(boardState));
    root.replaceChildren(appShell);
    restoreFocus();
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
    const heading = createElement("div", "section-heading");
    const title = createElement("h2", "", message("contactsTitle", "Family contacts"));
    title.id = "contacts-title";
    heading.append(
      title,
      createElement(
        "p",
        "section-meta",
        message("contactCount", "$1 / $2 displayed", [String(contacts.length), String(MAX_CONTACTS)])
      )
    );
    section.append(heading);

    if (contacts.length === 0) {
      const empty = createElement("div", "empty-card state-card");
      empty.append(
        createElement("p", "empty-title", message("emptyTitle", "No names yet")),
        createElement("p", "", message("emptyBody", "Add a name and short note to show it here."))
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
      const editButton = createButton(message("editButton", "Edit"), "secondary-button");
      editButton.setAttribute("aria-label", message("editContactButtonLabel", `Edit ${contact.name}`, contact.name));
      editButton.setAttribute("aria-controls", "contact-editor");
      editButton.addEventListener("click", () => {
        editingContactId = contact.id;
        statusMessage = null;
        nameFieldHasError = false;
        pendingFocusTarget = "name";
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

  function createEditor(state: ContactBoardState): HTMLElement {
    const editingContact = state.contacts.find((contact) => contact.id === editingContactId) ?? null;
    const section = createElement("section", "editor-section");
    section.id = "contact-editor";
    section.setAttribute("aria-labelledby", "editor-title");
    const title = createElement(
      "h2",
      "",
      editingContact
        ? message("editContactTitle", "Edit displayed name")
        : message("addContactTitle", "Add displayed name")
    );
    title.id = "editor-title";
    section.append(
      title,
      createElement(
        "p",
        "section-intro",
        editingContact
          ? message("editContactHint", "Update the display text shown on the board.")
          : message("addContactHint", "Add one name and a short note for the board display.")
      )
    );

    const form = document.createElement("form");
    form.className = "contact-form";
    form.noValidate = true;
    form.append(
      createLabelInput("name", message("nameLabel", "Name"), editingContact?.name ?? "", MAX_NAME_LENGTH, {
        invalid: nameFieldHasError,
        required: true
      }),
      createLabelInput("note", message("noteLabel", "Short note"), editingContact?.note ?? "", MAX_NOTE_LENGTH)
    );

    const buttonRow = createElement("div", "form-actions");
    buttonRow.append(createButton(message("saveButton", "Save"), "primary-button", "submit"));

    if (editingContact) {
      const cancelButton = createButton(message("cancelButton", "Cancel"), "secondary-button", "button");
      cancelButton.addEventListener("click", () => {
        editingContactId = null;
        statusMessage = null;
        nameFieldHasError = false;
        pendingFocusTarget = "name";
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
        nameFieldHasError = true;
        statusMessage = { text: message("nameRequired", "Please enter a name."), tone: "error" };
        pendingFocusTarget = "name";
        render();
        return;
      }

      boardState = upsertContact(state, { id: editingContact?.id, name, note });
      editingContactId = null;
      nameFieldHasError = false;
      statusMessage = { text: message("savedStatus", "Saved locally."), tone: "success" };
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
    section.append(
      hiddenPlaceholder,
      createElement("p", "premium-date", message("trialEndsAt", "Trial ends: $1", formatDate(status.trialEndsAt)))
    );

    return section;
  }

  function createLabelInput(
    name: string,
    labelText: string,
    value: string,
    maxLength: number,
    options: { invalid?: boolean; required?: boolean } = {}
  ): HTMLElement {
    const wrapper = createElement("label", "field");
    const span = createElement("span", "", labelText);
    const input = document.createElement("input");
    input.name = name;
    input.value = value;
    input.maxLength = maxLength;
    input.autocomplete = "off";
    input.inputMode = "text";
    input.required = options.required === true;
    input.setAttribute("aria-describedby", options.invalid ? `${name}-help app-status-message` : `${name}-help`);
    if (options.required) {
      input.setAttribute("aria-required", "true");
    }
    if (options.invalid) {
      input.setAttribute("aria-invalid", "true");
    }

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

  function createStatusMessage(statusMessage: StatusMessage): HTMLParagraphElement {
    const status = createElement("p", `status-message status-message--${statusMessage.tone}`, statusMessage.text);
    status.id = "app-status-message";
    status.tabIndex = -1;
    status.setAttribute("role", statusMessage.tone === "error" ? "alert" : "status");
    status.setAttribute("aria-live", statusMessage.tone === "error" ? "assertive" : "polite");
    return status;
  }

  function createStateShell(className: string, title: string, body: string, role: "alert" | "status"): HTMLElement {
    const appShell = createElement("main", "app-shell app-shell--state");
    const card = createElement("section", `state-card ${className}`);
    card.setAttribute("role", role);
    card.append(
      createElement("p", "state-kicker", message("singlePurposeLabel", "Memo display only")),
      createElement("h1", "", title),
      createElement("p", "", body)
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
      focusTarget === "name"
        ? root.querySelector<HTMLElement>('input[name="name"]')
        : root.querySelector<HTMLElement>(".status-message");

    target?.focus({ preventScroll: true });
  }

  return {
    bootstrap
  };
}

function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(new Date(timestamp));
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
