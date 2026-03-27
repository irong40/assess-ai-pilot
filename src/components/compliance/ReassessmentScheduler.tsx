/**
 * Reassessment Scheduler component.
 *
 * Allows users to configure recurring CMMC reassessment schedules
 * (weekly/monthly/quarterly) with CMMC level and enable/disable toggle.
 */
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  useReassessmentSchedule,
  useUpdateReassessmentSchedule,
} from '@/hooks/useReassessmentSchedule';
import { Skeleton } from '@/components/ui/skeleton';

/** Frequency options mapped to cron expressions */
const FREQUENCY_OPTIONS = [
  { label: 'Weekly', value: 'weekly', cron: '0 0 * * 1' },
  { label: 'Monthly', value: 'monthly', cron: '0 0 1 * *' },
  { label: 'Quarterly', value: 'quarterly', cron: '0 0 1 */3 *' },
] as const;

const CMMC_LEVELS = [1, 2] as const;

export default function ReassessmentScheduler() {
  const { data: schedule, isLoading } = useReassessmentSchedule();
  const { mutate: updateSchedule, isPending } = useUpdateReassessmentSchedule();

  const [frequency, setFrequency] = useState('weekly');
  const [cmmcLevel, setCmmcLevel] = useState<1 | 2>(2);
  const [enabled, setEnabled] = useState(true);

  // Sync form state when schedule loads
  useEffect(() => {
    if (schedule) {
      setFrequency(schedule.frequency_label || 'weekly');
      setCmmcLevel((schedule.cmmc_level as 1 | 2) || 2);
      setEnabled(schedule.enabled ?? true);
    }
  }, [schedule]);

  function handleSave() {
    const freq = FREQUENCY_OPTIONS.find((f) => f.value === frequency);
    updateSchedule({
      cmmc_level: cmmcLevel,
      cron_expression: freq?.cron ?? '0 0 * * 1',
      frequency_label: frequency,
      enabled,
    });
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Reassessment Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reassessment Schedule</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Frequency selector */}
          <div className="space-y-2">
            <Label htmlFor="frequency">Frequency</Label>
            <select
              id="frequency"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
            >
              {FREQUENCY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* CMMC Level selector */}
          <div className="space-y-2">
            <Label htmlFor="cmmc-level">CMMC Level</Label>
            <select
              id="cmmc-level"
              value={cmmcLevel}
              onChange={(e) => setCmmcLevel(Number(e.target.value) as 1 | 2)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
            >
              {CMMC_LEVELS.map((level) => (
                <option key={level} value={level}>
                  Level {level}
                </option>
              ))}
            </select>
          </div>

          {/* Enabled toggle */}
          <div className="space-y-2">
            <Label>Enabled</Label>
            <div className="flex items-center gap-2 h-10">
              <Switch checked={enabled} onCheckedChange={setEnabled} />
              <span className="text-sm text-muted-foreground">
                {enabled ? 'Active' : 'Paused'}
              </span>
            </div>
          </div>
        </div>

        {/* Last run info */}
        {schedule?.last_run_at && (
          <p className="text-sm text-muted-foreground">
            Last run:{' '}
            {new Date(schedule.last_run_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        )}

        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? 'Saving...' : 'Save Schedule'}
        </Button>
      </CardContent>
    </Card>
  );
}
