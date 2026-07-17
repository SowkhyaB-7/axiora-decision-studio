import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, PlusCircle, LifeBuoy, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const workspaceNav = [
  { title: "Home", to: "/dashboard", icon: LayoutDashboard },
  { title: "New Decision Board", to: "/boards/new", icon: PlusCircle },
];

const secondaryNav = [{ title: "Help Center", to: "/help", icon: LifeBuoy }];

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
          {workspaceNav.map((item) => {
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
      </nav>

      <div className="border-t border-border px-3 py-3">
        <ul className="space-y-1">
          {secondaryNav.map((item) => {
            const active = pathname.startsWith(item.to);
            return (
              <li key={item.title}>
                <Link
                  to={item.to}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-surface-muted text-foreground"
                      : "text-foreground/70 hover:bg-surface-muted hover:text-foreground",
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.title}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
