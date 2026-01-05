import React, { useState, useEffect } from "react";
import { Award, CheckCircle, XCircle, AlertCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  RMF_DOCUMENT_TYPES,
  getATORequiredTypes,
  isValidDocumentType,
  type RMFDocumentType,
} from "@/types/documentTypes";
import { useNavigate } from "react-router-dom";

interface DocumentStatus {
  type: RMFDocumentType;
  label: string;
  present: boolean;
  documentCount: number;
}

export const ATOReadinessCard: React.FC = () => {
  const [documentStatuses, setDocumentStatuses] = useState<DocumentStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDocumentStatus = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("document_embeddings")
          .select("document_type");

        if (error) throw error;

        // Count documents by type
        const typeCounts = new Map<string, number>();
        for (const row of data || []) {
          const count = typeCounts.get(row.document_type) || 0;
          typeCounts.set(row.document_type, count + 1);
        }

        // Build status for ATO-required documents
        const requiredTypes = getATORequiredTypes();
        const statuses: DocumentStatus[] = requiredTypes.map((type) => ({
          type,
          label: RMF_DOCUMENT_TYPES[type].label,
          present: (typeCounts.get(type) || 0) > 0,
          documentCount: typeCounts.get(type) || 0,
        }));

        setDocumentStatuses(statuses);
      } catch (error) {
        console.error("Error fetching document status:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocumentStatus();
  }, []);

  const presentCount = documentStatuses.filter((s) => s.present).length;
  const totalRequired = documentStatuses.length;
  const readinessPercentage = totalRequired > 0 ? Math.round((presentCount / totalRequired) * 100) : 0;

  const getReadinessColor = () => {
    if (readinessPercentage >= 80) return "text-green-500";
    if (readinessPercentage >= 50) return "text-yellow-500";
    return "text-red-500";
  };

  const getReadinessLabel = () => {
    if (readinessPercentage >= 80) return "Ready for Review";
    if (readinessPercentage >= 50) return "In Progress";
    return "Not Ready";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              ATO Readiness
            </CardTitle>
            <CardDescription>
              Track required documents for Authorization to Operate
            </CardDescription>
          </div>
          <Badge
            variant={readinessPercentage >= 80 ? "default" : "secondary"}
            className={getReadinessColor()}
          >
            {getReadinessLabel()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Progress Overview */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Documentation Complete</span>
                <span className="font-semibold">
                  {presentCount} of {totalRequired} required documents
                </span>
              </div>
              <Progress value={readinessPercentage} className="h-3" />
              <p className={`text-2xl font-bold ${getReadinessColor()}`}>
                {readinessPercentage}%
              </p>
            </div>

            {/* Document Checklist */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">Required Documents</h4>
              <div className="space-y-2">
                {documentStatuses.map((status) => {
                  const Icon = RMF_DOCUMENT_TYPES[status.type].icon;
                  return (
                    <div
                      key={status.type}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        status.present
                          ? "bg-green-500/5 border-green-500/20"
                          : "bg-muted/50 border-muted"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {status.present ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-muted-foreground" />
                        )}
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span className={status.present ? "font-medium" : "text-muted-foreground"}>
                            {status.label}
                          </span>
                        </div>
                      </div>
                      {status.present ? (
                        <Badge variant="outline" className="text-green-600">
                          {status.documentCount} uploaded
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Missing</Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Button */}
            {presentCount < totalRequired && (
              <div className="flex items-center gap-2 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <span className="text-sm flex-1">
                  {totalRequired - presentCount} document{totalRequired - presentCount !== 1 ? "s" : ""}{" "}
                  still needed for ATO package
                </span>
                <Button size="sm" onClick={() => navigate("/compliance/documents")}>
                  Upload Documents
                </Button>
              </div>
            )}

            {readinessPercentage === 100 && (
              <div className="flex items-center gap-2 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-green-700">
                  All required documents are in place. Ready for ATO review!
                </span>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ATOReadinessCard;
