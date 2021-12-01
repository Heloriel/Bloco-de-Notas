const { app, BrowserWindow, Menu, webContents, dialog, ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');

var mainWindow = null;
var file = {};

//#region CREATE THE MENU TEMPLATE
const menuTemplate = [
    {
        label: 'Arquivo',
        submenu: [
            {
                label: 'Novo',
                click(){
                    createNewFile();
                }
            },
            {
                label: 'Salvar'
            },
            {
                label: 'Salvar Como...',
                click(){
                    saveFileAs();
                }
            },
            {
                label: 'Sair',
                role: 'quit'
            }
        ]
    },
    {
        label: 'Editar'
    },
    {
        label: 'Seleção'
    },
    {
        label: 'Desenvolvedor',
        submenu: [
            {
                label: 'Dev Tools'
            }
        ]
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