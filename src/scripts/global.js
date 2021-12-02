const { ipcRenderer } = require('electron');

const textArea = document.getElementById('text');
const title    = document.getElementById('title');

ipcRenderer.on('set-file', function(event, data){
    textArea.value = data.content;
    title.innerHTML = data.name + ' | Topaz Notepad Extended';
});

ipcRenderer.on('convert-to', function(event, data, error){
    try {
        if(data === "uppercase"){
            textArea.value = textArea.value.toUpperCase();
        }else if(data === "lowercase"){
            textArea.value = textArea.value.toLowerCase();
        }else{
            throw error;
        }
    } catch (e) {
        console.log(e);
    }
});

// ipcRenderer.on('convert-toupper', function(){
//     textArea.value = textArea.value.toUpperCase();
// });

// ipcRenderer.on('convert-tolower', function(){
//     textArea.value = textArea.value.toLowerCase();
// });

function textChangeHandler(){
    ipcRenderer.send('update-content', textArea.value);
}

ipcRenderer.on('google-search', function(){
    var start = textArea.selectionStart;
    var finish = textArea.selectionEnd;
    var selection = textArea.value.substring(start, finish);
    ipcRenderer.send('google-search', selection);
});