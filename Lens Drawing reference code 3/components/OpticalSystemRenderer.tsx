
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
    if (Math.abs(y) > rAbs) return radius > 0 ? rAbs : -rAbs; // Clamp
    
    // Sag formula
    const sign = Math.sign(radius);
    return sign * (rAbs - Math.sqrt(rAbs * rAbs - y * y < 0 ? 0 : rAbs * rAbs - y * y));
  };

  // Generate an array of points {x, y} for a spherical arc
  // Generates points from bottom (-semiDiam) to top (+semiDiam)
  const generateArcPoints = (zVertex: number, radius: number, semiDiam: number, numPoints = 60) => {
    const points: { x: number; y: number }[] = [];
    
    for (let i = 0; i <= numPoints; i++) {
      // Linear distribution of y from -h to +h
      const t = i / numPoints;
      const y = -semiDiam + t * (2 * semiDiam);
      const sag = calculateSag(radius, y);
      points.push({ x: zVertex + sag, y });
    }
    return points;
  };

  // Process surfaces into Lens Elements
  const { elements, maxZ, maxH } = useMemo(() => {
    if (!surfaces || surfaces.length === 0) return { elements: [], maxZ: 100, maxH: 50, systemTotalTrack: 0 };

    const els: LensElement[] = [];
    let currentZ = 0;
    let i = 0;
    let maxDia = 0;

    while (i < surfaces.length - 1) {
      const s1 = surfaces[i];
      const s2 = surfaces[i + 1];

      // Check if s1 starts a glass medium
      const isGlass = s1.material && s1.material.toUpperCase() !== 'AIR' && s1.material.trim() !== '';

      if (isGlass) {
        els.push({
          id: `lens-${i}`,
          type: 'lens',
          zFront: currentZ,
          zBack: currentZ + s1.thickness,
          frontSurface: s1,
          backSurface: s2,
          surfaceIndex: i + 1 
        });
        
        maxDia = Math.max(maxDia, s1.diameter, s2.diameter);
        currentZ += s1.thickness;
        i++; 
      } else {
        currentZ += s1.thickness;
        maxDia = Math.max(maxDia, s1.diameter);
        i++;
      }
    }
    
    // Final check for max Z
    const finalZ = currentZ; 
    
    let localMaxH = maxDia / 2;
    let localMaxZ = finalZ;

    // Recalculate strict bounding box of lenses for viewbox
    els.forEach(el => {
       const h1 = (el.frontSurface.diameter || 0) / 2;
       const sag1 = calculateSag(el.frontSurface.radius, h1);
       const h2 = (el.backSurface.diameter || 0) / 2;
       const sag2 = calculateSag(el.backSurface.radius, h2);
       
       localMaxZ = Math.max(localMaxZ, el.zFront + sag1, el.zBack + sag2);
    });

    return { elements: els, maxZ: localMaxZ, maxH: localMaxH, systemTotalTrack: finalZ };
  }, [surfaces]);

  // ViewBox Calculations
  const fontSizeBase = Math.max(3, maxH / 10);
  const dimensionFontSize = fontSizeBase * 0.6; // Smaller font for dimensions
  
  // Staggering offsets
  const dimSpacing = fontSizeBase * 2.5;
  const dimensionMarginY = options.showDimensions ? maxH + dimSpacing * 4 : 0;
  
  const marginX = maxZ * 0.2 + 20;
  const marginY = maxH * 0.2 + 10 + dimensionMarginY;
  
  const vMinX = -marginX;
  const vMinY = -(maxH + marginY);
  const vWidth = maxZ + marginX * 2;
  const vHeight = (maxH + marginY) * 2;
  const viewBox = `${vMinX} ${vMinY} ${vWidth} ${vHeight}`;

  // Helper to draw a single dimension
  const DrawDimension = ({ 
    x1, y1, 
    x2, y2, 
    yLevel, 
    label, 
    onTop = false
  }: { 
    x1: number, y1: number, 
    x2: number, y2: number, 
    yLevel: number, 
    label: string, 
    color?: string,
    onTop?: boolean
  }) => {
    
    // Calculate text position: above the line
    const textY = yLevel - (dimensionFontSize * 0.4); 
    const solidBlack = "#000000";

    return (
      <g className="dimension-group">
        {/* Extension Lines - Solid Black */}
        <line x1={x1} y1={y1} x2={x1} y2={yLevel} stroke={solidBlack} strokeWidth="0.5" vectorEffect="non-scaling-stroke" opacity="1" />
        <line x1={x2} y1={y2} x2={x2} y2={yLevel} stroke={solidBlack} strokeWidth="0.5" vectorEffect="non-scaling-stroke" opacity="1" />
        
        {/* Main Dimension Line */}
        <line 
            x1={x1} y1={yLevel} 
            x2={x2} y2={yLevel} 
            stroke={solidBlack} 
            strokeWidth="0.8" 
            markerEnd="url(#arrowhead)" 
            markerStart="url(#arrowhead-rev)" 
            vectorEffect="non-scaling-stroke"
        />
        
        {/* Label */}
        <text 
          x={(x1 + x2) / 2} 
          y={textY} 
          fill={solidBlack} 
          fontSize={dimensionFontSize} 
          textAnchor="middle"
          fontWeight="600"
          className="font-sans select-none"
          style={{ textShadow: '0px 0px 4px white' }}
        >
          {label}
        </text>
      </g>
    );
  };

  /**
   * FIX DOCUMENTATION:
   * 
   * The `renderLens` function handles the drawing of individual lens elements.
   * 
   * Edge Handling Logic:
   * If the lens has different diameters for its front and back surfaces (e.g., aperture mismatch),
   * we cannot simply connect the endpoints of the two optical surfaces. Instead:
   * 1. We calculate `hMax`, the maximum semi-diameter.
   * 2. We draw vertical "flat" faces at the edge of the smaller surface extending to `hMax`.
   * 3. We draw a horizontal "cylinder" connecting the front and back planes at `hMax`.
   * 
   * This creates a "Step" or "Flat" appearance characteristic of mounted optics where the 
   * mechanical diameter is determined by the largest clear aperture.
   * 
   * Path Construction is Counter-Clockwise:
   * Front Top -> Edge Up/Right -> Back Top -> Back Surface (Down) -> Back Bottom -> Edge Down/Left -> Front Bottom -> Front Surface (Up).
   */
  const renderLens = (element: LensElement, index: number) => {
    const { zFront, zBack, frontSurface, backSurface } = element;
    
    const hFront = (frontSurface.diameter || 0) / 2;
    const hBack = (backSurface.diameter || 0) / 2;
    const rFront = frontSurface.radius;
    const rBack = backSurface.radius;
    
    // Determine the mechanical outer radius (max of apertures)
    const hMax = Math.max(hFront, hBack);

    // Generate arc points from Bottom (-h) to Top (+h)
    const frontPoints = generateArcPoints(zFront, rFront, hFront, 60);
    const backPoints = generateArcPoints(zBack, rBack, hBack, 60);

    // --- Path Construction (Counter-Clockwise) ---
    
    // 1. Start at Front Top
    const pFrontTop = frontPoints[frontPoints.length - 1];
    let d = `M ${pFrontTop.x} ${pFrontTop.y}`;

    // 2. Top Edge Connection (Front Top -> Back Top)
    // Vertical extension if front is smaller
    if (hFront < hMax) {
        d += ` L ${pFrontTop.x} ${hMax}`;
    }
    
    // Horizontal Cylinder (Front Z @ hMax -> Back Z @ hMax)
    // We connect the Z-plane of the rim.
    const pBackTop = backPoints[backPoints.length - 1];
    d += ` L ${pBackTop.x} ${hMax}`;

    // Vertical extension down if back is smaller
    if (hBack < hMax) {
        d += ` L ${pBackTop.x} ${hBack}`;
    }

    // 3. Back Surface (Top -> Bottom)
    // Iterate backwards through generated points
    for (let i = backPoints.length - 2; i >= 0; i--) {
        d += ` L ${backPoints[i].x} ${backPoints[i].y}`;
    }
    const pBackBottom = backPoints[0];

    // 4. Bottom Edge Connection (Back Bottom -> Front Bottom)
    // Vertical extension down if back is smaller (to -hMax)
    if (hBack < hMax) {
        d += ` L ${pBackBottom.x} ${-hMax}`;
    }

    // Horizontal Cylinder (Back Z @ -hMax -> Front Z @ -hMax)
    const pFrontBottom = frontPoints[0];
    d += ` L ${pFrontBottom.x} ${-hMax}`;

    // Vertical extension up if front is smaller
    if (hFront < hMax) {
        d += ` L ${pFrontBottom.x} ${-hFront}`;
    }

    // 5. Front Surface (Bottom -> Top)
    for (let i = 1; i < frontPoints.length; i++) {
        d += ` L ${frontPoints[i].x} ${frontPoints[i].y}`;
    }
    d += ` Z`;

    // Dimension Points Calculation (for labeling)
    const zFrontEdge = zFront + calculateSag(rFront, hFront);
    const zBackEdge = zBack + calculateSag(rBack, hBack);
    
    const lensMinZ = Math.min(zFront, zBack, zFrontEdge, zBackEdge);
    const lensMaxZ = Math.max(zFront, zBack, zFrontEdge, zBackEdge);
    const boxLength = lensMaxZ - lensMinZ;
    const ct = Math.abs(zBack - zFront);
    const et = Math.abs(zBackEdge - zFrontEdge);
    
    const isMeniscusBigBox = boxLength > ct * 1.05 && boxLength > et * 1.05;

    // Stagger logic
    const stagger = index % 2 === 0 ? 0 : dimSpacing * 1.2;
    
    const ctLevel = (maxH + dimSpacing) + stagger;
    const etLevel = -(maxH + dimSpacing) - stagger;
    const oalLevel = -(maxH + dimSpacing * 2.2) - stagger;

    return (
      <g key={element.id} className="transition-opacity duration-300">
        
        {/* Solid Color Fill with Opacity */}
        <path 
          d={d} 
          fill={options.fillLenses ? options.fillColor : "none"}
          fillOpacity={options.fillLenses ? 0.3 : 0}
          stroke={options.strokeColor}
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />

        {/* Vertex Labels (S1, S2) */}
        {options.showSurfaceNumbers && (
          <>
            <text 
              x={zFront} 
              y={0} 
              dy={-2} 
              dx={-2} 
              fontSize={dimensionFontSize} 
              fill="#64748b" 
              textAnchor="end"
              className="select-none pointer-events-none font-sans font-bold opacity-80"
            >
              S{element.surfaceIndex}
            </text>
            
            <text 
              x={zBack} 
              y={0} 
              dy={-2} 
              dx={2} 
              fontSize={dimensionFontSize} 
              fill="#64748b" 
              textAnchor="start"
              className="select-none pointer-events-none font-sans font-bold opacity-80"
            >
              S{element.surfaceIndex + 1}
            </text>
            
             {/* Small Vertex Markers */}
             <circle cx={zFront} cy={0} r={maxH/150} fill="black" />
             <circle cx={zBack} cy={0} r={maxH/150} fill="black" />
          </>
        )}

        {/* Dimensions */}
        {options.showDimensions && (
            <>
                {/* Center Thickness (CT) */}
                <DrawDimension 
                    x1={zFront} 
                    y1={0} 
                    x2={zBack} 
                    y2={0} 
                    yLevel={ctLevel}
                    label={`CT ${ct.toFixed(2)}`}
                />

                {/* Edge Thickness (ET) */}
                <DrawDimension 
                    x1={zFrontEdge} 
                    y1={-hFront} 
                    x2={zBackEdge} 
                    y2={-hBack} 
                    yLevel={etLevel} 
                    label={`ET ${et.toFixed(2)}`}
                    onTop={true}
                />

                {/* Overall Length (OAL) */}
                {isMeniscusBigBox && (
                     <DrawDimension 
                        x1={Math.min(zFront, zFrontEdge)} 
                        y1={0} // approximate anchor
                        x2={Math.max(zBack, zBackEdge)} 
                        y2={0} // approximate anchor
                        yLevel={oalLevel} 
                        label={`OAL ${boxLength.toFixed(2)}`}
                        onTop={true}
                    />
                )}
            </>
        )}
      </g>
    );
  };

  if (!surfaces.length) return <div className="text-gray-400 p-10 text-center">No optical surfaces defined.</div>;

  // Determine System Start/End for Total Track
  const systemStart = elements.length > 0 ? elements[0].zFront : 0;
  const systemEnd = elements.length > 0 ? elements[elements.length - 1].zBack : 0;
  const totalTrack = Math.abs(systemEnd - systemStart);
  const ttlLevel = (maxH + dimSpacing * 4); 

  return (
    <div className="w-full h-full bg-white rounded-lg overflow-hidden shadow-inner border border-slate-200">
      <svg 
        width="100%" 
        height="100%" 
        viewBox={viewBox} 
        preserveAspectRatio="xMidYMid meet"
        className="block"
      >
        <defs>
            {/* Solid Black Arrow Markers */}
            <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
                <polygon points="0 0, 6 2, 0 4" fill="#000000" />
            </marker>
            <marker id="arrowhead-rev" markerWidth="6" markerHeight="4" refX="1" refY="2" orient="auto">
                <polygon points="6 0, 0 2, 6 4" fill="#000000" />
            </marker>
        </defs>

        {/* Optical Axis */}
        {options.showAxis && (
          <line 
            x1={vMinX} 
            y1={0} 
            x2={vMinX + vWidth} 
            y2={0} 
            stroke="#94a3b8" 
            strokeWidth="0.5" 
            strokeDasharray="10,5" 
            vectorEffect="non-scaling-stroke"
          />
        )}

        {/* Lenses */}
        {elements.map(renderLens)}

        {/* System Total Track Dimension */}
        {options.showDimensions && elements.length > 0 && (
             <DrawDimension 
                x1={systemStart} 
                y1={0} 
                x2={systemEnd} 
                y2={0} 
                yLevel={ttlLevel}
                label={`TTL ${totalTrack.toFixed(2)}`}
            />
        )}

      </svg>
    </div>
  );
};

export default OpticalSystemRenderer;
