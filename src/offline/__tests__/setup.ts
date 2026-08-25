/**
 * `fake-indexeddb` gives the offline layer a real IndexedDB implementation in
 * Node — the durability guarantees under test (transactions committing, a queue
 * surviving a "reload") only mean something against an actual store.
 */
import "fake-indexeddb/auto";
import { vi } from "vitest";

// The tests exercise storage and sync logic, not React — a localStorage stub is
// all that the auth check and zustand's persist middleware need.
const store = new Map<string, string>();
vi.stubGlobal("localStorage", {
  getItem: (key: string) => store.get(key) ?? null,
  setItem: (key: string, value: string) => void store.set(key, value),
  removeItem: (key: string) => void store.delete(key),
  clear: () => store.clear(),
  key: (index: number) => [...store.keys()][index] ?? null,
  get length() {
    return store.size;
  },
});
