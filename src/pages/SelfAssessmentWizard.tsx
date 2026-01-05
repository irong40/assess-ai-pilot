import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, ArrowRight, CheckCircle2, AlertTriangle } from "lucide-react";
import { QuestionCard } from "@/components/wizard/QuestionCard";
import { DomainProgress } from "@/components/wizard/DomainProgress";
import { ScoreDisplay } from "@/components/wizard/ScoreDisplay";
import { WizardHeader } from "@/components/wizard/WizardHeader";
import { useAssessmentWizard, useWizardProgress, useWizardMutations } from "@/hooks/useWizardProgress";
import { useQuestionsWithResponses } from "@/hooks/useAssessmentQuestions";
import { useResponseMutations } from "@/hooks/useAssessmentResponses";
import { SECURITY_DOMAINS, type SecurityDomainId } from "@/types/questionnaire";
import { cn } from "@/lib/utils";

export default function SelfAssessmentWizard() {
  const { id: assessmentId, domainId } = useParams<{ id: string; domainId: string }>();
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);

  const currentDomain = domainId as SecurityDomainId | null;

  const { data: assessment, isLoading: isLoadingAssessment } = useAssessmentWizard(assessmentId || null);
  const { data: progress, isLoading: isLoadingProgress } = useWizardProgress(assessmentId || null);
  const { data: questions, isLoading: isLoadingQuestions } = useQuestionsWithResponses(
    assessmentId || null,
    currentDomain
  );
  const { setCurrentDomain, completeDomain, completeWizard } = useWizardMutations(assessmentId || "");
  const { saveResponse } = useResponseMutations(assessmentId || "");

  // Update current domain in database
  useEffect(() => {
    if (currentDomain && assessment && assessment.current_domain !== currentDomain) {
      setCurrentDomain.mutate(currentDomain);
    }
  }, [currentDomain, assessment]);

  const isLoading = isLoadingAssessment || isLoadingProgress || isLoadingQuestions;

  const handleAnswer = async (
    questionId: string,
    responseValue: string,
    notes: string | null,
    createsFinding: boolean
  ) => {
    setIsSaving(true);
    try {
      await saveResponse.mutateAsync({
        questionId,
        responseValue,
        notes,
        createsFinding,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectDomain = (domain: SecurityDomainId) => {
    navigate(`/assessment/${assessmentId}/wizard/${domain}`);
  };

  const handlePreviousDomain = () => {
    const currentIndex = SECURITY_DOMAINS.findIndex(d => d.id === currentDomain);
    if (currentIndex > 0) {
      navigate(`/assessment/${assessmentId}/wizard/${SECURITY_DOMAINS[currentIndex - 1].id}`);
    }
  };

  const handleNextDomain = () => {
    const currentIndex = SECURITY_DOMAINS.findIndex(d => d.id === currentDomain);
    
    // Mark current domain as complete if all questions answered
    const domainProgress = progress?.domains.find(d => d.domain_id === currentDomain);
    if (domainProgress?.is_complete && domainProgress.score !== null) {
      completeDomain.mutate({
        domainId: currentDomain!,
        score: domainProgress.score,
      });
    }

    if (currentIndex < SECURITY_DOMAINS.length - 1) {
      navigate(`/assessment/${assessmentId}/wizard/${SECURITY_DOMAINS[currentIndex + 1].id}`);
    } else {
      // All domains done, go to hub
      navigate(`/assessment/${assessmentId}/wizard`);
    }
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

  const currentDomainIndex = SECURITY_DOMAINS.findIndex(d => d.id === currentDomain);
  const isFirstDomain = currentDomainIndex === 0;
  const isLastDomain = currentDomainIndex === SECURITY_DOMAINS.length - 1;
  const domainProgress = progress?.domains.find(d => d.domain_id === currentDomain);
  const allQuestionsAnswered = domainProgress?.is_complete ?? false;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b p-4">
          <Skeleton className="h-10 w-64" />
        </div>
        <div className="container py-8">
          <div className="flex gap-8">
            <Skeleton className="hidden lg:block w-64 h-96" />
            <div className="flex-1 space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-48" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!assessment || !currentDomain) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold mb-2">Invalid Assessment or Domain</h2>
            <Button onClick={() => navigate("/dashboard")}>
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <WizardHeader
        assessmentId={assessmentId!}
        systemName={assessment.system_name}
        currentDomain={currentDomain}
        progress={progress}
        onComplete={handleCompleteAssessment}
        isSaving={isSaving}
      />

      <div className="container py-6">
        <div className="flex gap-8">
          {/* Sidebar - Domain Navigation */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24 space-y-6">
              <DomainProgress
                progress={progress?.domains || []}
                currentDomain={currentDomain}
                onSelectDomain={handleSelectDomain}
              />
              
              {progress && (
                <ScoreDisplay progress={progress} />
              )}
            </div>
          </aside>

          {/* Main Content - Questions */}
          <main className="flex-1 max-w-3xl space-y-6">
            {/* Domain Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">
                  {SECURITY_DOMAINS.find(d => d.id === currentDomain)?.name}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {domainProgress?.answered_questions ?? 0} of {questions?.length ?? 0} questions answered
                  {domainProgress?.score !== null && ` • Score: ${domainProgress.score}%`}
                </p>
              </div>
              {allQuestionsAnswered && (
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="text-sm font-medium">Complete</span>
                </div>
              )}
            </div>

            {/* Questions List */}
            <div className="space-y-4">
              {questions?.map((question, index) => (
                <QuestionCard
                  key={question.id}
                  question={question}
                  questionNumber={index + 1}
                  totalQuestions={questions.length}
                  onAnswer={(value, notes, creates) =>
                    handleAnswer(question.id, value, notes, creates)
                  }
                  isSubmitting={isSaving}
                />
              ))}
            </div>

            {/* Navigation Footer */}
            <div className="flex items-center justify-between pt-6 border-t">
              <Button
                variant="outline"
                onClick={handlePreviousDomain}
                disabled={isFirstDomain}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous Domain
              </Button>

              <div className="text-sm text-muted-foreground">
                Domain {currentDomainIndex + 1} of {SECURITY_DOMAINS.length}
              </div>

              <Button onClick={handleNextDomain}>
                {isLastDomain ? (
                  <>
                    Finish
                    <CheckCircle2 className="ml-2 h-4 w-4" />
                  </>
                ) : (
                  <>
                    Next Domain
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
