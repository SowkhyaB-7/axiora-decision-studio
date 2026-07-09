import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Bell, Search, ChevronDown, Command, LogOut } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export function TopBar({ title, subtitle }: { title: string; subtitle?: string }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string | null>(null);
  const [fullName, setFullName] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
      const name = (data.user?.user_metadata as { full_name?: string } | null)?.full_name;
      setFullName(name ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
      const name = (session?.user?.user_metadata as { full_name?: string } | null)?.full_name;
      setFullName(name ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(error.message);
      return;
    }
    navigate({ to: "/auth", replace: true });
  }

  const displayName = fullName || email || "Signed in";
  const initials = (fullName || email || "?")
    .split(/[\s@]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("") || "?";

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

      <div className="relative">
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="flex items-center gap-2 rounded-md border border-border bg-surface px-2 py-1.5"
        >
          <div className="grid h-6 w-6 place-items-center rounded-full bg-accent text-[10px] font-semibold text-accent-foreground">
            {initials}
          </div>
          <div className="hidden max-w-[140px] text-left leading-tight sm:block">
            <div className="truncate text-xs font-medium">{displayName}</div>
            <div className="text-[10px] text-muted-foreground">Signed in</div>
          </div>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
        {menuOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setMenuOpen(false)}
              aria-hidden
            />
            <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-md border border-border bg-surface shadow-lg">
              <div className="border-b border-border px-3 py-2">
                <div className="truncate text-xs font-medium">{displayName}</div>
                {email && fullName && (
                  <div className="truncate text-[10px] text-muted-foreground">{email}</div>
                )}
              </div>
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-surface-muted"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
