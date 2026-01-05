import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import type {
  AssessmentFinding,
  AssessmentFindingInsert,
  AssessmentFindingUpdate,
  FindingStatus,
  RiskLevel,
  SecurityDomainId,
} from "@/types/questionnaire";

/**
 * Fetch all findings for an assessment
 */
export const useAssessmentFindings = (assessmentId: string | null) => {
  return useQuery({
    queryKey: ['assessment-findings', assessmentId],
    queryFn: async (): Promise<AssessmentFinding[]> => {
      if (!assessmentId) return [];

      const { data, error } = await supabase
        .from('assessment_findings')
        .select('*')
        .eq('assessment_id', assessmentId)
        .order('severity', { ascending: true }) // critical first
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as AssessmentFinding[];
    },
    enabled: !!assessmentId,
  });
};

/**
 * Fetch findings grouped by severity
 */
export const useFindingsBySeverity = (assessmentId: string | null) => {
  const { data: findings = [], ...rest } = useAssessmentFindings(assessmentId);

  const groupedFindings = findings.reduce(
    (acc, finding) => {
      acc[finding.severity].push(finding);
      return acc;
    },
    {
      critical: [] as AssessmentFinding[],
      high: [] as AssessmentFinding[],
      medium: [] as AssessmentFinding[],
      low: [] as AssessmentFinding[],
    }
  );

  const counts = {
    critical: groupedFindings.critical.length,
    high: groupedFindings.high.length,
    medium: groupedFindings.medium.length,
    low: groupedFindings.low.length,
    total: findings.length,
  };

  return {
    findings,
    groupedFindings,
    counts,
    ...rest,
  };
};

/**
 * Fetch open findings (not remediated or accepted)
 */
export const useOpenFindings = (assessmentId: string | null) => {
  return useQuery({
    queryKey: ['assessment-findings', assessmentId, 'open'],
    queryFn: async (): Promise<AssessmentFinding[]> => {
      if (!assessmentId) return [];

      const { data, error } = await supabase
        .from('assessment_findings')
        .select('*')
        .eq('assessment_id', assessmentId)
        .in('status', ['open', 'in_progress'])
        .order('severity', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as AssessmentFinding[];
    },
    enabled: !!assessmentId,
  });
};

/**
 * CRUD operations for assessment findings
 */
export const useFindingMutations = (assessmentId: string) => {
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

  // Create a new finding
  const createFinding = useMutation({
    mutationFn: async (finding: Omit<AssessmentFindingInsert, 'assessment_id' | 'company_id'>) => {
      const companyId = await getCompanyId();

      const { data, error } = await supabase
        .from('assessment_findings')
        .insert({
          ...finding,
          assessment_id: assessmentId,
          company_id: companyId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessment-findings', assessmentId] });
      queryClient.invalidateQueries({ queryKey: ['wizard-progress', assessmentId] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating finding",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update finding status
  const updateFindingStatus = useMutation({
    mutationFn: async ({
      findingId,
      status,
    }: {
      findingId: string;
      status: FindingStatus;
    }) => {
      const { data, error } = await supabase
        .from('assessment_findings')
        .update({ status })
        .eq('id', findingId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessment-findings', assessmentId] });
      toast({
        title: "Finding Updated",
        description: "Finding status has been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating finding",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Link finding to POA&M entry
  const linkToPoam = useMutation({
    mutationFn: async ({
      findingId,
      poamEntryId,
    }: {
      findingId: string;
      poamEntryId: string;
    }) => {
      const { data, error } = await supabase
        .from('assessment_findings')
        .update({ 
          poam_entry_id: poamEntryId,
          status: 'in_progress' as FindingStatus,
        })
        .eq('id', findingId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessment-findings', assessmentId] });
      toast({
        title: "POA&M Linked",
        description: "Finding has been linked to POA&M entry.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error linking POA&M",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete a finding
  const deleteFinding = useMutation({
    mutationFn: async (findingId: string) => {
      const { error } = await supabase
        .from('assessment_findings')
        .delete()
        .eq('id', findingId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessment-findings', assessmentId] });
      queryClient.invalidateQueries({ queryKey: ['wizard-progress', assessmentId] });
      toast({
        title: "Finding Deleted",
        description: "Finding has been removed.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting finding",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Bulk create findings from responses
  const createFindingsFromResponses = useMutation({
    mutationFn: async (
      findings: Array<Omit<AssessmentFindingInsert, 'assessment_id' | 'company_id'>>
    ) => {
      const companyId = await getCompanyId();

      const findingsToInsert = findings.map(f => ({
        ...f,
        assessment_id: assessmentId,
        company_id: companyId,
      }));

      const { data, error } = await supabase
        .from('assessment_findings')
        .insert(findingsToInsert)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['assessment-findings', assessmentId] });
      queryClient.invalidateQueries({ queryKey: ['wizard-progress', assessmentId] });
      toast({
        title: "Findings Generated",
        description: `Created ${data.length} findings from assessment responses.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error generating findings",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    createFinding,
    updateFindingStatus,
    linkToPoam,
    deleteFinding,
    createFindingsFromResponses,
  };
};
