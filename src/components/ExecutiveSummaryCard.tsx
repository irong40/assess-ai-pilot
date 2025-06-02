
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";

interface ExecutiveSummaryCardProps {
  totalFindings: number;
  criticalIssues: number;
  overallRiskLevel: 'High' | 'Medium' | 'Low';
  complianceScore: number;
  completedAgents: number;
  totalAgents: number;
}

const ExecutiveSummaryCard = ({
  totalFindings,
  criticalIssues,
  overallRiskLevel,
  complianceScore,
  completedAgents,
  totalAgents
}: ExecutiveSummaryCardProps) => {
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'High': return 'bg-red-100 text-red-800 border-red-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getComplianceColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
      <CardHeader>
        <div className="flex items-center space-x-3">
          <Shield className="h-6 w-6 text-blue-600" />
          <CardTitle className="text-xl text-blue-900">Executive Summary</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-white rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-slate-900">{totalFindings}</div>
            <div className="text-sm text-slate-600">Total Findings</div>
          </div>
          <div className="text-center p-3 bg-white rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-red-600">{criticalIssues}</div>
            <div className="text-sm text-slate-600">Critical Issues</div>
          </div>
          <div className="text-center p-3 bg-white rounded-lg shadow-sm">
            <div className={`text-2xl font-bold ${getComplianceColor(complianceScore)}`}>
              {complianceScore}%
            </div>
            <div className="text-sm text-slate-600">Compliance</div>
          </div>
          <div className="text-center p-3 bg-white rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-blue-600">
              {completedAgents}/{totalAgents}
            </div>
            <div className="text-sm text-slate-600">Agents Complete</div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-slate-700">Overall Risk Level:</span>
            <Badge className={`${getRiskColor(overallRiskLevel)} border`}>
              {overallRiskLevel === 'High' && <AlertTriangle className="h-3 w-3 mr-1" />}
              {overallRiskLevel === 'Medium' && <AlertTriangle className="h-3 w-3 mr-1" />}
              {overallRiskLevel === 'Low' && <CheckCircle className="h-3 w-3 mr-1" />}
              {overallRiskLevel}
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-slate-600">Ready for Review</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg">
          <h4 className="font-medium text-slate-900 mb-2">Key Recommendations</h4>
          <ul className="text-sm text-slate-700 space-y-1">
            <li className="flex items-center">
              <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
              Address {criticalIssues} critical security findings immediately
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
              Improve compliance score to reach 90%+ target
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
              Implement continuous monitoring for ongoing assessment
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExecutiveSummaryCard;
