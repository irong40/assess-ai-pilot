import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Structural tests for gap_analysis_results and compliance_snapshots tables.
 *
 * These tests validate the database migration at the file level (same pattern
 * as data-architecture.test.ts). They verify:
 * - Tables have company_id NOT NULL
 * - RLS is enabled
 * - Time-series indexes exist on (company_id, created_at DESC)
 * - compliance_snapshots has poam_eligible and critical_controls_met columns
 */

function readMigrationFile(filename: string): string {
  const migrationsDir = path.resolve(__dirname, '../../../supabase/migrations');
  const files = fs.readdirSync(migrationsDir);
  const match = files.find((f) => f.includes(filename));
  if (!match) throw new Error(`Migration file containing "${filename}" not found`);
  return fs.readFileSync(path.join(migrationsDir, match), 'utf-8');
}

describe('Gap Analysis Tables Migration', () => {
  let sql: string;

  beforeAll(() => {
    sql = readMigrationFile('gap_analysis_tables');
  });

  // Helper: extract CREATE TABLE block including nested parentheses
  // Uses the text between "CREATE TABLE public.<name> (" and the next ");" at line start
  function extractCreateTable(fullSql: string, tableName: string): string {
    const pattern = new RegExp(
      `CREATE\\s+TABLE\\s+public\\.${tableName}\\s*\\([\\s\\S]+?\\);`,
      'i'
    );
    const match = fullSql.match(pattern);
    if (!match) throw new Error(`CREATE TABLE public.${tableName} not found`);
    return match[0];
  }

  describe('gap_analysis_results table', () => {
    it('creates table with company_id NOT NULL', () => {
      const createBlock = extractCreateTable(sql, 'gap_analysis_results');
      expect(createBlock).toMatch(/company_id\s+UUID\s+NOT\s+NULL/i);
    });

    it('has RLS enabled', () => {
      expect(sql).toMatch(/ALTER\s+TABLE\s+public\.gap_analysis_results\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/i);
    });

    it('has time-series index on (company_id, created_at DESC)', () => {
      // Index may span multiple lines; check the full SQL
      expect(sql).toMatch(/CREATE\s+INDEX\s+\w+\s+ON\s+public\.gap_analysis_results\s*\(company_id,\s*created_at\s+DESC\)/i);
    });
  });

  describe('compliance_snapshots table', () => {
    it('creates table with company_id NOT NULL', () => {
      const createBlock = extractCreateTable(sql, 'compliance_snapshots');
      expect(createBlock).toMatch(/company_id\s+UUID\s+NOT\s+NULL/i);
    });

    it('has RLS enabled', () => {
      expect(sql).toMatch(/ALTER\s+TABLE\s+public\.compliance_snapshots\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/i);
    });

    it('has time-series index on (company_id, created_at DESC)', () => {
      expect(sql).toMatch(/CREATE\s+INDEX\s+\w+\s+ON\s+public\.compliance_snapshots\s*\(company_id,\s*created_at\s+DESC\)/i);
    });

    it('has poam_eligible and critical_controls_met columns', () => {
      const createBlock = extractCreateTable(sql, 'compliance_snapshots');
      expect(createBlock).toMatch(/poam_eligible/i);
      expect(createBlock).toMatch(/critical_controls_met/i);
    });
  });
});
