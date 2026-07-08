import { Users, Cog, Briefcase, Workflow, Handshake, type LucideIcon } from "lucide-react";

export type DimensionKey =
  | "customer_validation"
  | "product_technical"
  | "business"
  | "operational"
  | "stakeholder_alignment";

export const DIMENSIONS: {
  key: DimensionKey;
  name: string;
  icon: LucideIcon;
  desc: string;
}[] = [
  { key: "customer_validation", name: "Customer Validation", icon: Users, desc: "Interviews, feedback, usage signals" },
  { key: "product_technical", name: "Product & Technical Readiness", icon: Cog, desc: "Architecture, dependencies, feasibility" },
  { key: "business", name: "Business Readiness", icon: Briefcase, desc: "GTM, pricing, revenue impact" },
  { key: "operational", name: "Operational Readiness", icon: Workflow, desc: "Support, SLAs, runbooks" },
  { key: "stakeholder_alignment", name: "Stakeholder Alignment", icon: Handshake, desc: "Cross-functional sign-off" },
];
