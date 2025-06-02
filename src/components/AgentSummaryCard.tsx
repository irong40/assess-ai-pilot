
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, CheckCircle, AlertTriangle, XCircle } from "lucide-react";

interface AgentSummaryCardProps {
  agentName: string;
  status: 'completed' | 'in-progress' | 'not-started';
  findings: number;
  criticalIssues: number;
  riskLevel: 'High' | 'Medium' | 'Low';
  summary: string;
}

const AgentSummaryCard = ({
  agentName,
  status,
  findings,
  criticalIssues,
  riskLevel,
  summary
}: AgentSummaryCardProps) => {
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'High': return 'bg-red-100 text-red-800 border-red-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'High': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'Medium': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'Low': return <CheckCircle className="h-4 w-4 text-green-600" />;
      default: return null;
    }
  };

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Bot className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">{agentName}</CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={`${getRiskColor(riskLevel)} border`}>
              {getRiskIcon(riskLevel)}
              <span className="ml-1">{riskLevel} Risk</span>
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">Total Findings:</span>
          <span className="font-medium">{findings}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">Critical Issues:</span>
          <span className="font-medium text-red-600">{criticalIssues}</span>
        </div>
        <div className="border-t pt-3">
          <p className="text-sm text-slate-700">{summary}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default AgentSummaryCard;
