import { Users, Cog, Briefcase, Workflow, Handshake, type LucideIcon } from "lucide-react";

export type DimensionKey =
  | "customer_validation"
  | "product_technical"
  | "business"
  | "operational"
  | "stakeholder_alignment";

export type DimensionConfig = {
  key: DimensionKey;
  slug: string;
  name: string;
  icon: LucideIcon;
  desc: string;
  /** Evidence types considered central to this dimension's readiness. */
  keyEvidenceTypes: string[];
};

export const DIMENSIONS: DimensionConfig[] = [
  {
    key: "customer_validation",
    slug: "customer-validation",
    name: "Customer Validation",
    icon: Users,
    desc: "Interviews, feedback, usage signals",
    keyEvidenceTypes: [
      "Customer Interview",
      "Customer Feedback",
      "Usage Analytics",
      "Survey",
      "Prototype Test",
    ],
  },
  {
    key: "product_technical",
    slug: "product-technical",
    name: "Product & Technical Readiness",
    icon: Cog,
    desc: "Architecture, dependencies, feasibility",
    keyEvidenceTypes: [
      "Prototype Test",
      "Usage Analytics",
      "Competitor Insight",
    ],
  },
  {
    key: "business",
    slug: "business",
    name: "Business Readiness",
    icon: Briefcase,
    desc: "GTM, pricing, revenue impact",
    keyEvidenceTypes: [
      "Market Research",
      "Competitor Insight",
      "Sales Call",
    ],
  },
  {
    key: "operational",
    slug: "operational",
    name: "Operational Readiness",
    icon: Workflow,
    desc: "Support, SLAs, runbooks",
    keyEvidenceTypes: [
      "Support Ticket",
      "Usage Analytics",
    ],
  },
  {
    key: "stakeholder_alignment",
    slug: "stakeholder-alignment",
    name: "Stakeholder Alignment",
    icon: Handshake,
    desc: "Cross-functional sign-off",
    keyEvidenceTypes: [
      "Stakeholder Feedback",
      "Survey",
    ],
  },
];

export const DIMENSIONS_BY_KEY: Record<DimensionKey, DimensionConfig> =
  DIMENSIONS.reduce(
    (acc, d) => {
      acc[d.key] = d;
      return acc;
    },
    {} as Record<DimensionKey, DimensionConfig>,
  );

export const DIMENSIONS_BY_SLUG: Record<string, DimensionConfig> =
  DIMENSIONS.reduce(
    (acc, d) => {
      acc[d.slug] = d;
      return acc;
    },
    {} as Record<string, DimensionConfig>,
  );
