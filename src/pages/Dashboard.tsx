import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { api, ApiError } from "../api/client";
import type { SummaryResponse, TicketListItem } from "../api/types";
import ErrorBanner from "../components/ErrorBanner";
import Loading from "../components/Loading";
import PageHeader from "../components/PageHeader";
import { SeverityPill } from "../components/Pill";
import { formatConfidence, humanize, mask, parseTimestamp, timeAgo } from "../lib/format";

const POLL_MS = 5000;
const RECENT_LIMIT = 100; // newest slice we scan for the "last hour" ticker.
const HOUR_MS = 60 * 60 * 1000;

// Fixed display order; the summary dict may omit empty buckets.
const STATUS_ORDER = ["open", "in_progress", "resolved", "escalated"];
const SEVERITY_ORDER = ["low", "medium", "high", "critical"];
const SEVERITY_BAR: Record<string, string> = {
  low: "bg-info",
  medium: "bg-warning",
  high: "bg-danger",
  critical: "bg-brand",
};

function Card({
  title,
  children,
  className = "",
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-lg border border-default bg-surface p-5 shadow-card ${className}`}>
      {title && <h2 className="mb-4 text-title-md text-secondary">{title}</h2>}
      {children}
    </section>
  );
}

/** Labelled horizontal bar: value scaled against the group's max. */
function BarRow({
  label,
  value,
  max,
  barClass = "bg-brand",
}: {
  label: string;
  value: number;
  max: number;
  barClass?: string;
}) {
  const pct = max > 0 ? Math.max(2, Math.round((value / max) * 100)) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 shrink-0 truncate text-body-sm text-secondary" title={label}>
        {label}
      </span>
      <div className="h-2 flex-1 overflow-hidden rounded-pill bg-surface-high">
        <div className={`h-full rounded-pill ${barClass}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-8 shrink-0 text-right text-label-md text-primary tabular-nums-bv">
        {value}
      </span>
    </div>
  );
}

export default function Dashboard() {
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [recent, setRecent] = useState<TicketListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  // A ticking clock so relative times re-render between polls.
  const [, setTick] = useState(0);
  const mounted = useRef(true);

  const poll = useCallback(async () => {
    try {
      const [s, list] = await Promise.all([
        api.summary(),
        api.listTickets({ sort_by: "timestamp", order: "desc", limit: RECENT_LIMIT }),
      ]);
      if (!mounted.current) return;
      setSummary(s);
      setRecent(list.tickets);
      setUpdatedAt(Date.now());
      setLive(true);
      setError(null);
    } catch (err) {
      if (!mounted.current) return;
      setLive(false);
      // Keep the last good data on-screen; only surface the error text.
      setError(err instanceof ApiError ? err.detail : "Failed to refresh dashboard");
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    void poll();
    const id = window.setInterval(() => void poll(), POLL_MS);
    const clock = window.setInterval(() => setTick((t) => t + 1), 1000);
    return () => {
      mounted.current = false;
      window.clearInterval(id);
      window.clearInterval(clock);
    };
  }, [poll]);

  if (loading && !summary) {
    return (
      <div>
        <PageHeader title="Dashboard" subtitle="Live SupportOps overview." />
        <Loading label="Loading dashboard…" />
      </div>
    );
  }

  const total = summary?.total_tickets ?? 0;
  const byStatus = summary?.by_status ?? {};
  const bySeverity = summary?.by_severity ?? {};
  const byCaseType = summary?.by_case_type ?? {};

  const statusMax = Math.max(1, ...STATUS_ORDER.map((k) => byStatus[k] ?? 0));
  const severityMax = Math.max(1, ...SEVERITY_ORDER.map((k) => bySeverity[k] ?? 0));

  const topCaseTypes = Object.entries(byCaseType)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  const caseTypeMax = Math.max(1, ...topCaseTypes.map(([, v]) => v));

  const now = Date.now();
  const lastHour = recent.filter((t) => {
    const d = parseTimestamp(t.stored_at);
    return d != null && now - d.getTime() <= HOUR_MS;
  });

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Live SupportOps overview — polling every 5s."
        actions={
          <span className="inline-flex items-center gap-2 text-body-sm text-tertiary">
            <span
              className={`size-2.5 rounded-full ${live ? "bg-success" : "bg-danger"}`}
              aria-hidden
            />
            {live ? "Live" : "Reconnecting"}
            {updatedAt && <span>· updated {timeAgo(new Date(updatedAt).toISOString(), now)}</span>}
          </span>
        }
      />

      {error && (
        <div className="mb-4">
          <ErrorBanner message={error} onRetry={() => void poll()} />
        </div>
      )}

      {/* Hero + headline stats */}
      <div className="mb-4 grid gap-4 lg:grid-cols-3">
        <div className="bg-brand-gradient rounded-xl p-6 text-on-brand shadow-brand-glow">
          <p className="text-body-md opacity-90">Total tickets</p>
          <p className="mt-1 text-display-lg tabular-nums-bv">{total}</p>
          <p className="mt-2 text-body-sm opacity-90">
            {lastHour.length} processed in the last hour
          </p>
        </div>

        <Card title="Human review pending" className="flex flex-col justify-center">
          <p className="text-display-md text-primary tabular-nums-bv">
            {summary?.human_review_pending ?? 0}
          </p>
          <p className="mt-1 text-body-sm text-tertiary">tickets awaiting a human</p>
        </Card>

        <Card title="Average confidence" className="flex flex-col justify-center">
          <p className="text-display-md text-primary tabular-nums-bv">
            {formatConfidence(summary?.average_confidence)}
          </p>
          <p className="mt-1 text-body-sm text-tertiary">across analyzed tickets</p>
        </Card>
      </div>

      {/* Breakdowns */}
      <div className="mb-4 grid gap-4 lg:grid-cols-2">
        <Card title="By status">
          <div className="space-y-3">
            {STATUS_ORDER.map((k) => (
              <BarRow key={k} label={humanize(k)} value={byStatus[k] ?? 0} max={statusMax} />
            ))}
          </div>
        </Card>

        <Card title="By severity">
          <div className="space-y-3">
            {SEVERITY_ORDER.map((k) => (
              <BarRow
                key={k}
                label={humanize(k)}
                value={bySeverity[k] ?? 0}
                max={severityMax}
                barClass={SEVERITY_BAR[k]}
              />
            ))}
          </div>
        </Card>
      </div>

      {/* Top case types + last-hour ticker */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Top 3 active case types">
          {topCaseTypes.length === 0 ? (
            <p className="text-body-sm text-tertiary">No tickets yet.</p>
          ) : (
            <div className="space-y-3">
              {topCaseTypes.map(([name, count]) => (
                <BarRow key={name} label={humanize(name)} value={count} max={caseTypeMax} />
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-title-md text-secondary">Processed in the last hour</h2>
            <span className="text-title-lg text-brand tabular-nums-bv">{lastHour.length}</span>
          </div>
          {lastHour.length === 0 ? (
            <p className="text-body-sm text-tertiary">No tickets in the last hour.</p>
          ) : (
            <ul className="max-h-64 space-y-1 overflow-y-auto">
              {lastHour.map((t) => (
                <li key={t.ticket_id}>
                  <Link
                    to={`/tickets/${encodeURIComponent(t.ticket_id)}`}
                    className="flex items-center justify-between gap-3 rounded-md px-2 py-2 transition-colors duration-fast hover:bg-surface-high"
                  >
                    <span className="truncate font-mono text-body-sm text-primary">
                      {mask(t.ticket_id)}
                    </span>
                    <span className="flex shrink-0 items-center gap-3">
                      <SeverityPill value={t.severity} />
                      <span className="text-body-sm text-tertiary tabular-nums-bv">
                        {timeAgo(t.stored_at, now)}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
