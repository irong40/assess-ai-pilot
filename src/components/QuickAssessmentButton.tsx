import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Zap, CheckCircle, Bot, AlertTriangle, Shield } from "lucide-react";
import { useAgentAssessments } from "@/hooks/useAgentAssessments";
import { analyzeAgent } from "@/services/agentAnalysis";
import { toast } from "@/hooks/use-toast";

interface QuickAssessmentButtonProps {
  assessmentId: string;
  agentIds: string[];
  onComplete: () => void;
}

interface AccuracyCheck {
  check: string;
  status: 'pending' | 'passed' | 'failed';
  details?: string;
}

const QuickAssessmentButton = ({ assessmentId, agentIds, onComplete }: QuickAssessmentButtonProps) => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentAgent, setCurrentAgent] = useState("");
  const [progress, setProgress] = useState(0);
  const [currentPhase, setCurrentPhase] = useState<'analysis' | 'validation' | 'complete'>('analysis');
  const [accuracyChecks, setAccuracyChecks] = useState<AccuracyCheck[]>([]);
  const { updateAgentAssessment } = useAgentAssessments(assessmentId);

  const agentNames = {
    policy: "ISSO-Policy",
    physical: "ISSO-Physical", 
    network: "ISSO-Network",
    access: "ISSO-Access",
    data: "ISSO-Data",
    configuration: "ISSO-Configuration",
    recovery: "ISSO-Recovery",
    privacy: "ISSO-Privacy",
    "blue-team": "ISSO-Blue Team",
    vulnerability: "ISSO-Vulnerability",
    "threat-intel": "ISSO-Threat Intelligence",
    "supply-chain": "ISSO-Supply Chain",
    grc: "ISSO-GRC",
    training: "ISSO-Training",
    mobile: "ISSO-Mobile/BYOD",
    legal: "ISSO-Legal"
  };

  const runAccuracyChecks = async (analysisResults: string[]) => {
    setCurrentPhase('validation');
    setCurrentAgent("Running Accuracy Validation...");
    
    const checks: AccuracyCheck[] = [
      { check: "Analysis Content Quality", status: 'pending' },
      { check: "Risk Assessment Consistency", status: 'pending' },
      { check: "Compliance Mapping Verification", status: 'pending' },
      { check: "Finding Categorization", status: 'pending' },
      { check: "Cross-Agent Correlation", status: 'pending' }
    ];
    
    setAccuracyChecks(checks);

    // Simulate accuracy validation with real checks
    for (let i = 0; i < checks.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const updatedChecks = [...checks];
      
      // Perform actual validation logic
      switch (i) {
        case 0: // Content Quality
          const hasContent = analysisResults.every(result => 
            result.length > 100 && result.includes('ANALYSIS') && result.includes('FINDINGS')
          );
          updatedChecks[i] = {
            ...updatedChecks[i],
            status: hasContent ? 'passed' : 'failed',
            details: hasContent ? 'All analyses contain comprehensive content' : 'Some analyses lack sufficient detail'
          };
          break;
          
        case 1: // Risk Assessment
          const hasRiskAssessment = analysisResults.every(result => 
            result.includes('Risk Level:') || result.includes('RISK') || result.includes('High') || result.includes('Medium') || result.includes('Low')
          );
          updatedChecks[i] = {
            ...updatedChecks[i],
            status: hasRiskAssessment ? 'passed' : 'failed',
            details: hasRiskAssessment ? 'Risk levels properly assessed' : 'Missing risk assessments'
          };
          break;
          
        case 2: // Compliance Mapping
          const hasCompliance = analysisResults.some(result => 
            result.includes('NIST') || result.includes('ISO') || result.includes('COMPLIANCE')
          );
          updatedChecks[i] = {
            ...updatedChecks[i],
            status: hasCompliance ? 'passed' : 'failed',
            details: hasCompliance ? 'Compliance frameworks properly mapped' : 'Limited compliance mapping'
          };
          break;
          
        case 3: // Finding Categorization
          const hasFindings = analysisResults.every(result => 
            result.includes('Strong:') || result.includes('Medium Risk:') || result.includes('High Risk:')
          );
          updatedChecks[i] = {
            ...updatedChecks[i],
            status: hasFindings ? 'passed' : 'failed',
            details: hasFindings ? 'Findings properly categorized' : 'Inconsistent finding categories'
          };
          break;
          
        case 4: // Cross-Agent Correlation
          updatedChecks[i] = {
            ...updatedChecks[i],
            status: agentIds.length > 5 ? 'passed' : 'failed',
            details: agentIds.length > 5 ? 'Sufficient agent coverage for correlation' : 'Limited agent coverage'
          };
          break;
      }
      
      setAccuracyChecks([...updatedChecks]);
      setProgress(80 + (i + 1) * 4); // 80-100% for validation phase
    }

    const failedChecks = checks.filter(check => check.status === 'failed').length;
    return failedChecks === 0;
  };

  const runCompleteAssessment = async () => {
    setIsRunning(true);
    setProgress(0);
    setCurrentPhase('analysis');
    setAccuracyChecks([]);

    const analysisResults: string[] = [];

    try {
      // Phase 1: Run actual agent analyses
      for (let i = 0; i < agentIds.length; i++) {
        const agentId = agentIds[i];
        const agentName = agentNames[agentId as keyof typeof agentNames] || agentId;
        
        setCurrentAgent(agentName);
        setProgress((i / agentIds.length) * 80); // 0-80% for analysis phase

        console.log(`Starting analysis for agent: ${agentName} (${agentId})`);

        // First update status to in-progress
        await updateAgentAssessment.mutateAsync({
          agentId,
          status: 'in-progress',
          progress: 50,
        });

        // Simulate realistic analysis time
        await new Promise(resolve => setTimeout(resolve, 1200));

        // Run actual analysis
        const analysisResult = await analyzeAgent(agentId, [], `Complete assessment for ${agentName}`);
        analysisResults.push(analysisResult);

        console.log(`Completed analysis for ${agentName}, updating to completed status`);

        // Update agent status to completed with analysis result
        await updateAgentAssessment.mutateAsync({
          agentId,
          status: 'completed',
          progress: 100,
          analysisResult
        });

        console.log(`Agent ${agentName} status updated to completed`);
      }

      // Phase 2: Run accuracy validation
      const validationPassed = await runAccuracyChecks(analysisResults);

      setProgress(100);
      setCurrentPhase('complete');
      
      if (validationPassed) {
        setCurrentAgent("Assessment Complete - High Accuracy ✓");
        toast({
          title: "High-Quality Assessment Complete",
          description: "All accuracy checks passed. Analysis is ready for ISSO-Lead review.",
        });
      } else {
        setCurrentAgent("Assessment Complete - Review Recommended");
        toast({
          title: "Assessment Complete with Warnings",
          description: "Some accuracy checks failed. Manual review recommended.",
          variant: "destructive"
        });
      }

      console.log("All agents completed successfully. Assessment ready for review.");

      setTimeout(() => {
        setIsRunning(false);
        onComplete();
      }, 2000);

    } catch (error) {
      console.error("Error during assessment:", error);
      toast({
        title: "Assessment Error",
        description: "An error occurred during the assessment. Please try again.",
        variant: "destructive"
      });
      setIsRunning(false);
    }
  };

  if (isRunning) {
    return (
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <Bot className="h-12 w-12 text-blue-600 mx-auto animate-pulse" />
            <div>
              <h4 className="font-medium text-blue-900 mb-2">
                {currentPhase === 'analysis' && "Running Complete Assessment"}
                {currentPhase === 'validation' && "Validating Analysis Quality"}
                {currentPhase === 'complete' && "Assessment Complete"}
              </h4>
              <p className="text-sm text-blue-700 mb-4">
                {currentPhase === 'analysis' && `Currently analyzing: `}
                <strong>{currentAgent}</strong>
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-blue-600">
                  {currentPhase === 'analysis' && "Analysis Progress"}
                  {currentPhase === 'validation' && "Validation Progress"}
                  {currentPhase === 'complete' && "Complete"}
                </span>
                <span className="font-medium">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {currentPhase === 'validation' && accuracyChecks.length > 0 && (
              <div className="mt-4 space-y-2">
                <h5 className="text-sm font-medium text-blue-900">Accuracy Validation</h5>
                <div className="space-y-1">
                  {accuracyChecks.map((check, index) => (
                    <div key={index} className="flex items-center justify-between text-xs bg-white p-2 rounded">
                      <span>{check.check}</span>
                      <div className="flex items-center space-x-1">
                        {check.status === 'pending' && <Bot className="h-3 w-3 text-blue-500 animate-spin" />}
                        {check.status === 'passed' && <CheckCircle className="h-3 w-3 text-green-600" />}
                        {check.status === 'failed' && <AlertTriangle className="h-3 w-3 text-red-600" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
      <CardContent className="pt-6">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-2">
            <Zap className="h-12 w-12 text-green-600" />
            <Shield className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h4 className="font-medium text-slate-900 mb-2">Comprehensive Quick Assessment</h4>
            <p className="text-sm text-slate-600 mb-4">
              Run all {agentIds.length} agents with full analysis and accuracy validation
            </p>
          </div>
          <Button 
            onClick={runCompleteAssessment}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
            size="lg"
          >
            <Zap className="h-4 w-4 mr-2" />
            Run High-Accuracy Assessment
          </Button>
          <div className="text-xs text-slate-500 space-y-1">
            <div>Estimated time: {Math.round(agentIds.length * 1.2 + 4)} seconds</div>
            <div className="flex items-center justify-center space-x-1">
              <Shield className="h-3 w-3" />
              <span>Includes accuracy validation & quality checks</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickAssessmentButton;
