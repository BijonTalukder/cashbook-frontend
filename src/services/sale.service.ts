import api from "./api";
import type { SyncStatus } from "../offline/schema";
import { customerRepo, productRepo, saleRepo } from "../offline/repositories";
import { applyLocalDelta, withMeta, type Cached } from "../offline/repositories/base";
import { enqueueAndFlush } from "../offline/localWrite";
import { newObjectId } from "../offline/ids";

export interface ISaleItem {
  product: { _id: string; name: string; unit: string } | string;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export type SaleStatus = "paid" | "partial" | "due";

export interface ISale {
  _id: string;
  business: string;
  invoiceNumber: string;
  customer?: { _id: string; name: string; phone?: string } | null;
  items: ISaleItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paidAmount: number;
  dueAmount: number;
  paymentMethod: string;
  status: SaleStatus;
  date: string;
  note?: string;
  createdAt: string;
  /** Present on rows read from the offline cache — absent on plain API reads. */
  syncStatus?: SyncStatus;
}

export interface ISalePayload {
  businessId: string;
  customerId?: string;
  items: { product: string; quantity: number; unitPrice?: number }[];
  discount?: number;
  tax?: number;
  paidAmount?: number;
  paymentMethod?: string;
  note?: string;
  date?: string;
}

export interface ISalesResult {
  sales: ISale[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

/** Cached sales carry the customer id flat so the store can index on it. */
type CachedSale = Cached<ISale & { customerId?: string | null }>;

/**
 * Placeholder shown until the backend assigns the real invoice number.
 * The counter is server state (`business.invoiceSettings.nextNumber`) and cannot
 * be predicted offline without two devices eventually colliding on it.
 */
const localInvoiceNumber = (saleId: string) => `LOCAL-${saleId.slice(-6).toUpperCase()}`;

export const isLocalInvoice = (invoiceNumber: string) => invoiceNumber.startsWith("LOCAL-");

const byDateDesc = (a: ISale, b: ISale) =>
  new Date(b.date).getTime() - new Date(a.date).getTime();

const refresh = async (
  businessId: string,
  params?: Record<string, string>,
): Promise<ISale[] | null> => {
  try {
    const { data } = await api.get(`/sales/business/${businessId}`, { params });
    const rows = (data.data.sales as ISale[]).map((sale) => ({
      ...sale,
      customerId: sale.customer?._id ?? null,
    }));
    // Never pruned: the endpoint is paginated, and sale history is exactly what
    // has to stay readable offline.
    await saleRepo.mergeFromServer(businessId, rows as CachedSale[], false);
    return rows;
  } catch {
    return null;
  }
};

export const saleService = {
  getAll: async (
    businessId: string,
    params?: Record<string, string>,
  ): Promise<ISalesResult> => {
    const limit = Number(params?.limit) || 20;
    const page = Number(params?.page) || 1;

    const cached = (await saleRepo.list(businessId)) as CachedSale[];
    if (cached.length === 0) {
      const fresh = await refresh(businessId, params);
      if (fresh) return paginate(fresh, page, limit);
    } else {
      void refresh(businessId, params);
    }

    let rows: ISale[] = [...cached].sort(byDateDesc);
    if (params?.customerId) {
      rows = rows.filter((s) => (s as CachedSale).customerId === params.customerId);
    }
    if (params?.status) rows = rows.filter((s) => s.status === params.status);
    return paginate(rows, page, limit);
  },

  getOne: async (id: string): Promise<ISale> => {
    const cached = await saleRepo.get(id);
    if (cached) {
      void api
        .get(`/sales/${id}`)
        .then(({ data }) => {
          const sale = data.data as ISale;
          return saleRepo.put(
            withMeta({ ...sale, customerId: sale.customer?._id ?? null }) as CachedSale,
          );
        })
        .catch(() => undefined);
      return cached;
    }
    const { data } = await api.get(`/sales/${id}`);
    const sale = data.data as ISale;
    return saleRepo.put(
      withMeta({ ...sale, customerId: sale.customer?._id ?? null }) as CachedSale,
    );
  },

  /**
   * Records the sale locally first — the one operation that must never fail
   * because the wifi did. Stock and customer balances move optimistically, the
   * operation goes on the queue, and the backend confirms (or, when it is
   * reachable, has already confirmed by the time this resolves).
   */
  create: async (payload: ISalePayload): Promise<ISale> => {
    const saleId = newObjectId();
    const businessId = payload.businessId;

    const products = new Map(
      (await productRepo.list(businessId)).map((p) => [p._id, p]),
    );
    const customer = payload.customerId ? await customerRepo.get(payload.customerId) : null;

    const items: ISaleItem[] = payload.items.map((item) => {
      const product = products.get(item.product);
      const unitPrice = item.unitPrice ?? product?.sellingPrice ?? 0;
      return {
        product: product
          ? { _id: product._id, name: product.name, unit: product.unit }
          : item.product,
        productName: product?.name ?? "",
        quantity: item.quantity,
        unitPrice,
        lineTotal: item.quantity * unitPrice,
      };
    });

    // Same arithmetic the backend applies, so the receipt matches once synced.
    const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
    const discount = Number(payload.discount) || 0;
    const tax = Number(payload.tax) || 0;
    const total = Math.max(0, subtotal - discount + tax);
    const paidAmount = Math.min(Number(payload.paidAmount) || 0, total);
    const dueAmount = total - paidAmount;
    const status: SaleStatus =
      dueAmount === 0 ? "paid" : paidAmount === 0 ? "due" : "partial";
    const date = payload.date ?? new Date().toISOString();

    const local: CachedSale = withMeta(
      {
        _id: saleId,
        business: businessId,
        invoiceNumber: localInvoiceNumber(saleId),
        customer: customer ? { _id: customer._id, name: customer.name, phone: customer.phone } : null,
        customerId: payload.customerId ?? null,
        items,
        subtotal,
        discount,
        tax,
        total,
        paidAmount,
        dueAmount,
        paymentMethod: payload.paymentMethod ?? "cash",
        status,
        date,
        note: payload.note,
        createdAt: new Date().toISOString(),
      },
      "pending",
    );
    await saleRepo.put(local);

    for (const item of payload.items) {
      await productRepo.update(item.product, (record) => ({
        ...applyLocalDelta(record, "stock", -item.quantity),
        syncStatus: "pending",
      }));
    }

    if (payload.customerId) {
      await customerRepo.update(payload.customerId, (record) => {
        let next = applyLocalDelta(record, "totalSales", total);
        next = applyLocalDelta(next, "totalPaid", paidAmount);
        next = applyLocalDelta(next, "totalDue", dueAmount);
        return { ...next, syncStatus: "pending" };
      });
    }

    await enqueueAndFlush({
      businessId,
      entityType: "sale",
      entityId: saleId,
      operationType: "CREATE",
      // The server recomputes every figure from items/discount/tax; the totals
      // ride along so a confirmed sync knows which local deltas to settle.
      payload: {
        businessId,
        customerId: payload.customerId,
        items: payload.items,
        discount,
        tax,
        paidAmount,
        paymentMethod: payload.paymentMethod,
        note: payload.note,
        date,
        total,
        dueAmount,
      },
      // Customer and products must exist on the server before the sale lands.
      dependsOn: [
        ...(payload.customerId ? [payload.customerId] : []),
        ...payload.items.map((item) => item.product),
      ],
    });

    return (await saleRepo.get(saleId)) ?? local;
  },
};

const paginate = (rows: ISale[], page: number, limit: number): ISalesResult => {
  const sorted = [...rows].sort(byDateDesc);
  const start = (page - 1) * limit;
  return {
    sales: sorted.slice(start, start + limit),
    pagination: {
      page,
      limit,
      total: sorted.length,
      totalPages: Math.max(1, Math.ceil(sorted.length / limit)),
    },
  };
};
