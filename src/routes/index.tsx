import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Axiora — Decision Intelligence for Product Teams" },
      {
        name: "description",
        content: "Turn unstructured product work into clear next actions and evidence-grounded decisions.",
      },
      { property: "og:title", content: "Axiora — Decision Intelligence for Product Teams" },
      {
        property: "og:description",
        content: "Turn unstructured product work into clear next actions and evidence-grounded decisions.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: IndexRedirect,
});

function IndexRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth
      .getUser()
      .then(({ data }) => {
        navigate({ to: data.user ? "/dashboard" : "/auth", replace: true });
      })
      .catch(() => {
        navigate({ to: "/auth", replace: true });
      });
  }, [navigate]);

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background px-4 text-foreground">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading Axiora…
      </div>
    </div>
  );
}