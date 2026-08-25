/**
 * A stand-in for the backend that reproduces the two behaviours the offline
 * layer depends on: the operation ledger (`operationId` → the record it
 * produced) and stock/balance side effects on a sale.
 *
 * `mode` lets a test choose how the network misbehaves:
 *   "up"    — normal
 *   "down"  — transport failure, nothing reaches the server
 *   "lossy" — the server processes the request and the response is lost,
 *             which is exactly the case duplicate prevention exists for
 */
export type ServerMode = "up" | "down" | "lossy";

export interface FakeServerState {
  mode: ServerMode;
  operations: Map<string, { entityType: string; entityId: string }>;
  sales: Map<string, Record<string, unknown>>;
  customers: Map<string, Record<string, unknown>>;
  products: Map<string, Record<string, unknown>>;
  payments: Map<string, Record<string, unknown>>;
  calls: { method: string; url: string; operationId?: string }[];
  /** Set to make the next sale creation fail validation, e.g. oversold stock. */
  rejectSaleWith: { status: number; message: string } | null;
  nextInvoice: number;
}

export const createServer = (): FakeServerState => ({
  mode: "up",
  operations: new Map(),
  sales: new Map(),
  customers: new Map(),
  products: new Map(),
  payments: new Map(),
  calls: [],
  rejectSaleWith: null,
  nextInvoice: 1,
});

class TransportError extends Error {
  isAxiosError = true;
  response = undefined;
  constructor() {
    super("Network Error");
  }
}

class HttpError extends Error {
  isAxiosError = true;
  response: { status: number; data: { message: string } };
  constructor(status: number, message: string) {
    super(message);
    this.response = { status, data: { message } };
  }
}

const ok = (data: unknown) => ({ data: { success: true, data }, config: { method: "post" } });

export const createApiMock = (server: FakeServerState) => {
  const guard = () => {
    if (server.mode === "down") throw new TransportError();
  };

  /** Replay: the operation already ran, so return what it produced. */
  const replay = (operationId?: string) => {
    if (!operationId) return null;
    const claim = server.operations.get(operationId);
    if (!claim) return null;
    const bucket =
      claim.entityType === "sale"
        ? server.sales
        : claim.entityType === "customer"
          ? server.customers
          : claim.entityType === "payment"
            ? server.payments
            : server.products;
    return bucket.get(claim.entityId) ?? null;
  };

  const finish = (result: unknown) => {
    // Processed, then the response never made it back to the client.
    if (server.mode === "lossy") throw new TransportError();
    return ok(result);
  };

  const post = async (url: string, body: Record<string, unknown> = {}) => {
    guard();
    const operationId = body.operationId as string | undefined;
    server.calls.push({ method: "post", url, operationId });

    const existing = replay(operationId);
    if (existing) return finish(existing);

    if (url === "/customers") {
      const _id = (body.clientId as string) ?? `srv-customer-${server.customers.size}`;
      const opening = Number(body.openingBalance) || 0;
      const record = {
        _id,
        business: body.businessId,
        name: body.name,
        phone: body.phone,
        openingBalance: opening,
        totalSales: 0,
        totalPaid: 0,
        totalDue: opening,
        status: true,
        createdAt: new Date().toISOString(),
      };
      server.customers.set(_id, record);
      if (operationId) server.operations.set(operationId, { entityType: "customer", entityId: _id });
      return finish(record);
    }

    if (url === "/products") {
      const _id = (body.clientId as string) ?? `srv-product-${server.products.size}`;
      const record = {
        _id,
        business: body.businessId,
        name: body.name,
        sellingPrice: Number(body.sellingPrice) || 0,
        purchasePrice: Number(body.purchasePrice) || 0,
        stock: Number(body.stock) || 0,
        minStock: Number(body.minStock) || 0,
        unit: body.unit ?? "pcs",
        status: true,
        createdAt: new Date().toISOString(),
      };
      server.products.set(_id, record);
      if (operationId) server.operations.set(operationId, { entityType: "product", entityId: _id });
      return finish(record);
    }

    if (url === "/sales") {
      if (server.rejectSaleWith) {
        const { status, message } = server.rejectSaleWith;
        throw new HttpError(status, message);
      }
      const _id = (body.clientId as string) ?? `srv-sale-${server.sales.size}`;
      const items = (body.items as { product: string; quantity: number; unitPrice?: number }[]) ?? [];

      let subtotal = 0;
      for (const item of items) {
        const product = server.products.get(item.product);
        if (!product) throw new HttpError(404, "Product not found");
        const stock = Number(product.stock);
        if (stock - item.quantity < 0) {
          throw new HttpError(400, `Insufficient stock for "${product.name}"`);
        }
        product.stock = stock - item.quantity;
        subtotal += item.quantity * (item.unitPrice ?? Number(product.sellingPrice));
      }
      const total = Math.max(0, subtotal - Number(body.discount ?? 0) + Number(body.tax ?? 0));
      const paidAmount = Number(body.paidAmount ?? 0);
      const dueAmount = total - paidAmount;
      const customer = body.customerId ? server.customers.get(body.customerId as string) : null;
      if (customer) {
        customer.totalSales = Number(customer.totalSales) + total;
        customer.totalPaid = Number(customer.totalPaid) + paidAmount;
        customer.totalDue = Number(customer.totalDue) + dueAmount;
      }

      const record = {
        _id,
        business: body.businessId,
        invoiceNumber: `INV-${server.nextInvoice++}`,
        customer: customer ? { _id: customer._id, name: customer.name } : null,
        items,
        subtotal,
        discount: Number(body.discount ?? 0),
        tax: Number(body.tax ?? 0),
        total,
        paidAmount,
        dueAmount,
        paymentMethod: body.paymentMethod ?? "cash",
        status: dueAmount === 0 ? "paid" : paidAmount === 0 ? "due" : "partial",
        date: body.date ?? new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      server.sales.set(_id, record);
      if (operationId) server.operations.set(operationId, { entityType: "sale", entityId: _id });
      return finish(record);
    }

    if (url === "/payments/receive") {
      const _id = (body.clientId as string) ?? `srv-payment-${server.payments.size}`;
      const customer = server.customers.get(body.customerId as string);
      if (!customer) throw new HttpError(404, "Customer not found");
      const amount = Number(body.amount);
      if (amount > Number(customer.totalDue)) {
        throw new HttpError(400, "Payment cannot exceed the outstanding due");
      }
      customer.totalPaid = Number(customer.totalPaid) + amount;
      customer.totalDue = Number(customer.totalDue) - amount;
      const record = {
        _id,
        business: body.businessId,
        direction: "in",
        partyType: "customer",
        party: { _id: customer._id, name: customer.name },
        amount,
        method: body.method ?? "cash",
        date: body.date,
        createdAt: new Date().toISOString(),
      };
      server.payments.set(_id, record);
      if (operationId) server.operations.set(operationId, { entityType: "payment", entityId: _id });
      return finish(record);
    }

    const adjust = url.match(/^\/products\/(.+)\/adjust-stock$/);
    if (adjust) {
      const product = server.products.get(adjust[1]);
      if (!product) throw new HttpError(404, "Product not found");
      const qty = Number(body.quantity);
      const stock = Number(product.stock);
      product.stock =
        body.type === "increase" ? stock + qty : body.type === "decrease" ? stock - qty : qty;
      if (operationId) {
        server.operations.set(operationId, { entityType: "product", entityId: product._id as string });
      }
      return finish(product);
    }

    throw new HttpError(404, `No fake route for POST ${url}`);
  };

  const get = async (url: string) => {
    guard();
    server.calls.push({ method: "get", url });

    const products = url.match(/^\/products\/business\/(.+)$/);
    if (products) {
      return ok([...server.products.values()].filter((p) => p.business === products[1]));
    }
    const customers = url.match(/^\/customers\/business\/(.+)$/);
    if (customers) {
      return ok([...server.customers.values()].filter((c) => c.business === customers[1]));
    }
    const sales = url.match(/^\/sales\/business\/(.+)$/);
    if (sales) {
      const rows = [...server.sales.values()].filter((s) => s.business === sales[1]);
      return ok({
        sales: rows,
        pagination: { page: 1, limit: 50, total: rows.length, totalPages: 1 },
      });
    }
    throw new HttpError(404, `No fake route for GET ${url}`);
  };

  const patch = async (url: string, body: Record<string, unknown> = {}) => {
    guard();
    server.calls.push({ method: "patch", url });
    const product = url.match(/^\/products\/(.+)$/);
    if (product) {
      const record = server.products.get(product[1]);
      if (!record) throw new HttpError(404, "Product not found");
      Object.assign(record, body);
      return finish(record);
    }
    const customer = url.match(/^\/customers\/(.+)$/);
    if (customer) {
      const record = server.customers.get(customer[1]);
      if (!record) throw new HttpError(404, "Customer not found");
      Object.assign(record, body);
      return finish(record);
    }
    throw new HttpError(404, `No fake route for PATCH ${url}`);
  };

  const del = async (url: string) => {
    guard();
    server.calls.push({ method: "delete", url });
    const product = url.match(/^\/products\/(.+)$/);
    if (product) {
      server.products.delete(product[1]);
      return ok(null);
    }
    throw new HttpError(404, `No fake route for DELETE ${url}`);
  };

  return { get, post, patch, delete: del };
};
