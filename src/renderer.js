// renderer.js - Main React application for ReportMaker
import { TitleBar } from './components/TitleBar.js';
import { MenuBar } from './components/MenuBar.js';
import { FilesPanel } from './components/panels/FilesPanel.js';
import { ContentPanel } from './components/panels/ContentPanel.js';
import { SettingsModal } from './components/dialogs/SettingsModal.js';
import { InputDialog } from './components/dialogs/InputDialog.js';
import { ContextMenu } from './components/dialogs/ContextMenu.js';
import { AboutDialog } from './components/dialogs/AboutDialog.js';
import { getPalette } from './constants/colorPalettes.js';
import { getTranslations } from './constants/locales.js';
import { parseZemaxFile } from './utils/zemaxParser.js';
import { loadAllCatalogs } from './utils/glassCatalogLoader.js';
import { calculateRefractiveIndexWithCatalog } from './utils/glassCalculator.js';

const ReportMaker = () => {
  console.log('ReportMaker component rendered');

  // State management
  const [systems, setSystems] = React.useState([]);
  const [selectedSystem, setSelectedSystem] = React.useState(null);
  const [activeTab, setActiveTab] = React.useState('Optical System');
  const [activeLensTab, setActiveLensTab] = React.useState('Lens 1');
  const [showSettings, setShowSettings] = React.useState(false);
  const [showAbout, setShowAbout] = React.useState(false);
  const [showInputDialog, setShowInputDialog] = React.useState(false);
  const [inputDialogConfig, setInputDialogConfig] = React.useState(null);
  const [contextMenu, setContextMenu] = React.useState(null);

  // Settings state
  const [theme, setTheme] = React.useState('dark');
  const [locale, setLocale] = React.useState('en');

  // Color scheme and translations
  const c = getPalette(theme);
  const t = getTranslations(locale);

  // Load glass catalogs on startup
  React.useEffect(() => {
    loadAllCatalogs().then(catalogs => {
      console.log('Loaded glass catalogs:', catalogs);
    }).catch(error => {
      console.error('Failed to load glass catalogs:', error);
    });
  }, []);

  // Load settings on startup
  React.useEffect(() => {
    if (window.electronAPI && window.electronAPI.loadSettings) {
      window.electronAPI.loadSettings().then(result => {
        if (result.success && result.settings) {
          if (result.settings.theme) setTheme(result.settings.theme);
          if (result.settings.locale) setLocale(result.settings.locale);
        }
      });
    }
  }, []);

  // Load optical systems on startup
  React.useEffect(() => {
    loadSystems();
  }, []);

  const loadSystems = async () => {
    if (window.electronAPI && window.electronAPI.loadSystems) {
      const result = await window.electronAPI.loadSystems();
      if (result.success) {
        setSystems(result.systems);
      }
    }
  };

  // Helper function to recalculate missing refractive indices
  const recalculateRefractiveIndices = (system) => {
    if (!system || !system.ldeData) return system;

    const wavelength = system.wavelength || 550;
    let updated = false;

    const updatedLdeData = system.ldeData.map(surface => {
      // If material exists but n or catalog is empty or missing, calculate it
      if (surface.material && ((!surface.n || surface.n === '') || (!surface.catalog || surface.catalog === ''))) {
        const result = calculateRefractiveIndexWithCatalog(surface.material, wavelength);
        if (result !== null) {
          console.log(`Recalculated n=${result.n.toFixed(6)} for ${surface.material} at ${wavelength}nm from ${result.catalog} catalog`);
          updated = true;
          return { ...surface, n: result.n.toFixed(6), catalog: result.catalog };
        }
      }
      return surface;
    });

    if (updated) {
      return { ...system, ldeData: updatedLdeData };
    }
    return system;
  };

  // Recalculate refractive indices when a system is selected
  const lastProcessedSystemRef = React.useRef(null);

  React.useEffect(() => {
    if (selectedSystem && selectedSystem.name) {
      // Check if this is a different system or if it needs recalculation
      const needsRecalc = selectedSystem.ldeData?.some(surface =>
        surface.material && ((!surface.n || surface.n === '') || (!surface.catalog || surface.catalog === ''))
      );

      // Only process if it's a new system selection or if it needs recalculation
      if (lastProcessedSystemRef.current !== selectedSystem && needsRecalc) {
        const updatedSystem = recalculateRefractiveIndices(selectedSystem);
        if (updatedSystem !== selectedSystem) {
          lastProcessedSystemRef.current = updatedSystem;
          setSelectedSystem(updatedSystem);
          // Save the updated system (folderPath removed, systems now have their own folders)
          if (window.electronAPI && window.electronAPI.saveSystem) {
            window.electronAPI.saveSystem(null, updatedSystem.name, updatedSystem);
          }
        }
      } else {
        // Track the current system even if no update was needed
        lastProcessedSystemRef.current = selectedSystem;
      }
    }
  }, [selectedSystem?.name]); // Only run when system name changes

  // Reset active lens tab if it's out of bounds when lenses change
  React.useEffect(() => {
    if (selectedSystem?.lenses && selectedSystem.lenses.length > 0) {
      const lensIndex = activeLensTab ? parseInt(activeLensTab.replace('Lens ', '')) - 1 : 0;

      // If the current lens tab is out of bounds, reset to Lens 1
      if (lensIndex >= selectedSystem.lenses.length) {
        setActiveLensTab('Lens 1');
      } else if (lensIndex < 0 || !activeLensTab) {
        setActiveLensTab('Lens 1');
      }
    } else if (selectedSystem?.lenses && selectedSystem.lenses.length === 0) {
      // No lenses, but keep the state for when lenses are added
      setActiveLensTab('Lens 1');
    }
  }, [selectedSystem?.lenses?.length, activeLensTab]);

  // Save settings whenever they change
  React.useEffect(() => {
    if (window.electronAPI && window.electronAPI.saveSettings) {
      const settings = { theme, locale };
      window.electronAPI.saveSettings(settings);
    }
  }, [theme, locale]);

  // Optical system management functions
  const handleCreateSystem = React.useCallback(async () => {
    console.log('handleCreateSystem called');

    // Generate unique name
    const baseName = 'New System';
    let name = baseName;
    let counter = 1;
    while (systems.some(s => s.name === name)) {
      name = `${baseName} ${counter}`;
      counter++;
    }

    const newSystem = {
      name: name,
      wavelength: 550, // nm
      ldeData: [
        { surface: 0, radius: Infinity, thickness: Infinity, material: '', catalog: '', n: '', semiDiameter: 0, diameter: 0 },
        { surface: 1, radius: Infinity, thickness: 10, material: '', catalog: '', n: '', semiDiameter: 10, diameter: 20 },
        { surface: 2, radius: Infinity, thickness: 0, material: '', catalog: '', n: '', semiDiameter: 10, diameter: 20 }
      ],
      createdAt: Date.now()
    };

    console.log('Creating system:', newSystem);

    if (window.electronAPI && window.electronAPI.saveSystem) {
      const result = await window.electronAPI.saveSystem(null, name, newSystem);
      console.log('Save result:', result);
      if (result.success) {
        await loadSystems();
        setSelectedSystem(newSystem);
      }
    }
  }, [systems, loadSystems]);

  const handleDeleteSystem = React.useCallback(async (system) => {
    if (window.electronAPI && window.electronAPI.deleteSystem) {
      const result = await window.electronAPI.deleteSystem(null, system.name);
      if (result.success) {
        await loadSystems();
        if (selectedSystem?.name === system.name) {
          setSelectedSystem(null);
        }
      }
    }
  }, [selectedSystem, loadSystems]);

  const handleRenameSystem = React.useCallback((system) => {
    setInputDialogConfig({
      title: 'Rename Optical System',
      message: 'Enter new name:',
      defaultValue: system.name,
      onConfirm: async (newName) => {
        if (window.electronAPI && window.electronAPI.deleteSystem && window.electronAPI.saveSystem) {
          // Delete old system directory
          await window.electronAPI.deleteSystem(null, system.name);
          // Save with new name (creates new system directory)
          const updatedSystem = { ...system, name: newName };
          await window.electronAPI.saveSystem(null, newName, updatedSystem);
          await loadSystems();
          setSelectedSystem(updatedSystem);
        }
        setShowInputDialog(false);
        setInputDialogConfig(null);
      },
      onCancel: () => {
        setShowInputDialog(false);
        setInputDialogConfig(null);
      }
    });
    setShowInputDialog(true);
  }, [loadSystems]);

  // Save current system data
  const saveCurrentSystem = React.useCallback(async () => {
    if (selectedSystem && window.electronAPI && window.electronAPI.saveSystem) {
      const systemName = selectedSystem.name;
      await window.electronAPI.saveSystem(
        null,
        systemName,
        selectedSystem
      );

      // Reload systems to get the updated lens data
      await loadSystems();

      // Re-select the system to get the updated version with lenses
      const result = await window.electronAPI.loadSystems();
      if (result.success) {
        const updatedSystem = result.systems.find(s => s.name === systemName);
        if (updatedSystem) {
          setSelectedSystem(updatedSystem);
        }
      }
    }
  }, [selectedSystem, loadSystems]);

  // Import from Zemax file
  const handleImportZemax = React.useCallback(async () => {
    if (window.electronAPI && window.electronAPI.showOpenDialog && window.electronAPI.readFile) {
      const result = await window.electronAPI.showOpenDialog({
        title: 'Import Zemax File',
        filters: [
          { name: 'Zemax Files', extensions: ['zmx', 'ZMX'] },
          { name: 'All Files', extensions: ['*'] }
        ],
        properties: ['openFile']
      });

      if (!result.canceled && result.filePaths && result.filePaths.length > 0) {
        const filePath = result.filePaths[0];
        const fileReadResult = await window.electronAPI.readFile(filePath);

        if (fileReadResult.success) {
          try {
            const parsedData = parseZemaxFile(fileReadResult.content, filePath);

            if (parsedData) {
              // Create new system with parsed data
              const newSystem = {
                name: parsedData.name,
                description: parsedData.description,
                wavelength: parsedData.wavelength,
                ldeData: parsedData.ldeData,
                createdAt: Date.now()
              };

              // Save the system
              if (window.electronAPI.saveSystem) {
                const saveResult = await window.electronAPI.saveSystem(null, parsedData.name, newSystem);
                if (saveResult.success) {
                  await loadSystems();
                  setSelectedSystem(newSystem);
                }
              }
            }
          } catch (err) {
            console.error('Error parsing Zemax file:', err);
            alert(`Error parsing Zemax file: ${err.message}`);
          }
        } else {
          alert(`Error reading file: ${fileReadResult.error}`);
        }
      }
    }
  }, [loadSystems]);

  // Report generation
  const handleExportHTML = React.useCallback(() => {
    if (!selectedSystem) {
      alert('Please select a system to export');
      return;
    }
    console.log('Export HTML report for:', selectedSystem.name);
    alert('HTML export functionality will be implemented');
  }, [selectedSystem]);

  const handleExportPDF = React.useCallback(() => {
    if (!selectedSystem) {
      alert('Please select a system to export');
      return;
    }
    console.log('Export PDF report for:', selectedSystem.name);
    alert('PDF export functionality will be implemented');
  }, [selectedSystem]);

  // Menu action handler
  const handleMenuAction = React.useCallback((action) => {
    console.log('Menu action:', action);
    switch (action) {
      case 'new-item':
        handleCreateSystem();
        break;
      case 'delete-item':
        if (selectedSystem) {
          handleDeleteSystem(selectedSystem);
        }
        break;
      case 'rename-item':
        if (selectedSystem) {
          handleRenameSystem(selectedSystem);
        }
        break;
      case 'settings':
        setShowSettings(true);
        break;
      case 'about':
        setShowAbout(true);
        break;
      case 'export-html':
        handleExportHTML();
        break;
      case 'export-pdf':
        handleExportPDF();
        break;
      case 'refresh':
        loadSystems();
        break;
      default:
        console.log('Unknown action:', action);
    }
  }, [selectedSystem, handleCreateSystem, handleDeleteSystem, handleRenameSystem, handleExportHTML, handleExportPDF, loadSystems]);

  // IPC listener for menu actions
  React.useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.onMenuAction(handleMenuAction);
    }
  }, [handleMenuAction]);

  // Context menu handler
  const handleShowContextMenu = (event, type, target) => {
    event.preventDefault();
    event.stopPropagation();

    let menuItems = [];

    if (type === 'system') {
      menuItems = [
        {
          label: 'Rename',
          onClick: () => {
            handleRenameSystem(target);
            setContextMenu(null);
          }
        },
        {
          label: 'Delete',
          onClick: () => {
            handleDeleteSystem(target);
            setContextMenu(null);
          }
        }
      ];
    }

    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      items: menuItems
    });
  };

  // Window control handlers
  const handleWindowControl = (action) => {
    if (window.electronAPI) {
      switch (action) {
        case 'minimize':
          window.electronAPI.minimizeWindow?.();
          break;
        case 'maximize':
          window.electronAPI.maximizeWindow?.();
          break;
        case 'close':
          window.electronAPI.closeWindow?.();
          break;
      }
    }
  };

  // Main layout
  return React.createElement('div',
    {
      style: {
        width: '100%',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: c.bg,
        color: c.text,
        fontFamily: 'Arial, sans-serif',
        overflow: 'hidden'
      },
      onClick: () => setContextMenu(null) // Close context menu on click
    },
    // Title bar
    React.createElement(TitleBar, { c, onWindowControl: handleWindowControl }),

    // Menu bar
    React.createElement(MenuBar, { c, onMenuAction: handleMenuAction }),

    // Main content area
    React.createElement('div',
      { style: { flex: 1, display: 'flex', overflow: 'hidden' } },

      // Left panel - Systems
      React.createElement(FilesPanel, {
        systems,
        selectedSystem,
        onSelectSystem: setSelectedSystem,
        onRenameSystem: handleRenameSystem,
        onDeleteSystem: handleDeleteSystem,
        onCreateSystem: handleCreateSystem,
        onShowContextMenu: handleShowContextMenu,
        colorScheme: c,
        onImportZemax: handleImportZemax
      }),

      // Center panel - Content
      React.createElement(ContentPanel, {
        selectedSystem,
        setSelectedSystem,
        activeTab,
        onTabChange: setActiveTab,
        activeLensTab,
        onLensTabChange: setActiveLensTab,
        saveCurrentSystem,
        colorScheme: c,
        locale
      })
    ),

    // Settings modal
    showSettings && React.createElement(SettingsModal, {
      theme,
      setTheme,
      locale,
      setLocale,
      onClose: () => setShowSettings(false),
      c,
      t
    }),

    // Input dialog
    showInputDialog && inputDialogConfig && React.createElement(InputDialog, {
      inputDialog: inputDialogConfig,
      c,
      t
    }),

    // Context menu
    contextMenu && React.createElement(ContextMenu, {
      x: contextMenu.x,
      y: contextMenu.y,
      items: contextMenu.items,
      onClose: () => setContextMenu(null),
      colorScheme: c
    }),

    // About dialog
    showAbout && React.createElement(AboutDialog, {
      c,
      onClose: () => setShowAbout(false)
    })
  );
};

// Mount application
window.addEventListener('load', () => {
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(React.createElement(ReportMaker));
});
