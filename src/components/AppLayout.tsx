import { NavLink, Outlet } from "react-router-dom";

import { BASE_URL } from "../api/client";

const NAV = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/queue", label: "Queue", end: false },
  { to: "/analyze", label: "Analyze", end: false },
  { to: "/batch", label: "Batch", end: false },
  { to: "/analytics", label: "Analytics", end: false },
];

export default function AppLayout() {
  return (
    <div className="flex min-h-full bg-slate-50 text-slate-900">
      <aside className="flex w-60 shrink-0 flex-col border-r border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4">
          <div className="text-sm font-semibold text-brand">QueueStorm</div>
          <div className="text-xs text-slate-500">Command Center</div>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                [
                  "block rounded-md px-3 py-2 text-sm font-medium",
                  isActive
                    ? "bg-brand text-white"
                    : "text-slate-600 hover:bg-slate-100",
                ].join(" ")
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-slate-200 px-4 py-3 text-[11px] leading-tight text-slate-400">
          <div className="font-medium text-slate-500">Backend</div>
          <div className="break-all">{BASE_URL || "(VITE_API_BASE_URL unset)"}</div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-6xl px-6 py-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
