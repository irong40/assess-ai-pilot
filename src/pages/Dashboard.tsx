
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import AnalyticsCards from "@/components/dashboard/AnalyticsCards";
import DashboardCharts from "@/components/dashboard/DashboardCharts";
import AssessmentsList from "@/components/dashboard/AssessmentsList";

const Dashboard = () => {
  const navigate = useNavigate();

  // Mock assessment data - will be replaced with real data later
  const assessments = [
    {
      id: "1",
      systemName: "Customer Portal System",
      environment: "Production",
      scope: "NIST 800-53",
      status: "in-progress" as const,
      owner: "John Smith",
      lastUpdated: "2 days ago"
    },
    {
      id: "2", 
      systemName: "Internal HR Database",
      environment: "Development",
      scope: "HIPAA",
      status: "completed" as const,
      owner: "Sarah Johnson",
      lastUpdated: "1 week ago"
    },
    {
      id: "3",
      systemName: "Financial Reporting System",
      environment: "Test",
      scope: "CMMC Level 2",
      status: "not-started" as const,
      owner: "Mike Davis",
      lastUpdated: "3 days ago"
    },
    {
      id: "4",
      systemName: "Employee Mobile App",
      environment: "Production",
      scope: "ISO 27001",
      status: "completed" as const,
      owner: "Lisa Chen",
      lastUpdated: "5 days ago"
    },
    {
      id: "5",
      systemName: "Cloud Infrastructure",
      environment: "Production",
      scope: "SOC 2 Type II",
      status: "in-progress" as const,
      owner: "David Rodriguez",
      lastUpdated: "1 day ago"
    }
  ];

  const handleViewAssessment = (id: string) => {
    navigate(`/assessment/${id}/agents`);
  };

  const handleNewAssessment = () => {
    navigate("/assessment/new");
  };

  const completedAssessments = assessments.filter(a => a.status === 'completed').length;
  const inProgressAssessments = assessments.filter(a => a.status === 'in-progress').length;
  const averageComplianceScore = 82; // Mock data - calculate from compliance frameworks

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <DashboardHeader onNewAssessment={handleNewAssessment} />

        <AnalyticsCards
          totalAssessments={assessments.length}
          completedAssessments={completedAssessments}
          inProgressAssessments={inProgressAssessments}
          averageComplianceScore={averageComplianceScore}
        />

        <DashboardCharts />

        <AssessmentsList
          assessments={assessments}
          onViewAssessment={handleViewAssessment}
          onNewAssessment={handleNewAssessment}
        />
      </main>
    </div>
  );
};

export default Dashboard;
