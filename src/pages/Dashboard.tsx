import { useCallback, useEffect, useState } from "react";

import { api, ApiError } from "../api/client";
import ErrorBanner from "../components/ErrorBanner";
import Loading from "../components/Loading";
import PageHeader from "../components/PageHeader";

type HealthState =
  | { kind: "loading" }
  | { kind: "healthy"; status: string }
  | { kind: "error"; message: string };

export default function Dashboard() {
  const [state, setState] = useState<HealthState>({ kind: "loading" });

  const check = useCallback(async () => {
    setState({ kind: "loading" });
    try {
      const res = await api.health();
      setState({ kind: "healthy", status: res.status });
    } catch (err) {
      const message =
        err instanceof ApiError ? err.detail : "Unexpected error contacting backend";
      setState({ kind: "error", message });
    }
  }, []);

  useEffect(() => {
    void check();
  }, [check]);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Phase 0 — verifying the SPA can reach the live backend."
      />

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">Backend health</h2>
          <button
            onClick={() => void check()}
            className="rounded border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            Re-check
          </button>
        </div>

        {state.kind === "loading" && <Loading label="Pinging /health…" />}

        {state.kind === "healthy" && (
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
              <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
              backend healthy
            </span>
            <span className="text-xs text-slate-400">status: {state.status}</span>
          </div>
        )}

        {state.kind === "error" && (
          <div className="space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-800">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
              backend unreachable
            </span>
            <ErrorBanner message={state.message} onRetry={() => void check()} />
          </div>
        )}
      </section>
    </div>
  );
}
