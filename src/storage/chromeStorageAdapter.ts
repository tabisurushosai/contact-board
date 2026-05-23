import { createBoardStorage } from "./boardStorage";
import type { BoardStorage, KeyValueStorageAdapter } from "./boardStorage";

type ChromeStorageArea = Pick<typeof chrome.storage.local, "get" | "set">;

export function createChromeBoardStorage(now = Date.now): BoardStorage {
  return createBoardStorage(createChromeKeyValueStorage(chrome.storage.local), now);
}

export function createChromeKeyValueStorage(area: ChromeStorageArea): KeyValueStorageAdapter {
  return {
    async get(key: string): Promise<unknown> {
      const result = await area.get(key);
      return result[key];
    },

    async set(key: string, value: unknown): Promise<void> {
      await area.set({ [key]: value });
    }
  };
}
