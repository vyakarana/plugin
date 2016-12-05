// main

let server = 'http://localhost:5984/';
let view = 'panini-rules/_design/panini-rules/_view/byForm?key=%22';
let tail = '%22&include_docs=true';

// let server = 'http://localhost:3002';
// var server = 'http://sa.diglossa.org:3002';

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    message.form = 'kodayanti';
    let query = [server, view, message.form, tail].join('');
    console.log('Q', query);
    let xhr = new XMLHttpRequest();
    xhr.open("GET", query, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            // FIXME:
            let res = {query: message.form};
            console.log('XHR', xhr.responseText);
            let response = JSON.parse(xhr.responseText);
            let doc = response.rows[0].doc;
            console.log('DOC', doc);
            if (xhr.responseText) res.data = doc;
            // let data = require('./tmp.js');
            // res.data = data[0];

            res.target = message.target;
            // console.log('MESSAGE');

            chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
                chrome.tabs.sendMessage(tabs[0].id, {action: "morph_result", res: res}, function(response) {});
                data = null;
            });
        }
    };
    xhr.send();
    return true;
});

// function log() { console.log.apply(console, arguments); }

// http://localhost:5984/panini-rules/_design/panini-rules/_view/byForm?key=%22kodayante%22&include_docs=true

// chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
//     let query = [server, '/', 'morph?form=', message.form, '&', 'next=', message.next].join('');
//     let xhr = new XMLHttpRequest();
//     xhr.open("GET", query, true);
//     xhr.onreadystatechange = function() {
//         if (xhr.readyState == 4) {
//             // FIXME:
//             let res = {query: message.form};
//             if (xhr.responseText) res = JSON.parse(xhr.responseText);
//             let data = require('./tmp.js');
//             res.data = data[0];



//             res.target = message.target;
//             // console.log('MESSAGE');
//             chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
//                 chrome.tabs.sendMessage(tabs[0].id, {action: "morph_result", res: res, target: message.target}, function(response) {});
//                 data = null;
//             });
//         }
//     };
//     xhr.send();
//     return true;
// });
