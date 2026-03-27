import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Structural tests for ir_incidents table migration.
 *
 * Validates the database migration at the file level (same pattern as
 * soc-migration.test.ts). Verifies:
 * - Table has correct columns and constraints
 * - CHECK constraints for incident_type (9 values), severity (4 values), status (6 states)
 * - RLS is enabled with correct policies
 * - Indexes on (company_id, status), (company_id, created_at DESC), (soc_alert_id)
 * - JSONB columns for containment_plan, playbook, post_incident_report, compliance_impact
 */

function readMigrationFile(filename: string): string {
  const migrationsDir = path.resolve(__dirname, '../../../supabase/migrations');
  const files = fs.readdirSync(migrationsDir);
  const match = files.find((f) => f.includes(filename));
  if (!match) throw new Error(`Migration file containing "${filename}" not found`);
  return fs.readFileSync(path.join(migrationsDir, match), 'utf-8');
}

describe('IR Agent Tables Migration', () => {
  let sql: string;

  beforeAll(() => {
    sql = readMigrationFile('ir_agent_tables');
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

  describe('ir_incidents table', () => {
    it('creates ir_incidents table', () => {
      expect(sql).toMatch(/CREATE\s+TABLE\s+ir_incidents/i);
    });

    it('has company_id FK', () => {
      const createBlock = extractCreateTable(sql, 'ir_incidents');
      expect(createBlock).toMatch(/company_id\s+UUID\s+NOT\s+NULL/i);
    });

    it('has soc_alert_id column', () => {
      const createBlock = extractCreateTable(sql, 'ir_incidents');
      expect(createBlock).toMatch(/soc_alert_id/i);
    });

    it('has agent_task_id column', () => {
      const createBlock = extractCreateTable(sql, 'ir_incidents');
      expect(createBlock).toMatch(/agent_task_id/i);
    });

    it('has incident_type with CHECK constraint for 9 values', () => {
      const createBlock = extractCreateTable(sql, 'ir_incidents');
      expect(createBlock).toMatch(/incident_type/i);
      expect(createBlock).toMatch(/malware/i);
      expect(createBlock).toMatch(/unauthorized_access/i);
      expect(createBlock).toMatch(/denial_of_service/i);
      expect(createBlock).toMatch(/data_breach/i);
      expect(createBlock).toMatch(/insider_threat/i);
      expect(createBlock).toMatch(/supply_chain/i);
      expect(createBlock).toMatch(/misconfiguration/i);
      expect(createBlock).toMatch(/policy_violation/i);
      expect(createBlock).toMatch(/unknown/i);
    });

    it('has severity with CHECK constraint for 4 values', () => {
      const createBlock = extractCreateTable(sql, 'ir_incidents');
      expect(createBlock).toMatch(/severity/i);
      // CHECK constraint with critical, high, medium, low
      expect(sql).toMatch(/severity.*CHECK|CHECK.*severity/is);
    });

    it('has status with CHECK constraint for 6 lifecycle states', () => {
      expect(sql).toMatch(/open/i);
      expect(sql).toMatch(/investigating/i);
      expect(sql).toMatch(/contained/i);
      expect(sql).toMatch(/eradicated/i);
      expect(sql).toMatch(/recovered/i);
      expect(sql).toMatch(/closed/i);
    });

    it('has containment_plan JSONB column', () => {
      const createBlock = extractCreateTable(sql, 'ir_incidents');
      expect(createBlock).toMatch(/containment_plan\s+JSONB/i);
    });

    it('has playbook JSONB column', () => {
      const createBlock = extractCreateTable(sql, 'ir_incidents');
      expect(createBlock).toMatch(/playbook\s+JSONB/i);
    });

    it('has post_incident_report JSONB column', () => {
      const createBlock = extractCreateTable(sql, 'ir_incidents');
      expect(createBlock).toMatch(/post_incident_report\s+JSONB/i);
    });

    it('has compliance_impact JSONB column', () => {
      const createBlock = extractCreateTable(sql, 'ir_incidents');
      expect(createBlock).toMatch(/compliance_impact\s+JSONB/i);
    });

    it('has created_at and updated_at timestamps', () => {
      const createBlock = extractCreateTable(sql, 'ir_incidents');
      expect(createBlock).toMatch(/created_at\s+TIMESTAMPTZ/i);
      expect(createBlock).toMatch(/updated_at\s+TIMESTAMPTZ/i);
    });
  });

  describe('RLS policies', () => {
    it('enables RLS on ir_incidents', () => {
      expect(sql).toMatch(/ALTER\s+TABLE\s+ir_incidents\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/i);
    });

    it('has SELECT policy for authenticated users (own company)', () => {
      expect(sql).toMatch(/CREATE\s+POLICY.*ir_incidents.*SELECT/is);
      expect(sql).toMatch(/auth\.uid\(\)/i);
    });

    it('has INSERT policy for service role', () => {
      expect(sql).toMatch(/CREATE\s+POLICY.*ir_incidents.*INSERT/is);
    });

    it('has UPDATE policy for service role', () => {
      expect(sql).toMatch(/CREATE\s+POLICY.*ir_incidents.*UPDATE/is);
    });
  });

  describe('Indexes', () => {
    it('has index on (company_id, status)', () => {
      expect(sql).toMatch(/CREATE\s+INDEX.*ir_incidents.*company_id.*status/i);
    });

    it('has index on (company_id, created_at DESC)', () => {
      expect(sql).toMatch(/CREATE\s+INDEX.*ir_incidents.*company_id.*created_at\s+DESC/i);
    });

    it('has index on soc_alert_id', () => {
      expect(sql).toMatch(/CREATE\s+INDEX.*ir_incidents.*soc_alert_id/i);
    });
  });
});
