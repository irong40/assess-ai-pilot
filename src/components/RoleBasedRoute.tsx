
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import Loading from "@/components/Loading";
import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Database } from "@/integrations/supabase/types";

type UserRole = Database["public"]["Enums"]["user_role"];

interface RoleBasedRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
  fallbackPath?: string;
}

const RoleBasedRoute = ({ 
  children, 
  requiredRoles = [], 
  fallbackPath = "/dashboard" 
}: RoleBasedRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useUserProfile();
  const navigate = useNavigate();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      setRedirecting(true);
      setTimeout(() => {
        navigate("/auth");
      }, 1000);
      return;
    }

    if (!profileLoading && user && requiredRoles.length > 0) {
      // Check if user has any of the required roles
      const userRole = profile?.role || 'viewer';
      const hasRequiredRole = requiredRoles.includes(userRole) || requiredRoles.length === 0;

      if (!hasRequiredRole) {
        setRedirecting(true);
        setTimeout(() => {
          navigate(fallbackPath);
        }, 2000);
      }
    }
  }, [user, profile, authLoading, profileLoading, requiredRoles, navigate, fallbackPath]);

  if (authLoading || profileLoading) {
    return <Loading fullScreen text="Checking permissions..." />;
  }

  if (!user && redirecting) {
    return <Loading fullScreen text="Redirecting to sign in..." />;
  }

  if (!user) {
    return null;
  }

  // Check role access
  if (requiredRoles.length > 0) {
    const userRole = profile?.role || 'viewer';
    const hasRequiredRole = requiredRoles.includes(userRole) || requiredRoles.length === 0;

    if (!hasRequiredRole && redirecting) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 bg-yellow-100 rounded-full w-fit">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
              <CardTitle className="text-yellow-900">Access Denied</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-gray-600 text-sm">
                You don't have permission to access this page.
              </p>
              <p className="text-xs text-gray-500">
                Required roles: {requiredRoles.join(', ')}
              </p>
              <p className="text-xs text-gray-500">
                Redirecting to dashboard...
              </p>
              <Loading size="sm" text="Redirecting..." />
            </CardContent>
          </Card>
        </div>
      );
    }

    if (!hasRequiredRole) {
      return null;
    }
  }

  return <>{children}</>;
};

export default RoleBasedRoute;
