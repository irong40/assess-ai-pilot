import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Multi-tenant isolation and hub-and-spoke enforcement tests.
 *
 * These are structural/contract tests that validate the SQL migration files
 * and TypeScript type definitions enforce multi-tenant data isolation.
 * They do NOT require a live database connection.
 */

// Helper to read SQL migration files
function readMigrationFile(filename: string): string {
  const migrationsDir = path.resolve(__dirname, '../../../supabase/migrations');
  const files = fs.readdirSync(migrationsDir);
  const match = files.find((f) => f.includes(filename));
  if (!match) throw new Error(`Migration file containing "${filename}" not found`);
  return fs.readFileSync(path.join(migrationsDir, match), 'utf-8');
}

describe('Multi-tenant Isolation', () => {
  describe('agent_tasks table', () => {
    it('has company_id as NOT NULL column', () => {
      const sql = readMigrationFile('agent_infrastructure');
      // company_id UUID NOT NULL REFERENCES
      expect(sql).toMatch(/company_id\s+UUID\s+NOT\s+NULL\s+REFERENCES/i);
    });

    it('has RLS enabled', () => {
      const sql = readMigrationFile('agent_infrastructure');
      expect(sql).toMatch(/ALTER\s+TABLE\s+public\.agent_tasks\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/i);
    });

    it('has RLS policy scoped by company_id via profiles', () => {
      const sql = readMigrationFile('agent_infrastructure');
      // Policy should reference profiles.company_id
      expect(sql).toMatch(/SELECT\s+p\.company_id\s+FROM\s+public\.profiles\s+p/i);
    });
  });

  describe('agent_approvals table', () => {
    it('has company_id as NOT NULL column', () => {
      const sql = readMigrationFile('approval_gates');
      expect(sql).toMatch(/company_id\s+UUID\s+NOT\s+NULL\s+REFERENCES/i);
    });

    it('has RLS enabled', () => {
      const sql = readMigrationFile('approval_gates');
      expect(sql).toMatch(/ALTER\s+TABLE\s+public\.agent_approvals\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/i);
    });

    it('has RLS policy scoped by company_id via profiles', () => {
      const sql = readMigrationFile('approval_gates');
      expect(sql).toMatch(/SELECT\s+p\.company_id\s+FROM\s+public\.profiles\s+p/i);
    });

    it('UPDATE policy restricted to admin and issm roles', () => {
      const sql = readMigrationFile('approval_gates');
      expect(sql).toMatch(/IN\s*\(\s*'admin'\s*,\s*'issm'\s*\)/i);
    });
  });

  describe('Hub-and-spoke enforcement', () => {
    it('agent_tasks has CHECK constraint for source_agent', () => {
      const sql = readMigrationFile('agent_infrastructure');
      expect(sql).toMatch(/CONSTRAINT\s+hub_spoke_enforcement/i);
      expect(sql).toMatch(/source_agent\s+IS\s+NULL\s+OR\s+source_agent\s*=\s*'ciso_orchestrator'/i);
    });

    it('agent_tasks has delegation_depth limit constraint', () => {
      const sql = readMigrationFile('agent_infrastructure');
      expect(sql).toMatch(/CONSTRAINT\s+delegation_depth_limit/i);
      expect(sql).toMatch(/delegation_depth\s*>=\s*0\s+AND\s+delegation_depth\s*<=\s*3/i);
    });
  });

  describe('Hub-and-spoke in application code', () => {
    it('delegateTask validates source agent is ciso-orchestrator', () => {
      const agentBasePath = path.resolve(
        __dirname,
        '../../../supabase/functions/_shared/agent-base.ts'
      );
      const code = fs.readFileSync(agentBasePath, 'utf-8');
      // Must contain the validation check
      expect(code).toContain('ciso-orchestrator');
      expect(code).toMatch(/agent_type\s*!==\s*['"]ciso-orchestrator['"]/);
    });

    it('delegateTask checks delegation depth against MAX_DELEGATION_DEPTH', () => {
      const agentBasePath = path.resolve(
        __dirname,
        '../../../supabase/functions/_shared/agent-base.ts'
      );
      const code = fs.readFileSync(agentBasePath, 'utf-8');
      expect(code).toContain('MAX_DELEGATION_DEPTH');
      expect(code).toMatch(/delegation_depth.*>=.*MAX_DELEGATION_DEPTH/);
    });

    it('every agent_tasks query in agent-base.ts includes company_id filter', () => {
      const agentBasePath = path.resolve(
        __dirname,
        '../../../supabase/functions/_shared/agent-base.ts'
      );
      const code = fs.readFileSync(agentBasePath, 'utf-8');
      // Count .from("agent_tasks") calls -- these are the tenant-scoped queries
      const agentTasksQueries = (code.match(/\.from\(["']agent_tasks["']\)/g) || []).length;
      const companyIdFilters = (code.match(/\.eq\(['"]company_id['"]/g) || []).length;
      // Every agent_tasks query should have a company_id filter
      // The companies table lookup uses .eq("id", ...) which is correct (PK lookup)
      expect(agentTasksQueries).toBeGreaterThan(0);
      expect(companyIdFilters).toBeGreaterThanOrEqual(agentTasksQueries);
    });
  });
});
