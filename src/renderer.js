// renderer.js - Main React application for ReportMaker
import { TitleBar } from './components/TitleBar.js';
import { MenuBar } from './components/MenuBar.js';
import { FilesPanel } from './components/panels/FilesPanel.js';
import { ContentPanel } from './components/panels/ContentPanel.js';
import { SettingsModal } from './components/dialogs/SettingsModal.js';
import { InputDialog } from './components/dialogs/InputDialog.js';
import { ContextMenu } from './components/dialogs/ContextMenu.js';
import { getPalette } from './constants/colorPalettes.js';
import { getTranslations } from './constants/locales.js';

const ReportMaker = () => {
  // State management
  const [items, setItems] = React.useState([]);
  const [selectedItem, setSelectedItem] = React.useState(null);
  const [activeTab, setActiveTab] = React.useState('Optical System');
  const [activeLensTab, setActiveLensTab] = React.useState('Lens 1');
  const [folders, setFolders] = React.useState([]);
  const [expandedFolders, setExpandedFolders] = React.useState(new Set());
  const [showSettings, setShowSettings] = React.useState(false);
  const [showInputDialog, setShowInputDialog] = React.useState(false);
  const [inputDialogConfig, setInputDialogConfig] = React.useState(null);
  const [contextMenu, setContextMenu] = React.useState(null);

  // Settings state (individual state variables for Settings modal)
  const [colorscale, setColorscale] = React.useState('Viridis');
  const [wavelength, setWavelength] = React.useState(632.8);
  const [gridSize3D, setGridSize3D] = React.useState(129);
  const [gridSize2D, setGridSize2D] = React.useState(513);
  const [theme, setTheme] = React.useState('dark');
  const [locale, setLocale] = React.useState('en');
  const [fastConvertThreshold, setFastConvertThreshold] = React.useState(0.000001);
  const [nextItemId, setNextItemId] = React.useState(1);

  // Color scheme and translations
  const c = getPalette(theme);
  const t = getTranslations(locale);

  // Menu action handler
  const handleMenuAction = React.useCallback((action) => {
    console.log('Menu action:', action);
    switch (action) {
      case 'new-item':
        handleCreateItem();
        break;
      case 'delete-item':
        if (selectedItem) {
          handleDeleteItem(selectedItem.id);
        }
        break;
      case 'rename-item':
        if (selectedItem) {
          handleRenameItem(selectedItem);
        }
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
      case 'refresh':
        // Refresh logic (placeholder)
        console.log('Refresh triggered');
        break;
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
    setInputDialogConfig({
      title: 'Create New Item',
      message: 'Enter item name:',
      defaultValue: `Item ${nextItemId}`,
      onConfirm: (name) => {
        const newItem = {
          id: nextItemId,
          name: name || `Item ${nextItemId}`,
          folderId: null,
          color: `hsl(${(nextItemId * 137) % 360}, 70%, 60%)`, // Random color
          lenses: ['Lens 1', 'Lens 2', 'Lens 3'],
          createdAt: Date.now()
        };
        setItems([...items, newItem]);
        setSelectedItem(newItem);
        setNextItemId(nextItemId + 1);
        setShowInputDialog(false);
        setInputDialogConfig(null);
      },
      onCancel: () => {
        setShowInputDialog(false);
        setInputDialogConfig(null);
      }
    });
    setShowInputDialog(true);
  };

  const handleDeleteItem = (id) => {
    const updatedItems = items.filter(item => item.id !== id);
    setItems(updatedItems);
    if (selectedItem?.id === id) {
      setSelectedItem(updatedItems.length > 0 ? updatedItems[0] : null);
    }
  };

  const handleRenameItem = (item) => {
    setInputDialogConfig({
      title: 'Rename Item',
      message: 'Enter new name:',
      defaultValue: item.name,
      onConfirm: (newName) => {
        const updatedItems = items.map(i =>
          i.id === item.id ? { ...i, name: newName } : i
        );
        setItems(updatedItems);
        if (selectedItem?.id === item.id) {
          setSelectedItem({ ...selectedItem, name: newName });
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
  };

  // Toggle folder expansion
  const handleToggleFolder = (folderId) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  // Context menu handler
  const handleShowContextMenu = (event, type, target) => {
    event.preventDefault();
    event.stopPropagation();

    const menuItems = type === 'item'
      ? [
          {
            label: 'Rename',
            onClick: () => {
              handleRenameItem(target);
              setContextMenu(null);
            }
          },
          {
            label: 'Delete',
            onClick: () => {
              handleDeleteItem(target.id);
              setContextMenu(null);
            }
          }
        ]
      : [];

    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      items: menuItems
    });
  };

  // Report generation (placeholder)
  const handleExportHTML = () => {
    if (!selectedItem) {
      alert('Please select an item to export');
      return;
    }
    console.log('Export HTML report for:', selectedItem.name);
    alert('HTML export functionality will be implemented');
  };

  const handleExportPDF = () => {
    if (!selectedItem) {
      alert('Please select an item to export');
      return;
    }
    console.log('Export PDF report for:', selectedItem.name);
    alert('PDF export functionality will be implemented');
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

      // Left panel - Files
      React.createElement(FilesPanel, {
        items,
        selectedItem,
        onSelectItem: setSelectedItem,
        onRenameItem: handleRenameItem,
        onDeleteItem: handleDeleteItem,
        onCreateItem: handleCreateItem,
        folders,
        expandedFolders,
        onToggleFolder: handleToggleFolder,
        onShowContextMenu: handleShowContextMenu,
        colorScheme: c
      }),

      // Center panel - Content
      React.createElement(ContentPanel, {
        selectedItem,
        activeTab,
        onTabChange: setActiveTab,
        activeLensTab,
        onLensTabChange: setActiveLensTab,
        colorScheme: c
      })
    ),

    // Settings modal
    showSettings && React.createElement(SettingsModal, {
      colorscale,
      setColorscale,
      wavelength,
      setWavelength,
      gridSize3D,
      setGridSize3D,
      gridSize2D,
      setGridSize2D,
      theme,
      setTheme,
      locale,
      setLocale,
      fastConvertThreshold,
      setFastConvertThreshold,
      onClose: () => setShowSettings(false),
      c,
      t
    }),

    // Input dialog
    showInputDialog && inputDialogConfig && React.createElement(InputDialog, {
      title: inputDialogConfig.title,
      message: inputDialogConfig.message,
      defaultValue: inputDialogConfig.defaultValue,
      onConfirm: inputDialogConfig.onConfirm,
      onCancel: inputDialogConfig.onCancel,
      colorScheme: c
    }),

    // Context menu
    contextMenu && React.createElement(ContextMenu, {
      x: contextMenu.x,
      y: contextMenu.y,
      items: contextMenu.items,
      onClose: () => setContextMenu(null),
      colorScheme: c
    })
  );
};

// Mount application
window.addEventListener('load', () => {
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(React.createElement(ReportMaker));
});
