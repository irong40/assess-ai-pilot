import React, { useState, useCallback } from "react";
import { Upload, FileUp, Loader2, CheckCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { ragService } from "@/services/aiService";
import {
  DOCUMENT_TYPE_GROUPS,
  RMF_DOCUMENT_TYPES,
  type RMFDocumentType,
} from "@/types/documentTypes";

interface UploadedFile {
  file: File;
  name: string;
  content: string;
}

export const DocumentUpload: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);
  const [documentName, setDocumentName] = useState("");
  const [documentType, setDocumentType] = useState<RMFDocumentType | "">("");
  const [description, setDescription] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const { toast } = useToast();

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const handleFileSelect = useCallback(async (file: File) => {
    const allowedTypes = [
      "text/plain",
      "text/markdown",
      "application/json",
      "text/csv",
      "application/pdf",
    ];

    // For now, only support text-based files
    if (!file.type.startsWith("text/") && file.type !== "application/json") {
      toast({
        title: "Unsupported file type",
        description: "Please upload a text, markdown, or JSON file.",
        variant: "destructive",
      });
      return;
    }

    try {
      const content = await readFileContent(file);
      setSelectedFile({ file, name: file.name, content });
      setDocumentName(file.name.replace(/\.[^/.]+$/, ""));
    } catch {
      toast({
        title: "Error reading file",
        description: "Could not read the file contents.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const clearFile = () => {
    setSelectedFile(null);
    setDocumentName("");
    setDocumentType("");
    setDescription("");
  };

  const handleUpload = async () => {
    if (!selectedFile || !documentName || !documentType) {
      toast({
        title: "Missing information",
        description: "Please provide a file, name, and document type.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const documentId = crypto.randomUUID();

      await ragService.embedDocument({
        documentId,
        documentName,
        documentType: documentType as RMFDocumentType,
        content: selectedFile.content,
        metadata: {
          originalFileName: selectedFile.file.name,
          description,
          uploadedAt: new Date().toISOString(),
          fileSize: selectedFile.file.size,
        },
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      toast({
        title: "Document uploaded",
        description: `"${documentName}" has been embedded and added to the knowledge base.`,
      });

      // Reset form
      setTimeout(() => {
        clearFile();
        setUploadProgress(0);
      }, 1000);
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Could not upload document.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Document
        </CardTitle>
        <CardDescription>
          Add documents to the compliance knowledge base for AI-powered search
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Drop Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center transition-colors
            ${isDragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25"}
            ${selectedFile ? "bg-muted/50" : ""}
          `}
        >
          {selectedFile ? (
            <div className="flex items-center justify-center gap-4">
              <FileUp className="h-8 w-8 text-primary" />
              <div className="text-left">
                <p className="font-medium">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(selectedFile.file.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={clearFile}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <>
              <FileUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-2">
                Drag and drop a file here, or click to browse
              </p>
              <Input
                type="file"
                accept=".txt,.md,.json,.csv"
                onChange={handleInputChange}
                className="max-w-xs mx-auto"
              />
            </>
          )}
        </div>

        {/* Document Details */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="documentName">Document Name</Label>
            <Input
              id="documentName"
              value={documentName}
              onChange={(e) => setDocumentName(e.target.value)}
              placeholder="e.g., System Security Plan v2.0"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="documentType">Document Type</Label>
            <Select
              value={documentType}
              onValueChange={(value) => setDocumentType(value as RMFDocumentType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_TYPE_GROUPS.map((group) => (
                  <SelectGroup key={group.category}>
                    <SelectLabel className="text-xs font-semibold text-muted-foreground">
                      {group.label}
                    </SelectLabel>
                    {group.types.map((type) => {
                      const Icon = type.icon;
                      return (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {RMF_DOCUMENT_TYPES[type.value].label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description (optional)</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of this document..."
            rows={3}
          />
        </div>

        {/* Progress */}
        {isUploading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Embedding document...</span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} />
          </div>
        )}

        {/* Upload Button */}
        <Button
          onClick={handleUpload}
          disabled={!selectedFile || !documentName || !documentType || isUploading}
          className="w-full"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : uploadProgress === 100 ? (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Uploaded
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Upload & Embed Document
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default DocumentUpload;
