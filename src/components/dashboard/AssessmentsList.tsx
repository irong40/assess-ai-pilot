
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Filter, Plus } from "lucide-react";
import AssessmentCard from "@/components/AssessmentCard";

interface Assessment {
  id: string;
  systemName: string;
  environment: string;
  scope: string;
  status: 'not-started' | 'in-progress' | 'completed';
  owner: string;
  lastUpdated: string;
}

interface AssessmentsListProps {
  assessments: Assessment[];
  onViewAssessment: (id: string) => void;
  onNewAssessment: () => void;
}

const AssessmentsList = ({ assessments, onViewAssessment, onNewAssessment }: AssessmentsListProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const filteredAssessments = assessments.filter(assessment => {
    const matchesSearch = assessment.systemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assessment.scope.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === "all" || assessment.status === activeTab;
    return matchesSearch && matchesTab;
  });

  return (
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
                  onView={onViewAssessment}
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
                <Button onClick={onNewAssessment} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Assessment
                </Button>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AssessmentsList;
