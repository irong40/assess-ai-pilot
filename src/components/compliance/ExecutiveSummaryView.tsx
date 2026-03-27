/**
 * Executive Summary View component.
 *
 * Renders the latest CISO-generated executive summary formatted for
 * board presentation. Includes posture, findings, risk areas,
 * recommendations, and a print button.
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useLatestExecutiveSummary } from '@/hooks/useComplianceSnapshots';
import type { ExecutiveSummary } from '@/lib/ciso-schemas';

function getUrgencyVariant(
  urgency: string
): 'destructive' | 'default' | 'secondary' | 'outline' {
  switch (urgency) {
    case 'immediate':
      return 'destructive';
    case 'short_term':
      return 'default';
    default:
      return 'secondary';
  }
}

function getRiskVariant(
  level: string
): 'destructive' | 'default' | 'secondary' | 'outline' {
  switch (level) {
    case 'critical':
    case 'high':
      return 'destructive';
    case 'medium':
      return 'default';
    default:
      return 'secondary';
  }
}

function getEffortVariant(
  effort: string
): 'destructive' | 'default' | 'secondary' | 'outline' {
  switch (effort) {
    case 'high':
      return 'destructive';
    case 'medium':
      return 'default';
    default:
      return 'secondary';
  }
}

function getTrendArrow(trend: string): string {
  switch (trend) {
    case 'improving':
      return '\u2191';
    case 'declining':
      return '\u2193';
    default:
      return '\u2192';
  }
}

export default function ExecutiveSummaryView() {
  const { data: summary, isLoading, error } = useLatestExecutiveSummary();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Executive Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!summary) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Executive Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            No executive summary generated yet. Run a CISO assessment first.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="print:shadow-none">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Executive Summary</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.print()}
          className="print:hidden"
        >
          Print
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Posture overview */}
        <div className="flex items-center gap-4">
          <Badge variant={getRiskVariant(summary.overall_posture)}>
            {summary.overall_posture}
          </Badge>
          <span className="text-2xl font-bold">SPRS: {summary.sprs_score}</span>
          <span className="text-lg" title={`Trend: ${summary.sprs_trend}`}>
            {getTrendArrow(summary.sprs_trend)} {summary.sprs_trend}
          </span>
        </div>

        {/* Critical findings */}
        {summary.critical_findings.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2">Critical Findings</h4>
            <ul className="space-y-2">
              {summary.critical_findings.map((finding) => (
                <li
                  key={finding.control_id}
                  className="flex items-start gap-2 text-sm"
                >
                  <Badge
                    variant={getUrgencyVariant(finding.urgency)}
                    className="mt-0.5 shrink-0"
                  >
                    {finding.urgency.replace('_', ' ')}
                  </Badge>
                  <div>
                    <span className="font-medium">
                      {finding.control_id}: {finding.title}
                    </span>
                    <p className="text-muted-foreground">{finding.impact}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Risk areas */}
        {summary.risk_areas.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2">Risk Areas</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-1">Domain</th>
                    <th className="text-left py-1">Risk Level</th>
                    <th className="text-right py-1">Findings</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.risk_areas.map((area) => (
                    <tr key={area.domain} className="border-b">
                      <td className="py-1">{area.domain}</td>
                      <td className="py-1">
                        <Badge variant={getRiskVariant(area.risk_level)}>
                          {area.risk_level}
                        </Badge>
                      </td>
                      <td className="text-right py-1">{area.finding_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Recommendations (top 3) */}
        {summary.recommendations.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2">Recommendations</h4>
            <ol className="space-y-2 list-decimal list-inside">
              {summary.recommendations.slice(0, 3).map((rec) => (
                <li key={rec.priority} className="text-sm">
                  <span>{rec.description}</span>
                  <Badge
                    variant={getEffortVariant(rec.estimated_effort)}
                    className="ml-2"
                  >
                    {rec.estimated_effort} effort
                  </Badge>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Next steps */}
        {summary.next_steps.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2">Next Steps</h4>
            <ul className="list-disc list-inside text-sm space-y-1">
              {summary.next_steps.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
