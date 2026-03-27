/**
 * Compliance Dashboard page.
 *
 * Composes all compliance components into a single view:
 * - DriftAlertBanner (top - added in Task 2)
 * - SprsScoreCard + ComplianceTrendChart (top row)
 * - FamilyProgressChart (middle row)
 * - ExecutiveSummaryView (bottom section)
 * - ReassessmentScheduler (footer - added in Task 2)
 */
import { Skeleton } from '@/components/ui/skeleton';
import { useComplianceSnapshots } from '@/hooks/useComplianceSnapshots';
import { getLatestSnapshot } from '@/lib/compliance-utils';
import SprsScoreCard from '@/components/compliance/SprsScoreCard';
import FamilyProgressChart from '@/components/compliance/FamilyProgressChart';
import ComplianceTrendChart from '@/components/compliance/ComplianceTrendChart';
import ExecutiveSummaryView from '@/components/compliance/ExecutiveSummaryView';

export default function ComplianceDashboard() {
  const { data: snapshots, isLoading, error } = useComplianceSnapshots();
  const latestSnapshot = getLatestSnapshot(snapshots ?? null);

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Compliance Dashboard</h1>
          <p className="text-muted-foreground">
            CMMC compliance posture and trends
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64 lg:col-span-2" />
        </div>
        <Skeleton className="h-96" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold">Compliance Dashboard</h1>
        <p className="text-muted-foreground">
          CMMC compliance posture and trends
        </p>
      </div>

      {/* DriftAlertBanner placeholder (wired in Task 2) */}

      {/* Top row: SPRS Score + Trend Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SprsScoreCard
          snapshot={
            latestSnapshot
              ? {
                  sprs_score: latestSnapshot.sprs_score,
                  met_count: latestSnapshot.met_count,
                  not_met_count: latestSnapshot.not_met_count,
                  total_controls: latestSnapshot.total_controls,
                  family_scores: latestSnapshot.family_scores,
                  cmmc_level: latestSnapshot.cmmc_level ?? 2,
                  not_applicable_count: latestSnapshot.not_applicable_count ?? 0,
                  critical_controls_met:
                    latestSnapshot.critical_controls_met ?? false,
                  poam_eligible: latestSnapshot.poam_eligible ?? false,
                }
              : null
          }
        />
        <div className="lg:col-span-2">
          <ComplianceTrendChart snapshots={snapshots} />
        </div>
      </div>

      {/* Middle row: Family Progress */}
      <FamilyProgressChart
        familyScores={latestSnapshot?.family_scores ?? null}
      />

      {/* Bottom section: Executive Summary */}
      <ExecutiveSummaryView />

      {/* ReassessmentScheduler placeholder (wired in Task 2) */}
    </div>
  );
}
