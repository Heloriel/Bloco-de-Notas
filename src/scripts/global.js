const { ipcRenderer } = require("electron");

const textArea = document.getElementById("text");
const lineCounter = document.getElementById("line-count");
const title = document.getElementById("title");
const head = document.head || document.getElementsByTagName("head")[0];
const style = document.createElement("style");

ipcRenderer.on("set-file", function (event, data) {
	textArea.value = data.content;
	title.innerHTML = data.name + " | Topaz Notepad Extended";
});

ipcRenderer.on("convert-to", function (event, data, error) {
	try {
		if (data === "uppercase") {
			textArea.value = textArea.value.toUpperCase();
		} else if (data === "lowercase") {
			textArea.value = textArea.value.toLowerCase();
		} else if (data == "inverse") {
			let str = textArea.value;
			textArea.value = str.split("").reverse().join("");
		} else {
			throw error;
		}
	} catch (e) {
		console.log(e);
	}
});

ipcRenderer.on("compiled_sass", (event, data) => {
    style.appendChild(document.createTextNode(data));
	head.appendChild(style);
});

function textChangeHandler() {
	ipcRenderer.send("update-content", textArea.value);
}

ipcRenderer.on("google-search", function () {
	let start = textArea.selectionStart;
	let finish = textArea.selectionEnd;
	let selection = textArea.value.substring(start, finish);
	if (selection === ""){
		selection = textArea.value;
	}
	ipcRenderer.send("google-search", selection);
});

ipcRenderer.on("toggle-colormode", function (event, data) {
	if (data) {
		textArea.classList.remove("light-mode");
		textArea.classList.add("dark-mode");
		lineCounter.classList.remove("lc-light-mode");
		lineCounter.classList.add("lc-dark-mode");
	} else {
		textArea.classList.remove("dark-mode");
		textArea.classList.add("light-mode");
		lineCounter.classList.remove("lc-dark-mode");
		lineCounter.classList.add("lc-light-mode");
	}
});
