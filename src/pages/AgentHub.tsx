import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Bot, CheckCircle, Clock, Play, Users, Shield } from "lucide-react";
import Header from "@/components/Header";
import { useNavigate, useParams } from "react-router-dom";

const AgentHub = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  // Mock assessment data
  const assessment = {
    id: id,
    systemName: "Customer Portal System",
    environment: "Production",
    scope: "NIST 800-53"
  };

  const user = {
    email: "admin@company.com",
    role: "admin"
  };

  const agents = [
    // Core Analysis Agents
    {
      id: "policy",
      name: "ISSO-Policy",
      description: "Reviews security policies for completeness, compliance, and alignment",
      category: "core",
      status: "completed" as const,
      progress: 100
    },
    {
      id: "physical",
      name: "ISSO-Physical",
      description: "Evaluates physical safeguards and access controls",
      category: "core",
      status: "in-progress" as const,
      progress: 60
    },
    {
      id: "network",
      name: "ISSO-Network",
      description: "Analyzes network architecture and security controls",
      category: "core",
      status: "not-started" as const,
      progress: 0
    },
    {
      id: "access",
      name: "ISSO-Access",
      description: "Evaluates access controls and authentication mechanisms",
      category: "core",
      status: "not-started" as const,
      progress: 0
    },
    {
      id: "data",
      name: "ISSO-Data",
      description: "Reviews data protection and encryption controls",
      category: "core",
      status: "not-started" as const,
      progress: 0
    },
    {
      id: "configuration",
      name: "ISSO-Configuration",
      description: "Reviews baseline configurations and hardening standards",
      category: "core",
      status: "not-started" as const,
      progress: 0
    },
    {
      id: "recovery",
      name: "ISSO-Recovery",
      description: "Assesses disaster recovery and continuity planning",
      category: "core",
      status: "not-started" as const,
      progress: 0
    },
    {
      id: "privacy",
      name: "ISSO-Privacy",
      description: "Ensures data privacy controls and compliance",
      category: "core",
      status: "not-started" as const,
      progress: 0
    },
    // Specialized Security Agents
    {
      id: "blue-team",
      name: "ISSO-Blue Team",
      description: "Validates logging, SIEM/EDR configurations, and detection capabilities",
      category: "specialized",
      status: "not-started" as const,
      progress: 0
    },
    {
      id: "threat-intel",
      name: "ISSO-Threat Intelligence",
      description: "Monitors threat intelligence and correlates with enterprise findings",
      category: "specialized",
      status: "not-started" as const,
      progress: 0
    },
    {
      id: "supply-chain",
      name: "ISSO-Supply Chain",
      description: "Audits vendor and third-party risk management",
      category: "specialized",
      status: "not-started" as const,
      progress: 0
    },
    {
      id: "grc",
      name: "ISSO-GRC",
      description: "Manages governance, risk, and compliance documentation",
      category: "specialized",
      status: "not-started" as const,
      progress: 0
    },
    {
      id: "training",
      name: "ISSO-Training",
      description: "Reviews security training and awareness programs",
      category: "specialized",
      status: "not-started" as const,
      progress: 0
    },
    {
      id: "mobile",
      name: "ISSO-Mobile/BYOD",
      description: "Audits mobile and BYOD security risks",
      category: "specialized",
      status: "not-started" as const,
      progress: 0
    },
    {
      id: "legal",
      name: "ISSO-Legal",
      description: "Identifies legal and regulatory compliance risks",
      category: "specialized",
      status: "not-started" as const,
      progress: 0
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'in-progress':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      default:
        return <Play className="h-5 w-5 text-slate-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Complete';
      case 'in-progress': return 'In Progress';
      default: return 'Not Started';
    }
  };

  const handleAgentClick = (agentId: string) => {
    navigate(`/assessment/${id}/agents/${agentId}`);
  };

  const completedAgents = agents.filter(agent => agent.status === 'completed').length;
  const overallProgress = (completedAgents / agents.length) * 100;

  const coreAgents = agents.filter(agent => agent.category === 'core');
  const specializedAgents = agents.filter(agent => agent.category === 'specialized');

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center space-x-4 mb-8">
            <Button 
              variant="ghost" 
              onClick={() => navigate("/dashboard")}
              className="text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">{assessment.systemName}</h1>
                <div className="flex items-center space-x-4 text-sm text-slate-600">
                  <span>Environment: <strong>{assessment.environment}</strong></span>
                  <span>Scope: <strong>{assessment.scope}</strong></span>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">{completedAgents}/{agents.length}</div>
                <div className="text-sm text-slate-600">Agents Complete</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Overall Progress</span>
                <span className="font-medium">{Math.round(overallProgress)}%</span>
              </div>
              <Progress value={overallProgress} className="h-2" />
            </div>
          </div>

          {/* Workflow Management Section */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <Users className="h-6 w-6 text-purple-600" />
              <h2 className="text-xl font-bold text-slate-900">Workflow Management</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                onClick={() => navigate(`/assessment/${id}/lead-summary`)}
                variant="outline"
                className="h-16 flex flex-col items-center justify-center space-y-1"
                disabled={completedAgents < agents.length}
              >
                <Shield className="h-5 w-5 text-purple-600" />
                <span className="text-sm font-medium">ISSO-Lead Summary</span>
                <span className="text-xs text-slate-500">Compile findings</span>
              </Button>
              
              <Button
                onClick={() => navigate(`/assessment/${id}/issm-review`)}
                variant="outline"
                className="h-16 flex flex-col items-center justify-center space-y-1"
                disabled={completedAgents < agents.length}
              >
                <Users className="h-5 w-5 text-red-600" />
                <span className="text-sm font-medium">ISSM Review</span>
                <span className="text-xs text-slate-500">Final approval</span>
              </Button>
              
              <Button
                onClick={() => navigate(`/assessment/${id}/report`)}
                variant="outline"
                className="h-16 flex flex-col items-center justify-center space-y-1"
                disabled={completedAgents < agents.length}
              >
                <Bot className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium">Generate Report</span>
                <span className="text-xs text-slate-500">TechWrite agent</span>
              </Button>
            </div>
          </div>

          {/* Core Analysis Agents */}
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-6">
              <Bot className="h-6 w-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-slate-900">Core Analysis Agents</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {coreAgents.map((agent) => (
                <Card 
                  key={agent.id}
                  className="hover:shadow-lg transition-all duration-200 cursor-pointer border-slate-200 hover:border-blue-300"
                  onClick={() => handleAgentClick(agent.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-50 rounded-lg">
                          <Bot className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg font-semibold">{agent.name}</CardTitle>
                        </div>
                      </div>
                      {getStatusIcon(agent.status)}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {agent.description}
                    </p>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge className={`${getStatusColor(agent.status)} border-0`}>
                          {getStatusText(agent.status)}
                        </Badge>
                        <span className="text-sm font-medium text-slate-600">
                          {agent.progress}%
                        </span>
                      </div>
                      
                      <Progress value={agent.progress} className="h-1.5" />
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAgentClick(agent.id);
                        }}
                      >
                        {agent.status === 'not-started' ? 'Start' : 
                         agent.status === 'in-progress' ? 'Continue' : 'Review'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Specialized Security Agents */}
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-6">
              <Shield className="h-6 w-6 text-purple-600" />
              <h2 className="text-2xl font-bold text-slate-900">Specialized Security Agents</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {specializedAgents.map((agent) => (
                <Card 
                  key={agent.id}
                  className="hover:shadow-lg transition-all duration-200 cursor-pointer border-slate-200 hover:border-purple-300"
                  onClick={() => handleAgentClick(agent.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-purple-50 rounded-lg">
                          <Shield className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg font-semibold">{agent.name}</CardTitle>
                        </div>
                      </div>
                      {getStatusIcon(agent.status)}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {agent.description}
                    </p>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge className={`${getStatusColor(agent.status)} border-0`}>
                          {getStatusText(agent.status)}
                        </Badge>
                        <span className="text-sm font-medium text-slate-600">
                          {agent.progress}%
                        </span>
                      </div>
                      
                      <Progress value={agent.progress} className="h-1.5" />
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAgentClick(agent.id);
                        }}
                      >
                        {agent.status === 'not-started' ? 'Start' : 
                         agent.status === 'in-progress' ? 'Continue' : 'Review'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {completedAgents === agents.length && (
            <div className="mt-8 text-center">
              <Card className="bg-green-50 border-green-200">
                <CardContent className="pt-6">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-green-900 mb-2">
                    All Agents Complete!
                  </h3>
                  <p className="text-green-700 mb-4">
                    All assessment agents have completed their analysis. Ready to proceed to ISSO-Lead compilation.
                  </p>
                  <Button 
                    className="bg-green-600 hover:bg-green-700 text-white mr-4"
                    onClick={() => navigate(`/assessment/${id}/lead-summary`)}
                  >
                    Proceed to Lead Summary
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AgentHub;
