
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, User, Shield, ChevronRight, Clock, CheckCircle, Play } from "lucide-react";

export interface AssessmentCardProps {
  id: string;
  systemName: string;
  environment: string;
  scope: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'needs_review';
  owner: string;
  lastUpdated: string;
  onView: (id: string) => void;
}

const AssessmentCard = ({ 
  id, 
  systemName, 
  environment, 
  scope, 
  status, 
  owner, 
  lastUpdated, 
  onView 
}: AssessmentCardProps) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'completed': 
        return {
          color: 'bg-green-100 text-green-800 hover:bg-green-200',
          text: 'Completed',
          icon: <CheckCircle className="h-3 w-3" />
        };
      case 'in_progress': 
        return {
          color: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
          text: 'In Progress',
          icon: <Clock className="h-3 w-3" />
        };
      case 'needs_review':
        return {
          color: 'bg-orange-100 text-orange-800 hover:bg-orange-200',
          text: 'Needs Review',
          icon: <Clock className="h-3 w-3" />
        };
      default: 
        return {
          color: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
          text: 'Not Started',
          icon: <Play className="h-3 w-3" />
        };
    }
  };

  const statusConfig = getStatusConfig(status);

  return (
    <Card className="hover:shadow-lg transition-all duration-200 border-slate-200 hover:border-blue-300">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-slate-900 mb-1">
              {systemName}
            </CardTitle>
            <div className="flex items-center space-x-4 text-sm text-slate-600">
              <div className="flex items-center space-x-1">
                <Shield className="h-3 w-3" />
                <span>{environment}</span>
              </div>
              <div className="flex items-center space-x-1">
                <User className="h-3 w-3" />
                <span>{owner}</span>
              </div>
            </div>
          </div>
          <Badge className={`${statusConfig.color} border-0 flex items-center space-x-1`}>
            {statusConfig.icon}
            <span>{statusConfig.text}</span>
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Compliance Scope:</span>
            <span className="font-medium text-slate-900">{scope}</span>
          </div>
          
          <div className="flex items-center space-x-1 text-xs text-slate-500">
            <Calendar className="h-3 w-3" />
            <span>Last updated {lastUpdated}</span>
          </div>
          
          <div className="pt-2">
            <Button 
              onClick={() => onView(id)}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white"
              size="sm"
            >
              {status === 'not_started' ? 'Start Assessment' : 
               status === 'in_progress' || status === 'needs_review' ? 'Continue Assessment' : 'View Results'}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AssessmentCard;
