
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Zap, CheckCircle, Bot } from "lucide-react";
import { useAgentAssessments } from "@/hooks/useAgentAssessments";
import { toast } from "@/hooks/use-toast";

interface QuickAssessmentButtonProps {
  assessmentId: string;
  agentIds: string[];
  onComplete: () => void;
}

const QuickAssessmentButton = ({ assessmentId, agentIds, onComplete }: QuickAssessmentButtonProps) => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentAgent, setCurrentAgent] = useState("");
  const [progress, setProgress] = useState(0);
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

  const runCompleteAssessment = async () => {
    setIsRunning(true);
    setProgress(0);

    for (let i = 0; i < agentIds.length; i++) {
      const agentId = agentIds[i];
      const agentName = agentNames[agentId as keyof typeof agentNames] || agentId;
      
      setCurrentAgent(agentName);
      setProgress((i / agentIds.length) * 100);

      // Simulate agent analysis time
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Update agent status to completed
      await updateAgentAssessment.mutateAsync({
        agentId,
        status: 'completed',
        progress: 100,
        analysisResult: `Automated analysis completed for ${agentName}`
      });
    }

    setProgress(100);
    setCurrentAgent("Assessment Complete!");
    
    toast({
      title: "Assessment Complete",
      description: "All agents have completed their analysis. Ready for ISSO-Lead summary.",
    });

    setTimeout(() => {
      setIsRunning(false);
      onComplete();
    }, 1000);
  };

  if (isRunning) {
    return (
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <Bot className="h-12 w-12 text-blue-600 mx-auto animate-pulse" />
            <div>
              <h4 className="font-medium text-blue-900 mb-2">Running Complete Assessment</h4>
              <p className="text-sm text-blue-700 mb-4">
                Currently analyzing: <strong>{currentAgent}</strong>
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-blue-600">Progress</span>
                <span className="font-medium">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
      <CardContent className="pt-6">
        <div className="text-center space-y-4">
          <Zap className="h-12 w-12 text-green-600 mx-auto" />
          <div>
            <h4 className="font-medium text-slate-900 mb-2">Quick Assessment</h4>
            <p className="text-sm text-slate-600 mb-4">
              Run all {agentIds.length} agents automatically and generate complete assessment
            </p>
          </div>
          <Button 
            onClick={runCompleteAssessment}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
            size="lg"
          >
            <Zap className="h-4 w-4 mr-2" />
            Run Complete Assessment
          </Button>
          <div className="text-xs text-slate-500">
            Estimated time: {Math.round(agentIds.length * 1.5)} seconds
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickAssessmentButton;
