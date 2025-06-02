
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Bot, CheckCircle, Users, ArrowRight, Sparkles, Zap, Target, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

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

  const stats = [
    { number: "Early", label: "Development", icon: <Sparkles className="h-5 w-5" /> },
    { number: "Live", label: "Demo", icon: <Eye className="h-5 w-5" /> },
    { number: "Direct", label: "Input", icon: <Target className="h-5 w-5" /> },
    { number: "Free", label: "Access", icon: <Users className="h-5 w-5" /> }
  ];

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
      </header>

      <main className="container mx-auto px-4 py-12 relative z-10">
        {/* Hero Section */}
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
            
            {/* Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12 max-w-4xl mx-auto">
              {stats.map((stat, index) => (
                <div key={index} className="text-center p-4 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10">
                  <div className="flex items-center justify-center mb-2">
                    <div className="text-blue-400">{stat.icon}</div>
                  </div>
                  <div className="text-2xl font-bold text-white">{stat.number}</div>
                  <div className="text-sm text-slate-400">{stat.label}</div>
                </div>
              ))}
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

        {/* Features Grid */}
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

        {/* Final CTA Section */}
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
