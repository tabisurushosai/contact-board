import { createBoardStorage } from "./boardStorage";
import type { BoardStorage, StorageAdapter, StorageAdapterValue } from "./types";

type ChromeStorageItems = Record<string, StorageAdapterValue>;

type ChromeStorageArea = {
  get(key: string): Promise<ChromeStorageItems>;
  set(items: ChromeStorageItems): Promise<void>;
};

export function createChromeBoardStorage(now = Date.now): BoardStorage {
  return createBoardStorage(createChromeStorageAdapter(chrome.storage.local), now);
}

export function createChromeStorageAdapter(area: ChromeStorageArea): StorageAdapter {
  return {
    async getItem(key: string): Promise<StorageAdapterValue | undefined> {
      const result = await area.get(key);
      return result[key];
    },

    async setItem(key: string, value: StorageAdapterValue): Promise<void> {
      await area.set({ [key]: value });
    }
  };
}
