import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

/**
 * CUI-free data architecture validation tests.
 *
 * These are "architecture decision record" tests that document and enforce
 * the CUI-free data handling decision at the code level. They verify:
 * - No table stores actual CUI content
 * - Controls table is public reference data (no company_id)
 * - Multi-tenant tables have company_id NOT NULL
 * - AIRiskAnalysisService is identified as a mock
 *
 * These tests do NOT require a live database connection.
 */

// Helper to read SQL migration files
function readMigrationFile(filename: string): string {
  const migrationsDir = path.resolve(__dirname, '../../../supabase/migrations');
  const files = fs.readdirSync(migrationsDir);
  const match = files.find((f) => f.includes(filename));
  if (!match) throw new Error(`Migration file containing "${filename}" not found`);
  return fs.readFileSync(path.join(migrationsDir, match), 'utf-8');
}

// Helper to read all migration SQL files concatenated
function readAllMigrations(): string {
  const migrationsDir = path.resolve(__dirname, '../../../supabase/migrations');
  const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql'));
  return files.map((f) => fs.readFileSync(path.join(migrationsDir, f), 'utf-8')).join('\n');
}

describe('CUI-free Data Architecture', () => {
  describe('No CUI-holding columns', () => {
    it('no column named document_content exists in any migration', () => {
      const allSql = readAllMigrations();
      expect(allSql.toLowerCase()).not.toContain('document_content');
    });

    it('no column named cui_content exists in any migration', () => {
      const allSql = readAllMigrations();
      expect(allSql.toLowerCase()).not.toContain('cui_content');
    });

    it('no column named classified_text exists in any migration', () => {
      const allSql = readAllMigrations();
      expect(allSql.toLowerCase()).not.toContain('classified_text');
    });

    it('no column named sensitive_data exists in any migration', () => {
      const allSql = readAllMigrations();
      expect(allSql.toLowerCase()).not.toContain('sensitive_data');
    });

    it('no column named secret_content exists in any migration', () => {
      const allSql = readAllMigrations();
      expect(allSql.toLowerCase()).not.toContain('secret_content');
    });
  });

  describe('Controls table is public reference data', () => {
    it('controls table does NOT have company_id column', () => {
      const sql = readMigrationFile('controls_table');
      // The controls table CREATE statement should not contain company_id
      // Extract just the CREATE TABLE statement
      const createMatch = sql.match(/CREATE TABLE[^;]+;/is);
      expect(createMatch).not.toBeNull();
      const createStatement = createMatch![0];
      expect(createStatement).not.toMatch(/company_id/i);
    });

    it('controls table has public SELECT policy for all authenticated users', () => {
      const sql = readMigrationFile('controls_table');
      // Should have USING (true) -- accessible to all authenticated users
      expect(sql).toMatch(/FOR\s+SELECT/i);
      expect(sql).toMatch(/USING\s*\(\s*true\s*\)/i);
    });

    it('controls table comment indicates public reference data', () => {
      const sql = readMigrationFile('controls_table');
      expect(sql.toLowerCase()).toContain('public reference data');
    });
  });

  describe('Tenant-scoped tables have company_id NOT NULL', () => {
    it('agent_tasks has company_id NOT NULL', () => {
      const sql = readMigrationFile('agent_infrastructure');
      expect(sql).toMatch(/company_id\s+UUID\s+NOT\s+NULL/i);
    });

    it('agent_approvals has company_id NOT NULL', () => {
      const sql = readMigrationFile('approval_gates');
      expect(sql).toMatch(/company_id\s+UUID\s+NOT\s+NULL/i);
    });
  });

  describe('Assessment responses store status values, not CUI', () => {
    it('agent_tasks stores action and output metadata, not document content', () => {
      const sql = readMigrationFile('agent_infrastructure');
      // action is TEXT (action name, not document content)
      // output is JSONB (structured result, not CUI)
      expect(sql).toMatch(/action\s+TEXT\s+NOT\s+NULL/i);
      expect(sql).toMatch(/output\s+JSONB/i);
    });
  });

  describe('AIRiskAnalysisService is a mock', () => {
    it('contains mock/hardcoded indicators', () => {
      const servicePath = path.resolve(
        __dirname,
        '../../services/AIRiskAnalysisService.ts'
      );
      const code = fs.readFileSync(servicePath, 'utf-8');

      // Should contain mock indicators
      const hasMockIndicators =
        code.includes('Mock calculation') ||
        code.includes('Simulate AI') ||
        code.includes('Math.random()') ||
        code.includes('hardcoded');

      expect(hasMockIndicators).toBe(true);
    });

    it('uses hardcoded domain names instead of database queries', () => {
      const servicePath = path.resolve(
        __dirname,
        '../../services/AIRiskAnalysisService.ts'
      );
      const code = fs.readFileSync(servicePath, 'utf-8');

      // Hardcoded domain array is a mock indicator
      expect(code).toContain("'Access Control'");
      expect(code).toContain("'Network Security'");
      expect(code).toContain("'Data Protection'");
      expect(code).toContain("'Compliance'");
    });

    it('does not import or call Supabase client', () => {
      const servicePath = path.resolve(
        __dirname,
        '../../services/AIRiskAnalysisService.ts'
      );
      const code = fs.readFileSync(servicePath, 'utf-8');

      // Strip comments to check only executable code for supabase imports
      const codeWithoutComments = code
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
        .replace(/\/\/.*$/gm, '');        // Remove line comments

      // A real service would import supabase client in executable code
      expect(codeWithoutComments).not.toContain("from '@supabase/supabase-js'");
      expect(codeWithoutComments).not.toContain('from "@supabase/supabase-js"');
      expect(codeWithoutComments).not.toMatch(/import.*supabase/i);
    });

    it('uses setTimeout to simulate async AI calls', () => {
      const servicePath = path.resolve(
        __dirname,
        '../../services/AIRiskAnalysisService.ts'
      );
      const code = fs.readFileSync(servicePath, 'utf-8');

      // setTimeout is used to simulate AI processing time
      expect(code).toContain('setTimeout');
    });
  });
});

describe('AIRiskAnalysisService has no remaining callers (DATA-03)', () => {
  /**
   * Scans all .ts and .tsx files in src/components/ and src/pages/ to verify
   * that no file imports or references AIRiskAnalysisService. This enforces
   * the migration to agent-driven analysis from Phase 2.
   *
   * The service file itself (src/services/AIRiskAnalysisService.ts) is exempt
   * since it defines the deprecated class. Test files are also exempt.
   */

  function getAllSourceFiles(dir: string, extensions: string[]): string[] {
    const results: string[] = [];
    if (!fs.existsSync(dir)) return results;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...getAllSourceFiles(fullPath, extensions));
      } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
        results.push(fullPath);
      }
    }
    return results;
  }

  it('no file in src/components/ imports AIRiskAnalysisService', () => {
    const componentsDir = path.resolve(__dirname, '../../components');
    const files = getAllSourceFiles(componentsDir, ['.ts', '.tsx']);

    const callers: string[] = [];
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      if (content.includes('AIRiskAnalysisService')) {
        callers.push(path.relative(path.resolve(__dirname, '../../..'), file));
      }
    }

    expect(callers).toEqual([]);
  });

  it('no file in src/pages/ imports AIRiskAnalysisService', () => {
    const pagesDir = path.resolve(__dirname, '../../pages');
    const files = getAllSourceFiles(pagesDir, ['.ts', '.tsx']);

    const callers: string[] = [];
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      if (content.includes('AIRiskAnalysisService')) {
        callers.push(path.relative(path.resolve(__dirname, '../../..'), file));
      }
    }

    expect(callers).toEqual([]);
  });
});

describe('Data Handling Documentation', () => {
  it('DATA-HANDLING.md exists', () => {
    const docPath = path.resolve(__dirname, '../../../docs/DATA-HANDLING.md');
    expect(fs.existsSync(docPath)).toBe(true);
  });

  it('DATA-HANDLING.md contains required sections', () => {
    const docPath = path.resolve(__dirname, '../../../docs/DATA-HANDLING.md');
    const content = fs.readFileSync(docPath, 'utf-8');

    expect(content).toContain('What We Store');
    expect(content).toContain('What We Do NOT Store');
    expect(content).toContain('Multi-Tenant Isolation');
    expect(content).toContain('Agent Data Handling');
    expect(content).toContain('Your Responsibilities');
  });

  it('DATA-HANDLING.md explicitly states CUI is not stored', () => {
    const docPath = path.resolve(__dirname, '../../../docs/DATA-HANDLING.md');
    const content = fs.readFileSync(docPath, 'utf-8');

    expect(content.toLowerCase()).toContain('cui');
    expect(content).toMatch(/not\s+(store|stored|stored|keep|collect)/i);
  });
});
