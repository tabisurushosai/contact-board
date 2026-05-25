import { createBoardStorage } from "./boardStorage";
import type { BoardStorage, StorageAdapter, StorageAdapterValue } from "./types";

type ChromeStorageArea = Pick<chrome.storage.StorageArea, "get" | "set">;
type ChromeStorageItems = Record<string, StorageAdapterValue>;

export function createChromeBoardStorage(now = Date.now): BoardStorage {
  return createBoardStorage(createChromeStorageAdapter(chrome.storage.local), now);
}

export function createChromeStorageAdapter(area: ChromeStorageArea): StorageAdapter {
  return {
    async getItem(key: string): Promise<StorageAdapterValue | undefined> {
      const result = await area.get<ChromeStorageItems>(key);
      return result[key];
    },

    async setItem(key: string, value: StorageAdapterValue): Promise<void> {
      await area.set<ChromeStorageItems>({ [key]: value });
    }
  };
}
