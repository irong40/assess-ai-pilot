/**
 * Seed OSCAL Controls Script
 *
 * Standalone Node.js script to seed the controls table from the NIST 800-171 Rev 2
 * OSCAL JSON catalog. NOT an Edge Function (avoids timeout per research pitfall 5).
 *
 * Usage:
 *   npx tsx scripts/seed-oscal-controls.ts
 *
 * Environment variables (read from .env):
 *   VITE_SUPABASE_URL        - Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY - Supabase service role key (NOT the anon key)
 *
 * The script:
 *   1. Downloads the NIST 800-171 Rev 2 OSCAL JSON catalog from the Fathom5 repo
 *      (or reads from a local cache at scripts/oscal-cache/)
 *   2. Parses it using parseOscalCatalog from src/lib/oscal-parser.ts
 *   3. Upserts all 110 controls in a single batch operation
 *   4. Validates: exactly 14 families, exactly 110 controls, exactly 17 Level 1 controls
 *   5. Prints a summary
 */

import { createClient } from '@supabase/supabase-js';
import { parseOscalCatalog } from '../src/lib/oscal-parser';
import type { OscalDocument, ControlRow } from '../src/types/controls';
import * as fs from 'fs';
import * as path from 'path';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const OSCAL_CATALOG_URL =
  'https://raw.githubusercontent.com/Fathom5/nist-oscal-content/main/nist.gov/SP800-171/json/NIST_SP-800-171_rev2_catalog.json';

const CACHE_DIR = path.join(import.meta.dirname ?? path.dirname(new URL(import.meta.url).pathname), 'oscal-cache');
const CACHE_FILE = path.join(CACHE_DIR, 'NIST_SP-800-171_rev2_catalog.json');

// ---------------------------------------------------------------------------
// Load environment
// ---------------------------------------------------------------------------

function loadEnv(): void {
  const envPath = path.resolve(import.meta.dirname ?? '.', '..', '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex === -1) continue;
      const key = trimmed.slice(0, eqIndex).trim();
      let value = trimmed.slice(eqIndex + 1).trim();
      // Strip surrounding quotes
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  }
}

// ---------------------------------------------------------------------------
// Fetch or cache OSCAL catalog
// ---------------------------------------------------------------------------

async function fetchOscalCatalog(): Promise<OscalDocument> {
  // Try local cache first
  if (fs.existsSync(CACHE_FILE)) {
    console.log(`Using cached catalog: ${CACHE_FILE}`);
    const raw = fs.readFileSync(CACHE_FILE, 'utf-8');
    return JSON.parse(raw) as OscalDocument;
  }

  console.log(`Downloading OSCAL catalog from: ${OSCAL_CATALOG_URL}`);
  const response = await fetch(OSCAL_CATALOG_URL);

  if (!response.ok) {
    throw new Error(`Failed to fetch OSCAL catalog: ${response.status} ${response.statusText}`);
  }

  const raw = await response.text();

  // Cache locally for future runs
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
  fs.writeFileSync(CACHE_FILE, raw, 'utf-8');
  console.log(`Cached catalog to: ${CACHE_FILE}`);

  return JSON.parse(raw) as OscalDocument;
}

// ---------------------------------------------------------------------------
// Load SPRS weights
// ---------------------------------------------------------------------------

function loadSprsWeights(): Record<string, number> {
  const weightsPath = path.join(import.meta.dirname ?? '.', 'sprs-weights.json');
  const raw = fs.readFileSync(weightsPath, 'utf-8');
  const data = JSON.parse(raw);
  return data.weights;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validateControls(rows: ControlRow[]): void {
  const errors: string[] = [];

  // Exactly 110 controls
  if (rows.length !== 110) {
    errors.push(`Expected 110 controls, got ${rows.length}`);
  }

  // Exactly 14 families
  const families = new Set(rows.map((r) => r.family_id));
  if (families.size !== 14) {
    errors.push(`Expected 14 families, got ${families.size}: ${[...families].sort().join(', ')}`);
  }

  // Exactly 17 Level 1 controls
  const level1 = rows.filter((r) => r.cmmc_level === 1);
  if (level1.length !== 17) {
    errors.push(`Expected 17 Level 1 controls, got ${level1.length}`);
  }

  // Level 2 should be the remainder
  const level2 = rows.filter((r) => r.cmmc_level === 2);
  if (level2.length !== 93) {
    errors.push(`Expected 93 Level 2 controls, got ${level2.length}`);
  }

  // All controls should have valid weights
  const invalidWeights = rows.filter((r) => ![1, 3, 5].includes(r.sprs_weight));
  if (invalidWeights.length > 0) {
    errors.push(
      `${invalidWeights.length} controls have invalid SPRS weights: ${invalidWeights.map((r) => `${r.control_id}=${r.sprs_weight}`).join(', ')}`
    );
  }

  if (errors.length > 0) {
    throw new Error(`Validation failed:\n  - ${errors.join('\n  - ')}`);
  }
}

// ---------------------------------------------------------------------------
// Upsert to Supabase
// ---------------------------------------------------------------------------

async function upsertControls(rows: ControlRow[]): Promise<void> {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing environment variables. Required:\n' +
        '  VITE_SUPABASE_URL (Supabase project URL)\n' +
        '  SUPABASE_SERVICE_ROLE_KEY (service role key, NOT anon key)\n' +
        '\n' +
        'Set these in .env or export them before running this script.'
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  // Batch upsert all controls (using control_id as the conflict target)
  const { data, error } = await supabase
    .from('controls')
    .upsert(
      rows.map((row) => ({
        control_id: row.control_id,
        family_id: row.family_id,
        family_name: row.family_name,
        title: row.title,
        description: row.description,
        assessment_objectives: row.assessment_objectives,
        cmmc_level: row.cmmc_level,
        sprs_weight: row.sprs_weight,
        nist_800_53_mapping: row.nist_800_53_mapping,
        framework: row.framework,
        framework_version: row.framework_version,
        updated_at: new Date().toISOString(),
      })),
      { onConflict: 'control_id' }
    )
    .select('control_id');

  if (error) {
    throw new Error(`Supabase upsert failed: ${error.message}`);
  }

  console.log(`Upserted ${data?.length ?? rows.length} controls to Supabase.`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log('=== OSCAL Controls Seed Script ===\n');

  // Load env vars
  loadEnv();

  // Fetch catalog
  const document = await fetchOscalCatalog();
  console.log(`Catalog: ${document.catalog.metadata.title}`);

  // Load SPRS weights
  const sprsWeights = loadSprsWeights();
  console.log(`Loaded SPRS weights for ${Object.keys(sprsWeights).length} controls\n`);

  // Parse
  const rows = parseOscalCatalog(document.catalog, sprsWeights);

  // Validate
  validateControls(rows);
  console.log('Validation passed.');

  // Print summary before upserting
  const families = new Set(rows.map((r) => r.family_id));
  const level1 = rows.filter((r) => r.cmmc_level === 1);
  const level2 = rows.filter((r) => r.cmmc_level === 2);
  const totalWeight = rows.reduce((s, r) => s + r.sprs_weight, 0);

  console.log(`\nParsed ${rows.length} controls:`);
  console.log(`  Families: ${families.size}`);
  console.log(`  Level 1: ${level1.length}`);
  console.log(`  Level 2: ${level2.length}`);
  console.log(`  Total SPRS weight: ${totalWeight} (min score: ${110 - totalWeight})`);

  // Print family breakdown
  console.log('\nFamily breakdown:');
  for (const fid of [...families].sort((a, b) => parseFloat(a) - parseFloat(b))) {
    const famControls = rows.filter((r) => r.family_id === fid);
    const famName = famControls[0].family_name;
    console.log(`  ${fid} ${famName}: ${famControls.length} controls`);
  }

  // Upsert
  console.log('\nUpserting to Supabase...');
  await upsertControls(rows);

  console.log(`\nSeeded ${rows.length} controls (${level1.length} L1, ${level2.length} L2) across ${families.size} families`);
  console.log('Done.');
}

main().catch((err) => {
  console.error('Seed script failed:', err.message);
  process.exit(1);
});
