/**
 * Evidence Management page.
 *
 * Tab layout:
 * - Upload: EvidenceUpload component for associating documents with controls
 * - Completeness: EvidenceCompleteness showing per-family coverage
 * - Evidence Matrix: EvidenceMatrixTable with sortable, filterable evidence records
 *
 * ExportPanel placeholder below tabs (replaced in Task 2).
 */
import { AppLayout } from '@/components/layout/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, BarChart3, FileSpreadsheet, Download } from 'lucide-react';
import EvidenceUpload from '@/components/evidence/EvidenceUpload';
import EvidenceCompleteness from '@/components/evidence/EvidenceCompleteness';
import EvidenceMatrixTable from '@/components/evidence/EvidenceMatrixTable';

export default function EvidenceManagement() {
  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">
            Evidence Management
          </h1>
          <p className="text-muted-foreground">
            Upload and track evidence for CMMC controls
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="upload" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="completeness" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Completeness
            </TabsTrigger>
            <TabsTrigger value="matrix" className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              Evidence Matrix
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload">
            <EvidenceUpload />
          </TabsContent>

          <TabsContent value="completeness">
            <EvidenceCompleteness />
          </TabsContent>

          <TabsContent value="matrix">
            <EvidenceMatrixTable />
          </TabsContent>
        </Tabs>

        {/* Export Panel placeholder -- replaced in Task 2 */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Download className="h-5 w-5" />
            Audit-Ready Exports
          </h2>
          <Card>
            <CardContent className="py-6 text-center text-muted-foreground">
              Export panel will be available after running a compliance assessment.
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
