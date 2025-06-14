
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

type AssessmentStatus = 'not-started' | 'in-progress' | 'completed';

const VALID_TRANSITIONS: Record<AssessmentStatus, AssessmentStatus[]> = {
  'not-started': ['in-progress'],
  'in-progress': ['completed'],
  'completed': [] // No transitions allowed from completed
};

export const useAssessmentStatus = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const validateStatusTransition = (currentStatus: AssessmentStatus, newStatus: AssessmentStatus): boolean => {
    if (currentStatus === newStatus) return true;
    return VALID_TRANSITIONS[currentStatus].includes(newStatus);
  };

  const updateAssessmentStatus = useMutation({
    mutationFn: async (params: {
      assessmentId: string;
      newStatus: AssessmentStatus;
      currentStatus?: AssessmentStatus;
    }) => {
      if (!user) throw new Error('User not authenticated');

      // If current status is provided, validate the transition
      if (params.currentStatus && !validateStatusTransition(params.currentStatus, params.newStatus)) {
        throw new Error(`Invalid status transition from ${params.currentStatus} to ${params.newStatus}`);
      }

      const { data, error } = await supabase
        .from('assessments')
        .update({ 
          status: params.newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', params.assessmentId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['assessments', user?.id] });
      toast({
        title: "Status Updated",
        description: `Assessment status changed to ${variables.newStatus}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Status Update Failed",
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const canTransitionTo = (currentStatus: AssessmentStatus, targetStatus: AssessmentStatus): boolean => {
    return validateStatusTransition(currentStatus, targetStatus);
  };

  const getNextValidStatuses = (currentStatus: AssessmentStatus): AssessmentStatus[] => {
    return VALID_TRANSITIONS[currentStatus];
  };

  return {
    updateAssessmentStatus,
    canTransitionTo,
    getNextValidStatuses,
    validateStatusTransition
  };
};
