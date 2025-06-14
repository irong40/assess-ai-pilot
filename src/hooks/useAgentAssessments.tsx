
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

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
      
      console.log(`Fetching agent assessments for assessment ${assessmentId} and user ${user.id}`);
      
      const { data, error } = await supabase
        .from('agent_assessments')
        .select('*')
        .eq('assessment_id', assessmentId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching agent assessments:', error);
        throw error;
      }
      
      console.log(`Found ${data?.length || 0} agent assessments`);
      return data as AgentAssessment[];
    },
    enabled: !!user && !!assessmentId,
  });

  const createAgentAssessment = useMutation({
    mutationFn: async (params: {
      agentId: string;
      status?: 'not-started' | 'in-progress' | 'completed';
      progress?: number;
      analysisResult?: string;
    }) => {
      if (!user) throw new Error('User not authenticated');

      console.log(`Creating agent assessment for agent ${params.agentId}`);

      const { data, error } = await supabase
        .from('agent_assessments')
        .insert({
          assessment_id: assessmentId,
          agent_id: params.agentId,
          user_id: user.id,
          status: params.status || 'not-started',
          progress: params.progress || 0,
          analysis_result: params.analysisResult,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating agent assessment:', error);
        throw error;
      }
      
      console.log('Agent assessment created successfully:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-assessments', assessmentId, user?.id] });
    },
  });

  const updateAgentAssessment = useMutation({
    mutationFn: async (params: {
      agentId: string;
      status: 'not-started' | 'in-progress' | 'completed';
      progress: number;
      analysisResult?: string;
    }) => {
      if (!user) throw new Error('User not authenticated');

      console.log(`Updating agent assessment for agent ${params.agentId} to status ${params.status}`);

      // First try to update existing record
      const { data: updateData, error: updateError } = await supabase
        .from('agent_assessments')
        .update({
          status: params.status,
          progress: params.progress,
          analysis_result: params.analysisResult,
          updated_at: new Date().toISOString()
        })
        .eq('assessment_id', assessmentId)
        .eq('agent_id', params.agentId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateError) {
        // If update fails (record doesn't exist), create new record
        if (updateError.code === 'PGRST116') {
          console.log('Record not found, creating new agent assessment');
          const { data: insertData, error: insertError } = await supabase
            .from('agent_assessments')
            .insert({
              assessment_id: assessmentId,
              agent_id: params.agentId,
              user_id: user.id,
              status: params.status,
              progress: params.progress,
              analysis_result: params.analysisResult,
            })
            .select()
            .single();

          if (insertError) {
            console.error('Error inserting agent assessment:', insertError);
            throw insertError;
          }
          return insertData;
        } else {
          console.error('Error updating agent assessment:', updateError);
          throw updateError;
        }
      }

      console.log('Agent assessment updated successfully:', updateData);
      return updateData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-assessments', assessmentId, user?.id] });
    },
    onError: (error) => {
      console.error('Failed to update agent assessment:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update agent assessment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteAgentAssessment = useMutation({
    mutationFn: async (agentId: string) => {
      if (!user) throw new Error('User not authenticated');

      console.log(`Deleting agent assessment for agent ${agentId}`);

      const { error } = await supabase
        .from('agent_assessments')
        .delete()
        .eq('assessment_id', assessmentId)
        .eq('agent_id', agentId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting agent assessment:', error);
        throw error;
      }
      
      console.log('Agent assessment deleted successfully');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-assessments', assessmentId, user?.id] });
    },
  });

  const getAgentStatus = (agentId: string) => {
    const agentData = agentAssessments.find(
      assessment => assessment.agent_id === agentId
    );
    
    return {
      status: agentData?.status || 'not-started',
      progress: agentData?.progress || 0,
      analysisResult: agentData?.analysis_result,
      exists: !!agentData
    };
  };

  const getAllCompletedResults = () => {
    return agentAssessments
      .filter(assessment => assessment.status === 'completed' && assessment.analysis_result)
      .map(assessment => ({
        agentId: assessment.agent_id,
        result: assessment.analysis_result!,
        completedAt: assessment.updated_at
      }));
  };

  const getAssessmentProgress = () => {
    const totalAgents = agentAssessments.length;
    const completedAgents = agentAssessments.filter(a => a.status === 'completed').length;
    const inProgressAgents = agentAssessments.filter(a => a.status === 'in-progress').length;
    
    return {
      total: totalAgents,
      completed: completedAgents,
      inProgress: inProgressAgents,
      notStarted: totalAgents - completedAgents - inProgressAgents,
      overallProgress: totalAgents > 0 ? (completedAgents / totalAgents) * 100 : 0
    };
  };

  return {
    agentAssessments,
    isLoading,
    createAgentAssessment,
    updateAgentAssessment,
    deleteAgentAssessment,
    getAgentStatus,
    getAllCompletedResults,
    getAssessmentProgress,
  };
};
