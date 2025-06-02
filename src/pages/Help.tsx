
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  BookOpen, 
  Settings, 
  Zap, 
  FileText, 
  Shield, 
  Users, 
  Bot,
  CheckCircle,
  AlertTriangle,
  Play
} from "lucide-react";
import Header from "@/components/Header";

const Help = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center space-x-3 mb-8">
            <BookOpen className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Help & Documentation</h1>
              <p className="text-slate-600">Complete guide to using the ISSO Assessment Platform</p>
            </div>
          </div>

          <Tabs defaultValue="quick-start" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="quick-start" className="flex items-center space-x-2">
                <Zap className="h-4 w-4" />
                <span>Quick Start</span>
              </TabsTrigger>
              <TabsTrigger value="user-guide" className="flex items-center space-x-2">
                <BookOpen className="h-4 w-4" />
                <span>User Guide</span>
              </TabsTrigger>
              <TabsTrigger value="admin-guide" className="flex items-center space-x-2">
                <Settings className="h-4 w-4" />
                <span>Admin Guide</span>
              </TabsTrigger>
              <TabsTrigger value="features" className="flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span>Features</span>
              </TabsTrigger>
            </TabsList>

            {/* Quick Start Guide */}
            <TabsContent value="quick-start">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Zap className="h-5 w-5 text-green-600" />
                    <span>Quick Start Guide</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="border-green-200 bg-green-50">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center space-x-2">
                          <Play className="h-5 w-5" />
                          <span>Getting Started</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-start space-x-3">
                          <Badge variant="outline">1</Badge>
                          <div>
                            <p className="font-medium">Sign In</p>
                            <p className="text-sm text-slate-600">Access the platform with your credentials</p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3">
                          <Badge variant="outline">2</Badge>
                          <div>
                            <p className="font-medium">Create Assessment</p>
                            <p className="text-sm text-slate-600">Click "New Assessment" and fill in organization details</p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3">
                          <Badge variant="outline">3</Badge>
                          <div>
                            <p className="font-medium">Run One-Click Assessment</p>
                            <p className="text-sm text-slate-600">Use the "Complete Assessment" button for automated analysis</p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3">
                          <Badge variant="outline">4</Badge>
                          <div>
                            <p className="font-medium">Review Results</p>
                            <p className="text-sm text-slate-600">Check agent summaries and generate reports</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-blue-200 bg-blue-50">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center space-x-2">
                          <CheckCircle className="h-5 w-5" />
                          <span>First Assessment</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-sm text-slate-700">
                          <strong>Recommended approach for your first assessment:</strong>
                        </p>
                        <ul className="space-y-2 text-sm text-slate-600">
                          <li>• Start with the one-click complete assessment</li>
                          <li>• Upload key documents (policies, procedures)</li>
                          <li>• Review individual agent results</li>
                          <li>• Generate executive summary report</li>
                          <li>• Share with ISSO-Lead for review</li>
                        </ul>
                        <div className="bg-yellow-100 border border-yellow-300 rounded p-3">
                          <p className="text-sm text-yellow-800">
                            <strong>Tip:</strong> The one-click assessment provides a comprehensive baseline analysis across all security domains.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* User Guide */}
            <TabsContent value="user-guide">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <BookOpen className="h-5 w-5 text-blue-600" />
                      <span>Complete User Guide</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    
                    {/* Navigation */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Navigation & Interface</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <h4 className="font-medium">Dashboard</h4>
                          <p className="text-sm text-slate-600">View all assessments, analytics, and quick actions</p>
                        </div>
                        <div className="space-y-2">
                          <h4 className="font-medium">Assessment Hub</h4>
                          <p className="text-sm text-slate-600">Access individual AI agents and their specialized analyses</p>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Creating Assessments */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Creating Assessments</h3>
                      <div className="space-y-4">
                        <div className="bg-slate-50 p-4 rounded-lg">
                          <h4 className="font-medium mb-2">Assessment Setup</h4>
                          <ul className="space-y-1 text-sm text-slate-600">
                            <li>• Organization Name: Enter your organization's full name</li>
                            <li>• Assessment Type: Choose from NIST, ISO 27001, or custom frameworks</li>
                            <li>• DAAPM Position: Select appropriate classification level</li>
                            <li>• Scope: Define what systems/processes to include</li>
                          </ul>
                        </div>
                        
                        <div className="bg-slate-50 p-4 rounded-lg">
                          <h4 className="font-medium mb-2">Document Upload</h4>
                          <ul className="space-y-1 text-sm text-slate-600">
                            <li>• Supported formats: PDF, DOC, DOCX, TXT, images</li>
                            <li>• Maximum 5 files per agent</li>
                            <li>• Recommended: policies, procedures, audit reports</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* AI Agents */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3">AI Agent System</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[
                          { name: "ISSO-Policy", desc: "Reviews security policies and governance", color: "blue" },
                          { name: "ISSO-Access", desc: "Analyzes access controls and identity management", color: "green" },
                          { name: "ISSO-Network", desc: "Evaluates network security architecture", color: "purple" },
                          { name: "ISSO-Data", desc: "Assesses data protection and encryption", color: "orange" },
                          { name: "ISSO-Privacy", desc: "Ensures privacy controls and compliance", color: "pink" },
                          { name: "ISSO-Recovery", desc: "Reviews disaster recovery planning", color: "indigo" }
                        ].map((agent) => (
                          <Card key={agent.name} className="border-l-4 border-l-blue-400">
                            <CardContent className="pt-4">
                              <h4 className="font-medium text-sm">{agent.name}</h4>
                              <p className="text-xs text-slate-600 mt-1">{agent.desc}</p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* Working with Results */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Understanding Results</h3>
                      <div className="space-y-4">
                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                          <h4 className="font-medium text-green-800 mb-2">Compliance Scores</h4>
                          <ul className="space-y-1 text-sm text-green-700">
                            <li>• 90-100: Excellent compliance posture</li>
                            <li>• 80-89: Good with minor improvements needed</li>
                            <li>• 70-79: Adequate but requires attention</li>
                            <li>• Below 70: Significant gaps requiring immediate action</li>
                          </ul>
                        </div>
                        
                        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                          <h4 className="font-medium text-yellow-800 mb-2">Analysis Sections</h4>
                          <ul className="space-y-1 text-sm text-yellow-700">
                            <li>• <strong>Strengths:</strong> Current effective controls</li>
                            <li>• <strong>Areas for Improvement:</strong> Gaps and weaknesses</li>
                            <li>• <strong>Recommendations:</strong> Specific actionable steps</li>
                            <li>• <strong>Compliance Mapping:</strong> Framework alignment</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Administrator Guide */}
            <TabsContent value="admin-guide">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="h-5 w-5 text-red-600" />
                    <span>Administrator Guide</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  
                  {/* User Management */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2">
                      <Users className="h-5 w-5" />
                      <span>User Management</span>
                    </h3>
                    <div className="space-y-4">
                      <div className="bg-slate-50 p-4 rounded-lg">
                        <h4 className="font-medium mb-2">User Roles</h4>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Badge variant="secondary">Admin</Badge>
                            <span className="text-sm">Full system access, user management, system configuration</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">ISSO-Lead</Badge>
                            <span className="text-sm">Review assessments, approve reports, manage workflows</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">Analyst</Badge>
                            <span className="text-sm">Create assessments, run agents, generate reports</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-slate-50 p-4 rounded-lg">
                        <h4 className="font-medium mb-2">User Account Management</h4>
                        <ul className="space-y-1 text-sm text-slate-600">
                          <li>• Create new user accounts through admin panel</li>
                          <li>• Assign appropriate roles based on responsibilities</li>
                          <li>• Monitor user activity and assessment usage</li>
                          <li>• Deactivate accounts when users leave organization</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* System Configuration */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">System Configuration</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card className="bg-blue-50 border-blue-200">
                        <CardHeader>
                          <CardTitle className="text-lg">Assessment Settings</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          <p>• Configure default compliance frameworks</p>
                          <p>• Set organization-wide assessment templates</p>
                          <p>• Manage agent analysis parameters</p>
                          <p>• Configure accuracy validation thresholds</p>
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-green-50 border-green-200">
                        <CardHeader>
                          <CardTitle className="text-lg">Security Settings</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          <p>• Configure authentication requirements</p>
                          <p>• Set data retention policies</p>
                          <p>• Manage API access and integrations</p>
                          <p>• Configure audit logging</p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  <Separator />

                  {/* Monitoring & Reporting */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Monitoring & Reporting</h3>
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                      <h4 className="font-medium text-yellow-800 mb-2">System Health Monitoring</h4>
                      <ul className="space-y-1 text-sm text-yellow-700">
                        <li>• Monitor assessment completion rates and accuracy</li>
                        <li>• Track agent performance and analysis quality</li>
                        <li>• Review user activity and system usage patterns</li>
                        <li>• Generate administrative reports and dashboards</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Features Documentation */}
            <TabsContent value="features">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <FileText className="h-5 w-5 text-purple-600" />
                      <span>Feature Documentation</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    
                    {/* One-Click Assessment */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2">
                        <Zap className="h-5 w-5 text-green-600" />
                        <span>One-Click Complete Assessment</span>
                      </h3>
                      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <p className="text-sm text-green-800 mb-3">
                          <strong>Purpose:</strong> Automated comprehensive security assessment across all domains
                        </p>
                        <div className="space-y-2">
                          <h4 className="font-medium text-green-800">Features:</h4>
                          <ul className="space-y-1 text-sm text-green-700">
                            <li>• Runs all 12+ specialized AI agents automatically</li>
                            <li>• Performs accuracy validation and quality checks</li>
                            <li>• Generates cross-agent correlation analysis</li>
                            <li>• Provides real-time progress tracking</li>
                            <li>• Produces executive-ready summary report</li>
                          </ul>
                        </div>
                        <div className="mt-3 p-3 bg-green-100 rounded">
                          <p className="text-xs text-green-800">
                            <strong>Best Practice:</strong> Use for initial assessments or comprehensive reviews. Takes 5-10 minutes to complete.
                          </p>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* AI Agent System */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2">
                        <Bot className="h-5 w-5 text-blue-600" />
                        <span>AI Agent System</span>
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="bg-blue-50 border-blue-200">
                          <CardHeader>
                            <CardTitle className="text-lg">Individual Agent Analysis</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2 text-sm">
                            <p>• Focused analysis on specific security domains</p>
                            <p>• Upload domain-specific documentation</p>
                            <p>• Detailed findings and recommendations</p>
                            <p>• Framework-specific compliance mapping</p>
                          </CardContent>
                        </Card>
                        
                        <Card className="bg-purple-50 border-purple-200">
                          <CardHeader>
                            <CardTitle className="text-lg">Agent Capabilities</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2 text-sm">
                            <p>• Document analysis and interpretation</p>
                            <p>• Gap identification and risk assessment</p>
                            <p>• Best practice recommendations</p>
                            <p>• Compliance score calculation</p>
                          </CardContent>
                        </Card>
                      </div>
                    </div>

                    <Separator />

                    {/* Accuracy Validation */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2">
                        <Shield className="h-5 w-5 text-orange-600" />
                        <span>Accuracy Validation System</span>
                      </h3>
                      <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                        <p className="text-sm text-orange-800 mb-3">
                          <strong>Purpose:</strong> Ensures high-quality, reliable assessment results
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-medium text-orange-800 mb-2">Validation Checks:</h4>
                            <ul className="space-y-1 text-sm text-orange-700">
                              <li>• Content quality and completeness</li>
                              <li>• Risk assessment consistency</li>
                              <li>• Compliance framework mapping</li>
                              <li>• Finding categorization accuracy</li>
                            </ul>
                          </div>
                          <div>
                            <h4 className="font-medium text-orange-800 mb-2">Quality Indicators:</h4>
                            <ul className="space-y-1 text-sm text-orange-700">
                              <li>• ✓ High Accuracy: All checks passed</li>
                              <li>• ⚠ Review Recommended: Some warnings</li>
                              <li>• ✗ Manual Review Required: Failed checks</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Report Generation */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Report Generation</h3>
                      <div className="space-y-4">
                        <div className="bg-slate-50 p-4 rounded-lg">
                          <h4 className="font-medium mb-2">Report Types</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="text-center p-3 border rounded">
                              <h5 className="font-medium">Executive Summary</h5>
                              <p className="text-xs text-slate-600 mt-1">High-level findings for leadership</p>
                            </div>
                            <div className="text-center p-3 border rounded">
                              <h5 className="font-medium">Technical Report</h5>
                              <p className="text-xs text-slate-600 mt-1">Detailed analysis for IT teams</p>
                            </div>
                            <div className="text-center p-3 border rounded">
                              <h5 className="font-medium">Compliance Report</h5>
                              <p className="text-xs text-slate-600 mt-1">Framework-specific findings</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Troubleshooting */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      <span>Common Issues & Troubleshooting</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="bg-red-50 p-3 rounded border-l-4 border-red-400">
                        <h4 className="font-medium text-red-800">Agent Analysis Fails</h4>
                        <p className="text-sm text-red-700 mt-1">
                          Check document format, file size limits, and network connectivity. Try uploading fewer documents.
                        </p>
                      </div>
                      
                      <div className="bg-yellow-50 p-3 rounded border-l-4 border-yellow-400">
                        <h4 className="font-medium text-yellow-800">Low Accuracy Scores</h4>
                        <p className="text-sm text-yellow-700 mt-1">
                          Upload more detailed documentation, provide additional context, or run individual agents for focused analysis.
                        </p>
                      </div>
                      
                      <div className="bg-blue-50 p-3 rounded border-l-4 border-blue-400">
                        <h4 className="font-medium text-blue-800">Assessment Status Not Updating</h4>
                        <p className="text-sm text-blue-700 mt-1">
                          Refresh the page or check network connection. Contact administrator if issue persists.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Help;
