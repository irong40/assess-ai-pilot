/**
 * SPRS Score Card component.
 *
 * Displays the current SPRS score as a large number with posture indicator,
 * met/not-met counts, POA&M eligibility, and critical controls status.
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  getPostureLabel,
  getPostureColor,
  getPostureBadgeVariant,
} from '@/lib/compliance-utils';
import type { ComplianceSnapshot } from '@/types/grc-output';

interface SprsScoreCardProps {
  snapshot: ComplianceSnapshot | null;
}

export default function SprsScoreCard({ snapshot }: SprsScoreCardProps) {
  if (!snapshot) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>SPRS Score</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No compliance data available yet.</p>
        </CardContent>
      </Card>
    );
  }

  const posture = getPostureLabel(snapshot.sprs_score);
  const color = getPostureColor(snapshot.sprs_score);
  const badgeVariant = getPostureBadgeVariant(snapshot.sprs_score);

  return (
    <Card>
      <CardHeader>
        <CardTitle>SPRS Score</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Large score display */}
        <div className="text-center">
          <span className={`text-5xl font-bold ${color}`}>
            {snapshot.sprs_score}
          </span>
          <div className="mt-2">
            <Badge variant={badgeVariant}>{posture}</Badge>
          </div>
        </div>

        {/* Control counts */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Controls Met</span>
            <p className="text-lg font-semibold text-green-600">
              {snapshot.met_count} / {snapshot.total_controls}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">Gaps Remaining</span>
            <p className="text-lg font-semibold text-red-600">
              {snapshot.not_met_count}
            </p>
          </div>
        </div>

        {/* Eligibility indicators */}
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex items-center gap-2">
            <span>{snapshot.poam_eligible ? '\u2705' : '\u274C'}</span>
            <span>POA&M Eligible</span>
          </div>
          <div className="flex items-center gap-2">
            <span>{snapshot.critical_controls_met ? '\u2705' : '\u274C'}</span>
            <span>Critical Controls Met</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
