/**
 * Drift Alert Banner component.
 *
 * Displays a warning banner when compliance drift is detected
 * (SPRS score dropped by 5+ points between assessments).
 * Includes a "Run Re-Assessment" action button.
 */
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { detectDrift } from '@/lib/compliance-utils';
import { dispatchCisoAssessment } from '@/services/agentService';
import { toast } from 'sonner';
import { useState } from 'react';

interface DriftAlertBannerProps {
  snapshots: Array<{ sprs_score: number }> | null | undefined;
  cmmcLevel?: 1 | 2;
  assessmentId?: string;
}

export default function DriftAlertBanner({
  snapshots,
  cmmcLevel = 2,
  assessmentId,
}: DriftAlertBannerProps) {
  const [dispatching, setDispatching] = useState(false);
  const drift = detectDrift(snapshots);

  // Only show banner for declining drift
  if (!drift.hasDrift || drift.direction !== 'declining') {
    return null;
  }

  async function handleReAssess() {
    if (!assessmentId) {
      toast.error('No assessment ID available for re-assessment');
      return;
    }
    setDispatching(true);
    try {
      const result = await dispatchCisoAssessment(assessmentId, cmmcLevel);
      if ('error' in result) {
        toast.error(`Re-assessment failed: ${result.error}`);
      } else {
        toast.success('Re-assessment dispatched successfully');
      }
    } catch (err) {
      toast.error('Failed to dispatch re-assessment');
    } finally {
      setDispatching(false);
    }
  }

  return (
    <Alert className="border-orange-400 bg-orange-50 dark:bg-orange-950/20">
      <AlertTitle className="text-orange-700 dark:text-orange-400">
        Compliance Drift Detected
      </AlertTitle>
      <AlertDescription className="flex items-center justify-between gap-4">
        <span>
          SPRS score changed by {drift.delta} points since last assessment.
          Current: {drift.currentScore}, Previous: {drift.previousScore}.
        </span>
        {assessmentId && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleReAssess}
            disabled={dispatching}
          >
            {dispatching ? 'Dispatching...' : 'Run Re-Assessment'}
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
