
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Shield, FileText } from "lucide-react";
import Header from "@/components/Header";
import FileUpload from "@/components/FileUpload";
import DaapmPositionsSelect from "@/components/DaapmPositionsSelect";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { useAssessments } from "@/hooks/useAssessments";

const NewAssessment = () => {
  const navigate = useNavigate();
  const { createAssessment } = useAssessments();
  const [formData, setFormData] = useState({
    systemName: "",
    environment: "",
    complianceScope: "",
    ownerName: "",
    ownerRole: "",
    daapmPosition: "",
    description: "",
    criticalityLevel: ""
  });
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.systemName || !formData.environment || !formData.complianceScope) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const assessment = await createAssessment.mutateAsync({
        systemName: formData.systemName,
        environment: formData.environment,
        complianceScope: formData.complianceScope,
        ownerName: formData.ownerName || undefined,
        ownerRole: formData.ownerRole || undefined,
        description: formData.description || undefined,
        criticalityLevel: formData.criticalityLevel || undefined,
      });
      
      toast({
        title: "Assessment Created",
        description: `Assessment "${formData.systemName}" has been created successfully with ${uploadedFiles.length} document(s)`,
      });

      // Navigate to agent hub with the real assessment ID
      navigate(`/assessment/${assessment.id}/agents`);
    } catch (error: unknown) {
      toast({
        title: "Error Creating Assessment",
        description: error instanceof Error ? error.message : "Failed to create assessment",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center space-x-4 mb-8">
            <Button 
              variant="ghost" 
              onClick={() => navigate("/dashboard")}
              className="text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>

          <div className="flex items-center space-x-3 mb-8">
            <Shield className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Create New Assessment</h1>
              <p className="text-slate-600">Set up a comprehensive cybersecurity assessment for your system</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <span>System Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="systemName" className="text-sm font-medium">
                      System Name *
                    </Label>
                    <Input
                      id="systemName"
                      placeholder="e.g., Customer Portal System"
                      value={formData.systemName}
                      onChange={(e) => handleInputChange("systemName", e.target.value)}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="environment" className="text-sm font-medium">
                      Environment *
                    </Label>
                    <Select onValueChange={(value) => handleInputChange("environment", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select environment" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="development">Development</SelectItem>
                        <SelectItem value="test">Test</SelectItem>
                        <SelectItem value="staging">Staging</SelectItem>
                        <SelectItem value="production">Production</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="complianceScope" className="text-sm font-medium">
                      Compliance Scope *
                    </Label>
                    <Select onValueChange={(value) => handleInputChange("complianceScope", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select compliance framework" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nist-800-53">NIST 800-53</SelectItem>
                        <SelectItem value="hipaa">HIPAA</SelectItem>
                        <SelectItem value="cmmc-level-1">CMMC Level 1</SelectItem>
                        <SelectItem value="cmmc-level-2">CMMC Level 2</SelectItem>
                        <SelectItem value="cmmc-level-3">CMMC Level 3</SelectItem>
                        <SelectItem value="iso-27001">ISO 27001</SelectItem>
                        <SelectItem value="soc-2">SOC 2</SelectItem>
                        <SelectItem value="fedramp">FedRAMP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="criticalityLevel" className="text-sm font-medium">
                      System Criticality
                    </Label>
                    <Select onValueChange={(value) => handleInputChange("criticalityLevel", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select criticality level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="moderate">Moderate</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium">
                    System Description
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Provide a brief description of the system, its purpose, and key functionality..."
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Owner Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="ownerName" className="text-sm font-medium">
                      Owner Name
                    </Label>
                    <Input
                      id="ownerName"
                      placeholder="e.g., John Smith"
                      value={formData.ownerName}
                      onChange={(e) => handleInputChange("ownerName", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ownerRole" className="text-sm font-medium">
                      Owner Role
                    </Label>
                    <Input
                      id="ownerRole"
                      placeholder="e.g., System Administrator"
                      value={formData.ownerRole}
                      onChange={(e) => handleInputChange("ownerRole", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="daapmPosition" className="text-sm font-medium">
                      DAAPM Position
                    </Label>
                    <DaapmPositionsSelect
                      value={formData.daapmPosition}
                      onValueChange={(value) => handleInputChange("daapmPosition", value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Document Upload</CardTitle>
              </CardHeader>
              <CardContent>
                <FileUpload
                  onUploadComplete={setUploadedFiles}
                  acceptedTypes=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.xlsx,.csv"
                  maxFiles={10}
                />
              </CardContent>
            </Card>

            <div className="flex items-center justify-between pt-6 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate("/dashboard")}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              
              <Button 
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8"
                size="lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creating..." : "Begin Assessment"}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default NewAssessment;
