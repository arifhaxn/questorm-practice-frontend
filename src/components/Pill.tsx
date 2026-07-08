import { humanize } from "../lib/format";

// Semantic tones map to the Blossom-Vermillion status tokens. Magenta (brand) is
// the single accent, reserved here for the loudest state (critical severity).
type Tone = "neutral" | "brand" | "success" | "warning" | "danger" | "info";

const SOFT: Record<Tone, string> = {
  neutral: "bg-surface-high text-secondary border-default",
  brand: "bg-surface-high text-brand border-brand",
  success: "bg-surface-high text-success border-success",
  warning: "bg-surface-high text-warning border-warning",
  danger: "bg-surface-high text-danger border-danger",
  info: "bg-surface-high text-info border-info",
};

export function Pill({
  children,
  tone = "neutral",
  solid = false,
  title,
}: {
  children: React.ReactNode;
  tone?: Tone;
  solid?: boolean;
  title?: string;
}) {
  const classes = solid
    ? "bg-brand text-on-brand border-transparent"
    : SOFT[tone];
  return (
    <span
      title={title}
      className={`inline-flex items-center rounded-pill border px-2.5 py-0.5 text-label-sm ${classes}`}
    >
      {children}
    </span>
  );
}

// Values arrive as strings (case_type/department enums may still be open on the
// backend), so unknown values degrade to a neutral chip rather than throwing.
const SEVERITY_TONE: Record<string, Tone> = {
  low: "neutral",
  medium: "warning",
  high: "danger",
  critical: "brand",
};

const VERDICT_TONE: Record<string, Tone> = {
  consistent: "success",
  inconsistent: "danger",
  insufficient: "warning",
};

const STATUS_TONE: Record<string, Tone> = {
  open: "info",
  in_progress: "warning",
  resolved: "success",
  escalated: "danger",
};

export const SeverityPill = ({ value }: { value: string }) => (
  <Pill tone={SEVERITY_TONE[value] ?? "neutral"} solid={value === "critical"}>
    {humanize(value)}
  </Pill>
);

export const VerdictPill = ({ value }: { value: string }) => (
  <Pill tone={VERDICT_TONE[value] ?? "neutral"}>{humanize(value)}</Pill>
);

export const StatusPill = ({ value }: { value: string }) => (
  <Pill tone={STATUS_TONE[value] ?? "neutral"}>{humanize(value)}</Pill>
);
