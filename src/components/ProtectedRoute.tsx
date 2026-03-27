
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTrialStatus } from "@/hooks/useTrialStatus";
import { useOnboarding } from "@/hooks/useOnboarding";
import Loading from "@/components/Loading";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [redirecting, setRedirecting] = useState(false);

  const { isExpired, isLoading: trialLoading } = useTrialStatus();
  const { isComplete: onboardingComplete, isLoading: onboardingLoading } = useOnboarding();

  const currentPath = location.pathname;

  useEffect(() => {
    if (!loading && !user) {
      setRedirecting(true);
      // Add a small delay to show the redirect message
      setTimeout(() => {
        navigate("/auth");
      }, 1000);
    }
  }, [user, loading, navigate]);

  if (loading) {
    return <Loading fullScreen text="Checking authentication status..." />;
  }

  if (!user && redirecting) {
    return <Loading fullScreen text="Redirecting to sign in..." />;
  }

  if (!user) {
    return null;
  }

  // Wait for trial and onboarding status to load
  if (trialLoading || onboardingLoading) {
    return <Loading fullScreen text="Loading your account..." />;
  }

  // Trial expired: redirect to /trial-expired (unless already there)
  if (isExpired && currentPath !== '/trial-expired') {
    navigate('/trial-expired', { replace: true });
    return <Loading fullScreen text="Redirecting..." />;
  }

  // Onboarding not complete: redirect to /onboarding
  // (unless already on /onboarding or /trial-expired)
  if (
    !onboardingComplete &&
    currentPath !== '/onboarding' &&
    currentPath !== '/trial-expired'
  ) {
    navigate('/onboarding', { replace: true });
    return <Loading fullScreen text="Redirecting to setup..." />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
