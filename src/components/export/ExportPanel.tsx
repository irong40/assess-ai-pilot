/**
 * Export panel component with SSP, POA&M, and Evidence Matrix export buttons.
 *
 * Features:
 * - Three export buttons: SSP PDF, POA&M PDF, Evidence Matrix (PDF | CSV)
 * - Loading state during generation
 * - Disabled state when no gap analysis results exist
 * - Format toggle for evidence matrix (PDF vs CSV)
 * - Company name from user profile
 */
import { useState } from 'react';
import { useLatestGapAnalysis } from '@/hooks/useGapAnalysisResults';
import { useUserProfile } from '@/hooks/useUserProfile';
import { exportSsp, exportPoam, exportEvidenceMatrix } from '@/services/exportService';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  FileText,
  AlertTriangle,
  Download,
  FileSpreadsheet,
  Shield,
} from 'lucide-react';

type ExportFormat = 'pdf' | 'csv';

export default function ExportPanel() {
  const { data: gapAnalysis, isLoading: gapLoading } = useLatestGapAnalysis();
  const { data: profile } = useUserProfile();

  const [companyName, setCompanyName] = useState('');
  const [exportingSsp, setExportingSsp] = useState(false);
  const [exportingPoam, setExportingPoam] = useState(false);
  const [exportingMatrix, setExportingMatrix] = useState(false);
  const [matrixFormat, setMatrixFormat] = useState<ExportFormat>('pdf');

  const hasGapAnalysis = !!gapAnalysis;
  const companyId = profile?.company_id;
  const effectiveName = companyName || 'Company';

  const handleExportSsp = async () => {
    if (!companyId) return;
    setExportingSsp(true);
    try {
      await exportSsp(effectiveName, companyId);
      toast({ title: 'SSP exported', description: 'System Security Plan PDF downloaded' });
    } catch (err: unknown) {
      toast({
        title: 'Export failed',
        description: err instanceof Error ? err.message : 'Failed to export SSP',
        variant: 'destructive',
      });
    } finally {
      setExportingSsp(false);
    }
  };

  const handleExportPoam = async () => {
    if (!companyId) return;
    setExportingPoam(true);
    try {
      await exportPoam(effectiveName, companyId);
      toast({ title: 'POA&M exported', description: 'Plan of Action & Milestones PDF downloaded' });
    } catch (err: unknown) {
      toast({
        title: 'Export failed',
        description: err instanceof Error ? err.message : 'Failed to export POA&M',
        variant: 'destructive',
      });
    } finally {
      setExportingPoam(false);
    }
  };

  const handleExportMatrix = async () => {
    if (!companyId) return;
    setExportingMatrix(true);
    try {
      await exportEvidenceMatrix(effectiveName, companyId, matrixFormat);
      toast({
        title: 'Evidence Matrix exported',
        description: `Evidence matrix ${matrixFormat.toUpperCase()} downloaded`,
      });
    } catch (err: unknown) {
      toast({
        title: 'Export failed',
        description: err instanceof Error ? err.message : 'Failed to export evidence matrix',
        variant: 'destructive',
      });
    } finally {
      setExportingMatrix(false);
    }
  };

  const DisabledWrapper = ({ children }: { children: React.ReactNode }) => {
    if (hasGapAnalysis) return <>{children}</>;
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-block">{children}</span>
          </TooltipTrigger>
          <TooltipContent>
            Run a compliance assessment first
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Audit-Ready Exports
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Company Name Input */}
        <div className="space-y-2">
          <Label htmlFor="export-company">Company Name (for documents)</Label>
          <Input
            id="export-company"
            placeholder="Enter company name for export headers..."
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
          />
        </div>

        {/* Export Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* SSP Export */}
          <DisabledWrapper>
            <Button
              variant="outline"
              className="w-full h-auto py-4 flex flex-col items-center gap-2"
              disabled={!hasGapAnalysis || exportingSsp || !companyId}
              onClick={handleExportSsp}
            >
              <Shield className="h-6 w-6" />
              <span className="font-medium">Export SSP (PDF)</span>
              <span className="text-xs text-muted-foreground">
                System Security Plan
              </span>
              {exportingSsp && (
                <span className="text-xs">Generating...</span>
              )}
            </Button>
          </DisabledWrapper>

          {/* POA&M Export */}
          <DisabledWrapper>
            <Button
              variant="outline"
              className="w-full h-auto py-4 flex flex-col items-center gap-2"
              disabled={!hasGapAnalysis || exportingPoam || !companyId}
              onClick={handleExportPoam}
            >
              <AlertTriangle className="h-6 w-6" />
              <span className="font-medium">Export POA&M (PDF)</span>
              <span className="text-xs text-muted-foreground">
                Plan of Action & Milestones
              </span>
              {exportingPoam && (
                <span className="text-xs">Generating...</span>
              )}
            </Button>
          </DisabledWrapper>

          {/* Evidence Matrix Export */}
          <div className="space-y-2">
            <DisabledWrapper>
              <Button
                variant="outline"
                className="w-full h-auto py-4 flex flex-col items-center gap-2"
                disabled={exportingMatrix || !companyId}
                onClick={handleExportMatrix}
              >
                <FileSpreadsheet className="h-6 w-6" />
                <span className="font-medium">
                  Export Evidence Matrix ({matrixFormat.toUpperCase()})
                </span>
                <span className="text-xs text-muted-foreground">
                  Document-to-control mapping
                </span>
                {exportingMatrix && (
                  <span className="text-xs">Generating...</span>
                )}
              </Button>
            </DisabledWrapper>
            <div className="flex items-center justify-center gap-2">
              <button
                className={`text-xs px-2 py-1 rounded ${matrixFormat === 'pdf' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
                onClick={() => setMatrixFormat('pdf')}
              >
                PDF
              </button>
              <button
                className={`text-xs px-2 py-1 rounded ${matrixFormat === 'csv' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
                onClick={() => setMatrixFormat('csv')}
              >
                CSV
              </button>
            </div>
          </div>
        </div>

        {!hasGapAnalysis && !gapLoading && (
          <p className="text-sm text-muted-foreground text-center">
            <AlertTriangle className="inline h-4 w-4 mr-1" />
            SSP and POA&M exports require a completed compliance assessment.
            Evidence matrix export is available once evidence is uploaded.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
