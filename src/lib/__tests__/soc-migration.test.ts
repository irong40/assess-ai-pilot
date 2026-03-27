import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Structural tests for soc_alerts and soc_alert_correlations tables.
 *
 * Validates the database migration at the file level (same pattern as
 * compliance-tracking.test.ts). Verifies:
 * - Tables have correct columns and constraints
 * - RLS is enabled
 * - Indexes exist for common query patterns
 * - CHECK constraints on enums
 */

function readMigrationFile(filename: string): string {
  const migrationsDir = path.resolve(__dirname, '../../../supabase/migrations');
  const files = fs.readdirSync(migrationsDir);
  const match = files.find((f) => f.includes(filename));
  if (!match) throw new Error(`Migration file containing "${filename}" not found`);
  return fs.readFileSync(path.join(migrationsDir, match), 'utf-8');
}

describe('SOC Analyst Tables Migration', () => {
  let sql: string;

  beforeAll(() => {
    sql = readMigrationFile('soc_analyst_tables');
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

  describe('soc_alerts table', () => {
    it('creates table with company_id FK', () => {
      const createBlock = extractCreateTable(sql, 'soc_alerts');
      expect(createBlock).toMatch(/company_id\s+UUID\s+NOT\s+NULL/i);
    });

    it('has agent_task_id column', () => {
      const createBlock = extractCreateTable(sql, 'soc_alerts');
      expect(createBlock).toMatch(/agent_task_id/i);
    });

    it('has threat_intel_id column', () => {
      const createBlock = extractCreateTable(sql, 'soc_alerts');
      expect(createBlock).toMatch(/threat_intel_id/i);
    });

    it('has external_cve_id column', () => {
      const createBlock = extractCreateTable(sql, 'soc_alerts');
      expect(createBlock).toMatch(/external_cve_id/i);
    });

    it('has severity CHECK constraint', () => {
      const createBlock = extractCreateTable(sql, 'soc_alerts');
      expect(createBlock).toMatch(/severity.*CHECK/is);
    });

    it('has classification CHECK constraint', () => {
      const createBlock = extractCreateTable(sql, 'soc_alerts');
      expect(createBlock).toMatch(/classification.*CHECK/is);
    });

    it('has classification_reasoning column', () => {
      const createBlock = extractCreateTable(sql, 'soc_alerts');
      expect(createBlock).toMatch(/classification_reasoning/i);
    });

    it('has escalation_status CHECK constraint', () => {
      const createBlock = extractCreateTable(sql, 'soc_alerts');
      expect(createBlock).toMatch(/escalation_status.*CHECK/is);
    });

    it('has relevance_score with 0-100 range', () => {
      const createBlock = extractCreateTable(sql, 'soc_alerts');
      expect(createBlock).toMatch(/relevance_score/i);
      expect(createBlock).toMatch(/BETWEEN\s+0\s+AND\s+100/i);
    });

    it('has tech_stack_match column', () => {
      const createBlock = extractCreateTable(sql, 'soc_alerts');
      expect(createBlock).toMatch(/tech_stack_match/i);
    });

    it('has affected_controls column', () => {
      const createBlock = extractCreateTable(sql, 'soc_alerts');
      expect(createBlock).toMatch(/affected_controls/i);
    });

    it('has correlation_ids column', () => {
      const createBlock = extractCreateTable(sql, 'soc_alerts');
      expect(createBlock).toMatch(/correlation_ids/i);
    });

    it('has RLS enabled', () => {
      expect(sql).toMatch(/ALTER\s+TABLE\s+(?:public\.)?soc_alerts\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/i);
    });

    it('has index on (company_id, created_at)', () => {
      expect(sql).toMatch(/CREATE\s+INDEX\s+\w+\s+ON\s+(?:public\.)?soc_alerts\s*\(company_id,\s*created_at/i);
    });

    it('has index on (company_id, classification)', () => {
      expect(sql).toMatch(/CREATE\s+INDEX\s+\w+\s+ON\s+(?:public\.)?soc_alerts\s*\(company_id,\s*classification\)/i);
    });

    it('has index on (company_id, severity)', () => {
      expect(sql).toMatch(/CREATE\s+INDEX\s+\w+\s+ON\s+(?:public\.)?soc_alerts\s*\(company_id,\s*severity/i);
    });
  });

  describe('soc_alert_correlations table', () => {
    it('creates table with soc_alert_id FK', () => {
      const createBlock = extractCreateTable(sql, 'soc_alert_correlations');
      expect(createBlock).toMatch(/soc_alert_id/i);
    });

    it('has source_type CHECK constraint', () => {
      const createBlock = extractCreateTable(sql, 'soc_alert_correlations');
      expect(createBlock).toMatch(/source_type.*CHECK/is);
    });

    it('has source_id column', () => {
      const createBlock = extractCreateTable(sql, 'soc_alert_correlations');
      expect(createBlock).toMatch(/source_id/i);
    });

    it('has relevance_score column', () => {
      const createBlock = extractCreateTable(sql, 'soc_alert_correlations');
      expect(createBlock).toMatch(/relevance_score/i);
    });

    it('has correlation_reasoning column', () => {
      const createBlock = extractCreateTable(sql, 'soc_alert_correlations');
      expect(createBlock).toMatch(/correlation_reasoning/i);
    });

    it('has RLS enabled', () => {
      expect(sql).toMatch(/ALTER\s+TABLE\s+(?:public\.)?soc_alert_correlations\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/i);
    });
  });
});
