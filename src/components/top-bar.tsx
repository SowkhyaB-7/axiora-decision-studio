import { Bell, Search, ChevronDown, Command } from "lucide-react";

export function TopBar({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background/80 px-4 backdrop-blur md:px-8">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Axiora</span>
          <span>/</span>
          <span className="truncate text-foreground">{title}</span>
        </div>
        {subtitle && (
          <div className="hidden text-xs text-muted-foreground sm:block">{subtitle}</div>
        )}
      </div>

      <div className="hidden lg:flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-muted-foreground w-80">
        <Search className="h-4 w-4" />
        <span className="flex-1 truncate">Search boards, evidence, people…</span>
        <kbd className="inline-flex items-center gap-1 rounded border border-border bg-surface-muted px-1.5 py-0.5 text-[10px] font-medium">
          <Command className="h-3 w-3" /> K
        </kbd>
      </div>

      <button className="grid h-9 w-9 place-items-center rounded-md border border-border bg-surface text-muted-foreground hover:text-foreground">
        <Bell className="h-4 w-4" />
      </button>

      <button className="flex items-center gap-2 rounded-md border border-border bg-surface px-2 py-1.5">
        <div className="grid h-6 w-6 place-items-center rounded-full bg-accent text-[10px] font-semibold text-accent-foreground">
          MR
        </div>
        <div className="hidden text-left leading-tight sm:block">
          <div className="text-xs font-medium">Maya Ramirez</div>
          <div className="text-[10px] text-muted-foreground">Product Lead</div>
        </div>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
      </button>
    </header>
  );
}
