// testK8.js - Test K8 glass lookup from OPAL catalog
import { parseAGFCatalog, calculateRefractiveIndexWithCatalog, getDatabaseSize } from '../src/utils/glassCalculator.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load OPAL catalog
const opalPath = path.join(__dirname, '..', 'src', 'GlassCat', 'OPAL.AGF');
const opalContent = fs.readFileSync(opalPath, 'utf-8');
parseAGFCatalog(opalContent, 'OPAL');

console.log('=== K8 Glass Lookup Test ===');
console.log(`Loaded ${getDatabaseSize()} glasses from OPAL catalog\n`);

// Test K8 lookup
const wavelength = 550; // nm
const result = calculateRefractiveIndexWithCatalog('K8', wavelength);

if (result) {
  console.log('✓ K8 found in catalog');
  console.log(`  Catalog: ${result.catalog}`);
  console.log(`  Correct Name: ${result.correctName}`);
  console.log(`  n @ ${wavelength}nm: ${result.n.toFixed(6)}`);
} else {
  console.log('✗ K8 NOT found in catalog');
}

// Test with different cases
console.log('\nTesting case sensitivity:');
const testCases = ['K8', 'k8', 'K8 ', ' K8'];
for (const testCase of testCases) {
  const trimmed = testCase.trim();
  const res = calculateRefractiveIndexWithCatalog(trimmed, wavelength);
  console.log(`  "${testCase}" -> ${res ? `Found (${res.catalog})` : 'Not found'}`);
}

console.log('\n=== Test Complete ===');
