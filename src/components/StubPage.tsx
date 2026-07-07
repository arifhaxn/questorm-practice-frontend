import PageHeader from "./PageHeader";

// Shared placeholder for routes wired up in Phase 0 but built out in later phases.
export default function StubPage({
  title,
  subtitle,
  phase,
}: {
  title: string;
  subtitle: string;
  phase: string;
}) {
  return (
    <div>
      <PageHeader title={title} subtitle={subtitle} />
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
        <div className="text-sm font-medium text-slate-600">Stub — wired, not yet built</div>
        <div className="mt-1 text-xs text-slate-400">Planned for {phase}.</div>
      </div>
    </div>
  );
}
