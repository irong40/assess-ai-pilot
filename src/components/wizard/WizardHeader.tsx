import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Save, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { WizardProgress, SecurityDomainId } from "@/types/questionnaire";
import { getDomainById } from "@/types/questionnaire";

interface WizardHeaderProps {
  assessmentId: string;
  systemName: string;
  currentDomain: SecurityDomainId | null;
  progress: WizardProgress | null;
  onComplete?: () => void;
  isSaving?: boolean;
}

export function WizardHeader({
  assessmentId,
  systemName,
  currentDomain,
  progress,
  onComplete,
  isSaving = false,
}: WizardHeaderProps) {
  const navigate = useNavigate();
  const domain = currentDomain ? getDomainById(currentDomain) : null;

  const overallPercent = progress
    ? Math.round((progress.answered_questions / progress.total_questions) * 100)
    : 0;

  const canComplete = progress?.is_complete ?? false;

  return (
    <header className="sticky top-0 z-10 bg-background border-b">
      <div className="container py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Back button and title */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/assessment/${assessmentId}/wizard`)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">{systemName}</h1>
              {domain && (
                <p className="text-sm text-muted-foreground">
                  {domain.name} • NIST {domain.nistFamily}
                </p>
              )}
            </div>
          </div>

          {/* Center: Progress */}
          <div className="hidden md:flex flex-1 max-w-md items-center gap-3">
            <Progress value={overallPercent} className="h-2" />
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              {overallPercent}%
            </span>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {isSaving && (
              <Badge variant="secondary" className="animate-pulse">
                <Save className="mr-1 h-3 w-3" />
                Saving...
              </Badge>
            )}
            
            {progress && (
              <Badge variant="outline">
                {progress.total_findings} finding{progress.total_findings !== 1 ? 's' : ''}
              </Badge>
            )}

            {canComplete && (
              <Button onClick={onComplete} className="hidden sm:flex">
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Complete Assessment
              </Button>
            )}
          </div>
        </div>

        {/* Mobile progress bar */}
        <div className="md:hidden mt-3">
          <Progress value={overallPercent} className="h-2" />
        </div>
      </div>
    </header>
  );
}
