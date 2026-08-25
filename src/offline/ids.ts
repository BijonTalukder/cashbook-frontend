/**
 * Client-side id generation for offline writes.
 *
 * Records created without a network still have to reference each other — a sale
 * rung up offline points at a customer added minutes earlier — so the client
 * mints ids itself instead of waiting for the server. They follow the MongoDB
 * ObjectId layout (4-byte timestamp + 5-byte random + 3-byte counter) so the
 * backend accepts them verbatim as `_id` and existing route validation, sorting
 * and indexes keep working unchanged.
 */

const randomBytes = (length: number): number[] => {
  const out = new Uint8Array(length);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(out);
  } else {
    for (let i = 0; i < length; i += 1) out[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(out);
};

const hex = (bytes: number[]) =>
  bytes.map((b) => b.toString(16).padStart(2, "0")).join("");

const PROCESS_RANDOM = randomBytes(5);
let counter = randomBytes(3).reduce((acc, b) => (acc << 8) | b, 0) & 0xffffff;

/** A 24-char hex id the backend can store directly as an ObjectId. */
export const newObjectId = (): string => {
  const seconds = Math.floor(Date.now() / 1000);
  counter = (counter + 1) & 0xffffff;
  const timestamp = [
    (seconds >> 24) & 0xff,
    (seconds >> 16) & 0xff,
    (seconds >> 8) & 0xff,
    seconds & 0xff,
  ];
  const tail = [(counter >> 16) & 0xff, (counter >> 8) & 0xff, counter & 0xff];
  return hex([...timestamp, ...PROCESS_RANDOM, ...tail]);
};

/** Idempotency key for a single queued operation — never reused across retries. */
export const newOperationId = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  const b = randomBytes(16);
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const s = hex(b);
  return `${s.slice(0, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}-${s.slice(16, 20)}-${s.slice(20)}`;
};

const OBJECT_ID_RE = /^[0-9a-f]{24}$/i;
export const isObjectId = (value: string): boolean => OBJECT_ID_RE.test(value);
