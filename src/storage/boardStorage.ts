import { createEmptyBoardState, sanitizeBoardState } from "../core/contactBoard";
import type { ContactBoardState } from "../core/types";
import type { BoardStorage, KeyValueStorageAdapter } from "./types";

export const BOARD_STATE_KEY = "contactBoardState";

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
