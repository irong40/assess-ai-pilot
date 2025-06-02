import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Upload, Bot, CheckCircle } from "lucide-react";
import Header from "@/components/Header";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

const AgentCompliance = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [analysis, setAnalysis] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const user = {
    email: "admin@company.com",
    role: "admin"
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    
    setTimeout(() => {
      const mockAnalysis = `# ISSO-Compliance Assessment

## Regulatory Compliance Analysis
- **Framework Alignment**: Strong alignment with NIST 800-53 controls
- **Audit Readiness**: Documentation and evidence collection processes
- **Regulatory Requirements**: Multi-framework compliance approach

## Key Findings
### Strengths
- Comprehensive compliance program with clear ownership
- Regular internal audits and external assessments
- Well-maintained compliance documentation repository
- Effective compliance monitoring and reporting

### Areas for Improvement
- Some control implementations lack sufficient evidence
- Compliance training needs to be more role-specific
- Automated compliance monitoring tools need enhancement

## Recommendations
1. Strengthen evidence collection for key security controls
2. Implement role-based compliance training programs
3. Deploy automated compliance monitoring tools
4. Establish continuous compliance assessment processes

## Compliance Score: 86/100`;

      setAnalysis(mockAnalysis);
      setIsAnalyzing(false);
      setIsComplete(true);
      
      toast({
        title: "Analysis Complete",
        description: "ISSO-Compliance assessment has been completed successfully",
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
              <h1 className="text-3xl font-bold text-slate-900">ISSO-Compliance Agent</h1>
              <p className="text-slate-600">Validates regulatory compliance and audit readiness</p>
            </div>
            {isComplete && <CheckCircle className="h-8 w-8 text-green-600" />}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Assessment Input</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                  <Upload className="h-8 w-8 text-slate-400 mx-auto mb-3" />
                  <h3 className="font-medium text-slate-900 mb-2">Upload Compliance Documentation</h3>
                  <p className="text-sm text-slate-600 mb-4">
                    Audit reports, compliance matrices, control documentation
                  </p>
                  <Button variant="outline" size="sm">
                    Select Files
                  </Button>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Additional Context (Optional)
                  </label>
                  <Textarea
                    placeholder="Describe your compliance requirements, recent audits, control implementations, or any regulatory challenges..."
                    rows={4}
                  />
                </div>

                <Button 
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  size="lg"
                >
                  {isAnalyzing ? "Analyzing..." : "Start Compliance Analysis"}
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
                      <p className="text-slate-600">Analyzing compliance status...</p>
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
                    Compliance Assessment Complete!
                  </h3>
                  <p className="text-green-700 mb-4">
                    The ISSO-Compliance agent has completed its analysis. You can now proceed to other agents or review the summary.
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

export default AgentCompliance;
