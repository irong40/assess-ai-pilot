
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FileText, Zap } from "lucide-react";
import Header from "@/components/Header";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import TemplateSelector from "@/components/TemplateSelector";
import ReportConfiguration from "@/components/ReportConfiguration";
import SectionToggler from "@/components/SectionToggler";
import AutomationSettings from "@/components/AutomationSettings";
import GenerationControls from "@/components/GenerationControls";
import ReportPreview from "@/components/ReportPreview";
import GenerationProgress from "@/components/GenerationProgress";

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

  const handleConfigChange = (key: string, value: any) => {
    setReportConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    
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

  const selectedTemplateData = reportTemplates.find(t => t.id === selectedTemplate);

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
              <TemplateSelector
                templates={reportTemplates}
                selectedTemplate={selectedTemplate}
                onTemplateSelect={handleTemplateSelect}
              />

              <ReportConfiguration
                config={{
                  reportTitle: reportConfig.reportTitle,
                  organizationName: reportConfig.organizationName,
                  brandingColor: reportConfig.brandingColor
                }}
                onConfigChange={handleConfigChange}
              />

              <SectionToggler
                config={{
                  includeExecutiveSummary: reportConfig.includeExecutiveSummary,
                  includeTechnicalDetails: reportConfig.includeTechnicalDetails,
                  includePOAM: reportConfig.includePOAM,
                  includeCompliance: reportConfig.includeCompliance,
                  includeMetrics: reportConfig.includeMetrics,
                  includeRiskMatrix: reportConfig.includeRiskMatrix
                }}
                onConfigChange={handleConfigChange}
              />

              <AutomationSettings
                config={{
                  automaticSchedule: reportConfig.automaticSchedule,
                  notificationEmails: reportConfig.notificationEmails
                }}
                automationEnabled={automationEnabled}
                onConfigChange={handleConfigChange}
                onScheduleReport={handleScheduleReport}
              />
            </div>

            {/* Generation Control */}
            <div className="space-y-6">
              <GenerationControls
                isGenerating={isGenerating}
                reportGenerated={reportGenerated}
                selectedTemplateName={selectedTemplateData?.name || ""}
                onGenerateReport={handleGenerateReport}
                onDownloadReport={handleDownloadReport}
              />

              {isGenerating && <GenerationProgress />}

              <ReportPreview
                selectedTemplate={selectedTemplate}
                templates={reportTemplates}
                automationEnabled={automationEnabled}
                automaticSchedule={reportConfig.automaticSchedule}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ReportBuilder;
