// lensExtractor.js - Utility to identify and extract individual lenses from LDE data

/**
 * Identifies individual lenses from LDE data.
 * A lens is defined as:
 * - First surface: has either 'material' or 'n' specified (non-empty material or n value)
 * - Second surface: the surface immediately after the first surface
 *
 * Special case: Cemented doublets have 2 surfaces with material specified one after another.
 * They are treated as 2 separate lenses sharing one radius on surface 2 (of the first lens).
 *
 * @param {Array} ldeData - Array of surface objects
 * @returns {Array} Array of lens objects, each containing 2 surfaces
 */
export function extractLenses(ldeData) {
  if (!ldeData || ldeData.length === 0) {
    return [];
  }

  const lenses = [];
  let i = 0;

  while (i < ldeData.length) {
    const surface = ldeData[i];

    // Check if this surface is the start of a lens
    // First surface of a lens has material or n specified
    const hasMaterial = surface.material && surface.material.trim() !== '';
    const hasRefractiveIndex = surface.n && surface.n !== '' && surface.n !== '1.000000';

    if (hasMaterial || hasRefractiveIndex) {
      // This is the first surface of a lens
      // The second surface is the next one
      if (i + 1 < ldeData.length) {
        const firstSurface = surface;
        const secondSurface = ldeData[i + 1];

        lenses.push({
          lensNumber: lenses.length + 1,
          surfaces: [firstSurface, secondSurface]
        });

        // Move to next surface (don't skip the second surface, as it might be
        // the first surface of a cemented doublet)
        i += 1;
      } else {
        // Edge case: last surface has material but no second surface
        // Skip this incomplete lens
        i++;
      }
    } else {
      // Not a lens surface (e.g., air gap, stop surface without material)
      i++;
    }
  }

  return lenses;
}

/**
 * Creates a lens JSON object for saving to disk
 * @param {Object} lens - Lens object with surfaces array
 * @param {string} systemName - Name of the parent optical system
 * @param {number} wavelength - Wavelength for the lens
 * @returns {Object} Lens data suitable for JSON serialization
 */
export function createLensJSON(lens, systemName, wavelength) {
  return {
    systemName,
    lensNumber: lens.lensNumber,
    wavelength,
    ldeData: lens.surfaces.map((surface, index) => ({
      ...surface,
      surface: index // Renumber surfaces to 0 and 1
    }))
  };
}

/**
 * Converts LDE data with lenses back to a flat surface array
 * @param {Array} lenses - Array of lens objects
 * @returns {Array} Flat array of all surfaces
 */
export function flattenLenses(lenses) {
  const surfaces = [];

  for (const lens of lenses) {
    surfaces.push(...lens.surfaces);
  }

  // Renumber all surfaces sequentially
  return surfaces.map((surface, index) => ({
    ...surface,
    surface: index
  }));
}
