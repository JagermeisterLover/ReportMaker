/**
 * Test script for glass catalog parser and refractive index calculator
 */

import { parseAGFCatalog, calculateRefractiveIndex, getDatabaseSize, getGlassData } from '../src/utils/glassCalculator.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load SCHOTT catalog
const schottPath = path.join(__dirname, '..', 'src', 'GlassCat', 'SCHOTT.AGF');
const schottContent = fs.readFileSync(schottPath, 'utf-8');
parseAGFCatalog(schottContent, 'SCHOTT');

console.log('=== Glass Catalog Test ===');
console.log(`Loaded ${getDatabaseSize()} glasses from SCHOTT catalog\n`);

// Test cases with known glass types
const testCases = [
  { glass: 'BK7G18', wavelength: 550, description: 'BK7G18 at 550nm (visible)' },
  { glass: 'F2', wavelength: 550, description: 'F2 at 550nm (visible)' },
  { glass: 'N-BK7', wavelength: 587.6, description: 'N-BK7 at 587.6nm (d-line)' },
  { glass: 'F2', wavelength: 486.1, description: 'F2 at 486.1nm (F-line)' },
  { glass: 'InvalidGlass', wavelength: 550, description: 'Non-existent glass (should fail)' }
];

console.log('Testing refractive index calculations:\n');

testCases.forEach(test => {
  const n = calculateRefractiveIndex(test.glass, test.wavelength);
  if (n !== null) {
    console.log(`✓ ${test.description}`);
    console.log(`  Result: n = ${n.toFixed(6)}`);

    // Show dispersion formula used
    const glassData = getGlassData(test.glass);
    const formulaNames = {
      1: 'Schott',
      2: 'Sellmeier 1',
      3: 'Herzberger',
      12: 'Extended 2'
    };
    console.log(`  Formula: ${formulaNames[glassData.formulaNumber] || 'Unknown'} (${glassData.formulaNumber})`);
  } else {
    console.log(`✗ ${test.description}`);
    console.log(`  Result: Glass not found`);
  }
  console.log('');
});

// Test with catalog prefix
console.log('Testing with catalog prefix:');
const nWithPrefix = calculateRefractiveIndex('SCHOTT:BK7G18', 550);
const nWithoutPrefix = calculateRefractiveIndex('BK7G18', 550);
console.log(`With prefix "SCHOTT:BK7G18": n = ${nWithPrefix ? nWithPrefix.toFixed(6) : 'null'}`);
console.log(`Without prefix "BK7G18": n = ${nWithoutPrefix ? nWithoutPrefix.toFixed(6) : 'null'}`);
console.log(`Match: ${nWithPrefix === nWithoutPrefix ? '✓' : '✗'}`);

console.log('\n=== Test Complete ===');
