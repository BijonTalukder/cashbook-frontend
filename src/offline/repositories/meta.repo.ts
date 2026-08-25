/** Small key/value bookkeeping: last-pull markers, last successful sync. */
import { idbGet, idbPut } from "../idb";
import { STORES, type MetaRow } from "../schema";

export const metaRepo = {
  get: async <T>(key: string): Promise<T | undefined> =>
    (await idbGet<MetaRow>(STORES.appMeta, key))?.value as T | undefined,

  set: (key: string, value: unknown) => idbPut<MetaRow>(STORES.appMeta, { key, value }),
};

export const LAST_SYNC_AT = "sync.lastSyncAt";
export const lastPullKey = (entity: string, businessId: string) =>
  `pull.${entity}.${businessId}`;
