import type { ContactBoardState } from "../core/types";

/**
 * Domain-facing persistence boundary used by app/UI code.
 * Platform adapters stay behind this interface.
 */
export interface BoardStorage {
  load(): Promise<ContactBoardState>;
  save(state: ContactBoardState): Promise<void>;
}

export type StorageAdapterValue = unknown;

/**
 * Minimal key-value adapter implemented by each platform shell.
 * Missing keys must resolve to undefined so createBoardStorage can initialize
 * the same default ContactBoardState everywhere.
 */
export interface StorageAdapter {
  getItem(key: string): Promise<StorageAdapterValue | undefined>;
  setItem(key: string, value: StorageAdapterValue): Promise<void>;
}
