/**
 * Zemax File Parser
 * Parses Zemax (.zmx) optical design files
 */

import { calculateRefractiveIndexWithCatalog } from './glassCalculator.js';

/**
 * Parse Zemax file content
 * @param {string} content - Raw file content
 * @param {string} filePath - Path to the file
 * @returns {Object} Parsed system data with name, description, wavelength, and ldeData
 */
export function parseZemaxFile(content, filePath) {
  // Remove null bytes but preserve line breaks (Zemax format uses null bytes between characters)
  const cleanedContent = content.replace(/\0/g, '');
  const lines = cleanedContent.split('\n');
  const fileName = filePath.split(/[/\\]/).pop().replace(/\.zmx$/i, '');

  let wavelength = 550; // Default wavelength in nm
  let pwavIndex = 1; // Default primary wavelength index
  const wavelengths = [];
  const surfaces = [];
  let currentSurface = null;

  // First pass: collect PWAV and wavelengths
  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('PWAV')) {
      const parts = trimmed.split(/\s+/);
      if (parts.length > 1) {
        pwavIndex = parseInt(parts[1]) || 1;
      }
    } else if (trimmed.startsWith('WAVM')) {
      const parts = trimmed.split(/\s+/);
      if (parts.length > 2) {
        const waveIndex = parseInt(parts[1]);
        const waveValue = parseFloat(parts[2]);
        wavelengths.push({ index: waveIndex, value: waveValue });
      }
    }
  }

  // Get primary wavelength (convert from micrometers to nanometers)
  const primaryWave = wavelengths.find(w => w.index === pwavIndex);
  if (primaryWave) {
    wavelength = primaryWave.value * 1000; // Convert µm to nm
  }

  // Second pass: parse surfaces
  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('SURF')) {
      if (currentSurface !== null) {
        surfaces.push(currentSurface);
      }
      const parts = trimmed.split(/\s+/);
      const surfaceNumber = parseInt(parts[1]) || 0;
      currentSurface = {
        surface: surfaceNumber,
        radius: Infinity,
        thickness: 0,
        material: '',
        catalog: '',
        n: '',
        semiDiameter: 0,
        diameter: 0,
        isStop: false
      };
    } else if (currentSurface !== null) {
      if (trimmed.startsWith('CURV')) {
        const parts = trimmed.split(/\s+/);
        if (parts.length > 1) {
          const curvature = parseFloat(parts[1]);
          if (curvature !== 0) {
            currentSurface.radius = 1 / curvature;
          } else {
            currentSurface.radius = Infinity;
          }
        }
      } else if (trimmed.startsWith('DISZ')) {
        const parts = trimmed.split(/\s+/);
        if (parts.length > 1) {
          const thickness = parts[1];
          if (thickness === 'INFINITY') {
            currentSurface.thickness = Infinity;
          } else {
            currentSurface.thickness = parseFloat(thickness) || 0;
          }
        }
      } else if (trimmed.startsWith('GLAS')) {
        const parts = trimmed.split(/\s+/);
        if (parts.length > 1) {
          if (parts[1] === '___BLANK') {
            // Parse refractive index from BLANK glass
            if (parts.length > 4) {
              currentSurface.n = parseFloat(parts[4]) || '';
            }
          } else {
            // Normal glass name
            currentSurface.material = parts[1];
          }
        }
      } else if (trimmed.startsWith('DIAM')) {
        const parts = trimmed.split(/\s+/);
        if (parts.length > 1) {
          const semiDiam = parseFloat(parts[1]) || 0;
          currentSurface.semiDiameter = semiDiam;
          currentSurface.diameter = semiDiam * 2;
        }
      } else if (trimmed === 'STOP') {
        currentSurface.isStop = true;
      }
    }
  }

  // Add last surface
  if (currentSurface !== null) {
    surfaces.push(currentSurface);
  }

  // Filter out SURF 0 and last surface, renumber
  const filteredSurfaces = surfaces.filter((s, i) => i !== 0 && i !== surfaces.length - 1);
  filteredSurfaces.forEach((s, i) => {
    s.surface = i;
  });

  // Calculate refractive indices for materials
  filteredSurfaces.forEach(surface => {
    if (surface.material && !surface.n) {
      const result = calculateRefractiveIndexWithCatalog(surface.material, wavelength);
      if (result !== null) {
        surface.n = result.n.toFixed(6);
        surface.catalog = result.catalog;
      }
    }
  });

  return {
    name: fileName,
    description: `Imported from ${fileName}.zmx`,
    wavelength: wavelength,
    ldeData: filteredSurfaces
  };
}
