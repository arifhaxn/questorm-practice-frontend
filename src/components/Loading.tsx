export default function Loading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 text-slate-500" role="status" aria-live="polite">
      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-brand" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
