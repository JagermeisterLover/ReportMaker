const { app, BrowserWindow, Menu, dialog, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    backgroundColor: '#2b2b2b',
    show: false,
    frame: false,
    titleBarStyle: 'hidden'
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Listen for maximize/unmaximize events and notify renderer
  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('window-maximized');
  });

  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('window-unmaximized');
  });

  createMenu();
  setupIpcHandlers();
}

function createMenu() {
  // Remove the default menu bar - we use a custom one in the renderer
  Menu.setApplicationMenu(null);
}

function setupIpcHandlers() {
  // Get app directory path for storing data and settings
  const userDataPath = app.getPath('userData');
  const dataDir = path.join(userDataPath, 'data');
  const systemsDir = path.join(userDataPath, 'Systems');
  const settingsPath = path.join(userDataPath, 'settings.json');

  // Ensure directories exist
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(systemsDir)) {
    fs.mkdirSync(systemsDir, { recursive: true });
  }

  console.log('=== Storage Paths ===');
  console.log(`User Data Path: ${userDataPath}`);
  console.log(`Data directory: ${dataDir}`);
  console.log(`Systems directory: ${systemsDir}`);
  console.log(`Settings path: ${settingsPath}`);
  console.log('====================');

  // Window control handlers
  ipcMain.on('window-control', (event, action) => {
    switch (action) {
      case 'minimize':
        mainWindow.minimize();
        break;
      case 'maximize':
        if (mainWindow.isMaximized()) {
          mainWindow.unmaximize();
        } else {
          mainWindow.maximize();
        }
        break;
      case 'close':
        mainWindow.close();
        break;
    }
  });

  // Toggle DevTools
  ipcMain.on('toggle-devtools', () => {
    if (mainWindow.webContents.isDevToolsOpened()) {
      mainWindow.webContents.closeDevTools();
    } else {
      mainWindow.webContents.openDevTools();
    }
  });

  // Open external URLs
  ipcMain.on('open-external', (event, url) => {
    shell.openExternal(url);
  });

  // Get app version
  ipcMain.handle('get-app-version', () => {
    return app.getVersion();
  });

  // Handler for loading settings from disk
  ipcMain.handle('load-settings', async () => {
    try {
      if (fs.existsSync(settingsPath)) {
        const content = fs.readFileSync(settingsPath, 'utf-8');
        const settings = JSON.parse(content);
        console.log('✅ Settings loaded successfully');
        return { success: true, settings };
      } else {
        // Return default settings if file doesn't exist
        return {
          success: true,
          settings: {
            theme: 'dark',
            locale: 'en'
          }
        };
      }
    } catch (err) {
      console.error(`❌ Error loading settings: ${err.message}`);
      return {
        success: false,
        error: err.message,
        settings: {
          theme: 'dark',
          locale: 'en'
        }
      };
    }
  });

  // Handler for saving settings to disk
  ipcMain.handle('save-settings', async (event, settings) => {
    try {
      console.log(`💾 Saving settings to: ${settingsPath}`);
      fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf-8');
      console.log('✅ Settings saved successfully');
      return { success: true };
    } catch (err) {
      console.error(`❌ Error saving settings: ${err.message}`);
      return {
        success: false,
        error: err.message
      };
    }
  });

  // File dialog for opening files
  ipcMain.handle('show-open-dialog', async (event, options) => {
    try {
      const result = await dialog.showOpenDialog(mainWindow, options);
      return result;
    } catch (err) {
      console.error(`Error showing open dialog: ${err.message}`);
      return { canceled: true };
    }
  });

  // File dialog for saving files
  ipcMain.handle('show-save-dialog', async (event, options) => {
    try {
      const result = await dialog.showSaveDialog(mainWindow, options);
      return result;
    } catch (err) {
      console.error(`Error showing save dialog: ${err.message}`);
      return { canceled: true };
    }
  });

  // Read file
  ipcMain.handle('read-file', async (event, filePath) => {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      return { success: true, content };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  // Write file
  ipcMain.handle('write-file', async (event, filePath, content) => {
    try {
      fs.writeFileSync(filePath, content, 'utf-8');
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  // Print to PDF
  ipcMain.handle('print-to-pdf', async (event, htmlContent) => {
    try {
      // Create invisible window for PDF generation
      const pdfWindow = new BrowserWindow({
        show: false,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true
        }
      });

      // Load HTML content
      await pdfWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);

      // Wait for page to be ready
      await new Promise(resolve => setTimeout(resolve, 500));

      // Generate PDF
      const pdfData = await pdfWindow.webContents.printToPDF({
        pageSize: 'A4',
        printBackground: true,
        margins: {
          top: 0,
          bottom: 0,
          left: 0,
          right: 0
        }
      });

      pdfWindow.close();

      return {
        success: true,
        pdfData: Array.from(pdfData)
      };
    } catch (err) {
      console.error(`Error generating PDF: ${err.message}`);
      return {
        success: false,
        error: err.message
      };
    }
  });

  // === Optical Systems Management ===

  // Load optical systems from Systems directory
  // Each system is a folder containing system.json and lens_N.json files
  ipcMain.handle('load-systems', async () => {
    try {
      const systems = [];

      function scanDirectory(dirPath) {
        const entries = fs.readdirSync(dirPath, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry.name);

          if (entry.isDirectory()) {
            // Each directory is a potential system
            const systemJsonPath = path.join(fullPath, 'system.json');

            if (fs.existsSync(systemJsonPath)) {
              try {
                const content = fs.readFileSync(systemJsonPath, 'utf-8');
                const system = JSON.parse(content, (key, value) => {
                  // Reviver function to handle Infinity values
                  if (value === 'Infinity' || value === null) {
                    if (key === 'radius' || key === 'thickness') {
                      return Infinity;
                    }
                  }
                  return value;
                });

                // Load lens JSON files
                const lenses = [];
                const lensFiles = fs.readdirSync(fullPath)
                  .filter(file => file.startsWith('lens_') && file.endsWith('.json'))
                  .sort((a, b) => {
                    const numA = parseInt(a.match(/lens_(\d+)\.json/)?.[1] || '0');
                    const numB = parseInt(b.match(/lens_(\d+)\.json/)?.[1] || '0');
                    return numA - numB;
                  });

                for (const lensFile of lensFiles) {
                  const lensPath = path.join(fullPath, lensFile);
                  const lensContent = fs.readFileSync(lensPath, 'utf-8');
                  const lensData = JSON.parse(lensContent, (key, value) => {
                    if (value === 'Infinity' || value === null) {
                      if (key === 'radius' || key === 'thickness') {
                        return Infinity;
                      }
                    }
                    return value;
                  });
                  lenses.push(lensData);
                }

                systems.push({
                  ...system,
                  name: entry.name,
                  lenses
                });
              } catch (err) {
                console.error(`Error reading system ${fullPath}: ${err.message}`);
              }
            }
          }
        }
      }

      scanDirectory(systemsDir);
      return { success: true, systems };
    } catch (err) {
      console.error(`Error loading systems: ${err.message}`);
      return { success: false, error: err.message, systems: [] };
    }
  });

  // Save optical system with separate lens JSONs
  ipcMain.handle('save-system', async (_event, _folderPath, systemName, systemData) => {
    try {
      const systemDir = path.join(systemsDir, systemName);

      // Create system directory if it doesn't exist
      if (!fs.existsSync(systemDir)) {
        fs.mkdirSync(systemDir, { recursive: true });
      }

      // Extract lenses from LDE data using lens extraction logic
      const lenses = extractLensesFromLDE(systemData.ldeData);

      // Save main system.json (without individual lens data)
      const systemJsonPath = path.join(systemDir, 'system.json');
      const systemJson = {
        description: systemData.description || '',
        wavelength: systemData.wavelength || 550,
        createdAt: systemData.createdAt || Date.now(),
        ldeData: systemData.ldeData || []
      };

      const systemJsonString = JSON.stringify(systemJson, (_key, value) => {
        if (value === Infinity) {
          return 'Infinity';
        }
        return value;
      }, 2);

      fs.writeFileSync(systemJsonPath, systemJsonString, 'utf-8');

      // Remove old lens JSON files
      const existingFiles = fs.readdirSync(systemDir);
      for (const file of existingFiles) {
        if (file.startsWith('lens_') && file.endsWith('.json')) {
          fs.unlinkSync(path.join(systemDir, file));
        }
      }

      // Save individual lens JSON files
      for (let i = 0; i < lenses.length; i++) {
        const lens = lenses[i];
        const lensJsonPath = path.join(systemDir, `lens_${i + 1}.json`);
        const lensJson = {
          systemName,
          lensNumber: i + 1,
          wavelength: systemData.wavelength || 550,
          ldeData: lens.surfaces.map((surface, index) => ({
            ...surface,
            surface: index
          }))
        };

        const lensJsonString = JSON.stringify(lensJson, (_key, value) => {
          if (value === Infinity) {
            return 'Infinity';
          }
          return value;
        }, 2);

        fs.writeFileSync(lensJsonPath, lensJsonString, 'utf-8');
      }

      console.log(`✅ System saved: ${systemDir} with ${lenses.length} lenses`);
      return { success: true };
    } catch (err) {
      console.error(`❌ Error saving system: ${err.message}`);
      return { success: false, error: err.message };
    }
  });

  // Helper function to extract lenses from LDE data
  function extractLensesFromLDE(ldeData) {
    if (!ldeData || ldeData.length === 0) {
      return [];
    }

    const lenses = [];
    let i = 0;

    while (i < ldeData.length) {
      const surface = ldeData[i];

      const hasMaterial = surface.material && surface.material.trim() !== '';
      const hasRefractiveIndex = surface.n && surface.n !== '' && surface.n !== '1.000000';

      if (hasMaterial || hasRefractiveIndex) {
        if (i + 1 < ldeData.length) {
          const firstSurface = surface;
          const secondSurface = ldeData[i + 1];

          lenses.push({
            lensNumber: lenses.length + 1,
            surfaces: [firstSurface, secondSurface]
          });

          i += 1; // Move to next surface (handles cemented doublets)
        } else {
          i++;
        }
      } else {
        i++;
      }
    }

    return lenses;
  }

  // Delete optical system (removes entire system directory)
  ipcMain.handle('delete-system', async (_event, _folderPath, systemName) => {
    try {
      const systemDir = path.join(systemsDir, systemName);

      if (fs.existsSync(systemDir)) {
        fs.rmSync(systemDir, { recursive: true, force: true });
        console.log(`✅ System deleted: ${systemDir}`);
        return { success: true };
      } else {
        return { success: false, error: 'System not found' };
      }
    } catch (err) {
      console.error(`❌ Error deleting system: ${err.message}`);
      return { success: false, error: err.message };
    }
  });
}

app.whenReady().then(() => {
  console.log('=== ReportMaker Starting ===');
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
