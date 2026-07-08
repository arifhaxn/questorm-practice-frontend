import { formatConfidence, humanize } from "../lib/format";
import CopyButton from "./CopyButton";
import { Pill, SeverityPill, VerdictPill } from "./Pill";

// Structural subset shared by AnalyzeTicketResponse and TicketDetailResponse.
// IMPORTANT: every AI-generated string below is rendered as a React text node
// (never innerHTML / dangerouslySetInnerHTML) — XSS safety rule.
export interface AnalysisFields {
  relevant_transaction_id?: string | null;
  evidence_verdict: string;
  case_type: string;
  severity: string;
  department: string;
  agent_summary: string;
  recommended_next_action: string;
  customer_reply: string;
  human_review_required: boolean;
  confidence: number;
  reason_codes: string[];
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-label-sm uppercase text-tertiary">{label}</div>
      <div className="mt-1 text-body-md text-primary">{children}</div>
    </div>
  );
}

export default function AnalysisResult({ data }: { data: AnalysisFields }) {
  return (
    <div className="space-y-5">
      {/* Classification row */}
      <div className="flex flex-wrap items-center gap-2">
        <SeverityPill value={data.severity} />
        <Pill tone="neutral">{humanize(data.case_type)}</Pill>
        <Pill tone="neutral">{humanize(data.department)}</Pill>
        <VerdictPill value={data.evidence_verdict} />
        <Pill tone="info">confidence {formatConfidence(data.confidence)}</Pill>
        {data.human_review_required && <Pill tone="danger">human review required</Pill>}
      </div>

      {/* Evidence link */}
      <div className="rounded-md border border-default bg-surface-high px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-body-sm">
            <span className="text-secondary">Relevant transaction: </span>
            <span className="font-mono text-primary">
              {data.relevant_transaction_id ?? "none identified"}
            </span>
          </div>
          <div className="flex items-center gap-2 text-body-sm text-tertiary">
            <span>evidence verdict</span>
            <VerdictPill value={data.evidence_verdict} />
          </div>
        </div>
      </div>

      <Field label="Agent summary">
        <p className="whitespace-pre-wrap break-words">{data.agent_summary}</p>
      </Field>

      <Field label="Recommended next action">
        <p className="whitespace-pre-wrap break-words">{data.recommended_next_action}</p>
      </Field>

      {/* Customer-facing reply */}
      <div className="rounded-md border border-brand bg-surface-high px-4 py-3">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-label-sm uppercase text-brand">Customer reply</span>
            <Pill tone="info">customer-facing</Pill>
          </div>
          <CopyButton text={data.customer_reply} label="Copy reply" />
        </div>
        <p className="whitespace-pre-wrap break-words text-body-md text-primary">
          {data.customer_reply}
        </p>
      </div>

      <Field label="Reason codes">
        {data.reason_codes.length === 0 ? (
          <span className="text-tertiary">none</span>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {data.reason_codes.map((code, i) => (
              <span
                key={`${code}-${i}`}
                className="rounded-sm bg-surface-high px-2 py-0.5 font-mono text-body-sm text-secondary"
              >
                {code}
              </span>
            ))}
          </div>
        )}
      </Field>
    </div>
  );
}
