/**
 * Evidence upload component for associating documents with CMMC controls.
 *
 * Features:
 * - File upload via existing FileUpload component pattern
 * - Searchable control selector (populated from controls table)
 * - Evidence type radio: Examine, Interview, Test (NIST 800-171A methods)
 * - Optional notes field
 * - Submit calls useAddControlEvidence mutation
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAddControlEvidence } from '@/hooks/useControlEvidence';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Upload, FileText, CheckCircle } from 'lucide-react';

type EvidenceType = 'examine' | 'interview' | 'test';

interface ControlOption {
  control_id: string;
  title: string;
  family: string;
}

export default function EvidenceUpload() {
  const { user } = useAuth();
  const { data: profile } = useUserProfile();
  const addEvidence = useAddControlEvidence();

  const [selectedControl, setSelectedControl] = useState('');
  const [evidenceType, setEvidenceType] = useState<EvidenceType>('examine');
  const [notes, setNotes] = useState('');
  const [controlSearch, setControlSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    id: string;
  } | null>(null);

  // Fetch controls for the selector
  const { data: controls } = useQuery({
    queryKey: ['controls-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('controls')
        .select('control_id, title, family')
        .order('control_id');
      if (error) throw error;
      return (data ?? []) as ControlOption[];
    },
  });

  const filteredControls = (controls ?? []).filter(
    (c) =>
      c.control_id.toLowerCase().includes(controlSearch.toLowerCase()) ||
      c.title.toLowerCase().includes(controlSearch.toLowerCase())
  );

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !user) return;

    setUploading(true);
    try {
      const file = files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}-${Math.random()}.${fileExt}`;

      const { error } = await supabase.storage
        .from('assessment-documents')
        .upload(fileName, file);

      if (error) throw error;

      setUploadedFile({ name: file.name, id: fileName });
      toast({
        title: 'File uploaded',
        description: `${file.name} uploaded successfully`,
      });
    } catch (error: unknown) {
      toast({
        title: 'Upload failed',
        description:
          error instanceof Error ? error.message : 'Failed to upload file',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedControl || !uploadedFile || !profile?.company_id) {
      toast({
        title: 'Missing fields',
        description: 'Please select a control and upload a document',
        variant: 'destructive',
      });
      return;
    }

    addEvidence.mutate(
      {
        company_id: profile.company_id,
        control_id: selectedControl,
        document_id: uploadedFile.id,
        document_name: uploadedFile.name,
        evidence_type: evidenceType,
        notes: notes || undefined,
        uploaded_by: user?.id,
      },
      {
        onSuccess: () => {
          toast({
            title: 'Evidence linked',
            description: `${uploadedFile.name} linked to ${selectedControl}`,
          });
          // Clear form
          setSelectedControl('');
          setEvidenceType('examine');
          setNotes('');
          setUploadedFile(null);
          setControlSearch('');
        },
      }
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Evidence
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Upload */}
        <div className="space-y-2">
          <Label>Document</Label>
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
            {uploadedFile ? (
              <div className="flex items-center justify-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium">{uploadedFile.name}</span>
              </div>
            ) : (
              <>
                <FileText className="h-6 w-6 text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-600 mb-2">
                  Select a document to upload
                </p>
              </>
            )}
            <input
              type="file"
              accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.csv,.xlsx"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
              id="evidence-file-upload"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                document.getElementById('evidence-file-upload')?.click()
              }
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : 'Select File'}
            </Button>
          </div>
        </div>

        {/* Control Selector */}
        <div className="space-y-2">
          <Label>Control</Label>
          <Input
            placeholder="Search controls (e.g. 3.5.3 or MFA)..."
            value={controlSearch}
            onChange={(e) => setControlSearch(e.target.value)}
          />
          {controlSearch && filteredControls.length > 0 && (
            <div className="border rounded-md max-h-40 overflow-y-auto">
              {filteredControls.slice(0, 20).map((c) => (
                <button
                  key={c.control_id}
                  type="button"
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-100 ${
                    selectedControl === c.control_id ? 'bg-blue-50 font-medium' : ''
                  }`}
                  onClick={() => {
                    setSelectedControl(c.control_id);
                    setControlSearch(`${c.control_id} - ${c.title}`);
                  }}
                >
                  <span className="font-mono text-xs text-slate-500">
                    {c.control_id}
                  </span>{' '}
                  {c.title}
                </button>
              ))}
            </div>
          )}
          {selectedControl && (
            <p className="text-xs text-green-600">
              Selected: {selectedControl}
            </p>
          )}
        </div>

        {/* Evidence Type Radio */}
        <div className="space-y-2">
          <Label>Evidence Type</Label>
          <RadioGroup
            value={evidenceType}
            onValueChange={(v) => setEvidenceType(v as EvidenceType)}
            className="flex flex-col gap-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="examine" id="type-examine" />
              <Label htmlFor="type-examine" className="font-normal cursor-pointer">
                Examine (documents, policies, configs)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="interview" id="type-interview" />
              <Label htmlFor="type-interview" className="font-normal cursor-pointer">
                Interview (discussions, personnel)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="test" id="type-test" />
              <Label htmlFor="type-test" className="font-normal cursor-pointer">
                Test (live demonstrations)
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label>Notes (optional)</Label>
          <Textarea
            placeholder="Add any relevant notes about this evidence..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </div>

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          disabled={!selectedControl || !uploadedFile || addEvidence.isPending}
          className="w-full"
        >
          {addEvidence.isPending ? 'Linking Evidence...' : 'Link Evidence to Control'}
        </Button>
      </CardContent>
    </Card>
  );
}
