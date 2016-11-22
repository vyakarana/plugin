//
'use strict';

// log('===START===');

var classes = require('component/classes');
var salita = require('mbykov/salita');
var events = require('component/events');
var draggable = require('./draggable');
// log('SUTRA:');
let sutra = require('../sutradetailsformorpheus.json');
// log('SUTRA', sutra);


function messToBack(message) {
    // console.log('MESS to back  start', message);
    chrome.runtime.sendMessage(message, function(response) {
        // cb(response);
    });
}

chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
    if (msg.action != 'morph_result') return;
    if (!msg.res.data) return;
    // console.log('RES SUTRA', msg.res);
    showPopup(msg.res);
});


document.addEventListener('dblclick', function(ev) {
    let selection = window.getSelection();
    let nagari = selection.toString().split(' ')[0];
    nagari = nagari.trim();
    nagari = cleanNagari(nagari);

    if (!nagari || nagari == '') return;
    console.log('CLICKED', nagari);
    showIndicator();


    let anchor = selection.anchorNode;
    if (anchor.parentElement.nodeName == 'SPAN') anchor = anchor.parentElement.parentElement; // spanned el
    if (anchor.nodeName == 'SPAN') anchor = anchor.parentElement; // doubled span, wordpress.com
    let text = anchor.textContent;
    let offset = selection.anchorOffset ;
    let substr = text.substr(offset, 50);
    let words = substr.split(' ');
    let next = words[1];

    if (words[0] != nagari) {
        console.log('STRANGE NAGARI', nagari);
        throw new Error();
    }

    // showTranslit(); // indicator.gif
    // if (ev.shiftKey == true) {
    //     let iast = salita.sa2iast(nagari);
    //     showTranslit(iast);
    //     return;
    // }

    // // let target = (ev.target && (ev.target.id == 'akshara' || classes(ev.target).has('nagari'))) ? 'acala' : null; // immovable
    // let target = (isInPopup(ev)) ? true : false;
    let target = false;

    // FIXME:
    nagari = 'कोदयति';

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


/**
 *
 * @param {} res
 */
function showPopup(res) {
    closeAll();
    let popup = createPopup();
    q('body').appendChild(popup);
    // console.log('SHOW POPUP DATA', res.data);
    // console.log('TARGET... should be false', res.target);

    if (!res.target) {
        placePopup(popup);
    }

    drawEditor(res.query);
    drawPaniniRules(res.data);

    let exter = q('#morph-exter');
    let drag = new draggable(popup);
    // this.drag = drag;
    let exterev = events(exter, {
        onmousedown: function(ev) {
            drag._disabled = true;
        },
        onmouseup: function(ev) {
            drag._disabled = false;
        }
    });
    exterev.bind('mousedown', 'onmousedown');
    exterev.bind('mouseup', 'onmouseup');

    var x = q('#morph-x');
    var xev = events(x, {
        closePopup: function(e) {
            closeAll();
        }
    });
    xev.bind('click', 'closePopup');
}



function drawEditor(query) {
    let oEd = q('#morph-editor');
    oEd.contentEditable = true;
    oEd.textContent = query;
}

function drawPaniniRules(data) {
    // http://sanskritdocuments.org/learning_tools/sarvanisutrani/7.4.77.htm
    let oRules = q('#morph-rules');
    let rules = data.d;
    rules.forEach(function(r) {
        // log('R-n', r.r);
        // log('R-s', sutra[r.r]);
        let oLi = cre('li');
        let nagaris = r.i.map(function(iform) {
            let parts = iform.split('+');
            return parts.map(function(part) { return salita.slp2sa(part); }).join(' + ');
        });
        let iforms = nagaris.join(', ');


        let oForm = cspan(iforms, 'sutra-form');
        oLi.appendChild(oForm);

        // let rr = ['(', r.r, ')'].join('');
        let stext = [r.r, sutra[r.r]].join(' - ');
        let oSutra = cspan(stext, 'sutra-text');
        oLi.appendChild(oSutra);

        // let rule = [stext, iforms].join(': ');
        // oLi.textContent = rule;
        oRules.appendChild(oLi);
    });
    var rulev = events(oRules, {
        showSutra: function(e) {
            // log('SNAME', e.target.textContent);
            let num = e.target.textContent.split('-')[0].trim();
            let sutrani = 'http://sanskritdocuments.org/learning_tools/sarvanisutrani/';
            let url = [sutrani, num, '.htm'].join('');
            window.open(url,'_blank');
        }
    });
    rulev.bind('click span.sutra-text', 'showSutra');
}



function createPopup() {
    let pop = cre('div');
    pop.id = 'morph-popup';
    classes(pop).add('morph-popup');
    let head = createHeader();
    pop.appendChild(head);

    let oExter = cre('div');
    oExter.id = 'morph-exter';
    classes(oExter).add('morph-inner');
    pop.appendChild(oExter);
    let oInner = cre('div');
    oInner.id = 'morph-inner';
    classes(oInner).add('morph-inner');
    oExter.appendChild(oInner);
    let oPdch = cre('div');
    oPdch.id = 'morph-pdch';
    classes(oPdch).add('morph-pdch');
    oInner.appendChild(oPdch);
    let oRules = cre('ul');
    oRules.id = 'morph-rules';
    classes(oRules).add('morph-rules');
    oInner.appendChild(oRules);
    // let oDict = cre('div');
    // oDict.id = 'morph-dict';
    // classes(oDict).add('morph-dict');
    // oInner.appendChild(oDict);
    return pop;
}

function createHeader() {
    var head = cre('div');
    head.id = 'morph-header';
    classes(head).add('morph-header');

    var oVersion = cre('div');
    oVersion.id = 'version';
    classes(oVersion).add('version');
    let oX = cre('div');
    oX.id = 'morph-x';
    oX.textContent = '[x]';
    classes(oX).add('morph-x');
    oVersion.appendChild(oX);

    var oVersionText = cre('div');
    oVersionText.textContent = 'पाणिनि  -  v.0.1';
    classes(oVersionText).add('vtext');
    oVersion.appendChild(oVersionText);
    // var clear = cre('div');
    // clear.id = 'clear-both';
    // head.appendChild(clear);

    head.appendChild(oVersion);

    var oEd = cre('div');
    oEd.id = 'morph-editor';
    classes(oEd).add('morph-editor');
    oEd.setAttribute('type', 'text');
    head.appendChild(oEd);
    return head;
}


function getCoords() {
    let selection = window.getSelection();
    let oRange = selection.getRangeAt(0); //get the text range
    let oRect = oRange.getBoundingClientRect();
    let bodyScrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    return {top: oRect.top +  bodyScrollTop, left: oRect.left};
}

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

// function sa(str) {
//     let oSa = cre('span');
//     classes(oSa).add('nagari');
//     oSa.textContent = str;
//     return oSa;
// }

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

    // window.getSelection().removeAllRanges();
    // FIXME: нельзя - после закрытия мне нужен getCoords
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


// function unique(arr){
//     let u = {}, a = [];
//     for(let i = 0, l = arr.length; i < l; ++i){
//         if(u.hasOwnProperty(arr[i])) {
//             continue;
//         }
//         a.push(arr[i]);
//         u[arr[i]] = 1;
//     }
//     return a;
// }

function placePopup(popup) {
    let coords = getCoords();
    coords.top = coords.top + 100;
    coords.left = coords.left + 100;
    // oldCoords = coords;
    let top = [coords.top, 'px'].join('');
    let left = [coords.left, 'px'].join('');
    popup.style.top = top;
    popup.style.left = left;
    // console.log('COORDS', top, left);
}


// coords from selection
function showIndicator() {
    let oTip = cre('div');
    oTip.id = 'morph-tip';
    classes(oTip).add('translit');
    let img = cre('img');
    img.src = chrome.extension.getURL('popup/img/indicator.gif');
    oTip.appendChild(img);
    q('body').appendChild(oTip);
    let coords = getCoords();
    // console.log('INDICATOR', coords.top, coords.left);
    coords.top = coords.top - 50;
    let top = [coords.top, 'px'].join('');
    let left = [coords.left, 'px'].join('');
    oTip.style.top = top;
    oTip.style.left = left;
}

function showTranslit(iast) {
    var oTip = q('#tip');
    if (oTip) oTip.parentElement.removeChild(oTip);
    oTip = cre('div');
    oTip.id = 'tip';
    classes(oTip).add('translit');
    if (iast) oTip.textContent = iast;
    else {
        var img = cre('img');
        img.src = chrome.extension.getURL('popup/img/indicator.gif');
        oTip.appendChild(img);
    }
    q('body').appendChild(oTip);
    var coords = getCoords();
    coords.top = coords.top - 50;
    placePopup(coords, oTip);
    // FIXME: но только как его закрыть?
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
