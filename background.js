// main

let server = 'http://localhost:3002';
// var server = 'http://sa.diglossa.org:3002';


// chrome.extension.onMessage.addListener(function(message, sender, sendResponse) {
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.form) {
        // var path = [server, 'morph?form='].join('/');
        // let query = [path, message.form].join('');
        let query = [server, '/', 'morph?form=', message.form, '&', 'next=', message.next].join('');
        let xhr = new XMLHttpRequest();
        xhr.open("GET", query, true);
        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4) {
                let res = JSON.parse(xhr.responseText);
                // FIXME:
                let data = require('./tmp.js');
                res.data = data[0];
                // data = null;
                res.target = message.target;
                chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
                    chrome.tabs.sendMessage(tabs[0].id, {action: "morph_result", res: res, target: message.target}, function(response) {});
                    data = null;
                });
            }
        };
        xhr.send();
    } else if (message.dicts) {
        let path = [server, 'dicts?dicts='].join('/');
        let query = [path, message.dicts].join('');
        let xhr = new XMLHttpRequest();
        xhr.open("GET", query, true);
        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4) {
                let res = JSON.parse(xhr.responseText);
                chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
                    chrome.tabs.sendMessage(tabs[0].id, {action: "dicts_result", res: res}, function(response) {});
                });
            }
        };
        xhr.send();
    }
    return true;
});

// function log() { console.log.apply(console, arguments) }
