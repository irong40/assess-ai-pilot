import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, FileText, Download, Bot, Upload } from "lucide-react";
import Header from "@/components/Header";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

const ReportBuilder = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);
  const [reportConfig, setReportConfig] = useState({
    includeExecutiveSummary: true,
    includeTechnicalDetails: true,
    includePOAM: true,
    includeCompliance: true,
    includeAppendices: false,
    brandingColor: "#1e40af",
    organizationName: "Company Inc.",
    reportTitle: "Cybersecurity Assessment Report"
  });

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

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    
    setTimeout(() => {
      setIsGenerating(false);
      setReportGenerated(true);
      
      toast({
        title: "Report Generated",
        description: "Assessment report has been generated successfully",
      });
    }, 5000);
  };

  const handleDownloadReport = () => {
    toast({
      title: "Download Started",
      description: "Report download has begun",
    });
    // In a real app, this would trigger a file download
    navigate(`/assessment/${id}/feedback`);
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

          <div className="flex items-center space-x-3 mb-8">
            <div className="p-3 bg-green-50 rounded-lg">
              <FileText className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Assessment Report Builder</h1>
              <p className="text-slate-600">Generate professional cybersecurity assessment report</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Report Configuration */}
            <div className="lg:col-span-2 space-y-6">
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

              <Card>
                <CardHeader>
                  <CardTitle>Report Sections</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-slate-900">Executive Summary</h4>
                      <p className="text-sm text-slate-600">High-level overview for leadership</p>
                    </div>
                    <Switch
                      checked={reportConfig.includeExecutiveSummary}
                      onCheckedChange={(checked) => handleConfigChange('includeExecutiveSummary', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-slate-900">Technical Details</h4>
                      <p className="text-sm text-slate-600">Detailed technical findings and analysis</p>
                    </div>
                    <Switch
                      checked={reportConfig.includeTechnicalDetails}
                      onCheckedChange={(checked) => handleConfigChange('includeTechnicalDetails', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-slate-900">POAM (Plan of Action)</h4>
                      <p className="text-sm text-slate-600">Remediation timeline and milestones</p>
                    </div>
                    <Switch
                      checked={reportConfig.includePOAM}
                      onCheckedChange={(checked) => handleConfigChange('includePOAM', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-slate-900">Compliance Mapping</h4>
                      <p className="text-sm text-slate-600">Control framework alignment</p>
                    </div>
                    <Switch
                      checked={reportConfig.includeCompliance}
                      onCheckedChange={(checked) => handleConfigChange('includeCompliance', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-slate-900">Appendices</h4>
                      <p className="text-sm text-slate-600">Supporting documentation and evidence</p>
                    </div>
                    <Switch
                      checked={reportConfig.includeAppendices}
                      onCheckedChange={(checked) => handleConfigChange('includeAppendices', checked)}
                    />
                  </div>
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
                        AI will compile all assessment data into a professional report with your branding.
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
                    </>
                  ) : (
                    <>
                      <div className="text-center">
                        <FileText className="h-12 w-12 text-green-600 mx-auto mb-3" />
                        <h4 className="font-medium text-green-900 mb-2">Report Ready</h4>
                        <p className="text-sm text-green-700 mb-4">
                          Your assessment report has been generated successfully.
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
                      <p className="text-sm text-blue-700">
                        Compiling findings, formatting content, and applying branding...
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Report Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
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
                    <span className="text-slate-600">Risk Level:</span>
                    <span className="font-medium text-yellow-600">Medium</span>
                  </div>
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
