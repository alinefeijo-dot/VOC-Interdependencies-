export const STAGES = [
  { key: "not_reviewed", label: "Not Reviewed by PDE Team" },
  { key: "reviewed_voc", label: "Reviewed by VOC" },
  { key: "reviewed_pde", label: "Reviewed by PDE Team" },
  { key: "on_roadmap", label: "On Roadmap" },
];

export const TIMELINE_BUCKETS = [
  { key: "unscheduled", label: "Unscheduled" },
  { key: "now", label: "Now" },
  { key: "next", label: "Next" },
  { key: "beyond", label: "Beyond" },
];

export const AXES = {
  stage: { key: "stage", label: "By Review Stage", columns: STAGES, field: "stage" },
  timeline: {
    key: "timeline",
    label: "By Timeline",
    columns: TIMELINE_BUCKETS,
    field: "timelineBucket",
  },
};

export const LINK_TYPE_LABELS = {
  blocks: "blocks",
  related: "relates to",
};

export const TEAMS = [
  "ADx Custody",
  "Asset Management",
  "Atlas",
  "Banking Solutions",
  "Client Solutions & Enablement",
  "Core Experience",
  "Hedgey",
  "Platform Custody",
  "Porto App",
  "Protocols",
  "Trading Solutions",
  "Transparency FBI",
  "Transparency Onboarding Monitoring",
  "Transparency Transaction Risk Management",
  "Wealth",
  "Unassigned",
];

export const REVENUE_TIER_LABELS = {
  "1 - $1MM+": "Tier 1",
  "2 - $250k-$1MM": "Tier 2",
  "3 - $100k-$250k": "Tier 3",
  "4- <100k": "Tier 4",
  "0 - None / Unknown": null,
};
