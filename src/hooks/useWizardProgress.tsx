import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type {
  AssessmentWithWizard,
  SecurityDomainId,
  DomainProgress,
  WizardProgress,
  SECURITY_DOMAINS,
} from "@/types/questionnaire";

/**
 * Fetch assessment with wizard progress
 */
export const useAssessmentWizard = (assessmentId: string | null) => {
  return useQuery({
    queryKey: ['assessment-wizard', assessmentId],
    queryFn: async (): Promise<AssessmentWithWizard | null> => {
      if (!assessmentId) return null;

      const { data, error } = await supabase
        .from('assessments')
        .select('*')
        .eq('id', assessmentId)
        .single();

      if (error) throw error;
      
      // Parse JSONB fields
      return {
        ...data,
        completed_domains: (data.completed_domains as SecurityDomainId[]) || [],
        domain_scores: (data.domain_scores as Record<SecurityDomainId, number>) || {},
      } as AssessmentWithWizard;
    },
    enabled: !!assessmentId,
  });
};

/**
 * Calculate wizard progress from responses and questions
 */
export const useWizardProgress = (assessmentId: string | null) => {
  return useQuery({
    queryKey: ['wizard-progress', assessmentId],
    queryFn: async (): Promise<WizardProgress | null> => {
      if (!assessmentId) return null;

      // Fetch all questions
      const { data: questions, error: questionsError } = await supabase
        .from('assessment_questions')
        .select('id, domain_id, domain_name, risk_weight')
        .eq('is_active', true);

      if (questionsError) throw questionsError;

      // Fetch all responses for this assessment
      const { data: responses, error: responsesError } = await supabase
        .from('assessment_responses')
        .select('question_id, response_value, creates_finding')
        .eq('assessment_id', assessmentId);

      if (responsesError) throw responsesError;

      // Fetch all findings for this assessment
      const { data: findings, error: findingsError } = await supabase
        .from('assessment_findings')
        .select('id, question_id')
        .eq('assessment_id', assessmentId);

      if (findingsError) throw findingsError;

      // Create response map
      const responseMap = new Map(responses.map(r => [r.question_id, r]));
      const findingsMap = new Map<string, number>();
      findings.forEach(f => {
        const count = findingsMap.get(f.question_id) || 0;
        findingsMap.set(f.question_id, count + 1);
      });

      // Group questions by domain
      const domainQuestions = questions.reduce(
        (acc, q) => {
          if (!acc[q.domain_id]) {
            acc[q.domain_id] = {
              domain_id: q.domain_id as SecurityDomainId,
              domain_name: q.domain_name,
              questions: [],
            };
          }
          acc[q.domain_id].questions.push(q);
          return acc;
        },
        {} as Record<string, { domain_id: SecurityDomainId; domain_name: string; questions: typeof questions }>
      );

      // Calculate progress for each domain
      const domains: DomainProgress[] = Object.values(domainQuestions).map(domain => {
        const totalQuestions = domain.questions.length;
        let answeredQuestions = 0;
        let findingsCount = 0;
        let totalWeight = 0;
        let earnedWeight = 0;

        domain.questions.forEach(q => {
          totalWeight += q.risk_weight;
          const response = responseMap.get(q.id);
          
          if (response) {
            answeredQuestions++;
            
            // Calculate score based on response
            const value = response.response_value.toLowerCase();
            if (value === 'yes') {
              earnedWeight += q.risk_weight;
            } else if (value === 'partial') {
              earnedWeight += q.risk_weight * 0.5;
            }
            // 'no' and 'na' contribute 0 to score

            if (response.creates_finding) {
              findingsCount++;
            }
          }
        });

        const score = totalWeight > 0 && answeredQuestions > 0
          ? Math.round((earnedWeight / totalWeight) * 100)
          : null;

        return {
          domain_id: domain.domain_id,
          domain_name: domain.domain_name,
          total_questions: totalQuestions,
          answered_questions: answeredQuestions,
          findings_count: findingsCount,
          score,
          is_complete: answeredQuestions === totalQuestions,
        };
      });

      // Calculate overall progress
      const totalQuestions = questions.length;
      const answeredQuestions = responses.length;
      const totalFindings = findings.length;
      
      // Overall score (weighted average of domain scores)
      const completeDomains = domains.filter(d => d.score !== null);
      const overallScore = completeDomains.length > 0
        ? Math.round(
            completeDomains.reduce((sum, d) => sum + (d.score || 0), 0) / completeDomains.length
          )
        : null;

      return {
        total_questions: totalQuestions,
        answered_questions: answeredQuestions,
        total_findings: totalFindings,
        domains,
        overall_score: overallScore,
        is_complete: answeredQuestions === totalQuestions,
      };
    },
    enabled: !!assessmentId,
  });
};

/**
 * Mutations for updating wizard progress
 */
export const useWizardMutations = (assessmentId: string) => {
  const queryClient = useQueryClient();

  // Start the wizard
  const startWizard = useMutation({
    mutationFn: async (startingDomain: SecurityDomainId) => {
      const { data, error } = await supabase
        .from('assessments')
        .update({
          current_domain: startingDomain,
          wizard_started_at: new Date().toISOString(),
          status: 'in_progress',
        })
        .eq('id', assessmentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessment-wizard', assessmentId] });
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error starting wizard",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update current domain
  const setCurrentDomain = useMutation({
    mutationFn: async (domainId: SecurityDomainId) => {
      const { data, error } = await supabase
        .from('assessments')
        .update({ current_domain: domainId })
        .eq('id', assessmentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessment-wizard', assessmentId] });
    },
  });

  // Mark domain as complete
  const completeDomain = useMutation({
    mutationFn: async ({
      domainId,
      score,
    }: {
      domainId: SecurityDomainId;
      score: number;
    }) => {
      // First get current state
      const { data: current, error: fetchError } = await supabase
        .from('assessments')
        .select('completed_domains, domain_scores')
        .eq('id', assessmentId)
        .single();

      if (fetchError) throw fetchError;

      const completedDomains = [...((current.completed_domains as SecurityDomainId[]) || [])];
      const domainScores = { ...((current.domain_scores as Record<SecurityDomainId, number>) || {}) };

      if (!completedDomains.includes(domainId)) {
        completedDomains.push(domainId);
      }
      domainScores[domainId] = score;

      const { data, error } = await supabase
        .from('assessments')
        .update({
          completed_domains: completedDomains,
          domain_scores: domainScores,
        })
        .eq('id', assessmentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessment-wizard', assessmentId] });
      queryClient.invalidateQueries({ queryKey: ['wizard-progress', assessmentId] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error completing domain",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Complete the wizard
  const completeWizard = useMutation({
    mutationFn: async (overallScore: number) => {
      const { data, error } = await supabase
        .from('assessments')
        .update({
          overall_score: overallScore,
          wizard_completed_at: new Date().toISOString(),
          status: 'completed',
          current_domain: null,
        })
        .eq('id', assessmentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessment-wizard', assessmentId] });
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
      toast({
        title: "Assessment Complete",
        description: "Your self-assessment has been completed successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error completing assessment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    startWizard,
    setCurrentDomain,
    completeDomain,
    completeWizard,
  };
};
