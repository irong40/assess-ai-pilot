
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
      title: "AI-Powered Agents",
      description: "15 specialized AI agents designed to analyze different aspects of cybersecurity",
      highlight: "15 Agents"
    },
    {
      icon: <Shield className="h-8 w-8 text-green-600" />,
      title: "Compliance Framework", 
      description: "Being built with NIST, HIPAA, CMMC, and other compliance frameworks in mind",
      highlight: "Framework Ready"
    },
    {
      icon: <CheckCircle className="h-8 w-8 text-purple-600" />,
      title: "Automated Reports",
      description: "Working towards generating comprehensive assessment reports automatically",
      highlight: "In Development"
    },
    {
      icon: <Users className="h-8 w-8 text-orange-600" />,
      title: "Role-Based Access",
      description: "Designed for ISSO, ISSM, and Admin roles with tailored interfaces",
      highlight: "Multi-Role"
    }
  ];

  const stats = [
    { number: "15", label: "AI Agents", icon: <Bot className="h-5 w-5" /> },
    { number: "Early", label: "Access", icon: <Target className="h-5 w-5" /> },
    { number: "Future", label: "Automation", icon: <Zap className="h-5 w-5" /> },
    { number: "Beta", label: "Testing", icon: <Users className="h-5 w-5" /> }
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
            View Demo
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
                Currently in Early Development
              </span>
            </div>
            
            <h2 className="text-6xl md:text-7xl font-bold text-white mb-8 leading-tight">
              AI-Powered
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent block">
                Cybersecurity
              </span>
              <span className="text-5xl md:text-6xl">Assessments</span>
            </h2>
            
            <p className="text-xl text-slate-300 mb-6 leading-relaxed max-w-3xl mx-auto">
              We're building the future of cybersecurity compliance with 15 specialized AI agents. 
              Get early access and help shape this revolutionary platform.
            </p>

            <div className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-4 mb-10 max-w-2xl mx-auto">
              <p className="text-blue-200 text-sm">
                <strong>What you get today:</strong> Access to our development environment, 
                early features, and the ability to provide feedback that shapes the product.
              </p>
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
            <div className="mb-6">
              <Button 
                onClick={() => navigate("/auth")}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-12 py-6 text-xl font-semibold shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                Get Early Access Now
                <ArrowRight className="h-6 w-6 ml-3" />
              </Button>
            </div>

            {/* Secondary Action */}
            <div className="flex items-center justify-center space-x-4 text-sm text-slate-300">
              <span>Want to see what we're building?</span>
              <Button 
                onClick={() => navigate("/dashboard")}
                variant="link"
                className="text-blue-400 hover:text-blue-300 p-0 h-auto font-normal"
              >
                View Demo →
              </Button>
            </div>

            <p className="text-sm text-slate-400 mt-6">
              Free early access • Shape the future • No commitment required
            </p>
          </div>
        </div>

        {/* Features Grid */}
        <div className="max-w-7xl mx-auto mb-20">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-white mb-4">
              What We're Building
            </h3>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Our vision for transforming cybersecurity assessments with AI technology
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
                Ready to Shape the Future of Cybersecurity?
              </h3>
              <p className="text-slate-300 mb-8 text-lg">
                Join our early development community. Get access to the latest features, 
                provide feedback, and help us build the ultimate AI-powered compliance platform.
              </p>
              
              <Button 
                onClick={() => navigate("/auth")}
                size="lg"
                className="bg-white text-slate-900 hover:bg-slate-100 font-semibold px-8 py-3 transform hover:scale-105 transition-all duration-300 mb-6"
              >
                Start Your Early Access
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              
              <div className="flex items-center justify-center space-x-6 text-sm text-slate-400">
                <span>✓ Free access</span>
                <span>✓ Early features</span>
                <span>✓ Direct feedback channel</span>
                <span>✓ Shape the product</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 mt-16 border-t border-white/10 relative z-10">
        <div className="text-center text-slate-400 text-sm">
          <p>&copy; 2024 Sentinel AI. Building the future of cybersecurity compliance with artificial intelligence.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
