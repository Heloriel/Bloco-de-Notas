//#region SETUP VARS
const { app, BrowserWindow, Menu, webContents, dialog, ipcMain, ipcRenderer, shell } = require("electron");
const Store = require("electron-store");
const DB = new Store();
const { MenuItem } = require("electron/main");
const fs = require("fs");
const path = require("path");
const { basename } = require("path");
const sass = require("sass");
const compiled_sass = sass.compile("./src/stylesheets/global.scss");

const isMac = process.platform === "darwin";
const isDev = true;

var file = {};
var window = null;
//#endregion

//#region CREATE THE MENU TEMPLATE
const menuTemplate = [
	...(isMac
		? [
				{
					label: app.name,
					submenu: [{ role: "about" }, { type: "separator" }, { role: "services" }, { type: "separator" }, { role: "hide" }, { role: "hideOthers" }, { role: "unhide" }, { type: "separator" }, { role: "quit" }],
				},
		  ]
		: []),
	{
		label: "File",
		submenu: [
			{
				label: "New",
				accelerator: "CmdOrCtrl+N",
				click() {
					createNewFile(window);
				},
			},
			{
				label: "New Window",
				accelerator: "CmdOrCtrl+Alt+N",
				click() {
					createWindow();
				},
			},
			{
				label: "Open",
				accelerator: "CmdOrCtrl+O",
				click() {
					openFile();
				},
			},
			{
				label: "Save",
				accelerator: "CmdOrCtrl+S",
				click() {
					saveFile();
				},
			},
			{
				label: "Save as...",
				accelerator: "CmdOrCtrl+Alt+S",
				click() {
					saveFileAs();
				},
			},
			{
				type: "separator",
			},
			{
				label: "Exit APP",
				accelerator: "CmdOrCtrl+Shift+Q",
				click() {
					app.quit();
				},
			},
		],
	},
	{
		label: "Edit",
		submenu: [{ label: "Undo", role: "undo" }, { label: "Redo", role: "redo" }, { type: "separator" }, { label: "Copy", role: "copy" }, { label: "Paste", role: "paste" }, { label: "Cut", role: "cut" }, { type: "separator" }, { label: "Select All", role: "selectAll", accelerator: "CmdOrCtrl+A" }, { type: "separator" }, { label: "Delete", role: "delete", accelerator: "Delete" }],
	},
	{
		label: "Transform",
		submenu: [
			{
				label: "Uppercase",
				accelerator: "CmdOrCtrl+Alt+U",
				click() {
					convertTo("uppercase");
				},
			},
			{
				label: "Lowercase",
				accelerator: "CmdOrCtrl+Alt+L",
				click() {
					convertTo("lowercase");
				},
			},
			{
				label: "Invert",
				accelerator: "CmdOrCtrl+Alt+I",
				click() {
					convertTo("inverse");
				},
			},
		],
	},
	{
		label: "Selection",
		submenu: [
			{
				label: "Google Search",
				accelerator: "CmdOrCtrl+Alt+G",
				click() {
					window.webContents.send("google-search");
				},
			},
		],
	},
	{
		label: "Config",
		submenu: [
			{
				id: "dm",
				label: "Dark Mode",
				type: "checkbox",
				click() {
					changeColorMode();
				},
			},
			{
				id: "lc",
				label: "Line Count",
				type: "checkbox",
				click() {
					toggleLineCount();
				},
			},
		],
	},
	...(isDev
		? [
				{
					label: "Developer",
					submenu: [
						{
							label: "Dev Tools",
							role: "toggledevtools",
							enabled: isDev,
							visible: isDev,
						},
					],
				},
		  ]
		: []),
	{
		label: "About",
		submenu: [
			{
				label: "GitHub Repo",
				accelerator: "CmdOrCtrl+Alt+H",
				click() {
					shell.openExternal("https://github.com/Heloriel/topaz-notepad-extended");
				},
			},
		],
	},
];

const menu = Menu.buildFromTemplate(menuTemplate);
Menu.setApplicationMenu(menu);
//#endregion

//#region CREATE THE MAIN WINDOW
async function createWindow() {
	window = new BrowserWindow({
		width: 800,
		height: 600,
		minWidth: 400,
		minHeight: 200,
		title: "Topaz Notepad Extended",
		icon: "./src/images/Logo.ico",
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false,
		},
	});

	
	await window.loadFile(`${__dirname}/src/index.html`);
	
	await window.webContents.send("compiled_sass", compiled_sass.css);
	
	if (!DB.has("darkmode")) {
		DB.set("darkmode", false);
	}
	if (DB.get("darkmode")) {
		let darkMode = menu.getMenuItemById("dm");
		darkMode.checked = true;
	}
	window.webContents.send("toggle-colormode", DB.get("darkmode"));

	createNewFile(window);

	ipcMain.on("update-content", function (event, data) {
		file.content = data;
	});
}
//#endregion

//#region READ THE SLECTED FILE
function readFile(filePath) {
	try {
		return fs.readFileSync(filePath, "utf-8");
	} catch (e) {
		console.log(e);
		return "";
	}
}
//#endregion

//#region OPEN SELECTED FILE
async function openFile() {
	let dialogFile = await dialog.showOpenDialog({
		defaultPath: file.path,
	});

	if (dialogFile.canceled) return false;

	file = {
		name: path.basename(dialogFile.filePaths[0]),
		content: readFile(dialogFile.filePaths[0]),
		saved: true,
		path: dialogFile.filePaths[0],
	};

	window.webContents.send("set-file", file);
}
//#endregion

//#region CREATE A NEW FILE
function createNewFile(window) {
	file = {
		name: "New File.txt",
		content: "",
		saved: false,
		path: app.getPath("documents") + "/New File.txt",
	};
	window.webContents.send("set-file", file);
}
//#endregion

//#region SAVE THE NEW FILE
function writeFile(filePath) {
	try {
		fs.writeFile(filePath, file.content, function (error) {
			file.path = filePath;
			file.saved = true;
			file.name = path.basename(filePath);
			window.webContents.send("set-file", file);
			if (error) throw error;
		});
	} catch (e) {
		console.log(e);
	}
}

function saveFile() {
	if (file.saved) {
		writeFile(file.path);
	} else {
		saveFileAs();
	}
}

async function saveFileAs() {
	let dialogFile = await dialog.showSaveDialog({
		defaultPath: file.path,
	});

	if (dialogFile.canceled) {
		return false;
	}

	console.log(dialogFile.filePath);
	writeFile(dialogFile.filePath);
}
//#endregion

//#region TRANSFORM TEXT OPTIONS
function convertTo(type) {
	window.webContents.send("convert-to", type);
}

//#endregion

//#region GOOGLE SEARCH
ipcMain.on("google-search", function (event, data) {
	shell.openExternal("https://www.google.com/search?q=" + data);
});
//#endregion

//#region
function changeColorMode() {
	if (DB.get("darkmode")) {
		DB.set("darkmode", false);
	} else {
		DB.set("darkmode", true);
	}
	window.webContents.send("toggle-colormode", DB.get("darkmode"));
}
//#endregion

//#region APP START
app.on("ready", () => {
	createWindow();
});
//#endregion
