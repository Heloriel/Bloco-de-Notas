const { app, BrowserWindow, Menu, webContents, dialog, ipcMain, ipcRenderer } = require('electron');
const fs = require('fs');
const { basename } = require('path');
const path = require('path');
const isMac = process.platform === 'darwin';
const isDev = true;

var mainWindow;
var file = {};


//#region CREATE THE MENU TEMPLATE
const menuTemplate = [
    {
        label: 'Arquivo',
        submenu: [
            {
                label: 'Abrir',
                accelerator: 'CmdOrCtrl+O',
                click(){
                    openFile();
                }
            },
            {
                label: 'Novo',
                accelerator: 'CmdOrCtrl+N',
                click(){
                    createNewFile();
                }
            },
            {
                label: 'Salvar',
                accelerator: 'CmdOrCtrl+S',
                click(){
                    saveFile();
                }
            },
            {
                label: 'Salvar Como...',
                accelerator: 'CmdOrCtrl+Shift+S',
                click(){
                    saveFileAs();
                }
            },
            {
                label: 'Dev Tools',
                role: 'toggledevtools',
                enabled: isDev,
                visible: isDev
            },                
            {
                type: 'separator'
            },
            {
                label: 'Sair',
                role:  isMac ? 'close' : 'quit',
                accelerator: 'CmdOrCtrl+Shift+Q'
            }
        ]
    },
    {
        label: 'Editar'
    },
    {
        label: 'Seleção'
    }
];        

const menu = Menu.buildFromTemplate(menuTemplate);        
Menu.setApplicationMenu(menu);

//#region CREATE THE MAIN WINDOW
async function createWindow(){
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences:{
            nodeIntegration: true,
            contextIsolation: false
        }
    });
    
    await mainWindow.loadFile(`${__dirname}/src/index.html`);

    createNewFile();

    ipcMain.on('update-content', function(event, data){
        file.content = data;
    });

    // mainWindow.webContents.openDevTools();
};

function readFile(filePath){
    try {
        return fs.readFileSync(filePath, 'utf-8');
    } catch (e) {
        console.log(e);
        return '';
    }
}

async function openFile(){
    let dialogFile = await dialog.showOpenDialog({
        defaultPath: file.path        
    });

    if(dialogFile.canceled) return false;

    file = {
        name: path.basename(dialogFile.filePaths[0]),
        content: readFile(dialogFile.filePaths[0]),
        saved: true,
        path: dialogFile.filePaths[0]
    }

    mainWindow.webContents.send('set-file', file);
}

function createNewFile(){
    file = {
        name: "Novo Arquivo.txt",
        content: '',
        saved: false,        
        path: app.getPath('documents') + "/Novo Arquivo.txt"
    };
    mainWindow.webContents.send('set-file', file);
};

function writeFile(filePath){
    try {
        fs.writeFile(filePath, file.content, function(error){
            if(error) throw error;
            file.path = filePath;
            file.saved = true;
            file.name = path.basename(filePath);
            mainWindow.webContents.send('set-file', file);
        });
    } catch (e) {
        console.log(e);
    };
};

function saveFile(){
    if(file.saved){
        writeFile(file.path);
    }else{
        saveFileAs();
    }
}

async function saveFileAs(){
    let dialogFile = await dialog.showSaveDialog({
        defaultPath: file.path
    });
    
    if(dialogFile.canceled){
        return false;
    }

    writeFile(dialogFile.filePath);

};

app.on('ready', () => {
    createWindow();
});