
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, ArrowLeft, Shield, FileText } from "lucide-react";
import Header from "@/components/Header";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

const NewAssessment = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    systemName: "",
    environment: "",
    complianceScope: "",
    ownerName: "",
    ownerRole: "",
    description: "",
    criticalityLevel: ""
  });

  const user = {
    email: "admin@company.com",
    role: "admin"
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
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

    // Mock assessment creation
    const assessmentId = Math.random().toString(36).substr(2, 9);
    
    toast({
      title: "Assessment Created",
      description: `Assessment "${formData.systemName}" has been created successfully`,
    });

    // Navigate to agent hub
    navigate(`/assessment/${assessmentId}/agents`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />
      
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
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Document Upload</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                  <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">Upload System Documents</h3>
                  <p className="text-slate-600 mb-4">
                    System Security Plans (SSP), network diagrams, configuration files, and other relevant documentation
                  </p>
                  <Button variant="outline" type="button">
                    Select Files
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-between pt-6 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate("/dashboard")}
              >
                Cancel
              </Button>
              
              <Button 
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8"
                size="lg"
              >
                Begin Assessment
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default NewAssessment;
