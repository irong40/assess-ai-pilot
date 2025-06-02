
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface AgentAssessment {
  id: string;
  assessment_id: string;
  agent_id: string;
  user_id: string;
  status: 'not-started' | 'in-progress' | 'completed';
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
        .from('agent_assessments')
        .select('*')
        .eq('assessment_id', assessmentId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching agent assessments:', error);
        return [];
      }
      return data as AgentAssessment[];
    },
    enabled: !!user && !!assessmentId,
  });

  const updateAgentAssessment = useMutation({
    mutationFn: async (params: {
      agentId: string;
      status: 'not-started' | 'in-progress' | 'completed';
      progress: number;
      analysisResult?: string;
    }) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('agent_assessments')
        .upsert({
          assessment_id: assessmentId,
          agent_id: params.agentId,
          user_id: user.id,
          status: params.status,
          progress: params.progress,
          analysis_result: params.analysisResult,
        })
        .select()
        .single();

      if (error) {
        console.error('Error updating agent assessment:', error);
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['agent-assessments', assessmentId, user?.id] 
      });
    },
  });

  const getAgentStatus = (agentId: string) => {
    const assessment = agentAssessments.find(a => a.agent_id === agentId);
    return {
      status: assessment?.status || 'not-started' as const,
      progress: assessment?.progress || 0,
      analysisResult: assessment?.analysis_result || '',
      id: assessment?.id
    };
  };

  return {
    agentAssessments,
    isLoading,
    updateAgentAssessment,
    getAgentStatus,
  };
};
