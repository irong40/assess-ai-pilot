
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, User, Shield, TestTube } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

const Header = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header className="bg-white border-b border-slate-200 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-blue-600" />
              <h1 className="text-xl font-bold text-slate-900">CyberAssess</h1>
            </div>
            
            <nav className="hidden md:flex items-center space-x-6 ml-8">
              <Button 
                variant="ghost" 
                onClick={() => navigate("/dashboard")}
                className="text-slate-600 hover:text-slate-900"
              >
                Dashboard
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => navigate("/new-assessment")}
                className="text-slate-600 hover:text-slate-900"
              >
                New Assessment
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => navigate("/feedback")}
                className="text-slate-600 hover:text-slate-900"
              >
                Feedback
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => navigate("/test")}
                className="text-slate-600 hover:text-slate-900"
              >
                <TestTube className="h-4 w-4 mr-2" />
                Test Suite
              </Button>
            </nav>
          </div>

          {user && (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-slate-600" />
                <span className="text-sm font-medium text-slate-700">{user.email}</span>
                <Badge variant="secondary" className="text-xs">
                  ISSO
                </Badge>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="text-slate-600 hover:text-slate-900"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
