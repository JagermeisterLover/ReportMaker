/**
 * Test script for catalog column functionality
 */

import { parseAGFCatalog, calculateRefractiveIndexWithCatalog, getDatabaseSize } from '../src/utils/glassCalculator.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load SCHOTT catalog
const schottPath = path.join(__dirname, '..', 'src', 'GlassCat', 'SCHOTT.AGF');
const schottContent = fs.readFileSync(schottPath, 'utf-8');
parseAGFCatalog(schottContent, 'SCHOTT');

// Load CDGM catalog
const cdgmPath = path.join(__dirname, '..', 'src', 'GlassCat', 'CDGM.AGF');
const cdgmContent = fs.readFileSync(cdgmPath, 'utf-8');
parseAGFCatalog(cdgmContent, 'CDGM');

console.log('=== Catalog Column Test ===');
console.log(`Loaded ${getDatabaseSize()} glasses total\n`);

// Test cases
const testCases = [
  { glass: 'N-BK7', wavelength: 550, expectedCatalog: 'SCHOTT' },
  { glass: 'F2', wavelength: 550, expectedCatalog: 'SCHOTT' },
  { glass: 'BK7G18', wavelength: 550, expectedCatalog: 'SCHOTT' },
  { glass: 'H-K9L', wavelength: 550, expectedCatalog: 'CDGM' }
];

console.log('Testing catalog column population:\n');

testCases.forEach(test => {
  const result = calculateRefractiveIndexWithCatalog(test.glass, test.wavelength);
  if (result !== null) {
    const catalogMatch = result.catalog === test.expectedCatalog ? '✓' : '✗';
    console.log(`${catalogMatch} ${test.glass}`);
    console.log(`  n = ${result.n.toFixed(6)}`);
    console.log(`  catalog = "${result.catalog}" (expected: "${test.expectedCatalog}")`);
  } else {
    console.log(`✗ ${test.glass} - Not found`);
  }
  console.log('');
});

console.log('=== Test Complete ===');
