import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Shield, Bot, CheckCircle, AlertTriangle, Users } from "lucide-react";
import Header from "@/components/Header";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

const LeadSummary = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [summary, setSummary] = useState("");
  const [isCompiling, setIsCompiling] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const user = {
    email: "lead@company.com",
    role: "ISSO-Lead"
  };

  // Mock findings data from all agents
  const agentFindings = [
    {
      agent: "ISSO-Policy",
      status: "Complete",
      riskLevel: "Medium",
      findings: 8,
      criticalIssues: 2,
      summary: "Policy documentation is mostly complete but lacks specific incident response procedures"
    },
    {
      agent: "ISSO-Physical", 
      status: "Complete",
      riskLevel: "High",
      findings: 12,
      criticalIssues: 4,
      summary: "Physical access controls need significant improvement in server room areas"
    },
    {
      agent: "ISSO-Network",
      status: "Complete", 
      riskLevel: "Medium",
      findings: 6,
      criticalIssues: 1,
      summary: "Network segmentation is adequate but monitoring capabilities need enhancement"
    },
    {
      agent: "ISSO-Access",
      status: "Complete",
      riskLevel: "Low",
      findings: 4,
      criticalIssues: 0,
      summary: "Access controls are well-implemented with proper authentication mechanisms"
    },
    {
      agent: "ISSO-Data",
      status: "Complete",
      riskLevel: "Medium",
      findings: 7,
      criticalIssues: 2,
      summary: "Data encryption is strong but backup procedures need standardization"
    }
  ];

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'High': return 'bg-red-100 text-red-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCompileSummary = async () => {
    setIsCompiling(true);
    
    setTimeout(() => {
      const mockSummary = `# ISSO-Lead Comprehensive Assessment Summary

## Executive Overview
This cybersecurity assessment has identified several areas requiring immediate attention and ongoing monitoring. The overall security posture shows a **Medium** risk profile with specific high-priority items requiring remediation.

## Critical Findings Summary
- **Total Findings**: 37 issues across all domains
- **Critical Issues**: 9 requiring immediate attention
- **High-Risk Areas**: Physical security, data backup procedures
- **Overall Risk Rating**: Medium

## Priority Remediation Items

### Immediate Action Required (30 days)
1. **Physical Security**: Implement card reader access controls for server room
2. **Policy Documentation**: Complete incident response playbook development
3. **Data Backup**: Standardize backup encryption and testing procedures

### Short-term Improvements (90 days)
1. **Network Monitoring**: Deploy additional SIEM rules for lateral movement detection
2. **Access Management**: Implement privileged access management (PAM) solution

## Compliance Status
- **NIST 800-53**: 83% compliant (needs improvement in Physical and Personnel domains)
- **Risk Assessment**: Complete with documented mitigation strategies
- **Control Implementation**: 156 of 188 controls properly implemented

## Agent Analysis Summary
Each specialized agent has completed their domain analysis with varying risk levels identified. The highest concerns are in physical security infrastructure and backup standardization.

## Recommendations for ISSM Review
This assessment is ready for final ISSM review and approval. All critical findings have been validated and mitigation strategies proposed.`;

      setSummary(mockSummary);
      setIsCompiling(false);
      setIsComplete(true);
      
      toast({
        title: "Summary Compiled",
        description: "ISSO-Lead summary has been generated and is ready for ISSM review",
      });
    }, 4000);
  };

  const handleSubmitToISSM = () => {
    toast({
      title: "Submitted to ISSM",
      description: "Assessment summary has been forwarded for final review",
    });
    navigate(`/assessment/${id}/issm-review`);
  };

  const totalFindings = agentFindings.reduce((sum, agent) => sum + agent.findings, 0);
  const totalCritical = agentFindings.reduce((sum, agent) => sum + agent.criticalIssues, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center space-x-4 mb-8">
            <Button 
              variant="ghost" 
              onClick={() => navigate(`/assessment/${id}/agents`)}
              className="text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Agent Hub
            </Button>
          </div>

          <div className="flex items-center space-x-3 mb-8">
            <div className="p-3 bg-purple-50 rounded-lg">
              <Shield className="h-8 w-8 text-purple-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">ISSO-Lead Summary Compilation</h1>
              <p className="text-slate-600">Compile and analyze findings from all assessment agents</p>
            </div>
            {isComplete && <CheckCircle className="h-8 w-8 text-green-600" />}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Agent Findings Overview */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Agent Findings Overview</span>
                    <div className="flex items-center space-x-4 text-sm">
                      <span className="text-slate-600">Total: <strong>{totalFindings} findings</strong></span>
                      <span className="text-red-600">Critical: <strong>{totalCritical}</strong></span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {agentFindings.map((agent) => (
                      <div key={agent.agent} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-slate-900">{agent.agent}</h3>
                          <div className="flex items-center space-x-2">
                            <Badge className={getRiskColor(agent.riskLevel)}>
                              {agent.riskLevel} Risk
                            </Badge>
                            <span className="text-sm text-slate-600">
                              {agent.findings} findings ({agent.criticalIssues} critical)
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-slate-600">{agent.summary}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Risk Analysis & Correlation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">3</div>
                      <div className="text-sm text-red-700">High Risk</div>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">2</div>
                      <div className="text-sm text-yellow-700">Medium Risk</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">1</div>
                      <div className="text-sm text-green-700">Low Risk</div>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <h4 className="font-medium text-slate-900 mb-2">Cross-Agent Correlations</h4>
                    <ul className="text-sm text-slate-600 space-y-1">
                      <li>• Physical and Network security gaps may allow unauthorized access</li>
                      <li>• Policy and Data findings indicate need for backup procedure standardization</li>
                      <li>• Access controls are strong but need integration with physical security</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Summary Generation */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Generate Lead Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-slate-600 mb-4">
                    Compile findings from all agents into a comprehensive summary for ISSM review.
                  </div>
                  
                  <Button 
                    onClick={handleCompileSummary}
                    disabled={isCompiling || isComplete}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                    size="lg"
                  >
                    {isCompiling ? (
                      <>
                        <Bot className="h-4 w-4 mr-2 animate-pulse" />
                        Compiling Analysis...
                      </>
                    ) : isComplete ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Summary Complete
                      </>
                    ) : (
                      <>
                        <Bot className="h-4 w-4 mr-2" />
                        Generate Summary
                      </>
                    )}
                  </Button>

                  {isComplete && (
                    <div className="mt-6 pt-6 border-t">
                      <h4 className="font-medium text-slate-900 mb-3">Ready for ISSM Review</h4>
                      <Button 
                        onClick={handleSubmitToISSM}
                        className="w-full bg-red-600 hover:bg-red-700 text-white"
                        size="lg"
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Submit to ISSM
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {isCompiling && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <Bot className="h-8 w-8 text-blue-600 mx-auto mb-3 animate-pulse" />
                      <h4 className="font-medium text-blue-900 mb-2">AI Analysis in Progress</h4>
                      <p className="text-sm text-blue-700">
                        Correlating findings, analyzing risk patterns, and preparing comprehensive summary...
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Generated Summary Display */}
          {summary && (
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Compiled Assessment Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap text-sm bg-slate-50 p-4 rounded-lg">{summary}</pre>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default LeadSummary;
