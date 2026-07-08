export default function Loading({ label = "Loading…" }: { label?: string }) {
  return (
    <div
      className="flex items-center gap-3 text-secondary"
      role="status"
      aria-live="polite"
    >
      <span className="inline-block size-4 animate-spin rounded-full border-2 border-default border-t-brand motion-reduce:animate-none" />
      <span className="text-body-md">{label}</span>
    </div>
  );
}
