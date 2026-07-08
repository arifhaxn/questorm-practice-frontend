import { NavLink, Outlet } from "react-router-dom";

import { BASE_URL } from "../api/client";
import { useTheme } from "../theme";

const NAV = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/queue", label: "Queue", end: false },
  { to: "/analyze", label: "Analyze", end: false },
  { to: "/batch", label: "Batch", end: false },
  { to: "/analytics", label: "Analytics", end: false },
];

function ThemeToggle() {
  const { resolvedTheme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      className="grid size-9 place-items-center rounded-pill bg-surface-high text-primary transition-colors duration-fast hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      title={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
      aria-label="Toggle theme"
    >
      {resolvedTheme === "dark" ? "☀" : "☾"}
    </button>
  );
}

export default function AppLayout() {
  return (
    <div className="flex min-h-full bg-background text-primary">
      <aside className="flex w-60 shrink-0 flex-col border-r border-default bg-surface">
        <div className="flex items-center justify-between border-b border-default px-5 py-4">
          <div>
            <div className="text-title-lg text-brand">QueueStorm</div>
            <div className="text-body-sm text-tertiary">Command Center</div>
          </div>
          <ThemeToggle />
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                [
                  "block rounded-md px-3 py-2 text-label-md transition-colors duration-fast",
                  isActive
                    ? "bg-brand text-on-brand"
                    : "text-secondary hover:bg-surface-high",
                ].join(" ")
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-default px-4 py-3 text-body-sm leading-tight text-tertiary">
          <div className="font-semibold text-secondary">Backend</div>
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
