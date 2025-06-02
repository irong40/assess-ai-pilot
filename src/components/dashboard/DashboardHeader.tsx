
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface DashboardHeaderProps {
  onNewAssessment: () => void;
}

const DashboardHeader = ({ onNewAssessment }: DashboardHeaderProps) => {
  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Assessment Dashboard</h1>
        <p className="text-slate-600">Manage and track your cybersecurity assessments</p>
      </div>
      
      <Button 
        onClick={onNewAssessment}
        className="bg-blue-600 hover:bg-blue-700 text-white"
        size="lg"
      >
        <Plus className="h-4 w-4 mr-2" />
        Start New Assessment
      </Button>
    </div>
  );
};

export default DashboardHeader;
