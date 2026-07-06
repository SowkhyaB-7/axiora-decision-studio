import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  PlusCircle,
  ClipboardList,
  Settings,
  LifeBuoy,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { title: "Home", to: "/", icon: LayoutDashboard },
  { title: "New Decision Board", to: "/boards/new", icon: PlusCircle },
  { title: "Decision Overview", to: "/boards/demo", icon: ClipboardList },
];

const secondary = [
  { title: "Settings", to: "/", icon: Settings },
  { title: "Help & Docs", to: "/", icon: LifeBuoy },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  return (
    <aside className="hidden md:flex md:w-64 lg:w-72 shrink-0 flex-col border-r border-border bg-surface">
      <div className="flex h-16 items-center gap-2.5 px-6 border-b border-border">
        <div className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="font-display text-xl">Axiora</span>
          <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            Decision Intelligence
          </span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-5">
        <div className="px-3 pb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Workspace
        </div>
        <ul className="space-y-1">
          {nav.map((item) => {
            const active = pathname === item.to;
            return (
              <li key={item.title}>
                <Link
                  to={item.to}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-foreground/75 hover:bg-surface-muted hover:text-foreground",
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.title}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="mt-8 px-3 pb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Recent Boards
        </div>
        <ul className="space-y-0.5">
          {[
            "Pricing tier restructure",
            "Mobile onboarding v3",
            "AI copilot rollout",
            "Enterprise SSO GA",
          ].map((t, idx) => (
            <li key={t}>
              <Link
                to="/boards/$id"
                params={{ id: `board-${idx + 1}` }}
                className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-surface-muted hover:text-foreground"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-accent/70" />
                <span className="truncate">{t}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-border px-3 py-3">
        <ul className="space-y-1">
          {secondary.map((item) => (
            <li key={item.title}>
              <Link
                to={item.to}
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-foreground/70 hover:bg-surface-muted hover:text-foreground"
              >
                <item.icon className="h-4 w-4" />
                {item.title}
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-3 rounded-lg border border-border bg-surface-muted p-3">
          <div className="text-xs font-medium">Team Trial · 12 days left</div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border">
            <div className="h-full w-2/3 rounded-full bg-accent" />
          </div>
          <button className="mt-3 w-full rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90">
            Upgrade plan
          </button>
        </div>
      </div>
    </aside>
  );
}
