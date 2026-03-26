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

  describe('gap_analysis_results table', () => {
    it('creates table with company_id NOT NULL', () => {
      expect(sql).toMatch(/CREATE\s+TABLE\s+public\.gap_analysis_results/i);
      // Extract gap_analysis_results CREATE TABLE block
      const tableMatch = sql.match(/CREATE\s+TABLE\s+public\.gap_analysis_results\s*\([^)]+\)/is);
      expect(tableMatch).not.toBeNull();
      expect(tableMatch![0]).toMatch(/company_id\s+UUID\s+NOT\s+NULL/i);
    });

    it('has RLS enabled', () => {
      expect(sql).toMatch(/ALTER\s+TABLE\s+public\.gap_analysis_results\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/i);
    });

    it('has time-series index on (company_id, created_at DESC)', () => {
      expect(sql).toMatch(/CREATE\s+INDEX.*gap_analysis_results.*company_id.*created_at\s+DESC/i);
    });
  });

  describe('compliance_snapshots table', () => {
    it('creates table with company_id NOT NULL', () => {
      expect(sql).toMatch(/CREATE\s+TABLE\s+public\.compliance_snapshots/i);
      const tableMatch = sql.match(/CREATE\s+TABLE\s+public\.compliance_snapshots\s*\([^)]+\)/is);
      expect(tableMatch).not.toBeNull();
      expect(tableMatch![0]).toMatch(/company_id\s+UUID\s+NOT\s+NULL/i);
    });

    it('has RLS enabled', () => {
      expect(sql).toMatch(/ALTER\s+TABLE\s+public\.compliance_snapshots\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/i);
    });

    it('has time-series index on (company_id, created_at DESC)', () => {
      expect(sql).toMatch(/CREATE\s+INDEX.*compliance_snapshots.*company_id.*created_at\s+DESC/i);
    });

    it('has poam_eligible and critical_controls_met columns', () => {
      const tableMatch = sql.match(/CREATE\s+TABLE\s+public\.compliance_snapshots\s*\([^)]+\)/is);
      expect(tableMatch).not.toBeNull();
      expect(tableMatch![0]).toMatch(/poam_eligible/i);
      expect(tableMatch![0]).toMatch(/critical_controls_met/i);
    });
  });
});
