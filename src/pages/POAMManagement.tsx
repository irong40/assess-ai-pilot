import { AppLayout } from '@/components/layout/AppLayout';
import POAMManager from '@/components/poam/POAMManager';

export default function POAMManagement() {
  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">POA&M Management</h1>
          <p className="text-muted-foreground">
            Track and manage your Plan of Action and Milestones
          </p>
        </div>
        <POAMManager />
      </div>
    </AppLayout>
  );
}
