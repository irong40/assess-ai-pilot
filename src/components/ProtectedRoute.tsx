
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Shield } from "lucide-react";

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
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Shield className="h-12 w-12 text-blue-400 animate-pulse" />
          <div className="flex items-center space-x-2">
            <div className="animate-spin h-6 w-6 border-2 border-blue-400 border-t-transparent rounded-full" />
            <span className="text-lg text-white">Loading...</span>
          </div>
          <p className="text-slate-300 text-sm">Checking authentication status</p>
        </div>
      </div>
    );
  }

  if (!user && redirecting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Shield className="h-12 w-12 text-blue-400" />
          <div className="flex items-center space-x-2">
            <div className="animate-spin h-6 w-6 border-2 border-blue-400 border-t-transparent rounded-full" />
            <span className="text-lg text-white">Redirecting to sign in...</span>
          </div>
          <p className="text-slate-300 text-sm">Authentication required</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
