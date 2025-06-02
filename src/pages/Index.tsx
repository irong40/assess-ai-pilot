
import { Button } from "@/components/ui/button";
import { Shield, Eye, HelpCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import HeroSection from "@/components/landing/HeroSection";
import StatsBar from "@/components/landing/StatsBar";
import FeaturesGrid from "@/components/landing/FeaturesGrid";
import FinalCTA from "@/components/landing/FinalCTA";

const Index = () => {
  const navigate = useNavigate();

  const backgroundStyle = {
    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 opacity-20" style={backgroundStyle}></div>
      
      {/* Header */}
      <header className="container mx-auto px-4 py-6 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Shield className="h-8 w-8 text-blue-400" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Sentinel AI</h1>
              <p className="text-xs text-slate-300">AI-Powered Compliance Platform</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button 
              onClick={() => navigate("/help")}
              variant="ghost"
              size="sm"
              className="text-white border-white/30 hover:bg-white/10 backdrop-blur-sm transition-all duration-300"
            >
              <HelpCircle className="h-4 w-4 mr-2" />
              Help
            </Button>
            <Button 
              onClick={() => navigate("/dashboard")}
              variant="outline"
              size="sm"
              className="text-white border-white/30 hover:bg-white/10 backdrop-blur-sm transition-all duration-300"
            >
              <Eye className="h-4 w-4 mr-2" />
              Try Demo
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 relative z-10">
        {/* Hero Section */}
        <HeroSection />
        
        {/* Stats Bar */}
        <StatsBar />

        {/* Features Grid */}
        <FeaturesGrid />

        {/* Final CTA Section */}
        <FinalCTA />
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 mt-16 border-t border-white/10 relative z-10">
        <div className="text-center text-slate-400 text-sm">
          <p>&copy; 2024 Sentinel AI. Transforming cybersecurity compliance with artificial intelligence.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
