import React, { useMemo } from 'react';
import { Surface, RenderOptions, LensElement } from '../types';

interface OpticalSystemRendererProps {
  surfaces: Surface[];
  options: RenderOptions;
  width?: number;
  height?: number;
}

const OpticalSystemRenderer: React.FC<OpticalSystemRendererProps> = ({
  surfaces,
  options,
  width = 800,
  height = 400
}) => {
  // --- Geometry Calculation Helpers ---

  // Calculate the sag (z-depth) of a spherical surface at a given height y
  const calculateSag = (radius: number, y: number): number => {
    if (radius === 0 || !isFinite(radius)) return 0; // Plano
    const rAbs = Math.abs(radius);
    if (Math.abs(y) > rAbs) return radius > 0 ? rAbs : -rAbs; // Clamp if diameter > 2*radius (physically impossible spherical)
    
    // Sag formula: z = R - sign(R) * sqrt(R^2 - y^2)
    // If R > 0 (convex front), center is to the right. Vertex is at 0. Edge is at +z.
    // If R < 0 (concave front), center is to the left. Vertex is at 0. Edge is at -z.
    const sign = Math.sign(radius);
    return sign * (rAbs - Math.sqrt(rAbs * rAbs - y * y));
  };

  // Generate an array of points {x, y} for a spherical arc
  const generateArcPoints = (zVertex: number, radius: number, semiDiam: number, numPoints = 40, reverse = false) => {
    const points: { x: number; y: number }[] = [];
    
    for (let i = 0; i <= numPoints; i++) {
      // Linear distribution of y from -h to +h
      const t = i / numPoints;
      const y = -semiDiam + t * (2 * semiDiam);
      const sag = calculateSag(radius, y);
      points.push({ x: zVertex + sag, y });
    }

    if (reverse) {
      points.reverse();
    }
    return points;
  };

  // Process surfaces into Lens Elements
  const { elements, maxZ, maxH } = useMemo(() => {
    if (!surfaces || surfaces.length === 0) return { elements: [], maxZ: 100, maxH: 50 };

    const els: LensElement[] = [];
    let currentZ = 0;
    let i = 0;

    // We assume the first surface starts at Z=0 relative to the system start
    // Usually surface 0 is object, 1 is first lens surface.
    // For this visualizer, we map the input array directly.

    while (i < surfaces.length - 1) {
      const s1 = surfaces[i];
      const s2 = surfaces[i + 1];

      // Check if s1 starts a glass medium
      const isGlass = s1.material && s1.material.toUpperCase() !== 'AIR' && s1.material.trim() !== '';

      if (isGlass) {
        // It's a lens element between s1 and s2
        els.push({
          id: `lens-${i}`,
          type: 'lens',
          zFront: currentZ,
          zBack: currentZ + s1.thickness,
          frontSurface: s1,
          backSurface: s2,
          surfaceIndex: i + 1 // 1-based index for display
        });
        
        currentZ += s1.thickness;
        // Move to the next interface. 
        // Note: In real sequential raytracing, we just increment i.
        // However, if the NEXT surface is also glass (cemented doublet), we process it next loop.
        i++; 
      } else {
        // It's an air gap
        currentZ += s1.thickness;
        i++;
      }
    }

    // Calculate bounds for ViewBox
    let localMaxH = 0;
    let localMaxZ = currentZ;

    els.forEach(el => {
      const h1 = (el.frontSurface.diameter || 0) / 2;
      const h2 = (el.backSurface.diameter || 0) / 2;
      localMaxH = Math.max(localMaxH, h1, h2);
      localMaxZ = Math.max(localMaxZ, el.zBack);
    });

    return { elements: els, maxZ: localMaxZ, maxH: localMaxH };
  }, [surfaces]);

  // ViewBox Calculations
  const marginX = maxZ * 0.1 + 10;
  const marginY = maxH * 0.2 + 10;
  const vMinX = -marginX;
  const vMinY = -(maxH + marginY);
  const vWidth = maxZ + marginX * 2;
  const vHeight = (maxH + marginY) * 2;
  const viewBox = `${vMinX} ${vMinY} ${vWidth} ${vHeight}`;

  // Rendering Helper
  const renderLens = (element: LensElement) => {
    const { zFront, zBack, frontSurface, backSurface } = element;
    
    const hFront = (frontSurface.diameter || 0) / 2;
    const hBack = (backSurface.diameter || 0) / 2;
    const rFront = frontSurface.radius;
    const rBack = backSurface.radius;

    // 1. Generate Front Arc (Bottom to Top)
    const frontPoints = generateArcPoints(zFront, rFront, hFront, 40, false);
    
    // 2. Generate Back Arc (Top to Bottom)
    const backPoints = generateArcPoints(zBack, rBack, hBack, 40, true);

    // 3. Construct Closed Path
    // Start at bottom of front arc
    let d = `M ${frontPoints[0].x} ${frontPoints[0].y}`;
    
    // Trace front arc to top
    frontPoints.slice(1).forEach(p => d += ` L ${p.x} ${p.y}`);
    
    // Connect to top of back arc
    // Note: If diameters differ, this draws a straight line connecting the rims
    d += ` L ${backPoints[0].x} ${backPoints[0].y}`;
    
    // Trace back arc to bottom
    backPoints.slice(1).forEach(p => d += ` L ${p.x} ${p.y}`);
    
    // Close shape (connects bottom of back arc to bottom of front arc)
    d += ` Z`;

    return (
      <g key={element.id} className="transition-opacity duration-300 hover:opacity-90">
        <defs>
            <linearGradient id={`grad-${element.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style={{stopColor: options.fillColor, stopOpacity: 0.4}} />
                <stop offset="50%" style={{stopColor: options.fillColor, stopOpacity: 0.2}} />
                <stop offset="100%" style={{stopColor: options.fillColor, stopOpacity: 0.4}} />
            </linearGradient>
        </defs>
        
        {/* Glass Body */}
        <path 
          d={d} 
          fill={options.fillLenses ? `url(#grad-${element.id})` : 'none'}
          stroke={options.strokeColor}
          strokeWidth="0.5"
          vectorEffect="non-scaling-stroke"
        />

        {/* Vertex Labels (S1, S2) */}
        {options.showSurfaceNumbers && (
          <>
            {/* Front Surface Label */}
            <text 
              x={zFront} 
              y={0} 
              dy={-2} // Shift slightly up
              dx={-2} // Shift slightly left
              fontSize={Math.max(4, maxH / 8)} 
              fill="#64748b" 
              textAnchor="end"
              className="select-none pointer-events-none font-sans font-bold"
              style={{ fontSize: `${Math.max(3, maxH/10)}px`}}
            >
              S{element.surfaceIndex}
            </text>
            
            {/* Back Surface Label */}
            <text 
              x={zBack} 
              y={0} 
              dy={-2} 
              dx={2} 
              fontSize={Math.max(4, maxH / 8)} 
              fill="#64748b" 
              textAnchor="start"
              className="select-none pointer-events-none font-sans font-bold"
              style={{ fontSize: `${Math.max(3, maxH/10)}px`}}
            >
              S{element.surfaceIndex + 1}
            </text>

            {/* Vertex Dots */}
             <circle cx={zFront} cy={0} r={maxH/60} fill={options.strokeColor} opacity={0.5} />
             <circle cx={zBack} cy={0} r={maxH/60} fill={options.strokeColor} opacity={0.5} />
          </>
        )}
      </g>
    );
  };

  if (!surfaces.length) return <div className="text-gray-400 p-10 text-center">No optical surfaces defined.</div>;

  return (
    <div className="w-full h-full bg-white rounded-lg overflow-hidden shadow-inner border border-slate-200">
      <svg 
        width="100%" 
        height="100%" 
        viewBox={viewBox} 
        preserveAspectRatio="xMidYMid meet"
        className="block"
      >
        {/* Grid / Background Pattern could go here */}
        
        {/* Optical Axis */}
        {options.showAxis && (
          <line 
            x1={vMinX} 
            y1={0} 
            x2={vMinX + vWidth} 
            y2={0} 
            stroke="#94a3b8" 
            strokeWidth="0.5" 
            strokeDasharray="4,2" 
            vectorEffect="non-scaling-stroke"
          />
        )}

        {/* Lenses */}
        {elements.map(renderLens)}

      </svg>
    </div>
  );
};

export default OpticalSystemRenderer;