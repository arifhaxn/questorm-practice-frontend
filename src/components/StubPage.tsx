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
      <div className="rounded-lg border border-dashed border-default bg-surface p-8 text-center shadow-card">
        <div className="text-title-md text-secondary">Stub — wired, not yet built</div>
        <div className="mt-1 text-body-sm text-tertiary">Planned for {phase}.</div>
      </div>
    </div>
  );
}
