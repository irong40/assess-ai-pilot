
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import AnalyticsCards from "@/components/dashboard/AnalyticsCards";
import DashboardCharts from "@/components/dashboard/DashboardCharts";
import AssessmentsList from "@/components/dashboard/AssessmentsList";
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
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <DashboardHeader />

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
      </main>
    </div>
  );
};

export default Dashboard;
