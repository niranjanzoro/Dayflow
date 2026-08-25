/** Building blocks for loading placeholders. Purely visual - mark aria-hidden. */

export function StatCardSkeleton() {
  return (
    <div className="card stat-card" aria-hidden="true" data-loading>
      <div className="skeleton skeleton-stat-icon" />
      <div className="skeleton skeleton-stat-value" />
      <div className="skeleton skeleton-line w-60" />
    </div>
  );
}

export function ListRowsSkeleton({ rows = 3 }) {
  return (
    <div aria-hidden="true" data-loading>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="list-row">
          <div className="grow">
            <div className="skeleton skeleton-line w-40" />
            <div className="skeleton skeleton-line w-60" />
          </div>
          <div className="skeleton skeleton-badge" />
        </div>
      ))}
    </div>
  );
}
