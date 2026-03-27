/**
 * Agent Dashboard -- operational control plane for the ASSESS-AI multi-agent system.
 *
 * Provides 4 tabs:
 * - Status: real-time agent status grid with Realtime subscription
 * - Activity: task history log with reasoning summaries
 * - Approvals: pending approval queue (admin/issm can approve/reject)
 * - Settings: agent configuration (notifications, auto-approve threshold)
 */
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AgentStatusGrid } from '@/components/agents/AgentStatusGrid';
import { AgentActivityLog } from '@/components/agents/AgentActivityLog';
import { ApprovalQueue } from '@/components/agents/ApprovalQueue';
import { AgentSettingsForm } from '@/components/agents/AgentSettingsForm';
import { useRealtimeAgentStatus } from '@/hooks/useRealtimeAgentStatus';

export default function AgentDashboard() {
  // Subscribe to Realtime changes at page level
  useRealtimeAgentStatus();

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Agent Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Monitor your AI security team
        </p>
      </div>

      <Tabs defaultValue="status" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="status">Status</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="approvals">Approvals</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="status" className="mt-6">
          <AgentStatusGrid />
        </TabsContent>

        <TabsContent value="activity" className="mt-6">
          <AgentActivityLog />
        </TabsContent>

        <TabsContent value="approvals" className="mt-6">
          <ApprovalQueue />
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <AgentSettingsForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}
