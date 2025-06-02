
import { Button } from "@/components/ui/button";
import { Shield, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const AuthHeader = () => {
  const navigate = useNavigate();

  return (
    <header className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Shield className="h-8 w-8 text-blue-400" />
          <div>
            <h1 className="text-xl font-bold text-white">Sentinel AI</h1>
            <p className="text-xs text-slate-300">AI-Powered Compliance Platform</p>
          </div>
        </div>
        
        <Button 
          variant="ghost" 
          onClick={() => navigate("/")}
          className="text-white hover:text-blue-400"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>
      </div>
    </header>
  );
};

export default AuthHeader;
