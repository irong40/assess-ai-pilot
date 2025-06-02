
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Bot, CheckCircle, Users } from "lucide-react";

const FeaturesGrid = () => {
  const features = [
    {
      icon: <Bot className="h-8 w-8 text-blue-600" />,
      title: "AI-Powered Analysis",
      description: "Experience our early AI agents analyzing cybersecurity frameworks and compliance requirements",
      highlight: "Live Demo"
    },
    {
      icon: <Shield className="h-8 w-8 text-green-600" />,
      title: "Framework Foundation", 
      description: "Built with NIST, HIPAA, and CMMC compliance standards as our core foundation",
      highlight: "Standards Ready"
    },
    {
      icon: <CheckCircle className="h-8 w-8 text-purple-600" />,
      title: "Early Access Benefits",
      description: "Get first access to new features and directly influence product development",
      highlight: "Shape the Future"
    },
    {
      icon: <Users className="h-8 w-8 text-orange-600" />,
      title: "Expert-Designed",
      description: "Created by cybersecurity professionals for ISSO, ISSM, and security teams",
      highlight: "By Experts"
    }
  ];

  return (
    <div className="max-w-7xl mx-auto mb-20">
      <div className="text-center mb-16">
        <h3 className="text-4xl font-bold text-white mb-4">
          Experience the Future Today
        </h3>
        <p className="text-xl text-slate-300 max-w-2xl mx-auto">
          See what's possible when AI meets cybersecurity expertise
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {features.map((feature, index) => (
          <Card key={index} className="bg-white/10 backdrop-blur-lg border-white/20 hover:bg-white/15 transition-all duration-300 transform hover:scale-105 group">
            <CardContent className="p-6 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-gradient-to-l from-blue-500/20 to-transparent w-20 h-20 rounded-bl-full"></div>
              
              <div className="mb-4 flex justify-center relative z-10">
                <div className="p-3 rounded-full bg-white/10 group-hover:bg-white/20 transition-colors">
                  {feature.icon}
                </div>
              </div>
              
              <div className="inline-block px-3 py-1 bg-blue-500/20 text-blue-300 text-xs font-semibold rounded-full mb-3">
                {feature.highlight}
              </div>
              
              <h4 className="text-lg font-semibold text-white mb-3">
                {feature.title}
              </h4>
              <p className="text-slate-300 text-sm leading-relaxed">
                {feature.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default FeaturesGrid;
