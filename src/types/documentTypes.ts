// ============================================================================
// RMF Document Type System - Centralized Type Definitions
// ============================================================================

import {
  FileText,
  ClipboardCheck,
  ListTodo,
  Award,
  AlertTriangle,
  Activity,
  Shield,
  ClipboardList,
  Map,
  Users,
  Network,
  Package,
  Layers,
  CheckSquare,
  Link,
  Handshake,
  FileCheck,
  Scan,
  Bug,
  FileSearch,
  AlertCircle,
  BookOpen,
  Info,
  ShieldAlert,
  File,
  type LucideIcon,
} from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

export type RMFDocumentType =
  // Core Authorization Documents
  | "ssp"
  | "sar"
  | "poam"
  | "ato"
  | "rar"
  | "cms"
  // Security Policies & Procedures
  | "policy"
  | "procedure"
  | "plan"
  | "rup"
  // Technical Documentation
  | "diagram"
  | "inventory"
  | "baseline"
  | "stig"
  // Agreements & External
  | "isa"
  | "mou"
  | "sla"
  // Assessment Artifacts
  | "scan_report"
  | "pentest"
  | "audit_report"
  | "assessment"
  | "finding"
  // Reference Materials
  | "framework"
  | "guidance"
  | "threat_intel"
  // Other
  | "other";

export type DocumentCategory =
  | "core"
  | "policy"
  | "technical"
  | "agreement"
  | "assessment"
  | "reference";

export interface DocumentTypeMetadata {
  label: string;
  description: string;
  category: DocumentCategory;
  icon: LucideIcon;
  requiredForATO: boolean;
  sortOrder: number;
}

// ============================================================================
// DOCUMENT TYPE METADATA
// ============================================================================

export const RMF_DOCUMENT_TYPES: Record<RMFDocumentType, DocumentTypeMetadata> = {
  // Core Authorization Documents
  ssp: {
    label: "System Security Plan",
    description: "Comprehensive security documentation describing system boundaries, controls, and implementation",
    category: "core",
    icon: FileText,
    requiredForATO: true,
    sortOrder: 1,
  },
  sar: {
    label: "Security Assessment Report",
    description: "Results of security control assessment including findings and recommendations",
    category: "core",
    icon: ClipboardCheck,
    requiredForATO: true,
    sortOrder: 2,
  },
  poam: {
    label: "Plan of Action & Milestones",
    description: "Documented plan for addressing security weaknesses and deficiencies",
    category: "core",
    icon: ListTodo,
    requiredForATO: true,
    sortOrder: 3,
  },
  ato: {
    label: "Authorization Decision",
    description: "Official authorization to operate decision letter from AO",
    category: "core",
    icon: Award,
    requiredForATO: true,
    sortOrder: 4,
  },
  rar: {
    label: "Risk Assessment Report",
    description: "Analysis of security risks and their potential impact",
    category: "core",
    icon: AlertTriangle,
    requiredForATO: true,
    sortOrder: 5,
  },
  cms: {
    label: "Continuous Monitoring Strategy",
    description: "Ongoing assessment and authorization maintenance plan",
    category: "core",
    icon: Activity,
    requiredForATO: false,
    sortOrder: 6,
  },

  // Security Policies & Procedures
  policy: {
    label: "Security Policy",
    description: "Organizational security policies and standards",
    category: "policy",
    icon: Shield,
    requiredForATO: false,
    sortOrder: 10,
  },
  procedure: {
    label: "Procedure",
    description: "Step-by-step operational procedures",
    category: "policy",
    icon: ClipboardList,
    requiredForATO: false,
    sortOrder: 11,
  },
  plan: {
    label: "Security Plan",
    description: "Security-related plans (Contingency, IR, etc.)",
    category: "policy",
    icon: Map,
    requiredForATO: false,
    sortOrder: 12,
  },
  rup: {
    label: "Rules of Behavior",
    description: "Acceptable use policies and user agreements",
    category: "policy",
    icon: Users,
    requiredForATO: false,
    sortOrder: 13,
  },

  // Technical Documentation
  diagram: {
    label: "Network/Data Flow Diagram",
    description: "System architecture and data flow visualizations",
    category: "technical",
    icon: Network,
    requiredForATO: false,
    sortOrder: 20,
  },
  inventory: {
    label: "Asset Inventory",
    description: "Hardware and software asset documentation",
    category: "technical",
    icon: Package,
    requiredForATO: false,
    sortOrder: 21,
  },
  baseline: {
    label: "Security Baseline",
    description: "Secure configuration standards and baselines",
    category: "technical",
    icon: Layers,
    requiredForATO: false,
    sortOrder: 22,
  },
  stig: {
    label: "STIG Checklist",
    description: "Security Technical Implementation Guide compliance",
    category: "technical",
    icon: CheckSquare,
    requiredForATO: false,
    sortOrder: 23,
  },

  // Agreements & External
  isa: {
    label: "Interconnection Security Agreement",
    description: "Security agreements for system interconnections",
    category: "agreement",
    icon: Link,
    requiredForATO: false,
    sortOrder: 30,
  },
  mou: {
    label: "Memorandum of Understanding",
    description: "Formal agreements between organizations",
    category: "agreement",
    icon: Handshake,
    requiredForATO: false,
    sortOrder: 31,
  },
  sla: {
    label: "Service Level Agreement",
    description: "Service provider security requirements",
    category: "agreement",
    icon: FileCheck,
    requiredForATO: false,
    sortOrder: 32,
  },

  // Assessment Artifacts
  scan_report: {
    label: "Vulnerability Scan Report",
    description: "Automated vulnerability scanner results",
    category: "assessment",
    icon: Scan,
    requiredForATO: false,
    sortOrder: 40,
  },
  pentest: {
    label: "Penetration Test Report",
    description: "Manual security testing results",
    category: "assessment",
    icon: Bug,
    requiredForATO: false,
    sortOrder: 41,
  },
  audit_report: {
    label: "Audit Report",
    description: "Third-party security audit findings",
    category: "assessment",
    icon: FileSearch,
    requiredForATO: false,
    sortOrder: 42,
  },
  assessment: {
    label: "Assessment Document",
    description: "General assessment documentation",
    category: "assessment",
    icon: ClipboardCheck,
    requiredForATO: false,
    sortOrder: 43,
  },
  finding: {
    label: "Security Finding",
    description: "Individual security findings and observations",
    category: "assessment",
    icon: AlertCircle,
    requiredForATO: false,
    sortOrder: 44,
  },

  // Reference Materials
  framework: {
    label: "Framework Reference",
    description: "NIST, CMMC, FedRAMP framework documentation",
    category: "reference",
    icon: BookOpen,
    requiredForATO: false,
    sortOrder: 50,
  },
  guidance: {
    label: "Agency Guidance",
    description: "Agency-specific guidance documents",
    category: "reference",
    icon: Info,
    requiredForATO: false,
    sortOrder: 51,
  },
  threat_intel: {
    label: "Threat Intelligence",
    description: "Threat intelligence and vulnerability data",
    category: "reference",
    icon: ShieldAlert,
    requiredForATO: false,
    sortOrder: 52,
  },

  // Other
  other: {
    label: "Other Document",
    description: "Uncategorized documents",
    category: "reference",
    icon: File,
    requiredForATO: false,
    sortOrder: 99,
  },
};

// ============================================================================
// CATEGORY METADATA
// ============================================================================

export const DOCUMENT_CATEGORIES: Record<DocumentCategory, { label: string; description: string }> = {
  core: {
    label: "Core Authorization",
    description: "Essential documents for ATO package",
  },
  policy: {
    label: "Policies & Procedures",
    description: "Security policies and operational procedures",
  },
  technical: {
    label: "Technical Documentation",
    description: "System architecture and configuration docs",
  },
  agreement: {
    label: "Agreements",
    description: "External agreements and MOUs",
  },
  assessment: {
    label: "Assessment Artifacts",
    description: "Scan reports, findings, and audit results",
  },
  reference: {
    label: "Reference Materials",
    description: "Frameworks, guidance, and threat intel",
  },
};

// ============================================================================
// GROUPED DOCUMENT TYPES (for UI filters)
// ============================================================================

export interface DocumentTypeGroup {
  category: DocumentCategory;
  label: string;
  types: Array<{
    value: RMFDocumentType;
    label: string;
    icon: LucideIcon;
  }>;
}

export const DOCUMENT_TYPE_GROUPS: DocumentTypeGroup[] = [
  {
    category: "core",
    label: "Core Authorization",
    types: [
      { value: "ssp", label: "SSP", icon: FileText },
      { value: "sar", label: "SAR", icon: ClipboardCheck },
      { value: "poam", label: "POA&M", icon: ListTodo },
      { value: "ato", label: "ATO", icon: Award },
      { value: "rar", label: "RAR", icon: AlertTriangle },
      { value: "cms", label: "CMS", icon: Activity },
    ],
  },
  {
    category: "policy",
    label: "Policies & Procedures",
    types: [
      { value: "policy", label: "Policies", icon: Shield },
      { value: "procedure", label: "Procedures", icon: ClipboardList },
      { value: "plan", label: "Plans", icon: Map },
      { value: "rup", label: "Rules of Behavior", icon: Users },
    ],
  },
  {
    category: "technical",
    label: "Technical Docs",
    types: [
      { value: "diagram", label: "Diagrams", icon: Network },
      { value: "inventory", label: "Inventory", icon: Package },
      { value: "baseline", label: "Baselines", icon: Layers },
      { value: "stig", label: "STIGs", icon: CheckSquare },
    ],
  },
  {
    category: "agreement",
    label: "Agreements",
    types: [
      { value: "isa", label: "ISA", icon: Link },
      { value: "mou", label: "MOU", icon: Handshake },
      { value: "sla", label: "SLA", icon: FileCheck },
    ],
  },
  {
    category: "assessment",
    label: "Assessments",
    types: [
      { value: "scan_report", label: "Scans", icon: Scan },
      { value: "pentest", label: "Pen Tests", icon: Bug },
      { value: "audit_report", label: "Audits", icon: FileSearch },
      { value: "finding", label: "Findings", icon: AlertCircle },
    ],
  },
  {
    category: "reference",
    label: "Reference",
    types: [
      { value: "framework", label: "Frameworks", icon: BookOpen },
      { value: "guidance", label: "Guidance", icon: Info },
      { value: "threat_intel", label: "Threat Intel", icon: ShieldAlert },
      { value: "other", label: "Other", icon: File },
    ],
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getDocumentTypeMetadata(type: RMFDocumentType): DocumentTypeMetadata {
  return RMF_DOCUMENT_TYPES[type];
}

export function getATORequiredTypes(): RMFDocumentType[] {
  return (Object.keys(RMF_DOCUMENT_TYPES) as RMFDocumentType[]).filter(
    (type) => RMF_DOCUMENT_TYPES[type].requiredForATO
  );
}

export function getTypesByCategory(category: DocumentCategory): RMFDocumentType[] {
  return (Object.keys(RMF_DOCUMENT_TYPES) as RMFDocumentType[]).filter(
    (type) => RMF_DOCUMENT_TYPES[type].category === category
  );
}

export function isValidDocumentType(type: string): type is RMFDocumentType {
  return type in RMF_DOCUMENT_TYPES;
}
