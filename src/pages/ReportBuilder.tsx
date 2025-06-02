import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FileText, Download, Bot, Upload, Calendar, Clock, Settings, Layout, Zap } from "lucide-react";
import Header from "@/components/Header";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

const ReportBuilder = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("comprehensive");
  const [automationEnabled, setAutomationEnabled] = useState(false);
  const [reportConfig, setReportConfig] = useState({
    includeExecutiveSummary: true,
    includeTechnicalDetails: true,
    includePOAM: true,
    includeCompliance: true,
    includeAppendices: false,
    includeMetrics: true,
    includeRiskMatrix: true,
    brandingColor: "#1e40af",
    organizationName: "Company Inc.",
    reportTitle: "Cybersecurity Assessment Report",
    automaticSchedule: "monthly",
    notificationEmails: ["issm@company.com", "ciso@company.com"]
  });

  const reportTemplates = [
    {
      id: "comprehensive",
      name: "Comprehensive Report",
      description: "Full assessment with all sections",
      sections: 8,
      pages: "25-40"
    },
    {
      id: "executive",
      name: "Executive Summary",
      description: "High-level overview for leadership",
      sections: 3,
      pages: "5-10"
    },
    {
      id: "technical",
      name: "Technical Report",
      description: "Detailed technical findings",
      sections: 6,
      pages: "15-25"
    },
    {
      id: "compliance",
      name: "Compliance Report",
      description: "Focus on regulatory requirements",
      sections: 4,
      pages: "10-15"
    }
  ];

  const user = {
    email: "techwriter@company.com",
    role: "TechWriter"
  };

  const handleConfigChange = (key: string, value: any) => {
    setReportConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = reportTemplates.find(t => t.id === templateId);
    
    // Auto-configure based on template
    if (templateId === "executive") {
      setReportConfig(prev => ({
        ...prev,
        includeExecutiveSummary: true,
        includeTechnicalDetails: false,
        includePOAM: false,
        includeCompliance: true,
        includeAppendices: false,
        includeMetrics: true,
        includeRiskMatrix: false
      }));
    } else if (templateId === "technical") {
      setReportConfig(prev => ({
        ...prev,
        includeExecutiveSummary: false,
        includeTechnicalDetails: true,
        includePOAM: true,
        includeCompliance: false,
        includeAppendices: true,
        includeMetrics: true,
        includeRiskMatrix: true
      }));
    }
  };

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    
    setTimeout(() => {
      setIsGenerating(false);
      setReportGenerated(true);
      
      toast({
        title: "Report Generated",
        description: `${reportTemplates.find(t => t.id === selectedTemplate)?.name} has been generated successfully`,
      });
    }, 5000);
  };

  const handleDownloadReport = () => {
    toast({
      title: "Download Started",
      description: "Report download has begun",
    });
    navigate(`/assessment/${id}/feedback`);
  };

  const handleScheduleReport = () => {
    setAutomationEnabled(true);
    toast({
      title: "Automation Enabled",
      description: `Reports will be generated ${reportConfig.automaticSchedule} and sent to specified recipients`,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center space-x-4 mb-8">
            <Button 
              variant="ghost" 
              onClick={() => navigate(`/assessment/${id}/issm-review`)}
              className="text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to ISSM Review
            </Button>
          </div>

          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-green-50 rounded-lg">
                <FileText className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Assessment Report Builder</h1>
                <p className="text-slate-600">Generate professional cybersecurity assessment reports</p>
              </div>
            </div>
            {automationEnabled && (
              <Badge className="bg-blue-100 text-blue-800">
                <Zap className="h-3 w-3 mr-1" />
                Automation Active
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Report Configuration */}
            <div className="lg:col-span-2 space-y-6">
              {/* Template Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Layout className="h-5 w-5" />
                    <span>Report Template</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {reportTemplates.map((template) => (
                      <div
                        key={template.id}
                        className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                          selectedTemplate === template.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                        onClick={() => handleTemplateSelect(template.id)}
                      >
                        <h4 className="font-semibold text-slate-900 mb-2">{template.name}</h4>
                        <p className="text-sm text-slate-600 mb-3">{template.description}</p>
                        <div className="flex justify-between text-xs text-slate-500">
                          <span>{template.sections} sections</span>
                          <span>{template.pages} pages</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Basic Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle>Report Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="reportTitle">Report Title</Label>
                      <Input
                        id="reportTitle"
                        value={reportConfig.reportTitle}
                        onChange={(e) => handleConfigChange('reportTitle', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="organizationName">Organization Name</Label>
                      <Input
                        id="organizationName"
                        value={reportConfig.organizationName}
                        onChange={(e) => handleConfigChange('organizationName', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="brandingColor">Brand Color</Label>
                    <div className="flex items-center space-x-3">
                      <Input
                        id="brandingColor"
                        type="color"
                        value={reportConfig.brandingColor}
                        onChange={(e) => handleConfigChange('brandingColor', e.target.value)}
                        className="w-20 h-10"
                      />
                      <span className="text-sm text-slate-600">{reportConfig.brandingColor}</span>
                    </div>
                  </div>

                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
                    <Upload className="h-8 w-8 text-slate-400 mx-auto mb-3" />
                    <h3 className="font-medium text-slate-900 mb-2">Upload Organization Logo</h3>
                    <p className="text-sm text-slate-600 mb-4">
                      PNG or SVG format, recommended size 200x80px
                    </p>
                    <Button variant="outline" size="sm">
                      Select Logo
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Advanced Sections */}
              <Card>
                <CardHeader>
                  <CardTitle>Report Sections</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-slate-900">Executive Summary</h4>
                        <p className="text-sm text-slate-600">High-level overview</p>
                      </div>
                      <Switch
                        checked={reportConfig.includeExecutiveSummary}
                        onCheckedChange={(checked) => handleConfigChange('includeExecutiveSummary', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-slate-900">Technical Details</h4>
                        <p className="text-sm text-slate-600">Detailed findings</p>
                      </div>
                      <Switch
                        checked={reportConfig.includeTechnicalDetails}
                        onCheckedChange={(checked) => handleConfigChange('includeTechnicalDetails', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-slate-900">POAM</h4>
                        <p className="text-sm text-slate-600">Remediation plan</p>
                      </div>
                      <Switch
                        checked={reportConfig.includePOAM}
                        onCheckedChange={(checked) => handleConfigChange('includePOAM', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-slate-900">Compliance Mapping</h4>
                        <p className="text-sm text-slate-600">Control alignment</p>
                      </div>
                      <Switch
                        checked={reportConfig.includeCompliance}
                        onCheckedChange={(checked) => handleConfigChange('includeCompliance', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-slate-900">Metrics & Charts</h4>
                        <p className="text-sm text-slate-600">Visual analytics</p>
                      </div>
                      <Switch
                        checked={reportConfig.includeMetrics}
                        onCheckedChange={(checked) => handleConfigChange('includeMetrics', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-slate-900">Risk Matrix</h4>
                        <p className="text-sm text-slate-600">Risk visualization</p>
                      </div>
                      <Switch
                        checked={reportConfig.includeRiskMatrix}
                        onCheckedChange={(checked) => handleConfigChange('includeRiskMatrix', checked)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Automation Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="h-5 w-5" />
                    <span>Report Automation</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="schedule">Automatic Generation Schedule</Label>
                    <Select
                      value={reportConfig.automaticSchedule}
                      onValueChange={(value) => handleConfigChange('automaticSchedule', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="annually">Annually</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Notification Recipients</Label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {reportConfig.notificationEmails.map((email, index) => (
                        <Badge key={index} variant="secondary">
                          {email}
                        </Badge>
                      ))}
                    </div>
                    <Input placeholder="Add email address..." />
                  </div>

                  {!automationEnabled && (
                    <Button 
                      onClick={handleScheduleReport}
                      variant="outline"
                      className="w-full"
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Enable Automated Reports
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Generation Control */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Generate Report</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!reportGenerated ? (
                    <>
                      <div className="text-sm text-slate-600 mb-4">
                        AI will compile assessment data using the selected template and configuration.
                      </div>
                      
                      <Button 
                        onClick={handleGenerateReport}
                        disabled={isGenerating}
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                        size="lg"
                      >
                        {isGenerating ? (
                          <>
                            <Bot className="h-4 w-4 mr-2 animate-pulse" />
                            Generating Report...
                          </>
                        ) : (
                          <>
                            <FileText className="h-4 w-4 mr-2" />
                            Generate PDF Report
                          </>
                        )}
                      </Button>

                      <div className="text-xs text-slate-500 mt-2">
                        Estimated time: 30-60 seconds
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-center">
                        <FileText className="h-12 w-12 text-green-600 mx-auto mb-3" />
                        <h4 className="font-medium text-green-900 mb-2">Report Ready</h4>
                        <p className="text-sm text-green-700 mb-4">
                          Your {reportTemplates.find(t => t.id === selectedTemplate)?.name} has been generated.
                        </p>
                      </div>
                      
                      <Button 
                        onClick={handleDownloadReport}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        size="lg"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download Report
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>

              {isGenerating && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <Bot className="h-8 w-8 text-blue-600 mx-auto mb-3 animate-pulse" />
                      <h4 className="font-medium text-blue-900 mb-2">AI Report Generation</h4>
                      <p className="text-sm text-blue-700 mb-3">
                        Compiling findings, formatting content, and applying branding...
                      </p>
                      <div className="space-y-2 text-xs text-blue-600">
                        <div>✓ Analyzing assessment data</div>
                        <div>⏳ Applying template structure</div>
                        <div>⏳ Generating visualizations</div>
                        <div>⏳ Formatting document</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Report Preview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Template:</span>
                    <span className="font-medium">{reportTemplates.find(t => t.id === selectedTemplate)?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Total Findings:</span>
                    <span className="font-medium">37</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Critical Issues:</span>
                    <span className="font-medium text-red-600">9</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Compliance Score:</span>
                    <span className="font-medium">83%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Est. Pages:</span>
                    <span className="font-medium">{reportTemplates.find(t => t.id === selectedTemplate)?.pages}</span>
                  </div>
                  {automationEnabled && (
                    <div className="border-t pt-3 mt-3">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Next Report:</span>
                        <span className="font-medium text-blue-600">
                          <Clock className="h-3 w-3 inline mr-1" />
                          {reportConfig.automaticSchedule === 'weekly' ? '7 days' :
                           reportConfig.automaticSchedule === 'monthly' ? '30 days' :
                           reportConfig.automaticSchedule === 'quarterly' ? '90 days' : '365 days'}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ReportBuilder;
