import api from "./api";
import type { SyncStatus } from "../offline/schema";
import { productRepo } from "../offline/repositories";
import { applyLocalDelta, withMeta } from "../offline/repositories/base";
import { enqueueAndFlush } from "../offline/localWrite";
import { newObjectId } from "../offline/ids";

export interface IProduct {
  _id: string;
  business: string;
  name: string;
  sku?: string;
  category?: string;
  purchasePrice: number;
  sellingPrice: number;
  stock: number;
  minStock: number;
  unit: string;
  imageUrl?: string;
  status: boolean;
  createdAt: string;
  /** Present on rows read from the offline cache — absent on plain API reads. */
  syncStatus?: SyncStatus;
}

export interface IProductPayload {
  businessId: string;
  name: string;
  sku?: string;
  category?: string;
  purchasePrice?: number;
  sellingPrice?: number;
  stock?: number;
  minStock?: number;
  unit?: string;
  imageUrl?: string;
}

interface ListOptions {
  search?: string;
  lowStock?: boolean;
}

/**
 * Filtering happens locally rather than server-side so product search keeps
 * working with no network. The full business catalogue is small enough to hold.
 */
const applyFilters = (products: IProduct[], opts?: ListOptions): IProduct[] => {
  let rows = products.filter((p) => p.status !== false);
  if (opts?.search) {
    const needle = opts.search.toLowerCase();
    rows = rows.filter((p) =>
      [p.name, p.sku, p.category].some((v) => v?.toLowerCase().includes(needle)),
    );
  }
  if (opts?.lowStock) rows = rows.filter((p) => p.stock <= p.minStock);
  return rows.sort((a, b) => a.name.localeCompare(b.name));
};

/** Pull the catalogue and rebase the cache onto it, keeping unsynced stock movement. */
const refresh = async (businessId: string): Promise<IProduct[] | null> => {
  try {
    const { data } = await api.get(`/products/business/${businessId}`);
    // Unfiltered listing, so rows the server no longer returns are genuinely gone.
    return await productRepo.mergeFromServer(businessId, data.data as IProduct[], true);
  } catch {
    return null;
  }
};

export const productService = {
  /**
   * Local rows first so the counter never waits on the network; the server pull
   * happens behind it and bumps `dataVersion`, which re-runs the page's loader.
   */
  getAll: async (businessId: string, opts?: ListOptions): Promise<IProduct[]> => {
    const cached = await productRepo.list(businessId);
    if (cached.length === 0) {
      const fresh = await refresh(businessId);
      return applyFilters(fresh ?? cached, opts);
    }
    void refresh(businessId);
    return applyFilters(cached, opts);
  },

  getOne: async (id: string): Promise<IProduct> => {
    const cached = await productRepo.get(id);
    if (cached) {
      void api
        .get(`/products/${id}`)
        .then(({ data }) => productRepo.put(withMeta(data.data as IProduct)))
        .catch(() => undefined);
      return cached;
    }
    const { data } = await api.get(`/products/${id}`);
    return productRepo.put(withMeta(data.data as IProduct));
  },

  create: async (payload: IProductPayload): Promise<IProduct> => {
    const _id = newObjectId();
    const stock = Number(payload.stock) || 0;
    const local = withMeta<IProduct>(
      {
        _id,
        business: payload.businessId,
        name: payload.name,
        sku: payload.sku,
        category: payload.category,
        purchasePrice: Number(payload.purchasePrice) || 0,
        sellingPrice: Number(payload.sellingPrice) || 0,
        stock,
        minStock: Number(payload.minStock) || 0,
        unit: payload.unit || "pcs",
        imageUrl: payload.imageUrl,
        status: true,
        createdAt: new Date().toISOString(),
      },
      "pending",
    );
    await productRepo.put(local);

    await enqueueAndFlush({
      businessId: payload.businessId,
      entityType: "product",
      entityId: _id,
      operationType: "CREATE",
      payload: { ...payload },
    });

    return (await productRepo.get(_id)) ?? local;
  },

  update: async (id: string, payload: Partial<IProductPayload>): Promise<IProduct> => {
    const current = await productRepo.get(id);
    if (!current) {
      const { data } = await api.patch(`/products/${id}`, payload);
      return productRepo.put(withMeta(data.data as IProduct));
    }

    const updated = await productRepo.update(id, (record) => ({
      ...record,
      ...payload,
      purchasePrice: payload.purchasePrice ?? record.purchasePrice,
      sellingPrice: payload.sellingPrice ?? record.sellingPrice,
      minStock: payload.minStock ?? record.minStock,
      syncStatus: "pending",
    }));

    await enqueueAndFlush({
      businessId: current.business,
      entityType: "product",
      entityId: id,
      operationType: "UPDATE",
      payload: { ...payload },
    });

    return (await productRepo.get(id)) ?? updated ?? current;
  },

  /**
   * Stock is applied locally as a delta the moment the adjustment is made, and
   * only moved into the "server knows" column once the backend confirms it —
   * so an offline adjustment shows immediately without being counted twice.
   */
  adjustStock: async (
    id: string,
    type: "increase" | "decrease" | "set",
    quantity: number,
  ): Promise<IProduct> => {
    const current = await productRepo.get(id);
    if (!current) {
      const { data } = await api.post(`/products/${id}/adjust-stock`, { type, quantity });
      return productRepo.put(withMeta(data.data as IProduct));
    }

    const delta =
      type === "increase" ? quantity : type === "decrease" ? -quantity : quantity - current.stock;

    await productRepo.update(id, (record) => ({
      ...applyLocalDelta(record, "stock", delta),
      syncStatus: "pending",
    }));

    await enqueueAndFlush({
      businessId: current.business,
      entityType: "stockAdjustment",
      entityId: id,
      operationType: "CREATE",
      payload: { type, quantity, delta },
      dependsOn: [id],
    });

    return (await productRepo.get(id)) ?? current;
  },

  remove: async (id: string): Promise<void> => {
    const current = await productRepo.get(id);
    if (!current) {
      await api.delete(`/products/${id}`);
      return;
    }
    await productRepo.remove(id);
    await enqueueAndFlush({
      businessId: current.business,
      entityType: "product",
      entityId: id,
      operationType: "DELETE",
      payload: {},
    });
  },
};
