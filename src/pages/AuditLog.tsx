import { AppLayout } from '@/components/layout/AppLayout';
import AuditLogViewer from '@/components/audit/AuditLogViewer';

export default function AuditLog() {
  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Audit Log</h1>
          <p className="text-muted-foreground">
            View system activity and security audit events
          </p>
        </div>
        <AuditLogViewer />
      </div>
    </AppLayout>
  );
}
