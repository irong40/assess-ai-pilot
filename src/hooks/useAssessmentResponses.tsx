import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import type {
  AssessmentResponse,
  SecurityDomainId,
} from "@/types/questionnaire";
import { syncFindingWithResponse } from "@/services/findingsGenerator";

/**
 * Fetch all responses for an assessment
 */
export const useAssessmentResponses = (assessmentId: string | null) => {
  return useQuery({
    queryKey: ['assessment-responses', assessmentId],
    queryFn: async (): Promise<AssessmentResponse[]> => {
      if (!assessmentId) return [];

      const { data, error } = await supabase
        .from('assessment_responses')
        .select('*')
        .eq('assessment_id', assessmentId)
        .order('answered_at', { ascending: false });

      if (error) throw error;
      return data as AssessmentResponse[];
    },
    enabled: !!assessmentId,
  });
};

/**
 * Fetch responses for a specific domain
 */
export const useResponsesByDomain = (
  assessmentId: string | null,
  domainId: SecurityDomainId | null
) => {
  return useQuery({
    queryKey: ['assessment-responses', assessmentId, 'domain', domainId],
    queryFn: async (): Promise<AssessmentResponse[]> => {
      if (!assessmentId || !domainId) return [];

      // First get question IDs for this domain
      const { data: questions, error: questionsError } = await supabase
        .from('assessment_questions')
        .select('id')
        .eq('domain_id', domainId)
        .eq('is_active', true);

      if (questionsError) throw questionsError;

      const questionIds = questions.map(q => q.id);

      // Then get responses for those questions
      const { data, error } = await supabase
        .from('assessment_responses')
        .select('*')
        .eq('assessment_id', assessmentId)
        .in('question_id', questionIds);

      if (error) throw error;
      return data as AssessmentResponse[];
    },
    enabled: !!assessmentId && !!domainId,
  });
};

/**
 * CRUD operations for assessment responses
 */
export const useResponseMutations = (assessmentId: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get user's company_id
  const getCompanyId = async (): Promise<string> => {
    if (!user) throw new Error('User not authenticated');

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (error) throw error;
    return profile.company_id;
  };

  // Create or update a response (upsert) and sync findings
  const saveResponse = useMutation({
    mutationFn: async ({
      questionId,
      responseValue,
      notes,
      createsFinding,
    }: {
      questionId: string;
      responseValue: string;
      notes?: string | null;
      createsFinding: boolean;
    }) => {
      if (!user) throw new Error('User not authenticated');
      const companyId = await getCompanyId();

      // Check if response already exists
      const { data: existing } = await supabase
        .from('assessment_responses')
        .select('id')
        .eq('assessment_id', assessmentId)
        .eq('question_id', questionId)
        .single();

      let responseData;

      if (existing) {
        // Update existing response
        const { data, error } = await supabase
          .from('assessment_responses')
          .update({
            response_value: responseValue,
            notes,
            creates_finding: createsFinding,
            answered_at: new Date().toISOString(),
            answered_by: user.id,
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        responseData = data;
      } else {
        // Insert new response
        const { data, error } = await supabase
          .from('assessment_responses')
          .insert({
            assessment_id: assessmentId,
            question_id: questionId,
            company_id: companyId,
            response_value: responseValue,
            notes,
            creates_finding: createsFinding,
            answered_by: user.id,
          })
          .select()
          .single();

        if (error) throw error;
        responseData = data;
      }

      // Auto-generate or remove finding based on response
      await syncFindingWithResponse(
        {
          assessmentId,
          questionId,
          responseId: responseData.id,
          responseValue,
          companyId,
        },
        createsFinding
      );

      return responseData;
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['assessment-responses', assessmentId] });
      queryClient.invalidateQueries({ queryKey: ['questions-with-responses', assessmentId] });
      queryClient.invalidateQueries({ queryKey: ['wizard-progress', assessmentId] });
      queryClient.invalidateQueries({ queryKey: ['assessment-findings', assessmentId] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error saving response",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update response notes only
  const updateNotes = useMutation({
    mutationFn: async ({
      responseId,
      notes,
    }: {
      responseId: string;
      notes: string | null;
    }) => {
      const { data, error } = await supabase
        .from('assessment_responses')
        .update({ notes })
        .eq('id', responseId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessment-responses', assessmentId] });
      queryClient.invalidateQueries({ queryKey: ['questions-with-responses', assessmentId] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating notes",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete a response
  const deleteResponse = useMutation({
    mutationFn: async (responseId: string) => {
      const { error } = await supabase
        .from('assessment_responses')
        .delete()
        .eq('id', responseId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessment-responses', assessmentId] });
      queryClient.invalidateQueries({ queryKey: ['questions-with-responses', assessmentId] });
      queryClient.invalidateQueries({ queryKey: ['wizard-progress', assessmentId] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting response",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    saveResponse,
    updateNotes,
    deleteResponse,
  };
};
