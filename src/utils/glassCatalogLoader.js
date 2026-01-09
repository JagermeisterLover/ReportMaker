/**
 * Glass Catalog Loader (Browser-compatible version)
 * Loads AGF catalog files from the GlassCat directory using fetch
 */

import { parseAGFCatalog } from './glassCalculator.js';

// List of available catalogs (add new catalogs here)
const AVAILABLE_CATALOGS = ['SCHOTT', 'CDGM', 'OPAL'];

/**
 * Load all AGF catalogs from the GlassCat directory
 * @returns {Promise<Object>} Object with loaded catalog names and counts
 */
export async function loadAllCatalogs() {
  const loadedCatalogs = {};

  for (const catalogName of AVAILABLE_CATALOGS) {
    try {
      const success = await loadCatalog(catalogName);
      loadedCatalogs[catalogName] = success;
    } catch (error) {
      console.error(`Error loading catalog ${catalogName}:`, error);
      loadedCatalogs[catalogName] = false;
    }
  }

  return loadedCatalogs;
}

/**
 * Load a specific catalog by name
 * @param {string} catalogName - Name of the catalog (e.g., "SCHOTT", "CDGM")
 * @returns {Promise<boolean>} True if loaded successfully
 */
export async function loadCatalog(catalogName) {
  try {
    // Use fetch to load the AGF file (works in browser/renderer process)
    const response = await fetch(`./GlassCat/${catalogName}.AGF`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Get the raw buffer to detect encoding
    const buffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(buffer);

    let content;
    // Check for UTF-16 LE BOM (FF FE)
    if (uint8Array.length >= 2 && uint8Array[0] === 0xFF && uint8Array[1] === 0xFE) {
      // UTF-16 LE encoding
      const decoder = new TextDecoder('utf-16le');
      content = decoder.decode(buffer);
    } else {
      // Default to UTF-8
      const decoder = new TextDecoder('utf-8');
      content = decoder.decode(buffer);
    }

    parseAGFCatalog(content, catalogName);
    console.log(`Loaded glass catalog: ${catalogName}`);
    return true;
  } catch (error) {
    console.error(`Error loading catalog ${catalogName}:`, error);
    return false;
  }
}
