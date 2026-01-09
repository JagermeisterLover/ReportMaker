/**
 * Glass Catalog Parser and Refractive Index Calculator
 * Parses AGF (ZEMAX Glass Catalog) files and calculates refractive indices
 */

/**
 * Glass catalog data structure
 * Maps glass names to their dispersion formula and coefficients
 */
const glassDatabase = new Map();

/**
 * Parse AGF catalog file and load into database
 * @param {string} content - Raw AGF file content
 * @param {string} catalogName - Name of the catalog (e.g., "SCHOTT", "CDGM")
 */
export function parseAGFCatalog(content, catalogName = 'Unknown') {
  const lines = content.split('\n');
  let currentGlass = null;

  for (const line of lines) {
    const trimmed = line.trim();

    // Parse NM (Name) line
    if (trimmed.startsWith('NM ')) {
      const parts = trimmed.split(/\s+/);
      if (parts.length >= 3) {
        const glassName = parts[1];
        const formulaNumber = parseInt(parts[2]);

        currentGlass = {
          name: glassName,
          catalog: catalogName,
          formulaNumber: formulaNumber,
          coefficients: []
        };
      }
    }
    // Parse CD (Coefficient Data) line
    else if (trimmed.startsWith('CD ') && currentGlass) {
      const parts = trimmed.split(/\s+/);
      // Extract coefficients (skip the "CD" prefix)
      for (let i = 1; i < parts.length; i++) {
        const coeff = parseFloat(parts[i]);
        if (!isNaN(coeff)) {
          currentGlass.coefficients.push(coeff);
        }
      }

      // Store the glass data with both full name and catalog prefix
      const fullName = `${catalogName}:${currentGlass.name}`;
      glassDatabase.set(currentGlass.name, currentGlass);
      glassDatabase.set(fullName, currentGlass);
    }
  }
}

/**
 * Calculate refractive index using Schott formula (case 1)
 * n^2 = a0 + a1*λ^2 + a2*λ^(-2) + a3*λ^(-4) + a4*λ^(-6) + a5*λ^(-8)
 * @param {number[]} coeffs - [A0, A1, A2, A3, A4, A5]
 * @param {number} lambda - Wavelength in micrometers
 * @returns {number} Refractive index
 */
function calculateSchott(coeffs, lambda) {
  const [a0 = 0, a1 = 0, a2 = 0, a3 = 0, a4 = 0, a5 = 0] = coeffs;
  const lambda2 = lambda * lambda;
  const lambda_2 = 1 / lambda2;
  const lambda_4 = lambda_2 * lambda_2;
  const lambda_6 = lambda_4 * lambda_2;
  const lambda_8 = lambda_4 * lambda_4;

  const nSquared = a0
    + a1 * lambda2
    + a2 * lambda_2
    + a3 * lambda_4
    + a4 * lambda_6
    + a5 * lambda_8;

  return Math.sqrt(Math.max(0, nSquared));
}

/**
 * Calculate refractive index using Sellmeier 1 formula (case 2)
 * n^2 - 1 = (K1*λ^2)/(λ^2-L1) + (K2*λ^2)/(λ^2-L2) + (K3*λ^2)/(λ^2-L3)
 * @param {number[]} coeffs - [K1, L1, K2, L2, K3, L3]
 * @param {number} lambda - Wavelength in micrometers
 * @returns {number} Refractive index
 */
function calculateSellmeier1(coeffs, lambda) {
  const [K1 = 0, L1 = 0, K2 = 0, L2 = 0, K3 = 0, L3 = 0] = coeffs;
  const lambda2 = lambda * lambda;

  const nSquaredMinus1 =
    (K1 * lambda2) / (lambda2 - L1) +
    (K2 * lambda2) / (lambda2 - L2) +
    (K3 * lambda2) / (lambda2 - L3);

  return Math.sqrt(Math.max(0, 1 + nSquaredMinus1));
}

/**
 * Calculate refractive index using Herzberger formula (case 3)
 * n = A + B*L + C*L^2 + D*λ^2 + E*λ^4 + F*λ^6
 * where L = 1/(λ^2 - 0.028)
 * @param {number[]} coeffs - [A, B, C, D, E, F]
 * @param {number} lambda - Wavelength in micrometers
 * @returns {number} Refractive index
 */
function calculateHerzberger(coeffs, lambda) {
  const [A = 0, B = 0, C = 0, D = 0, E = 0, F = 0] = coeffs;
  const lambda2 = lambda * lambda;
  const lambda4 = lambda2 * lambda2;
  const lambda6 = lambda4 * lambda2;

  const L = 1 / (lambda2 - 0.028);
  const L2 = L * L;

  const n = A + B * L + C * L2 + D * lambda2 + E * lambda4 + F * lambda6;

  return Math.max(1.0, n); // Refractive index should be at least 1.0
}

/**
 * Calculate refractive index using Extended 2 formula (case 12)
 * n^2 = a0 + a1*λ^2 + a2*λ^(-2) + a3*λ^(-4) + a4*λ^(-6) + a5*λ^(-8) + a6*λ^4 + a7*λ^6
 * @param {number[]} coeffs - [A0, A1, A2, A3, A4, A5, A6, A7]
 * @param {number} lambda - Wavelength in micrometers
 * @returns {number} Refractive index
 */
function calculateExtended2(coeffs, lambda) {
  const [a0 = 0, a1 = 0, a2 = 0, a3 = 0, a4 = 0, a5 = 0, a6 = 0, a7 = 0] = coeffs;
  const lambda2 = lambda * lambda;
  const lambda4 = lambda2 * lambda2;
  const lambda6 = lambda4 * lambda2;
  const lambda_2 = 1 / lambda2;
  const lambda_4 = lambda_2 * lambda_2;
  const lambda_6 = lambda_4 * lambda_2;
  const lambda_8 = lambda_4 * lambda_4;

  const nSquared = a0
    + a1 * lambda2
    + a2 * lambda_2
    + a3 * lambda_4
    + a4 * lambda_6
    + a5 * lambda_8
    + a6 * lambda4
    + a7 * lambda6;

  return Math.sqrt(Math.max(0, nSquared));
}

/**
 * Calculate refractive index for a given glass and wavelength
 * @param {string} glassName - Name of the glass (e.g., "N-BK7", "SCHOTT:N-BK7")
 * @param {number} wavelengthNm - Wavelength in nanometers
 * @returns {number|null} Refractive index or null if glass not found
 */
export function calculateRefractiveIndex(glassName, wavelengthNm) {
  // Convert wavelength from nanometers to micrometers
  const lambda = wavelengthNm / 1000;

  // Look up glass in database
  const glassData = glassDatabase.get(glassName);
  if (!glassData) {
    return null;
  }

  const { formulaNumber, coefficients } = glassData;

  try {
    switch (formulaNumber) {
      case 1:
        return calculateSchott(coefficients, lambda);
      case 2:
        return calculateSellmeier1(coefficients, lambda);
      case 3:
        return calculateHerzberger(coefficients, lambda);
      case 12:
        return calculateExtended2(coefficients, lambda);
      default:
        console.warn(`Unsupported dispersion formula: ${formulaNumber} for glass ${glassName}`);
        return null;
    }
  } catch (error) {
    console.error(`Error calculating refractive index for ${glassName}:`, error);
    return null;
  }
}

/**
 * Calculate refractive index and get catalog info for a given glass
 * @param {string} glassName - Name of the glass (e.g., "N-BK7", "SCHOTT:N-BK7")
 * @param {number} wavelengthNm - Wavelength in nanometers
 * @returns {Object|null} Object with {n: number, catalog: string} or null if glass not found
 */
export function calculateRefractiveIndexWithCatalog(glassName, wavelengthNm) {
  // Convert wavelength from nanometers to micrometers
  const lambda = wavelengthNm / 1000;

  // Look up glass in database
  const glassData = glassDatabase.get(glassName);
  if (!glassData) {
    return null;
  }

  const { formulaNumber, coefficients, catalog } = glassData;

  try {
    let n;
    switch (formulaNumber) {
      case 1:
        n = calculateSchott(coefficients, lambda);
        break;
      case 2:
        n = calculateSellmeier1(coefficients, lambda);
        break;
      case 3:
        n = calculateHerzberger(coefficients, lambda);
        break;
      case 12:
        n = calculateExtended2(coefficients, lambda);
        break;
      default:
        console.warn(`Unsupported dispersion formula: ${formulaNumber} for glass ${glassName}`);
        return null;
    }

    return { n, catalog };
  } catch (error) {
    console.error(`Error calculating refractive index for ${glassName}:`, error);
    return null;
  }
}

/**
 * Check if a glass exists in the database
 * @param {string} glassName - Name of the glass
 * @returns {boolean} True if glass exists
 */
export function hasGlass(glassName) {
  return glassDatabase.has(glassName);
}

/**
 * Get all available glass names
 * @returns {string[]} Array of glass names
 */
export function getAvailableGlasses() {
  return Array.from(glassDatabase.keys());
}

/**
 * Get glass data for a given glass name
 * @param {string} glassName - Name of the glass
 * @returns {Object|null} Glass data or null if not found
 */
export function getGlassData(glassName) {
  return glassDatabase.get(glassName) || null;
}

/**
 * Clear the glass database
 */
export function clearGlassDatabase() {
  glassDatabase.clear();
}

/**
 * Get database size
 * @returns {number} Number of glasses in database
 */
export function getDatabaseSize() {
  return glassDatabase.size;
}
