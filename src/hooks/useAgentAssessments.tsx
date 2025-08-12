
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

export interface AgentAssessment {
  id: string;
  assessment_id: string;
  agent_id: string;
  user_id: string;
  status: 'not_started' | 'in_progress' | 'completed';
  progress: number;
  analysis_result?: string;
  created_at: string;
  updated_at: string;
}

export const useAgentAssessments = (assessmentId: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: agentAssessments = [], isLoading } = useQuery({
    queryKey: ['agent-assessments', assessmentId, user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('assessments')
        .select('*')
        .eq('id', assessmentId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) {
        throw error;
      }
      
      return data as AgentAssessment[];
    },
    enabled: !!user && !!assessmentId,
  });

  const createAgentAssessment = useMutation({
    mutationFn: async (params: {
      systemName: string;
      environment: string;
      complianceScope: string;
      status?: 'not_started' | 'in_progress' | 'completed';
    }) => {
      if (!user) throw new Error('User not authenticated');

      // Get user's profile to get company_id
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      const { data, error } = await supabase
        .from('assessments')
        .insert({
          system_name: params.systemName,
          environment: params.environment,
          compliance_scope: params.complianceScope,
          user_id: user.id,
          company_id: profile.company_id,
          status: params.status || 'not_started',
        })
        .select()
        .single();

      if (error) {
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-assessments', assessmentId, user?.id] });
    },
  });

  const updateAgentAssessment = useMutation({
    mutationFn: async (params: {
      status: 'not_started' | 'in_progress' | 'completed';
    }) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('assessments')
        .update({
          status: params.status,
        })
        .eq('id', assessmentId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-assessments', assessmentId, user?.id] });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update assessment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteAgentAssessment = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('assessments')
        .delete()
        .eq('id', assessmentId)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-assessments', assessmentId, user?.id] });
    },
  });

  const getAssessmentStatus = () => {
    const assessment = agentAssessments.find(a => a.id === assessmentId);
    
    return {
      status: assessment?.status || 'not_started',
      systemName: assessment?.system_name || '',
      environment: assessment?.environment || '',
      complianceScope: assessment?.compliance_scope || '',
      exists: !!assessment
    };
  };

  const getAllCompletedResults = () => {
    return agentAssessments
      .filter(assessment => assessment.status === 'completed')
      .map(assessment => ({
        id: assessment.id,
        systemName: assessment.system_name,
        environment: assessment.environment,
        complianceScope: assessment.compliance_scope,
        completedAt: assessment.updated_at
      }));
  };

  const getAssessmentProgress = () => {
    const totalAssessments = agentAssessments.length;
    const completedAssessments = agentAssessments.filter(a => a.status === 'completed').length;
    const inProgressAssessments = agentAssessments.filter(a => a.status === 'in_progress').length;
    
    return {
      total: totalAssessments,
      completed: completedAssessments,
      inProgress: inProgressAssessments,
      notStarted: totalAssessments - completedAssessments - inProgressAssessments,
      overallProgress: totalAssessments > 0 ? (completedAssessments / totalAssessments) * 100 : 0
    };
  };

  return {
    agentAssessments,
    isLoading,
    createAgentAssessment,
    updateAgentAssessment,
    deleteAgentAssessment,
    getAssessmentStatus,
    getAllCompletedResults,
    getAssessmentProgress,
  };
};
