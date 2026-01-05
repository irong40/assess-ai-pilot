import React, { useState, useEffect } from "react";
import {
  Activity,
  Bot,
  Calendar,
  Download,
  Eye,
  FileText,
  Loader2,
  Shield,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { auditService, type AuditLogEntry } from "@/services/aiService";

const ACTION_CONFIG: Record<string, { icon: typeof Activity; color: string; label: string }> = {
  create: { icon: FileText, color: "text-green-600 bg-green-50", label: "Create" },
  update: { icon: Activity, color: "text-blue-600 bg-blue-50", label: "Update" },
  delete: { icon: FileText, color: "text-red-600 bg-red-50", label: "Delete" },
  view: { icon: Eye, color: "text-gray-600 bg-gray-50", label: "View" },
  export: { icon: Download, color: "text-purple-600 bg-purple-50", label: "Export" },
  ai_query: { icon: Bot, color: "text-indigo-600 bg-indigo-50", label: "AI Query" },
  ai_decision: { icon: Bot, color: "text-pink-600 bg-pink-50", label: "AI Decision" },
};

const RESOURCE_TYPES = [
  "assessment",
  "poam",
  "document",
  "finding",
  "rag_query",
  "notification",
  "user",
];

export const AuditLogViewer: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [aiDecisions, setAiDecisions] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<{
    action?: string;
    resourceType?: string;
    startDate?: string;
    endDate?: string;
  }>({});
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [logsData, aiData] = await Promise.all([
        auditService.getLogs({ ...filters, limit: 500 }),
        auditService.getAIDecisions(100),
      ]);
      setLogs(logsData);
      setAiDecisions(aiData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load audit logs",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const csv = await auditService.exportToCSV(filters);
      
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-log-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Export Complete",
        description: "Audit log exported successfully",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export audit log",
        variant: "destructive",
      });
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString(),
    };
  };

  const renderLogRow = (log: AuditLogEntry) => {
    const actionConfig = ACTION_CONFIG[log.action] || ACTION_CONFIG.view;
    const ActionIcon = actionConfig.icon;
    const { date, time } = formatTimestamp(log.created_at);

    return (
      <TableRow
        key={log.id}
        className="cursor-pointer hover:bg-muted/50"
        onClick={() => setSelectedLog(log)}
      >
        <TableCell>
          <div className="flex flex-col">
            <span className="text-sm">{date}</span>
            <span className="text-xs text-muted-foreground">{time}</span>
          </div>
        </TableCell>
        <TableCell>
          <Badge variant="outline" className={actionConfig.color}>
            <ActionIcon className="h-3 w-3 mr-1" />
            {actionConfig.label}
          </Badge>
        </TableCell>
        <TableCell>
          <Badge variant="secondary" className="capitalize">
            {log.resource_type.replace("_", " ")}
          </Badge>
        </TableCell>
        <TableCell className="max-w-xs truncate">
          {log.resource_name || log.resource_id || "-"}
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm truncate max-w-[150px]">{log.user_id}</span>
          </div>
        </TableCell>
        <TableCell>
          {log.ai_reasoning && (
            <Badge variant="outline" className="text-purple-600 bg-purple-50">
              <Bot className="h-3 w-3 mr-1" />
              AI
            </Badge>
          )}
        </TableCell>
      </TableRow>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Audit Log
          </h2>
          <p className="text-muted-foreground">
            Complete audit trail for compliance and security monitoring
          </p>
        </div>
        <Button onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <Select
              value={filters.action || "all"}
              onValueChange={v =>
                setFilters(prev => ({ ...prev, action: v === "all" ? undefined : v }))
              }
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {Object.keys(ACTION_CONFIG).map(action => (
                  <SelectItem key={action} value={action}>
                    {ACTION_CONFIG[action].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.resourceType || "all"}
              onValueChange={v =>
                setFilters(prev => ({ ...prev, resourceType: v === "all" ? undefined : v }))
              }
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Resource" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Resources</SelectItem>
                {RESOURCE_TYPES.map(type => (
                  <SelectItem key={type} value={type} className="capitalize">
                    {type.replace("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                className="w-[150px]"
                value={filters.startDate || ""}
                onChange={e =>
                  setFilters(prev => ({ ...prev, startDate: e.target.value || undefined }))
                }
                placeholder="Start date"
              />
              <span className="text-muted-foreground">to</span>
              <Input
                type="date"
                className="w-[150px]"
                value={filters.endDate || ""}
                onChange={e =>
                  setFilters(prev => ({ ...prev, endDate: e.target.value || undefined }))
                }
                placeholder="End date"
              />
            </div>

            <Button
              variant="outline"
              onClick={() => setFilters({})}
              disabled={Object.keys(filters).length === 0}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for All Logs vs AI Decisions */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            All Activity ({logs.length})
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            AI Decisions ({aiDecisions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>Activity Log</CardTitle>
              <CardDescription>All system activity and user actions</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : logs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No audit logs found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Resource</TableHead>
                      <TableHead>Name/ID</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>AI</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>{logs.map(renderLogRow)}</TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                AI Decision Trail
              </CardTitle>
              <CardDescription>
                Transparency into AI-powered decisions and reasoning
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : aiDecisions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No AI decisions recorded yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {aiDecisions.map(decision => {
                    const { date, time } = formatTimestamp(decision.created_at);
                    return (
                      <div
                        key={decision.id}
                        className="border rounded-lg p-4 hover:bg-muted/50 cursor-pointer"
                        onClick={() => setSelectedLog(decision)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-pink-600 bg-pink-50">
                                {decision.action.replace("_", " ")}
                              </Badge>
                              <Badge variant="secondary" className="capitalize">
                                {decision.resource_type.replace("_", " ")}
                              </Badge>
                              {decision.resource_name && (
                                <span className="text-sm text-muted-foreground">
                                  {decision.resource_name}
                                </span>
                              )}
                            </div>
                            {decision.ai_reasoning && (
                              <div className="p-3 bg-purple-50 rounded border border-purple-100">
                                <p className="text-sm text-purple-900">{decision.ai_reasoning}</p>
                              </div>
                            )}
                          </div>
                          <div className="text-right text-sm text-muted-foreground">
                            <div>{date}</div>
                            <div>{time}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Audit Log Details
            </DialogTitle>
            <DialogDescription>
              Complete details for this audit entry
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Timestamp</label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedLog.created_at).toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Action</label>
                  <p>
                    <Badge
                      variant="outline"
                      className={ACTION_CONFIG[selectedLog.action]?.color}
                    >
                      {ACTION_CONFIG[selectedLog.action]?.label || selectedLog.action}
                    </Badge>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Resource Type</label>
                  <p className="text-sm text-muted-foreground capitalize">
                    {selectedLog.resource_type.replace("_", " ")}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Resource ID</label>
                  <p className="text-sm text-muted-foreground font-mono">
                    {selectedLog.resource_id || "-"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Resource Name</label>
                  <p className="text-sm text-muted-foreground">
                    {selectedLog.resource_name || "-"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">User ID</label>
                  <p className="text-sm text-muted-foreground font-mono">
                    {selectedLog.user_id}
                  </p>
                </div>
              </div>

              {selectedLog.details && Object.keys(selectedLog.details).length > 0 && (
                <div>
                  <label className="text-sm font-medium">Details</label>
                  <ScrollArea className="h-[150px] mt-2">
                    <pre className="text-xs bg-muted p-3 rounded overflow-auto">
                      {JSON.stringify(selectedLog.details, null, 2)}
                    </pre>
                  </ScrollArea>
                </div>
              )}

              {selectedLog.ai_reasoning && (
                <div>
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Bot className="h-4 w-4 text-purple-600" />
                    AI Reasoning
                  </label>
                  <div className="p-3 bg-purple-50 rounded border border-purple-100 mt-2">
                    <p className="text-sm text-purple-900">{selectedLog.ai_reasoning}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AuditLogViewer;
