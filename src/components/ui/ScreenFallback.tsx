/**
 * Shown while a route chunk is in flight.
 *
 * Deliberately not a spinner: a spinner in the middle of an empty screen reads
 * as "something is wrong". A dim, static scaffold of the screen that is about
 * to arrive reads as "almost there" — and on a fast connection it is on screen
 * for a frame or two and barely registers.
 */
const ScreenFallback = () => (
  <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-4xl mx-auto space-y-5">
    <div className="flex items-center justify-between">
      <div className="skeleton h-7 w-40 rounded-lg" />
      <div className="skeleton h-10 w-28 rounded-xl" />
    </div>
    <div className="skeleton h-11 w-full rounded-xl" />
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}
    >
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3.5">
          <div className="skeleton w-10 h-10 rounded-xl flex-shrink-0" />
          <div className="flex-1 min-w-0 space-y-2">
            <div className="skeleton h-3.5 rounded-md" style={{ width: "58%" }} />
            <div className="skeleton h-2.5 rounded-md" style={{ width: "34%" }} />
          </div>
          <div className="skeleton h-4 w-14 rounded-md flex-shrink-0" />
        </div>
      ))}
    </div>
  </div>
);

export default ScreenFallback;
