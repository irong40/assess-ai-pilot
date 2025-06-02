
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Bot, CheckCircle, Clock, Play } from "lucide-react";
import Header from "@/components/Header";
import { useNavigate, useParams } from "react-router-dom";

const AgentHub = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const user = {
    email: "admin@company.com",
    role: "admin"
  };

  // Mock assessment data
  const assessment = {
    id: id,
    systemName: "Customer Portal System",
    environment: "Production",
    scope: "NIST 800-53"
  };

  const agents = [
    {
      id: "policy",
      name: "ISSO-Policy",
      description: "Reviews security policies, procedures, and governance documentation",
      status: "completed" as const,
      progress: 100
    },
    {
      id: "physical",
      name: "ISSO-Physical",
      description: "Assesses physical security controls and facility protections",
      status: "in-progress" as const,
      progress: 60
    },
    {
      id: "network",
      name: "ISSO-Network",
      description: "Analyzes network architecture, segmentation, and security controls",
      status: "not-started" as const,
      progress: 0
    },
    {
      id: "access",
      name: "ISSO-Access",
      description: "Evaluates access controls, authentication, and authorization mechanisms",
      status: "not-started" as const,
      progress: 0
    },
    {
      id: "data",
      name: "ISSO-Data",
      description: "Reviews data protection, encryption, and information lifecycle management",
      status: "not-started" as const,
      progress: 0
    },
    {
      id: "incident",
      name: "ISSO-Incident",
      description: "Assesses incident response procedures and monitoring capabilities",
      status: "not-started" as const,
      progress: 0
    },
    {
      id: "compliance",
      name: "ISSO-Compliance",
      description: "Validates regulatory compliance and audit readiness",
      status: "not-started" as const,
      progress: 0
    },
    {
      id: "vulnerability",
      name: "ISSO-Vulnerability",
      description: "Reviews vulnerability management and patch processes",
      status: "not-started" as const,
      progress: 0
    },
    {
      id: "training",
      name: "ISSO-Training",
      description: "Evaluates security awareness training and personnel practices",
      status: "not-started" as const,
      progress: 0
    },
    {
      id: "continuity",
      name: "ISSO-Continuity",
      description: "Assesses business continuity and disaster recovery capabilities",
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />
      
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
                <div className="text-2xl font-bold text-blue-600">{completedAgents}/10</div>
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

          <div className="flex items-center space-x-3 mb-6">
            <Bot className="h-6 w-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-slate-900">AI Assessment Agents</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((agent) => (
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

          {completedAgents === agents.length && (
            <div className="mt-8 text-center">
              <Card className="bg-green-50 border-green-200">
                <CardContent className="pt-6">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-green-900 mb-2">
                    All Agents Complete!
                  </h3>
                  <p className="text-green-700 mb-4">
                    All assessment agents have completed their analysis. Ready to proceed to summary compilation.
                  </p>
                  <Button 
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => navigate(`/assessment/${id}/summary`)}
                  >
                    Proceed to Summary
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
