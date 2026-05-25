import type { ContactBoardState, ContactEntry, PremiumState } from "./types";

export const MAX_CONTACTS = 6;
export const MAX_NAME_LENGTH = 40;
export const MAX_NOTE_LENGTH = 80;

type ContactDraft = {
  id?: string;
  name: string;
  note: string;
};

export function createEmptyBoardState(now = Date.now()): ContactBoardState {
  return {
    contacts: [],
    firstStartedAt: now,
    premium: {
      enabled: false
    }
  };
}

function createContactId(now = Date.now()): string {
  return `contact-${now}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeContact(draft: ContactDraft, now = Date.now()): ContactEntry {
  return {
    id: normalizeContactId(draft.id, now),
    name: normalizeStringField(draft.name, MAX_NAME_LENGTH),
    note: normalizeStringField(draft.note, MAX_NOTE_LENGTH),
    updatedAt: now
  };
}

export function sanitizeBoardState(input: unknown, now = Date.now()): ContactBoardState {
  if (!isRecord(input)) {
    return createEmptyBoardState(now);
  }

  const firstStartedAt = toPositiveNumber(input["firstStartedAt"]) ?? now;
  const premium = sanitizePremiumState(input["premium"]);
  const storedContacts = input["contacts"];
  const contacts = Array.isArray(storedContacts)
    ? storedContacts
        .map((item) => sanitizeContact(item, now))
        .filter((contact): contact is ContactEntry => contact !== null)
        .slice(0, MAX_CONTACTS)
    : [];

  return {
    contacts,
    firstStartedAt,
    premium
  };
}

export function upsertContact(
  state: ContactBoardState,
  draft: ContactDraft,
  now = Date.now()
): ContactBoardState {
  const normalized = normalizeContact(draft, now);
  if (!normalized.name) {
    return state;
  }

  const existingIndex = state.contacts.findIndex((contact) => contact.id === normalized.id);
  const contacts =
    existingIndex >= 0
      ? state.contacts.map((contact, index) => (index === existingIndex ? normalized : contact))
      : [normalized, ...state.contacts].slice(0, MAX_CONTACTS);

  return {
    ...state,
    contacts
  };
}

export function removeContact(state: ContactBoardState, id: string): ContactBoardState {
  return {
    ...state,
    contacts: state.contacts.filter((contact) => contact.id !== id)
  };
}

function sanitizeContact(input: unknown, now: number): ContactEntry | null {
  if (!isRecord(input)) {
    return null;
  }

  const name = normalizeStringField(input["name"], MAX_NAME_LENGTH);
  if (!name) {
    return null;
  }

  return {
    id: normalizeContactId(input["id"], now),
    name,
    note: normalizeStringField(input["note"], MAX_NOTE_LENGTH),
    updatedAt: toPositiveNumber(input["updatedAt"]) ?? now
  };
}

function sanitizePremiumState(input: unknown): PremiumState {
  if (!isRecord(input)) {
    return {
      enabled: false
    };
  }

  const activatedAt = toPositiveNumber(input["activatedAt"]);
  return {
    enabled: input["enabled"] === true,
    ...(activatedAt === undefined ? {} : { activatedAt })
  };
}

function toPositiveNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : undefined;
}

function normalizeContactId(value: unknown, now: number): string {
  const trimmedId = typeof value === "string" ? value.trim() : "";
  return trimmedId || createContactId(now);
}

function normalizeStringField(value: unknown, maxLength: number): string {
  return typeof value === "string" ? trimToMaxLength(value, maxLength) : "";
}

function trimToMaxLength(value: string, maxLength: number): string {
  return value.trim().slice(0, maxLength);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
