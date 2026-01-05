import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { 
  AssessmentQuestion, 
  SecurityDomainId,
  QuestionWithResponse,
  AssessmentResponse
} from "@/types/questionnaire";

/**
 * Fetch all active assessment questions
 */
export const useAssessmentQuestions = () => {
  return useQuery({
    queryKey: ['assessment-questions'],
    queryFn: async (): Promise<AssessmentQuestion[]> => {
      const { data, error } = await supabase
        .from('assessment_questions')
        .select('*')
        .eq('is_active', true)
        .order('domain_id')
        .order('order_index');

      if (error) throw error;
      return data as AssessmentQuestion[];
    },
    staleTime: 1000 * 60 * 60, // Questions rarely change, cache for 1 hour
  });
};

/**
 * Fetch questions for a specific domain
 */
export const useQuestionsByDomain = (domainId: SecurityDomainId | null) => {
  return useQuery({
    queryKey: ['assessment-questions', 'domain', domainId],
    queryFn: async (): Promise<AssessmentQuestion[]> => {
      if (!domainId) return [];

      const { data, error } = await supabase
        .from('assessment_questions')
        .select('*')
        .eq('domain_id', domainId)
        .eq('is_active', true)
        .order('order_index');

      if (error) throw error;
      return data as AssessmentQuestion[];
    },
    enabled: !!domainId,
    staleTime: 1000 * 60 * 60,
  });
};

/**
 * Fetch questions with their responses for a specific assessment and domain
 */
export const useQuestionsWithResponses = (
  assessmentId: string | null,
  domainId: SecurityDomainId | null
) => {
  return useQuery({
    queryKey: ['questions-with-responses', assessmentId, domainId],
    queryFn: async (): Promise<QuestionWithResponse[]> => {
      if (!assessmentId || !domainId) return [];

      // Fetch questions for the domain
      const { data: questions, error: questionsError } = await supabase
        .from('assessment_questions')
        .select('*')
        .eq('domain_id', domainId)
        .eq('is_active', true)
        .order('order_index');

      if (questionsError) throw questionsError;

      // Fetch responses for this assessment
      const questionIds = (questions as AssessmentQuestion[]).map(q => q.id);
      const { data: responses, error: responsesError } = await supabase
        .from('assessment_responses')
        .select('*')
        .eq('assessment_id', assessmentId)
        .in('question_id', questionIds);

      if (responsesError) throw responsesError;

      // Create a map of question_id to response
      const responseMap = new Map<string, AssessmentResponse>();
      (responses as AssessmentResponse[]).forEach(r => {
        responseMap.set(r.question_id, r);
      });

      // Combine questions with their responses
      return (questions as AssessmentQuestion[]).map(question => ({
        ...question,
        response: responseMap.get(question.id) || null,
      }));
    },
    enabled: !!assessmentId && !!domainId,
  });
};

/**
 * Get domain statistics (question counts per domain)
 */
export const useDomainStats = () => {
  return useQuery({
    queryKey: ['domain-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assessment_questions')
        .select('domain_id, domain_name')
        .eq('is_active', true);

      if (error) throw error;

      // Count questions per domain
      const stats = (data as Pick<AssessmentQuestion, 'domain_id' | 'domain_name'>[]).reduce(
        (acc, q) => {
          if (!acc[q.domain_id]) {
            acc[q.domain_id] = {
              domain_id: q.domain_id,
              domain_name: q.domain_name,
              count: 0,
            };
          }
          acc[q.domain_id].count++;
          return acc;
        },
        {} as Record<string, { domain_id: string; domain_name: string; count: number }>
      );

      return Object.values(stats);
    },
    staleTime: 1000 * 60 * 60,
  });
};
