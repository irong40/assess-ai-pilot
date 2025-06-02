
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Bot } from "lucide-react";

interface GenerationControlsProps {
  isGenerating: boolean;
  reportGenerated: boolean;
  selectedTemplateName: string;
  onGenerateReport: () => void;
  onDownloadReport: () => void;
}

const GenerationControls = ({
  isGenerating,
  reportGenerated,
  selectedTemplateName,
  onGenerateReport,
  onDownloadReport
}: GenerationControlsProps) => {
  return (
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
              onClick={onGenerateReport}
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
                Your {selectedTemplateName} has been generated.
              </p>
            </div>
            
            <Button 
              onClick={onDownloadReport}
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
  );
};

export default GenerationControls;
