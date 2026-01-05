import React, { useState, useEffect } from "react";
import { FileText, Search, Filter, Trash2, RefreshCw, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  RMF_DOCUMENT_TYPES,
  DOCUMENT_CATEGORIES,
  type RMFDocumentType,
  type DocumentCategory,
  isValidDocumentType,
} from "@/types/documentTypes";
import { format } from "date-fns";

interface DocumentSummary {
  document_id: string;
  document_name: string;
  document_type: string;
  chunk_count: number;
  total_tokens: number;
  created_at: string;
}

export const DocumentLibrary: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<DocumentCategory | "all">("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("document_embeddings")
        .select("document_id, document_name, document_type, chunk_index, token_count, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Aggregate by document_id
      const docMap = new Map<string, DocumentSummary>();
      for (const row of data || []) {
        const existing = docMap.get(row.document_id);
        if (existing) {
          existing.chunk_count++;
          existing.total_tokens += row.token_count || 0;
        } else {
          docMap.set(row.document_id, {
            document_id: row.document_id,
            document_name: row.document_name,
            document_type: row.document_type,
            chunk_count: 1,
            total_tokens: row.token_count || 0,
            created_at: row.created_at,
          });
        }
      }

      setDocuments(Array.from(docMap.values()));
    } catch (error) {
      toast({
        title: "Error loading documents",
        description: error instanceof Error ? error.message : "Failed to load documents",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleDelete = async (documentId: string) => {
    setDeletingId(documentId);
    try {
      const { error } = await supabase
        .from("document_embeddings")
        .delete()
        .eq("document_id", documentId);

      if (error) throw error;

      setDocuments((prev) => prev.filter((d) => d.document_id !== documentId));
      toast({
        title: "Document deleted",
        description: "The document has been removed from the knowledge base.",
      });
    } catch (error) {
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Could not delete document",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const getTypeInfo = (type: string) => {
    if (isValidDocumentType(type)) {
      return RMF_DOCUMENT_TYPES[type];
    }
    return { label: type, category: "reference" as DocumentCategory, icon: FileText };
  };

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.document_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.document_type.toLowerCase().includes(searchQuery.toLowerCase());

    const typeInfo = getTypeInfo(doc.document_type);
    const matchesCategory = categoryFilter === "all" || typeInfo.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const getCategoryBadgeVariant = (category: DocumentCategory) => {
    switch (category) {
      case "core":
        return "default";
      case "policy":
        return "secondary";
      case "technical":
        return "outline";
      case "assessment":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Document Library
            </CardTitle>
            <CardDescription>
              Manage embedded documents in the compliance knowledge base
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchDocuments} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-4 pt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            value={categoryFilter}
            onValueChange={(v) => setCategoryFilter(v as DocumentCategory | "all")}
          >
            <SelectTrigger className="w-[200px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {Object.entries(DOCUMENT_CATEGORIES).map(([key, value]) => (
                <SelectItem key={key} value={key}>
                  {value.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No documents found</p>
            <p className="text-sm">Upload documents to add them to the knowledge base</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Chunks</TableHead>
                <TableHead className="text-right">Tokens</TableHead>
                <TableHead>Added</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocuments.map((doc) => {
                const typeInfo = getTypeInfo(doc.document_type);
                const Icon = typeInfo.icon;
                return (
                  <TableRow key={doc.document_id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        {doc.document_name}
                      </div>
                    </TableCell>
                    <TableCell>{typeInfo.label}</TableCell>
                    <TableCell>
                      <Badge variant={getCategoryBadgeVariant(typeInfo.category)}>
                        {DOCUMENT_CATEGORIES[typeInfo.category]?.label || typeInfo.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{doc.chunk_count}</TableCell>
                    <TableCell className="text-right">
                      {doc.total_tokens.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(doc.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            disabled={deletingId === doc.document_id}
                          >
                            {deletingId === doc.document_id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Document</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{doc.document_name}"? This will
                              remove all {doc.chunk_count} chunks from the knowledge base.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(doc.document_id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}

        {/* Summary */}
        {filteredDocuments.length > 0 && (
          <div className="flex items-center justify-between pt-4 text-sm text-muted-foreground border-t mt-4">
            <span>
              {filteredDocuments.length} document{filteredDocuments.length !== 1 ? "s" : ""}
            </span>
            <span>
              {filteredDocuments.reduce((sum, d) => sum + d.chunk_count, 0).toLocaleString()} total
              chunks •{" "}
              {filteredDocuments.reduce((sum, d) => sum + d.total_tokens, 0).toLocaleString()}{" "}
              tokens
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DocumentLibrary;
