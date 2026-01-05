// Findings Generator Service
// Automatically creates assessment_findings from wizard responses based on risk_weight and creates_finding logic

import { supabase } from "@/integrations/supabase/client";
import type {
  AssessmentQuestion,
  AssessmentFindingInsert,
  RiskLevel,
} from "@/types/questionnaire";
import { riskWeightToSeverity } from "@/types/questionnaire";

export interface FindingGeneratorInput {
  assessmentId: string;
  questionId: string;
  responseId: string;
  responseValue: string;
  companyId: string;
}

export interface GeneratedFinding {
  question_id: string;
  response_id: string;
  control_id: string;
  severity: RiskLevel;
  title: string;
  description: string;
  recommendation: string | null;
}

/**
 * Generates a finding from a response that creates a gap
 */
export async function generateFindingFromResponse(
  input: FindingGeneratorInput
): Promise<GeneratedFinding | null> {
  // Fetch the question details
  const { data: question, error } = await supabase
    .from('assessment_questions')
    .select('*')
    .eq('id', input.questionId)
    .single();

  if (error || !question) {
    console.error('Error fetching question for finding generation:', error);
    return null;
  }

  const typedQuestion = question as AssessmentQuestion;

  // Generate finding using question templates or defaults
  const severity = riskWeightToSeverity(typedQuestion.risk_weight);
  
  const title = typedQuestion.finding_template 
    ? interpolateTemplate(typedQuestion.finding_template, typedQuestion, input.responseValue)
    : `Gap Identified: ${typedQuestion.control_id}`;

  const description = buildFindingDescription(typedQuestion, input.responseValue);
  
  const recommendation = typedQuestion.remediation_template
    ? interpolateTemplate(typedQuestion.remediation_template, typedQuestion, input.responseValue)
    : null;

  return {
    question_id: input.questionId,
    response_id: input.responseId,
    control_id: typedQuestion.control_id,
    severity,
    title,
    description,
    recommendation,
  };
}

/**
 * Creates a finding in the database
 */
export async function createFinding(
  assessmentId: string,
  companyId: string,
  finding: GeneratedFinding
): Promise<{ id: string } | null> {
  const findingInsert: AssessmentFindingInsert = {
    assessment_id: assessmentId,
    question_id: finding.question_id,
    response_id: finding.response_id,
    company_id: companyId,
    control_id: finding.control_id,
    severity: finding.severity,
    title: finding.title,
    description: finding.description,
    recommendation: finding.recommendation,
    status: 'open',
  };

  const { data, error } = await supabase
    .from('assessment_findings')
    .insert(findingInsert)
    .select('id')
    .single();

  if (error) {
    console.error('Error creating finding:', error);
    return null;
  }

  return data;
}

/**
 * Removes an existing finding for a question (when response changes to non-gap)
 */
export async function removeFindingForQuestion(
  assessmentId: string,
  questionId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('assessment_findings')
    .delete()
    .eq('assessment_id', assessmentId)
    .eq('question_id', questionId);

  if (error) {
    console.error('Error removing finding:', error);
    return false;
  }

  return true;
}

/**
 * Syncs findings with response - creates or removes finding based on response
 */
export async function syncFindingWithResponse(
  input: FindingGeneratorInput,
  createsFinding: boolean
): Promise<void> {
  if (createsFinding) {
    // Check if finding already exists
    const { data: existingFinding } = await supabase
      .from('assessment_findings')
      .select('id')
      .eq('assessment_id', input.assessmentId)
      .eq('question_id', input.questionId)
      .single();

    if (!existingFinding) {
      // Generate and create new finding
      const finding = await generateFindingFromResponse(input);
      if (finding) {
        await createFinding(input.assessmentId, input.companyId, finding);
      }
    }
  } else {
    // Remove existing finding if response changed to non-gap
    await removeFindingForQuestion(input.assessmentId, input.questionId);
  }
}

/**
 * Bulk generate findings for all gap responses in an assessment
 */
export async function generateAllFindings(
  assessmentId: string,
  companyId: string
): Promise<number> {
  // Get all responses that create findings
  const { data: responses, error: responsesError } = await supabase
    .from('assessment_responses')
    .select('id, question_id, response_value')
    .eq('assessment_id', assessmentId)
    .eq('creates_finding', true);

  if (responsesError || !responses) {
    console.error('Error fetching responses for findings generation:', responsesError);
    return 0;
  }

  // Get existing findings to avoid duplicates
  const { data: existingFindings } = await supabase
    .from('assessment_findings')
    .select('question_id')
    .eq('assessment_id', assessmentId);

  const existingQuestionIds = new Set(existingFindings?.map(f => f.question_id) || []);

  // Filter to only new findings
  const newResponses = responses.filter(r => !existingQuestionIds.has(r.question_id));

  let createdCount = 0;

  for (const response of newResponses) {
    const finding = await generateFindingFromResponse({
      assessmentId,
      questionId: response.question_id,
      responseId: response.id,
      responseValue: response.response_value,
      companyId,
    });

    if (finding) {
      const created = await createFinding(assessmentId, companyId, finding);
      if (created) createdCount++;
    }
  }

  return createdCount;
}

// Helper functions

function interpolateTemplate(
  template: string,
  question: AssessmentQuestion,
  responseValue: string
): string {
  return template
    .replace(/\{control_id\}/g, question.control_id)
    .replace(/\{domain_name\}/g, question.domain_name)
    .replace(/\{response\}/g, responseValue)
    .replace(/\{question\}/g, question.question_text);
}

function buildFindingDescription(
  question: AssessmentQuestion,
  responseValue: string
): string {
  const responseLabel = responseValue === 'no' ? 'Not Implemented' : 
                        responseValue === 'partial' ? 'Partially Implemented' :
                        `Response: ${responseValue}`;

  return `Control ${question.control_id} (${question.domain_name}) assessment indicates: ${responseLabel}.\n\n` +
    `Question: ${question.question_text}\n\n` +
    (question.help_text ? `Context: ${question.help_text}` : '');
}
