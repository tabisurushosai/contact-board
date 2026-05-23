import type { ContactBoardState } from "../core/types";

export interface BoardStorage {
  load(): Promise<ContactBoardState>;
  save(state: ContactBoardState): Promise<void>;
}
