
import { Button } from "@/components/ui/button";
import { Shield, Menu, User } from "lucide-react";
import { useState } from "react";

interface HeaderProps {
  user?: {
    email: string;
    role: string;
  } | null;
  onSignOut?: () => void;
}

const Header = ({ user, onSignOut }: HeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
            {user?.role === 'admin' && (
              <a href="/admin" className="hover:text-blue-400 transition-colors">Admin</a>
            )}
          </nav>

          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span className="text-sm">{user.email}</span>
                  <span className="text-xs bg-blue-600 px-2 py-1 rounded">{user.role}</span>
                </div>
                <Button variant="outline" size="sm" onClick={onSignOut}>
                  Sign Out
                </Button>
              </div>
            ) : (
              <Button variant="outline" size="sm">
                Sign In
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
              {user?.role === 'admin' && (
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
