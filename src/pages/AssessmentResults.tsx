import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  FileText,
  Download,
  AlertTriangle,
  CheckCircle2,
  Shield,
  Target,
  ClipboardList,
} from "lucide-react";
import { useAssessmentWizard, useWizardProgress } from "@/hooks/useWizardProgress";
import { useFindingsBySeverity } from "@/hooks/useAssessmentFindings";
import { SECURITY_DOMAINS, type SecurityDomainId } from "@/types/questionnaire";
import { cn } from "@/lib/utils";

export default function AssessmentResults() {
  const { id: assessmentId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: assessment, isLoading: isLoadingAssessment } = useAssessmentWizard(assessmentId || null);
  const { data: progress, isLoading: isLoadingProgress } = useWizardProgress(assessmentId || null);
  const { findings, groupedFindings, counts, isLoading: isLoadingFindings } = useFindingsBySeverity(assessmentId || null);

  const isLoading = isLoadingAssessment || isLoadingProgress || isLoadingFindings;

  const handleGeneratePoam = () => {
    navigate(`/compliance/poam?assessment=${assessmentId}`);
  };

  const handleDownloadReport = () => {
    // TODO: Implement report download
    console.log("Download report");
  };

  if (isLoading) {
    return (
      <div className="container py-8 space-y-8">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (!assessment || !progress) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold mb-2">Assessment Not Found</h2>
            <Button onClick={() => navigate("/dashboard")}>
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const scoreColor = (score: number | null) => {
    if (score === null) return "text-muted-foreground";
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-amber-600 dark:text-amber-400";
    return "text-red-600 dark:text-red-400";
  };

  const scoreLabel = (score: number | null) => {
    if (score === null) return "N/A";
    if (score >= 80) return "Good";
    if (score >= 60) return "Fair";
    return "Needs Improvement";
  };

  return (
    <div className="container py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/assessment/${assessmentId}/wizard`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{assessment.system_name}</h1>
            <p className="text-muted-foreground">
              Assessment Results • {assessment.compliance_scope}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleDownloadReport}>
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
          {counts.total > 0 && (
            <Button onClick={handleGeneratePoam}>
              <ClipboardList className="mr-2 h-4 w-4" />
              Generate POA&M
            </Button>
          )}
        </div>
      </div>

      {/* Score Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Overall Score */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4" />
              Overall Compliance Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn("text-5xl font-bold", scoreColor(progress.overall_score))}>
              {progress.overall_score !== null ? `${progress.overall_score}%` : "--"}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {scoreLabel(progress.overall_score)}
            </p>
          </CardContent>
        </Card>

        {/* Questions Completed */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Questions Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-bold">
              {progress.answered_questions}
              <span className="text-2xl text-muted-foreground">/{progress.total_questions}</span>
            </div>
            <Progress
              value={(progress.answered_questions / progress.total_questions) * 100}
              className="h-2 mt-3"
            />
          </CardContent>
        </Card>

        {/* Findings Summary */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Findings Identified
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-bold">{counts.total}</div>
            <div className="flex gap-2 mt-2">
              {counts.critical > 0 && (
                <Badge variant="destructive">{counts.critical} Critical</Badge>
              )}
              {counts.high > 0 && (
                <Badge className="bg-orange-500">{counts.high} High</Badge>
              )}
              {counts.medium > 0 && (
                <Badge variant="secondary">{counts.medium} Medium</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Domain Scores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Domain Scores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {progress.domains.map((domain) => {
              const domainInfo = SECURITY_DOMAINS.find(d => d.id === domain.domain_id);
              return (
                <div
                  key={domain.domain_id}
                  className="p-4 rounded-lg border bg-card"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium truncate">
                      {domainInfo?.name || domain.domain_name}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {domainInfo?.nistFamily}
                    </Badge>
                  </div>
                  <div className={cn("text-2xl font-bold", scoreColor(domain.score))}>
                    {domain.score !== null ? `${domain.score}%` : "--"}
                  </div>
                  <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                    <span>{domain.answered_questions}/{domain.total_questions} answered</span>
                    {domain.findings_count > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {domain.findings_count} finding{domain.findings_count > 1 ? "s" : ""}
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Findings List */}
      {counts.total > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Identified Findings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(groupedFindings).map(([severity, severityFindings]) => {
              if (severityFindings.length === 0) return null;
              
              return (
                <div key={severity} className="space-y-2">
                  <h3 className="text-sm font-semibold capitalize flex items-center gap-2">
                    <Badge
                      variant={
                        severity === "critical"
                          ? "destructive"
                          : severity === "high"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {severity}
                    </Badge>
                    <span className="text-muted-foreground">
                      ({severityFindings.length} finding{severityFindings.length > 1 ? "s" : ""})
                    </span>
                  </h3>
                  <div className="space-y-2">
                    {severityFindings.map((finding) => (
                      <div
                        key={finding.id}
                        className="p-3 rounded-lg border bg-muted/30"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium">{finding.title}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {finding.description}
                            </p>
                          </div>
                          <Badge variant="outline">{finding.control_id}</Badge>
                        </div>
                        {finding.recommendation && (
                          <p className="text-sm mt-2 p-2 rounded bg-primary/5">
                            <strong>Recommendation:</strong> {finding.recommendation}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* No Findings Message */}
      {counts.total === 0 && (
        <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <CardContent className="py-8 text-center">
            <CheckCircle2 className="h-12 w-12 mx-auto text-green-600 dark:text-green-400 mb-4" />
            <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">
              No Findings Identified
            </h3>
            <p className="text-green-700 dark:text-green-300 mt-1">
              Your assessment shows full compliance across all evaluated domains.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
