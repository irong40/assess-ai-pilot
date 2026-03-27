/**
 * Compliance Trend Chart component.
 *
 * Renders a Recharts AreaChart showing SPRS score over time
 * from compliance_snapshots data.
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { format } from 'date-fns';
import type { SnapshotRow } from '@/hooks/useComplianceSnapshots';

interface ComplianceTrendChartProps {
  snapshots: SnapshotRow[] | null | undefined;
}

interface TrendDataPoint {
  date: string;
  sprsScore: number;
  metCount: number;
}

function transformToChartData(
  snapshots: SnapshotRow[] | null | undefined
): TrendDataPoint[] {
  if (!snapshots || snapshots.length === 0) return [];
  return snapshots.map((s) => ({
    date: format(new Date(s.created_at), 'MMM d'),
    sprsScore: s.sprs_score,
    metCount: s.met_count,
  }));
}

export default function ComplianceTrendChart({
  snapshots,
}: ComplianceTrendChartProps) {
  const data = transformToChartData(snapshots);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Compliance Trend</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Not enough data to display a trend. Run at least 2 assessments.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[-203, 110]} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="sprsScore"
                stroke="#3b82f6"
                fill="#93c5fd"
                fillOpacity={0.3}
                name="SPRS Score"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
