import { createEmptyBoardState, sanitizeBoardState } from "../core/contactBoard";
import type { ContactBoardState } from "../core/types";

export const BOARD_STATE_KEY = "contactBoardState";

export interface BoardStorage {
  load(): Promise<ContactBoardState>;
  save(state: ContactBoardState): Promise<void>;
}

export interface KeyValueStorageAdapter {
  get(key: string): Promise<unknown>;
  set(key: string, value: unknown): Promise<void>;
}

export function createBoardStorage(adapter: KeyValueStorageAdapter, now = Date.now): BoardStorage {
  return {
    async load(): Promise<ContactBoardState> {
      const stored = await adapter.get(BOARD_STATE_KEY);

      if (stored === undefined) {
        const initialState = createEmptyBoardState(now());
        await adapter.set(BOARD_STATE_KEY, initialState);
        return initialState;
      }

      return sanitizeBoardState(stored, now());
    },

    async save(state: ContactBoardState): Promise<void> {
      const safeState = sanitizeBoardState(state, now());
      await adapter.set(BOARD_STATE_KEY, safeState);
    }
  };
}
