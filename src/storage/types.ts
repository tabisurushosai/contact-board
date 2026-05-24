import type { ContactBoardState } from "../core/types";

export interface BoardStorage {
  load(): Promise<ContactBoardState>;
  save(state: ContactBoardState): Promise<void>;
}

export interface KeyValueStorage {
  getItem(key: string): Promise<unknown>;
  setItem(key: string, value: unknown): Promise<void>;
}
