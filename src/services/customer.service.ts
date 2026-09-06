import api from "./api";
import type { SyncStatus } from "../offline/schema";
import type { ITransaction } from "./transaction.service";
import { customerRepo } from "../offline/repositories";
import { withMeta } from "../offline/repositories/base";
import { enqueueAndFlush } from "../offline/localWrite";
import { newObjectId } from "../offline/ids";

export interface ICustomer {
  _id: string;
  business: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  openingBalance: number;
  notes?: string;
  totalSales: number;
  totalPaid: number;
  totalDue: number;
  status: boolean;
  createdAt: string;
  /** Present on rows read from the offline cache — absent on plain API reads. */
  syncStatus?: SyncStatus;
}

export interface ICustomerPayload {
  businessId: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  openingBalance?: number;
  notes?: string;
}

/** Searched locally so the counter can look a customer up with no network. */
const applyFilters = (customers: ICustomer[], search?: string): ICustomer[] => {
  let rows = customers.filter((c) => c.status !== false);
  if (search) {
    const needle = search.toLowerCase();
    rows = rows.filter(
      (c) =>
        c.name.toLowerCase().includes(needle) || (c.phone ?? "").toLowerCase().includes(needle),
    );
  }
  return rows.sort((a, b) => a.name.localeCompare(b.name));
};

const refresh = async (businessId: string): Promise<ICustomer[] | null> => {
  try {
    const { data } = await api.get(`/customers/business/${businessId}`);
    return await customerRepo.mergeFromServer(businessId, data.data as ICustomer[], true);
  } catch {
    return null;
  }
};

export const customerService = {
  getAll: async (businessId: string, search?: string): Promise<ICustomer[]> => {
    const cached = await customerRepo.list(businessId);
    if (cached.length === 0) {
      const fresh = await refresh(businessId);
      return applyFilters(fresh ?? cached, search);
    }
    void refresh(businessId);
    return applyFilters(cached, search);
  },

  /**
   * The customer is served from cache offline; the ledger alongside it is not
   * mirrored locally, so it comes back empty until the network returns.
   */
  getOne: async (
    id: string,
  ): Promise<{ customer: ICustomer; transactions: ITransaction[] }> => {
    try {
      const { data } = await api.get(`/customers/${id}`);
      const result = data.data as { customer: ICustomer; transactions: ITransaction[] };
      const local = await customerRepo.get(id);
      if (!local || local.syncStatus === "synced") {
        await customerRepo.put(withMeta(result.customer));
      }
      return result;
    } catch (error) {
      const cached = await customerRepo.get(id);
      if (!cached) throw error;
      return { customer: cached, transactions: [] };
    }
  },

  create: async (payload: ICustomerPayload): Promise<ICustomer> => {
    const _id = newObjectId();
    const openingBalance = Number(payload.openingBalance) || 0;
    const local = withMeta<ICustomer>(
      {
        _id,
        business: payload.businessId,
        name: payload.name,
        phone: payload.phone,
        email: payload.email,
        address: payload.address,
        openingBalance,
        notes: payload.notes,
        totalSales: 0,
        totalPaid: 0,
        // Mirrors the server: the opening balance starts life as the due.
        totalDue: openingBalance,
        status: true,
        createdAt: new Date().toISOString(),
      },
      "pending",
    );
    await customerRepo.put(local);

    await enqueueAndFlush({
      businessId: payload.businessId,
      entityType: "customer",
      entityId: _id,
      operationType: "CREATE",
      payload: { ...payload },
    });

    return (await customerRepo.get(_id)) ?? local;
  },

  update: async (id: string, payload: Partial<ICustomerPayload>): Promise<ICustomer> => {
    const current = await customerRepo.get(id);
    if (!current) {
      const { data } = await api.patch(`/customers/${id}`, payload);
      return customerRepo.put(withMeta(data.data as ICustomer));
    }

    const openingBalance = payload.openingBalance;
    const updated = await customerRepo.update(id, (record) => {
      const next = { ...record, ...payload, syncStatus: "pending" as const };
      // Mirrors the server: totalDue = openingBalance + totalSales - totalPaid.
      if (openingBalance !== undefined) {
        const parsed = Number(openingBalance) || 0;
        next.totalDue = record.totalDue + parsed - (record.openingBalance ?? 0);
      }
      return next;
    });

    await enqueueAndFlush({
      businessId: current.business,
      entityType: "customer",
      entityId: id,
      operationType: "UPDATE",
      payload: { ...payload },
    });

    return (await customerRepo.get(id)) ?? updated ?? current;
  },

  remove: async (id: string): Promise<void> => {
    const current = await customerRepo.get(id);
    if (!current) {
      await api.delete(`/customers/${id}`);
      return;
    }
    await customerRepo.remove(id);
    await enqueueAndFlush({
      businessId: current.business,
      entityType: "customer",
      entityId: id,
      operationType: "DELETE",
      payload: {},
    });
  },
};
