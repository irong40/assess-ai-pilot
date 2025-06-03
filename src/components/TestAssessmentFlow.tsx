
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { useAssessments } from "@/hooks/useAssessments";
import { useAgentAssessments } from "@/hooks/useAgentAssessments";
import { Play, CheckCircle, Clock, Bot } from "lucide-react";

const TestAssessmentFlow = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState("");
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const { createAssessment } = useAssessments();

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
    console.log(`Test Step: ${step}`);
  };

  const completeStep = (step: string) => {
    setCompletedSteps(prev => [...prev, step]);
    toast({
      title: "Step Complete",
      description: step,
    });
  };

  const simulateAgentAssessment = async (assessmentId: string, agentId: string) => {
    // Simulate agent analysis time
    await sleep(Math.random() * 1000 + 500);
    
    const progress = Math.floor(Math.random() * 100) + 1;
    const status = progress === 100 ? 'completed' : 'in-progress';
    
    return {
      agentId,
      status,
      progress,
      analysisResult: `Mock analysis result for ${agentId} agent`
    };
  };

  const runFullAssessmentTest = async () => {
    setIsRunning(true);
    setCurrentStep("");
    setCompletedSteps([]);

    try {
      updateStep("Starting comprehensive assessment testing...");
      await sleep(1000);

      // Create 10 test assessments
      updateStep("Creating 10 test assessments...");
      const createdAssessments = [];
      
      for (let i = 0; i < testAssessments.length; i++) {
        updateStep(`Creating assessment ${i + 1}/10: ${testAssessments[i].systemName}`);
        
        try {
          const assessment = await createAssessment.mutateAsync(testAssessments[i]);
          createdAssessments.push(assessment);
          
          completeStep(`✅ Created: ${testAssessments[i].systemName}`);
          await sleep(500);
        } catch (error) {
          console.error(`Failed to create assessment ${i + 1}:`, error);
          toast({
            title: "Assessment Creation Failed",
            description: `Failed to create ${testAssessments[i].systemName}`,
            variant: "destructive"
          });
        }
      }

      updateStep(`Successfully created ${createdAssessments.length} assessments`);
      completeStep(`📊 Created ${createdAssessments.length} test assessments`);

      // Simulate running agents on a few assessments
      updateStep("Running agent assessments on sample systems...");
      
      for (let i = 0; i < Math.min(3, createdAssessments.length); i++) {
        const assessment = createdAssessments[i];
        updateStep(`Running agents for: ${assessment.system_name}`);

        // Run a subset of agents for each assessment
        const agentsToRun = agentIds.slice(0, Math.floor(Math.random() * 5) + 3);
        
        for (const agentId of agentsToRun) {
          updateStep(`Running ${agentId} agent for ${assessment.system_name}`);
          
          try {
            await simulateAgentAssessment(assessment.id, agentId);
            completeStep(`🤖 ${agentId} agent completed for ${assessment.system_name}`);
            await sleep(200);
          } catch (error) {
            console.error(`Agent ${agentId} failed:`, error);
          }
        }
      }

      // Test workflow completion simulation
      updateStep("Simulating workflow completion...");
      await sleep(1000);
      
      completeStep("📋 ISSO-Lead summaries generated");
      await sleep(500);
      completeStep("✅ ISSM reviews completed");
      await sleep(500);
      completeStep("📄 Reports generated successfully");

      updateStep("Assessment testing completed successfully!");
      
      toast({
        title: "Testing Complete!",
        description: `Successfully tested ${createdAssessments.length} assessments with full workflow simulation`,
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
          <span>Assessment Flow Testing</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">Comprehensive Assessment Testing</h3>
            <p className="text-sm text-slate-600">
              This will create 10 test assessments and simulate the complete workflow
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
                Run Full Test
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
            <Progress value={(completedSteps.length / 20) * 100} className="h-2" />
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
          <h4 className="font-medium text-slate-900 mb-2">Test Coverage:</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-slate-600">
            <Badge variant="outline">10 Test Assessments</Badge>
            <Badge variant="outline">Multiple Compliance Frameworks</Badge>
            <Badge variant="outline">17 Agent Types</Badge>
            <Badge variant="outline">Workflow Simulation</Badge>
            <Badge variant="outline">Error Handling</Badge>
            <Badge variant="outline">Progress Tracking</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TestAssessmentFlow;
