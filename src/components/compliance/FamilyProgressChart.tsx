/**
 * Family Progress Chart component.
 *
 * Displays 14 horizontal progress bars (one per NIST 800-171 control family)
 * with family name, percentage score, and color-coded progress indicator.
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { familyScoresToChartData } from '@/lib/compliance-utils';

interface FamilyProgressChartProps {
  familyScores: Record<string, number> | null | undefined;
}

/**
 * Returns a Tailwind color class for the progress bar based on score.
 * green >= 80%, yellow 50-79%, red < 50%
 */
function getBarColorClass(score: number): string {
  if (score >= 80) return '[&>div]:bg-green-500';
  if (score >= 50) return '[&>div]:bg-yellow-500';
  return '[&>div]:bg-red-500';
}

export default function FamilyProgressChart({
  familyScores,
}: FamilyProgressChartProps) {
  const chartData = familyScoresToChartData(familyScores ?? {});

  return (
    <Card>
      <CardHeader>
        <CardTitle>Control Family Progress</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {chartData.map((item) => (
          <div key={item.familyId} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{item.family}</span>
              <span className="text-muted-foreground">{item.score}%</span>
            </div>
            <Progress
              value={item.score}
              className={`h-2 ${getBarColorClass(item.score)}`}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
