import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '@/hooks/useUserProfile';

export interface OnboardingProfileData {
  org_size?: string;
  primary_tech_stack?: string[];
  compliance_goals?: string[];
  target_cmmc_level?: number;
  system_name?: string;
  environment?: string;
}

interface OnboardingResult {
  isComplete: boolean;
  isLoading: boolean;
  onboardingProfile: OnboardingProfileData | null;
  profileLoading: boolean;
  saveProfile: ReturnType<typeof useMutation>;
  completeOnboarding: ReturnType<typeof useMutation>;
}

export const useOnboarding = (): OnboardingResult => {
  const { data: profile, isLoading: userProfileLoading } = useUserProfile();
  const queryClient = useQueryClient();

  // Query company for onboarding_completed status
  const { data: company, isLoading: companyLoading } = useQuery({
    queryKey: ['onboardingStatus', profile?.company_id],
    queryFn: async () => {
      if (!profile?.company_id) return null;

      const { data, error } = await supabase
        .from('companies')
        .select('onboarding_completed')
        .eq('id', profile.company_id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!profile?.company_id,
  });

  // Query existing onboarding profile
  const { data: onboardingProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['onboardingProfile', profile?.company_id],
    queryFn: async () => {
      if (!profile?.company_id) return null;

      const { data, error } = await supabase
        .from('onboarding_profiles')
        .select('*')
        .eq('company_id', profile.company_id)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
      return data as OnboardingProfileData | null;
    },
    enabled: !!profile?.company_id,
  });

  // Upsert onboarding profile
  const saveProfile = useMutation({
    mutationFn: async (profileData: OnboardingProfileData) => {
      if (!profile?.company_id) throw new Error('No company found');

      const { error } = await supabase
        .from('onboarding_profiles')
        .upsert(
          {
            company_id: profile.company_id,
            ...profileData,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'company_id' }
        );

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboardingProfile', profile?.company_id] });
    },
  });

  // Mark onboarding as complete
  const completeOnboarding = useMutation({
    mutationFn: async () => {
      if (!profile?.company_id) throw new Error('No company found');

      const { error } = await supabase
        .from('companies')
        .update({ onboarding_completed: true })
        .eq('id', profile.company_id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboardingStatus', profile?.company_id] });
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    },
  });

  const isLoading = userProfileLoading || companyLoading;
  const isComplete = company?.onboarding_completed ?? false;

  return {
    isComplete,
    isLoading,
    onboardingProfile: onboardingProfile ?? null,
    profileLoading,
    saveProfile,
    completeOnboarding,
  };
};
