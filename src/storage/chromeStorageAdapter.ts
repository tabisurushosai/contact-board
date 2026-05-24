import { createBoardStorage } from "./boardStorage";
import type { BoardStorage, KeyValueStorage } from "./types";

type ChromeStorageArea = Pick<typeof chrome.storage.local, "get" | "set">;

export function createChromeBoardStorage(now = Date.now): BoardStorage {
  return createBoardStorage(createChromeKeyValueStorage(chrome.storage.local), now);
}

export function createChromeKeyValueStorage(area: ChromeStorageArea): KeyValueStorage {
  return {
    async getItem(key: string): Promise<unknown> {
      const result = await area.get(key);
      return result[key];
    },

    async setItem(key: string, value: unknown): Promise<void> {
      await area.set({ [key]: value });
    }
  };
}
