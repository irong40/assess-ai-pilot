
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";

interface Template {
  id: string;
  name: string;
  pages: string;
}

interface ReportPreviewProps {
  selectedTemplate: string;
  templates: Template[];
  automationEnabled: boolean;
  automaticSchedule: string;
}

const ReportPreview = ({ 
  selectedTemplate, 
  templates, 
  automationEnabled, 
  automaticSchedule 
}: ReportPreviewProps) => {
  const selectedTemplateData = templates.find(t => t.id === selectedTemplate);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Report Preview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-600">Template:</span>
          <span className="font-medium">{selectedTemplateData?.name}</span>
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
          <span className="font-medium">{selectedTemplateData?.pages}</span>
        </div>
        {automationEnabled && (
          <div className="border-t pt-3 mt-3">
            <div className="flex justify-between">
              <span className="text-slate-600">Next Report:</span>
              <span className="font-medium text-blue-600">
                <Clock className="h-3 w-3 inline mr-1" />
                {automaticSchedule === 'weekly' ? '7 days' :
                 automaticSchedule === 'monthly' ? '30 days' :
                 automaticSchedule === 'quarterly' ? '90 days' : '365 days'}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReportPreview;
