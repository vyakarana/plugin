// pAnini-plugin

'use strict';

var classes = require('component/classes');
var popup = require('vyakarana/popup');
// var popup = require('./popup');


function messToBack(message) {
    chrome.runtime.sendMessage(message, function(response) {
        // cb(response);
    });
}

chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
    if (msg.action != 'morph_result') return;
    if (!msg.res.data) return;
    // console.log('RES SUTRA data:', msg.res.data);
    closeAll();
    popup.show(msg.res);
});


document.addEventListener('dblclick', function(ev) {
    let selection = window.getSelection();

    // let anchor = selection.anchorNode;
    // if (anchor.parentElement.nodeName == 'SPAN') anchor = anchor.parentElement.parentElement; // spanned el
    // if (anchor.nodeName == 'SPAN') anchor = anchor.parentElement; // doubled span, wordpress.com
    // let text = anchor.textContent;
    // let offset = selection.anchorOffset ;
    // // log('OFFSET', offset);
    // let substr = text.substr(offset, 50);
    // // let words = substr.split(' ');
    // let words = selection.toString().split(/[ ,;\."]+/)[0];
    // // let nagari = words[0];

    let nagari = selection.toString();
    // let next = words[1];
    let next = null;
    nagari = nagari.trim();
    nagari = cleanNagari(nagari);

    if (!nagari || nagari == '') return;
    // console.log('CLICKED', nagari, 'NEXT', next);

    showIndicator();


    let target = false;

    // FIXME:
    // nagari = 'कोदयति';

    if (/ऽ/.test(nagari)) {
        let query = nagari.split('ऽ').join(' अ');
        let res = {query: query, target: target};
        // showPopup(res);
    } else if (nagari.length > 22) {
        let res = {query: nagari, target: target};
        // showPopup(res);
    } else {
        let message = {form: nagari, next: next, target: target};
        messToBack(message);
    }
    // let res = {query: nagari, data: {a:1}, target: target};
    // showPopup(res);

}, false);



function q(sel) {
    return document.querySelector(sel);
}

function qs(sel) {
    return document.querySelectorAll(sel);
}

function inc(arr, item) {
    return (arr.indexOf(item) > -1) ? true : false;
}

function cre(tag) {
    return document.createElement(tag);
}

function cspan(str, css) {
    let oSpan = document.createElement('span');
    oSpan.textContent = str;
    classes(oSpan).add(css);
    return oSpan;
}

function cret(str) {
    return document.createTextNode(str);
}


function empty(el) {
    while (el.hasChildNodes()) {
        el.removeChild(el.lastChild);
    }
}

function remove(el) {
    el.parentElement.removeChild(el);
}

function closeAll() {
    let popups = qs('.morph-popup');
    let arr = [].slice.call(popups);
    arr.forEach(function(popup) {
        popup.parentElement.removeChild(popup);
        popup = null;
    });

    let oTip = q('#morph-tip');
    if (oTip) oTip.parentElement.removeChild(oTip);

}

function cleanNagari(str) {
    return str.replace(/[^\u0900-\u097F\u08E0-\u08FF\u1CD0-\u1CFF]/gi, '');
}

document.onkeyup = function(e) {
    if (e.which === 27) { //Esc
        closeAll();
        window.getSelection().removeAllRanges();
    }
}


function getCoords() {
    let selection = window.getSelection();
    let oRange = selection.getRangeAt(0); //get the text range
    let oRect = oRange.getBoundingClientRect();
    let bodyScrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    return {top: oRect.top + bodyScrollTop, left: oRect.left};
}

// coords from selection
function showIndicator() {
    let oTip = cre('div');
    oTip.id = 'morph-tip';
    classes(oTip).add('translit');
    let img = cre('img');
    img.src = chrome.extension.getURL('data/img/indicator.gif');
    oTip.appendChild(img);
    q('body').appendChild(oTip);
    let coords = getCoords();
    coords.top = coords.top - 50;
    let top = [coords.top, 'px'].join('');
    let left = [coords.left, 'px'].join('');
    oTip.style.top = top;
    oTip.style.left = left;
}


function log() { console.log.apply(console, arguments);}

// function isInPopup(ev) {
//     let popup = q('#morph-popup');
//     let child = ev.target;
//     return isDescendant(popup, child);
// }

// function isDescendant(parent, child) {
//     var node = child.parentNode;
//     while (node != null) {
//         if (node == parent) {
//             return true;
//         }
//         node = node.parentNode;
//     }
//     return false;
// }
