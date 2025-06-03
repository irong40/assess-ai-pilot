
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

export const useNDAStatus = () => {
  const [ndaAccepted, setNdaAccepted] = useState<boolean | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      const accepted = localStorage.getItem(`nda_accepted_${user.id}`) === 'true';
      setNdaAccepted(accepted);
    } else {
      setNdaAccepted(null);
    }
  }, [user]);

  const clearNDAAcceptance = () => {
    if (user) {
      localStorage.removeItem(`nda_accepted_${user.id}`);
      setNdaAccepted(false);
    }
  };

  return { ndaAccepted, clearNDAAcceptance };
};
