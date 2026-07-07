// -----------------------------------------------------------------------------
// Mirrors backend/app/schemas.py EXACTLY. The contract is LAW: field names,
// types and enum values are case-sensitive and must not be renamed or invented.
//
// enums.py FULLY defines: Severity, TicketStatus, BatchPriority, PatternType
//   -> typed here as string-literal unions.
// enums.py has OPEN TODO blocks for: CaseType, Department, EvidenceVerdict
//   -> the closed set is not finalized, and these flow over the wire as strings,
//      so they are typed `string` here rather than a false/incomplete union.
//      Tighten to unions once enums.py fills its TODOs.
// -----------------------------------------------------------------------------

export type Severity = "low" | "medium" | "high" | "critical";
export type TicketStatus = "open" | "in_progress" | "resolved" | "escalated";
export type BatchPriority = "normal" | "high";
export type PatternType =
  | "counterparty_spike"
  | "case_type_spike"
  | "high_value_cluster"
  | "department_overload"
  | "fraud_signal_cluster";

// --- analyze-ticket ----------------------------------------------------------
export interface TransactionHistoryItem {
  transaction_id: string;
  timestamp?: string | null;
  type?: string | null;
  amount?: number | null;
  counterparty?: string | null;
  status?: string | null;
}

export interface AnalyzeTicketRequest {
  ticket_id: string;
  complaint: string;
  language?: string | null;
  channel?: string | null;
  user_type?: string | null;
  campaign_context?: string | null;
  transaction_history?: TransactionHistoryItem[];
}

export interface AnalyzeTicketResponse {
  ticket_id: string;
  relevant_transaction_id: string | null;
  evidence_verdict: string;
  case_type: string;
  severity: Severity;
  department: string;
  agent_summary: string;
  recommended_next_action: string;
  customer_reply: string;
  human_review_required: boolean;
  confidence: number;
  reason_codes: string[];
  stored_at: string; // ISO 8601
}

// --- analyze-batch -----------------------------------------------------------
export interface AnalyzeBatchRequest {
  batch_id: string;
  // Raw dicts per the contract (validated per-item on the backend), so bad
  // tickets become failed items instead of failing the whole batch.
  tickets: Record<string, unknown>[];
  priority?: BatchPriority;
}

export interface BatchItemResult {
  ticket_id: string;
  status: string; // "success" | "failed"
  result?: AnalyzeTicketResponse | null;
  error?: string | null;
}

export interface AnalyzeBatchResponse {
  batch_id: string;
  total_submitted: number;
  total_succeeded: number;
  total_failed: number;
  processing_time_ms: number;
  results: BatchItemResult[];
}

// --- tickets (persistence) ---------------------------------------------------
export interface TicketListItem {
  ticket_id: string;
  case_type: string;
  severity: string;
  department: string;
  status: string;
  human_review_required: boolean;
  evidence_verdict: string;
  stored_at: string;
}

export interface TicketListResponse {
  total: number;
  page: number;
  limit: number;
  tickets: TicketListItem[];
}

export interface StatusUpdateRequest {
  status: TicketStatus;
  agent_note?: string | null;
}

export interface TicketDetailResponse {
  ticket_id: string;
  complaint: string;
  language?: string | null;
  channel?: string | null;
  user_type?: string | null;
  campaign_context?: string | null;
  transaction_history: TransactionHistoryItem[];
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
  status: string;
  agent_note?: string | null;
  stored_at: string;
  updated_at: string;
}

// --- analytics ---------------------------------------------------------------
export interface SummaryResponse {
  total_tickets: number;
  by_status: Record<string, number>;
  by_severity: Record<string, number>;
  by_case_type: Record<string, number>;
  by_department: Record<string, number>;
  human_review_pending: number;
  average_confidence: number;
  generated_at: string;
}

export interface Pattern {
  pattern_id: string;
  pattern_type: PatternType;
  description: string; // PII-masked on the backend
  severity: Severity;
  affected_ticket_ids: string[];
  recommended_action: string;
  detected_at: string;
}

export interface PatternsResponse {
  generated_at: string;
  ticket_count_analyzed: number;
  patterns: Pattern[];
}

export interface TimelineBucket {
  hour: string;
  total: number;
  by_severity: Record<string, number>;
}

export interface TimelineResponse {
  period: string;
  granularity: string;
  data: TimelineBucket[];
}

// --- misc --------------------------------------------------------------------
export interface HealthResponse {
  status: string;
}

export interface DeleteTicketResponse {
  ticket_id: string;
  deleted: boolean;
}

// Query params for GET /tickets (mirrors the router's Query(...) signature).
export interface ListTicketsParams {
  page?: number;
  limit?: number;
  status?: string;
  severity?: string;
  case_type?: string;
  department?: string;
  human_review_required?: boolean;
  sort_by?: "timestamp" | "severity";
  order?: "asc" | "desc";
}
