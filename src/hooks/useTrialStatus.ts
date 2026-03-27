import { useQuery } from '@tanstack/react-query';
import { differenceInDays } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '@/hooks/useUserProfile';

interface TrialStatusResult {
  daysLeft: number;
  isExpired: boolean;
  isLoading: boolean;
  trialEndsAt: string | null;
  trialStatus: string | null;
}

export const useTrialStatus = (): TrialStatusResult => {
  const { data: profile, isLoading: profileLoading } = useUserProfile();

  const { data: company, isLoading: companyLoading } = useQuery({
    queryKey: ['trialStatus', profile?.company_id],
    queryFn: async () => {
      if (!profile?.company_id) return null;

      const { data, error } = await supabase
        .from('companies')
        .select('trial_ends_at, trial_status')
        .eq('id', profile.company_id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!profile?.company_id,
  });

  const isLoading = profileLoading || companyLoading;

  if (isLoading || !company) {
    return {
      daysLeft: 0,
      isExpired: false,
      isLoading: true,
      trialEndsAt: null,
      trialStatus: null,
    };
  }

  const trialEndsAt = company.trial_ends_at;
  const trialStatus = company.trial_status;

  // Converted customers are never expired regardless of trial_ends_at
  if (trialStatus === 'active') {
    return {
      daysLeft: 0,
      isExpired: false,
      isLoading: false,
      trialEndsAt,
      trialStatus,
    };
  }

  const daysLeft = differenceInDays(new Date(trialEndsAt), new Date());
  const isExpired = trialStatus === 'expired' || daysLeft < 0;

  return {
    daysLeft,
    isExpired,
    isLoading: false,
    trialEndsAt,
    trialStatus,
  };
};
