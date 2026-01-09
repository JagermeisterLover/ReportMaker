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

    const content = await response.text();
    parseAGFCatalog(content, catalogName);
    console.log(`Loaded glass catalog: ${catalogName}`);
    return true;
  } catch (error) {
    console.error(`Error loading catalog ${catalogName}:`, error);
    return false;
  }
}
