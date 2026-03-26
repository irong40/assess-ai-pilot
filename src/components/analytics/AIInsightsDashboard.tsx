import React, { useState, useCallback } from 'react';
import { Brain, TrendingUp, AlertTriangle, Lightbulb, Target, Activity, RefreshCw, PlayCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { dispatchCisoAssessment, getAgentTaskStatus } from '@/services/agentService';
import { useAgentTasks } from '@/hooks/useAgentTasks';
import type { GapAnalysisReport, GapAnalysisFinding } from '@/types/grc-output';
import { RiskInsight, MaturityTrend, RiskPrediction } from '@/types/analytics';
import { toast } from '@/hooks/use-toast';

// ---------- Transform helpers (agent output -> dashboard display types) ----------

/**
 * Transforms GRC agent gap analysis findings into RiskInsight[] format
 * for backward compatibility with existing dashboard UI components.
 */
function findingsToInsights(findings: GapAnalysisFinding[]): RiskInsight[] {
  const notMetFindings = findings.filter((f) => f.status === 'NOT_MET');
  return notMetFindings.slice(0, 8).map((finding, idx) => {
    const severity = deriveSeverity(finding);
    const type = deriveInsightType(finding);
    return {
      id: `grc-${finding.control_id}`,
      type,
      severity,
      title: `${finding.control_id}: ${finding.control_title}`,
      description: finding.evidence_gaps.length > 0
        ? `Evidence gaps: ${finding.evidence_gaps.map((g) => g.description).join('; ')}`
        : `Control ${finding.control_id} is not met. ${finding.failed_objectives.length} objective(s) failed.`,
      confidence: 90 - idx, // GRC agent findings have high confidence
      impact: `${finding.failed_objectives.length} failed objective(s) in ${finding.family_name}`,
      recommendation: finding.remediation_options.length > 0
        ? finding.remediation_options[0].description
        : 'Review control implementation and gather required evidence.',
      affectedControls: [finding.control_id],
      metadata: {
        family_id: finding.family_id,
        family_name: finding.family_name,
        failed_objectives: finding.failed_objectives,
        remediation_count: finding.remediation_options.length,
      },
    };
  });
}

/**
 * Derives risk severity from a finding based on SPRS weight heuristics.
 * Access Control (AC) and System/Communications (SC) families are higher risk.
 */
function deriveSeverity(finding: GapAnalysisFinding): RiskInsight['severity'] {
  const highWeightFamilies = ['AC', 'SC', 'IA', 'AU'];
  const familyPrefix = finding.family_id.split('.')[0] || finding.family_id;
  if (highWeightFamilies.includes(familyPrefix)) {
    return finding.failed_objectives.length > 2 ? 'critical' : 'high';
  }
  return finding.failed_objectives.length > 1 ? 'medium' : 'low';
}

/**
 * Derives insight type based on finding characteristics.
 */
function deriveInsightType(finding: GapAnalysisFinding): RiskInsight['type'] {
  if (finding.evidence_gaps.length > 0) return 'anomaly';
  if (finding.remediation_options.length > 0) return 'recommendation';
  return 'trend';
}

/**
 * Derives maturity trends from a gap analysis report by grouping
 * findings per control family.
 */
function reportToTrends(report: GapAnalysisReport): MaturityTrend[] {
  // Group findings by family
  const familyMap = new Map<string, { met: number; total: number }>();
  for (const finding of report.findings) {
    const key = finding.family_name;
    const entry = familyMap.get(key) || { met: 0, total: 0 };
    entry.total++;
    if (finding.status === 'MET') entry.met++;
    familyMap.set(key, entry);
  }

  return Array.from(familyMap.entries()).map(([domain, counts]) => {
    const current = counts.total > 0 ? (counts.met / counts.total) * 5 : 0;
    return {
      domain,
      current,
      previous: current, // No historical comparison yet -- single-report view
      trend: 'stable' as const,
      velocity: 0,
    };
  });
}

/**
 * Derives risk predictions from NOT_MET findings.
 * Controls with more failed objectives and evidence gaps are higher risk.
 */
function findingsToPredictions(findings: GapAnalysisFinding[]): RiskPrediction[] {
  // Group NOT_MET findings by family
  const familyMap = new Map<string, GapAnalysisFinding[]>();
  for (const f of findings) {
    if (f.status !== 'NOT_MET') continue;
    const key = f.family_name;
    const arr = familyMap.get(key) || [];
    arr.push(f);
    familyMap.set(key, arr);
  }

  return Array.from(familyMap.entries())
    .slice(0, 8)
    .map(([domain, domainFindings]) => {
      const avgFailedObjectives =
        domainFindings.reduce((sum, f) => sum + f.failed_objectives.length, 0) /
        domainFindings.length;

      const currentRisk: RiskPrediction['currentRisk'] =
        avgFailedObjectives > 2 ? 'critical' :
        avgFailedObjectives > 1 ? 'high' :
        domainFindings.length > 2 ? 'medium' : 'low';

      // Without remediation, risk stays same or escalates
      const predictedRisk = currentRisk;

      return {
        domain,
        currentRisk,
        predictedRisk,
        timeframe: '30 days',
        confidence: Math.min(95, 70 + domainFindings.length * 5),
        factors: domainFindings
          .slice(0, 3)
          .map((f) => `${f.control_id}: ${f.control_title}`),
      };
    });
}

// ---------- Sub-components (unchanged from original) ----------

interface InsightCardProps {
  insight: RiskInsight;
  onAction?: (insight: RiskInsight) => void;
}

const InsightCard: React.FC<InsightCardProps> = ({ insight, onAction }) => {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'trend': return <TrendingUp className="h-4 w-4" />;
      case 'anomaly': return <AlertTriangle className="h-4 w-4" />;
      case 'prediction': return <Target className="h-4 w-4" />;
      case 'recommendation': return <Lightbulb className="h-4 w-4" />;
      default: return <Brain className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800';
      case 'low': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card className="h-full">
      <CardContent className="space-y-4 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              {getTypeIcon(insight.type)}
            </div>
            <div>
              <Badge variant="outline" className={getSeverityColor(insight.severity)}>
                {insight.severity.toUpperCase()}
              </Badge>
            </div>
          </div>
          <Badge variant="secondary" className="text-xs">
            {insight.confidence}% confidence
          </Badge>
        </div>

        <div>
          <h3 className="font-semibold text-sm mb-2">{insight.title}</h3>
          <p className="text-xs text-muted-foreground mb-3 line-clamp-3">
            {insight.description}
          </p>
        </div>

        <div className="space-y-2">
          <div className="text-xs">
            <span className="font-medium">Impact:</span>
            <p className="text-muted-foreground mt-1">{insight.impact}</p>
          </div>

          <div className="text-xs">
            <span className="font-medium">Recommendation:</span>
            <p className="text-muted-foreground mt-1">{insight.recommendation}</p>
          </div>

          {insight.affectedControls.length > 0 && (
            <div className="text-xs">
              <span className="font-medium">Affected Controls:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {insight.affectedControls.slice(0, 3).map((control, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {control}
                  </Badge>
                ))}
                {insight.affectedControls.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{insight.affectedControls.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>

        {onAction && (
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs"
            onClick={() => onAction(insight)}
          >
            Take Action
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

interface TrendCardProps {
  trend: MaturityTrend;
}

const TrendCard: React.FC<TrendCardProps> = ({ trend }) => {
  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving': return 'text-green-600 dark:text-green-400';
      case 'declining': return 'text-red-600 dark:text-red-400';
      default: return 'text-muted-foreground';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return '📈';
      case 'declining': return '📉';
      default: return '➡️';
    }
  };

  return (
    <Card>
      <CardContent className="space-y-3 p-6">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-sm">{trend.domain}</h3>
          <span className="text-lg">{getTrendIcon(trend.trend)}</span>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span>Current Score</span>
            <span className="font-medium">{trend.current.toFixed(1)}/5.0</span>
          </div>
          <Progress value={(trend.current / 5) * 100} className="h-2" />
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className={getTrendColor(trend.trend)}>
            {trend.trend.charAt(0).toUpperCase() + trend.trend.slice(1)}
          </span>
          <span className="text-muted-foreground">
            Velocity: {trend.velocity.toFixed(2)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

interface PredictionCardProps {
  prediction: RiskPrediction;
}

const PredictionCard: React.FC<PredictionCardProps> = ({ prediction }) => {
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'critical': return 'text-red-600 dark:text-red-400';
      case 'high': return 'text-orange-600 dark:text-orange-400';
      case 'medium': return 'text-yellow-600 dark:text-yellow-400';
      case 'low': return 'text-green-600 dark:text-green-400';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <Card>
      <CardContent className="space-y-3 p-6">
        <h3 className="font-medium text-sm">{prediction.domain}</h3>

        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span>Current Risk</span>
            <span className={`font-medium ${getRiskColor(prediction.currentRisk)}`}>
              {prediction.currentRisk.toUpperCase()}
            </span>
          </div>

          <div className="flex justify-between text-xs">
            <span>Predicted Risk ({prediction.timeframe})</span>
            <span className={`font-medium ${getRiskColor(prediction.predictedRisk)}`}>
              {prediction.predictedRisk.toUpperCase()}
            </span>
          </div>
        </div>

        <div className="text-xs">
          <div className="flex justify-between mb-1">
            <span>Confidence</span>
            <span>{prediction.confidence}%</span>
          </div>
          <Progress value={prediction.confidence} className="h-1" />
        </div>

        {prediction.factors.length > 0 && (
          <div className="text-xs">
            <span className="font-medium">Key Factors:</span>
            <ul className="mt-1 space-y-1">
              {prediction.factors.slice(0, 2).map((factor, index) => (
                <li key={index} className="text-muted-foreground">• {factor}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ---------- Main Dashboard Component ----------

export const AIInsightsDashboard: React.FC = () => {
  const [dispatching, setDispatching] = useState(false);

  // Query completed GRC agent tasks for analysis results
  const {
    data: completedTasks,
    isLoading: tasksLoading,
    refetch: refetchTasks,
  } = useAgentTasks({ agentType: 'grc-analyst', status: 'completed' });

  // Query running GRC tasks for progress indicator
  const { data: runningTasks } = useAgentTasks({
    agentType: 'grc-analyst',
    status: 'running',
  });

  // Derive display data from the latest completed GRC task output
  const latestTask = completedTasks?.[0]; // Sorted by created_at desc
  const latestReport = latestTask?.output as unknown as GapAnalysisReport | null;

  const insights: RiskInsight[] = latestReport?.findings
    ? findingsToInsights(latestReport.findings)
    : [];

  const trends: MaturityTrend[] = latestReport
    ? reportToTrends(latestReport)
    : [];

  const predictions: RiskPrediction[] = latestReport?.findings
    ? findingsToPredictions(latestReport.findings)
    : [];

  const hasResults = insights.length > 0;
  const hasRunningTask = (runningTasks?.length ?? 0) > 0;
  const loading = tasksLoading;

  // Check for failed tasks
  const { data: failedTasks } = useAgentTasks({
    agentType: 'grc-analyst',
    status: 'failed',
  });
  const latestFailedTask = failedTasks?.[0];
  const hasRecentError =
    latestFailedTask &&
    (!latestTask ||
      new Date(latestFailedTask.created_at) > new Date(latestTask.created_at));

  const handleRunAssessment = useCallback(async () => {
    setDispatching(true);
    try {
      const result = await dispatchCisoAssessment('current', 2);
      if ('error' in result) {
        toast({
          title: 'Assessment Failed',
          description: result.error,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Assessment Dispatched',
          description: 'CISO agent is coordinating a compliance assessment. Results will appear here when complete.',
        });
        // Refetch after a short delay to pick up the running task
        setTimeout(() => refetchTasks(), 2000);
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to dispatch assessment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setDispatching(false);
    }
  }, [refetchTasks]);

  const handleInsightAction = (insight: RiskInsight) => {
    toast({
      title: "Action Initiated",
      description: `Taking action on: ${insight.title}`,
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-2">
            <Activity className="h-5 w-5 animate-spin" />
            <span>Loading AI Analytics...</span>
          </div>
        </div>
      </div>
    );
  }

  // Running task state -- agent is actively analyzing
  if (hasRunningTask && !hasResults) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">AI Security Analytics</h1>
            <p className="text-muted-foreground">AI-powered insights and predictions for your security posture</p>
          </div>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Activity className="h-8 w-8 animate-spin text-primary mb-4" />
            <h3 className="font-semibold text-lg mb-2">GRC Agent Analysis in Progress</h3>
            <p className="text-muted-foreground text-sm text-center max-w-md">
              The GRC Analyst agent is evaluating your compliance posture against NIST 800-171 controls.
              Results will appear automatically when the analysis is complete.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => refetchTasks()}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Check Status
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state -- latest task failed
  if (hasRecentError && !hasResults) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">AI Security Analytics</h1>
            <p className="text-muted-foreground">AI-powered insights and predictions for your security posture</p>
          </div>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="h-8 w-8 text-destructive mb-4" />
            <h3 className="font-semibold text-lg mb-2">Analysis Failed</h3>
            <p className="text-muted-foreground text-sm text-center max-w-md mb-2">
              {latestFailedTask?.error || 'The GRC agent encountered an error during analysis.'}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRunAssessment}
              disabled={dispatching}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry Assessment
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Empty state -- no agent results yet
  if (!hasResults) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">AI Security Analytics</h1>
            <p className="text-muted-foreground">AI-powered insights and predictions for your security posture</p>
          </div>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Brain className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">No Analysis Results Yet</h3>
            <p className="text-muted-foreground text-sm text-center max-w-md mb-6">
              Run a compliance assessment to see AI-powered security insights, maturity trends,
              and risk predictions based on your NIST 800-171 control posture.
            </p>
            <Button
              onClick={handleRunAssessment}
              disabled={dispatching}
            >
              <PlayCircle className="h-4 w-4 mr-2" />
              {dispatching ? 'Dispatching...' : 'Run Assessment'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Results state -- show agent-driven analysis
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">AI Security Analytics</h1>
          <p className="text-muted-foreground">AI-powered insights and predictions for your security posture</p>
        </div>
        <div className="flex items-center gap-2">
          {latestReport && (
            <Badge variant="secondary" className="text-xs">
              SPRS: {latestReport.sprs_score} | {latestReport.met_count}/{latestReport.total_controls} controls met
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRunAssessment}
            disabled={dispatching || hasRunningTask}
          >
            <Brain className="h-4 w-4 mr-2" />
            {dispatching ? 'Dispatching...' : hasRunningTask ? 'Analysis Running...' : 'Run New Analysis'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="insights" className="space-y-4">
        <TabsList>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
          <TabsTrigger value="trends">Maturity Trends</TabsTrigger>
          <TabsTrigger value="predictions">Risk Predictions</TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {insights.map((insight) => (
              <InsightCard
                key={insight.id}
                insight={insight}
                onAction={handleInsightAction}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {trends.map((trend, index) => (
              <TrendCard key={index} trend={trend} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {predictions.map((prediction, index) => (
              <PredictionCard key={index} prediction={prediction} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
