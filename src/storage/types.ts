import type { ContactBoardState } from "../core/types";

export interface BoardStorage {
  load(): Promise<ContactBoardState>;
  save(state: ContactBoardState): Promise<void>;
}

export interface StorageAdapter {
  read(key: string): Promise<unknown | undefined>;
  write(key: string, value: unknown): Promise<void>;
}
