
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, CheckCircle, Clock, TrendingUp } from "lucide-react";

interface AnalyticsCardsProps {
  totalAssessments: number;
  completedAssessments: number;
  inProgressAssessments: number;
  averageComplianceScore: number;
}

const AnalyticsCards = ({
  totalAssessments,
  completedAssessments,
  inProgressAssessments,
  averageComplianceScore
}: AnalyticsCardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Assessments</CardTitle>
          <Shield className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalAssessments}</div>
          <p className="text-xs text-muted-foreground">
            +2 from last month
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completed</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{completedAssessments}</div>
          <p className="text-xs text-muted-foreground">
            {Math.round((completedAssessments / totalAssessments) * 100)}% completion rate
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          <Clock className="h-4 w-4 text-yellow-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{inProgressAssessments}</div>
          <p className="text-xs text-muted-foreground">
            Active assessments
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Compliance</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{averageComplianceScore}%</div>
          <p className="text-xs text-muted-foreground">
            Across all frameworks
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsCards;
