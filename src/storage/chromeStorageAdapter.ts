import { createBoardStorage } from "./boardStorage";
import type { BoardStorage, KeyValueStorageAdapter, StorageValue } from "./types";

type ChromeStorageItems = Record<string, StorageValue>;

type ChromeStorageArea = {
  get(key: string): Promise<ChromeStorageItems>;
  set(items: ChromeStorageItems): Promise<void>;
};

export function createChromeBoardStorage(now = Date.now): BoardStorage {
  return createBoardStorage(createChromeStorageAdapter(chrome.storage.local), now);
}

export function createChromeStorageAdapter(area: ChromeStorageArea): KeyValueStorageAdapter {
  return {
    async get(key: string): Promise<StorageValue | undefined> {
      const result = await area.get(key);
      return result[key];
    },

    async set(key: string, value: StorageValue): Promise<void> {
      await area.set({ [key]: value });
    }
  };
}
