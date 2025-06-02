
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

interface SectionConfig {
  includeExecutiveSummary: boolean;
  includeTechnicalDetails: boolean;
  includePOAM: boolean;
  includeCompliance: boolean;
  includeMetrics: boolean;
  includeRiskMatrix: boolean;
}

interface SectionTogglerProps {
  config: SectionConfig;
  onConfigChange: (key: string, value: boolean) => void;
}

const SectionToggler = ({ config, onConfigChange }: SectionTogglerProps) => {
  const sections = [
    {
      key: 'includeExecutiveSummary',
      title: 'Executive Summary',
      description: 'High-level overview',
      checked: config.includeExecutiveSummary
    },
    {
      key: 'includeTechnicalDetails',
      title: 'Technical Details',
      description: 'Detailed findings',
      checked: config.includeTechnicalDetails
    },
    {
      key: 'includePOAM',
      title: 'POAM',
      description: 'Remediation plan',
      checked: config.includePOAM
    },
    {
      key: 'includeCompliance',
      title: 'Compliance Mapping',
      description: 'Control alignment',
      checked: config.includeCompliance
    },
    {
      key: 'includeMetrics',
      title: 'Metrics & Charts',
      description: 'Visual analytics',
      checked: config.includeMetrics
    },
    {
      key: 'includeRiskMatrix',
      title: 'Risk Matrix',
      description: 'Risk visualization',
      checked: config.includeRiskMatrix
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Report Sections</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sections.map((section) => (
            <div key={section.key} className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-slate-900">{section.title}</h4>
                <p className="text-sm text-slate-600">{section.description}</p>
              </div>
              <Switch
                checked={section.checked}
                onCheckedChange={(checked) => onConfigChange(section.key, checked)}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default SectionToggler;
