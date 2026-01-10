// focalLengthCalculator.js - Optical system focal length calculations
// Uses ABCD matrix method to calculate EFFL, FFL, and BFL
// Based on legacy ReportMaker C# implementation

/**
 * 2x2 Matrix class for ABCD matrix operations
 */
class Matrix2x2 {
  constructor(a, b, c, d) {
    this.A = a;
    this.B = b;
    this.C = c;
    this.D = d;
  }

  /**
   * Multiply two 2x2 matrices
   * @param {Matrix2x2} m1 - First matrix
   * @param {Matrix2x2} m2 - Second matrix
   * @returns {Matrix2x2} Product matrix
   */
  static multiply(m1, m2) {
    return new Matrix2x2(
      m1.A * m2.A + m1.B * m2.C,
      m1.A * m2.B + m1.B * m2.D,
      m1.C * m2.A + m1.D * m2.C,
      m1.C * m2.B + m1.D * m2.D
    );
  }
}

/**
 * Compute the ABCD matrix for an optical system
 * @param {Array} surfaces - Array of surface objects from LDE
 * @param {number} n0 - Initial refractive index (default: 1.0 for air)
 * @param {boolean} includeLastThickness - Whether to include the thickness of the last surface (default: false)
 * @returns {Matrix2x2} The combined ABCD matrix
 */
function computeABCDMatrix(surfaces, n0 = 1.0, includeLastThickness = false) {
  // Start with identity matrix
  let M = new Matrix2x2(1, 0, 0, 1);
  let n_prev = n0;

  for (let k = 0; k < surfaces.length; k++) {
    const s = surfaces[k];
    const R = parseFloat(s.radius);

    // Get refractive index after this surface
    let n_next = 1.0;
    const nStr = s.n;
    if (nStr && nStr !== '' && nStr !== '0') {
      n_next = parseFloat(nStr);
      if (isNaN(n_next) || n_next <= 0) {
        n_next = 1.0;
      }
    }

    // Calculate optical power: P = (n' - n) / R
    let P = 0;
    if (R !== 0 && !isNaN(R) && isFinite(R)) {
      P = (n_next - n_prev) / R;
    }

    // Refraction matrix
    const M_ref = new Matrix2x2(1, 0, -P, 1);
    M = Matrix2x2.multiply(M, M_ref);

    // Transfer matrix (exclude last surface thickness unless explicitly requested)
    const isLastSurface = (k === surfaces.length - 1);
    if (!isLastSurface || includeLastThickness) {
      const d = parseFloat(s.thickness) || 0;
      if (d !== 0) {
        const M_trans = new Matrix2x2(1, d / n_next, 0, 1);
        M = Matrix2x2.multiply(M, M_trans);
      }
    }

    n_prev = n_next;
  }

  return M;
}

/**
 * Remove image plane surfaces from the end of the surface list
 * Image plane surfaces are flat (infinite radius) surfaces with no power, typically at the end
 * @param {Array} surfaces - Array of surface objects
 * @returns {Array} Filtered surface array without trailing image planes
 */
function removeImagePlaneSurfaces(surfaces) {
  let filtered = [...surfaces];

  // Remove trailing surfaces that are flat (R = Infinity) and in air (n = 1.0)
  while (filtered.length > 0) {
    const lastSurface = filtered[filtered.length - 1];
    const R = parseFloat(lastSurface.radius);
    const nStr = lastSurface.n || '';
    const n = (nStr && nStr !== '' && nStr !== '0') ? parseFloat(nStr) : 1.0;

    // If last surface is flat (infinite radius) and in air, it's likely an image plane
    if (!isFinite(R) && Math.abs(n - 1.0) < 0.001) {
      console.log(`Removing image plane surface at index ${filtered.length - 1}`);
      filtered.pop();
    } else {
      break;
    }
  }

  return filtered;
}

/**
 * Calculate Effective Focal Length (EFFL), Front Focal Length (FFL), and Back Focal Length (BFL)
 * for an optical system using ABCD matrix method
 *
 * @param {Array} ldeData - Array of surface objects from LDE
 * @param {number} wavelength - Wavelength in nm for refractive index (default: 550)
 * @returns {Object} { effl, ffl, bfl, valid } - All lengths in same units as LDE data
 *
 * Algorithm (from legacy ReportMaker):
 * 1. Remove trailing image plane surfaces (flat surfaces in air at the end)
 * 2. Compute ABCD matrix for the optical system (excluding last surface thickness)
 * 3. EFFL = -1 / C (effective focal length)
 * 4. BFL = A / C (back focal length from last surface to back focal point)
 * 5. FFL = -D / C (front focal length from first surface to front focal point)
 *
 * The ABCD matrix relates input ray parameters (y0, θ0) to output (y1, θ1):
 * [y1]   [A B] [y0]
 * [θ1] = [C D] [θ0]
 */
export function calculateFocalLengths(ldeData, wavelength = 550) {
  if (!ldeData || ldeData.length < 2) {
    return { effl: null, ffl: null, bfl: null, valid: false, error: 'Insufficient surfaces' };
  }

  try {
    console.log('=== Computing ABCD Matrix for Focal Length Calculation ===');

    // Remove image plane surfaces from the end (flat surfaces with no power)
    const opticalSurfaces = removeImagePlaneSurfaces(ldeData);

    if (opticalSurfaces.length < 2) {
      return { effl: null, ffl: null, bfl: null, valid: false, error: 'Insufficient optical surfaces' };
    }

    console.log(`Using ${opticalSurfaces.length} optical surfaces (removed ${ldeData.length - opticalSurfaces.length} image plane surfaces)`);

    // Compute the ABCD matrix
    const M = computeABCDMatrix(opticalSurfaces, 1.0);

    const A = M.A;
    const B = M.B;
    const C = M.C;
    const D = M.D;

    console.log('ABCD Matrix:');
    console.log(`  A = ${A.toFixed(6)}`);
    console.log(`  B = ${B.toFixed(6)}`);
    console.log(`  C = ${C.toFixed(6)}`);
    console.log(`  D = ${D.toFixed(6)}`);

    // Calculate focal lengths from ABCD matrix elements
    const effl = (C !== 0) ? -1 / C : Number.POSITIVE_INFINITY;
    const ffl = (C !== 0) ? A / C : Number.NaN;  // Front focal length (SF' in legacy)
    const bfl = (C !== 0) ? -D / C : Number.NaN; // Back focal length (SF in legacy)

    console.log('\n=== Calculated Focal Lengths ===');
    console.log(`EFFL = ${effl}`);
    console.log(`BFL = ${bfl}`);
    console.log(`FFL = ${ffl}`);

    // Check if system has valid optical power
    const valid = effl !== null && isFinite(effl) && Math.abs(effl) < 1e6 && !isNaN(effl);

    return {
      effl: valid ? effl : null,
      ffl: (ffl !== null && !isNaN(ffl) && isFinite(ffl) && Math.abs(ffl) < 1e6) ? ffl : null,
      bfl: (bfl !== null && !isNaN(bfl) && isFinite(bfl) && Math.abs(bfl) < 1e6) ? bfl : null,
      valid,
      error: valid ? null : 'System has no optical power or invalid configuration'
    };

  } catch (error) {
    console.error('Focal length calculation error:', error);
    return {
      effl: null,
      ffl: null,
      bfl: null,
      valid: false,
      error: error.message
    };
  }
}

/**
 * Format focal length value for display
 * @param {number|null} value - Focal length value
 * @param {number} decimals - Number of decimal places (default: 3)
 * @returns {string} Formatted value
 */
export function formatFocalLength(value, decimals = 3) {
  if (value === null || value === undefined || isNaN(value)) {
    return 'N/A';
  }

  if (!isFinite(value)) {
    return 'Infinity';
  }

  return value.toFixed(decimals);
}
