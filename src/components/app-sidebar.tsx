import { Link, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { LayoutDashboard, PlusCircle, LifeBuoy, Sparkles, Info, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const workspaceNav = [
  { title: "Home", to: "/dashboard", icon: LayoutDashboard },
  { title: "New Decision", to: "/decisions/new", icon: PlusCircle },
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
            Intelligent Workspace
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

const mobileSecondaryNav = [...secondaryNav, { title: "About Axiora", to: "/help/about", icon: Info }];

/** Phone-width access to the same navigation the desktop sidebar shows. */
export function MobileNav() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const [open, setOpen] = useState(false);
  const linkClass = (active: boolean) =>
    cn(
      "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
      active
        ? "bg-primary text-primary-foreground shadow-sm"
        : "text-foreground/75 hover:bg-surface-muted hover:text-foreground",
    );
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="Open navigation"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-border bg-surface md:hidden"
        >
          <Menu className="h-4 w-4" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 bg-surface p-0">
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <div className="flex h-16 items-center gap-2.5 border-b border-border px-6">
          <div className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-display text-xl">Axiora</span>
            <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Intelligent Workspace</span>
          </div>
        </div>
        <nav className="px-3 py-5">
          <div className="px-3 pb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Workspace</div>
          <ul className="space-y-1">
            {[...workspaceNav, ...mobileSecondaryNav].map((item) => (
              <li key={item.title}>
                <Link to={item.to} onClick={() => setOpen(false)} className={linkClass(pathname === item.to)}>
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
