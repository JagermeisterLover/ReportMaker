import React from 'react';

/**
 * OpticalSystemRenderer - Renders optical systems with accurate lens geometry and technical dimensions
 * 
 * Updated Features:
 * - Fully geometry-relative stroke widths (fixes small system visibility)
 * - Surface labels moved to optical center (near axis)
 * - Dimensions scaled proportionally
 * - markers use userSpaceOnUse to guarantee visibility relative to geometry
 */
export const OpticalSystemRenderer = ({ surfaces, options = {}, width = 800, height = 400 }: any) => {
  // --- Default Options ---
  const {
    showAxis = true,
    showSurfaceNumbers = true,
    showDimensions = false,
    fillLenses = true,
    strokeColor = '#1e3a8a',
    fillColor = '#dbeafe',
    axisColor = '#94a3b8',
    surfaceNumberColor = '#475569',
    showTTL = true,
    showCT = true,
    showET = true,
    showOAL = true
  } = options;

  // --- Geometry Calculation Helpers ---

  const calculateSag = (radius: number, y: number) => {
    if (radius === 0 || !isFinite(radius)) return 0;
    const rAbs = Math.abs(radius);
    if (Math.abs(y) > rAbs) {
      return radius > 0 ? rAbs : -rAbs;
    }
    const sign = Math.sign(radius);
    const sqrtArg = rAbs * rAbs - y * y;
    return sign * (rAbs - Math.sqrt(sqrtArg < 0 ? 0 : sqrtArg));
  };

  const generateArcPoints = (zVertex: number, radius: number, semiDiam: number, numPoints = 60) => {
    const points = [];
    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints;
      const y = -semiDiam + t * (2 * semiDiam);
      const sag = calculateSag(radius, y);
      points.push({ x: zVertex + sag, y });
    }
    return points;
  };

  // --- Process Surfaces into Lens Elements ---

  if (!surfaces || surfaces.length === 0) {
    return React.createElement('div', {
      style: { color: '#9ca3af', padding: '40px', textAlign: 'center' }
    }, 'No optical surfaces defined.');
  }

  const elements: any[] = [];
  let currentZ = 0;
  let i = 0;
  let maxDia = 0;

  while (i < surfaces.length - 1) {
    const s1 = surfaces[i];
    const s2 = surfaces[i + 1];

    const hasMaterial = s1.material &&
                        s1.material.toUpperCase() !== 'AIR' &&
                        s1.material.trim() !== '' &&
                        s1.material.toUpperCase() !== 'MIRROR';

    const hasRefractiveIndex = s1.n &&
                               parseFloat(s1.n) > 1.0 &&
                               parseFloat(s1.n) !== 1.0;

    const isGlass = hasMaterial || hasRefractiveIndex;
    const thickness = parseFloat(s1.thickness || 0);

    if (isGlass) {
      elements.push({
        id: `lens-${i}`,
        type: 'lens',
        zFront: currentZ,
        zBack: currentZ + thickness,
        frontSurface: s1,
        backSurface: s2,
        surfaceIndex: i + 1
      });
      maxDia = Math.max(maxDia, s1.diameter || 0, s2.diameter || 0);
      currentZ += thickness;
      i++;
    } else {
      currentZ += thickness;
      maxDia = Math.max(maxDia, s1.diameter || 0);
      i++;
    }
  }

  // --- Dynamic Scaling Factors ---
  // Fix: Scaling fully relative to geometry units (maxH)
  const maxH = maxDia / 2;
  const scaleRef = maxH > 0 ? maxH : 10;
  
  // Ratios relative to Semi-Diameter
  const fontSizeSurface = scaleRef * 0.25; 
  const fontSizeDim = scaleRef * 0.22;
  const arrowLen = scaleRef * 0.15; // Arrow length in user units
  const arrowWidth = arrowLen * 0.6; 
  
  // Dynamic stroke widths (Critical for small systems)
  // Removed non-scaling-stroke logic, using geometry units
  const strokeMain = scaleRef * 0.015;  // ~1.5% of semi-diameter
  const strokeDim = scaleRef * 0.01;    // ~1% of semi-diameter
  const strokeAxis = scaleRef * 0.008;

  // --- Calculate ViewBox Bounds ---

  let maxZ = currentZ;
  elements.forEach(el => {
    const h1 = parseFloat(el.frontSurface.diameter || 0) / 2;
    const sag1 = calculateSag(parseFloat(el.frontSurface.radius || 0), h1);
    const h2 = parseFloat(el.backSurface.diameter || 0) / 2;
    const sag2 = calculateSag(parseFloat(el.backSurface.radius || 0), h2);
    maxZ = Math.max(maxZ, el.zFront + sag1, el.zBack + sag2);
  });

  const dimSpacing = Math.max(maxH * 0.5, maxZ * 0.1);
  const dimensionMarginY = showDimensions ? dimSpacing * 4.5 : dimSpacing;

  const marginX = (maxZ * 0.1) + (scaleRef * 1.5); 
  const marginY = (maxH * 0.1) + dimensionMarginY;
  
  const vMinX = -marginX;
  const vMinY = -(maxH + marginY);
  const vWidth = maxZ + marginX * 2;
  const vHeight = (maxH + marginY) * 2;
  const viewBox = `${vMinX} ${vMinY} ${vWidth} ${vHeight}`;

  // --- Dimension Drawing Helper ---

  const DrawDimension = ({ x1, y1, x2, y2, yLevel, label }: any) => {
    // Check if text fits
    const width = Math.abs(x2 - x1);
    // Approximation: Average char aspect ratio ~0.6 of font height
    const textWidthApprox = label.length * (fontSizeDim * 0.6); 
    const arrowPadding = arrowLen * 2.5; 
    
    // Fix: If dimension is too small, extend line to the right
    const isTight = width < (textWidthApprox + arrowPadding);

    const commonProps = {
        stroke: '#000000',
        opacity: 1,
        vectorEffect: undefined // Explicitly undefined to ensure scaling
    };

    if (!isTight) {
        // Standard Centered Dimension
        return React.createElement('g', { className: 'dimension-group' }, [
            React.createElement('line', { key: 'e1', x1, y1, x2: x1, y2: yLevel, strokeWidth: strokeDim, ...commonProps }),
            React.createElement('line', { key: 'e2', x1: x2, y1: y2, x2: x2, y2: yLevel, strokeWidth: strokeDim, ...commonProps }),
            React.createElement('line', { 
                key: 'main', x1, y1: yLevel, x2, y2: yLevel, 
                strokeWidth: strokeMain, markerEnd: 'url(#arrowhead)', markerStart: 'url(#arrowhead-rev)', ...commonProps 
            }),
            React.createElement('text', {
                key: 'lbl', x: (x1 + x2) / 2, y: yLevel - (fontSizeDim * 0.3),
                fill: '#000000', fontSize: fontSizeDim, textAnchor: 'middle', fontWeight: '600',
                style: { userSelect: 'none', pointerEvents: 'none', textShadow: `0px 0px ${strokeMain*2}px white` }
            }, label)
        ]);
    } else {
        // Extended Dimension (Leader line to the right)
        const extensionLength = textWidthApprox + (fontSizeDim * 1.5);
        const textCenter = x2 + (extensionLength / 2);

        return React.createElement('g', { className: 'dimension-group' }, [
            React.createElement('line', { key: 'e1', x1, y1, x2: x1, y2: yLevel, strokeWidth: strokeDim, ...commonProps }),
            React.createElement('line', { key: 'e2', x1: x2, y1: y2, x2: x2, y2: yLevel, strokeWidth: strokeDim, ...commonProps }),
            // Arrows line (short)
            React.createElement('line', { 
                key: 'main', x1, y1: yLevel, x2, y2: yLevel, 
                strokeWidth: strokeMain, markerEnd: 'url(#arrowhead)', markerStart: 'url(#arrowhead-rev)', ...commonProps 
            }),
            // Extension line
            React.createElement('line', {
                key: 'ext-right', x1: x2, y1: yLevel, x2: x2 + extensionLength, y2: yLevel,
                strokeWidth: strokeDim, ...commonProps
            }),
            // Text on extension
            React.createElement('text', {
                key: 'lbl', x: textCenter, y: yLevel - (fontSizeDim * 0.3),
                fill: '#000000', fontSize: fontSizeDim, textAnchor: 'middle', fontWeight: '600',
                style: { userSelect: 'none', pointerEvents: 'none', textShadow: `0px 0px ${strokeMain*2}px white` }
            }, label)
        ]);
    }
  };

  // --- Rendering Helper ---

  const renderLens = (element: any, index: number) => {
    const { id, zFront, zBack, frontSurface, backSurface, surfaceIndex } = element;

    const hFront = parseFloat(frontSurface.diameter || frontSurface.semiDiameter * 2 || 0) / 2;
    const hBack = parseFloat(backSurface.diameter || backSurface.semiDiameter * 2 || 0) / 2;
    const rFront = parseFloat(frontSurface.radius || 0);
    const rBack = parseFloat(backSurface.radius || 0);
    const hMaxElem = Math.max(hFront, hBack);

    const frontPoints = generateArcPoints(zFront, rFront, hFront, 60);
    const backPoints = generateArcPoints(zBack, rBack, hBack, 60);

    // Path Construction
    const pFrontTop = frontPoints[frontPoints.length - 1];
    let d = `M ${pFrontTop.x} ${pFrontTop.y}`;
    if (hFront < hMaxElem) d += ` L ${pFrontTop.x} ${hMaxElem}`;
    const pBackTop = backPoints[backPoints.length - 1];
    d += ` L ${pBackTop.x} ${hMaxElem}`;
    if (hBack < hMaxElem) d += ` L ${pBackTop.x} ${hBack}`;
    for (let i = backPoints.length - 2; i >= 0; i--) d += ` L ${backPoints[i].x} ${backPoints[i].y}`;
    const pBackBottom = backPoints[0];
    if (hBack < hMaxElem) d += ` L ${pBackBottom.x} ${-hMaxElem}`;
    const pFrontBottom = frontPoints[0];
    d += ` L ${pFrontBottom.x} ${-hMaxElem}`;
    if (hFront < hMaxElem) d += ` L ${pFrontBottom.x} ${-hFront}`;
    for (let i = 1; i < frontPoints.length; i++) d += ` L ${frontPoints[i].x} ${frontPoints[i].y}`;
    d += ` Z`;

    const zFrontEdge = zFront + calculateSag(rFront, hFront);
    const zBackEdge = zBack + calculateSag(rBack, hBack);
    const ct = Math.abs(zBack - zFront);
    const et = Math.abs(zBackEdge - zFrontEdge);
    const boxLength = Math.max(zFront, zBack, zFrontEdge, zBackEdge) - Math.min(zFront, zBack, zFrontEdge, zBackEdge);
    const isMeniscusBigBox = boxLength > ct * 1.05 && boxLength > et * 1.05;

    const stagger = index % 2 === 0 ? 0 : dimSpacing * 1.5;
    const ctLevel = (maxH + dimSpacing) + stagger;
    const etLevel = -(maxH + dimSpacing) - stagger;
    const oalLevel = -(maxH + dimSpacing * 2.5) - stagger;

    const childElements = [];

    // Glass Body
    childElements.push(React.createElement('path', {
        key: 'glass-body', d, fill: fillLenses ? 'url(#lensGradient)' : 'none',
        fillOpacity: fillLenses ? 0.9 : 0, stroke: strokeColor, strokeWidth: strokeMain, 
    }));

    // Surface Labels - MOVED TO CENTER (Near Axis)
    if (showSurfaceNumbers) {
      // Position slightly above axis (negative Y in SVG)
      const labelY = -(fontSizeSurface * 1.2); 
      
      childElements.push(React.createElement('text', {
        key: 'front-label', x: zFront, y: labelY,
        fontSize: fontSizeSurface, fill: surfaceNumberColor, textAnchor: 'middle',
        style: { userSelect: 'none', pointerEvents: 'none', fontWeight: 'bold', opacity: 1 }
      }, `S${surfaceIndex}`));

      childElements.push(React.createElement('text', {
        key: 'back-label', x: zBack, y: labelY,
        fontSize: fontSizeSurface, fill: surfaceNumberColor, textAnchor: 'middle',
        style: { userSelect: 'none', pointerEvents: 'none', fontWeight: 'bold', opacity: 1 }
      }, `S${surfaceIndex + 1}`));
    }

    if (showDimensions) {
      if (showCT) childElements.push(React.createElement(DrawDimension, { key: 'ct', x1: zFront, y1: 0, x2: zBack, y2: 0, yLevel: ctLevel, label: `CT ${ct.toFixed(2)}` }));
      if (showET) childElements.push(React.createElement(DrawDimension, { key: 'et', x1: zFrontEdge, y1: -hFront, x2: zBackEdge, y2: -hBack, yLevel: etLevel, label: `ET ${et.toFixed(2)}` }));
      if (showOAL && isMeniscusBigBox) {
        const leftX = zFront <= zFrontEdge ? zFront : zFrontEdge;
        const rightX = zBack >= zBackEdge ? zBack : zBackEdge;
        childElements.push(React.createElement(DrawDimension, { key: 'oal', x1: leftX, y1: 0, x2: rightX, y2: 0, yLevel: oalLevel, label: `OAL ${boxLength.toFixed(2)}` }));
      }
    }

    return React.createElement('g', { key: id, style: { transition: 'opacity 0.3s' } }, childElements);
  };

  const svgElements: any[] = [];
  const defsChildren = [];

  defsChildren.push(React.createElement('linearGradient', {
      key: 'lensGradient', id: 'lensGradient', x1: '0%', y1: '0%', x2: '100%', y2: '100%'
    }, [
      React.createElement('stop', { key: 's1', offset: '0%', stopColor: '#dbeafe', stopOpacity: '0.8' }),
      React.createElement('stop', { key: 's2', offset: '50%', stopColor: '#eff6ff', stopOpacity: '0.4' }),
      React.createElement('stop', { key: 's3', offset: '100%', stopColor: '#bfdbfe', stopOpacity: '0.9' })
  ]));

  // Markers using userSpaceOnUse for geometry-relative consistency
  defsChildren.push(React.createElement('marker', {
      key: 'arrowhead', id: 'arrowhead', 
      markerWidth: arrowLen, markerHeight: arrowWidth, 
      refX: arrowLen, refY: arrowWidth/2, 
      orient: 'auto',
      markerUnits: 'userSpaceOnUse' 
    }, React.createElement('polygon', { points: `0 0, ${arrowLen} ${arrowWidth/2}, 0 ${arrowWidth}`, fill: '#000000' })));

  defsChildren.push(React.createElement('marker', {
      key: 'arrowhead-rev', id: 'arrowhead-rev', 
      markerWidth: arrowLen, markerHeight: arrowWidth, 
      refX: 0, refY: arrowWidth/2, 
      orient: 'auto',
      markerUnits: 'userSpaceOnUse'
    }, React.createElement('polygon', { points: `${arrowLen} 0, 0 ${arrowWidth/2}, ${arrowLen} ${arrowWidth}`, fill: '#000000' })));

  svgElements.push(React.createElement('defs', { key: 'defs' }, defsChildren));

  if (showAxis) {
    svgElements.push(React.createElement('line', {
        key: 'axis', x1: vMinX, y1: 0, x2: vMinX + vWidth, y2: 0,
        stroke: axisColor, strokeWidth: strokeAxis, strokeDasharray: `${scaleRef*0.5},${scaleRef*0.25}`
    }));
  }

  elements.forEach((el, idx) => svgElements.push(renderLens(el, idx)));

  if (showDimensions && showTTL && elements.length > 0) {
    const sysStart = elements[0].zFront;
    const sysEnd = elements[elements.length - 1].zBack;
    const ttlLevel = maxH + dimSpacing * 4;
    svgElements.push(React.createElement(DrawDimension, {
        key: 'ttl', x1: sysStart, y1: 0, x2: sysEnd, y2: 0, yLevel: ttlLevel, label: `TTL ${Math.abs(sysEnd - sysStart).toFixed(2)}`
    }));
  }

  return React.createElement('div', {
      style: { width: '100%', height: '100%', background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: 'inset 0 2px 4px 0 rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' }
    }, React.createElement('svg', {
      width: '100%', height: '100%', viewBox: viewBox, preserveAspectRatio: 'xMidYMid meet', style: { display: 'block' }
    }, svgElements)
  );
};

export default OpticalSystemRenderer;