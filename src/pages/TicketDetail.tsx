import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { api, ApiError } from "../api/client";
import type { TicketDetailResponse, TicketStatus } from "../api/types";
import AnalysisResult from "../components/AnalysisResult";
import ErrorBanner from "../components/ErrorBanner";
import Loading from "../components/Loading";
import PageHeader from "../components/PageHeader";
import { StatusPill } from "../components/Pill";
import { formatDateTime, humanize, maskPhone } from "../lib/format";

type State =
  | { kind: "loading" }
  | { kind: "ok"; ticket: TicketDetailResponse }
  | { kind: "error"; message: string; status: number };

const STATUS_OPTIONS: TicketStatus[] = ["open", "in_progress", "resolved", "escalated"];

const selectCls =
  "rounded-md border border-default bg-surface px-3 py-2 text-body-sm text-primary transition-colors duration-fast focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

function Meta({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <div className="text-label-sm uppercase text-tertiary">{label}</div>
      <div className="mt-0.5 text-body-md text-primary">{value || "—"}</div>
    </div>
  );
}

/** Edit + persist a ticket's status (PATCH /tickets/{id}/status). */
function StatusEditor({
  ticket,
  onUpdated,
}: {
  ticket: TicketDetailResponse;
  onUpdated: (t: TicketDetailResponse) => void;
}) {
  const [status, setStatus] = useState<TicketStatus>(ticket.status as TicketStatus);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const dirty = status !== ticket.status || note.trim() !== "";

  const save = async () => {
    setSaving(true);
    setErr(null);
    setSaved(false);
    try {
      const updated = await api.updateTicketStatus(ticket.ticket_id, {
        status,
        agent_note: note.trim() || undefined,
      });
      onUpdated(updated);
      setNote("");
      setSaved(true);
    } catch (e) {
      setErr(e instanceof ApiError ? e.detail : "Failed to update status.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <label htmlFor="status-select" className="text-label-sm uppercase text-tertiary">
          Status
        </label>
        <select
          id="status-select"
          className={selectCls}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as TicketStatus);
            setSaved(false);
          }}
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {humanize(s)}
            </option>
          ))}
        </select>
        <button
          onClick={() => void save()}
          disabled={!dirty || saving}
          className="rounded-md bg-brand px-4 py-2 text-label-sm text-on-brand transition-colors duration-fast hover:bg-brand-deep disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        {saved && !dirty && <span className="text-label-sm text-success">Saved</span>}
      </div>
      <input
        type="text"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Agent note (optional)"
        className={`${selectCls} w-full`}
      />
      {err && <span className="text-label-sm text-danger">{err}</span>}
    </div>
  );
}

export default function TicketDetail() {
  const { ticketId } = useParams();
  const [state, setState] = useState<State>({ kind: "loading" });
  const [revealNumbers, setRevealNumbers] = useState(false);

  const load = useCallback(async () => {
    if (!ticketId) return;
    setState({ kind: "loading" });
    try {
      const ticket = await api.getTicket(ticketId);
      setState({ kind: "ok", ticket });
    } catch (err) {
      const status = err instanceof ApiError ? err.status : 0;
      const message = err instanceof ApiError ? err.detail : "Unexpected error loading ticket.";
      setState({ kind: "error", message, status });
    }
  }, [ticketId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      <PageHeader
        title="Ticket Detail"
        subtitle={`GET /tickets/${ticketId ?? ":id"} — full investigation record.`}
        actions={
          <Link
            to="/queue"
            className="rounded-md border border-default px-3 py-2 text-label-sm text-secondary transition-colors duration-fast hover:bg-surface-high"
          >
            ← Back to queue
          </Link>
        }
      />

      {state.kind === "loading" && <Loading label="Loading ticket…" />}

      {state.kind === "error" && (
        <div className="space-y-3">
          <ErrorBanner
            message={
              state.status === 404
                ? `Ticket "${ticketId}" was not found (it may have been deleted).`
                : state.message
            }
            onRetry={() => void load()}
          />
          <Link to="/queue" className="text-body-sm text-brand hover:text-brand-deep">
            ← Back to queue
          </Link>
        </div>
      )}

      {state.kind === "ok" && (
        <div className="space-y-6">
          {/* Header strip: identity + editable status */}
          <div className="flex flex-wrap items-start justify-between gap-4 rounded-lg border border-default bg-surface px-5 py-4 shadow-card">
            <div>
              <div className="text-title-lg text-primary">
                <span className="font-mono">{state.ticket.ticket_id}</span>
              </div>
              <div className="mt-1 flex items-center gap-3 text-body-sm text-tertiary">
                <span>stored {formatDateTime(state.ticket.stored_at)}</span>
                <span>·</span>
                <span>updated {formatDateTime(state.ticket.updated_at)}</span>
                <StatusPill value={state.ticket.status} />
              </div>
            </div>
            <StatusEditor
              key={state.ticket.ticket_id}
              ticket={state.ticket}
              onUpdated={(t) => setState({ kind: "ok", ticket: t })}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left: complaint + context + transactions */}
            <div className="space-y-6 lg:col-span-2">
              <section className="rounded-lg border border-default bg-surface p-5 shadow-card">
                <h2 className="mb-2 text-title-md text-secondary">Complaint</h2>
                {/* Rendered as a text node — never innerHTML (XSS rule). */}
                <p className="whitespace-pre-wrap break-words text-body-md text-primary">
                  {state.ticket.complaint}
                </p>
              </section>

              <section className="rounded-lg border border-default bg-surface p-5 shadow-card">
                <h2 className="mb-3 text-title-md text-secondary">Context</h2>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <Meta label="Language" value={state.ticket.language} />
                  <Meta label="Channel" value={state.ticket.channel} />
                  <Meta label="User type" value={state.ticket.user_type} />
                  <Meta label="Campaign" value={state.ticket.campaign_context} />
                </div>
              </section>

              <section className="rounded-lg border border-default bg-surface p-5 shadow-card">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-title-md text-secondary">Transaction history</h2>
                  {state.ticket.transaction_history.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setRevealNumbers((v) => !v)}
                      className="rounded-md border border-default px-2.5 py-1 text-label-sm text-secondary transition-colors duration-fast hover:bg-surface-high"
                    >
                      {revealNumbers ? "Mask numbers" : "Reveal numbers"}
                    </button>
                  )}
                </div>

                {state.ticket.transaction_history.length === 0 ? (
                  <p className="text-body-sm text-tertiary">No transactions attached.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-body-sm">
                      <thead>
                        <tr className="border-b border-default text-label-sm uppercase text-tertiary">
                          <th className="py-2 pr-3 font-semibold">Txn ID</th>
                          <th className="py-2 pr-3 font-semibold">Type</th>
                          <th className="py-2 pr-3 font-semibold">Amount</th>
                          <th className="py-2 pr-3 font-semibold">Counterparty</th>
                          <th className="py-2 pr-3 font-semibold">Status</th>
                          <th className="py-2 font-semibold">Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {state.ticket.transaction_history.map((t, i) => {
                          const isRelevant =
                            t.transaction_id === state.ticket.relevant_transaction_id;
                          return (
                            <tr
                              key={`${t.transaction_id}-${i}`}
                              className={`border-b border-default ${isRelevant ? "bg-surface-high" : ""}`}
                            >
                              <td className="py-2 pr-3 font-mono text-body-sm text-primary">
                                {t.transaction_id}
                                {isRelevant && (
                                  <span className="ml-1 text-brand" title="relevant transaction">
                                    ●
                                  </span>
                                )}
                              </td>
                              <td className="py-2 pr-3 text-secondary">{humanize(t.type)}</td>
                              <td className="py-2 pr-3 text-secondary tabular-nums-bv">
                                {t.amount ?? "—"}
                              </td>
                              <td className="py-2 pr-3 font-mono text-body-sm text-secondary">
                                {/* Masked by default via the shared util; reveal for the agent. */}
                                {t.counterparty
                                  ? revealNumbers
                                    ? t.counterparty
                                    : maskPhone(t.counterparty)
                                  : "—"}
                              </td>
                              <td className="py-2 pr-3 text-secondary">{humanize(t.status)}</td>
                              <td className="py-2 text-body-sm text-tertiary tabular-nums-bv">
                                {formatDateTime(t.timestamp)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </div>

            {/* Right: AI verdict */}
            <div className="space-y-4 lg:col-span-1">
              <section className="rounded-lg border border-default bg-surface p-5 shadow-card">
                <h2 className="mb-4 text-title-md text-secondary">AI investigation</h2>
                <AnalysisResult data={state.ticket} />
              </section>

              {state.ticket.agent_note && (
                <section className="rounded-lg border border-default bg-surface p-5 shadow-card">
                  <h2 className="mb-2 text-title-md text-secondary">Agent note</h2>
                  <p className="whitespace-pre-wrap break-words text-body-md text-primary">
                    {state.ticket.agent_note}
                  </p>
                </section>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
