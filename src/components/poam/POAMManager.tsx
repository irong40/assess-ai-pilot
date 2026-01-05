import React, { useState, useEffect } from "react";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  Sparkles,
  Target,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  Edit,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { poamService, type GeneratedPOAM } from "@/services/aiService";

interface POAMEntry extends GeneratedPOAM {
  id: string;
  status: "open" | "in_progress" | "completed" | "delayed";
  created_at: string;
  updated_at: string;
  assessment_id: string;
  ai_generated: boolean;
}

interface POAMSummary {
  total: number;
  open: number;
  inProgress: number;
  completed: number;
  overdue: number;
  bySeverity: Record<string, number>;
}

const SEVERITY_CONFIG = {
  critical: { color: "bg-red-500", textColor: "text-red-700", bgColor: "bg-red-50", label: "Critical" },
  high: { color: "bg-orange-500", textColor: "text-orange-700", bgColor: "bg-orange-50", label: "High" },
  medium: { color: "bg-yellow-500", textColor: "text-yellow-700", bgColor: "bg-yellow-50", label: "Medium" },
  low: { color: "bg-blue-500", textColor: "text-blue-700", bgColor: "bg-blue-50", label: "Low" },
};

const STATUS_CONFIG = {
  open: { color: "bg-gray-500", label: "Open" },
  in_progress: { color: "bg-blue-500", label: "In Progress" },
  completed: { color: "bg-green-500", label: "Completed" },
  delayed: { color: "bg-red-500", label: "Delayed" },
};

export const POAMManager: React.FC = () => {
  const [poams, setPoams] = useState<POAMEntry[]>([]);
  const [summary, setSummary] = useState<POAMSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [filter, setFilter] = useState<{ status?: string; severity?: string }>({});
  const [expandedPoam, setExpandedPoam] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, [filter]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [poamData, summaryData] = await Promise.all([
        poamService.getAll({
          status: filter.status,
          riskLevel: filter.severity,
        }),
        poamService.getSummary(),
      ]);
      setPoams(poamData as POAMEntry[]);
      setSummary(summaryData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load POA&M data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (poamId: string, newStatus: string) => {
    try {
      await poamService.update(poamId, { status: newStatus });
      
      setPoams(prev =>
        prev.map(p => (p.id === poamId ? { ...p, status: newStatus as POAMEntry["status"] } : p))
      );

      toast({
        title: "Status Updated",
        description: `POA&M status changed to ${STATUS_CONFIG[newStatus as keyof typeof STATUS_CONFIG]?.label}`,
      });

      await poamService.getSummary().then(setSummary);
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update POA&M status",
        variant: "destructive",
      });
    }
  };

  const isOverdue = (poam: POAMEntry) => {
    if (poam.status === "completed") return false;
    const today = new Date().toISOString().split("T")[0];
    return poam.scheduled_completion_date < today;
  };

  const getProgressPercentage = () => {
    if (!summary || summary.total === 0) return 0;
    return Math.round((summary.completed / summary.total) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total POA&Ms</p>
                <p className="text-2xl font-bold">{summary?.total || 0}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Open</p>
                <p className="text-2xl font-bold text-gray-600">{summary?.open || 0}</p>
              </div>
              <Clock className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">{summary?.inProgress || 0}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-600">{summary?.completed || 0}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className={summary?.overdue ? "border-red-200 bg-red-50" : ""}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold text-red-600">{summary?.overdue || 0}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Overall Completion</span>
              <span className="font-medium">{getProgressPercentage()}%</span>
            </div>
            <Progress value={getProgressPercentage()} className="h-2" />
          </div>
          
          {/* Severity Breakdown */}
          <div className="flex gap-4 mt-4">
            {Object.entries(summary?.bySeverity || {}).map(([severity, count]) => (
              <div key={severity} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${SEVERITY_CONFIG[severity as keyof typeof SEVERITY_CONFIG]?.color}`} />
                <span className="text-sm text-muted-foreground capitalize">{severity}:</span>
                <span className="text-sm font-medium">{count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex items-center justify-between">
        <div className="flex gap-4">
          <Select
            value={filter.status || "all"}
            onValueChange={v => setFilter(prev => ({ ...prev, status: v === "all" ? undefined : v }))}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="delayed">Delayed</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filter.severity || "all"}
            onValueChange={v => setFilter(prev => ({ ...prev, severity: v === "all" ? undefined : v }))}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severities</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button disabled={isGenerating}>
          <Sparkles className="h-4 w-4 mr-2" />
          {isGenerating ? "Generating..." : "Generate from Findings"}
        </Button>
      </div>

      {/* POA&M List */}
      <Card>
        <CardHeader>
          <CardTitle>POA&M Entries</CardTitle>
          <CardDescription>
            Manage your Plan of Action and Milestones
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : poams.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No POA&M entries found</p>
              <p className="text-sm">Generate POA&Ms from your assessment findings</p>
            </div>
          ) : (
            <div className="space-y-3">
              {poams.map(poam => (
                <Collapsible
                  key={poam.id}
                  open={expandedPoam === poam.id}
                  onOpenChange={() => setExpandedPoam(expandedPoam === poam.id ? null : poam.id)}
                >
                  <div
                    className={`border rounded-lg ${
                      isOverdue(poam) ? "border-red-200 bg-red-50" : ""
                    }`}
                  >
                    <CollapsibleTrigger asChild>
                      <div className="p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {expandedPoam === poam.id ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                            
                            <Badge variant="outline" className="font-mono">
                              {poam.control_id}
                            </Badge>
                            
                            <Badge
                              className={`${
                                SEVERITY_CONFIG[poam.risk_level]?.color
                              } text-white`}
                            >
                              {SEVERITY_CONFIG[poam.risk_level]?.label}
                            </Badge>

                            <span className="text-sm font-medium truncate max-w-md">
                              {poam.weakness_description?.substring(0, 80)}
                              {poam.weakness_description?.length > 80 ? "..." : ""}
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            {poam.ai_generated && (
                              <Badge variant="secondary" className="text-xs">
                                <Sparkles className="h-3 w-3 mr-1" />
                                AI Generated
                              </Badge>
                            )}

                            {isOverdue(poam) && (
                              <Badge variant="destructive">Overdue</Badge>
                            )}

                            <Select
                              value={poam.status}
                              onValueChange={v => handleStatusUpdate(poam.id, v)}
                            >
                              <SelectTrigger className="w-[130px] h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="open">Open</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="delayed">Delayed</SelectItem>
                              </SelectContent>
                            </Select>

                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              {poam.scheduled_completion_date}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <div className="px-4 pb-4 pt-2 border-t space-y-4">
                        {/* Weakness Description */}
                        <div>
                          <h4 className="text-sm font-medium mb-1">Weakness Description</h4>
                          <p className="text-sm text-muted-foreground">{poam.weakness_description}</p>
                        </div>

                        {/* Remediation Plan */}
                        <div>
                          <h4 className="text-sm font-medium mb-1">Remediation Plan</h4>
                          <p className="text-sm text-muted-foreground">{poam.remediation_plan}</p>
                        </div>

                        {/* Milestones */}
                        {poam.milestones && poam.milestones.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium mb-2">Milestones</h4>
                            <div className="space-y-2">
                              {poam.milestones.map((milestone, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between p-2 bg-muted rounded"
                                >
                                  <div className="flex items-center gap-2">
                                    <Target className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">{milestone.description}</span>
                                  </div>
                                  <span className="text-sm text-muted-foreground">
                                    {milestone.target_date}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Additional Details */}
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <h4 className="text-sm font-medium mb-1">Resources Required</h4>
                            <p className="text-sm text-muted-foreground">{poam.resources_required}</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium mb-1">Estimated Cost</h4>
                            <p className="text-sm text-muted-foreground">{poam.estimated_cost}</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium mb-1">Responsible Party</h4>
                            <p className="text-sm text-muted-foreground">{poam.responsible_party}</p>
                          </div>
                        </div>

                        {/* AI Reasoning */}
                        {poam.ai_reasoning && (
                          <div className="p-3 bg-purple-50 rounded border border-purple-100">
                            <div className="flex items-center gap-2 mb-1">
                              <Sparkles className="h-4 w-4 text-purple-600" />
                              <h4 className="text-sm font-medium text-purple-900">AI Reasoning</h4>
                            </div>
                            <p className="text-sm text-purple-800">{poam.ai_reasoning}</p>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button variant="outline" size="sm">
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Export
                          </Button>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default POAMManager;
