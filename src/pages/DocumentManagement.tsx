import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Library, Award } from "lucide-react";
import { DocumentUpload } from "@/components/documents/DocumentUpload";
import { DocumentLibrary } from "@/components/documents/DocumentLibrary";
import { ATOReadinessCard } from "@/components/compliance/ATOReadinessCard";
import Header from "@/components/Header";

const DocumentManagement: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
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
          </div>
        </div>
      </main>
    </div>
  );
};

export default DocumentManagement;
