import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { Database } from "@/integrations/supabase/types";

type Assessment = Database["public"]["Tables"]["assessments"]["Row"];
type AssessmentInsert = Database["public"]["Tables"]["assessments"]["Insert"];
type AssessmentUpdate = Database["public"]["Tables"]["assessments"]["Update"];

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
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }
      
      return data as Assessment[];
    },
    enabled: !!user,
  });

  const createAssessment = useMutation({
    mutationFn: async (assessmentData: Omit<AssessmentInsert, 'user_id' | 'company_id'>) => {
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
          ...assessmentData,
          user_id: user.id,
          company_id: profile.company_id,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessments', user?.id] });
      toast({
        title: "Assessment Created",
        description: "Your assessment has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create assessment.",
        variant: "destructive",
      });
    },
  });

  const updateAssessment = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: AssessmentUpdate }) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('assessments')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessments', user?.id] });
      toast({
        title: "Assessment Updated",
        description: "Your assessment has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update assessment.",
        variant: "destructive",
      });
    },
  });

  const deleteAssessment = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('assessments')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessments', user?.id] });
      toast({
        title: "Assessment Deleted",
        description: "Your assessment has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete assessment.",
        variant: "destructive",
      });
    },
  });

  return {
    assessments,
    isLoading,
    createAssessment,
    updateAssessment,
    deleteAssessment,
  };
};