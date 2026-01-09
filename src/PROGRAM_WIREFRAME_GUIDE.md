# SurfaceExpert-Style Program Wireframe Guide

## Overview

This guide provides step-by-step instructions for creating a new Electron + React application using the architectural patterns and UI style from SurfaceExpert. The goal is to create a "hollow wireframe" with the core structure in place, ready for you to implement your domain-specific features.

## What You'll Get

A modern desktop application with:

- **Left Panel**: File/folder tree management with context menus
- **Center Panel**: Tabbed interface for your content
- **Top Bar**: Custom title bar with window controls + menu bar with logo
- **Settings System**: Modal with theme/colorscale selection (extensible)
- **Reporting System**: HTML/PDF export infrastructure (customizable content)
- **Dark Theme**: Professional color scheme with consistent styling
- **No Domain Logic**: All surface/optical calculations removed

## Architecture Overview

```
YourApp/
├── package.json                    # Electron + React dependencies
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
│   │   ├── ui/
│   │   │   └── DebouncedInput.js  # Debounced input component
│   │   └── views/
│   │       └── DataView.js        # Tabular data display
│   ├── constants/
│   │   ├── colorscales.js         # Plotly colorscales (if needed)
│   │   └── colorPalettes.js       # UI theme definitions
│   └── utils/
│       ├── formatters.js          # Value formatting utilities
│       └── reportGenerator.js     # HTML/PDF export system
```

## Step-by-Step Build Instructions

### Phase 1: Project Setup

#### 1.1 Initialize Project

```bash
mkdir YourAppName
cd YourAppName
npm init -y
```

#### 1.2 Install Dependencies

```bash
# Production dependencies
npm install react@18.2.0 react-dom@18.2.0

# Development dependencies
npm install --save-dev electron@28.3.3 electron-builder@24.9.1
```

#### 1.3 Configure package.json

```json
{
  "name": "your-app-name",
  "version": "1.0.0",
  "description": "Your application description",
  "main": "src/main.js",
  "scripts": {
    "start": "electron .",
    "dev": "electron . --dev",
    "build": "electron-builder"
  },
  "build": {
    "appId": "com.yourcompany.yourapp",
    "productName": "Your App Name",
    "files": [
      "src/**/*",
      "node_modules/**/*",
      "package.json"
    ],
    "directories": {
      "output": "dist"
    },
    "win": {
      "target": "nsis",
      "icon": "build/icon.ico"
    },
    "mac": {
      "target": "dmg",
      "icon": "build/icon.icns"
    },
    "linux": {
      "target": "AppImage",
      "icon": "build/icon.png"
    }
  }
}
```

### Phase 2: Core Files (Copy from SurfaceExpert)

#### 2.1 Copy Essential Files

Copy these files **as-is** from SurfaceExpert:

```bash
# Core infrastructure
src/main.js              # Modify menu items and app name
src/preload.js           # No changes needed
src/styles.css           # No changes needed

# Components - UI Chrome
src/components/TitleBar.js        # No changes needed
src/components/MenuBar.js         # Modify menu structure
src/components/Icons.js           # No changes needed

# Dialogs
src/components/dialogs/ContextMenu.js    # No changes needed
src/components/dialogs/InputDialog.js    # No changes needed
src/components/dialogs/SettingsModal.js  # Modify settings options

# UI Components
src/components/ui/DebouncedInput.js      # No changes needed

# Constants
src/constants/colorPalettes.js           # No changes needed
src/constants/colorscales.js             # Optional, if using Plotly

# Utils
src/utils/formatters.js                  # Keep formatValue, degreesToDMS
src/utils/reportGenerator.js             # Modify report content
```

#### 2.2 Create index.html

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Security-Policy"
          content="default-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.plot.ly data:;">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your App Name</title>
    <link rel="stylesheet" href="styles.css">

    <!-- React UMD builds -->
    <script src="../node_modules/react/umd/react.production.min.js"></script>
    <script src="../node_modules/react-dom/umd/react-dom.production.min.js"></script>

    <!-- Optional: Plotly for data visualization -->
    <script src="https://cdn.plot.ly/plotly-2.27.0.min.js"></script>
</head>
<body>
    <div id="root"></div>

    <!-- Load application -->
    <script type="module" src="renderer.js"></script>
</body>
</html>
```

### Phase 3: Create Core Panels

#### 3.1 FilesPanel Component (Left Sidebar)

Create `src/components/panels/FilesPanel.js`:

```javascript
// FilesPanel.js - Left sidebar for file/folder management
export const FilesPanel = ({
  items,           // Array of items to display
  selectedItem,    // Currently selected item
  onSelectItem,    // Callback when item is selected
  onRenameItem,    // Callback for rename action
  onDeleteItem,    // Callback for delete action
  onCreateFolder,  // Callback for new folder
  onCreateItem,    // Callback for new item
  folders,         // Folder structure
  expandedFolders, // Set of expanded folder IDs
  onToggleFolder,  // Callback to expand/collapse
  colorScheme      // Color theme object
}) => {
  const c = colorScheme;

  // Folder tree rendering
  const renderFolderTree = () => {
    // TODO: Implement folder tree with expand/collapse
    // TODO: Add context menu on right-click
    // TODO: Add drag-and-drop support (future)
  };

  return React.createElement('div',
    { style: {
        width: '250px',
        height: '100%',
        backgroundColor: c.panel,
        borderRight: `1px solid ${c.border}`,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }
    },
    // Header with "Add" button
    React.createElement('div',
      { style: { padding: '10px', borderBottom: `1px solid ${c.border}` } },
      React.createElement('button',
        {
          onClick: onCreateItem,
          style: {
            width: '100%',
            padding: '8px',
            backgroundColor: c.accent,
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }
        },
        '+ New Item'
      )
    ),
    // Scrollable folder tree
    React.createElement('div',
      { style: { flex: 1, overflow: 'auto', padding: '10px' } },
      renderFolderTree()
    )
  );
};
```

#### 3.2 ContentPanel Component (Center Panel)

Create `src/components/panels/ContentPanel.js`:

```javascript
// ContentPanel.js - Center panel with tabs and content
export const ContentPanel = ({
  tabs,            // Array of tab names
  activeTab,       // Currently active tab
  onTabChange,     // Callback when tab is selected
  selectedItem,    // Currently selected item
  colorScheme      // Color theme object
}) => {
  const c = colorScheme;

  // Tab rendering
  const renderTabs = () => {
    return React.createElement('div',
      { style: {
          display: 'flex',
          borderBottom: `1px solid ${c.border}`,
          backgroundColor: c.panel
        }
      },
      tabs.map(tab =>
        React.createElement('div',
          {
            key: tab,
            onClick: () => onTabChange(tab),
            style: {
              padding: '12px 20px',
              cursor: 'pointer',
              borderBottom: activeTab === tab ? `2px solid ${c.accent}` : 'none',
              color: activeTab === tab ? c.text : c.textDim,
              fontWeight: activeTab === tab ? 'bold' : 'normal'
            }
          },
          tab
        )
      )
    );
  };

  // Tab content rendering
  const renderTabContent = () => {
    if (!selectedItem) {
      return React.createElement('div',
        { style: { padding: '40px', color: c.textDim, textAlign: 'center' } },
        'No item selected'
      );
    }

    // TODO: Render content based on activeTab
    switch (activeTab) {
      case 'Overview':
        return renderOverviewTab();
      case 'Details':
        return renderDetailsTab();
      case 'Data':
        return renderDataTab();
      default:
        return null;
    }
  };

  return React.createElement('div',
    { style: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' } },
    renderTabs(),
    React.createElement('div',
      { style: { flex: 1, overflow: 'auto', backgroundColor: c.bg } },
      renderTabContent()
    )
  );
};
```

### Phase 4: Main Application Component

#### 4.1 Create renderer.js

```javascript
// renderer.js - Main React application
import { TitleBar } from './components/TitleBar.js';
import { MenuBar } from './components/MenuBar.js';
import { FilesPanel } from './components/panels/FilesPanel.js';
import { ContentPanel } from './components/panels/ContentPanel.js';
import { SettingsModal } from './components/dialogs/SettingsModal.js';
import { getPalette } from './constants/colorPalettes.js';

const YourApp = () => {
  // State management
  const [items, setItems] = React.useState([]);
  const [selectedItem, setSelectedItem] = React.useState(null);
  const [activeTab, setActiveTab] = React.useState('Overview');
  const [folders, setFolders] = React.useState([]);
  const [expandedFolders, setExpandedFolders] = React.useState(new Set());
  const [showSettings, setShowSettings] = React.useState(false);
  const [settings, setSettings] = React.useState({
    colorscale: 'Viridis',
    theme: 'dark',
    // Add your app-specific settings here
  });

  // Color scheme
  const c = getPalette(settings.theme || 'dark');

  // Tab definitions
  const tabs = ['Overview', 'Details', 'Data', 'Export'];

  // Menu action handler
  const handleMenuAction = React.useCallback((action) => {
    switch (action) {
      case 'new-item':
        handleCreateItem();
        break;
      case 'delete-item':
        handleDeleteItem();
        break;
      case 'settings':
        setShowSettings(true);
        break;
      case 'export-html':
        handleExportHTML();
        break;
      case 'export-pdf':
        handleExportPDF();
        break;
      // Add your menu actions here
      default:
        console.log('Unknown action:', action);
    }
  }, [selectedItem, items]);

  // IPC listener for menu actions
  React.useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.onMenuAction(handleMenuAction);
    }
  }, [handleMenuAction]);

  // Item management functions
  const handleCreateItem = () => {
    // TODO: Implement item creation
  };

  const handleDeleteItem = () => {
    // TODO: Implement item deletion
  };

  const handleRenameItem = (id, newName) => {
    // TODO: Implement item renaming
  };

  // Report generation
  const handleExportHTML = () => {
    // TODO: Use reportGenerator.js to create HTML report
  };

  const handleExportPDF = () => {
    // TODO: Use reportGenerator.js to create PDF report
  };

  // Main layout
  return React.createElement('div',
    { style: {
        width: '100%',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: c.bg,
        color: c.text,
        fontFamily: 'Arial, sans-serif',
        overflow: 'hidden'
      }
    },
    // Title bar
    React.createElement(TitleBar, { colorScheme: c }),

    // Menu bar
    React.createElement(MenuBar, { colorScheme: c }),

    // Main content area
    React.createElement('div',
      { style: { flex: 1, display: 'flex', overflow: 'hidden' } },

      // Left panel - Files
      React.createElement(FilesPanel, {
        items,
        selectedItem,
        onSelectItem: setSelectedItem,
        onRenameItem: handleRenameItem,
        onDeleteItem: handleDeleteItem,
        onCreateFolder: () => {},
        onCreateItem: handleCreateItem,
        folders,
        expandedFolders,
        onToggleFolder: (id) => {
          const newExpanded = new Set(expandedFolders);
          if (newExpanded.has(id)) {
            newExpanded.delete(id);
          } else {
            newExpanded.add(id);
          }
          setExpandedFolders(newExpanded);
        },
        colorScheme: c
      }),

      // Center panel - Content
      React.createElement(ContentPanel, {
        tabs,
        activeTab,
        onTabChange: setActiveTab,
        selectedItem,
        colorScheme: c
      })
    ),

    // Settings modal
    showSettings && React.createElement(SettingsModal, {
      onClose: () => setShowSettings(false),
      settings,
      onSettingsChange: setSettings,
      colorScheme: c
    })
  );
};

// Mount application
window.addEventListener('load', () => {
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(React.createElement(YourApp));
});
```

### Phase 5: Customize Menu Bar

#### 5.1 Modify main.js Menu Template

In `src/main.js`, update the `createMenu()` function:

```javascript
function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Item',
          accelerator: 'CmdOrCtrl+N',
          click: () => mainWindow.webContents.send('menu-action', 'new-item')
        },
        {
          label: 'Open Folder',
          accelerator: 'CmdOrCtrl+O',
          click: () => mainWindow.webContents.send('menu-action', 'open-folder')
        },
        { type: 'separator' },
        {
          label: 'Export HTML Report',
          accelerator: 'CmdOrCtrol+E',
          click: () => mainWindow.webContents.send('menu-action', 'export-html')
        },
        {
          label: 'Export PDF Report',
          accelerator: 'CmdOrCtrl+P',
          click: () => mainWindow.webContents.send('menu-action', 'export-pdf')
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: 'CmdOrCtrl+Q',
          click: () => app.quit()
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        {
          label: 'Delete Item',
          accelerator: 'Delete',
          click: () => mainWindow.webContents.send('menu-action', 'delete-item')
        },
        {
          label: 'Rename Item',
          accelerator: 'F2',
          click: () => mainWindow.webContents.send('menu-action', 'rename-item')
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Refresh',
          accelerator: 'F5',
          click: () => mainWindow.webContents.send('menu-action', 'refresh')
        },
        { type: 'separator' },
        {
          label: 'Settings',
          accelerator: 'CmdOrCtrl+,',
          click: () => mainWindow.webContents.send('menu-action', 'settings')
        },
        { type: 'separator' },
        {
          label: 'Toggle Developer Tools',
          accelerator: 'CmdOrCtrl+Shift+I',
          click: () => mainWindow.webContents.toggleDevTools()
        }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About',
          click: () => mainWindow.webContents.send('menu-action', 'about')
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}
```

#### 5.2 Update MenuBar Component

Modify `src/components/MenuBar.js` to match your menu structure. Update the `menuStructure` array with your menu items.

### Phase 6: Customize Settings Modal

#### 6.1 Modify SettingsModal.js

Update `src/components/dialogs/SettingsModal.js` to include your app-specific settings:

```javascript
// In SettingsModal.js, modify the settings sections:

const settingsSections = [
  {
    title: 'Appearance',
    settings: [
      {
        label: 'Theme',
        type: 'select',
        key: 'theme',
        options: ['dark', 'light']
      },
      {
        label: 'Colorscale',
        type: 'select',
        key: 'colorscale',
        options: colorscales
      }
    ]
  },
  {
    title: 'Your App Settings',
    settings: [
      {
        label: 'Your Setting 1',
        type: 'input',
        key: 'yourSetting1',
        placeholder: 'Enter value...'
      },
      {
        label: 'Your Setting 2',
        type: 'checkbox',
        key: 'yourSetting2'
      }
      // Add more settings as needed
    ]
  }
];
```

### Phase 7: Customize Report Generator

#### 7.1 Modify reportGenerator.js

Update `src/utils/reportGenerator.js` to generate reports with your domain-specific content:

```javascript
// reportGenerator.js modifications

export const generateHTMLReport = (item, settings) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${item.name} - Report</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #4a90e2; }
        .section { margin: 20px 0; padding: 15px; background: #f5f5f5; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 8px; text-align: left; border: 1px solid #ddd; }
        th { background: #4a90e2; color: white; }
      </style>
    </head>
    <body>
      <h1>${item.name}</h1>

      <div class="section">
        <h2>Overview</h2>
        <!-- TODO: Add your report content here -->
      </div>

      <div class="section">
        <h2>Data</h2>
        <table>
          <thead>
            <tr>
              <th>Column 1</th>
              <th>Column 2</th>
              <th>Column 3</th>
            </tr>
          </thead>
          <tbody>
            <!-- TODO: Add your data rows here -->
          </tbody>
        </table>
      </div>

      <div class="section">
        <h2>Charts</h2>
        <!-- TODO: Add embedded plots here if needed -->
      </div>
    </body>
    </html>
  `;

  return html;
};

export const exportHTMLReport = async (item, settings) => {
  const html = generateHTMLReport(item, settings);
  // Use Electron dialog to save file
  // ... (keep existing save logic)
};

export const exportPDFReport = async (item, settings) => {
  const html = generateHTMLReport(item, settings);
  // Convert to PDF using Electron printToPDF
  // ... (keep existing PDF logic)
};
```

### Phase 8: Remove Domain-Specific Code

#### 8.1 Files to Delete

Remove all surface calculation and optical-specific files:

```bash
# Delete these files
rm src/calculationsWrapper.js
rm src/zmxParser.js
rm src/calculations.py
rm src/surfaceFitter.py
rm src/utils/calculations.js
rm src/utils/surfaceTransformations.js
rm src/utils/surfaceOperationHandlers.js
rm src/utils/zmxImportHandlers.js
rm src/utils/dataSanitization.js
rm src/constants/surfaceTypes.js
rm src/components/panels/PropertiesPanel.js
rm src/components/panels/SurfacesPanel.js
rm src/components/panels/VisualizationPanel.js
rm src/components/plots/*.js
rm src/components/dialogs/ZMXImportDialog.js
rm src/components/dialogs/ConversionDialog.js
rm src/components/dialogs/ConversionResultsDialog.js
rm src/components/dialogs/NormalizeUnZDialog.js
rm src/components/views/SummaryView.js
rm test_*.js
rm test_*.html
```

#### 8.2 Clean Up Dependencies

Remove unused dependencies from `package.json` if you're not using Plotly or other libraries.

## Key Architectural Patterns to Follow

### 1. State Management Pattern

**Use React hooks for state:**
```javascript
const [items, setItems] = React.useState([]);
const [selectedItem, setSelectedItem] = React.useState(null);
```

**Always create new objects/arrays for state updates:**
```javascript
// ✓ Good
setItems([...items, newItem]);
setItems(items.map(item => item.id === id ? { ...item, name: newName } : item));

// ✗ Bad
items.push(newItem);
setItems(items);
```

### 2. Color Scheme Usage

**Always pass and use colorScheme:**
```javascript
const c = colorScheme;

style={{
  backgroundColor: c.panel,
  color: c.text,
  border: `1px solid ${c.border}`
}}
```

### 3. Component Pattern (No JSX)

**Use React.createElement:**
```javascript
React.createElement('div',
  { style: { padding: '10px' } },
  React.createElement('h3', null, 'Title'),
  children
)
```

### 4. IPC Communication Pattern

**Main process sends:**
```javascript
mainWindow.webContents.send('menu-action', 'action-name');
```

**Renderer receives:**
```javascript
React.useEffect(() => {
  if (window.electronAPI) {
    window.electronAPI.onMenuAction(handleMenuAction);
  }
}, [handleMenuAction]);
```

### 5. File Persistence Pattern

**Save data to local files:**
```javascript
// In main.js
ipcMain.handle('save-data', async (event, data) => {
  const filePath = path.join(app.getPath('userData'), 'data.json');
  await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2));
});

// In renderer
await window.electronAPI.saveData(items);
```

## Testing Your Wireframe

### 1. Run Development Mode

```bash
npm run dev
```

**Expected result:**
- Window opens with custom title bar
- Menu bar displays with correct items
- Left panel shows empty file tree with "New Item" button
- Center panel shows tabs
- Settings modal opens with Ctrl+,

### 2. Test Menu Actions

- **File → New Item**: Should trigger `new-item` action
- **Edit → Delete**: Should trigger `delete-item` action
- **View → Settings**: Should open settings modal
- **Keyboard shortcuts**: Test all accelerators (Ctrl+N, F5, etc.)

### 3. Test Window Controls

- Minimize button should minimize window
- Maximize button should toggle window size
- Close button should close application

### 4. Test Theme Switching

- Open Settings (Ctrl+,)
- Change colorscale
- Verify UI updates with new colors

## Next Steps: Implementing Your Features

### 1. Define Your Data Model

```javascript
// Example item structure
const item = {
  id: 1,
  name: 'Item 1',
  type: 'your-type',
  folder: 'folder-id',
  data: {
    // Your domain-specific data
  },
  createdAt: Date.now(),
  modifiedAt: Date.now()
};
```

### 2. Implement Tab Content

For each tab in ContentPanel, create rendering logic:

```javascript
const renderOverviewTab = () => {
  return React.createElement('div',
    { style: { padding: '20px' } },
    React.createElement('h2', null, selectedItem.name),
    // Add your overview content
  );
};
```

### 3. Add Domain-Specific Calculations

Create new files in `src/utils/` for your business logic:

```javascript
// src/utils/yourCalculations.js
export const calculateSomething = (input) => {
  // Your logic here
  return result;
};
```

### 4. Implement Data Visualization

If you need plots, use Plotly.js:

```javascript
Plotly.newPlot('plot-container', data, layout, config);
```

### 5. Customize Reports

Update `reportGenerator.js` to include your data:

```javascript
const html = `
  <h1>${item.name}</h1>
  <p>Your metric: ${calculateMetric(item)}</p>
  <img src="data:image/png;base64,${plotImageBase64}" />
`;
```

## Code Style Guidelines

### Naming Conventions

- **Variables**: camelCase (`selectedItem`, `activeTab`)
- **Functions**: camelCase (`handleCreateItem`, `renderContent`)
- **Components**: PascalCase (`FilesPanel`, `ContentPanel`)
- **Constants**: camelCase (`colorschales`, `settings`)

### File Organization

- **Components**: `src/components/` organized by type (panels, dialogs, ui, views)
- **Utilities**: `src/utils/` for pure functions and business logic
- **Constants**: `src/constants/` for configuration data
- **Main files**: `src/` root level

### React Patterns

- **State**: Use hooks (`useState`, `useEffect`, `useCallback`)
- **Immutability**: Always create new objects/arrays
- **Props**: Pass via object destructuring
- **Inline styles**: Preferred over CSS classes (except global styles)

## Common Customizations

### Adding a New Menu Item

1. Add to menu template in `main.js`:
```javascript
{
  label: 'My Action',
  accelerator: 'CmdOrCtrl+M',
  click: () => mainWindow.webContents.send('menu-action', 'my-action')
}
```

2. Handle in `renderer.js`:
```javascript
case 'my-action':
  handleMyAction();
  break;
```

### Adding a New Tab

1. Add to tabs array:
```javascript
const tabs = ['Overview', 'Details', 'Data', 'My Tab'];
```

2. Add rendering logic:
```javascript
case 'My Tab':
  return renderMyTab();
```

### Adding a New Setting

1. Add to settings state:
```javascript
const [settings, setSettings] = React.useState({
  colorscale: 'Viridis',
  theme: 'dark',
  mySetting: 'default-value'
});
```

2. Add to SettingsModal.js:
```javascript
{
  label: 'My Setting',
  type: 'input',
  key: 'mySetting',
  placeholder: 'Enter value...'
}
```

### Adding a New Dialog

1. Create component in `src/components/dialogs/`:
```javascript
export const MyDialog = ({ onClose, onConfirm, colorScheme }) => {
  // Dialog implementation
};
```

2. Add state and trigger:
```javascript
const [showMyDialog, setShowMyDialog] = React.useState(false);

// In render:
showMyDialog && React.createElement(MyDialog, {
  onClose: () => setShowMyDialog(false),
  onConfirm: handleConfirm,
  colorScheme: c
})
```

## Troubleshooting

### Issue: Window doesn't open

**Check:**
- `package.json` has correct `main` field pointing to `src/main.js`
- All file paths are correct
- Dependencies installed: `npm install`

### Issue: Menu actions not working

**Check:**
- Main process menu sends correct action string
- Renderer has matching case in handleMenuAction
- IPC listener registered in useEffect

### Issue: Styles not loading

**Check:**
- `styles.css` path in `index.html` is correct
- CSP policy allows inline styles
- Color scheme object being passed to components

### Issue: React not rendering

**Check:**
- React UMD bundles loaded before `renderer.js`
- `#root` div exists in `index.html`
- No console errors in DevTools

## Build and Distribution

### Create Distributable

```bash
npm run build
```

**Output:** `dist/` directory with installers for your platform

### Platform-Specific Builds

```bash
npm run build -- --win    # Windows only
npm run build -- --mac    # macOS only
npm run build -- --linux  # Linux only
```

### Add Application Icon

1. Create icons:
   - Windows: `build/icon.ico` (256x256)
   - macOS: `build/icon.icns` (512x512)
   - Linux: `build/icon.png` (512x512)

2. Icons automatically used by electron-builder

## Conclusion

You now have a complete wireframe application with:

✅ Custom title bar and window controls
✅ Custom menu bar with logo
✅ Left panel for file/folder management
✅ Center panel with tabs
✅ Settings system with theme switching
✅ Report generation infrastructure
✅ Dark theme with consistent styling
✅ No domain-specific logic

The architecture is modular, maintainable, and ready for your custom features. Follow the patterns established in SurfaceExpert to maintain consistency and code quality.

## Additional Resources

- **Electron Documentation**: https://www.electronjs.org/docs
- **React Documentation**: https://react.dev/
- **Plotly.js Documentation**: https://plotly.com/javascript/
- **SurfaceExpert CLAUDE.md**: Detailed architecture guide with patterns and conventions

---

**Document Version**: 1.0
**Based on**: SurfaceExpert 2.9.1
**Last Updated**: 2026-01-09
