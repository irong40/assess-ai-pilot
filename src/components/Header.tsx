
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, User, Shield } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { NotificationBell } from "@/components/notifications/NotificationBell";

const Header = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header className="bg-card border-b border-border shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-primary" />
              <h1 className="text-xl font-bold text-foreground">Sentinel AI</h1>
            </div>
            
            <nav className="hidden md:flex items-center space-x-4 ml-8">
              <Button variant="ghost" onClick={() => navigate("/dashboard")}>
                Dashboard
              </Button>
              <Button variant="ghost" onClick={() => navigate("/new-assessment")}>
                New Assessment
              </Button>
              <Button variant="ghost" onClick={() => navigate("/compliance/rag")}>
                Knowledge AI
              </Button>
              <Button variant="ghost" onClick={() => navigate("/compliance/poam")}>
                POA&M
              </Button>
              <Button variant="ghost" onClick={() => navigate("/compliance/audit")}>
                Audit Log
              </Button>
            </nav>
          </div>

          {user && (
            <div className="flex items-center space-x-4">
              <NotificationBell />
              
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground hidden sm:block">{user.email}</span>
                <Badge variant="secondary" className="text-xs">
                  ISSO
                </Badge>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
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
