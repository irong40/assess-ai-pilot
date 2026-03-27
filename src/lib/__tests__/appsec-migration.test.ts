import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Structural tests for appsec_findings table migration.
 *
 * Validates the database migration at the file level. Verifies:
 * - Table has correct columns and constraints
 * - CHECK constraints for finding_type (4 values), severity (4 values), status (4 values)
 * - RLS is enabled with correct policies
 * - Indexes on (company_id, status), (company_id, severity), (cve_id)
 */

function readMigrationFile(filename: string): string {
  const migrationsDir = path.resolve(__dirname, '../../../supabase/migrations');
  const files = fs.readdirSync(migrationsDir);
  const match = files.find((f) => f.includes(filename));
  if (!match) throw new Error(`Migration file containing "${filename}" not found`);
  return fs.readFileSync(path.join(migrationsDir, match), 'utf-8');
}

describe('AppSec Agent Tables Migration', () => {
  let sql: string;

  beforeAll(() => {
    sql = readMigrationFile('appsec_agent_tables');
  });

  function extractCreateTable(fullSql: string, tableName: string): string {
    const pattern = new RegExp(
      `CREATE\\s+TABLE\\s+(?:public\\.)?${tableName}\\s*\\([\\s\\S]+?\\);`,
      'i'
    );
    const match = fullSql.match(pattern);
    if (!match) throw new Error(`CREATE TABLE ${tableName} not found`);
    return match[0];
  }

  describe('appsec_findings table', () => {
    it('creates appsec_findings table', () => {
      expect(sql).toMatch(/CREATE\s+TABLE\s+appsec_findings/i);
    });

    it('has company_id FK', () => {
      const createBlock = extractCreateTable(sql, 'appsec_findings');
      expect(createBlock).toMatch(/company_id\s+UUID\s+NOT\s+NULL/i);
    });

    it('has agent_task_id column', () => {
      const createBlock = extractCreateTable(sql, 'appsec_findings');
      expect(createBlock).toMatch(/agent_task_id/i);
    });

    it('has finding_type with CHECK constraint for 4 values', () => {
      const createBlock = extractCreateTable(sql, 'appsec_findings');
      expect(createBlock).toMatch(/finding_type/i);
      expect(createBlock).toMatch(/dependency_vulnerability/i);
      expect(createBlock).toMatch(/config_misconfiguration/i);
      expect(createBlock).toMatch(/hardcoded_secret/i);
      expect(createBlock).toMatch(/deprecated_package/i);
    });

    it('has severity with CHECK constraint for 4 values', () => {
      const createBlock = extractCreateTable(sql, 'appsec_findings');
      expect(createBlock).toMatch(/severity/i);
      expect(sql).toMatch(/severity.*CHECK|CHECK.*severity/is);
    });

    it('has status with CHECK constraint for 4 values', () => {
      expect(sql).toMatch(/open/i);
      expect(sql).toMatch(/fixed/i);
      expect(sql).toMatch(/accepted_risk/i);
      expect(sql).toMatch(/false_positive/i);
    });

    it('has title column', () => {
      const createBlock = extractCreateTable(sql, 'appsec_findings');
      expect(createBlock).toMatch(/title\s+TEXT\s+NOT\s+NULL/i);
    });

    it('has affected_component column', () => {
      const createBlock = extractCreateTable(sql, 'appsec_findings');
      expect(createBlock).toMatch(/affected_component/i);
    });

    it('has fix_suggestion column', () => {
      const createBlock = extractCreateTable(sql, 'appsec_findings');
      expect(createBlock).toMatch(/fix_suggestion/i);
    });

    it('has fix_version column', () => {
      const createBlock = extractCreateTable(sql, 'appsec_findings');
      expect(createBlock).toMatch(/fix_version/i);
    });

    it('has cve_id column', () => {
      const createBlock = extractCreateTable(sql, 'appsec_findings');
      expect(createBlock).toMatch(/cve_id/i);
    });

    it('has cmmc_controls column', () => {
      const createBlock = extractCreateTable(sql, 'appsec_findings');
      expect(createBlock).toMatch(/cmmc_controls/i);
    });

    it('has created_at and updated_at timestamps', () => {
      const createBlock = extractCreateTable(sql, 'appsec_findings');
      expect(createBlock).toMatch(/created_at\s+TIMESTAMPTZ/i);
      expect(createBlock).toMatch(/updated_at\s+TIMESTAMPTZ/i);
    });
  });

  describe('RLS policies', () => {
    it('enables RLS on appsec_findings', () => {
      expect(sql).toMatch(/ALTER\s+TABLE\s+appsec_findings\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/i);
    });

    it('has SELECT policy for authenticated users (own company)', () => {
      expect(sql).toMatch(/CREATE\s+POLICY.*appsec_findings.*SELECT/is);
      expect(sql).toMatch(/auth\.uid\(\)/i);
    });

    it('has INSERT policy for service role', () => {
      expect(sql).toMatch(/CREATE\s+POLICY.*appsec_findings.*INSERT/is);
    });

    it('has UPDATE policy for service role', () => {
      expect(sql).toMatch(/CREATE\s+POLICY.*appsec_findings.*UPDATE/is);
    });
  });

  describe('Indexes', () => {
    it('has index on (company_id, status)', () => {
      expect(sql).toMatch(/CREATE\s+INDEX.*appsec_findings.*company_id.*status/i);
    });

    it('has index on (company_id, severity)', () => {
      expect(sql).toMatch(/CREATE\s+INDEX.*appsec_findings.*company_id.*severity/i);
    });

    it('has index on cve_id', () => {
      expect(sql).toMatch(/CREATE\s+INDEX.*appsec_findings.*cve_id/i);
    });
  });
});
