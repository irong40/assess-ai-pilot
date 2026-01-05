import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Library, Database, Loader2 } from "lucide-react";
import { DocumentUpload } from "@/components/documents/DocumentUpload";
import { DocumentLibrary } from "@/components/documents/DocumentLibrary";
import { ATOReadinessCard } from "@/components/compliance/ATOReadinessCard";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const DocumentManagement: React.FC = () => {
  const [isSeeding, setIsSeeding] = useState(false);

  const handleSeedKnowledgeBase = async () => {
    setIsSeeding(true);
    try {
      const { data, error } = await supabase.functions.invoke("seed-knowledge-base");

      if (error) {
        throw error;
      }

      if (data.success) {
        toast.success(
          `Knowledge base seeded successfully! ${data.successful_documents} documents with ${data.total_chunks} chunks created.`
        );
      } else {
        throw new Error(data.error || "Failed to seed knowledge base");
      }
    } catch (error) {
      console.error("Seed error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to seed knowledge base");
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Document Management</h1>
          <p className="text-muted-foreground mt-2">
            Upload, manage, and track compliance documents for your authorization package
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="library" className="space-y-6">
              <TabsList>
                <TabsTrigger value="library" className="flex items-center gap-2">
                  <Library className="h-4 w-4" />
                  Library
                </TabsTrigger>
                <TabsTrigger value="upload" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Upload
                </TabsTrigger>
              </TabsList>

              <TabsContent value="library">
                <DocumentLibrary />
              </TabsContent>

              <TabsContent value="upload">
                <DocumentUpload />
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <ATOReadinessCard />
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Database className="h-5 w-5" />
                  Knowledge Base
                </CardTitle>
                <CardDescription>
                  Seed the RAG system with NIST 800-53 and RMF framework documents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={handleSeedKnowledgeBase} 
                  disabled={isSeeding}
                  className="w-full"
                >
                  {isSeeding ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Seeding...
                    </>
                  ) : (
                    <>
                      <Database className="mr-2 h-4 w-4" />
                      Seed RMF Knowledge Base
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Adds 10 sample documents including NIST 800-53 controls, RMF process guides, SSP/SAR/POA&M requirements, and STIG guidance.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default DocumentManagement;
