import { useState } from "react";
import { Link } from "react-router-dom";

import { api, ApiError } from "../api/client";
import type { AnalyzeTicketRequest, AnalyzeTicketResponse, TransactionHistoryItem } from "../api/types";
import AnalysisResult from "../components/AnalysisResult";
import ErrorBanner from "../components/ErrorBanner";
import Loading from "../components/Loading";
import PageHeader from "../components/PageHeader";
import { formatDateTime } from "../lib/format";

// Editable row: everything is a string in the form; coerced on submit.
type Row = {
  transaction_id: string;
  timestamp: string;
  type: string;
  amount: string;
  counterparty: string;
  status: string;
};

const emptyRow = (): Row => ({
  transaction_id: "",
  timestamp: "",
  type: "",
  amount: "",
  counterparty: "",
  status: "",
});

const LANGUAGES = ["", "en", "bn"];
const CHANNELS = ["", "app", "web", "call", "sms", "agent"];
const USER_TYPES = ["", "customer", "merchant", "agent"];

const inputCls =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand";
const labelCls = "block text-xs font-semibold uppercase tracking-wide text-slate-500";

export default function Analyze() {
  const [ticketId, setTicketId] = useState("");
  const [complaint, setComplaint] = useState("");
  const [language, setLanguage] = useState("");
  const [channel, setChannel] = useState("");
  const [userType, setUserType] = useState("");
  const [campaign, setCampaign] = useState("");
  const [rows, setRows] = useState<Row[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeTicketResponse | null>(null);

  const updateRow = (i: number, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const removeRow = (i: number) => setRows((rs) => rs.filter((_, idx) => idx !== i));

  const buildRequest = (): AnalyzeTicketRequest => {
    const history: TransactionHistoryItem[] = rows
      .filter((r) => r.transaction_id.trim() !== "")
      .map((r) => {
        const item: TransactionHistoryItem = { transaction_id: r.transaction_id.trim() };
        if (r.timestamp) item.timestamp = r.timestamp;
        if (r.type) item.type = r.type;
        if (r.counterparty) item.counterparty = r.counterparty;
        if (r.status) item.status = r.status;
        if (r.amount.trim() !== "" && !Number.isNaN(Number(r.amount))) {
          item.amount = Number(r.amount);
        }
        return item;
      });

    const req: AnalyzeTicketRequest = { ticket_id: ticketId.trim(), complaint };
    if (language) req.language = language;
    if (channel) req.channel = channel;
    if (userType) req.user_type = userType;
    if (campaign.trim()) req.campaign_context = campaign.trim();
    if (history.length) req.transaction_history = history;
    return req;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!ticketId.trim()) return setError("ticket_id is required.");
    if (!complaint.trim()) return setError("complaint must not be empty.");

    setSubmitting(true);
    setResult(null);
    try {
      const res = await api.analyzeTicket(buildRequest());
      setResult(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Unexpected error analyzing ticket.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Analyze New Ticket"
        subtitle="POST /analyze-ticket — submit a ticket and view the full AI verdict inline."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ---- Form ---- */}
        <form onSubmit={onSubmit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls} htmlFor="ticket_id">Ticket ID *</label>
              <input id="ticket_id" className={inputCls} value={ticketId}
                onChange={(e) => setTicketId(e.target.value)} placeholder="e.g. TCK-1001" />
            </div>
            <div>
              <label className={labelCls} htmlFor="campaign">Campaign context</label>
              <input id="campaign" className={inputCls} value={campaign}
                onChange={(e) => setCampaign(e.target.value)} placeholder="optional" />
            </div>
          </div>

          <div>
            <label className={labelCls} htmlFor="complaint">Complaint *</label>
            <textarea id="complaint" className={`${inputCls} min-h-[110px]`} value={complaint}
              onChange={(e) => setComplaint(e.target.value)}
              placeholder="Describe what the customer reported…" />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className={labelCls} htmlFor="language">Language</label>
              <select id="language" className={inputCls} value={language}
                onChange={(e) => setLanguage(e.target.value)}>
                {LANGUAGES.map((l) => <option key={l || "any"} value={l}>{l || "—"}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls} htmlFor="channel">Channel</label>
              <select id="channel" className={inputCls} value={channel}
                onChange={(e) => setChannel(e.target.value)}>
                {CHANNELS.map((c) => <option key={c || "any"} value={c}>{c || "—"}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls} htmlFor="user_type">User type</label>
              <select id="user_type" className={inputCls} value={userType}
                onChange={(e) => setUserType(e.target.value)}>
                {USER_TYPES.map((u) => <option key={u || "any"} value={u}>{u || "—"}</option>)}
              </select>
            </div>
          </div>

          {/* Transaction history builder */}
          <div className="rounded-md border border-slate-200 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className={labelCls}>Transaction history</span>
              <button type="button" onClick={() => setRows((rs) => [...rs, emptyRow()])}
                className="rounded border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50">
                + Add row
              </button>
            </div>

            {rows.length === 0 && (
              <p className="py-2 text-xs text-slate-400">No transactions attached.</p>
            )}

            <div className="space-y-2">
              {rows.map((r, i) => (
                <div key={i} className="grid grid-cols-12 items-center gap-2">
                  <input className={`${inputCls} col-span-3`} placeholder="txn id *" value={r.transaction_id}
                    onChange={(e) => updateRow(i, { transaction_id: e.target.value })} />
                  <input className={`${inputCls} col-span-2`} placeholder="type" value={r.type}
                    onChange={(e) => updateRow(i, { type: e.target.value })} />
                  <input className={`${inputCls} col-span-2`} placeholder="amount" inputMode="decimal" value={r.amount}
                    onChange={(e) => updateRow(i, { amount: e.target.value })} />
                  <input className={`${inputCls} col-span-2`} placeholder="counterparty" value={r.counterparty}
                    onChange={(e) => updateRow(i, { counterparty: e.target.value })} />
                  <input className={`${inputCls} col-span-2`} placeholder="status" value={r.status}
                    onChange={(e) => updateRow(i, { status: e.target.value })} />
                  <button type="button" onClick={() => removeRow(i)} aria-label="Remove row"
                    className="col-span-1 rounded border border-slate-300 py-2 text-xs text-slate-500 hover:bg-slate-50">
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          {error && <ErrorBanner message={error} />}

          <div className="flex items-center gap-3">
            <button type="submit" disabled={submitting}
              className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-indigo-600 disabled:opacity-60">
              {submitting ? "Analyzing…" : "Analyze ticket"}
            </button>
            {submitting && <Loading label="Contacting backend…" />}
          </div>
        </form>

        {/* ---- Result ---- */}
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          {!result && !submitting && (
            <div className="flex h-full min-h-[200px] items-center justify-center text-sm text-slate-400">
              Submit a ticket to see its analysis here.
            </div>
          )}
          {submitting && <Loading label="Analyzing…" />}
          {result && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-800">
                    Result · <span className="font-mono">{result.ticket_id}</span>
                  </div>
                  <div className="text-xs text-slate-400">stored {formatDateTime(result.stored_at)}</div>
                </div>
                <Link to={`/tickets/${encodeURIComponent(result.ticket_id)}`}
                  className="rounded-md border border-brand px-3 py-1.5 text-xs font-medium text-brand hover:bg-brand hover:text-white">
                  Open detail view →
                </Link>
              </div>
              <AnalysisResult data={result} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
