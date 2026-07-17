import { Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { ArrowLeft, ExternalLink, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function HelpShell({
  title,
  crumb,
  showBackLink = false,
  children,
}: {
  title: string;
  crumb: string;
  showBackLink?: boolean;
  children: ReactNode;
}) {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) =>
      setSignedIn(!!session),
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-4 px-4 md:px-8">
          <Link to="/help" className="flex items-center gap-2.5">
            <div className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-display text-lg">Axiora</span>
              <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                Help Center
              </span>
            </div>
          </Link>

          <div className="min-w-0 flex-1 text-xs text-muted-foreground hidden sm:flex items-center gap-2">
            <span>Axiora</span>
            <span>/</span>
            <Link to="/help" className="hover:text-foreground">
              Help Center
            </Link>
            {crumb !== "Help Center" && (
              <>
                <span>/</span>
                <span className="truncate text-foreground">{crumb}</span>
              </>
            )}
          </div>

          {signedIn === true ? (
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
            >
              Open App <ExternalLink className="h-3 w-3" />
            </Link>
          ) : (
            <Link
              to="/auth"
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
            >
              Sign In
            </Link>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 md:px-8 md:py-14">
        {showBackLink && (
          <Link
            to="/help"
            className="mb-6 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Help Center
          </Link>
        )}
        <h1 className="font-display text-4xl leading-tight md:text-5xl">{title}</h1>
        <div className="prose-help mt-8">{children}</div>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-5xl px-4 py-8 md:px-8 text-xs text-muted-foreground flex flex-wrap items-center justify-between gap-3">
          <span>Axiora v1.0.0 · Decision Intelligence for Product Teams</span>
          <div className="flex items-center gap-4">
            <Link to="/help/faq" className="hover:text-foreground">
              FAQ
            </Link>
            <Link to="/help/contact" className="hover:text-foreground">
              Contact
            </Link>
            <Link to="/help/legal" className="hover:text-foreground">
              Legal
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
