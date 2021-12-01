const { ipcRenderer } = require('electron');

const textArea = document.getElementById('text');
const title    = document.getElementById('title');

ipcRenderer.on('set-file', function(event, data){
    textArea.value = data.content;
    title.innerHTML = data.name + ' | Topaz Notepad';
});

function textChangeHandler(){
    ipcRenderer.send('update-content', textArea.value);
}