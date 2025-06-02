
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Bot, CheckCircle, Users, ArrowRight, Mail, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

const Index = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter your email address",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    // Mock authentication - replace with actual auth
    setTimeout(() => {
      toast({
        title: "Welcome back!",
        description: "You have been signed in successfully",
      });
      navigate("/dashboard");
      setIsLoading(false);
    }, 1500);
  };

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
        <div className="flex items-center space-x-3">
          <Shield className="h-8 w-8 text-blue-400" />
          <div>
            <h1 className="text-xl font-bold text-white">SecureAssess</h1>
            <p className="text-xs text-slate-300">AI-Powered Compliance Platform</p>
          </div>
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
            
            {/* Auth Card */}
            <Card className="max-w-md mx-auto bg-white/10 backdrop-blur-lg border-white/20">
              <CardHeader>
                <CardTitle className="text-white text-center">
                  Get Started with SecureAssess
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 bg-white/20 border-white/30 text-white placeholder:text-slate-300"
                    />
                  </div>
                  <Button 
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    size="lg"
                  >
                    {isLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                        <span>Signing in...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Lock className="h-4 w-4" />
                        <span>Sign In with Magic Link</span>
                      </div>
                    )}
                  </Button>
                </form>
                <p className="text-center text-sm text-slate-300 mt-4">
                  Secure, passwordless authentication
                </p>
              </CardContent>
            </Card>
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
                onClick={() => navigate("/dashboard")}
                size="lg"
                className="bg-white text-slate-900 hover:bg-slate-100"
              >
                View Demo Dashboard
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
