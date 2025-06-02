
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Bot, CheckCircle, Users, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Bot className="h-8 w-8 text-blue-600" />,
      title: "AI-Powered Agents",
      description: "10 specialized AI agents analyze every aspect of your cybersecurity posture"
    },
    {
      icon: <Shield className="h-8 w-8 text-green-600" />,
      title: "Compliance Ready", 
      description: "Built for NIST, HIPAA, CMMC, and other major compliance frameworks"
    },
    {
      icon: <CheckCircle className="h-8 w-8 text-purple-600" />,
      title: "Automated Reports",
      description: "Generate comprehensive assessment reports with POAM tables automatically"
    },
    {
      icon: <Users className="h-8 w-8 text-orange-600" />,
      title: "Role-Based Workflow",
      description: "ISSO, ISSM, and Admin roles with tailored interfaces and permissions"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Shield className="h-8 w-8 text-blue-400" />
            <div>
              <h1 className="text-xl font-bold text-white">SecureAssess</h1>
              <p className="text-xs text-slate-300">AI-Powered Compliance Platform</p>
            </div>
          </div>
          
          <Button 
            onClick={() => navigate("/auth")}
            variant="outline"
            className="text-white border-white/30 hover:bg-white/10"
          >
            Sign In
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Next-Generation 
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                {" "}Cybersecurity{" "}
              </span>
              Assessments
            </h2>
            <p className="text-xl text-slate-300 mb-8 leading-relaxed">
              Leverage AI-powered agents to conduct comprehensive security assessments, 
              ensure compliance, and generate detailed reports automatically.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                onClick={() => navigate("/auth")}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
              >
                Get Started
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
              
              <Button 
                onClick={() => navigate("/dashboard")}
                variant="outline"
                size="lg"
                className="border-white/30 text-white hover:bg-white/10 px-8 py-3 text-lg"
              >
                View Demo
              </Button>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="max-w-6xl mx-auto mb-16">
          <h3 className="text-3xl font-bold text-white text-center mb-12">
            Why Choose SecureAssess?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="bg-white/10 backdrop-blur-lg border-white/20 hover:bg-white/15 transition-all duration-300">
                <CardContent className="p-6 text-center">
                  <div className="mb-4 flex justify-center">
                    {feature.icon}
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

        {/* Demo CTA */}
        <div className="text-center">
          <Card className="max-w-2xl mx-auto bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-lg border-white/20">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold text-white mb-4">
                Ready to Transform Your Security Assessments?
              </h3>
              <p className="text-slate-300 mb-6">
                Join organizations already using AI to streamline their compliance processes
              </p>
              <Button 
                onClick={() => navigate("/auth")}
                size="lg"
                className="bg-white text-slate-900 hover:bg-slate-100"
              >
                Start Free Trial
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 mt-16 border-t border-white/10">
        <div className="text-center text-slate-400 text-sm">
          <p>&copy; 2024 SecureAssess. Transforming cybersecurity compliance with AI.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
