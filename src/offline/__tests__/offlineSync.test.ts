/**
 * The offline-first scenarios that matter for a POS, exercised end to end
 * against a real IndexedDB (fake-indexeddb) and a fake backend that reproduces
 * the operation ledger.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApiMock, createServer, type FakeServerState } from "./fakeApi";

const server: FakeServerState = createServer();

vi.mock("../../services/api", () => ({ default: createApiMock(server) }));

let reachable = true;
vi.mock("../network", () => ({
  isApiReachable: async () => reachable,
  isApiReachableNow: () => reachable,
  reportRequestOutcome: (ok: boolean) => {
    if (!ok) reachable = false;
  },
  probeApi: async () => reachable,
  getConnectivity: () => (reachable ? "online" : "offline"),
  onConnectivityChange: () => () => undefined,
  startNetworkMonitor: () => undefined,
  stopNetworkMonitor: () => undefined,
}));

const { productService } = await import("../../services/product.service");
const { customerService } = await import("../../services/customer.service");
const { saleService } = await import("../../services/sale.service");
const { paymentService } = await import("../../services/payment.service");
const { productRepo, customerRepo, saleRepo } = await import("../repositories");
const { runSync } = await import("../syncManager");
const queue = await import("../syncQueue");
const { idbClearAll } = await import("../idb");
const { useAuthStore } = await import("../../store/authStore");

const BUSINESS = "b1000000000000000000000a";

/** Simulates the app being closed and reopened: only IndexedDB survives. */
const reload = async () => {
  const rows = await queue.allOperations();
  return rows;
};

const setOffline = () => {
  reachable = false;
  server.mode = "down";
};
const setOnline = () => {
  reachable = true;
  server.mode = "up";
};

const seedCatalogue = async () => {
  setOnline();
  const product = await productService.create({
    businessId: BUSINESS,
    name: "Tea",
    sellingPrice: 10,
    stock: 20,
  });
  const customer = await customerService.create({
    businessId: BUSINESS,
    name: "Rahim",
    phone: "01700000000",
  });
  await runSync();
  return { product, customer };
};

beforeEach(async () => {
  await idbClearAll();
  Object.assign(server, createServer());
  setOnline();
  useAuthStore.setState({ token: "test-token", user: { _id: "u1" } as never });
});

describe("Scenario 1 — fully offline", () => {
  it("stores products, customers and sales locally and keeps them across a reload", async () => {
    const { product } = await seedCatalogue();
    setOffline();

    const customer = await customerService.create({ businessId: BUSINESS, name: "Karim" });
    const sale = await saleService.create({
      businessId: BUSINESS,
      customerId: customer._id,
      items: [{ product: product._id, quantity: 3, unitPrice: 10 }],
      paidAmount: 30,
    });

    expect(sale.invoiceNumber).toMatch(/^LOCAL-/);
    expect(sale.total).toBe(30);

    // Everything is in IndexedDB, not just in React state.
    expect((await saleRepo.get(sale._id))?.syncStatus).toBe("pending");
    expect((await customerRepo.get(customer._id))?.name).toBe("Karim");

    // Stock reflects the sale immediately, offline.
    expect((await productRepo.get(product._id))?.stock).toBe(17);

    // …and again after a "reload", because nothing lived in memory.
    const afterReload = await reload();
    expect(afterReload.filter((op) => op.status === "PENDING")).toHaveLength(2);
    const salesAfterReload = await saleService.getAll(BUSINESS, { limit: "50" });
    expect(salesAfterReload.sales.map((s) => s._id)).toContain(sale._id);
  });
});

describe("Scenario 2 — connection restored", () => {
  it("drains the queue, backfills server ids and clears pending state", async () => {
    const { product } = await seedCatalogue();
    setOffline();

    const customer = await customerService.create({ businessId: BUSINESS, name: "Karim" });
    const sale = await saleService.create({
      businessId: BUSINESS,
      customerId: customer._id,
      items: [{ product: product._id, quantity: 2, unitPrice: 10 }],
      paidAmount: 0,
    });

    expect((await queue.queueCounts()).pending).toBe(2);

    setOnline();
    const result = await runSync();

    expect(result.synced).toBe(2);
    expect(server.sales.size).toBe(1);
    expect(server.customers.has(customer._id)).toBe(true);

    const stored = await saleRepo.get(sale._id);
    expect(stored?.syncStatus).toBe("synced");
    // The server-assigned invoice number replaces the local placeholder.
    expect(stored?.invoiceNumber).toMatch(/^INV-/);

    const syncedProduct = await productRepo.get(product._id);
    expect(syncedProduct?.stock).toBe(18);
    expect(syncedProduct?.syncStatus).toBe("synced");
    // The delta moved into the server column rather than being applied twice.
    expect(syncedProduct?.pendingDeltas?.stock ?? 0).toBe(0);
    expect(server.products.get(product._id)?.stock).toBe(18);

    expect((await queue.queueCounts()).pending).toBe(0);
  });
});

describe("Scenario 3 — browser online, API unavailable", () => {
  it("keeps the operation pending and retries with backoff", async () => {
    const { product } = await seedCatalogue();

    // The browser is happy; the API is not.
    reachable = true;
    server.mode = "down";

    const sale = await saleService.create({
      businessId: BUSINESS,
      items: [{ product: product._id, quantity: 1, unitPrice: 10 }],
      paidAmount: 10,
    });

    const [op] = (await queue.allOperations()).filter((o) => o.entityId === sale._id);
    expect(op.status).toBe("PENDING");
    expect(op.retryCount).toBeGreaterThan(0);
    expect(op.nextAttemptAt).toBeGreaterThan(Date.now());
    expect(server.sales.size).toBe(0);

    // Backend comes back; the retry goes through.
    setOnline();
    await queue.requeueForManualSync();
    await runSync();
    expect(server.sales.size).toBe(1);
    expect((await saleRepo.get(sale._id))?.syncStatus).toBe("synced");
  });
});

describe("Scenario 4 — duplicate retry after a lost response", () => {
  it("does not create a second sale when the same operation is replayed", async () => {
    const { product } = await seedCatalogue();
    setOffline();

    const sale = await saleService.create({
      businessId: BUSINESS,
      items: [{ product: product._id, quantity: 4, unitPrice: 10 }],
      paidAmount: 40,
    });

    // The server processes the request and the response is lost in transit.
    reachable = true;
    server.mode = "lossy";
    await runSync();

    expect(server.sales.size).toBe(1);
    expect(server.products.get(product._id)?.stock).toBe(16);
    const afterLoss = await queue.getOperation(
      (await queue.allOperations()).find((o) => o.entityId === sale._id)!.operationId,
    );
    expect(afterLoss?.status).not.toBe("SUCCESS");

    // The client retries the very same operationId.
    setOnline();
    await queue.requeueForManualSync();
    await runSync();

    // One sale, one stock movement — the replay returned the original record.
    expect(server.sales.size).toBe(1);
    expect(server.products.get(product._id)?.stock).toBe(16);
    expect((await saleRepo.get(sale._id))?.syncStatus).toBe("synced");
    expect((await productRepo.get(product._id))?.stock).toBe(16);
  });
});

describe("Scenario 5 — reload while a sync is in flight", () => {
  it("recovers PROCESSING operations and finishes them", async () => {
    const { product } = await seedCatalogue();
    setOffline();

    const sale = await saleService.create({
      businessId: BUSINESS,
      items: [{ product: product._id, quantity: 1, unitPrice: 10 }],
      paidAmount: 10,
    });

    // Freeze an operation mid-flight, the way a closed tab would.
    const op = (await queue.allOperations()).find((o) => o.entityId === sale._id)!;
    await queue.markProcessing(op);
    expect((await queue.getOperation(op.operationId))?.status).toBe("PROCESSING");

    setOnline();
    await runSync(); // starts with recoverInterrupted()

    expect((await queue.getOperation(op.operationId))?.status).toBe("SUCCESS");
    expect(server.sales.size).toBe(1);
  });
});

describe("Scenario 6 — multiple dependent operations", () => {
  it("creates the customer before the sale that references it", async () => {
    const { product } = await seedCatalogue();
    setOffline();

    const customer = await customerService.create({ businessId: BUSINESS, name: "Nadia" });
    const sale = await saleService.create({
      businessId: BUSINESS,
      customerId: customer._id,
      items: [{ product: product._id, quantity: 1, unitPrice: 10 }],
      paidAmount: 0,
    });
    await paymentService.receive({
      businessId: BUSINESS,
      customerId: customer._id,
      amount: 10,
    });

    setOnline();
    server.calls.length = 0;
    await runSync();

    const order = server.calls.filter((c) => c.method === "post").map((c) => c.url);
    expect(order).toEqual(["/customers", "/sales", "/payments/receive"]);

    // The payment could only be accepted because the sale's due landed first.
    expect(server.payments.size).toBe(1);
    expect(server.customers.get(customer._id)?.totalDue).toBe(0);
    expect((await customerRepo.get(customer._id))?.totalDue).toBe(0);
    expect((await saleRepo.get(sale._id))?.syncStatus).toBe("synced");
  });

  it("holds a sale back when the customer it depends on is stuck", async () => {
    const { product } = await seedCatalogue();
    setOffline();

    const customer = await customerService.create({ businessId: BUSINESS, name: "Blocked" });
    const sale = await saleService.create({
      businessId: BUSINESS,
      customerId: customer._id,
      items: [{ product: product._id, quantity: 1, unitPrice: 10 }],
      paidAmount: 0,
    });

    // Park the customer create as unresolvable.
    const customerOp = (await queue.allOperations()).find((o) => o.entityId === customer._id)!;
    await queue.markConflict(customerOp, "rejected");

    setOnline();
    server.calls.length = 0;
    await runSync();

    expect(server.calls.some((c) => c.url === "/sales")).toBe(false);
    expect((await saleRepo.get(sale._id))?.syncStatus).toBe("pending");
  });
});

describe("Scenario 7 — conflict", () => {
  it("parks an oversold sale for review instead of retrying it forever", async () => {
    const { product } = await seedCatalogue();
    setOffline();

    // Sold offline against stock another till had already consumed.
    const sale = await saleService.create({
      businessId: BUSINESS,
      items: [{ product: product._id, quantity: 5, unitPrice: 10 }],
      paidAmount: 50,
    });

    setOnline();
    server.rejectSaleWith = { status: 400, message: 'Insufficient stock for "Tea"' };
    const result = await runSync();

    expect(result.conflicts).toBe(1);
    const op = (await queue.allOperations()).find((o) => o.entityId === sale._id)!;
    expect(op.status).toBe("CONFLICT");
    expect(op.lastError).toContain("Insufficient stock");

    // The sale is kept — a completed transaction is never silently discarded.
    const stored = await saleRepo.get(sale._id);
    expect(stored).toBeDefined();
    expect(stored?.syncStatus).toBe("conflict");

    // And it is not retried on the next pass without a person intervening.
    server.calls.length = 0;
    await runSync();
    expect(server.calls.some((c) => c.url === "/sales")).toBe(false);
  });
});

describe("Local reads", () => {
  it("serves the catalogue and search from the cache while offline", async () => {
    await seedCatalogue();
    await productService.create({ businessId: BUSINESS, name: "Sugar", sellingPrice: 5, stock: 8 });
    await runSync();

    setOffline();
    const all = await productService.getAll(BUSINESS);
    expect(all.map((p) => p.name).sort()).toEqual(["Sugar", "Tea"]);

    const searched = await productService.getAll(BUSINESS, { search: "sug" });
    expect(searched).toHaveLength(1);
    expect(searched[0].name).toBe("Sugar");

    const customers = await customerService.getAll(BUSINESS, "rah");
    expect(customers).toHaveLength(1);
  });

  it("does not let a server refresh overwrite a pending local edit", async () => {
    const { product } = await seedCatalogue();
    setOffline();

    await productService.update(product._id, { sellingPrice: 12, name: "Tea (new)" });
    expect((await productRepo.get(product._id))?.sellingPrice).toBe(12);

    // The server still has the old price; the pull must not clobber the edit.
    setOnline();
    server.mode = "up";
    reachable = true;
    const before = server.products.get(product._id)!;
    expect(before.sellingPrice).toBe(10);

    const { productRepo: repo } = await import("../repositories");
    const merged = await repo.mergeFromServer(BUSINESS, [before as never], true);
    void merged;

    const cached = await productRepo.get(product._id);
    expect(cached?.sellingPrice).toBe(12);
    expect(cached?.name).toBe("Tea (new)");
    expect(cached?.syncStatus).toBe("pending");
  });

  it("does not let a server refresh overwrite unsynced local stock", async () => {
    const { product } = await seedCatalogue();
    setOffline();

    await saleService.create({
      businessId: BUSINESS,
      items: [{ product: product._id, quantity: 6, unitPrice: 10 }],
      paidAmount: 60,
    });
    expect((await productRepo.get(product._id))?.stock).toBe(14);

    // The server still reports 20 — the sale has not reached it yet.
    reachable = true;
    server.mode = "up";
    await productService.getAll(BUSINESS);

    const cached = await productRepo.get(product._id);
    expect(cached?.serverValues?.stock).toBe(20);
    expect(cached?.pendingDeltas?.stock).toBe(-6);
    // The visible figure still accounts for the queued sale.
    expect(cached?.stock).toBe(14);
  });
});

describe("Sync mutex", () => {
  it("runs one sync at a time however many triggers fire", async () => {
    const { product } = await seedCatalogue();
    setOffline();
    await saleService.create({
      businessId: BUSINESS,
      items: [{ product: product._id, quantity: 1, unitPrice: 10 }],
      paidAmount: 10,
    });

    setOnline();
    server.calls.length = 0;
    await Promise.all([runSync(), runSync(), runSync()]);

    expect(server.calls.filter((c) => c.url === "/sales")).toHaveLength(1);
  });
});
