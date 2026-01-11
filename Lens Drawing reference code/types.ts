export interface Surface {
  radius: number;
  thickness: number;
  material: string;
  diameter: number;
  semiDiameter?: number;
}

export interface RenderOptions {
  showAxis: boolean;
  showSurfaceNumbers: boolean;
  fillLenses: boolean;
  strokeColor: string;
  fillColor: string;
}

export interface LensElement {
  id: string;
  type: 'lens';
  zFront: number;
  zBack: number;
  frontSurface: Surface;
  backSurface: Surface;
  surfaceIndex: number;
}