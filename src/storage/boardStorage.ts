import { createEmptyBoardState, sanitizeBoardState } from "../core/contactBoard";
import type { ContactBoardState } from "../core/types";
import type { BoardStorage, KeyValueStorage } from "./types";

export const BOARD_STATE_KEY = "contactBoardState";

export function createBoardStorage(adapter: KeyValueStorage, now = Date.now): BoardStorage {
  return {
    async load(): Promise<ContactBoardState> {
      const stored = await adapter.getItem(BOARD_STATE_KEY);

      if (stored === undefined) {
        const initialState = createEmptyBoardState(now());
        await adapter.setItem(BOARD_STATE_KEY, initialState);
        return initialState;
      }

      return sanitizeBoardState(stored, now());
    },

    async save(state: ContactBoardState): Promise<void> {
      const safeState = sanitizeBoardState(state, now());
      await adapter.setItem(BOARD_STATE_KEY, safeState);
    }
  };
}
