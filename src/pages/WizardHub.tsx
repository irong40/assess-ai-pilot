import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, AlertTriangle, CheckCircle2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { DomainCard } from "@/components/wizard/DomainCard";
import { ScoreDisplay } from "@/components/wizard/ScoreDisplay";
import { useAssessmentWizard, useWizardProgress, useWizardMutations } from "@/hooks/useWizardProgress";
import { SECURITY_DOMAINS, type SecurityDomainId } from "@/types/questionnaire";
import { Skeleton } from "@/components/ui/skeleton";

export default function WizardHub() {
  const { id: assessmentId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: assessment, isLoading: isLoadingAssessment } = useAssessmentWizard(assessmentId || null);
  const { data: progress, isLoading: isLoadingProgress } = useWizardProgress(assessmentId || null);
  const { startWizard, completeWizard } = useWizardMutations(assessmentId || "");

  const isLoading = isLoadingAssessment || isLoadingProgress;

  const handleStartDomain = (domainId: SecurityDomainId) => {
    if (!assessment?.wizard_started_at) {
      startWizard.mutate(domainId, {
        onSuccess: () => {
          navigate(`/assessment/${assessmentId}/wizard/${domainId}`);
        },
      });
    } else {
      navigate(`/assessment/${assessmentId}/wizard/${domainId}`);
    }
  };

  const handleContinueDomain = (domainId: SecurityDomainId) => {
    navigate(`/assessment/${assessmentId}/wizard/${domainId}`);
  };

  const handleCompleteAssessment = () => {
    if (progress?.overall_score !== null) {
      completeWizard.mutate(progress.overall_score, {
        onSuccess: () => {
          navigate(`/assessment/${assessmentId}/results`);
        },
      });
    }
  };

  const handleViewResults = () => {
    navigate(`/assessment/${assessmentId}/results`);
  };

  // Get domain progress map for quick lookup
  const domainProgressMap = new Map(progress?.domains.map(d => [d.domain_id, d]));

  if (isLoading) {
    return (
      <AppLayout>
        <div className="container py-8 space-y-8">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!assessment) {
    return (
      <AppLayout>
        <div className="container py-8">
          <Card>
            <CardContent className="py-12 text-center">
              <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-lg font-semibold mb-2">Assessment Not Found</h2>
              <p className="text-muted-foreground mb-4">
                The assessment you're looking for doesn't exist or you don't have access to it.
              </p>
              <Button onClick={() => navigate("/dashboard")}>
                Return to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  const isComplete = progress?.is_complete ?? false;

  return (
    <AppLayout>
      <div className="container py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">{assessment.system_name}</h1>
            <p className="text-muted-foreground">
              {assessment.environment} • {assessment.compliance_scope}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isComplete && (
              <>
                <Button variant="outline" onClick={handleViewResults}>
                  <FileText className="mr-2 h-4 w-4" />
                  View Results
                </Button>
                <Button onClick={handleCompleteAssessment} disabled={completeWizard.isPending}>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Complete Assessment
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Progress Overview */}
        {progress && (
          <ScoreDisplay progress={progress} compact />
        )}

        {/* Instructions Card */}
        <Card className="bg-muted/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Self-Assessment Wizard</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Complete the questionnaire for each security domain below. Answer questions honestly
              based on your current security posture. Gaps identified will be tracked as findings
              that can be converted to POA&M entries for remediation tracking.
            </p>
          </CardContent>
        </Card>

        {/* Domain Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {SECURITY_DOMAINS.map((domain) => (
            <DomainCard
              key={domain.id}
              domain={domain}
              progress={domainProgressMap.get(domain.id)}
              isActive={assessment.current_domain === domain.id}
              onStart={() => handleStartDomain(domain.id)}
              onContinue={() => handleContinueDomain(domain.id)}
            />
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
