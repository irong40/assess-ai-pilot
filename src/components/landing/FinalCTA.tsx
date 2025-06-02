
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const FinalCTA = () => {
  const navigate = useNavigate();

  return (
    <div className="text-center max-w-4xl mx-auto">
      <Card className="bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-cyan-600/20 backdrop-blur-lg border-white/20">
        <CardContent className="p-8 md:p-12">
          <h3 className="text-3xl font-bold text-white mb-4">
            Join the Cybersecurity Revolution
          </h3>
          <p className="text-slate-300 mb-8 text-lg">
            Be among the first to experience AI-powered compliance assessments. 
            Your feedback will directly shape the future of cybersecurity technology.
          </p>
          
          <Button 
            onClick={() => navigate("/auth")}
            size="lg"
            className="bg-white text-slate-900 hover:bg-slate-100 font-semibold px-8 py-3 transform hover:scale-105 transition-all duration-300 mb-6"
          >
            Start Your Free Access
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
          
          <div className="flex items-center justify-center space-x-6 text-sm text-slate-400">
            <span>✓ Instant access</span>
            <span>✓ Live demo included</span>
            <span>✓ Shape the product</span>
            <span>✓ Expert community</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinalCTA;
