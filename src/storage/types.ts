import type { ContactBoardState } from "../core/types";

export interface BoardStorage {
  load(): Promise<ContactBoardState>;
  save(state: ContactBoardState): Promise<void>;
}

export type StorageValue = unknown;

export interface KeyValueStorageAdapter {
  get(key: string): Promise<StorageValue | undefined>;
  set(key: string, value: StorageValue): Promise<void>;
}
