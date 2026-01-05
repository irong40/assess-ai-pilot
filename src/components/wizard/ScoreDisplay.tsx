import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, AlertTriangle, CheckCircle2, Target } from "lucide-react";
import type { WizardProgress } from "@/types/questionnaire";
import { cn } from "@/lib/utils";

interface ScoreDisplayProps {
  progress: WizardProgress | null;
  compact?: boolean;
}

export function ScoreDisplay({ progress, compact = false }: ScoreDisplayProps) {
  if (!progress) {
    return null;
  }

  const overallPercent = Math.round(
    (progress.answered_questions / progress.total_questions) * 100
  );

  if (compact) {
    return (
      <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm text-muted-foreground">
              {progress.answered_questions}/{progress.total_questions}
            </span>
          </div>
          <Progress value={overallPercent} className="h-2" />
        </div>
        {progress.overall_score !== null && (
          <div className="text-center px-4 border-l">
            <div className="text-2xl font-bold">{progress.overall_score}%</div>
            <div className="text-xs text-muted-foreground">Score</div>
          </div>
        )}
        {progress.total_findings > 0 && (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            {progress.total_findings}
          </Badge>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="h-5 w-5" />
          Assessment Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Questions Completed</span>
            <span className="text-sm text-muted-foreground">
              {progress.answered_questions} of {progress.total_questions}
            </span>
          </div>
          <Progress value={overallPercent} className="h-3" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Score */}
          <div className="p-4 rounded-lg bg-muted/50 text-center">
            {progress.overall_score !== null ? (
              <>
                <div className={cn(
                  "text-3xl font-bold",
                  progress.overall_score >= 80
                    ? "text-green-600 dark:text-green-400"
                    : progress.overall_score >= 60
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-red-600 dark:text-red-400"
                )}>
                  {progress.overall_score}%
                </div>
                <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Compliance Score
                </div>
              </>
            ) : (
              <>
                <div className="text-3xl font-bold text-muted-foreground">--</div>
                <div className="text-sm text-muted-foreground">
                  Complete domains to see score
                </div>
              </>
            )}
          </div>

          {/* Findings */}
          <div className="p-4 rounded-lg bg-muted/50 text-center">
            <div className={cn(
              "text-3xl font-bold",
              progress.total_findings === 0
                ? "text-green-600 dark:text-green-400"
                : "text-amber-600 dark:text-amber-400"
            )}>
              {progress.total_findings}
            </div>
            <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Findings Identified
            </div>
          </div>
        </div>

        {/* Domain Completion */}
        <div className="space-y-2">
          <div className="text-sm font-medium">Domains Completed</div>
          <div className="flex flex-wrap gap-2">
            {progress.domains.map((domain) => (
              <Badge
                key={domain.domain_id}
                variant={domain.is_complete ? "default" : "outline"}
                className={cn(
                  "text-xs",
                  domain.is_complete && "bg-green-600 hover:bg-green-700"
                )}
              >
                {domain.is_complete && (
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                )}
                {domain.domain_name.split(" ")[0]}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
