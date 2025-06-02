
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Filter } from "lucide-react";
import Header from "@/components/Header";
import AssessmentCard from "@/components/AssessmentCard";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  // Mock user data - replace with actual auth
  const user = {
    email: "admin@company.com",
    role: "admin"
  };

  // Mock assessment data
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
    }
  ];

  const filteredAssessments = assessments.filter(assessment => {
    const matchesSearch = assessment.systemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assessment.scope.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === "all" || assessment.status === activeTab;
    return matchesSearch && matchesTab;
  });

  const handleViewAssessment = (id: string) => {
    navigate(`/assessment/${id}/agents`);
  };

  const handleNewAssessment = () => {
    navigate("/assessment/new");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Assessment Dashboard</h1>
            <p className="text-slate-600">Manage and track your cybersecurity assessments</p>
          </div>
          
          <Button 
            onClick={handleNewAssessment}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            size="lg"
          >
            <Plus className="h-4 w-4 mr-2" />
            Start New Assessment
          </Button>
        </div>

        <div className="flex flex-col space-y-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search assessments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="not-started">Not Started</TabsTrigger>
              <TabsTrigger value="in-progress">In Progress</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              {filteredAssessments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredAssessments.map((assessment) => (
                    <AssessmentCard
                      key={assessment.id}
                      {...assessment}
                      onView={handleViewAssessment}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-slate-400 mb-4">
                    <Search className="h-12 w-12 mx-auto" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-900 mb-2">No assessments found</h3>
                  <p className="text-slate-600 mb-4">
                    {searchTerm ? "Try adjusting your search terms" : "Get started by creating your first assessment"}
                  </p>
                  {!searchTerm && (
                    <Button onClick={handleNewAssessment} variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Assessment
                    </Button>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
