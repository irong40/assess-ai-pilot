
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

interface ReportConfig {
  reportTitle: string;
  organizationName: string;
  brandingColor: string;
}

interface ReportConfigurationProps {
  config: ReportConfig;
  onConfigChange: (key: string, value: any) => void;
}

const ReportConfiguration = ({ config, onConfigChange }: ReportConfigurationProps) => {
  return (
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
              value={config.reportTitle}
              onChange={(e) => onConfigChange('reportTitle', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="organizationName">Organization Name</Label>
            <Input
              id="organizationName"
              value={config.organizationName}
              onChange={(e) => onConfigChange('organizationName', e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="brandingColor">Brand Color</Label>
          <div className="flex items-center space-x-3">
            <Input
              id="brandingColor"
              type="color"
              value={config.brandingColor}
              onChange={(e) => onConfigChange('brandingColor', e.target.value)}
              className="w-20 h-10"
            />
            <span className="text-sm text-slate-600">{config.brandingColor}</span>
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
  );
};

export default ReportConfiguration;
