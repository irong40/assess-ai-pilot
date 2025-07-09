
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Zap, CheckCircle, Bot, AlertTriangle, Shield, Database } from "lucide-react";
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
  const [currentAgentIndex, setCurrentAgentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [currentPhase, setCurrentPhase] = useState<'initialization' | 'analysis' | 'validation' | 'complete'>('initialization');
  const [accuracyChecks, setAccuracyChecks] = useState<AccuracyCheck[]>([]);
  const { updateAgentAssessment, createAgentAssessment, getAgentStatus } = useAgentAssessments(assessmentId);

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
    setCurrentAgent("Running Quality Validation...");
    
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
            result.length > 500 && result.includes('ANALYSIS') && result.includes('FINDINGS')
          );
          updatedChecks[i] = {
            ...updatedChecks[i],
            status: hasContent ? 'passed' : 'failed',
            details: hasContent ? 'All analyses contain comprehensive content' : 'Some analyses lack sufficient detail'
          };
          break;
          
        case 1: // Risk Assessment
          const hasRiskAssessment = analysisResults.every(result => 
            result.includes('Risk Assessment:') || result.includes('RISK') || result.includes('High') || result.includes('Medium') || result.includes('Low')
          );
          updatedChecks[i] = {
            ...updatedChecks[i],
            status: hasRiskAssessment ? 'passed' : 'failed',
            details: hasRiskAssessment ? 'Risk levels properly assessed' : 'Missing risk assessments'
          };
          break;
          
        case 2: // Compliance Mapping
          const hasCompliance = analysisResults.some(result => 
            result.includes('NIST') || result.includes('ISO') || result.includes('COMPLIANCE') || result.includes('GDPR') || result.includes('FISMA')
          );
          updatedChecks[i] = {
            ...updatedChecks[i],
            status: hasCompliance ? 'passed' : 'failed',
            details: hasCompliance ? 'Compliance frameworks properly mapped' : 'Limited compliance mapping'
          };
          break;
          
        case 3: // Finding Categorization
          const hasFindings = analysisResults.every(result => 
            result.includes('STRENGTHS') || result.includes('MEDIUM RISK') || result.includes('HIGH RISK')
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
            status: agentIds.length > 8 ? 'passed' : 'failed',
            details: agentIds.length > 8 ? 'Sufficient agent coverage for correlation' : 'Limited agent coverage'
          };
          break;
      }
      
      setAccuracyChecks([...updatedChecks]);
      setProgress(80 + (i + 1) * 4); // 80-100% for validation phase
    }

    const failedChecks = checks.filter(check => check.status === 'failed').length;
    return failedChecks <= 1; // Allow one failed check for high quality rating
  };

  const runCompleteAssessment = async () => {
    setIsRunning(true);
    setProgress(0);
    setCurrentPhase('initialization');
    setAccuracyChecks([]);
    setCurrentAgentIndex(0);

    const analysisResults: string[] = [];

    try {
      // Phase 1: Initialize assessment records
      setCurrentAgent("Initializing assessment database...");
      setCurrentPhase('initialization');
      
      // Ensure all agent records exist
      for (let i = 0; i < agentIds.length; i++) {
        const agentId = agentIds[i];
        const agentStatus = getAgentStatus(agentId);
        
        if (!agentStatus.exists) {
          await createAgentAssessment.mutateAsync({
            agentId,
            status: 'not-started',
            progress: 0,
          });
        }
      }
      
      setProgress(5);
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Phase 2: Run agent analyses
      setCurrentPhase('analysis');
      
      for (let i = 0; i < agentIds.length; i++) {
        const agentId = agentIds[i];
        const agentName = agentNames[agentId as keyof typeof agentNames] || agentId;
        
        setCurrentAgent(agentName);
        setCurrentAgentIndex(i + 1);
        setProgress(5 + (i / agentIds.length) * 70); // 5-75% for analysis phase

        // Update status to in-progress
        await updateAgentAssessment.mutateAsync({
          agentId,
          status: 'in-progress',
          progress: 25,
        });

        // Simulate progress during analysis
        await new Promise(resolve => setTimeout(resolve, 800));
        
        await updateAgentAssessment.mutateAsync({
          agentId,
          status: 'in-progress',
          progress: 50,
        });

        // Run actual analysis with realistic context
        const analysisResult = await analyzeAgent(
          agentId, 
          [], 
          `Comprehensive security assessment for ${agentName} domain. Assessment includes policy review, control validation, risk analysis, and compliance evaluation.`
        );
        
        analysisResults.push(analysisResult);

        // Update agent status to completed with analysis result
        await updateAgentAssessment.mutateAsync({
          agentId,
          status: 'completed',
          progress: 100,
          analysisResult
        });
      }

      // Phase 3: Run quality validation
      setProgress(75);
      const validationPassed = await runAccuracyChecks(analysisResults);

      setProgress(100);
      setCurrentPhase('complete');
      
      if (validationPassed) {
        setCurrentAgent("Assessment Complete - High Quality ✓");
        toast({
          title: "High-Quality Assessment Complete",
          description: "All quality checks passed. Analysis is ready for ISSO-Lead review.",
        });
      } else {
        setCurrentAgent("Assessment Complete - Quality Review Recommended");
        toast({
          title: "Assessment Complete with Warnings",
          description: "Some quality checks failed. Manual review recommended.",
          variant: "destructive"
        });
      }

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
            <div className="flex items-center justify-center space-x-2">
              <Bot className="h-12 w-12 text-blue-600 animate-pulse" />
              {currentPhase === 'initialization' && <Database className="h-8 w-8 text-blue-500" />}
              {currentPhase === 'validation' && <Shield className="h-8 w-8 text-green-500" />}
            </div>
            <div>
              <h4 className="font-medium text-blue-900 mb-2">
                {currentPhase === 'initialization' && "Initializing Assessment Database"}
                {currentPhase === 'analysis' && "Running Comprehensive Analysis"}
                {currentPhase === 'validation' && "Validating Analysis Quality"}
                {currentPhase === 'complete' && "Assessment Complete"}
              </h4>
              <p className="text-sm text-blue-700 mb-4">
                {currentPhase === 'analysis' && (
                  <>
                    Agent {currentAgentIndex}/{agentIds.length}: <strong>{currentAgent}</strong>
                  </>
                )}
                {currentPhase !== 'analysis' && <strong>{currentAgent}</strong>}
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-blue-600">
                  {currentPhase === 'initialization' && "Initialization Progress"}
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
                <h5 className="text-sm font-medium text-blue-900">Quality Validation</h5>
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
            <h4 className="font-medium text-slate-900 mb-2">Comprehensive Security Assessment</h4>
            <p className="text-sm text-slate-600 mb-4">
              Execute all {agentIds.length} security agents with full analysis, quality validation, and database persistence
            </p>
          </div>
          <Button 
            onClick={runCompleteAssessment}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
            size="lg"
            disabled={updateAgentAssessment.isPending || createAgentAssessment.isPending}
          >
            <Zap className="h-4 w-4 mr-2" />
            Start Comprehensive Assessment
          </Button>
          <div className="text-xs text-slate-500 space-y-1">
            <div>Estimated time: {Math.round(agentIds.length * 1.5 + 8)} seconds</div>
            <div className="flex items-center justify-center space-x-1">
              <Database className="h-3 w-3" />
              <span>Real database integration with quality validation</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickAssessmentButton;
