
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import AnalyticsCards from "@/components/dashboard/AnalyticsCards";
import DashboardCharts from "@/components/dashboard/DashboardCharts";
import AssessmentsList from "@/components/dashboard/AssessmentsList";
import { AIInsightsDashboard } from "@/components/analytics/AIInsightsDashboard";
import { ResponsiveContainer } from "@/components/responsive/ResponsiveContainer";
import { AdaptiveCard } from "@/components/responsive/AdaptiveCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAssessments } from "@/hooks/useAssessments";

const Dashboard = () => {
  const navigate = useNavigate();
  const { assessments, isLoading } = useAssessments();

  const handleViewAssessment = (id: string) => {
    navigate(`/assessment/${id}/agents`);
  };

  const handleNewAssessment = () => {
    navigate("/assessment/new");
  };

  // Transform assessments data to match the expected format
  const transformedAssessments = assessments.map(assessment => ({
    id: assessment.id,
    systemName: assessment.system_name,
    environment: assessment.environment,
    scope: assessment.compliance_scope,
    status: assessment.status,
    owner: assessment.owner_name || "Unknown",
    lastUpdated: new Date(assessment.updated_at).toLocaleDateString()
  }));

  const completedAssessments = transformedAssessments.filter(a => a.status === 'completed').length;
  const inProgressAssessments = transformedAssessments.filter(a => a.status === 'in-progress').length;
  const averageComplianceScore = 82; // Mock data - calculate from compliance frameworks

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">Loading assessments...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <ResponsiveContainer>
        <div className="space-y-6">
          <DashboardHeader />

          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="ai-insights">AI Insights</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <AnalyticsCards
                totalAssessments={transformedAssessments.length}
                completedAssessments={completedAssessments}
                inProgressAssessments={inProgressAssessments}
                averageComplianceScore={averageComplianceScore}
              />

              <DashboardCharts />

              <AssessmentsList
                assessments={transformedAssessments}
                onViewAssessment={handleViewAssessment}
                onNewAssessment={handleNewAssessment}
              />
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <AdaptiveCard
                title="Traditional Analytics"
                subtitle="Standard charts and metrics"
              >
                <DashboardCharts />
              </AdaptiveCard>
            </TabsContent>

            <TabsContent value="ai-insights">
              <AIInsightsDashboard />
            </TabsContent>
          </Tabs>
        </div>
      </ResponsiveContainer>
    </div>
  );
};

export default Dashboard;
