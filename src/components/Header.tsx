
import { Button } from "@/components/ui/button";
import { Shield, Menu, User } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { data: profile } = useUserProfile();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <header className="bg-slate-900 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Shield className="h-8 w-8 text-blue-400" />
            <div>
              <h1 className="text-xl font-bold">SecureAssess</h1>
              <p className="text-xs text-slate-300">AI-Powered Compliance Platform</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-6">
            <a href="/dashboard" className="hover:text-blue-400 transition-colors">Dashboard</a>
            <a href="/assessments" className="hover:text-blue-400 transition-colors">Assessments</a>
            {profile?.roles?.includes('admin') && (
              <a href="/admin" className="hover:text-blue-400 transition-colors">Admin</a>
            )}
          </nav>

          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span className="text-sm">{user.email}</span>
                  {profile?.roles && profile.roles.length > 0 && (
                    <span className="text-xs bg-blue-600 px-2 py-1 rounded">
                      {profile.roles[0].toUpperCase()}
                    </span>
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={handleSignOut}>
                  Sign Out
                </Button>
              </div>
            ) : (
              <Button variant="outline" size="sm">
                <a href="/auth">Sign In</a>
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {isMenuOpen && (
          <nav className="md:hidden mt-4 pb-4 border-t border-slate-700 pt-4">
            <div className="flex flex-col space-y-2">
              <a href="/dashboard" className="hover:text-blue-400 transition-colors">Dashboard</a>
              <a href="/assessments" className="hover:text-blue-400 transition-colors">Assessments</a>
              {profile?.roles?.includes('admin') && (
                <a href="/admin" className="hover:text-blue-400 transition-colors">Admin</a>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
