import api from "./api";
import { customerRepo, paymentRepo } from "../offline/repositories";
import { applyLocalDelta, withMeta } from "../offline/repositories/base";
import { enqueueAndFlush } from "../offline/localWrite";
import { newObjectId } from "../offline/ids";
import { isApiReachable } from "../offline/network";

export interface IPayment {
  _id: string;
  business: string;
  direction: "in" | "out";
  partyType: "customer" | "supplier";
  party: { _id: string; name: string; phone?: string };
  amount: number;
  method: string;
  note?: string;
  date: string;
  createdAt: string;
}

export const paymentService = {
  /**
   * Collecting against a customer due works offline: the receipt is stored
   * locally, the customer's balance moves optimistically, and the queue pushes
   * it once the API is back. Ordering matters here — the operation depends on
   * the customer (and, through the queue's FIFO order, on the sales that
   * created the due) so the server's "cannot exceed outstanding due" check sees
   * a consistent picture.
   */
  receive: async (payload: {
    businessId: string; customerId: string; amount: number; method?: string; note?: string; date?: string;
  }): Promise<IPayment> => {
    const _id = newObjectId();
    const customer = await customerRepo.get(payload.customerId);
    const date = payload.date ?? new Date().toISOString();

    const local = withMeta<IPayment>(
      {
        _id,
        business: payload.businessId,
        direction: "in",
        partyType: "customer",
        party: {
          _id: payload.customerId,
          name: customer?.name ?? "",
          phone: customer?.phone,
        },
        amount: payload.amount,
        method: payload.method ?? "cash",
        note: payload.note,
        date,
        createdAt: new Date().toISOString(),
      },
      "pending",
    );
    await paymentRepo.put(local);

    if (customer) {
      await customerRepo.update(payload.customerId, (record) => {
        let next = applyLocalDelta(record, "totalPaid", payload.amount);
        next = applyLocalDelta(next, "totalDue", -payload.amount);
        return { ...next, syncStatus: "pending" };
      });
    }

    await enqueueAndFlush({
      businessId: payload.businessId,
      entityType: "payment",
      entityId: _id,
      operationType: "CREATE",
      payload: { ...payload, date, direction: "in" },
      dependsOn: [payload.customerId],
    });

    return (await paymentRepo.get(_id)) ?? local;
  },

  /**
   * Supplier payments stay online-only: suppliers and purchases are back-office
   * flows that are not mirrored locally, so an offline payable figure would be
   * a guess. Failing loudly beats queueing a payment against a stale balance.
   */
  pay: async (payload: {
    businessId: string; supplierId: string; amount: number; method?: string; note?: string; date?: string;
  }): Promise<IPayment> => {
    if (!(await isApiReachable())) {
      throw new Error("OFFLINE_UNSUPPORTED");
    }
    const { data } = await api.post("/payments/pay", payload);
    return data.data;
  },

  getAll: async (businessId: string, params?: Record<string, string>): Promise<{
    payments: IPayment[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> => {
    try {
      const { data } = await api.get(`/payments/business/${businessId}`, { params });
      await paymentRepo.mergeFromServer(businessId, data.data.payments as IPayment[], false);
      return data.data;
    } catch (error) {
      const cached = await paymentRepo.list(businessId);
      if (cached.length === 0) throw error;
      const limit = Number(params?.limit) || 20;
      const sorted = cached.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );
      return {
        payments: sorted.slice(0, limit),
        pagination: { page: 1, limit, total: sorted.length, totalPages: 1 },
      };
    }
  },
};
