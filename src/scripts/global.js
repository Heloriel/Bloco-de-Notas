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
        }else if(data == "inverse") {
            let str = textArea.value;
            textArea.value =  str.split("").reverse().join("");
        }else{
            throw error;
        }
    } catch (e) {
        console.log(e);
    }
});

function textChangeHandler(){
    ipcRenderer.send('update-content', textArea.value);
}

ipcRenderer.on('google-search', function(){
    var start = textArea.selectionStart;
    var finish = textArea.selectionEnd;
    var selection = textArea.value.substring(start, finish);
    ipcRenderer.send('google-search', selection);
});

ipcRenderer.on('toggle-colormode', function(event, data){
    if(data){
        textArea.classList.remove("light-mode");
        textArea.classList.add("dark-mode");
    }else{
        textArea.classList.remove("dark-mode");
        textArea.classList.add("light-mode");
    }
});