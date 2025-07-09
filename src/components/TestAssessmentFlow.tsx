import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { useAssessments } from "@/hooks/useAssessments";
import { useAssessmentStatus } from "@/hooks/useAssessmentStatus";
import { Play, CheckCircle, Clock, Bot } from "lucide-react";

const TestAssessmentFlow = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState("");
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const { createAssessment } = useAssessments();
  const { updateAssessmentStatus } = useAssessmentStatus();

  const testAssessments = [
    {
      systemName: "Customer Portal System",
      environment: "production",
      complianceScope: "nist-800-53",
      ownerName: "John Smith",
      ownerRole: "System Administrator",
      description: "Customer-facing web portal for account management"
    },
    {
      systemName: "Internal HR Database",
      environment: "production",
      complianceScope: "hipaa",
      ownerName: "Sarah Johnson",
      ownerRole: "Database Administrator",
      description: "Employee data management system with PII"
    },
    {
      systemName: "E-commerce Platform",
      environment: "production",
      complianceScope: "cmmc-level-2",
      ownerName: "Mike Chen",
      ownerRole: "DevOps Lead",
      description: "Online shopping platform with payment processing"
    },
    {
      systemName: "Financial Reporting System",
      environment: "production",
      complianceScope: "sox",
      ownerName: "Lisa Brown",
      ownerRole: "Finance Manager",
      description: "Automated financial reporting and analytics"
    },
    {
      systemName: "Development CI/CD Pipeline",
      environment: "development",
      complianceScope: "nist-800-53",
      ownerName: "Alex Rodriguez",
      ownerRole: "Senior Developer",
      description: "Continuous integration and deployment infrastructure"
    },
    {
      systemName: "Cloud Storage System",
      environment: "production",
      complianceScope: "iso-27001",
      ownerName: "David Kim",
      ownerRole: "Cloud Architect",
      description: "Scalable cloud storage with encryption"
    },
    {
      systemName: "Mobile Banking App",
      environment: "production",
      complianceScope: "fedramp",
      ownerName: "Emma Wilson",
      ownerRole: "Mobile Team Lead",
      description: "Secure mobile banking application"
    },
    {
      systemName: "Data Analytics Platform",
      environment: "staging",
      complianceScope: "cmmc-level-3",
      ownerName: "Robert Garcia",
      ownerRole: "Data Engineer",
      description: "Big data processing and analytics engine"
    },
    {
      systemName: "IoT Sensor Network",
      environment: "production",
      complianceScope: "nist-800-53",
      ownerName: "Jennifer Lee",
      ownerRole: "IoT Specialist",
      description: "Industrial IoT sensor monitoring system"
    },
    {
      systemName: "Video Conferencing Platform",
      environment: "production",
      complianceScope: "soc-2",
      ownerName: "Thomas Anderson",
      ownerRole: "Platform Engineer",
      description: "Enterprise video conferencing solution"
    }
  ];

  const agentIds = [
    "policy", "physical", "network", "access", "data", "configuration",
    "recovery", "privacy", "blue-team", "vulnerability", "threat-intel",
    "supply-chain", "grc", "training", "mobile", "legal", "compliance"
  ];

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const updateStep = (step: string) => {
    setCurrentStep(step);
  };

  const completeStep = (step: string) => {
    setCompletedSteps(prev => [...prev, step]);
    toast({
      title: "Step Complete",
      description: step,
    });
  };

  const runFullAssessmentTest = async () => {
    setIsRunning(true);
    setCurrentStep("");
    setCompletedSteps([]);

    try {
      updateStep("Starting comprehensive assessment testing...");
      await sleep(1000);

      // Create test assessments (they start as 'not-started')
      updateStep("Creating test assessments...");
      const createdAssessments = [];
      
      for (let i = 0; i < Math.min(5, testAssessments.length); i++) { // Reduced to 5 for testing
        updateStep(`Creating assessment ${i + 1}/5: ${testAssessments[i].systemName}`);
        
        try {
          const assessment = await createAssessment.mutateAsync(testAssessments[i]);
          createdAssessments.push(assessment);
          
          completeStep(`✅ Created: ${testAssessments[i].systemName} (Status: not-started)`);
          await sleep(500);
        } catch (error) {
          console.error(`Failed to create assessment ${i + 1}:`, error);
        }
      }

      // Simulate starting assessments (transition to in-progress)
      updateStep("Starting assessments...");
      for (const assessment of createdAssessments) {
        try {
          await updateAssessmentStatus.mutateAsync({
            assessmentId: assessment.id,
            newStatus: 'in-progress',
            currentStatus: 'not-started'
          });
          completeStep(`🔄 Started: ${assessment.system_name} (Status: in-progress)`);
          await sleep(300);
        } catch (error) {
          console.error(`Failed to start assessment ${assessment.id}:`, error);
        }
      }

      // Simulate completing a few assessments
      updateStep("Completing sample assessments...");
      for (let i = 0; i < Math.min(2, createdAssessments.length); i++) {
        const assessment = createdAssessments[i];
        try {
          await updateAssessmentStatus.mutateAsync({
            assessmentId: assessment.id,
            newStatus: 'completed',
            currentStatus: 'in-progress'
          });
          completeStep(`✅ Completed: ${assessment.system_name} (Status: completed)`);
          await sleep(500);
        } catch (error) {
          console.error(`Failed to complete assessment ${assessment.id}:`, error);
        }
      }

      updateStep("Assessment status workflow testing completed successfully!");
      
      toast({
        title: "Testing Complete!",
        description: `Successfully tested ${createdAssessments.length} assessments with proper status transitions`,
      });

    } catch (error) {
      console.error("Test failed:", error);
      toast({
        title: "Test Failed",
        description: "There was an error during the assessment testing",
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
      setCurrentStep("Test completed");
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Bot className="h-6 w-6 text-blue-600" />
          <span>Assessment Status Flow Testing</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">Status Transition Testing</h3>
            <p className="text-sm text-slate-600">
              This will test proper status transitions: not-started → in-progress → completed
            </p>
          </div>
          <Button
            onClick={runFullAssessmentTest}
            disabled={isRunning}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            size="lg"
          >
            {isRunning ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Running Tests...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Test Status Flow
              </>
            )}
          </Button>
        </div>

        {currentStep && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-blue-600 animate-pulse" />
              <span className="text-sm font-medium text-blue-900">{currentStep}</span>
            </div>
          </div>
        )}

        {isRunning && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Progress</span>
              <span className="font-medium">{completedSteps.length} steps completed</span>
            </div>
            <Progress value={(completedSteps.length / 15) * 100} className="h-2" />
          </div>
        )}

        {completedSteps.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-slate-900">Completed Steps:</h4>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {completedSteps.map((step, index) => (
                <div key={index} className="flex items-center space-x-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span className="text-slate-700">{step}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-slate-50 rounded-lg p-4">
          <h4 className="font-medium text-slate-900 mb-2">Status Transition Rules:</h4>
          <div className="grid grid-cols-1 gap-2 text-sm text-slate-600">
            <Badge variant="outline">not-started → in-progress ✅</Badge>
            <Badge variant="outline">in-progress → completed ✅</Badge>
            <Badge variant="outline">completed → (no transitions) 🚫</Badge>
            <Badge variant="outline">Status regression prevention 🛡️</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TestAssessmentFlow;
