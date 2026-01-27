const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs').promises;

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        icon: path.join(__dirname, 'assets/icon.png'),
        show: false
    });

    mainWindow.loadFile(path.join(__dirname, 'src/index.html'));

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        // Отключили автоматическое открытие DevTools
        // mainWindow.webContents.openDevTools();
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.whenReady().then(createWindow);

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

// Для разработки можно добавить горячие клавиши
app.on('ready', () => {
    if (process.platform === 'darwin') {
        app.dock.setIcon(path.join(__dirname, 'assets/icon.png'));
    }
});

// IPC обработчики для файлов
ipcMain.handle('dialog:openFile', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [
            { name: 'Word Documents', extensions: ['docx', 'doc'] },
            { name: 'All Files', extensions: ['*'] }
        ]
    });
    return canceled ? null : filePaths[0];
});

ipcMain.handle('dialog:saveFile', async (event, defaultName) => {
    const { canceled, filePath } = await dialog.showSaveDialog({
        defaultPath: defaultName,
        filters: [
            { name: 'Word Documents', extensions: ['docx'] }
        ]
    });
    return canceled ? null : filePath;
});

ipcMain.handle('file:readDocx', async (event, filePath) => {
    try {
        const result = await mammoth.convertToHtml({ path: filePath });
        return {
            html: result.value,
            messages: result.messages
        };
    } catch (error) {
        throw new Error(`Ошибка чтения DOCX: ${error.message}`);
    }
});

ipcMain.handle('file:writeDocx', async (event, data) => {
    try {
        const { title, content, filePath } = data;

        const doc = new Document({
            sections: [{
                properties: {},
                children: [
                    new Paragraph({
                        text: title || 'Без названия',
                        heading: HeadingLevel.HEADING_1,
                    }),
                    new Paragraph({
                        text: content || '',
                    })
                ]
            }]
        });

        const buffer = await Packer.toBuffer(doc);
        await fs.writeFile(filePath, buffer);
        return true;
    } catch (error) {
        throw new Error(`Ошибка записи DOCX: ${error.message}`);
    }
});

// Для чтения/записи JSON файлов (для хранения карточек)
ipcMain.handle('file:readJson', async (event, filePath) => {
    try {
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
});

ipcMain.handle('file:writeJson', async (event, filePath, data) => {
    try {
        await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (error) {
        throw new Error(`Ошибка записи JSON: ${error.message}`);
    }
});