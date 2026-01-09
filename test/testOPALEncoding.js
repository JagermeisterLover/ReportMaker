// testOPALEncoding.js - Test OPAL catalog encoding and parsing
import { parseAGFCatalog, calculateRefractiveIndexWithCatalog, getDatabaseSize } from '../src/utils/glassCalculator.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const opalPath = path.join(__dirname, '..', 'src', 'GlassCat', 'OPAL.AGF');

// Read as UTF-8 (incorrect)
console.log('=== Reading OPAL.AGF as UTF-8 (incorrect) ===');
const utf8Content = fs.readFileSync(opalPath, 'utf-8');
console.log('First 200 chars:', utf8Content.substring(0, 200));
console.log('Line 1:', utf8Content.split('\n')[0]);
parseAGFCatalog(utf8Content, 'OPAL_UTF8');
console.log(`Parsed glasses: ${getDatabaseSize()}\n`);

// Clear and try UTF-16LE (correct)
import { clearGlassDatabase } from '../src/utils/glassCalculator.js';
clearGlassDatabase();

console.log('=== Reading OPAL.AGF as UTF-16LE (correct) ===');
const utf16Content = fs.readFileSync(opalPath, 'utf16le');
console.log('First 200 chars:', utf16Content.substring(0, 200));
console.log('Line 1:', utf16Content.split('\n')[0]);
parseAGFCatalog(utf16Content, 'OPAL');
console.log(`Parsed glasses: ${getDatabaseSize()}`);

// Test K8 lookup
const result = calculateRefractiveIndexWithCatalog('K8', 550);
if (result) {
  console.log(`\n✓ K8 found: n=${result.n.toFixed(6)} from ${result.catalog}`);
} else {
  console.log('\n✗ K8 NOT found');
}

console.log('\n=== Test Complete ===');
