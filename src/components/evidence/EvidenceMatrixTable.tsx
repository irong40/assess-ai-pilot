/**
 * Evidence matrix data table component.
 *
 * Displays all evidence records in a sortable, filterable table.
 * Columns: Control ID, Control Title, Family, Document Name, Evidence Type, Upload Date
 * Empty state when no evidence exists yet.
 */
import { useState, useMemo } from 'react';
import { useControlEvidenceMatrix } from '@/hooks/useControlEvidence';
import type { EvidenceMatrixRow } from '@/hooks/useControlEvidence';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FileSpreadsheet, ArrowUpDown, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

type SortField = keyof EvidenceMatrixRow;
type SortDir = 'asc' | 'desc';

function getEvidenceTypeBadge(type: string) {
  const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
    examine: 'default',
    interview: 'secondary',
    test: 'outline',
  };
  return (
    <Badge variant={variants[type] ?? 'default'}>
      {type.charAt(0).toUpperCase() + type.slice(1)}
    </Badge>
  );
}

export default function EvidenceMatrixTable() {
  const { data: matrix, isLoading } = useControlEvidenceMatrix();
  const [sortField, setSortField] = useState<SortField>('control_id');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [familyFilter, setFamilyFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const filteredAndSorted = useMemo(() => {
    let rows = matrix ?? [];

    // Filter by family
    if (familyFilter) {
      rows = rows.filter((r) => r.family_id === familyFilter);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.control_id.toLowerCase().includes(term) ||
          r.control_title.toLowerCase().includes(term) ||
          r.document_name.toLowerCase().includes(term)
      );
    }

    // Sort
    return [...rows].sort((a, b) => {
      const aVal = String(a[sortField] ?? '');
      const bVal = String(b[sortField] ?? '');
      const cmp = aVal.localeCompare(bVal);
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [matrix, sortField, sortDir, familyFilter, searchTerm]);

  // Extract unique families for filter
  const families = useMemo(() => {
    const set = new Set((matrix ?? []).map((r) => r.family_id));
    return Array.from(set).sort();
  }, [matrix]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading evidence matrix...
        </CardContent>
      </Card>
    );
  }

  const SortButton = ({
    field,
    children,
  }: {
    field: SortField;
    children: React.ReactNode;
  }) => (
    <Button
      variant="ghost"
      size="sm"
      className="h-auto p-0 font-medium hover:bg-transparent"
      onClick={() => handleSort(field)}
    >
      {children}
      <ArrowUpDown className="ml-1 h-3 w-3" />
    </Button>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Evidence Matrix
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search controls or documents..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="border rounded-md px-3 py-2 text-sm bg-background"
            value={familyFilter}
            onChange={(e) => setFamilyFilter(e.target.value)}
          >
            <option value="">All Families</option>
            {families.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>

        {/* Table */}
        {filteredAndSorted.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileSpreadsheet className="h-8 w-8 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No evidence uploaded yet</p>
            <p className="text-sm mt-1">
              Upload documents and associate them with controls.
            </p>
          </div>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <SortButton field="control_id">Control ID</SortButton>
                  </TableHead>
                  <TableHead>
                    <SortButton field="control_title">Control Title</SortButton>
                  </TableHead>
                  <TableHead>
                    <SortButton field="family_id">Family</SortButton>
                  </TableHead>
                  <TableHead>
                    <SortButton field="document_name">Document Name</SortButton>
                  </TableHead>
                  <TableHead>Evidence Type</TableHead>
                  <TableHead>
                    <SortButton field="uploaded_at">Upload Date</SortButton>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSorted.map((row, idx) => (
                  <TableRow key={`${row.control_id}-${row.document_name}-${idx}`}>
                    <TableCell className="font-mono text-xs">
                      {row.control_id}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {row.control_title}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {row.family_id}
                    </TableCell>
                    <TableCell>{row.document_name}</TableCell>
                    <TableCell>{getEvidenceTypeBadge(row.evidence_type)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {row.uploaded_at}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
