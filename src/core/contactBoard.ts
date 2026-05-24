import type { ContactBoardState, ContactEntry, PremiumState } from "./types";

export const MAX_CONTACTS = 6;
export const MAX_NAME_LENGTH = 40;
export const MAX_NOTE_LENGTH = 80;

export type ContactDraft = {
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

export function createContactId(now = Date.now()): string {
  return `contact-${now}-${Math.random().toString(36).slice(2, 10)}`;
}

export function normalizeContact(draft: ContactDraft, now = Date.now()): ContactEntry {
  return {
    id: draft.id?.trim() || createContactId(now),
    name: trimToMaxLength(draft.name, MAX_NAME_LENGTH),
    note: trimToMaxLength(draft.note, MAX_NOTE_LENGTH),
    updatedAt: now
  };
}

export function sanitizeBoardState(input: unknown, now = Date.now()): ContactBoardState {
  if (!isRecord(input)) {
    return createEmptyBoardState(now);
  }

  const firstStartedAt = toPositiveNumber(input.firstStartedAt) ?? now;
  const premium = sanitizePremiumState(input.premium);
  const contacts = Array.isArray(input.contacts)
    ? input.contacts
        .map((item) => sanitizeContact(item, now))
        .filter((contact): contact is ContactEntry => Boolean(contact))
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

  const name = typeof input.name === "string" ? trimToMaxLength(input.name, MAX_NAME_LENGTH) : "";
  if (!name) {
    return null;
  }

  return {
    id: typeof input.id === "string" && input.id.trim() ? input.id.trim() : createContactId(now),
    name,
    note: typeof input.note === "string" ? trimToMaxLength(input.note, MAX_NOTE_LENGTH) : "",
    updatedAt: toPositiveNumber(input.updatedAt) ?? now
  };
}

function sanitizePremiumState(input: unknown): PremiumState {
  if (!isRecord(input)) {
    return {
      enabled: false
    };
  }

  const activatedAt = toPositiveNumber(input.activatedAt);
  return {
    enabled: input.enabled === true,
    ...(activatedAt === undefined ? {} : { activatedAt })
  };
}

function toPositiveNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : undefined;
}

function trimToMaxLength(value: string, maxLength: number): string {
  return value.trim().slice(0, maxLength);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
