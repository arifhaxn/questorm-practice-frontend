// -----------------------------------------------------------------------------
// Typed fetch wrapper. Reads the LIVE backend base URL from VITE_API_BASE_URL.
// One helper per endpoint from CLAUDE.md's endpoint list. No localhost fallback.
// -----------------------------------------------------------------------------
import type {
  AnalyzeBatchRequest,
  AnalyzeBatchResponse,
  AnalyzeTicketRequest,
  AnalyzeTicketResponse,
  DeleteTicketResponse,
  HealthResponse,
  ListTicketsParams,
  PatternsResponse,
  StatusUpdateRequest,
  SummaryResponse,
  TicketDetailResponse,
  TicketListResponse,
  TimelineResponse,
} from "./types";

const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/+$/, "");

/** Thrown for every non-2xx response and for network/config failures. */
export class ApiError extends Error {
  status: number;
  detail: string;
  constructor(status: number, detail: string) {
    super(`API ${status}: ${detail}`);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!BASE_URL || BASE_URL.includes("REPLACE-WITH-LIVE-BACKEND-URL")) {
    throw new ApiError(
      0,
      "VITE_API_BASE_URL is not set to a live backend. Edit frontend/.env and restart `npm run dev`.",
    );
  }

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });
  } catch (err) {
    // CORS, DNS, offline, backend down -> no HTTP status available.
    throw new ApiError(0, err instanceof Error ? err.message : "Network error");
  }

  const text = await res.text();
  const body = text ? safeJson(text) : null;

  if (!res.ok) {
    const detail =
      body && typeof body === "object" && "detail" in body
        ? (body as { detail: unknown }).detail
        : res.statusText;
    throw new ApiError(
      res.status,
      typeof detail === "string" ? detail : JSON.stringify(detail),
    );
  }

  return body as T;
}

function queryString(params: Record<string, unknown> | undefined): string {
  if (!params) return "";
  const usp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      usp.append(key, String(value));
    }
  }
  const s = usp.toString();
  return s ? `?${s}` : "";
}

export const api = {
  // GET /health
  health: () => request<HealthResponse>("/health"),

  // POST /analyze-ticket
  analyzeTicket: (req: AnalyzeTicketRequest) =>
    request<AnalyzeTicketResponse>("/analyze-ticket", {
      method: "POST",
      body: JSON.stringify(req),
    }),

  // POST /analyze-batch
  analyzeBatch: (req: AnalyzeBatchRequest) =>
    request<AnalyzeBatchResponse>("/analyze-batch", {
      method: "POST",
      body: JSON.stringify(req),
    }),

  // GET /tickets
  listTickets: (params?: ListTicketsParams) =>
    request<TicketListResponse>(`/tickets${queryString(params as Record<string, unknown>)}`),

  // GET /tickets/{id}
  getTicket: (id: string) =>
    request<TicketDetailResponse>(`/tickets/${encodeURIComponent(id)}`),

  // PATCH /tickets/{id}/status
  updateTicketStatus: (id: string, body: StatusUpdateRequest) =>
    request<TicketDetailResponse>(`/tickets/${encodeURIComponent(id)}/status`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  // DELETE /tickets/{id}  (soft delete)
  deleteTicket: (id: string) =>
    request<DeleteTicketResponse>(`/tickets/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),

  // GET /analytics/summary
  summary: () => request<SummaryResponse>("/analytics/summary"),

  // GET /analytics/patterns
  patterns: () => request<PatternsResponse>("/analytics/patterns"),

  // GET /analytics/timeline
  timeline: () => request<TimelineResponse>("/analytics/timeline"),
};

export { BASE_URL };
