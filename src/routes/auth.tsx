import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [{ title: "Sign in — Axiora" }],
  }),
  component: AuthPage,
});

type Mode = "login" | "signup" | "forgot";

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (data.user) navigate({ to: "/dashboard" });
      })
      .catch(() => {
        // Keep the sign-in page mounted if the hosted preview is still
        // hydrating its backend configuration.
      });
  }, [navigate]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (mode === "forgot") {
      if (!email) {
        toast.error("Email is required");
        return;
      }
      setLoading(true);
      setNotice(null);
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setNotice(
          "Check your email for a password reset link. If an account exists for that address, it's on its way.",
        );
        toast.success("Check your email for a password reset link.");
      } catch (err) {
        const raw = err instanceof Error ? err.message : "";
        const message = /rate limit|too many|seconds/i.test(raw)
          ? "We couldn't send the reset email just now because too many were requested. Please wait a few minutes and try again."
          : "We couldn't send the reset email. Please try again in a moment.";
        toast.error(message);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!email || !password) {
      toast.error("Email and password are required");
      return;
    }
    setLoading(true);
    setNotice(null);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back");
        navigate({ to: "/dashboard" });
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: fullName || null },
          },
        });
        if (error) throw error;
        if (data.session) {
          toast.success("Account created");
          navigate({ to: "/dashboard" });
        } else {
          setNotice("Check your email to verify your account.");
        }
      }
    } catch (err) {
      const raw = err instanceof Error ? err.message : "";
      const message = /invalid login credentials/i.test(raw)
        ? "Incorrect email or password. Please try again or reset your password."
        : /email not confirmed/i.test(raw)
          ? "Please confirm your email first — check your inbox for the confirmation link."
          : /rate limit|too many/i.test(raw)
            ? "Too many attempts right now. Please wait a few minutes and try again."
            : raw || "Something went wrong. Please try again.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link to="/auth" className="inline-block font-display text-3xl">
            Axiora
          </Link>
          <p className="mt-2 text-sm text-muted-foreground">
            Decision intelligence for product teams
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6 md:p-8">
          {mode !== "forgot" && (
            <div className="mb-6 grid grid-cols-2 gap-1 rounded-md bg-surface-muted p-1 text-sm">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setNotice(null);
                }}
                className={`rounded-[6px] px-3 py-1.5 font-medium transition ${
                  mode === "login"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setNotice(null);
                }}
                className={`rounded-[6px] px-3 py-1.5 font-medium transition ${
                  mode === "signup"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Create account
              </button>
            </div>
          )}

          {mode === "forgot" && (
            <div className="mb-6">
              <h1 className="font-display text-2xl">Reset your password</h1>
              <p className="mt-1 text-xs text-muted-foreground">
                Enter your account email and we'll send you a reset link.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Full name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
                  placeholder="Maya Ramirez"
                  autoComplete="name"
                />
              </div>
            )}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
                placeholder="you@company.com"
                autoComplete="email"
                required
              />
            </div>
            {mode !== "forgot" && (
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="block text-xs font-medium text-muted-foreground">
                    Password
                  </label>
                  {mode === "login" && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode("forgot");
                        setNotice(null);
                      }}
                      className="text-xs font-medium text-accent hover:underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
                  placeholder="••••••••"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  minLength={6}
                  required
                />
              </div>
            )}

            {notice && (
              <div className="rounded-md border border-info/20 bg-info/10 px-3 py-2 text-xs text-info">
                {notice}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "login"
                ? "Sign in"
                : mode === "signup"
                  ? "Create account"
                  : "Send reset link"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            {mode === "forgot" ? (
              <>
                Remembered your password?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setNotice(null);
                  }}
                  className="font-medium text-accent hover:underline"
                >
                  Back to sign in
                </button>
              </>
            ) : (
              <>
                {mode === "login" ? "New to Axiora?" : "Already have an account?"}{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode(mode === "login" ? "signup" : "login");
                    setNotice(null);
                  }}
                  className="font-medium text-accent hover:underline"
                >
                  {mode === "login" ? "Create an account" : "Sign in"}
                </button>
              </>
            )}
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Exploring Axiora?{" "}
          <Link to="/help" className="font-medium text-accent hover:underline">
            Visit the Help Center
          </Link>
        </p>
      </div>
    </div>
  );
}
