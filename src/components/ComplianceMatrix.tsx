
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, AlertTriangle, XCircle } from "lucide-react";

interface ComplianceItem {
  control: string;
  status: 'implemented' | 'partial' | 'missing';
  description: string;
}

interface ComplianceMatrixProps {
  framework: string;
  overallScore: number;
  controls: ComplianceItem[];
}

const ComplianceMatrix = ({ framework, overallScore, controls }: ComplianceMatrixProps) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'implemented': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'partial': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'missing': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'implemented': return 'bg-green-50 border-green-200';
      case 'partial': return 'bg-yellow-50 border-yellow-200';
      case 'missing': return 'bg-red-50 border-red-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const implementedCount = controls.filter(c => c.status === 'implemented').length;
  const partialCount = controls.filter(c => c.status === 'partial').length;
  const missingCount = controls.filter(c => c.status === 'missing').length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{framework} Compliance Matrix</span>
          <span className="text-xl font-bold text-blue-600">{overallScore}%</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Overall Compliance</span>
            <span className="font-medium">{overallScore}%</span>
          </div>
          <Progress value={overallScore} className="h-2" />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="text-lg font-bold text-green-600">{implementedCount}</div>
            <div className="text-xs text-green-700">Implemented</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="text-lg font-bold text-yellow-600">{partialCount}</div>
            <div className="text-xs text-yellow-700">Partial</div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
            <div className="text-lg font-bold text-red-600">{missingCount}</div>
            <div className="text-xs text-red-700">Missing</div>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="font-medium text-slate-900">Control Status</h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {controls.map((control, index) => (
              <div key={index} className={`p-3 rounded-lg border ${getStatusColor(control.status)}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">{control.control}</span>
                  {getStatusIcon(control.status)}
                </div>
                <p className="text-xs text-slate-600">{control.description}</p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ComplianceMatrix;
