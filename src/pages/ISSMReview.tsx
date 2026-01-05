import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Users, CheckCircle, X, AlertTriangle, Shield } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

const ISSMReview = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [reviewDecisions, setReviewDecisions] = useState<Record<string, 'accept' | 'reject' | 'escalate'>>({});
  const [comments, setComments] = useState("");
  const [isReviewing, setIsReviewing] = useState(false);

  // Mock summary findings for ISSM review
  const summaryFindings = [
    {
      id: "finding-1",
      category: "Physical Security",
      severity: "High",
      title: "Inadequate Server Room Access Controls", 
      description: "Server room lacks proper card reader access controls and security cameras",
      recommendation: "Install card reader system and 24/7 surveillance",
      impact: "Unauthorized physical access to critical systems",
      compliance: "NIST 800-53 PE-3"
    },
    {
      id: "finding-2", 
      category: "Policy Documentation",
      severity: "Medium",
      title: "Incomplete Incident Response Procedures",
      description: "Incident response playbook missing specific escalation procedures",
      recommendation: "Complete incident response documentation with clear escalation paths",
      impact: "Delayed response to security incidents",
      compliance: "NIST 800-53 IR-8"
    },
    {
      id: "finding-3",
      category: "Data Protection",
      severity: "Medium", 
      title: "Inconsistent Backup Procedures",
      description: "Backup procedures vary across systems without standardized encryption",
      recommendation: "Standardize backup procedures with consistent encryption standards",
      impact: "Potential data loss or exposure during backup processes",
      compliance: "NIST 800-53 CP-9"
    },
    {
      id: "finding-4",
      category: "Network Security",
      severity: "Low",
      title: "Limited Network Monitoring",
      description: "SIEM rules need enhancement for lateral movement detection",
      recommendation: "Deploy additional monitoring rules for advanced threat detection",
      impact: "Delayed detection of advanced persistent threats",
      compliance: "NIST 800-53 SI-4"
    }
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'High': return 'bg-red-100 text-red-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDecisionColor = (decision: string) => {
    switch (decision) {
      case 'accept': return 'bg-green-100 text-green-800 border-green-200';
      case 'reject': return 'bg-red-100 text-red-800 border-red-200';
      case 'escalate': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleDecisionChange = (findingId: string, decision: 'accept' | 'reject' | 'escalate') => {
    setReviewDecisions(prev => ({
      ...prev,
      [findingId]: decision
    }));
  };

  const handleFinalizeReview = async () => {
    setIsReviewing(true);
    
    // Check if all findings have been reviewed
    const allReviewed = summaryFindings.every(finding => reviewDecisions[finding.id]);
    
    if (!allReviewed) {
      toast({
        title: "Review Incomplete",
        description: "Please review all findings before finalizing",
        variant: "destructive"
      });
      setIsReviewing(false);
      return;
    }

    setTimeout(() => {
      setIsReviewing(false);
      
      const acceptedCount = Object.values(reviewDecisions).filter(d => d === 'accept').length;
      const rejectedCount = Object.values(reviewDecisions).filter(d => d === 'reject').length;
      const escalatedCount = Object.values(reviewDecisions).filter(d => d === 'escalate').length;

      toast({
        title: "ISSM Review Complete",
        description: `${acceptedCount} accepted, ${rejectedCount} rejected, ${escalatedCount} escalated`,
      });

      navigate(`/assessment/${id}/report`);
    }, 2000);
  };

  const reviewedCount = Object.keys(reviewDecisions).length;
  const totalFindings = summaryFindings.length;

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center space-x-3 mb-8">
            <div className="p-3 bg-red-50 rounded-lg">
              <Users className="h-8 w-8 text-red-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">ISSM Final Review</h1>
              <p className="text-muted-foreground">Review and approve assessment findings and recommendations</p>
            </div>
          </div>

          {/* Review Progress */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Review Progress</h3>
                <div className="text-right">
                  <div className="text-2xl font-bold text-red-600">{reviewedCount}/{totalFindings}</div>
                  <div className="text-sm text-muted-foreground">Findings Reviewed</div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-xl font-bold text-green-600">
                    {Object.values(reviewDecisions).filter(d => d === 'accept').length}
                  </div>
                  <div className="text-sm text-green-700">Accepted</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <div className="text-xl font-bold text-red-600">
                    {Object.values(reviewDecisions).filter(d => d === 'reject').length}
                  </div>
                  <div className="text-sm text-red-700">Rejected</div>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <div className="text-xl font-bold text-orange-600">
                    {Object.values(reviewDecisions).filter(d => d === 'escalate').length}
                  </div>
                  <div className="text-sm text-orange-700">Escalated</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Findings Review */}
          <div className="space-y-6 mb-8">
            {summaryFindings.map((finding) => (
              <Card key={finding.id} className="border-border">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <CardTitle className="text-lg">{finding.title}</CardTitle>
                        <Badge className={getSeverityColor(finding.severity)}>
                          {finding.severity}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {finding.category}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{finding.compliance}</p>
                    </div>
                    
                    {reviewDecisions[finding.id] && (
                      <Badge className={getDecisionColor(reviewDecisions[finding.id])}>
                        {reviewDecisions[finding.id].charAt(0).toUpperCase() + reviewDecisions[finding.id].slice(1)}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-foreground mb-2">Description</h4>
                      <p className="text-sm text-muted-foreground">{finding.description}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground mb-2">Business Impact</h4>
                      <p className="text-sm text-muted-foreground">{finding.impact}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-foreground mb-2">Recommended Action</h4>
                    <p className="text-sm text-muted-foreground">{finding.recommendation}</p>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-medium text-foreground mb-3">ISSM Decision</h4>
                    <div className="flex items-center space-x-4">
                      <Button
                        variant={reviewDecisions[finding.id] === 'accept' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleDecisionChange(finding.id, 'accept')}
                        className={reviewDecisions[finding.id] === 'accept' ? 'bg-green-600 hover:bg-green-700' : ''}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Accept
                      </Button>
                      
                      <Button
                        variant={reviewDecisions[finding.id] === 'reject' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleDecisionChange(finding.id, 'reject')}
                        className={reviewDecisions[finding.id] === 'reject' ? 'bg-red-600 hover:bg-red-700' : ''}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                      
                      <Button
                        variant={reviewDecisions[finding.id] === 'escalate' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleDecisionChange(finding.id, 'escalate')}
                        className={reviewDecisions[finding.id] === 'escalate' ? 'bg-orange-600 hover:bg-orange-700' : ''}
                      >
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Escalate
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* ISSM Comments */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>ISSM Review Comments</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Add overall comments about the assessment, additional guidance, or specific notes for the report..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={4}
              />
            </CardContent>
          </Card>

          {/* Finalize Review */}
          <div className="text-center">
            <Card className="bg-muted/30 border-border">
              <CardContent className="pt-6">
                <Shield className="h-12 w-12 text-red-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Finalize ISSM Review
                </h3>
                <p className="text-muted-foreground mb-6">
                  Review complete. This action will lock the assessment and proceed to report generation.
                </p>
                <Button 
                  onClick={handleFinalizeReview}
                  disabled={isReviewing || reviewedCount < totalFindings}
                  className="bg-red-600 hover:bg-red-700 text-white px-8"
                  size="lg"
                >
                  {isReviewing ? "Processing..." : "Finalize Review & Generate Report"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default ISSMReview;
