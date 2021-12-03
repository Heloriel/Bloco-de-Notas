//#region SETUP VARS
const { app, BrowserWindow, Menu, webContents, dialog, ipcMain, ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');
const { basename } = require('path');

const isMac = process.platform === 'darwin';
const isDev = false;

var file = {};
var window = null;

//#region CREATE THE MENU TEMPLATE
const menuTemplate = [
    ...(isMac ? [{
        label: app.name,
        submenu: [
          { role: 'about' },
          { type: 'separator' },
          { role: 'services' },
          { type: 'separator' },
          { role: 'hide' },
          { role: 'hideOthers' },
          { role: 'unhide' },
          { type: 'separator' },
          { role: 'quit' }
        ]
      }] : []),
    {
        label: 'Arquivo',
        submenu: [
            {
                label: 'Novo',
                accelerator: 'CmdOrCtrl+N',
                click(){
                    createNewFile(window);
                }
            },
            {
                label: 'Abrir',
                accelerator: 'CmdOrCtrl+O',
                click(){
                    openFile();
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
                accelerator: 'CmdOrCtrl+Alt+S',
                click(){
                    saveFileAs();
                }
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
        label: 'Editar',
        submenu: [
            { label: 'Desfazer', role: 'undo' },
            { label: 'Refazer', role: 'redo' },
            { type: 'separator' },
            { label: 'Copiar', role: 'copy' },
            { label: 'Colar', role: 'paste' },
            { label: 'Recortar', role: 'cut' }
        ]
    },
    ...(isDev ? 
    [{
        label: 'Dev',
        submenu: [
            {
                label: 'Dev Tools',
                role: 'toggledevtools',
                enabled: isDev,
                visible: isDev
            },
        ]
    }] : []
    )
];        

const menu = Menu.buildFromTemplate(menuTemplate);        
Menu.setApplicationMenu(menu);

//#region CREATE THE MAIN WINDOW
async function createWindow(){
    window = new BrowserWindow({
        width: 800,
        height: 600,
        title: "Topaz Notepad Extended",
        webPreferences:{
            nodeIntegration: true,
            contextIsolation: false
        }
    });
    
    await window.loadFile(`${__dirname}/src/index.html`);

    createNewFile(window);

    ipcMain.on('update-content', function(event, data){
        file.content = data;
    });
};

//#region READ THE SLECTED FILE
function readFile(filePath){
    try {
        return fs.readFileSync(filePath, 'utf-8');
    } catch (e) {
        console.log(e);
        return '';
    }
}

//#region OPEN SELECTED FILE
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

    window.webContents.send('set-file', file);
}

//#region CREATE A NEW FILE
function createNewFile(window){
    file = {
        name: "Novo Arquivo.txt",
        content: '',
        saved: false,        
        path: app.getPath('documents') + "/Novo Arquivo.txt"
    };
    window.webContents.send('set-file', file);
};

//#region SAVE THE NEW FILE
function writeFile(filePath){
    try {
        fs.writeFile(filePath, file.content, function(error){
            file.path = filePath;
            file.saved = true;
            file.name = path.basename(filePath);
            window.webContents.send('set-file', file);
            if(error) throw error;
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

    console.log(dialogFile.filePath);
    writeFile(dialogFile.filePath);

};

//#region APP START
app.on('ready', () => {
    createWindow();
});