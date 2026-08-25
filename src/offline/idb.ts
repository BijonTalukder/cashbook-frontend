/**
 * Minimal promise wrapper over the raw IndexedDB API.
 *
 * No wrapper library is pulled in: the surface actually needed here is a dozen
 * calls, and adding a dependency for it would be the only new runtime package
 * in the app. Everything guards on `indexedDB` being present so the module is
 * safe to import in a non-browser (SSR / prerender / test) context.
 */
import { DB_NAME, DB_VERSION, STORE_SPECS, type StoreName } from "./schema";

export const isIdbAvailable = (): boolean =>
  typeof indexedDB !== "undefined" && indexedDB !== null;

let dbPromise: Promise<IDBDatabase> | null = null;

const request = <T>(req: IDBRequest<T>): Promise<T> =>
  new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

export const openDb = (): Promise<IDBDatabase> => {
  if (!isIdbAvailable()) {
    return Promise.reject(new Error("IndexedDB is unavailable"));
  }
  if (dbPromise) return dbPromise;

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = () => {
      const db = req.result;
      // Additive migrations only — every future version re-runs this loop and
      // creates whatever is missing, so an upgrade never drops cached writes.
      (Object.keys(STORE_SPECS) as StoreName[]).forEach((name) => {
        const spec = STORE_SPECS[name];
        const store = db.objectStoreNames.contains(name)
          ? req.transaction!.objectStore(name)
          : db.createObjectStore(name, { keyPath: spec.keyPath });
        spec.indexes.forEach((index) => {
          if (!store.indexNames.contains(index.name)) {
            store.createIndex(index.name, index.keyPath);
          }
        });
      });
    };

    req.onsuccess = () => {
      const db = req.result;
      // Another tab upgraded the schema — drop the handle so the next call reopens.
      db.onversionchange = () => {
        db.close();
        dbPromise = null;
      };
      resolve(db);
    };
    req.onerror = () => reject(req.error);
    req.onblocked = () =>
      reject(new Error("IndexedDB upgrade blocked by another tab"));
  });

  dbPromise.catch(() => {
    dbPromise = null;
  });
  return dbPromise;
};

/**
 * Run `fn` inside a single IndexedDB transaction and resolve once it commits.
 * Resolving on `oncomplete` (not on the last request) is what makes a queued
 * write durable before the caller reports success to the user.
 */
export const tx = async <T>(
  stores: StoreName[],
  mode: IDBTransactionMode,
  fn: (get: (name: StoreName) => IDBObjectStore) => Promise<T> | T,
): Promise<T> => {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const transaction = db.transaction(stores, mode);
    let result: T;
    let settled = false;

    transaction.oncomplete = () => resolve(result);
    transaction.onerror = () => {
      if (!settled) reject(transaction.error);
    };
    transaction.onabort = () => {
      if (!settled) reject(transaction.error ?? new Error("Transaction aborted"));
    };

    Promise.resolve(fn((name) => transaction.objectStore(name)))
      .then((value) => {
        result = value;
      })
      .catch((err) => {
        settled = true;
        try {
          transaction.abort();
        } catch {
          /* already finished */
        }
        reject(err);
      });
  });
};

export const idbGet = async <T>(store: StoreName, key: IDBValidKey): Promise<T | undefined> =>
  tx([store], "readonly", (s) => request<T | undefined>(s(store).get(key)));

export const idbGetAll = async <T>(
  store: StoreName,
  index?: string,
  query?: IDBValidKey | IDBKeyRange,
): Promise<T[]> =>
  tx([store], "readonly", (s) => {
    const target = index ? s(store).index(index) : s(store);
    return request<T[]>(target.getAll(query));
  });

export const idbPut = async <T>(store: StoreName, value: T): Promise<void> => {
  await tx([store], "readwrite", (s) => request(s(store).put(value)));
};

export const idbPutMany = async <T>(store: StoreName, values: T[]): Promise<void> => {
  if (values.length === 0) return;
  await tx([store], "readwrite", (s) => {
    const target = s(store);
    return Promise.all(values.map((value) => request(target.put(value))));
  });
};

export const idbDelete = async (store: StoreName, key: IDBValidKey): Promise<void> => {
  await tx([store], "readwrite", (s) => request(s(store).delete(key)));
};

export const idbClear = async (store: StoreName): Promise<void> => {
  await tx([store], "readwrite", (s) => request(s(store).clear()));
};

/** Wipe every cached record — used on logout so one device never leaks another user's data. */
export const idbClearAll = async (): Promise<void> => {
  if (!isIdbAvailable()) return;
  const stores = Object.keys(STORE_SPECS) as StoreName[];
  await tx(stores, "readwrite", (s) =>
    Promise.all(stores.map((name) => request(s(name).clear()))),
  );
};

export { request as idbRequest };
