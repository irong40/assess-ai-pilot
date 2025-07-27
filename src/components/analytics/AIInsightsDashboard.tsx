import React, { useState, useEffect } from 'react';
import { Brain, TrendingUp, AlertTriangle, Lightbulb, Target, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AIRiskAnalysisService } from '@/services/AIRiskAnalysisService';
import { RiskInsight, MaturityTrend, RiskPrediction } from '@/types/analytics';
import { toast } from '@/hooks/use-toast';

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

export const AIInsightsDashboard: React.FC = () => {
  const [insights, setInsights] = useState<RiskInsight[]>([]);
  const [trends, setTrends] = useState<MaturityTrend[]>([]);
  const [predictions, setPredictions] = useState<RiskPrediction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoading(true);
        
        // Mock data for demonstration
        const mockCurrentData = { assessments: [] };
        const mockHistoricalData: any[] = [];

        const [generatedInsights, generatedTrends, generatedPredictions] = await Promise.all([
          AIRiskAnalysisService.generateInsights(mockCurrentData, mockHistoricalData),
          Promise.resolve(AIRiskAnalysisService.calculateMaturityTrend([], [])),
          AIRiskAnalysisService.generateRiskPredictions(mockCurrentData, mockHistoricalData)
        ]);

        setInsights(generatedInsights);
        setTrends(generatedTrends);
        setPredictions(generatedPredictions);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load AI analytics. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, []);

  const handleInsightAction = (insight: RiskInsight) => {
    toast({
      title: "Action Initiated",
      description: `Taking action on: ${insight.title}`,
    });
  };

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">AI Security Analytics</h1>
          <p className="text-muted-foreground">AI-powered insights and predictions for your security posture</p>
        </div>
        <Button variant="outline" size="sm">
          <Brain className="h-4 w-4 mr-2" />
          Generate New Analysis
        </Button>
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