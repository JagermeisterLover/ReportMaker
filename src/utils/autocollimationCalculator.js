// autocollimationCalculator.js - Revised: accepts explicit reversed system to match C# exactly

/**
 * parseNumber(token, fallback) - robust numeric parsing
 * accepts comma decimal separators, "Infinity" keyword, empty tokens.
 */
function parseNumber(token, fallback = NaN) {
  if (token === undefined || token === null) return fallback;
  const s = String(token).trim().replace(',', '.');
  if (s === '') return fallback;
  if (/^[+-]?Infinity$/i.test(s)) {
    return s.startsWith('-') ? -Number.POSITIVE_INFINITY : Number.POSITIVE_INFINITY;
  }
  const v = parseFloat(s);
  return Number.isFinite(v) ? v : fallback;
}

/**
 * computeAutocollimation(surfaces, startIndex, initialH)
 * Surfaces must be in internal form: { R, t, n_after, n_before, diameter }
 *
 * Returns { L, gamma } where L is distance along axis where the ray crosses,
 * and gamma is angular magnification.
 */
export function computeAutocollimation(surfaces, startIndex, initialH = 1.0) {
  if (!Array.isArray(surfaces) || surfaces.length === 0) {
    return { L: NaN, gamma: NaN };
  }

  let h = Number(initialH);
  const R_start = Number(surfaces[startIndex].R);
  // follow same initial tan alpha calculation as C#
  const tan_alpha_initial = (R_start === 0 || !Number.isFinite(R_start)) ? 0 : (h / R_start);
  let tan_alpha = tan_alpha_initial;

  for (let j = startIndex; j < surfaces.length; j++) {
    const n_before = Number(surfaces[j].n_before);
    const n_after = Number(surfaces[j].n_after);
    const R = Number(surfaces[j].R);

    // if radius is infinite or zero, curvature term is zero
    const curvatureTerm = (R === 0 || !Number.isFinite(R)) ? 0 : (h * (n_after - n_before)) / (R * n_after);

    // refraction update (same algebraic form as original C#)
    tan_alpha = tan_alpha * (n_before / n_after) + curvatureTerm;

    // drift to next surface (if not last)
    if (j < surfaces.length - 1) {
      const d = Number(surfaces[j].t) || 0;
      h = h - d * tan_alpha;
    }
  }

  const L = (tan_alpha !== 0) ? (h / tan_alpha) : Number.POSITIVE_INFINITY;
  const n0 = Number(surfaces[startIndex].n_after);
  const gamma = (tan_alpha_initial !== 0) ? (tan_alpha / tan_alpha_initial) / n0 : Number.POSITIVE_INFINITY;

  return { L, gamma };
}

/**
 * setRefractiveIndices(surfaces)
 * in-place: surfaces[0].n_before = 1.0; subsequent n_before = previous n_after
 */
export function setRefractiveIndices(surfaces) {
  if (!Array.isArray(surfaces) || surfaces.length === 0) return;
  surfaces[0].n_before = 1.0;
  for (let i = 1; i < surfaces.length; i++) {
    surfaces[i].n_before = surfaces[i - 1].n_after;
  }
}

/**
 * convertLDEToAutocollimationSurfaces(ldeData)
 * ldeData should be an array of objects with fields similar to your sys.txt columns:
 * { Radius, Thickness, n, Diameter } or { radius, thickness, n, diameter } etc.
 *
 * We robustly parse numbers and default missing n to 1.0.
 */
export function convertLDEToAutocollimationSurfaces(ldeData) {
  if (!Array.isArray(ldeData)) return [];

  return ldeData.map(entry => {
    // try various common column names
    const radiusToken = entry.Radius ?? entry.R ?? entry.radius ?? entry['Radius'] ?? entry['Radius(mm)'] ?? '';
    const thicknessToken = entry.Thickness ?? entry.t ?? entry.thickness ?? entry['Thickness'] ?? '';
    const nToken = entry.n ?? entry.N ?? entry['Index'] ?? '';
    const diameterToken = entry.Diameter ?? entry.D ?? entry.diameter ?? '';

    let Rraw = parseNumber(radiusToken, NaN);
    let R = Number.isFinite(Rraw) ? Rraw : Number.POSITIVE_INFINITY; // treat absent or NaN as flat surface (infinite radius)

    const t = parseNumber(thicknessToken, 0) || 0;
    let n_after = parseNumber(nToken, NaN);
    if (!Number.isFinite(n_after) || n_after === 0) n_after = 1.0;
    const diameter = parseNumber(diameterToken, 0) || 0;

    return {
      R,
      t,
      n_after,
      n_before: 1.0, // will be set by setRefractiveIndices
      diameter
    };
  });
}

/**
 * reverseOpticalSystem(normalSurfaces)
 * Build reversed system from normalSurfaces (the code previously used this).
 * Reversed.R = -original.R (flip sign).
 * Reversed.t = previous original.t (or 0 for the last element in reversed build).
 * Reversed.n_after = previous original.n_after (or 1.0 if none).
 *
 * This function still exists for backward compatibility but is NOT used if the
 * caller explicitly supplies a reversed LDE dataset.
 */
export function reverseOpticalSystem(normalSurfaces) {
  const reversed = [];
  const n = normalSurfaces.length;
  for (let i = n - 1; i >= 0; i--) {
    const surf = normalSurfaces[i];
    const prevIndex = i - 1;
    reversed.push({
      R: (Number.isFinite(surf.R) ? -surf.R : surf.R), // if R was +Inf keep it +Inf
      t: prevIndex >= 0 ? normalSurfaces[prevIndex].t : 0,
      n_after: prevIndex >= 0 ? normalSurfaces[prevIndex].n_after : 1.0,
      n_before: 1.0,
      diameter: surf.diameter
    });
  }
  setRefractiveIndices(reversed);
  return reversed;
}

/**
 * calculateAutocollimationPoints(ldeData, reversedLdeData = null)
 *
 * - ldeData: normal system (array of parsed rows)
 * - reversedLdeData: optional explicit reversed system (if you have sysr.txt).
 *
 * If reversedLdeData is provided, it is used verbatim (converted -> setRefractiveIndices -> compute).
 * That reproduces the C# workflow when you feed it the two files.
 */
export function calculateAutocollimationPoints(ldeData, reversedLdeData = null) {
  if (!Array.isArray(ldeData) || ldeData.length === 0) {
    return { normal: [], reversed: [], valid: false, error: 'No surface data' };
  }

  try {
    // Convert normal surfaces and set indices
    const normalSurfaces = convertLDEToAutocollimationSurfaces(ldeData);
    setRefractiveIndices(normalSurfaces);

    const normalResults = normalSurfaces.map((_, i) => {
      const { L, gamma } = computeAutocollimation(normalSurfaces, i);
      return { surfaceNumber: i + 1, L: Number.isFinite(L) ? L : null, gamma: Number.isFinite(gamma) ? gamma : null };
    });

    // Build reversed surfaces: either from provided reversedLdeData (preferred) or by construction
    let reversedSurfaces;
    if (Array.isArray(reversedLdeData) && reversedLdeData.length > 0) {
      reversedSurfaces = convertLDEToAutocollimationSurfaces(reversedLdeData);
      setRefractiveIndices(reversedSurfaces);
    } else {
      reversedSurfaces = reverseOpticalSystem(normalSurfaces);
    }

    // Compute reversed orientation results
    const reversedRaw = reversedSurfaces.map((_, i) => {
      const { L, gamma } = computeAutocollimation(reversedSurfaces, i);
      return { L, gamma };
    });

    // Reverse the array so numbering follows original optical path (C# convention)
    reversedRaw.reverse();
    const reversedResults = reversedRaw.map((res, idx) => ({
      surfaceNumber: idx + 1,
      L: Number.isFinite(res.L) ? res.L : null,
      gamma: Number.isFinite(res.gamma) ? res.gamma : null
    }));

    return { normal: normalResults, reversed: reversedResults, valid: true, error: null };

  } catch (err) {
    return { normal: [], reversed: [], valid: false, error: err && err.message ? err.message : String(err) };
  }
}

/* --- Formatting helpers --- */
export function formatAutocollimationDistance(value, decimals = 3) {
  if (value === null || value === undefined || isNaN(value)) return 'N/A';
  if (!isFinite(value)) return '∞';
  return value.toFixed(decimals);
}

export function formatAngularMagnification(value, decimals = 4) {
  if (value === null || value === undefined || isNaN(value)) return 'N/A';
  if (!isFinite(value)) return '∞';
  return value.toFixed(decimals);
}

/* ---------------------------
   Example usage (pseudo-code)
   ---------------------------

   // Parse sys.txt into an array of rows (ldeNormal) and sysr.txt into ldeReversed.
   // Each row object must provide fields parseable by convertLDEToAutocollimationSurfaces,
   // e.g. { radius: '-6.000000', thickness: '5.000000', n: '1.791918355', diameter: '14.809364' }

   const ldeNormal = [
     { radius: '-6.000000', thickness: '5.000000', n: '1.791918355', diameter: '14.809364' },
     { radius: '-3.000000', thickness: '4.000000', n: '1.000000000', diameter: '7.376806' },
     { radius: '-6.000000', thickness: '7.000000', n: '1.518722177', diameter: '4.838641' },
     { radius: '8.000000', thickness: '20.000000', n: '1.000000000', diameter: '9.653929' },
     { radius: '21.000000', thickness: '15.000000', n: '1.791918355', diameter: '34.332401' },
     { radius: '88.000000', thickness: '0', n: '1.000000000', diameter: '25.739452' }
   ];

   const ldeReversed = [
     { radius: '-88.000000', thickness: '15.000000', n: '1.791918355', diameter: '25.739452' },
     { radius: '-21.000000', thickness: '20.000000', n: '1.000000000', diameter: '34.332401' },
     { radius: '-8.000000', thickness: '7.000000', n: '1.518722177', diameter: '9.653929' },
     { radius: '6.000000', thickness: '4.000000', n: '1.000000000', diameter: '4.838641' },
     { radius: '3.000000', thickness: '5.000000', n: '1.791918355', diameter: '7.376806' },
     { radius: '6.000000', thickness: '0', n: '1.000000000', diameter: '14.809364' }
   ];

   // Call with explicit reversed dataset to match C#:
   const res = calculateAutocollimationPoints(ldeNormal, ldeReversed);

   // Print:
   res.normal.forEach(r => console.log(`Surface ${r.surfaceNumber}: L=${formatAutocollimationDistance(r.L,3)} mm, γ=${formatAngularMagnification(r.gamma,4)}`));
   res.reversed.forEach(r => console.log(`Surface ${r.surfaceNumber}: L=${formatAutocollimationDistance(r.L,3)} mm, γ=${formatAngularMagnification(r.gamma,4)}`));

   // Important: ensure the n values you feed here match exactly the n values used for the C# run
   // (for example 1.791918355 vs 1.778602 are different and produce different outputs).
*/

