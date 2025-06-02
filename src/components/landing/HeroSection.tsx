
import { Button } from "@/components/ui/button";
import { CheckCircle, Sparkles, ArrowRight, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <div className="text-center mb-20">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-center mb-6">
          <Sparkles className="h-6 w-6 text-yellow-400 mr-2 animate-pulse" />
          <span className="text-sm font-semibold text-yellow-300 uppercase tracking-wider">
            Early Access Available Now
          </span>
        </div>
        
        <h2 className="text-6xl md:text-7xl font-bold text-white mb-8 leading-tight">
          The Future of
          <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent block">
            Cybersecurity
          </span>
          <span className="text-5xl md:text-6xl">Assessments</span>
        </h2>
        
        <p className="text-xl text-slate-300 mb-6 leading-relaxed max-w-3xl mx-auto">
          We're building 15 specialized AI agents to revolutionize compliance assessments. 
          Join early and help shape the platform that will transform cybersecurity.
        </p>

        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-400/30 rounded-lg p-6 mb-10 max-w-2xl mx-auto">
          <h3 className="text-blue-200 font-semibold mb-3">What You Get Today:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-blue-100">
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-400 mr-2 flex-shrink-0" />
              <span>Live demo of AI assessment tools</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-400 mr-2 flex-shrink-0" />
              <span>Early access to new features</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-400 mr-2 flex-shrink-0" />
              <span>Direct line to product team</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-400 mr-2 flex-shrink-0" />
              <span>Help shape the roadmap</span>
            </div>
          </div>
        </div>
        
        {/* Primary CTA */}
        <div className="mb-8">
          <Button 
            onClick={() => navigate("/auth")}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-12 py-6 text-xl font-semibold shadow-xl transform hover:scale-105 transition-all duration-300"
          >
            Get Free Early Access
            <ArrowRight className="h-6 w-6 ml-3" />
          </Button>
        </div>

        <p className="text-sm text-slate-400 mb-4">
          ✓ Completely free • ✓ No credit card required • ✓ Instant access
        </p>

        <div className="text-sm text-slate-400">
          Want to see it first?{" "}
          <Button 
            onClick={() => navigate("/dashboard")}
            variant="link"
            className="text-blue-400 hover:text-blue-300 p-0 h-auto font-normal text-sm underline"
          >
            Try the demo
          </Button>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
