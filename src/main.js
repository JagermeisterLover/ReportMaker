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

  // Load folder structure from Systems directory
  ipcMain.handle('load-systems', async () => {
    try {
      const systems = [];
      const folders = [];

      function scanDirectory(dirPath, relativePath = '') {
        const entries = fs.readdirSync(dirPath, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry.name);
          const relPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;

          if (entry.isDirectory()) {
            folders.push({
              name: entry.name,
              path: relPath,
              parentPath: relativePath
            });
            scanDirectory(fullPath, relPath);
          } else if (entry.isFile() && entry.name.endsWith('.json')) {
            try {
              const content = fs.readFileSync(fullPath, 'utf-8');
              const system = JSON.parse(content, (key, value) => {
                // Reviver function to handle Infinity values
                if (value === 'Infinity' || value === null) {
                  // Check if the key suggests it should be Infinity
                  if (key === 'radius' || key === 'thickness') {
                    return Infinity;
                  }
                }
                return value;
              });
              systems.push({
                ...system,
                name: entry.name.replace('.json', ''),
                folderPath: relativePath
              });
            } catch (err) {
              console.error(`Error reading system file ${fullPath}: ${err.message}`);
            }
          }
        }
      }

      scanDirectory(systemsDir);
      return { success: true, systems, folders };
    } catch (err) {
      console.error(`Error loading systems: ${err.message}`);
      return { success: false, error: err.message, systems: [], folders: [] };
    }
  });

  // Save optical system
  ipcMain.handle('save-system', async (_event, folderPath, systemName, systemData) => {
    try {
      const targetDir = folderPath ? path.join(systemsDir, folderPath) : systemsDir;
      const filePath = path.join(targetDir, `${systemName}.json`);

      // Replacer function to handle Infinity values
      const jsonString = JSON.stringify(systemData, (_key, value) => {
        if (value === Infinity) {
          return 'Infinity';
        }
        return value;
      }, 2);

      fs.writeFileSync(filePath, jsonString, 'utf-8');
      console.log(`✅ System saved: ${filePath}`);
      return { success: true };
    } catch (err) {
      console.error(`❌ Error saving system: ${err.message}`);
      return { success: false, error: err.message };
    }
  });

  // Delete optical system
  ipcMain.handle('delete-system', async (_event, folderPath, systemName) => {
    try {
      const targetDir = folderPath ? path.join(systemsDir, folderPath) : systemsDir;
      const filePath = path.join(targetDir, `${systemName}.json`);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`✅ System deleted: ${filePath}`);
        return { success: true };
      } else {
        return { success: false, error: 'System file not found' };
      }
    } catch (err) {
      console.error(`❌ Error deleting system: ${err.message}`);
      return { success: false, error: err.message };
    }
  });

  // Create folder
  ipcMain.handle('create-folder', async (_event, parentPath, folderName) => {
    try {
      const targetDir = parentPath ? path.join(systemsDir, parentPath, folderName) : path.join(systemsDir, folderName);

      if (fs.existsSync(targetDir)) {
        return { success: false, error: 'Folder already exists' };
      }

      fs.mkdirSync(targetDir, { recursive: true });
      console.log(`✅ Folder created: ${targetDir}`);
      return { success: true };
    } catch (err) {
      console.error(`❌ Error creating folder: ${err.message}`);
      return { success: false, error: err.message };
    }
  });

  // Delete folder
  ipcMain.handle('delete-folder', async (_event, folderPath) => {
    try {
      const targetDir = path.join(systemsDir, folderPath);

      if (fs.existsSync(targetDir)) {
        fs.rmSync(targetDir, { recursive: true, force: true });
        console.log(`✅ Folder deleted: ${targetDir}`);
        return { success: true };
      } else {
        return { success: false, error: 'Folder not found' };
      }
    } catch (err) {
      console.error(`❌ Error deleting folder: ${err.message}`);
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
