// Questionnaire System Types
// Based on Phase 1 & 2 database schema

// Enums matching database types
export type QuestionResponseType = 
  | 'yes_no'
  | 'yes_no_partial'
  | 'yes_no_na'
  | 'scale'
  | 'text';

export type FindingStatus = 
  | 'open'
  | 'in_progress'
  | 'remediated'
  | 'accepted';

export type RiskLevel = 
  | 'critical'
  | 'high'
  | 'medium'
  | 'low';

// Security Domain IDs
export type SecurityDomainId =
  | 'access_control'
  | 'awareness_training'
  | 'audit_accountability'
  | 'configuration_management'
  | 'contingency_planning'
  | 'incident_response'
  | 'system_protection'
  | 'physical_security';

// Domain metadata for UI
export interface SecurityDomain {
  id: SecurityDomainId;
  name: string;
  description: string;
  nistFamily: string;
  icon: string;
  questionCount: number;
}

// Database row types
export interface AssessmentQuestion {
  id: string;
  domain_id: SecurityDomainId;
  domain_name: string;
  question_text: string;
  help_text: string | null;
  control_id: string;
  response_type: QuestionResponseType;
  risk_weight: number;
  order_index: number;
  finding_template: string | null;
  remediation_template: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AssessmentResponse {
  id: string;
  assessment_id: string;
  question_id: string;
  company_id: string;
  response_value: string;
  notes: string | null;
  creates_finding: boolean;
  answered_at: string;
  answered_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AssessmentFinding {
  id: string;
  assessment_id: string;
  question_id: string;
  response_id: string | null;
  company_id: string;
  control_id: string;
  severity: RiskLevel;
  title: string;
  description: string;
  recommendation: string | null;
  status: FindingStatus;
  poam_entry_id: string | null;
  created_at: string;
  updated_at: string;
}

// Extended assessment type with wizard fields
export interface AssessmentWithWizard {
  id: string;
  company_id: string;
  user_id: string;
  system_name: string;
  environment: string;
  compliance_scope: string;
  status: string;
  current_domain: SecurityDomainId | null;
  completed_domains: SecurityDomainId[];
  domain_scores: Record<SecurityDomainId, number>;
  overall_score: number | null;
  wizard_started_at: string | null;
  wizard_completed_at: string | null;
  created_at: string;
  updated_at: string;
}

// Insert/Update types
export interface AssessmentResponseInsert {
  assessment_id: string;
  question_id: string;
  company_id: string;
  response_value: string;
  notes?: string | null;
  creates_finding?: boolean;
  answered_by?: string | null;
}

export interface AssessmentResponseUpdate {
  response_value?: string;
  notes?: string | null;
  creates_finding?: boolean;
}

export interface AssessmentFindingInsert {
  assessment_id: string;
  question_id: string;
  response_id?: string | null;
  company_id: string;
  control_id: string;
  severity: RiskLevel;
  title: string;
  description: string;
  recommendation?: string | null;
  status?: FindingStatus;
}

export interface AssessmentFindingUpdate {
  status?: FindingStatus;
  recommendation?: string | null;
  poam_entry_id?: string | null;
}

// UI/Computed types
export interface QuestionWithResponse extends AssessmentQuestion {
  response?: AssessmentResponse | null;
}

export interface DomainProgress {
  domain_id: SecurityDomainId;
  domain_name: string;
  total_questions: number;
  answered_questions: number;
  findings_count: number;
  score: number | null;
  is_complete: boolean;
}

export interface WizardProgress {
  total_questions: number;
  answered_questions: number;
  total_findings: number;
  domains: DomainProgress[];
  overall_score: number | null;
  is_complete: boolean;
}

// Response value helpers
export const RESPONSE_VALUES = {
  YES: 'yes',
  NO: 'no',
  PARTIAL: 'partial',
  NA: 'na',
} as const;

export type ResponseValue = typeof RESPONSE_VALUES[keyof typeof RESPONSE_VALUES];

// Determines if a response creates a finding (gap)
export function responseCreatesFinding(
  responseValue: string,
  responseType: QuestionResponseType
): boolean {
  const value = responseValue.toLowerCase();
  
  switch (responseType) {
    case 'yes_no':
    case 'yes_no_partial':
    case 'yes_no_na':
      return value === 'no' || value === 'partial';
    case 'scale':
      // Score of 3 or below (out of 5) creates a finding
      const score = parseInt(value, 10);
      return !isNaN(score) && score <= 3;
    case 'text':
      // Text responses don't auto-create findings
      return false;
    default:
      return false;
  }
}

// Maps risk weight to severity level
export function riskWeightToSeverity(riskWeight: number): RiskLevel {
  if (riskWeight >= 9) return 'critical';
  if (riskWeight >= 7) return 'high';
  if (riskWeight >= 4) return 'medium';
  return 'low';
}

// Security domains metadata for UI
export const SECURITY_DOMAINS: SecurityDomain[] = [
  {
    id: 'access_control',
    name: 'Access Control',
    description: 'User accounts, authentication, and authorization controls',
    nistFamily: 'AC',
    icon: 'KeyRound',
    questionCount: 12,
  },
  {
    id: 'awareness_training',
    name: 'Security Awareness & Training',
    description: 'Employee security training and awareness programs',
    nistFamily: 'AT',
    icon: 'GraduationCap',
    questionCount: 12,
  },
  {
    id: 'audit_accountability',
    name: 'Audit & Accountability',
    description: 'Logging, monitoring, and audit trail capabilities',
    nistFamily: 'AU',
    icon: 'FileSearch',
    questionCount: 12,
  },
  {
    id: 'configuration_management',
    name: 'Configuration Management',
    description: 'System configuration, patching, and change control',
    nistFamily: 'CM',
    icon: 'Settings',
    questionCount: 12,
  },
  {
    id: 'contingency_planning',
    name: 'Contingency Planning',
    description: 'Backup, recovery, and business continuity',
    nistFamily: 'CP',
    icon: 'LifeBuoy',
    questionCount: 12,
  },
  {
    id: 'incident_response',
    name: 'Incident Response',
    description: 'Security incident detection, response, and recovery',
    nistFamily: 'IR',
    icon: 'AlertTriangle',
    questionCount: 12,
  },
  {
    id: 'system_protection',
    name: 'System & Communications Protection',
    description: 'Network security, encryption, and system hardening',
    nistFamily: 'SC',
    icon: 'Shield',
    questionCount: 12,
  },
  {
    id: 'physical_security',
    name: 'Physical & Environmental Protection',
    description: 'Physical access controls and environmental safeguards',
    nistFamily: 'PE',
    icon: 'Building2',
    questionCount: 12,
  },
];

// Get domain by ID
export function getDomainById(domainId: SecurityDomainId): SecurityDomain | undefined {
  return SECURITY_DOMAINS.find(d => d.id === domainId);
}
