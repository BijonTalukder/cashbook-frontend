/**
 * Loading placeholders shaped like the content they stand in for.
 *
 * A shimmering row of the right height keeps the layout from jumping when data
 * lands — the jump is what makes a WebView feel like a page load rather than a
 * screen transition.
 */

export const Skeleton = ({
  className = "",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) => <div className={`skeleton ${className}`} style={style} />;

/** Mirrors the avatar + two-line + trailing-value list row used across the app. */
export const SkeletonRow = () => (
  <div className="flex items-center gap-3 px-4 py-3.5">
    <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
    <div className="flex-1 min-w-0 space-y-2">
      <Skeleton className="h-3.5 rounded-md" style={{ width: "58%" }} />
      <Skeleton className="h-2.5 rounded-md" style={{ width: "36%" }} />
    </div>
    <Skeleton className="h-4 w-16 rounded-md flex-shrink-0" />
  </div>
);

export const SkeletonList = ({ rows, count = 5 }: { rows?: number; count?: number }) => {
  const numRows = rows ?? count;
  return (
    <div>
      {Array.from({ length: numRows }, (_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  );
};

export const SkeletonCard = ({ className = "" }: { className?: string }) => (
  <div
    className={`rounded-2xl p-4 space-y-3 ${className}`}
    style={{ background: "var(--surface-1)", border: "1px solid var(--border-light)" }}
  >
    <Skeleton className="h-3 w-24 rounded-md" />
    <Skeleton className="h-7 w-32 rounded-lg" />
  </div>
);

export default Skeleton;
