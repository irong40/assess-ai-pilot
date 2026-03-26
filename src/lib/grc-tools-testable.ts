/**
 * Vitest-compatible GRC tools module.
 *
 * The source of truth is supabase/functions/_shared/grc-tools.ts (Deno context).
 * This file mirrors the testable parts using standard npm imports so vitest
 * can import without Deno npm: specifier resolution issues.
 *
 * Exports: GRC_SYSTEM_PROMPT, GRC_TOOL_NAMES, buildPromptForAction,
 *          createGrcTools, storeGrcResult
 *
 * Keep in sync with: supabase/functions/_shared/grc-tools.ts
 */
import { z } from 'zod';

// ---------- System Prompt (identical to grc-tools.ts) ----------

export const GRC_SYSTEM_PROMPT = `You are the GRC (Governance, Risk & Compliance) Analyst agent for ASSESS-AI, a CMMC compliance platform for small defense contractors. You perform compliance gap analysis following NIST 800-171A methodology.

## Core Assessment Rules

### Rule 1: Objective-Level Evaluation
Evaluate each control at the assessment OBJECTIVE level, not just the control level. Each NIST 800-171 control has multiple assessment objectives (e.g., 3.1.1[a], 3.1.1[b]). A control is MET only if ALL applicable objectives are satisfied. A single failed objective means the entire requirement is NOT_MET. Always list which specific objectives failed.

### Rule 2: Finding Classification
Classify each control finding as exactly one of:
- MET: All assessment objectives satisfied with adequate evidence
- NOT_MET: One or more assessment objectives failed or insufficient evidence
- NOT_APPLICABLE: Control does not apply to the organization's scope

### Rule 3: Evidence Categorization by Method
Categorize all evidence requirements by the NIST 800-171A assessment method:
- examine: Review of documents, policies, procedures, configurations, logs
- interview: Discussions with personnel responsible for implementing controls
- test: Demonstrations, simulations, or technical verification of mechanisms
Each evidence gap must specify which method is needed to close it.

### Rule 4: SPRS Score Calculation
The Supplier Performance Risk System (SPRS) score ranges from -203 to 110. Each of the 110 NIST 800-171 controls has a weighted point value (1, 3, or 5 points). A NOT_MET control deducts its weight from the maximum score of 110. Use the calculateSprsScore tool for accurate scoring.

### Rule 5: POA&M Constraints
Plan of Action and Milestones (POA&M) rules:
- Minimum SPRS score of 80 out of 110 to be POA&M eligible (below 80 = too many gaps for deferral)
- Critical controls CANNOT be deferred to POA&M -- they must be remediated immediately
- All POA&M items must have a remediation deadline within 180 days
- Each POA&M item needs a specific remediation plan, not just "will fix later"

### Rule 6: SSP Alignment to 14 Control Families
System Security Plan (SSP) documentation must be organized by the 14 NIST 800-171 control families:
AC (Access Control), AT (Awareness and Training), AU (Audit and Accountability),
CM (Configuration Management), IA (Identification and Authentication),
IR (Incident Response), MA (Maintenance), MP (Media Protection),
PE (Physical and Environmental Protection), PS (Personnel Security),
RA (Risk Assessment), CA (Security Assessment), SC (System and Communications Protection),
SI (System and Information Integrity).

### Rule 7: Implementation Specificity
Remediation recommendations must be specific and actionable, not generic. Include:
- Concrete implementation steps for the organization's context
- Cost tier (low/medium/high) reflecting typical SMB budgets
- Effort tier (low/medium/high) reflecting team size and expertise needed
- Timeline in days for realistic implementation
- Priority ranking across all remediation options

## Output Format
Always produce structured JSON output conforming to the GapAnalysisReport schema. Include all findings, evidence gaps categorized by method, and remediation options ranked by priority with cost and effort tiers.

## Constraints
- Never fabricate evidence or assessment data -- use tools to query actual assessment responses
- All queries must be scoped to the task's company_id
- Do not exceed the scope of the assigned action (gap-analysis, control-review, remediation-plan, or audit-package)
- When analyzing a specific control family (scope_family_id provided), only evaluate controls in that family`;

export const GRC_TOOL_NAMES = [
  'queryControls',
  'queryAssessmentResponses',
  'queryFindings',
  'calculateSprsScore',
  'getControlFamily',
  'getEvidenceStatus',
] as const;

// ---------- Tool Factory (uses standard zod, no Deno imports) ----------

/**
 * Creates 6 AI SDK tool definitions for the GRC Analyst agent.
 * Returns plain objects with description and parameters properties
 * matching the AI SDK tool() shape for testability.
 */
export function createGrcTools(supabase: any, task: any) {
  const companyId = task.company_id;

  return {
    queryControls: {
      description:
        'Query CMMC controls from the controls table. Filter by control_id, family_id, or cmmc_level. Returns controls with their assessment_objectives for objective-level evaluation.',
      parameters: z.object({
        control_id: z.string().optional().describe("Specific control ID, e.g., '3.1.1'"),
        family_id: z.string().optional().describe("Control family ID, e.g., 'AC' for Access Control"),
        cmmc_level: z.number().int().min(1).max(2).optional().describe('CMMC level (1 or 2)'),
      }),
    },

    queryAssessmentResponses: {
      description:
        'Query assessment responses for a specific assessment, joined with question metadata for control_id mapping. Scoped by company_id.',
      parameters: z.object({
        assessment_id: z.string().uuid().describe('The assessment ID to query responses for'),
        control_id: z.string().optional().describe('Filter by specific control ID'),
      }),
    },

    queryFindings: {
      description:
        'Query existing assessment findings by assessment_id and company_id. Optionally filter by status (MET, NOT_MET, NOT_APPLICABLE).',
      parameters: z.object({
        assessment_id: z.string().uuid().describe('The assessment ID to query findings for'),
        status: z.string().optional().describe('Filter by finding status: MET, NOT_MET, or NOT_APPLICABLE'),
      }),
    },

    calculateSprsScore: {
      description:
        'Calculate the SPRS (Supplier Performance Risk System) score for the company based on current assessment responses. The score ranges from -203 to 110.',
      parameters: z.object({
        assessment_id: z.string().uuid().describe('The assessment ID to calculate SPRS score for'),
      }),
    },

    getControlFamily: {
      description:
        'Get all controls within a specific NIST 800-171 control family, ordered by control_id. Returns the full control details including assessment objectives.',
      parameters: z.object({
        family_id: z.string().describe("The control family ID (e.g., 'AC', 'AT', 'AU')"),
      }),
    },

    getEvidenceStatus: {
      description:
        'Check existing evidence references for specific controls in the assessment findings. Returns which controls have evidence and which have gaps.',
      parameters: z.object({
        assessment_id: z.string().uuid().describe('The assessment ID to check evidence for'),
        control_ids: z.array(z.string()).describe('Array of control IDs to check evidence status for'),
      }),
    },
  };
}

// ---------- Prompt Builder (identical to grc-tools.ts) ----------

export function buildPromptForAction(
  action: string,
  input: Record<string, unknown>
): string {
  const scopeInfo = input.scope_family_id
    ? `Scope: Control family ${input.scope_family_id} only.`
    : 'Scope: Full assessment (all 110 controls).';

  switch (action) {
    case 'gap-analysis':
      return `Perform a comprehensive gap analysis for this company's CMMC compliance posture.

${scopeInfo}
Assessment ID: ${input.assessment_id ?? 'latest'}
CMMC Level: ${input.cmmc_level ?? 2}

Steps:
1. Use queryControls to get the applicable controls (filtered by family if scoped)
2. Use queryAssessmentResponses to get the company's current assessment responses
3. Evaluate each control at the objective level per Rule 1
4. Classify each finding as MET, NOT_MET, or NOT_APPLICABLE per Rule 2
5. For NOT_MET controls, identify evidence gaps by method (examine/interview/test) per Rule 3
6. Use calculateSprsScore to compute the current SPRS score per Rule 4
7. For NOT_MET controls, generate remediation options with cost/effort tiers per Rule 7
8. Check POA&M eligibility per Rule 5

Return a complete GapAnalysisReport as structured JSON.`;

    case 'control-review':
      return `Perform a detailed review of a specific control's compliance status.

Control ID: ${input.control_id ?? 'not specified'}
${scopeInfo}

Steps:
1. Use queryControls to get the full control details including assessment objectives
2. Use queryAssessmentResponses to check the company's responses for this control
3. Use getEvidenceStatus to check existing evidence
4. Evaluate each assessment objective individually
5. Classify the control as MET, NOT_MET, or NOT_APPLICABLE
6. List all evidence gaps by method
7. Generate specific remediation options if NOT_MET

Return the finding details as structured JSON.`;

    case 'remediation-plan':
      return `Generate a prioritized remediation plan for the identified compliance gaps.

${scopeInfo}
Finding IDs: ${JSON.stringify(input.finding_ids ?? [])}

Steps:
1. Use queryFindings to get the current NOT_MET findings
2. For each finding, generate 2-3 remediation options
3. Rank options by cost_tier and effort_tier
4. Calculate timeline_days for each option
5. Check POA&M eligibility (SPRS >= 80/110, no critical controls deferred)
6. Prioritize based on SPRS weight impact (fix high-weight controls first)

Return remediation options organized by priority as structured JSON.`;

    case 'audit-package':
      return `Prepare an audit-ready documentation package organized by control family.

CMMC Level: ${input.cmmc_level ?? 2}
${scopeInfo}

Steps:
1. Use queryControls to get all applicable controls organized by the 14 control families per Rule 6
2. Use queryAssessmentResponses for current assessment status
3. Use getEvidenceStatus to check evidence completeness
4. For each control family, generate an SSP section with:
   - Control ID and title
   - Current compliance status
   - Implementation statement (how the control is implemented)
   - Evidence references (what documents/artifacts support compliance)
5. Flag controls missing evidence or implementation statements

Return AuditPackageSections for each family as structured JSON.`;

    default:
      return `Execute GRC action: ${action}. Input: ${JSON.stringify(input)}. Follow NIST 800-171A methodology rules.`;
  }
}

// ---------- Result Storage (identical to grc-tools.ts) ----------

export async function storeGrcResult(
  supabase: any,
  task: any,
  report: {
    assessment_date: string;
    cmmc_level: number;
    scope_family_id?: string | null;
    sprs_score: number;
    total_controls: number;
    met_count: number;
    not_met_count: number;
    not_applicable_count: number;
    findings: unknown[];
  }
): Promise<{ resultId?: string; error?: string }> {
  // 1. Insert into gap_analysis_results
  const { data: grcResult, error: insertError } = await supabase
    .from('gap_analysis_results')
    .insert({
      company_id: task.company_id,
      assessment_id: task.input?.assessment_id ?? null,
      agent_task_id: task.id,
      cmmc_level: report.cmmc_level,
      scope_family_id: report.scope_family_id ?? null,
      report,
      sprs_score_at_analysis: report.sprs_score,
      findings_count: report.findings.length,
    })
    .select('id')
    .single();

  if (insertError) {
    return { error: insertError.message };
  }

  // 2. Create compliance snapshot
  await supabase.from('compliance_snapshots').insert({
    company_id: task.company_id,
    assessment_id: task.input?.assessment_id ?? null,
    sprs_score: report.sprs_score,
    total_controls: report.total_controls,
    met_count: report.met_count,
    not_met_count: report.not_met_count,
    not_applicable_count: report.not_applicable_count,
    cmmc_level: report.cmmc_level,
    critical_controls_met: false,
    poam_eligible: report.sprs_score >= 80,
    triggered_by: 'grc-analyst',
    agent_task_id: task.id,
  });

  return { resultId: grcResult?.id };
}
