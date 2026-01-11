import React, { useState } from 'react';
import OpticalSystemRenderer from './components/OpticalSystemRenderer';
import { Surface, RenderOptions } from './types';

// --- Preset Data ---
const PRESETS: { name: string; description: string; surfaces: Surface[] }[] = [
  {
    name: 'Bi-Convex Lens',
    description: 'A simple positive lens with equal curvature on both sides.',
    surfaces: [
      { radius: 50, thickness: 15, material: 'N-BK7', diameter: 40 },
      { radius: -50, thickness: 50, material: 'Air', diameter: 40 }
    ]
  },
  {
    name: 'Cooke Triplet',
    description: 'A classic anastigmatic camera lens design consisting of three elements.',
    surfaces: [
      { radius: 22.0, thickness: 3.5, material: 'SK4', diameter: 18 },
      { radius: -142.6, thickness: 2.0, material: 'Air', diameter: 18 },
      { radius: -22.3, thickness: 1.5, material: 'F2', diameter: 14 },
      { radius: 22.3, thickness: 2.5, material: 'Air', diameter: 14 },
      { radius: 142.6, thickness: 3.5, material: 'SK4', diameter: 16 },
      { radius: -22.0, thickness: 10, material: 'Air', diameter: 16 }
    ]
  },
  {
    name: 'Double Gauss (Approximation)',
    description: 'A complex multi-element objective often used in high-aperture cameras.',
    surfaces: [
      { radius: 50.8, thickness: 7.5, material: 'LaF3', diameter: 50 },
      { radius: 150.2, thickness: 0.5, material: 'Air', diameter: 50 },
      { radius: 32.1, thickness: 8.5, material: 'SF1', diameter: 46 },
      { radius: 0, thickness: 15, material: 'Air', diameter: 40 }, // Stop space approx
      { radius: -28.5, thickness: 4.2, material: 'F2', diameter: 40 },
      { radius: 0, thickness: 9.5, material: 'LaK9', diameter: 46 },
      { radius: -35.2, thickness: 0.5, material: 'Air', diameter: 46 },
      { radius: 0, thickness: 6.5, material: 'SK16', diameter: 50 },
      { radius: -65.4, thickness: 20, material: 'Air', diameter: 50 }
    ]
  },
  {
    name: 'Meniscus & Cemented Doublet',
    description: 'Demonstrating mixed element types and cemented interfaces.',
    surfaces: [
      { radius: 30, thickness: 5, material: 'BK7', diameter: 25 },
      { radius: 45, thickness: 10, material: 'Air', diameter: 25 },
      { radius: 40, thickness: 8, material: 'SK2', diameter: 30 },
      { radius: -30, thickness: 4, material: 'SF5', diameter: 30 },
      { radius: -80, thickness: 30, material: 'Air', diameter: 30 }
    ]
  }
];

const App: React.FC = () => {
  const [activePresetIndex, setActivePresetIndex] = useState(0);
  const [options, setOptions] = useState<RenderOptions>({
    showAxis: true,
    showSurfaceNumbers: true,
    fillLenses: true,
    strokeColor: '#334155', // Slate 700
    fillColor: '#38bdf8'    // Sky 400
  });

  const activePreset = PRESETS[activePresetIndex];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      
      {/* Sidebar Controls */}
      <aside className="w-full md:w-80 bg-white border-r border-slate-200 p-6 flex flex-col gap-8 shadow-sm z-10">
        <div>
          <h1 className="text-xl font-bold text-slate-800 mb-2">Optical Visualizer</h1>
          <p className="text-sm text-slate-500">Render lens systems with high fidelity using SVG.</p>
        </div>

        {/* Preset Selector */}
        <div className="flex flex-col gap-3">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">System Preset</label>
          <div className="flex flex-col gap-2">
            {PRESETS.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => setActivePresetIndex(idx)}
                className={`text-left px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  activePresetIndex === idx
                    ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-600 ring-offset-2'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {preset.name}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-500 italic mt-1 leading-relaxed">
            {activePreset.description}
          </p>
        </div>

        {/* Display Options */}
        <div className="flex flex-col gap-3">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Render Options</label>
          
          <div className="space-y-3">
            <label className="flex items-center gap-3 text-sm text-slate-700 cursor-pointer">
              <input 
                type="checkbox" 
                checked={options.showAxis}
                onChange={e => setOptions({...options, showAxis: e.target.checked})}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
              Show Optical Axis
            </label>

            <label className="flex items-center gap-3 text-sm text-slate-700 cursor-pointer">
              <input 
                type="checkbox" 
                checked={options.showSurfaceNumbers}
                onChange={e => setOptions({...options, showSurfaceNumbers: e.target.checked})}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
              Show Vertex Labels (S1, S2)
            </label>

            <label className="flex items-center gap-3 text-sm text-slate-700 cursor-pointer">
              <input 
                type="checkbox" 
                checked={options.fillLenses}
                onChange={e => setOptions({...options, fillLenses: e.target.checked})}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
              Fill Glass
            </label>
          </div>
        </div>

        {/* Color Pickers */}
        <div className="flex flex-col gap-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Styling</label>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs text-slate-500 mb-1">Fill Color</label>
                    <div className="flex items-center gap-2">
                        <input 
                            type="color" 
                            value={options.fillColor}
                            onChange={(e) => setOptions({...options, fillColor: e.target.value})}
                            className="h-8 w-8 rounded cursor-pointer border-0 p-0"
                        />
                        <span className="text-xs font-mono text-slate-600">{options.fillColor}</span>
                    </div>
                </div>
                <div>
                    <label className="block text-xs text-slate-500 mb-1">Stroke Color</label>
                    <div className="flex items-center gap-2">
                        <input 
                            type="color" 
                            value={options.strokeColor}
                            onChange={(e) => setOptions({...options, strokeColor: e.target.value})}
                            className="h-8 w-8 rounded cursor-pointer border-0 p-0"
                        />
                        <span className="text-xs font-mono text-slate-600">{options.strokeColor}</span>
                    </div>
                </div>
            </div>
        </div>
      </aside>

      {/* Main Canvas Area */}
      <main className="flex-1 p-6 flex flex-col gap-6 overflow-hidden">
        {/* Surface Data Table */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-4 py-2 border-b border-slate-200">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Surface Data</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 bg-slate-50 uppercase border-b border-slate-200">
                        <tr>
                            <th className="px-4 py-3 font-medium">#</th>
                            <th className="px-4 py-3 font-medium">Radius (mm)</th>
                            <th className="px-4 py-3 font-medium">Thickness (mm)</th>
                            <th className="px-4 py-3 font-medium">Material</th>
                            <th className="px-4 py-3 font-medium">Diameter (mm)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {activePreset.surfaces.map((surf, i) => (
                            <tr key={i} className="hover:bg-slate-50">
                                <td className="px-4 py-2 font-mono text-slate-400">{i + 1}</td>
                                <td className="px-4 py-2 text-slate-700">{surf.radius === 0 ? 'Infinity' : surf.radius.toFixed(2)}</td>
                                <td className="px-4 py-2 text-slate-700">{surf.thickness.toFixed(2)}</td>
                                <td className="px-4 py-2">
                                    {surf.material && surf.material !== 'Air' ? (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                            {surf.material}
                                        </span>
                                    ) : (
                                        <span className="text-slate-400 italic">Air</span>
                                    )}
                                </td>
                                <td className="px-4 py-2 text-slate-700">{surf.diameter.toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

        {/* Renderer Component */}
        <div className="flex-1 min-h-[400px] relative">
            <OpticalSystemRenderer 
                surfaces={activePreset.surfaces} 
                options={options} 
            />
        </div>
      </main>
    </div>
  );
};

export default App;