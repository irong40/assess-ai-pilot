
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Upload, Bot, CheckCircle } from "lucide-react";
import Header from "@/components/Header";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

const AgentLegal = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [analysis, setAnalysis] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    
    setTimeout(() => {
      const mockAnalysis = `# ISSO-Legal Assessment

## Legal & Regulatory Compliance Analysis
- **Regulatory Landscape**: Comprehensive mapping of applicable legal requirements
- **Contract Management**: Legal review and security requirements in agreements
- **Liability & Risk**: Legal risk assessment and liability management

## Key Findings
### Strengths
- Strong legal and compliance team with cybersecurity expertise
- Regular legal risk assessments and regulatory compliance monitoring
- Well-defined contract security requirements and vendor agreements
- Established legal incident response and breach notification procedures

### Areas for Improvement
- Emerging regulation monitoring and compliance preparation needs enhancement
- International privacy law compliance requires additional attention
- Legal hold and e-discovery procedures need cybersecurity integration

## Recommendations
1. Enhance emerging regulation monitoring and impact assessment processes
2. Strengthen international privacy law compliance capabilities
3. Integrate cybersecurity considerations into legal hold and e-discovery
4. Establish proactive legal risk mitigation and regulatory engagement

## Compliance Score: 82/100`;

      setAnalysis(mockAnalysis);
      setIsAnalyzing(false);
      setIsComplete(true);
      
      toast({
        title: "Analysis Complete",
        description: "ISSO-Legal assessment has been completed successfully",
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
            <div className="p-3 bg-purple-50 rounded-lg">
              <Bot className="h-8 w-8 text-purple-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">ISSO-Legal Agent</h1>
              <p className="text-slate-600">Identifies legal and regulatory compliance risks</p>
            </div>
            {isComplete && <CheckCircle className="h-8 w-8 text-green-600" />}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Assessment Input</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-purple-400 transition-colors">
                  <Upload className="h-8 w-8 text-slate-400 mx-auto mb-3" />
                  <h3 className="font-medium text-slate-900 mb-2">Upload Legal Documentation</h3>
                  <p className="text-sm text-slate-600 mb-4">
                    Legal opinions, compliance assessments, contracts, regulatory correspondence
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
                    placeholder="Describe your legal and regulatory environment, compliance challenges, recent legal opinions, or any regulatory investigations..."
                    rows={4}
                  />
                </div>

                <Button 
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  size="lg"
                >
                  {isAnalyzing ? "Analyzing..." : "Start Legal Analysis"}
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
                      <Bot className="h-12 w-12 text-purple-600 mx-auto mb-4 animate-pulse" />
                      <p className="text-slate-600">Analyzing legal compliance...</p>
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
                    Legal Assessment Complete!
                  </h3>
                  <p className="text-green-700 mb-4">
                    The ISSO-Legal agent has completed its analysis. You can now proceed to other agents or review the summary.
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

export default AgentLegal;
