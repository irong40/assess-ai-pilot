
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface Assessment {
  id: string;
  user_id: string;
  system_name: string;
  environment: string;
  compliance_scope: string;
  owner_name?: string;
  owner_role?: string;
  description?: string;
  criticality_level?: string;
  status: 'not-started' | 'in-progress' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface CreateAssessmentData {
  systemName: string;
  environment: string;
  complianceScope: string;
  ownerName?: string;
  ownerRole?: string;
  description?: string;
  criticalityLevel?: string;
}

export const useAssessments = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: assessments = [], isLoading } = useQuery({
    queryKey: ['assessments', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('assessments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Assessment[];
    },
    enabled: !!user,
  });

  const createAssessment = useMutation({
    mutationFn: async (assessmentData: CreateAssessmentData) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('assessments')
        .insert({
          user_id: user.id,
          system_name: assessmentData.systemName,
          environment: assessmentData.environment,
          compliance_scope: assessmentData.complianceScope,
          owner_name: assessmentData.ownerName,
          owner_role: assessmentData.ownerRole,
          description: assessmentData.description,
          criticality_level: assessmentData.criticalityLevel,
          status: 'not-started'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessments', user?.id] });
    },
  });

  const updateAssessment = useMutation({
    mutationFn: async (params: { id: string; updates: Partial<Assessment> }) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('assessments')
        .update(params.updates)
        .eq('id', params.id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessments', user?.id] });
    },
  });

  return {
    assessments,
    isLoading,
    createAssessment,
    updateAssessment,
  };
};
