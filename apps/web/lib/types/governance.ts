/**
 * Shared governance types — used across lineage, POPIA, compliance, and access components.
 */

export type Vertical = "telecom" | "security" | "mining" | "engineering";

export const VERTICAL_LABELS: Record<Vertical, string> = {
  telecom:     "Telecommunications",
  security:    "Security",
  mining:      "Mining",
  engineering: "Engineering",
};

export const VERTICAL_COLORS: Record<Vertical, string> = {
  telecom:     "#8B5CF6",
  security:    "#F59E0B",
  mining:      "#10B981",
  engineering: "#EC4899",
};

/**
 * Vertical-specific compliance rules.
 * Used in RetentionPolicies (minimum retention), ColumnMasking (required masks),
 * and ClassificationPanel (required classifications).
 */
export interface VerticalComplianceRule {
  id: string;
  vertical: Vertical;
  regulation: string;
  category: "retention" | "masking" | "classification" | "access";
  dataPattern: string;         // matches dataset or column name (substring)
  requirement: string;         // human-readable requirement
  /** For retention rules: minimum days required */
  minRetentionDays?: number;
  /** For masking rules: columns that MUST be masked */
  requiredMaskedColumns?: string[];
  /** Severity if violated */
  severity: "critical" | "high" | "medium";
}

export const VERTICAL_COMPLIANCE_RULES: VerticalComplianceRule[] = [
  // ── Telecom: RICA ─────────────────────────────────────────────────────────
  {
    id: "rica-cdr-retention",
    vertical: "telecom",
    regulation: "RICA",
    category: "retention",
    dataPattern: "CDR",
    requirement: "CDR data must be retained for a minimum of 3 years (1 095 days)",
    minRetentionDays: 1095,
    severity: "critical",
  },
  {
    id: "rica-subscriber-retention",
    vertical: "telecom",
    regulation: "RICA",
    category: "retention",
    dataPattern: "Customer",
    requirement: "Subscriber registration data must be retained for a minimum of 5 years (1 825 days)",
    minRetentionDays: 1825,
    severity: "critical",
  },
  {
    id: "rica-msisdn-masking",
    vertical: "telecom",
    regulation: "RICA",
    category: "masking",
    dataPattern: "CDR",
    requirement: "MSISDN must be pseudonymised or masked for all non-authorised roles",
    requiredMaskedColumns: ["msisdn"],
    severity: "high",
  },
  {
    id: "rica-imei-masking",
    vertical: "telecom",
    regulation: "RICA",
    category: "masking",
    dataPattern: "CDR",
    requirement: "IMEI must be hashed or masked for Viewer and Analyst roles",
    requiredMaskedColumns: ["imei"],
    severity: "high",
  },

  // ── Security: PSIRA ───────────────────────────────────────────────────────
  {
    id: "psira-biometric-retention",
    vertical: "security",
    regulation: "PSIRA",
    category: "retention",
    dataPattern: "CCTV",
    requirement: "Biometric data (face embeddings) must not be retained longer than 12 months (365 days)",
    minRetentionDays: 1,       // must have a policy
    severity: "critical",
  },
  {
    id: "psira-face-masking",
    vertical: "security",
    regulation: "PSIRA",
    category: "masking",
    dataPattern: "CCTV",
    requirement: "Face embeddings must be suppressed or nulled for all non-admin roles",
    requiredMaskedColumns: ["face_embedding"],
    severity: "critical",
  },
  {
    id: "psira-evidence-classification",
    vertical: "security",
    regulation: "PSIRA / CPA",
    category: "classification",
    dataPattern: "CCTV",
    requirement: "Surveillance data containing biometric features must be classified as Special Personal Data",
    severity: "high",
  },

  // ── Mining: MHSA / DMRE ───────────────────────────────────────────────────
  {
    id: "mhsa-safety-retention",
    vertical: "mining",
    regulation: "MHSA",
    category: "retention",
    dataPattern: "Safety",
    requirement: "Mine safety records must be retained for a minimum of 5 years (1 825 days)",
    minRetentionDays: 1825,
    severity: "critical",
  },
  {
    id: "mhsa-worker-retention",
    vertical: "mining",
    regulation: "MHSA",
    category: "retention",
    dataPattern: "Mineworker",
    requirement: "Worker occupational health records must be retained for at least 5 years (1 825 days)",
    minRetentionDays: 1825,
    severity: "high",
  },
  {
    id: "mhsa-biometric-masking",
    vertical: "mining",
    regulation: "MHSA / POPIA",
    category: "masking",
    dataPattern: "Mineworker",
    requirement: "Biometric hashes must be redacted for Viewer, Analyst, and ML Engineer roles",
    requiredMaskedColumns: ["biometric_hash"],
    severity: "high",
  },

  // ── Engineering: ECSA ─────────────────────────────────────────────────────
  {
    id: "ecsa-inspection-retention",
    vertical: "engineering",
    regulation: "ECSA",
    category: "retention",
    dataPattern: "Inspection",
    requirement: "Structural inspection records must be retained for a minimum of 10 years (3 650 days)",
    minRetentionDays: 3650,
    severity: "critical",
  },
  {
    id: "ecsa-defect-retention",
    vertical: "engineering",
    regulation: "ECSA",
    category: "retention",
    dataPattern: "Defect",
    requirement: "Defect reports must be retained for a minimum of 10 years (3 650 days)",
    minRetentionDays: 3650,
    severity: "high",
  },
];
