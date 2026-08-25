/**
 * The sale in progress, persisted per business.
 *
 * Purely local — a half-entered cart is not a business record and is never
 * queued for the backend. It exists so a tab crash, a reload or a dead battery
 * mid-transaction does not cost the shopkeeper the basket they just keyed in.
 */
import { idbGet, idbPut, idbDelete } from "../idb";
import { STORES } from "../schema";

export interface CartLine {
  productId: string;
  quantity: string;
  unitPrice: string;
}

export interface CartDraft {
  businessId: string;
  customerId: string;
  rows: CartLine[];
  discount: string;
  tax: string;
  paidAmount: string;
  paidTouched: boolean;
  paymentMethod: string;
  note: string;
  updatedAt: string;
}

export const cartRepo = {
  get: (businessId: string) => idbGet<CartDraft>(STORES.carts, businessId),

  save: (draft: Omit<CartDraft, "updatedAt">) =>
    idbPut<CartDraft>(STORES.carts, { ...draft, updatedAt: new Date().toISOString() }),

  clear: (businessId: string) => idbDelete(STORES.carts, businessId),
};
