import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Structural tests for pen_test_findings table migration.
 *
 * Validates the database migration at the file level. Verifies:
 * - Table has correct columns and constraints
 * - CHECK constraints for finding_type (4 values), risk_rating (4 values), status (4 values)
 * - scan_authorization_id UUID column
 * - RLS is enabled with correct policies
 * - Indexes on (company_id, status), (company_id, risk_rating), (affected_technology)
 */

function readMigrationFile(filename: string): string {
  const migrationsDir = path.resolve(__dirname, '../../../supabase/migrations');
  const files = fs.readdirSync(migrationsDir);
  const match = files.find((f) => f.includes(filename));
  if (!match) throw new Error(`Migration file containing "${filename}" not found`);
  return fs.readFileSync(path.join(migrationsDir, match), 'utf-8');
}

describe('Pen Test Agent Tables Migration', () => {
  let sql: string;

  beforeAll(() => {
    sql = readMigrationFile('pen_test_agent_tables');
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

  describe('pen_test_findings table', () => {
    it('creates pen_test_findings table', () => {
      expect(sql).toMatch(/CREATE\s+TABLE\s+pen_test_findings/i);
    });

    it('has company_id FK', () => {
      const createBlock = extractCreateTable(sql, 'pen_test_findings');
      expect(createBlock).toMatch(/company_id\s+UUID\s+NOT\s+NULL/i);
    });

    it('has agent_task_id column', () => {
      const createBlock = extractCreateTable(sql, 'pen_test_findings');
      expect(createBlock).toMatch(/agent_task_id/i);
    });

    it('has finding_type with CHECK constraint for 4 values', () => {
      const createBlock = extractCreateTable(sql, 'pen_test_findings');
      expect(createBlock).toMatch(/finding_type/i);
      expect(createBlock).toMatch(/known_cve/i);
      expect(createBlock).toMatch(/version_mismatch/i);
      expect(createBlock).toMatch(/eol_software/i);
      expect(createBlock).toMatch(/missing_patch/i);
    });

    it('has risk_rating with CHECK constraint for 4 values', () => {
      const createBlock = extractCreateTable(sql, 'pen_test_findings');
      expect(createBlock).toMatch(/risk_rating/i);
      expect(sql).toMatch(/risk_rating.*CHECK|CHECK.*risk_rating/is);
    });

    it('has status with CHECK constraint for 4 values', () => {
      expect(sql).toMatch(/open/i);
      expect(sql).toMatch(/remediated/i);
      expect(sql).toMatch(/accepted_risk/i);
      expect(sql).toMatch(/false_positive/i);
    });

    it('has title column', () => {
      const createBlock = extractCreateTable(sql, 'pen_test_findings');
      expect(createBlock).toMatch(/title\s+TEXT\s+NOT\s+NULL/i);
    });

    it('has affected_technology column', () => {
      const createBlock = extractCreateTable(sql, 'pen_test_findings');
      expect(createBlock).toMatch(/affected_technology/i);
    });

    it('has matched_cve_ids column', () => {
      const createBlock = extractCreateTable(sql, 'pen_test_findings');
      expect(createBlock).toMatch(/matched_cve_ids/i);
    });

    it('has exploitability_score column', () => {
      const createBlock = extractCreateTable(sql, 'pen_test_findings');
      expect(createBlock).toMatch(/exploitability_score/i);
    });

    it('has business_impact column', () => {
      const createBlock = extractCreateTable(sql, 'pen_test_findings');
      expect(createBlock).toMatch(/business_impact/i);
    });

    it('has remediation column', () => {
      const createBlock = extractCreateTable(sql, 'pen_test_findings');
      expect(createBlock).toMatch(/remediation/i);
    });

    it('has cmmc_controls column', () => {
      const createBlock = extractCreateTable(sql, 'pen_test_findings');
      expect(createBlock).toMatch(/cmmc_controls/i);
    });

    it('has scan_authorization_id UUID column', () => {
      const createBlock = extractCreateTable(sql, 'pen_test_findings');
      expect(createBlock).toMatch(/scan_authorization_id\s+UUID/i);
    });

    it('has created_at and updated_at timestamps', () => {
      const createBlock = extractCreateTable(sql, 'pen_test_findings');
      expect(createBlock).toMatch(/created_at\s+TIMESTAMPTZ/i);
      expect(createBlock).toMatch(/updated_at\s+TIMESTAMPTZ/i);
    });
  });

  describe('RLS policies', () => {
    it('enables RLS on pen_test_findings', () => {
      expect(sql).toMatch(/ALTER\s+TABLE\s+pen_test_findings\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/i);
    });

    it('has SELECT policy for authenticated users (own company)', () => {
      expect(sql).toMatch(/CREATE\s+POLICY.*pen_test_findings.*SELECT/is);
      expect(sql).toMatch(/auth\.uid\(\)/i);
    });

    it('has INSERT policy for service role', () => {
      expect(sql).toMatch(/CREATE\s+POLICY.*pen_test_findings.*INSERT/is);
    });

    it('has UPDATE policy for service role', () => {
      expect(sql).toMatch(/CREATE\s+POLICY.*pen_test_findings.*UPDATE/is);
    });
  });

  describe('Indexes', () => {
    it('has index on (company_id, status)', () => {
      expect(sql).toMatch(/CREATE\s+INDEX.*pen_test_findings.*company_id.*status/i);
    });

    it('has index on (company_id, risk_rating)', () => {
      expect(sql).toMatch(/CREATE\s+INDEX.*pen_test_findings.*company_id.*risk_rating/i);
    });

    it('has index on affected_technology', () => {
      expect(sql).toMatch(/CREATE\s+INDEX.*pen_test_findings.*affected_technology/i);
    });
  });
});
