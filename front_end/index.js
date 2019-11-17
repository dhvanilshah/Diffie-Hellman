server = "http://localhost:8080";

window.onload=function(){
    document.getElementById("submit_btn").addEventListener("click", submit_text);
}

function submit_text() {
    value = document.getElementById("input_text").value;
    var xhr = new XMLHttpRequest();
    xhr.open("POST", server, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify({
        input: value
    }));
}
