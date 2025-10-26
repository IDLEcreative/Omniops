export function SkeletonList({ count }: { count: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="h-8 w-full rounded bg-muted animate-pulse" />
      ))}
    </div>
  );
}
