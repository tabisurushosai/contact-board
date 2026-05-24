import { createEmptyBoardState, sanitizeBoardState } from "../core/contactBoard";
import type { ContactBoardState } from "../core/types";
import type { BoardStorage, StorageAdapter } from "./types";

export const BOARD_STATE_KEY = "contactBoardState";

export function createBoardStorage(adapter: StorageAdapter, now = Date.now): BoardStorage {
  return {
    async load(): Promise<ContactBoardState> {
      const stored = await adapter.read(BOARD_STATE_KEY);

      if (stored === undefined) {
        const initialState = createEmptyBoardState(now());
        await adapter.write(BOARD_STATE_KEY, initialState);
        return initialState;
      }

      return sanitizeBoardState(stored, now());
    },

    async save(state: ContactBoardState): Promise<void> {
      const safeState = sanitizeBoardState(state, now());
      await adapter.write(BOARD_STATE_KEY, safeState);
    }
  };
}
