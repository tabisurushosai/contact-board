import { createEmptyBoardState, sanitizeBoardState } from "../core/contactBoard";
import type { ContactBoardState } from "../core/types";
import type { BoardStorage } from "./boardStorage";

const BOARD_STATE_KEY = "contactBoardState";

export function createChromeBoardStorage(now = Date.now): BoardStorage {
  return {
    async load(): Promise<ContactBoardState> {
      const result = await chrome.storage.local.get(BOARD_STATE_KEY);
      const stored = result[BOARD_STATE_KEY];

      if (stored === undefined) {
        const initialState = createEmptyBoardState(now());
        await chrome.storage.local.set({ [BOARD_STATE_KEY]: initialState });
        return initialState;
      }

      return sanitizeBoardState(stored, now());
    },

    async save(state: ContactBoardState): Promise<void> {
      const safeState = sanitizeBoardState(state, now());
      await chrome.storage.local.set({ [BOARD_STATE_KEY]: safeState });
    }
  };
}
