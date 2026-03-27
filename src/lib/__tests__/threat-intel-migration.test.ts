import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Structural tests for threat_briefs and ioc_tracking tables.
 *
 * Validates the database migration at the file level (same pattern as
 * soc-migration.test.ts). Verifies:
 * - Tables have correct columns and constraints
 * - RLS is enabled
 * - Indexes exist for common query patterns
 * - 90-day TTL default on ioc_tracking.expires_at
 * - UNIQUE constraint on ioc_tracking(company_id, indicator_type, indicator_value)
 */

function readMigrationFile(filename: string): string {
  const migrationsDir = path.resolve(__dirname, '../../../supabase/migrations');
  const files = fs.readdirSync(migrationsDir);
  const match = files.find((f) => f.includes(filename));
  if (!match) throw new Error(`Migration file containing "${filename}" not found`);
  return fs.readFileSync(path.join(migrationsDir, match), 'utf-8');
}

describe('Threat Intel Tables Migration', () => {
  let sql: string;

  beforeAll(() => {
    sql = readMigrationFile('threat_intel_tables');
  });

  // Helper: extract CREATE TABLE block including nested parentheses
  function extractCreateTable(fullSql: string, tableName: string): string {
    const pattern = new RegExp(
      `CREATE\\s+TABLE\\s+(?:public\\.)?${tableName}\\s*\\([\\s\\S]+?\\);`,
      'i'
    );
    const match = fullSql.match(pattern);
    if (!match) throw new Error(`CREATE TABLE ${tableName} not found`);
    return match[0];
  }

  describe('threat_briefs table', () => {
    it('creates table with company_id FK', () => {
      const createBlock = extractCreateTable(sql, 'threat_briefs');
      expect(createBlock).toMatch(/company_id\s+UUID\s+NOT\s+NULL/i);
    });

    it('has agent_task_id column', () => {
      const createBlock = extractCreateTable(sql, 'threat_briefs');
      expect(createBlock).toMatch(/agent_task_id/i);
    });

    it('has title column', () => {
      const createBlock = extractCreateTable(sql, 'threat_briefs');
      expect(createBlock).toMatch(/title\s+TEXT/i);
    });

    it('has executive_summary column', () => {
      const createBlock = extractCreateTable(sql, 'threat_briefs');
      expect(createBlock).toMatch(/executive_summary/i);
    });

    it('has threat_count column', () => {
      const createBlock = extractCreateTable(sql, 'threat_briefs');
      expect(createBlock).toMatch(/threat_count/i);
    });

    it('has affected_controls JSONB column', () => {
      const createBlock = extractCreateTable(sql, 'threat_briefs');
      expect(createBlock).toMatch(/affected_controls\s+JSONB/i);
    });

    it('has risk_summary JSONB column', () => {
      const createBlock = extractCreateTable(sql, 'threat_briefs');
      expect(createBlock).toMatch(/risk_summary\s+JSONB/i);
    });

    it('has generated_at column', () => {
      const createBlock = extractCreateTable(sql, 'threat_briefs');
      expect(createBlock).toMatch(/generated_at/i);
    });

    it('has created_at and updated_at columns', () => {
      const createBlock = extractCreateTable(sql, 'threat_briefs');
      expect(createBlock).toMatch(/created_at/i);
      expect(createBlock).toMatch(/updated_at/i);
    });

    it('has RLS enabled', () => {
      expect(sql).toMatch(
        /ALTER\s+TABLE\s+(?:public\.)?threat_briefs\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/i
      );
    });

    it('has index on (company_id, generated_at DESC)', () => {
      expect(sql).toMatch(
        /CREATE\s+INDEX\s+\w+\s+ON\s+(?:public\.)?threat_briefs\s*\(company_id,\s*generated_at/i
      );
    });
  });

  describe('ioc_tracking table', () => {
    it('creates table with company_id FK', () => {
      const createBlock = extractCreateTable(sql, 'ioc_tracking');
      expect(createBlock).toMatch(/company_id\s+UUID\s+NOT\s+NULL/i);
    });

    it('has threat_brief_id FK column', () => {
      const createBlock = extractCreateTable(sql, 'ioc_tracking');
      expect(createBlock).toMatch(/threat_brief_id/i);
    });

    it('has indicator_type with CHECK constraint', () => {
      const createBlock = extractCreateTable(sql, 'ioc_tracking');
      expect(createBlock).toMatch(/indicator_type.*CHECK/is);
    });

    it('has indicator_value column', () => {
      const createBlock = extractCreateTable(sql, 'ioc_tracking');
      expect(createBlock).toMatch(/indicator_value/i);
    });

    it('has confidence_level with CHECK constraint', () => {
      const createBlock = extractCreateTable(sql, 'ioc_tracking');
      expect(createBlock).toMatch(/confidence_level.*CHECK/is);
    });

    it('has source_cve column', () => {
      const createBlock = extractCreateTable(sql, 'ioc_tracking');
      expect(createBlock).toMatch(/source_cve/i);
    });

    it('has is_active column with DEFAULT true', () => {
      const createBlock = extractCreateTable(sql, 'ioc_tracking');
      expect(createBlock).toMatch(/is_active\s+BOOLEAN.*DEFAULT\s+true/i);
    });

    it('has first_seen and last_seen columns', () => {
      const createBlock = extractCreateTable(sql, 'ioc_tracking');
      expect(createBlock).toMatch(/first_seen/i);
      expect(createBlock).toMatch(/last_seen/i);
    });

    it('has expires_at with 90-day TTL default', () => {
      const createBlock = extractCreateTable(sql, 'ioc_tracking');
      expect(createBlock).toMatch(/expires_at.*DEFAULT.*90/is);
    });

    it('has UNIQUE constraint on (company_id, indicator_type, indicator_value)', () => {
      expect(sql).toMatch(
        /UNIQUE\s*\(\s*company_id\s*,\s*indicator_type\s*,\s*indicator_value\s*\)/i
      );
    });

    it('has created_at and updated_at columns', () => {
      const createBlock = extractCreateTable(sql, 'ioc_tracking');
      expect(createBlock).toMatch(/created_at/i);
      expect(createBlock).toMatch(/updated_at/i);
    });

    it('has RLS enabled', () => {
      expect(sql).toMatch(
        /ALTER\s+TABLE\s+(?:public\.)?ioc_tracking\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/i
      );
    });

    it('has partial index on active IOCs', () => {
      expect(sql).toMatch(
        /CREATE\s+INDEX\s+\w+\s+ON\s+(?:public\.)?ioc_tracking[\s\S]*?WHERE\s+is_active\s*=\s*true/i
      );
    });

    it('has index related to expiry', () => {
      expect(sql).toMatch(
        /CREATE\s+INDEX\s+\w+\s+ON\s+(?:public\.)?ioc_tracking[\s\S]*?expires_at/i
      );
    });
  });
});
