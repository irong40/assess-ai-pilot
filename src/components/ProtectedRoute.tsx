
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Loading from "@/components/Loading";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [redirecting, setRedirecting] = useState(false);

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

  return <>{children}</>;
};

export default ProtectedRoute;
