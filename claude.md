# ReportMaker - Technical Documentation

## Overview

ReportMaker is a desktop application for optical system analysis and report generation. Built with Electron, React, and Plotly.js, it provides a comprehensive interface for managing optical lens data, importing Zemax files, and analyzing optical systems.

## Current Implementation Status

### Completed Features

#### Core Infrastructure
- Custom frameless window with title bar controls (minimize, maximize, close)
- Custom menu bar with application branding
- Electron IPC communication via contextBridge for security
- Persistent settings storage (theme, locale)
- Cross-platform desktop application (Windows, Mac, Linux via Electron)

#### File Management System
- **File tree navigation** with hierarchical folder structure
- **Create, rename, delete** operations for systems and folders
- **Context menu** support (right-click)
- **Persistent storage** in user data directory
- **Auto-save** functionality for all changes
- **File type icons** for visual distinction

#### Data Import & Parsing
- **Zemax file parser** (.zmx format)
  - Parses null-byte encoded Zemax files
  - Extracts wavelength data (PWAV, WAVM commands)
  - Parses surface data (SURF, CURV, THIC, DIAM, MIRR, STOP, etc.)
  - Material recognition and refractive index lookup
  - Automatic coordinate system handling
- **Glass catalog support**
  - AGF (Zemax Glass Catalog) file parser
  - Support for multiple catalogs (SCHOTT, OHARA, CDGM, HOYA, SUMITA)
  - Automatic refractive index calculation using dispersion formulas
  - Case-insensitive material lookup with catalog prefixing
  - Sellmeier formula implementation (Formula 1)

#### Optical System Data Model
- **LDE (Lens Data Editor)** structure with surface-by-surface data
  - Surface number, type, radius, thickness
  - Material, catalog, refractive index
  - Semi-diameter and diameter
  - Stop surface marking
  - Mirror surface support
- **Automatic lens extraction** from LDE data
  - Identifies individual lenses from surface pairs
  - Handles cemented doublets (consecutive material surfaces)
  - Dynamically generates lens tabs
- **System metadata**
  - Name, description
  - Primary wavelength (in nanometers)
  - Folder/hierarchy organization

#### User Interface

##### Main Layout
- **3-panel design**: file tree (left), content area (center), optional panels (future)
- **Responsive layout** with minimum window size constraints
- **Dark theme** with professional color palette
- **Internationalization support** (English, Russian)

##### Tab System
1. **Optical System Tab**
   - System name and description editing
   - Inline rename with auto-save
   - Metadata display

2. **LDE Tab** (Lens Data Editor)
   - **Excel-like spreadsheet interface** for surface editing
   - **Editable cells** with inline editing
   - **Cell selection** (single and multi-cell)
   - **Row selection** with visual feedback
   - **Context menu** for operations:
     - Insert row above/below
     - Delete rows
     - Copy/paste rows
   - **Material auto-lookup**: type a material name, automatic n and catalog population
   - **Live validation** and feedback
   - **Auto-save** on every change
   - **Keyboard navigation** (Tab, Enter, Arrow keys)
   - **Drag selection** for multiple cells
   - Columns: Stop, Radius, Thickness, Material, Catalog, n, Semi-Diameter, Diameter

3. **Lenses Tab**
   - **Dynamic sub-tabs** for each lens (Lens 1, Lens 2, etc.)
   - **Individual lens LDE tables** showing only relevant surfaces
   - **Read-only view** of lens-specific data
   - Automatic generation based on lens extraction

4. **Autocollimation Points Tab**
   - Placeholder for future autocollimation data

##### File Operations
- **Import Zemax files** via file picker
- **Create new systems** manually
- **Organize in folders** (unlimited nesting)
- **Rename and delete** with confirmation
- **File tree persistence** across sessions

#### Settings & Preferences
- **Theme selection** (dark mode implemented)
- **Language selection** (English, Russian)
- **Persistent settings** storage
- **Modal dialog** interface

#### Developer Features
- **DevTools toggle** (Ctrl+Shift+I)
- **Development mode** (--dev flag)
- **Console logging** for debugging
- **Error handling** with user feedback

### Architecture

#### Technology Stack
- **Runtime**: Electron 39.2.3
- **Frontend**: React 18.2.0 (vanilla, no JSX)
- **Visualization**: Plotly.js (CDN)
- **Build**: electron-builder
- **Styling**: Inline CSS-in-JS with theme system

#### Code Organization
```
src/
├── main.js                          # Electron main process
├── preload.js                       # IPC bridge (contextBridge)
├── renderer.js                      # React app entry point
├── index.html                       # HTML shell
├── styles.css                       # Global styles
├── components/
│   ├── TitleBar.js                  # Window controls
│   ├── MenuBar.js                   # Custom menu bar
│   ├── Icons.js                     # SVG icon library
│   ├── panels/
│   │   ├── FilesPanel.js           # File tree sidebar
│   │   └── ContentPanel.js         # Tab container
│   ├── tabs/
│   │   ├── OpticalSystemTab.js     # System metadata
│   │   ├── LDETab.js               # Spreadsheet editor
│   │   ├── LensesTab.js            # Lens-specific views
│   │   └── AutocollimationTab.js   # Placeholder
│   ├── dialogs/
│   │   ├── SettingsModal.js        # Settings dialog
│   │   ├── InputDialog.js          # Generic input
│   │   ├── ContextMenu.js          # Right-click menus
│   │   └── AboutDialog.js          # About dialog
│   └── ui/
│       └── DebouncedInput.js       # Debounced text input
├── utils/
│   ├── zemaxParser.js              # Zemax file parser
│   ├── glassCalculator.js          # Refractive index calculator
│   ├── glassCatalogLoader.js       # AGF catalog loader
│   ├── lensExtractor.js            # Lens identification
│   ├── formatters.js               # Value formatting
│   └── reportGenerator.js          # HTML/PDF export
└── constants/
    ├── colorPalettes.js            # Theme definitions
    ├── colorscales.js              # Plotly color scales
    └── locales.js                  # Translations
```

#### Data Flow
1. **Main process** (main.js)
   - Window management
   - File system operations
   - IPC handlers
   - Settings persistence

2. **Preload script** (preload.js)
   - Secure IPC bridge via contextBridge
   - Exposes electronAPI to renderer

3. **Renderer process** (renderer.js)
   - React state management
   - UI rendering
   - User interactions
   - IPC invocations

#### State Management
- **React hooks** (useState, useEffect, useRef)
- **Immutable updates** for all state changes
- **Auto-save** on every modification
- **Lazy loading** of glass catalogs
- **Ref-based optimization** for preventing duplicate calculations

### Data Models

#### System Object
```javascript
{
  name: string,              // System name
  description: string,       // Optional description
  folderPath: string,        // Path in file tree (e.g., "Folder1/Subfolder2")
  wavelength: number,        // Primary wavelength in nm (default: 550)
  ldeData: Array<Surface>,   // Array of surfaces
  lenses: Array<Lens>        // Auto-extracted lenses
}
```

#### Surface Object
```javascript
{
  surfaceNumber: number,     // Surface index (0, 1, 2, ...)
  type: string,             // "STANDARD", "MIRROR", etc.
  radius: string,           // Radius of curvature (formatted number)
  thickness: string,        // Thickness/distance to next surface
  material: string,         // Material name (e.g., "N-BK7", "MIRROR")
  catalog: string,          // Catalog name (e.g., "SCHOTT", "OHARA")
  n: string,                // Refractive index (6 decimal places)
  semiDiameter: string,     // Semi-diameter (aperture)
  diameter: string,         // Full diameter (2 × semi-diameter)
  stop: boolean,            // True if aperture stop
  comment: string           // Optional surface comment
}
```

#### Lens Object
```javascript
{
  lensNumber: number,        // Lens index (1, 2, 3, ...)
  surfaces: [Surface, Surface], // First and second surface
  ldeData: Array<Surface>    // Copy of surface data for display
}
```

#### Glass Database Entry
```javascript
{
  name: string,              // Glass name (e.g., "N-BK7")
  catalog: string,           // Catalog (e.g., "SCHOTT")
  formulaNumber: number,     // Dispersion formula ID
  coefficients: Array<number> // Formula coefficients
}
```

### File Formats

#### Zemax (.zmx) Format
- Null-byte encoded text format
- Command-based structure (SURF, CURV, THIC, etc.)
- Wavelength data: PWAV, WAVM
- Material data: GLAS command
- Surface properties: DIAM, MIRR, STOP

#### AGF (Glass Catalog) Format
- Text-based catalog format
- NM (name) lines define glass names
- CD (coefficient data) lines define dispersion coefficients
- Supports multiple formulas (Sellmeier, etc.)

#### JSON Storage Format
Systems are stored as JSON files in the user data directory:
```
<userData>/Systems/
  Folder1/
    System1.json
    System2.json
  Folder2/
    System3.json
```

Settings stored at:
```
<userData>/settings.json
```

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+N | New Item |
| Delete | Delete Item |
| F2 | Rename Item |
| F5 | Refresh |
| Ctrl+E | Export HTML Report |
| Ctrl+P | Export PDF Report |
| Ctrl+, | Settings |
| Ctrl+Shift+I | Toggle DevTools |

### User Data Locations

#### Windows
```
C:\Users\<username>\AppData\Roaming\report-maker\
  data/              (reserved for future use)
  Systems/           (system JSON files)
  settings.json      (application settings)
```

#### macOS
```
~/Library/Application Support/report-maker/
```

#### Linux
```
~/.config/report-maker/
```

### Color Scheme (Dark Theme)

```javascript
{
  bg: '#2b2b2b',        // Main background
  panel: '#353535',     // Panel background
  border: '#454545',    // Borders
  text: '#e0e0e0',      // Primary text
  textDim: '#a0a0a0',   // Secondary text
  accent: '#4a90e2',    // Accent/highlight
  hover: '#454545',     // Hover state
  success: '#4caf50',   // Success indicators
  error: '#f44336',     // Error indicators
  warning: '#ff9800'    // Warning indicators
}
```

### Glass Catalog Implementation

#### Supported Catalogs
- SCHOTT (German manufacturer)
- OHARA (Japanese manufacturer)
- CDGM (China manufacturer)
- HOYA (Japanese manufacturer)
- SUMITA (Japanese manufacturer)

#### Dispersion Formula (Sellmeier - Formula 1)
```
n² - 1 = C1·λ²/(λ² - C2) + C3·λ²/(λ² - C4) + C5·λ²/(λ² - C6)
```
Where λ is wavelength in micrometers.

#### Material Lookup Strategy
1. Case-insensitive exact match
2. With catalog prefix (e.g., "SCHOTT:N-BK7")
3. Without catalog prefix (searches all catalogs)
4. Returns: { n, catalog, correctName }

### Recent Changes (vs. README.md)

The README.md was written when the project was just a wireframe. Since then, the following has been implemented:

#### New Features
- Full Zemax file import functionality
- Glass catalog system with 5+ manufacturers
- Automatic refractive index calculation
- Lens extraction from LDE data
- Excel-like LDE spreadsheet editor with:
  - Cell editing
  - Row selection
  - Multi-cell selection
  - Context menu operations
  - Drag selection
  - Material auto-lookup
- Lens-specific tabs with dynamic generation
- Auto-save throughout the application
- Internationalization (English/Russian)
- Persistent file tree with folder organization
- Settings persistence

#### Removed/Changed
- "Summary" tab removed (not needed)
- Tab structure changed: "Optical System", "LDE", "Lenses", "Autocollimation Points"
- Report generation (still placeholder, needs content implementation)

## Future Development

### High Priority
1. **Autocollimation Points Tab**
   - Data entry interface
   - Point visualization
   - Table display

2. **Report Generation**
   - Populate HTML/PDF templates with actual data
   - Lens diagrams and visualizations
   - Summary statistics

3. **Optical Calculations**
   - EFL (Effective Focal Length)
   - BFL (Back Focal Length)
   - Principal planes
   - Aberration analysis

### Medium Priority
4. **Visualization**
   - Optical system diagram (ray trace)
   - Lens cross-sections
   - Spot diagrams

5. **Export Functionality**
   - Export to CSV
   - Export to Excel
   - Export back to Zemax format

6. **Data Validation**
   - Surface data validation
   - Material existence checking
   - Thickness constraints

### Low Priority
7. **Advanced Features**
   - Undo/redo system
   - Copy/paste between systems
   - Batch operations
   - Search functionality

8. **UI Enhancements**
   - Light theme
   - More languages
   - Customizable layouts
   - Keyboard shortcuts customization

## Development Guidelines

### Code Style
- Use React.createElement (no JSX)
- camelCase for variables and functions
- PascalCase for components
- Pass colorScheme to all components for theming
- Maintain immutability for state updates
- Use meaningful variable names

### Adding New Features

#### New Tab
1. Create component in `src/components/tabs/`
2. Import in `ContentPanel.js`
3. Add to tab list
4. Implement rendering logic

#### New Utility Function
1. Create in `src/utils/`
2. Export as named function
3. Import where needed
4. Add JSDoc comments

#### New IPC Handler
1. Add handler in `main.js` setupIpcHandlers()
2. Expose via preload.js electronAPI
3. Call from renderer via window.electronAPI

#### New Setting
1. Add to settings object structure
2. Update load/save handlers
3. Add UI control in SettingsModal.js
4. Update default settings

### Testing Checklist
- [ ] Test in development mode (npm run dev)
- [ ] Test file operations (create, rename, delete)
- [ ] Test Zemax import with various files
- [ ] Test material lookup with different catalogs
- [ ] Test LDE editing (all cell types)
- [ ] Test settings persistence
- [ ] Test keyboard shortcuts
- [ ] Build and test distributable (npm run build)

### Performance Considerations
- Glass catalogs loaded lazily on startup
- Use React.useRef to prevent duplicate calculations
- Debounce text inputs where appropriate
- Minimize re-renders with proper state structure
- Use memoization for expensive calculations

### Security Notes
- contextBridge isolation enforced
- No nodeIntegration in renderer
- File operations restricted to user data directory
- Input sanitization for file names
- No arbitrary code execution

## Building & Distribution

### Development
```bash
npm install
npm run dev
```

### Production Build
```bash
npm run build
```

Output directory: `dist/`

### Build Configuration
- **App ID**: com.reportmaker.app
- **Product Name**: ReportMaker
- **Target**: NSIS installer (Windows x64)
- **ASAR**: enabled
- **Code signing**: disabled (set to null)

## Dependencies

### Runtime Dependencies
- react: ^18.2.0
- react-dom: ^18.2.0

### Development Dependencies
- electron: ^39.2.3
- electron-builder: ^24.9.1
- cross-env: ^7.0.3

### External Libraries (CDN)
- Plotly.js (loaded via CDN in index.html)

## Known Issues & Limitations

### Current Limitations
1. Only Sellmeier formula (Formula 1) implemented for glass catalogs
2. Report generation templates not populated with data
3. No undo/redo functionality
4. Limited error messages for invalid data
5. No batch import of multiple files
6. No optical calculations yet (EFL, BFL, etc.)
7. No ray tracing visualization

### Browser/Platform Quirks
- Windows: File paths use backslashes
- macOS: Custom title bar behaves differently
- Linux: Not extensively tested

## Troubleshooting

### Glass Catalog Not Loading
- Check console for errors
- Verify glass catalog files are in correct location
- Check file encoding (should be UTF-8)

### Zemax Import Fails
- Ensure file is valid .zmx format
- Check console for parsing errors
- Verify file is not corrupted

### Settings Not Persisting
- Check user data directory permissions
- Verify settings.json can be written
- Check console for file system errors

### Application Won't Start
- Clear user data directory
- Reinstall dependencies (npm install)
- Check Electron version compatibility

## Version History

**1.0.0** (2026-01-09)
- Initial wireframe release

**Current** (2026-01-10)
- Full Zemax import implementation
- Glass catalog system
- LDE spreadsheet editor
- Lens extraction and dynamic tabs
- Auto-save functionality
- Settings persistence
- Internationalization

## License

MIT

## Support & Contact

For issues, questions, or contributions, please refer to the project repository.

---

**Note**: This documentation reflects the current state of the project as of January 10, 2026. Features and implementation details may change as development continues.
