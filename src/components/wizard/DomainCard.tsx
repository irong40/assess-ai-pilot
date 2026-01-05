import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  PlayCircle,
  AlertTriangle,
  KeyRound,
  GraduationCap,
  FileSearch,
  Settings,
  LifeBuoy,
  Shield,
  Building2,
  type LucideIcon,
} from "lucide-react";
import type { SecurityDomain, DomainProgress } from "@/types/questionnaire";
import { cn } from "@/lib/utils";

// Map icon names to actual icon components
const iconMap: Record<string, LucideIcon> = {
  KeyRound,
  GraduationCap,
  FileSearch,
  Settings,
  LifeBuoy,
  AlertTriangle,
  Shield,
  Building2,
};

interface DomainCardProps {
  domain: SecurityDomain;
  progress?: DomainProgress;
  isActive?: boolean;
  onStart: () => void;
  onContinue: () => void;
}

export function DomainCard({
  domain,
  progress,
  isActive = false,
  onStart,
  onContinue,
}: DomainCardProps) {
  const IconComponent = iconMap[domain.icon] || Shield;
  
  const hasStarted = progress && progress.answered_questions > 0;
  const isComplete = progress?.is_complete ?? false;
  const progressPercent = progress
    ? Math.round((progress.answered_questions / progress.total_questions) * 100)
    : 0;

  return (
    <Card
      className={cn(
        "transition-all duration-200 hover:shadow-md",
        isActive && "ring-2 ring-primary",
        isComplete && "bg-muted/30"
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "rounded-lg p-2",
                isComplete
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-primary/10 text-primary"
              )}
            >
              <IconComponent className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base">{domain.name}</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                NIST {domain.nistFamily}
              </p>
            </div>
          </div>
          {isComplete && (
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {domain.description}
        </p>

        {/* Progress Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {progress?.answered_questions ?? 0} of {domain.questionCount} questions
            </span>
            {progress?.score !== null && progress?.score !== undefined && (
              <Badge
                variant={
                  progress.score >= 80
                    ? "default"
                    : progress.score >= 60
                    ? "secondary"
                    : "destructive"
                }
              >
                {progress.score}%
              </Badge>
            )}
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* Findings Badge */}
        {progress && progress.findings_count > 0 && (
          <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-4 w-4" />
            <span>{progress.findings_count} finding{progress.findings_count > 1 ? 's' : ''} identified</span>
          </div>
        )}

        {/* Action Button */}
        <Button
          className="w-full"
          variant={isComplete ? "outline" : hasStarted ? "secondary" : "default"}
          onClick={hasStarted ? onContinue : onStart}
        >
          {isComplete ? (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Review Answers
            </>
          ) : hasStarted ? (
            <>
              <PlayCircle className="mr-2 h-4 w-4" />
              Continue
            </>
          ) : (
            <>
              <PlayCircle className="mr-2 h-4 w-4" />
              Start Domain
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
