import { createFileRoute } from "@tanstack/react-router";
import { HelpShell } from "@/components/help-shell";
import { HelpMermaid } from "@/components/help-mermaid";

export const Route = createFileRoute("/help/architecture")({
  head: () => ({ meta: [{ title: "Architecture — Axiora Help Center" }] }),
  component: Page,
});

const appArch = `flowchart LR
  U[Browser] --> FE[React + TanStack Start]
  FE --> SB[(Supabase)]
  SB --> PG[(Postgres · RLS)]
  SB --> AU[Supabase Auth]
  SB --> ST[Supabase Storage]
  FE -.->|scoring runs in browser| AN[Readiness Formula]`;

const authFlow = `sequenceDiagram
  participant U as User
  participant FE as Frontend
  participant SA as Supabase Auth
  U->>FE: Enter email + password
  FE->>SA: signInWithPassword()
  SA-->>FE: JWT session
  FE->>FE: Persist + refresh session
  FE->>U: Redirect to Home`;

const evidenceFlow = `flowchart LR
  U[User] -->|log observation| FE[Evidence form]
  FE --> V{Future-date check}
  V -->|pass| DB[(evidence table)]
  FE --> FS[Storage: user-scoped folder]
  FS --> DB`;

const analysisFlow = `flowchart TD
  E[(Evidence per dimension)] --> F[Deterministic formula]
  F --> R[Readiness score]
  F --> C[Confidence score]
  F --> S[Strengths / Risks / Actions]
  R --> V[(ai_analyses row, v+1)]
  C --> V
  S --> V`;

const dbRel = `erDiagram
  profiles ||--o{ decision_boards : owns
  decision_boards ||--o{ assessment_dimensions : has
  decision_boards ||--o{ evidence : contains
  decision_boards ||--o{ ai_analyses : records
  decision_boards ||--o{ final_decisions : may_have
  assessment_dimensions ||--o{ evidence : groups`;

const storageArch = `flowchart LR
  UP[Uploader] --> BK[(evidence-attachments bucket)]
  BK --> UF[user-id/ folder]
  UF --> FILE[file blob]
  RLS[Row Level Security] --- BK
  RLS --- UF`;

const deployPipeline = `flowchart LR
  DEV[Lovable Editor] <--> GH[(GitHub)]
  GH --> BUILD[Vite + Nitro build]
  BUILD --> HOST[Cloudflare-compatible host]
  HOST --> USR[End user]`;

function Page() {
  return (
    <HelpShell title="Architecture" crumb="Architecture" showBackLink>
      <p className="lead">
        Axiora is a single web application with no separate backend service. The
        frontend talks directly to Supabase for authentication, data, and file storage.
        There is no server-side AI component — readiness analysis runs as a formula in
        application code.
      </p>

      <blockquote>
        There is no Supabase Edge Function and no call to any external AI provider
        anywhere in the app. Readiness scoring happens entirely in the browser.
      </blockquote>

      <h2>Application architecture</h2>
      <HelpMermaid chart={appArch} caption="High-level architecture." />

      <h2>Frontend</h2>
      <ul>
        <li>React 19 with TypeScript</li>
        <li>TanStack Router / TanStack Start for routing and server-side rendering</li>
        <li>Vite for building and local development</li>
        <li>Tailwind CSS with Radix UI primitives for components</li>
      </ul>

      <h2>Authentication</h2>
      <p>
        Handled entirely by Supabase Auth. Sessions persist in the browser and refresh
        automatically.
      </p>
      <HelpMermaid chart={authFlow} caption="Sign-in flow." />

      <h2>Evidence flow</h2>
      <HelpMermaid chart={evidenceFlow} caption="How evidence gets from a user's screen to storage." />

      <h2>Readiness analysis flow</h2>
      <HelpMermaid chart={analysisFlow} caption="Every analysis run appends a new version." />

      <h2>Database</h2>
      <p>
        Core tables: <code>profiles</code>, <code>decision_boards</code>,{" "}
        <code>assessment_dimensions</code>, <code>evidence</code>,{" "}
        <code>ai_analyses</code>, <code>final_decisions</code>. The analyses table is
        named <code>ai_analyses</code> for historical reasons — its contents are
        produced by the deterministic formula, not an AI model. The{" "}
        <code>final_decisions</code> table exists but isn't read from or written to
        anywhere. <code>blocking_condition_reason</code> exists but isn't set or
        displayed anywhere yet. Every table has Row Level Security scoped to the
        authenticated owner.
      </p>
      <HelpMermaid chart={dbRel} caption="Database relationships." />

      <h2>Storage</h2>
      <p>
        Evidence attachments live in a private Supabase Storage bucket, namespaced by
        user ID so one user cannot access another's files.
      </p>
      <HelpMermaid chart={storageArch} caption="Storage isolation model." />

      <h2>Deployment, GitHub &amp; Lovable</h2>
      <p>
        The project is developed in Lovable and synced to GitHub two-way. The build is a
        standard Vite + Nitro (TanStack Start) production bundle. The build
        configuration targets Cloudflare via Nitro by default; if Axiora is deployed
        elsewhere, that's a hosting-level choice outside this repository.
      </p>
      <HelpMermaid chart={deployPipeline} caption="Deployment pipeline." />
    </HelpShell>
  );
}
