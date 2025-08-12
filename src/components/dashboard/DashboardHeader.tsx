
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { LogOut, Settings, Shield } from "lucide-react";
import { Link } from "react-router-dom";

const DashboardHeader = () => {
  const { signOut, user } = useAuth();
  const { data: profile } = useUserProfile();

  const userRole = profile?.role || 'viewer';
  console.log('📊 Dashboard Header - user profile:', profile);
  console.log('📊 Dashboard Header - user role:', userRole);
  const isAdmin = userRole === 'admin';

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">
            Welcome back, {user?.email}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {isAdmin && (
            <Link to="/admin">
              <Button variant="outline" size="sm" className="flex items-center space-x-2">
                <Shield className="h-4 w-4" />
                <span>Admin</span>
              </Button>
            </Link>
          )}
          <Link to="/feedback">
            <Button variant="outline" size="sm" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Feedback</span>
            </Button>
          </Link>
          <Button 
            onClick={handleSignOut}
            variant="outline" 
            size="sm"
            className="flex items-center space-x-2"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
