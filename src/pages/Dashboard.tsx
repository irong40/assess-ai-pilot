
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Plus, Search, Filter, TrendingUp, Shield, AlertTriangle, CheckCircle, Clock, Users } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer } from "recharts";
import Header from "@/components/Header";
import AssessmentCard from "@/components/AssessmentCard";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");

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

  // Analytics data
  const complianceData = [
    { framework: "NIST 800-53", score: 85, assessments: 3 },
    { framework: "ISO 27001", score: 92, assessments: 2 },
    { framework: "HIPAA", score: 78, assessments: 1 },
    { framework: "CMMC L2", score: 65, assessments: 1 },
    { framework: "SOC 2", score: 88, assessments: 1 }
  ];

  const riskData = [
    { name: "Critical", value: 3, color: "#dc2626" },
    { name: "High", value: 8, color: "#ea580c" },
    { name: "Medium", value: 15, color: "#ca8a04" },
    { name: "Low", value: 12, color: "#16a34a" }
  ];

  const trendData = [
    { month: "Jan", assessments: 2, findings: 45 },
    { month: "Feb", assessments: 3, findings: 38 },
    { month: "Mar", assessments: 1, findings: 52 },
    { month: "Apr", assessments: 4, findings: 29 },
    { month: "May", assessments: 2, findings: 41 },
    { month: "Jun", assessments: 3, findings: 35 }
  ];

  const chartConfig = {
    assessments: { label: "Assessments", color: "#3b82f6" },
    findings: { label: "Findings", color: "#ef4444" }
  };

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

  const completedAssessments = assessments.filter(a => a.status === 'completed').length;
  const inProgressAssessments = assessments.filter(a => a.status === 'in-progress').length;
  const totalFindings = riskData.reduce((sum, item) => sum + item.value, 0);
  const averageComplianceScore = Math.round(complianceData.reduce((sum, item) => sum + item.score, 0) / complianceData.length);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
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

        {/* Analytics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Assessments</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{assessments.length}</div>
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
                {Math.round((completedAssessments / assessments.length) * 100)}% completion rate
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

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Assessment & Findings Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px]">
                <LineChart data={trendData}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="assessments" stroke="#3b82f6" strokeWidth={2} />
                  <Line type="monotone" dataKey="findings" stroke="#ef4444" strokeWidth={2} />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Risk Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{}} className="h-[300px]">
                <PieChart>
                  <Pie
                    data={riskData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {riskData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip />
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Compliance Scores */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Compliance Framework Scores</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-[300px]">
              <BarChart data={complianceData}>
                <XAxis dataKey="framework" />
                <YAxis domain={[0, 100]} />
                <ChartTooltip 
                  content={<ChartTooltipContent />}
                  formatter={(value, name) => [`${value}%`, 'Compliance Score']}
                />
                <Bar dataKey="score" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Assessments List */}
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
