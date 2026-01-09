# ReportMaker

ReportMaker is a desktop application built using the SurfaceExpert wireframe architecture. It provides a clean, modern interface for optical report generation with file management, tabbed content view, and customizable settings.

## Project Status

✅ **Wireframe Complete** - All UI components are in place and ready for functionality implementation.

## Features

### Current (UI Wireframe)

- ✅ Custom title bar with window controls (minimize, maximize, close)
- ✅ Custom menu bar with application branding
- ✅ Left sidebar for file/folder management
  - Create new items
  - Rename items
  - Delete items
  - Context menu support
- ✅ Center panel with 4 main tabs:
  1. **Optical System** - System configuration (placeholder)
  2. **Summary** - Summary information (placeholder)
  3. **Lenses** - Lens details with nested sub-tabs (Lens 1, Lens 2, Lens 3)
  4. **Autocollimation Points** - Autocollimation data (placeholder)
- ✅ Settings modal with theme switching
- ✅ Dark theme with professional color scheme
- ✅ Report generation infrastructure (HTML/PDF export)

### To Be Implemented

- [ ] Optical system data model and calculations
- [ ] Summary metrics computation
- [ ] Lens data management and display
- [ ] Autocollimation points data processing
- [ ] Report content customization
- [ ] Data persistence (save/load functionality)
- [ ] File import/export

## Installation

```bash
# Install dependencies
npm install

# Run in development mode (with DevTools)
npm run dev

# Run in production mode
npm start

# Build distributable packages
npm run build
```

## Project Structure

```
ReportMaker/
├── package.json                    # NPM dependencies and scripts
├── src/
│   ├── main.js                     # Electron main process
│   ├── preload.js                  # Security bridge (IPC)
│   ├── renderer.js                 # Main React application
│   ├── index.html                  # Entry point
│   ├── styles.css                  # Global styles
│   ├── components/
│   │   ├── TitleBar.js            # Custom window controls
│   │   ├── MenuBar.js             # Custom menu bar
│   │   ├── Icons.js               # SVG icon library
│   │   ├── panels/
│   │   │   ├── FilesPanel.js      # Left sidebar (file tree)
│   │   │   └── ContentPanel.js    # Center panel (tabs)
│   │   ├── dialogs/
│   │   │   ├── SettingsModal.js   # Settings dialog
│   │   │   ├── InputDialog.js     # Generic input dialog
│   │   │   └── ContextMenu.js     # Right-click menus
│   │   └── ui/
│   │       └── DebouncedInput.js  # Debounced input component
│   ├── constants/
│   │   ├── colorscales.js         # Plotly colorscales
│   │   └── colorPalettes.js       # UI theme definitions
│   └── utils/
│       ├── formatters.js          # Value formatting utilities
│       └── reportGenerator.js     # HTML/PDF export system
```

## Architecture

- **Frontend Framework**: Electron + React (vanilla, no JSX)
- **UI Pattern**: React.createElement (no build tools required)
- **Visualization**: Plotly.js (CDN)
- **IPC Communication**: contextBridge for security
- **State Management**: React hooks (useState, useEffect)

## Tabs Overview

### 1. Optical System Tab
Displays optical system configuration and parameters. Currently shows a placeholder.

**To implement:**
- System diagram
- Optical parameters input
- System specifications display

### 2. Summary Tab
Shows summary information and key metrics. Currently shows a placeholder.

**To implement:**
- Key performance indicators
- System overview metrics
- Quality assessments

### 3. Lenses Tab
Displays detailed information for individual lenses with nested sub-tabs. Currently shows placeholders for Lens 1, Lens 2, and Lens 3.

**To implement:**
- Lens parameters for each lens
- Lens performance metrics
- Surface data for each lens element
- Dynamic lens tab creation based on system configuration

### 4. Autocollimation Points Tab
Shows autocollimation points data. Currently shows a placeholder.

**To implement:**
- Autocollimation points table
- Point coordinates and measurements
- Visualization of points

## Development Guidelines

### Adding Functionality

1. **Data Model**: Define your data structures in `renderer.js` state
2. **Tab Content**: Implement rendering functions in `ContentPanel.js`
3. **Calculations**: Create utility functions in `src/utils/`
4. **UI Components**: Add reusable components in `src/components/ui/`
5. **Reports**: Customize report generation in `src/utils/reportGenerator.js`

### Code Style

- Use React.createElement (no JSX)
- Follow camelCase for variables and functions
- Use PascalCase for components
- Pass colorScheme object to all components for consistent theming
- Maintain immutability for state updates

### Color Scheme

The application uses a dark theme with the following colors:

```javascript
{
  bg: '#2b2b2b',        // Main background
  panel: '#353535',     // Panel background
  border: '#454545',    // Borders
  text: '#e0e0e0',      // Primary text
  textDim: '#a0a0a0',   // Secondary text
  accent: '#4a90e2',    // Accent color
  hover: '#454545'      // Hover state
}
```

## Keyboard Shortcuts

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

## Next Steps

1. **Define Data Models**: Create TypeScript interfaces or JSDoc types for your data structures
2. **Implement Calculations**: Add business logic for optical calculations
3. **Populate Tabs**: Fill in the placeholder content with real data and visualizations
4. **Add Persistence**: Implement save/load functionality for projects
5. **Customize Reports**: Update report templates with your specific content
6. **Add Tests**: Create unit tests for critical functionality

## Resources

- **Electron Documentation**: https://www.electronjs.org/docs
- **React Documentation**: https://react.dev/
- **Plotly.js Documentation**: https://plotly.com/javascript/
- **Base Architecture Guide**: See `PROGRAM_WIREFRAME_GUIDE.md` in parent directory

## License

MIT

---

**Version**: 1.0.0 (Wireframe)
**Created**: 2026-01-09
**Based on**: SurfaceExpert Architecture
