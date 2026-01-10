// autocollimationCalculator.js - Autocollimation point calculations
// Based on legacy ReportMaker C# implementation

/**
 * Compute autocollimation distance (L) and angular magnification (γ) starting at a given surface
 *
 * @param {Array} surfaces - Array of surface objects with R, t, n_before, n_after
 * @param {number} startIndex - Index of the surface to start from
 * @param {number} initialH - Initial ray height (default: 1.0)
 * @returns {Object} { L, gamma } - Autocollimation distance and angular magnification
 *
 * Algorithm:
 * 1. Start with a ray at height h on surface startIndex
 * 2. Calculate initial angle: tan(α₀) = h / R
 * 3. Trace through each surface using refraction formula
 * 4. Calculate final distance L where ray crosses axis
 * 5. Calculate angular magnification γ
 */
function computeAutocollimation(surfaces, startIndex, initialH = 1.0) {
  let h = initialH;
  const R_start = surfaces[startIndex].R;
  const tan_alpha_initial = initialH / R_start;
  let tan_alpha = tan_alpha_initial;

  // Trace through surfaces starting from startIndex
  for (let j = startIndex; j < surfaces.length; j++) {
    const n_before = surfaces[j].n_before;
    const n_after = surfaces[j].n_after;
    const R = surfaces[j].R;

    // Refraction at surface: tan(α') = tan(α) * (n/n') + h * (n' - n) / (R * n')
    tan_alpha = tan_alpha * (n_before / n_after) + (h * (n_after - n_before)) / (R * n_after);

    // Transfer to next surface (if not the last)
    if (j < surfaces.length - 1) {
      const d = surfaces[j].t;
      h = h - d * tan_alpha;
    }
  }

  // Calculate autocollimation distance: L = h / tan(α)
  const L = (tan_alpha !== 0) ? h / tan_alpha : Number.POSITIVE_INFINITY;

  // Calculate angular magnification: γ = (tan(α) / tan(α₀)) / n₀
  const n0 = surfaces[startIndex].n_after;
  const gamma = (tan_alpha_initial !== 0) ? (tan_alpha / tan_alpha_initial) / n0 : Number.POSITIVE_INFINITY;

  return { L, gamma };
}

/**
 * Set the incoming refractive index (n_before) for each surface
 * The first surface has n_before = 1.0 (air)
 * Each subsequent surface has n_before = previous surface's n_after
 *
 * @param {Array} surfaces - Array of surface objects
 */
function setRefractiveIndices(surfaces) {
  if (surfaces.length > 0) {
    surfaces[0].n_before = 1.0; // Air before first surface

    for (let i = 1; i < surfaces.length; i++) {
      surfaces[i].n_before = surfaces[i - 1].n_after;
    }
  }
}

/**
 * Convert LDE surface data to autocollimation surface format
 *
 * @param {Array} ldeData - Array of LDE surface objects
 * @returns {Array} Array of surfaces in autocollimation format
 */
function convertLDEToAutocollimationSurfaces(ldeData) {
  return ldeData.map(surface => {
    const R = parseFloat(surface.radius);
    const t = parseFloat(surface.thickness) || 0;
    const nStr = surface.n || '';
    const n_after = (nStr && nStr !== '' && nStr !== '0') ? parseFloat(nStr) : 1.0;

    return {
      R: isFinite(R) ? R : Number.POSITIVE_INFINITY,
      t: t,
      n_after: n_after,
      n_before: 1.0, // Will be set by setRefractiveIndices
      diameter: parseFloat(surface.diameter) || 0
    };
  });
}

/**
 * Reverse the optical system for backward autocollimation calculations
 *
 * @param {Array} surfaces - Array of surfaces in normal orientation
 * @returns {Array} Array of surfaces in reversed orientation
 */
function reverseOpticalSystem(surfaces) {
  const reversed = [];

  // Reverse the order of surfaces
  for (let i = surfaces.length - 1; i >= 0; i--) {
    const surf = surfaces[i];
    reversed.push({
      R: -surf.R, // Reverse radius sign
      t: (i > 0) ? surfaces[i - 1].t : 0, // Thickness becomes previous surface's thickness
      n_after: (i > 0) ? surfaces[i - 1].n_after : 1.0, // Refractive index from previous surface
      n_before: 1.0, // Will be set by setRefractiveIndices
      diameter: surf.diameter
    });
  }

  return reversed;
}

/**
 * Calculate autocollimation points for an optical system
 * Computes both normal and reversed orientations
 *
 * @param {Array} ldeData - Array of LDE surface objects
 * @returns {Object} { normal, reversed } - Autocollimation results for both orientations
 *
 * Each orientation contains an array of { surfaceNumber, L, gamma } objects
 */
export function calculateAutocollimationPoints(ldeData) {
  if (!ldeData || ldeData.length === 0) {
    return {
      normal: [],
      reversed: [],
      valid: false,
      error: 'No surface data'
    };
  }

  try {
    console.log('=== Calculating Autocollimation Points ===');

    // Convert LDE data to autocollimation surface format
    const normalSurfaces = convertLDEToAutocollimationSurfaces(ldeData);
    setRefractiveIndices(normalSurfaces);

    // Calculate normal orientation
    const normalResults = [];
    for (let i = 0; i < normalSurfaces.length; i++) {
      const { L, gamma } = computeAutocollimation(normalSurfaces, i);
      normalResults.push({
        surfaceNumber: i + 1,
        L: isFinite(L) ? L : null,
        gamma: isFinite(gamma) ? gamma : null
      });
    }

    // Create reversed system
    const reversedSurfaces = reverseOpticalSystem(normalSurfaces);
    setRefractiveIndices(reversedSurfaces);

    // Calculate reversed orientation
    const reversedResultsRaw = [];
    for (let i = 0; i < reversedSurfaces.length; i++) {
      const { L, gamma } = computeAutocollimation(reversedSurfaces, i);
      reversedResultsRaw.push({ L, gamma });
    }

    // Reverse the results array so surface numbering follows optical path
    reversedResultsRaw.reverse();
    const reversedResults = reversedResultsRaw.map((result, index) => ({
      surfaceNumber: index + 1,
      L: isFinite(result.L) ? result.L : null,
      gamma: isFinite(result.gamma) ? result.gamma : null
    }));

    console.log(`Calculated ${normalResults.length} normal and ${reversedResults.length} reversed autocollimation points`);

    return {
      normal: normalResults,
      reversed: reversedResults,
      valid: true,
      error: null
    };

  } catch (error) {
    console.error('Autocollimation calculation error:', error);
    return {
      normal: [],
      reversed: [],
      valid: false,
      error: error.message
    };
  }
}

/**
 * Format autocollimation distance for display
 * @param {number|null} value - Distance value
 * @param {number} decimals - Number of decimal places (default: 3)
 * @returns {string} Formatted value
 */
export function formatAutocollimationDistance(value, decimals = 3) {
  if (value === null || value === undefined || isNaN(value)) {
    return 'N/A';
  }

  if (!isFinite(value)) {
    return '∞';
  }

  return value.toFixed(decimals);
}

/**
 * Format angular magnification for display
 * @param {number|null} value - Magnification value
 * @param {number} decimals - Number of decimal places (default: 4)
 * @returns {string} Formatted value
 */
export function formatAngularMagnification(value, decimals = 4) {
  if (value === null || value === undefined || isNaN(value)) {
    return 'N/A';
  }

  if (!isFinite(value)) {
    return '∞';
  }

  return value.toFixed(decimals);
}
