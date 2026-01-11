
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
    return sign * (rAbs - Math.sqrt(rAbs * rAbs - y * y));
  };

  // Generate an array of points {x, y} for a spherical arc
  const generateArcPoints = (zVertex: number, radius: number, semiDiam: number, numPoints = 60, reverse = false) => {
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
    color = '#000000',
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
    const textY = yLevel - (fontSizeBase * 0.4); 

    return (
      <g className="dimension-group">
        {/* Extension Lines */}
        <line x1={x1} y1={y1} x2={x1} y2={yLevel} stroke={color} strokeWidth="0.5" strokeDasharray="2,1" opacity="0.6" vectorEffect="non-scaling-stroke" />
        <line x1={x2} y1={y2} x2={x2} y2={yLevel} stroke={color} strokeWidth="0.5" strokeDasharray="2,1" opacity="0.6" vectorEffect="non-scaling-stroke" />
        
        {/* Main Dimension Line */}
        <line 
            x1={x1} y1={yLevel} 
            x2={x2} y2={yLevel} 
            stroke={color} 
            strokeWidth="1" 
            markerEnd="url(#arrowhead)" 
            markerStart="url(#arrowhead-rev)" 
            vectorEffect="non-scaling-stroke"
        />
        
        {/* Label - Above the line */}
        <text 
          x={(x1 + x2) / 2} 
          y={textY} 
          fill={color} 
          fontSize={fontSizeBase} 
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

  const renderLens = (element: LensElement, index: number) => {
    const { zFront, zBack, frontSurface, backSurface } = element;
    
    const hFront = (frontSurface.diameter || 0) / 2;
    const hBack = (backSurface.diameter || 0) / 2;
    const rFront = frontSurface.radius;
    const rBack = backSurface.radius;

    const frontPoints = generateArcPoints(zFront, rFront, hFront, 60, false);
    const backPoints = generateArcPoints(zBack, rBack, hBack, 60, true);

    let d = `M ${frontPoints[0].x} ${frontPoints[0].y}`;
    frontPoints.slice(1).forEach(p => d += ` L ${p.x} ${p.y}`);
    d += ` L ${backPoints[0].x} ${backPoints[0].y}`;
    backPoints.slice(1).forEach(p => d += ` L ${p.x} ${p.y}`);
    d += ` Z`;

    // Dimension Points Calculation
    const zFrontEdge = zFront + calculateSag(rFront, hFront);
    const zBackEdge = zBack + calculateSag(rBack, hBack);
    
    // Bounds for meniscus box check
    const lensMinZ = Math.min(zFront, zBack, zFrontEdge, zBackEdge);
    const lensMaxZ = Math.max(zFront, zBack, zFrontEdge, zBackEdge);
    const boxLength = lensMaxZ - lensMinZ;
    const ct = Math.abs(zBack - zFront);
    const et = Math.abs(zBackEdge - zFrontEdge);
    
    // Logic to show Bounding Box dimension if it differs significantly from CT and ET
    const isMeniscusBigBox = boxLength > ct * 1.05 && boxLength > et * 1.05;

    // Stagger logic: Alternating heights for adjacent elements to avoid overlap
    const stagger = index % 2 === 0 ? 0 : dimSpacing * 1.2;
    
    // Levels
    const ctLevel = (maxH + dimSpacing) + stagger;
    const etLevel = -(maxH + dimSpacing) - stagger;
    const oalLevel = -(maxH + dimSpacing * 2.2) - stagger;

    // Determine anchors for OAL (Leftmost and Rightmost points)
    // For Top Dimensions, we prefer connecting to the top edge (-h) or axis (0)
    const getLeftAnchor = () => {
        if (zFront <= zFrontEdge) return { x: zFront, y: 0 }; // Vertex is leftmost
        return { x: zFrontEdge, y: -hFront }; // Top Edge is leftmost
    };
    const getRightAnchor = () => {
        if (zBack >= zBackEdge) return { x: zBack, y: 0 }; // Vertex is rightmost
        return { x: zBackEdge, y: -hBack }; // Top Edge is rightmost
    };

    const leftAnchor = getLeftAnchor();
    const rightAnchor = getRightAnchor();

    return (
      <g key={element.id} className="transition-opacity duration-300">
        
        {/* Glass Body with Gradient */}
        <path 
          d={d} 
          fill={options.fillLenses ? "url(#lensGradient)" : "none"}
          fillOpacity={options.fillLenses ? 0.9 : 0}
          stroke={options.strokeColor}
          strokeWidth="0.5"
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
              fontSize={fontSizeBase * 0.8} 
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
              fontSize={fontSizeBase * 0.8} 
              fill="#64748b" 
              textAnchor="start"
              className="select-none pointer-events-none font-sans font-bold opacity-80"
            >
              S{element.surfaceIndex + 1}
            </text>
            
             {/* Small Vertex Markers */}
             <circle cx={zFront} cy={0} r={maxH/120} fill="black" />
             <circle cx={zBack} cy={0} r={maxH/120} fill="black" />
          </>
        )}

        {/* Dimensions */}
        {options.showDimensions && (
            <>
                {/* Center Thickness (CT) - Below Axis */}
                <DrawDimension 
                    x1={zFront} 
                    y1={0} 
                    x2={zBack} 
                    y2={0} 
                    yLevel={ctLevel}
                    label={`CT ${ct.toFixed(2)}`}
                />

                {/* Edge Thickness (ET) - Above Lens */}
                <DrawDimension 
                    x1={zFrontEdge} 
                    y1={-hFront} 
                    x2={zBackEdge} 
                    y2={-hBack} 
                    yLevel={etLevel} 
                    label={`ET ${et.toFixed(2)}`}
                    onTop={true}
                />

                {/* Overall Length (OAL) - Above ET */}
                {isMeniscusBigBox && (
                     <DrawDimension 
                        x1={leftAnchor.x} 
                        y1={leftAnchor.y} 
                        x2={rightAnchor.x} 
                        y2={rightAnchor.y} 
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
            {/* Glass Gradient */}
            <linearGradient id="lensGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#dbeafe" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#eff6ff" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#bfdbfe" stopOpacity="0.9" />
            </linearGradient>

            {/* Solid Black Arrow Markers */}
            <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill="#000000" />
            </marker>
            <marker id="arrowhead-rev" markerWidth="8" markerHeight="6" refX="1" refY="3" orient="auto">
                <polygon points="8 0, 0 3, 8 6" fill="#000000" />
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
