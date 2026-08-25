/**
 * Cached stores for the POS path. Each mirrors the shape its service already
 * returns, so pages keep consuming the same types whether the rows came from
 * the network or from IndexedDB.
 */
import { createRepo } from "./base";
import { STORES } from "../schema";
import type { IProduct } from "../../services/product.service";
import type { ICustomer } from "../../services/customer.service";
import type { ISale } from "../../services/sale.service";
import type { IPayment } from "../../services/payment.service";

/** `stock` moves locally on every offline sale and adjustment. */
export const productRepo = createRepo<IProduct>(STORES.products, {
  deltaFields: ["stock"],
});

/** Balances move locally on every offline sale and received payment. */
export const customerRepo = createRepo<ICustomer>(STORES.customers, {
  deltaFields: ["totalSales", "totalPaid", "totalDue"],
});

/** A recorded sale is immutable — nothing about it is ever adjusted locally. */
export const saleRepo = createRepo<ISale & { customerId?: string | null }>(STORES.sales);

export const paymentRepo = createRepo<IPayment>(STORES.payments);

export { applyLocalDelta, settleLocalDelta, withMeta } from "./base";
export type { Cached } from "./base";
