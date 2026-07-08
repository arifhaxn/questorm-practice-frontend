import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { api, ApiError } from "../api/client";
import type {
  ListTicketsParams,
  Severity,
  TicketListResponse,
  TicketStatus,
} from "../api/types";
import ErrorBanner from "../components/ErrorBanner";
import Loading from "../components/Loading";
import PageHeader from "../components/PageHeader";
import { Pill, SeverityPill, StatusPill } from "../components/Pill";
import { formatDateTime, humanize, mask } from "../lib/format";

const PAGE_SIZE = 20;
const POLL_MS = 8000; // keep the queue live so newly analyzed tickets show up.

// Fully-defined enums (enums.py) — safe to hardcode as filter options.
const STATUS_OPTIONS: TicketStatus[] = ["open", "in_progress", "resolved", "escalated"];
const SEVERITY_OPTIONS: Severity[] = ["low", "medium", "high", "critical"];

// The two sort intents the spec calls for, plus their inverses. Each maps to the
// backend's sort_by + order query params (see persistence/router.py).
type SortKey = "sev_desc" | "sev_asc" | "time_desc" | "time_asc";
const SORTS: Record<SortKey, { label: string; sort_by: "severity" | "timestamp"; order: "asc" | "desc" }> = {
  time_desc: { label: "Newest first", sort_by: "timestamp", order: "desc" },
  time_asc: { label: "Oldest first", sort_by: "timestamp", order: "asc" },
  sev_desc: { label: "Severity — highest first", sort_by: "severity", order: "desc" },
  sev_asc: { label: "Severity — lowest first", sort_by: "severity", order: "asc" },
};

type HumanReviewFilter = "all" | "yes" | "no";

const selectCls =
  "rounded-md border border-default bg-surface px-3 py-2 text-body-sm text-primary transition-colors duration-fast focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";
const labelCls = "mb-1 block text-label-sm uppercase text-tertiary";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col">
      <span className={labelCls}>{label}</span>
      {children}
    </label>
  );
}

export default function Queue() {
  const navigate = useNavigate();

  const [status, setStatus] = useState<string>("");
  const [severity, setSeverity] = useState<string>("");
  const [caseType, setCaseType] = useState<string>("");
  const [department, setDepartment] = useState<string>("");
  const [humanReview, setHumanReview] = useState<HumanReviewFilter>("all");
  const [sort, setSort] = useState<SortKey>("time_desc");
  const [page, setPage] = useState(1);

  const [data, setData] = useState<TicketListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // case_type / department enums are open on the backend, so we never hardcode
  // them — we source the live set of values from /analytics/summary instead.
  const [caseTypeOptions, setCaseTypeOptions] = useState<string[]>([]);
  const [departmentOptions, setDepartmentOptions] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    api
      .summary()
      .then((s) => {
        if (cancelled) return;
        setCaseTypeOptions(Object.keys(s.by_case_type).sort());
        setDepartmentOptions(Object.keys(s.by_department).sort());
      })
      .catch(() => {
        /* Non-fatal: filters just fall back to "All". */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const params = useMemo<ListTicketsParams>(() => {
    const s = SORTS[sort];
    return {
      page,
      limit: PAGE_SIZE,
      status: status || undefined,
      severity: severity || undefined,
      case_type: caseType || undefined,
      department: department || undefined,
      human_review_required:
        humanReview === "all" ? undefined : humanReview === "yes",
      sort_by: s.sort_by,
      order: s.order,
    };
  }, [page, status, severity, caseType, department, humanReview, sort]);

  // silent=true is used by the background poll: refresh data in place without
  // flashing the spinner or clobbering the view with a transient error.
  const load = useCallback(
    async (silent = false) => {
      if (!silent) {
        setLoading(true);
        setError(null);
      }
      try {
        const res = await api.listTickets(params);
        setData(res);
        setError(null);
      } catch (err) {
        if (!silent) setError(err instanceof ApiError ? err.detail : "Failed to load tickets");
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [params],
  );

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(true), POLL_MS);
    return () => window.clearInterval(id);
  }, [load]);

  // Any filter/sort change returns to page 1 so results stay meaningful.
  const resetTo = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setPage(1);
  };

  const total = data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const rows = data?.tickets ?? [];
  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);

  const hasActiveFilters =
    status || severity || caseType || department || humanReview !== "all";
  const clearFilters = () => {
    setStatus("");
    setSeverity("");
    setCaseType("");
    setDepartment("");
    setHumanReview("all");
    setPage(1);
  };

  return (
    <div>
      <PageHeader
        title="Ticket Queue"
        subtitle="GET /tickets — filter, sort, and open tickets."
        actions={
          <button
            onClick={() => void load()}
            className="rounded-md border border-default px-3 py-2 text-label-sm text-secondary transition-colors duration-fast hover:bg-surface-high focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            Refresh
          </button>
        }
      />

      {/* Filters + sort */}
      <div className="mb-4 rounded-lg border border-default bg-surface p-4 shadow-card">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          <Field label="Status">
            <select
              className={selectCls}
              value={status}
              onChange={(e) => resetTo(setStatus)(e.target.value)}
            >
              <option value="">All</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {humanize(s)}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Severity">
            <select
              className={selectCls}
              value={severity}
              onChange={(e) => resetTo(setSeverity)(e.target.value)}
            >
              <option value="">All</option>
              {SEVERITY_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {humanize(s)}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Case type">
            <select
              className={selectCls}
              value={caseType}
              onChange={(e) => resetTo(setCaseType)(e.target.value)}
            >
              <option value="">All</option>
              {caseTypeOptions.map((c) => (
                <option key={c} value={c}>
                  {humanize(c)}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Department">
            <select
              className={selectCls}
              value={department}
              onChange={(e) => resetTo(setDepartment)(e.target.value)}
            >
              <option value="">All</option>
              {departmentOptions.map((d) => (
                <option key={d} value={d}>
                  {humanize(d)}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Human review">
            <select
              className={selectCls}
              value={humanReview}
              onChange={(e) => resetTo(setHumanReview)(e.target.value as HumanReviewFilter)}
            >
              <option value="all">All</option>
              <option value="yes">Required</option>
              <option value="no">Not required</option>
            </select>
          </Field>

          <Field label="Sort">
            <select
              className={selectCls}
              value={sort}
              onChange={(e) => resetTo(setSort)(e.target.value as SortKey)}
            >
              {(Object.keys(SORTS) as SortKey[]).map((k) => (
                <option key={k} value={k}>
                  {SORTS[k].label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        {hasActiveFilters && (
          <div className="mt-3">
            <button
              onClick={clearFilters}
              className="text-label-sm text-brand hover:text-brand-deep"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="rounded-lg border border-default bg-surface shadow-card">
        {error && (
          <div className="p-4">
            <ErrorBanner message={error} onRetry={() => void load()} />
          </div>
        )}

        {loading && !data ? (
          <div className="p-6">
            <Loading label="Loading tickets…" />
          </div>
        ) : rows.length === 0 && !error ? (
          <div className="p-10 text-center text-body-md text-tertiary">
            No tickets match these filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-default text-label-sm uppercase text-tertiary">
                  <th className="px-4 py-3 font-semibold">Ticket</th>
                  <th className="px-4 py-3 font-semibold">Case type</th>
                  <th className="px-4 py-3 font-semibold">Severity</th>
                  <th className="px-4 py-3 font-semibold">Department</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Review</th>
                  <th className="px-4 py-3 font-semibold">Stored</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((t) => (
                  <tr
                    key={t.ticket_id}
                    onClick={() => navigate(`/tickets/${encodeURIComponent(t.ticket_id)}`)}
                    tabIndex={0}
                    role="button"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        navigate(`/tickets/${encodeURIComponent(t.ticket_id)}`);
                      }
                    }}
                    className="cursor-pointer border-b border-default transition-colors duration-fast last:border-b-0 hover:bg-surface-high focus:bg-surface-high focus:outline-none"
                  >
                    {/* Column values that could carry PII go through mask(). */}
                    <td className="px-4 py-3 font-mono text-body-sm text-primary">
                      {mask(t.ticket_id)}
                    </td>
                    <td className="px-4 py-3 text-body-md text-secondary">
                      {humanize(t.case_type)}
                    </td>
                    <td className="px-4 py-3">
                      <SeverityPill value={t.severity} />
                    </td>
                    <td className="px-4 py-3 text-body-md text-secondary">
                      {humanize(t.department)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill value={t.status} />
                    </td>
                    <td className="px-4 py-3">
                      {t.human_review_required ? (
                        <Pill tone="brand" solid title="Needs a human reviewer">
                          ● Review
                        </Pill>
                      ) : (
                        <span className="text-body-sm text-tertiary">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-body-sm text-tertiary tabular-nums-bv">
                      {formatDateTime(t.stored_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {data && total > 0 && (
          <div className="flex items-center justify-between gap-4 border-t border-default px-4 py-3">
            <span className="text-body-sm text-tertiary tabular-nums-bv">
              {rangeStart}–{rangeEnd} of {total}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-md border border-default px-3 py-1.5 text-label-sm text-secondary transition-colors duration-fast hover:bg-surface-high disabled:cursor-not-allowed disabled:opacity-40"
              >
                Prev
              </button>
              <span className="text-body-sm text-secondary tabular-nums-bv">
                Page {page} / {pageCount}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                disabled={page >= pageCount}
                className="rounded-md border border-default px-3 py-1.5 text-label-sm text-secondary transition-colors duration-fast hover:bg-surface-high disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
