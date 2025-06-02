
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Bot, CheckCircle } from "lucide-react";
import Header from "@/components/Header";
import FileUpload from "@/components/FileUpload";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

const AgentPhysical = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [analysis, setAnalysis] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    
    setTimeout(() => {
      const mockAnalysis = `# ISSO-Physical Security Assessment

## Physical Security Controls Analysis
- **Facility Protection**: Multi-layered physical security with controlled access points
- **Access Controls**: Badge-based entry system with logging and monitoring
- **Environmental Controls**: Climate control, fire suppression, and power redundancy

## Key Findings
### Strengths
- 24/7 security personnel on-site
- CCTV surveillance with 90-day retention
- Biometric access controls for sensitive areas
- Proper cable management and equipment securing

### Areas for Improvement
- Visitor escort procedures need enforcement
- Emergency response plans require annual testing
- Some legacy access cards need deactivation

## Recommendations
1. Implement mandatory visitor escort policy
2. Conduct quarterly emergency response drills
3. Audit and deactivate unused access credentials
4. Install additional surveillance in server areas

## Compliance Score: 78/100

## Uploaded Documents Analysis
${uploadedFiles.length > 0 ? `Analyzed ${uploadedFiles.length} document(s) including facility layouts and security procedures.` : 'No additional documents provided for analysis.'}`;

      setAnalysis(mockAnalysis);
      setIsAnalyzing(false);
      setIsComplete(true);
      
      toast({
        title: "Analysis Complete",
        description: "ISSO-Physical assessment has been completed successfully",
      });
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center space-x-4 mb-8">
            <Button 
              variant="ghost" 
              onClick={() => navigate(`/assessment/${id}/agents`)}
              className="text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Agent Hub
            </Button>
          </div>

          <div className="flex items-center space-x-3 mb-8">
            <div className="p-3 bg-blue-50 rounded-lg">
              <Bot className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">ISSO-Physical Agent</h1>
              <p className="text-slate-600">Assesses physical security controls and facility protections</p>
            </div>
            {isComplete && <CheckCircle className="h-8 w-8 text-green-600" />}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Assessment Input</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <FileUpload
                  onUploadComplete={setUploadedFiles}
                  acceptedTypes=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.dwg"
                  maxFiles={5}
                />

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Additional Context (Optional)
                  </label>
                  <Textarea
                    placeholder="Describe your facility layout, security measures, access control systems, or any recent security incidents..."
                    rows={4}
                  />
                </div>

                <Button 
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  size="lg"
                >
                  {isAnalyzing ? "Analyzing..." : "Start Physical Security Analysis"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Analysis Results</CardTitle>
              </CardHeader>
              <CardContent>
                {isAnalyzing ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <Bot className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-pulse" />
                      <p className="text-slate-600">Analyzing physical security controls...</p>
                    </div>
                  </div>
                ) : analysis ? (
                  <div className="prose prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap text-sm">{analysis}</pre>
                  </div>
                ) : (
                  <div className="text-center text-slate-500 h-64 flex items-center justify-center">
                    <p>Upload documents and start analysis to see results here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {isComplete && (
            <div className="mt-8 text-center">
              <Card className="bg-green-50 border-green-200">
                <CardContent className="pt-6">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-green-900 mb-2">
                    Physical Security Assessment Complete!
                  </h3>
                  <p className="text-green-700 mb-4">
                    The ISSO-Physical agent has completed its analysis. You can now proceed to other agents or review the summary.
                  </p>
                  <Button 
                    onClick={() => navigate(`/assessment/${id}/agents`)}
                    className="bg-green-600 hover:bg-green-700 text-white mr-4"
                  >
                    Return to Agent Hub
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => navigate(`/assessment/${id}/summary`)}
                  >
                    View Summary
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AgentPhysical;
