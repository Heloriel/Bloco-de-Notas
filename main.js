//#region SETUP VARS
const { app, BrowserWindow, Menu, webContents, dialog, ipcMain, ipcRenderer, shell } = require('electron');
const fs = require('fs');
const path = require('path');
const { basename } = require('path');

const isMac = process.platform === 'darwin';
const isDev = true;

var file = {};
var window = null;
//#endregion

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
                label: 'Nova Janela',
                accelerator: 'CmdOrCtrl+Alt+N',
                click(){
                    createWindow();
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
                accelerator: 'CmdOrCtrl+Shift+Q',
                click(){
                    app.quit();
                }
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
            { label: 'Recortar', role: 'cut' },
            { type: 'separator' },
            { role: 'selectAll' },
            { type: 'separator' },
            { role: 'delete' }            
        ]
    },
    {
        label: 'Transformar',
        submenu: [
            {
                label: 'MAIÚSCULO',
                click(){
                    convertTo("uppercase");
                }
            },
            {
                label: 'minúsculo',
                click(){
                    convertTo("lowercase");
                }
            },
            {
                label: 'Inverter Texto',
                click(){
                    convertTo("inverse");
                }
            }
        ]
    },
    {
        label: 'Seleção',
        submenu: [
            {
                label: 'Pesquisar no google...',
                accelerator: 'CmdOrCtrl+Alt+G',
                click(){
                    window.webContents.send('google-search');
            }
        }
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
    ),
    {
        label: '...',
        submenu: [
            {
                label: 'Sobre',
                accelerator: 'CmdOrCtrl+Alt+A',
                click(){
                    
                }
            },
            {
                label: 'Repositório GitHub',
                accelerator: 'CmdOrCtrl+Alt+H',
                click(){
                    shell.openExternal("https://github.com/Heloriel/topaz-notepad-extended");
                }
            }            
        ]
    }
];        

const menu = Menu.buildFromTemplate(menuTemplate);        
Menu.setApplicationMenu(menu);
//#endregion

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
//#endregion

//#region READ THE SLECTED FILE
function readFile(filePath){
    try {
        return fs.readFileSync(filePath, 'utf-8');
    } catch (e) {
        console.log(e);
        return '';
    }
}
//#endregion

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
//#endregion

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
//#endregion

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
//#endregion

//#region TRANSFORM TEXT OPTIONS
function convertTo(type){
    window.webContents.send('convert-to', type);
}

//#endregion

//#region GOOGLE SEARCH
ipcMain.on('google-search', function(event, data){
    shell.openExternal("https://www.google.com/search?q=" + data);
});
//#endregion

//#region APP START
app.on('ready', () => {
    createWindow();
});
//#endregion