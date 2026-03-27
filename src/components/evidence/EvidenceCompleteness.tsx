/**
 * Evidence completeness tracking component.
 *
 * Shows per-family progress of evidence collection across 14 NIST 800-171 families.
 * Color coding: green >= 80%, yellow 50-79%, red < 50%.
 * Overall summary at top with total controls covered.
 */
import { useEvidenceCompleteness } from '@/hooks/useControlEvidence';
import type { EvidenceCompletenessRow } from '@/hooks/useControlEvidence';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, XCircle, FileSearch } from 'lucide-react';

function getProgressColor(percentage: number): string {
  if (percentage >= 80) return 'text-green-600';
  if (percentage >= 50) return 'text-yellow-600';
  return 'text-red-600';
}

function getProgressBarClass(percentage: number): string {
  if (percentage >= 80) return '[&>div]:bg-green-500';
  if (percentage >= 50) return '[&>div]:bg-yellow-500';
  return '[&>div]:bg-red-500';
}

function getStatusIcon(percentage: number) {
  if (percentage >= 80) return <CheckCircle className="h-4 w-4 text-green-600" />;
  if (percentage >= 50) return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
  return <XCircle className="h-4 w-4 text-red-600" />;
}

export default function EvidenceCompleteness() {
  const { data: completeness, isLoading } = useEvidenceCompleteness();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading completeness data...
        </CardContent>
      </Card>
    );
  }

  const families = completeness ?? [];
  const totalWithEvidence = families.reduce(
    (sum, f) => sum + f.controlsWithEvidence,
    0
  );
  const totalControls = families.reduce((sum, f) => sum + f.totalControls, 0);
  const overallPercentage =
    totalControls > 0 ? Math.round((totalWithEvidence / totalControls) * 100) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSearch className="h-5 w-5" />
          Evidence Completeness
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Summary */}
        <div className="bg-slate-50 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold">
            <span className={getProgressColor(overallPercentage)}>
              {overallPercentage}%
            </span>
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {totalWithEvidence} of {totalControls} controls have evidence
          </p>
          <Badge
            variant={overallPercentage >= 80 ? 'secondary' : overallPercentage >= 50 ? 'default' : 'destructive'}
            className="mt-2"
          >
            {overallPercentage >= 80
              ? 'Good Coverage'
              : overallPercentage >= 50
                ? 'Partial Coverage'
                : 'Needs Attention'}
          </Badge>
        </div>

        {/* Per-family rows */}
        <div className="space-y-3">
          {families.map((family: EvidenceCompletenessRow) => (
            <div key={family.familyId} className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(family.percentage)}
                  <span className="text-sm font-medium">{family.familyName}</span>
                </div>
                <span className={`text-sm font-mono ${getProgressColor(family.percentage)}`}>
                  {family.controlsWithEvidence} of {family.totalControls} controls
                </span>
              </div>
              <Progress
                value={family.percentage}
                className={`h-2 ${getProgressBarClass(family.percentage)}`}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
