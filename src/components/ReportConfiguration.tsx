
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import FileUpload from "@/components/FileUpload";

interface ReportConfig {
  reportTitle: string;
  organizationName: string;
  brandingColor: string;
}

interface ReportConfigurationProps {
  config: ReportConfig;
  onConfigChange: (key: string, value: string | UploadedFile[]) => void;
}

const ReportConfiguration = ({ config, onConfigChange }: ReportConfigurationProps) => {
  const handleLogoUpload = (files: UploadedFile[]) => {
    if (files.length > 0) {
      onConfigChange('organizationLogo', files[0].url);
    }
  };

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

        <div className="space-y-2">
          <Label>Organization Logo</Label>
          <FileUpload
            onUploadComplete={handleLogoUpload}
            acceptedTypes=".png,.jpg,.jpeg,.svg"
            maxFiles={1}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default ReportConfiguration;
