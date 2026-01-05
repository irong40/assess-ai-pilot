import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Bot, CheckCircle, FileText, Download } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import AgentSummaryCard from "@/components/AgentSummaryCard";
import ExecutiveSummaryCard from "@/components/ExecutiveSummaryCard";
import ComplianceMatrix from "@/components/ComplianceMatrix";

const LeadSummary = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [summary, setSummary] = useState("");
  const [isCompiling, setIsCompiling] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  // Agent findings data (mock data for summary display)
  const agentFindings = [
    {
      agent: "ISSO-Policy",
      agentId: "policy",
      riskLevel: "Medium",
      findings: 8,
      criticalIssues: 2,
      summary: "Policy documentation is mostly complete but lacks specific incident response procedures"
    },
    {
      agent: "ISSO-Physical", 
      agentId: "physical",
      riskLevel: "High",
      findings: 12,
      criticalIssues: 4,
      summary: "Physical access controls need significant improvement in server room areas"
    },
    {
      agent: "ISSO-Network",
      agentId: "network",
      riskLevel: "Medium",
      findings: 6,
      criticalIssues: 1,
      summary: "Network segmentation is adequate but monitoring capabilities need enhancement"
    },
    {
      agent: "ISSO-Access",
      agentId: "access",
      riskLevel: "Low",
      findings: 4,
      criticalIssues: 0,
      summary: "Access controls are well-implemented with proper authentication mechanisms"
    },
    {
      agent: "ISSO-Data",
      agentId: "data",
      riskLevel: "Medium",
      findings: 7,
      criticalIssues: 2,
      summary: "Data encryption is strong but backup procedures need standardization"
    }
  ] as const;

  // Calculate metrics (using static data since agents are deprecated)
  const completedAgents = agentFindings.length;
  const totalFindings = agentFindings.reduce((sum, agent) => sum + agent.findings, 0);
  const totalCritical = agentFindings.reduce((sum, agent) => sum + agent.criticalIssues, 0);
  const overallRiskLevel = totalCritical > 5 ? "High" : totalCritical > 2 ? "Medium" : "Low";
  const complianceScore = Math.max(85 - (totalCritical * 3), 65);

  // Mock compliance data
  const complianceControls = [
    { control: "AC-2: Account Management", status: "implemented", description: "User account management procedures are in place" },
    { control: "AC-3: Access Enforcement", status: "implemented", description: "Access control policies are enforced" },
    { control: "PE-2: Physical Access", status: "partial", description: "Physical access controls need enhancement" },
    { control: "SC-7: Boundary Protection", status: "implemented", description: "Network boundary protection is configured" },
    { control: "CP-2: Contingency Plan", status: "partial", description: "Disaster recovery plan requires updates" },
    { control: "SI-4: Information Monitoring", status: "missing", description: "Comprehensive monitoring not implemented" }
  ] as const;

  const handleCompileSummary = async () => {
    setIsCompiling(true);
    
    setTimeout(() => {
      const mockSummary = `# ISSO-Lead Comprehensive Assessment Summary

## Executive Overview
This cybersecurity assessment has identified ${totalFindings} findings across ${completedAgents} security domains. The overall security posture shows a **${overallRiskLevel}** risk profile with ${totalCritical} critical issues requiring immediate attention.

## Assessment Metrics
- **Total Findings**: ${totalFindings} issues identified
- **Critical Issues**: ${totalCritical} requiring immediate remediation
- **Compliance Score**: ${complianceScore}% (NIST 800-53)
- **Agents Completed**: ${completedAgents} of ${agentFindings.length}

## Priority Remediation Items

### Immediate Action Required (30 days)
1. **Physical Security**: Implement card reader access controls for server room
2. **Policy Documentation**: Complete incident response playbook development
3. **Data Backup**: Standardize backup encryption and testing procedures

### Short-term Improvements (90 days)
1. **Network Monitoring**: Deploy additional SIEM rules for lateral movement detection
2. **Access Management**: Implement privileged access management (PAM) solution

## Risk Assessment Summary
The highest risk areas identified are:
- Physical security infrastructure gaps
- Inconsistent backup and recovery procedures
- Limited security monitoring capabilities

## Compliance Status
- **NIST 800-53**: ${complianceScore}% compliant
- **Implemented Controls**: ${complianceControls.filter(c => c.status === 'implemented').length} of ${complianceControls.length}
- **Controls Needing Work**: ${complianceControls.filter(c => c.status !== 'implemented').length}

## Recommendations for ISSM Review
This assessment is ready for final ISSM review and approval. All critical findings have been validated and mitigation strategies proposed. The organization demonstrates a strong security foundation with targeted areas for improvement.`;

      setSummary(mockSummary);
      setIsCompiling(false);
      setIsComplete(true);
      
      toast({
        title: "Summary Compiled",
        description: "ISSO-Lead comprehensive summary has been generated successfully",
      });
    }, 4000);
  };

  const handleSubmitToISSM = () => {
    toast({
      title: "Submitted to ISSM",
      description: "Assessment summary has been forwarded for final review and approval",
    });
    navigate(`/assessment/${id}/issm-review`);
  };

  const handleExportReport = () => {
    toast({
      title: "Report Generated",
      description: "Assessment report has been generated and is ready for download",
    });
    navigate(`/assessment/${id}/report`);
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center space-x-3 mb-8">
            <div className="p-3 bg-purple-50 rounded-lg">
              <Shield className="h-8 w-8 text-purple-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Assessment Summary & Analysis</h1>
              <p className="text-muted-foreground">Comprehensive security assessment results and recommendations</p>
            </div>
            {isComplete && <CheckCircle className="h-8 w-8 text-green-600" />}
          </div>

          {/* Executive Summary */}
          <div className="mb-8">
            <ExecutiveSummaryCard
              totalFindings={totalFindings}
              criticalIssues={totalCritical}
              overallRiskLevel={overallRiskLevel as "High" | "Medium" | "Low"}
              complianceScore={complianceScore}
              completedAgents={completedAgents}
              totalAgents={agentFindings.length}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Agent Results */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-6">Agent Analysis Results</h2>
                <div className="space-y-4">
                  {agentFindings.map((agent) => (
                    <AgentSummaryCard
                      key={agent.agent}
                      agentName={agent.agent}
                      status="completed"
                      findings={agent.findings}
                      criticalIssues={agent.criticalIssues}
                      riskLevel={agent.riskLevel as "High" | "Medium" | "Low"}
                      summary={agent.summary}
                    />
                  ))}
                </div>
              </div>

              {/* Compliance Matrix */}
              <ComplianceMatrix
                framework="NIST 800-53"
                overallScore={complianceScore}
                controls={complianceControls}
              />
            </div>

            {/* Actions Panel */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Generate Final Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-muted-foreground mb-4">
                    Compile comprehensive analysis from all completed agents for ISSM review.
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
                    <div className="space-y-3 pt-4 border-t">
                      <Button 
                        onClick={handleSubmitToISSM}
                        className="w-full bg-red-600 hover:bg-red-700 text-white"
                        size="lg"
                      >
                        <Shield className="h-4 w-4 mr-2" />
                        Submit to ISSM
                      </Button>
                      
                      <Button 
                        onClick={handleExportReport}
                        variant="outline"
                        className="w-full"
                        size="lg"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Export Report
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
                <div className="flex items-center justify-between">
                  <CardTitle>Comprehensive Assessment Summary</CardTitle>
                  <Button
                    onClick={handleExportReport}
                    variant="outline"
                    size="sm"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export PDF
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-lg border">{summary}</pre>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default LeadSummary;
