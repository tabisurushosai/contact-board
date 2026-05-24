import { createBoardStorage } from "./boardStorage";
import type { BoardStorage, StorageAdapter } from "./types";

type ChromeStorageArea = Pick<typeof chrome.storage.local, "get" | "set">;

export function createChromeBoardStorage(now = Date.now): BoardStorage {
  return createBoardStorage(createChromeStorageAdapter(chrome.storage.local), now);
}

export function createChromeStorageAdapter(area: ChromeStorageArea): StorageAdapter {
  return {
    async read(key: string): Promise<unknown | undefined> {
      const result = await area.get(key);
      return result[key];
    },

    async write(key: string, value: unknown): Promise<void> {
      await area.set({ [key]: value });
    }
  };
}
