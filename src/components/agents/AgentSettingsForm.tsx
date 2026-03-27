/**
 * Agent Settings Form -- company-level agent configuration for notification
 * preferences and auto-approve thresholds.
 *
 * V1 uses a single "global" settings row per company (not per-agent).
 *
 * Settings:
 * - Notifications: approval_needed, drift_alert, task_complete (checkboxes)
 * - Auto-approve threshold: low / medium / none (select dropdown)
 */
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useAgentSettings,
  useUpdateAgentSettings,
} from '@/hooks/useAgentSettings';
import type { AgentSettingsData, AutoApproveThreshold } from '@/hooks/useAgentSettings';

const THRESHOLD_OPTIONS: { value: AutoApproveThreshold; label: string }[] = [
  { value: 'low', label: 'Low risk only' },
  { value: 'medium', label: 'Low and medium risk' },
  { value: 'none', label: 'None -- approve all manually' },
];

export function AgentSettingsForm() {
  const { data: settingsRow, isLoading } = useAgentSettings();
  const updateSettings = useUpdateAgentSettings();

  const [approvalNeeded, setApprovalNeeded] = useState(true);
  const [driftAlert, setDriftAlert] = useState(true);
  const [taskComplete, setTaskComplete] = useState(false);
  const [threshold, setThreshold] = useState<AutoApproveThreshold>('low');

  // Sync form state with loaded settings
  useEffect(() => {
    if (settingsRow?.settings) {
      const s = settingsRow.settings;
      setApprovalNeeded(s.notifications?.approval_needed ?? true);
      setDriftAlert(s.notifications?.drift_alert ?? true);
      setTaskComplete(s.notifications?.task_complete ?? false);
      setThreshold(s.auto_approve_threshold ?? 'low');
    }
  }, [settingsRow]);

  const handleSave = () => {
    const settings: AgentSettingsData = {
      notifications: {
        approval_needed: approvalNeeded,
        drift_alert: driftAlert,
        task_complete: taskComplete,
      },
      auto_approve_threshold: threshold,
    };

    updateSettings.mutate({ settings });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Notification Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="approval-needed"
              checked={approvalNeeded}
              onCheckedChange={(checked) =>
                setApprovalNeeded(checked === true)
              }
            />
            <Label htmlFor="approval-needed">Approval needed</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="drift-alert"
              checked={driftAlert}
              onCheckedChange={(checked) => setDriftAlert(checked === true)}
            />
            <Label htmlFor="drift-alert">Drift alert</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="task-complete"
              checked={taskComplete}
              onCheckedChange={(checked) => setTaskComplete(checked === true)}
            />
            <Label htmlFor="task-complete">Task complete</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Auto-Approve Threshold</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="threshold-select">
              Automatically approve agent actions up to this risk level
            </Label>
            <Select
              value={threshold}
              onValueChange={(val) =>
                setThreshold(val as AutoApproveThreshold)
              }
            >
              <SelectTrigger id="threshold-select" className="w-full max-w-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {THRESHOLD_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={updateSettings.isPending}>
        {updateSettings.isPending ? 'Saving...' : 'Save Settings'}
      </Button>
    </div>
  );
}
