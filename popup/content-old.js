//
'use strict';

var classes = require('component/classes');
var salita = require('mbykov/salita');
var events = require('component/events');
var draggable = require('./draggable');
// var Tree = require('chemzqm/tree');
var Tree = require('./tree');
var akshara = require('mbykov/akshara');
// var sanote = require('./sanote');
var sanote = require('mbykov/sanote');

var c = {};
c.root = '√ ';
c.lakara = {
    lat: 'pres.',
    lan: 'impf.',
    lot: 'imp.',
    lit: 'perf.'
}
c.pada = {
    par: 'P.',
    atm: 'A'
}

document.addEventListener("keydown", function(ev) {
    if (ev.keyCode == 67 && ev.ctrlKey && ev.shiftKey) { // Crrl-c
        ev.preventDefault();
        var oEd = q('#akshara');
        if (!oEd) return;
        oEd.textContent = '';
        oEd.focus();
    }
}, false);

document.addEventListener("keydown", function(ev) {
    if (ev.keyCode == 13) { // Enter
        if (ev.target.id != 'akshara') return;
        ev.preventDefault();
        var oEd = q('#akshara');
        var nagari = oEd.textContent;
        nagari = nagari.trim();
        nagari = cleanNagari(nagari);
        if (!nagari || nagari == '') return;
        showTranslit();
        var message = {form: nagari, target: 'acala'};
        messToBack(message);
    }
}, false);

function messToBack(message) {
    chrome.runtime.sendMessage(message, function(response) {
        // cb(response);
    });
}

function cleanNagari(str) {
    return str.replace(/[^\u0900-\u097F\u08E0-\u08FF\u1CD0-\u1CFF]/gi, '');
}

document.addEventListener('dblclick', function(ev){
    let selection = window.getSelection();
    let nagari = selection.toString().split(' ')[0];
    nagari = nagari.trim();
    nagari = cleanNagari(nagari);

    if (!nagari || nagari == '') return;

    let anchor = selection.anchorNode;
    if (anchor.parentElement.nodeName == 'SPAN') anchor = anchor.parentElement.parentElement;
    if (anchor.nodeName == 'SPAN') anchor = anchor.parentElement; // doubled span, wordpress.com
    let text = anchor.textContent;
    let offset = selection.anchorOffset ;
    let substr = text.substr(offset, 50);
    let words = substr.split(' ');
    let next = words[1];

    showTranslit(); // indicator.gif
    let iast;
    if (!/[a-zA-Z]/.test(nagari[0])) {
        iast = salita.sa2iast(nagari);
    }
    let target = (ev.target && (ev.target.id == 'akshara' || classes(ev.target).has('nagari'))) ? 'acala' : null; // immovable

    if (iast && ev.shiftKey == true) {
        // closeAll();
        showTranslit(iast);
    } else  {
        if (/ऽ/.test(nagari)) {
            let query = nagari.split('ऽ').join(' अ');
            let res = {query: query};
            showPopup(res, target);
        } else if (nagari.length > 22) {
            let res = {query: nagari};
            showPopup(res, target);
        } else {
            let message = {form: nagari, next: next, target: target};
            let iast = salita.sa2iast(nagari);
            messToBack(message);
        }
    }
}, false);

var morph;
var oldCoords;

chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
    if (msg.action == 'morph_result') {
        closeAll();
        morph = msg.res.morph;
        showPopup(msg.res, msg.target);
    } else if (msg.action == 'dicts_result') {
        var alldicts = msg.res.dicts;
        morph.alldicts = alldicts; // total dicts
        drawDicts();
    }
});

function getCoords() {
    var selection = window.getSelection();
    var oRange = selection.getRangeAt(0); //get the text range
    var oRect = oRange.getBoundingClientRect();
    var bodyScrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    return {top: oRect.top +  bodyScrollTop, left: oRect.left};
}

function createPopup() {
    var pop = cre('div');
    pop.id = 'morph-popup';
    classes(pop).add('morph-popup');
    var oClear = cre('div');
    oClear.id = 'morph-clear-button';
    classes(oClear).add('morph-clear-button');
    oClear.textContent = 'clear';
    pop.appendChild(oClear);
    var oAkshara = cre('div');
    oAkshara.id = 'akshara';
    // akshara.setAttribute('placeholder', 'on');
    classes(oAkshara).add('morph-editor');
    oAkshara.setAttribute('type', 'text');
    pop.appendChild(oAkshara);
    var oVersion = cre('div');
    oVersion.id = 'zayana';
    classes(oVersion).add('zayana');
    var oVersionText = cre('span');
    oVersionText.textContent = 'विश्रमः';
    oVersion.appendChild(oVersionText);
    classes(oVersionText).add('nagari');
    var oVersionText2 = cret(' (Morpheus v.0.4) ');
    oVersion.appendChild(oVersionText2);
    classes(oVersion).add('zayana');
    pop.appendChild(oVersion);
    var oX = cre('div');
    oX.id = 'morph-x';
    oX.textContent = '[x]';
    classes(oX).add('morph-x');
    pop.appendChild(oX);
    var oExter = cre('div');
    oExter.id = 'morph-exter';
    classes(oExter).add('morph-inner');
    pop.appendChild(oExter);
    var oInner = cre('div');
    oInner.id = 'morph-inner';
    classes(oInner).add('morph-inner');
    oExter.appendChild(oInner);
    var oPdch = cre('div');
    oPdch.id = 'morph-pdch';
    classes(oPdch).add('morph-pdch');
    oInner.appendChild(oPdch);
    var oMorph = cre('div');
    oMorph.id = 'morph-morph';
    classes(oMorph).add('morph-morph');
    oInner.appendChild(oMorph);
    var oDict = cre('div');
    oDict.id = 'morph-dict';
    classes(oDict).add('morph-dict');
    oInner.appendChild(oDict);
    return pop;
}

//
function showPopup(res, target) {
    closeAll();
    var popup = createPopup();
    q('body').appendChild(popup);
    var coords = (target == 'akshara') ? oldCoords : getCoords();
    // var coords;
    if (target == 'acala') {
        coords = oldCoords;
    } else {
        coords = getCoords();
        coords.top = coords.top + 50;
        coords.left = coords.left + 100;
    }
    oldCoords = coords;
    placePopup(coords, popup);
    drawPopup(res, popup);
    var exter = q('#morph-exter');
    var drag = new draggable(popup);
    // this.drag = drag;
    var exterev = events(exter, {
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
        onclick: function(e) {
            closeAll();
        },
    });
    xev.bind('click', 'onclick');
    var zayana = q('#zayana');
    var zayanaev = events(zayana, {
        onclick: function(e) {
            drawHelp(popup);
        },
    });
    zayanaev.bind('click', 'onclick');
    var oClear = q('#morph-clear-button');
    var clearev = events(oClear, {
        onclick: function(e) {
            var oEd = q('#akshara');
            oEd.textContent = '';
            oEd.focus();
        },
    });
    clearev.bind('click', 'onclick');
}

function drawHelp(popup) {
    var oPdch = q('#morph-pdch');
    empty(oPdch);
    var oMorph = q('#morph-morph');
    empty(oMorph);
    classes(oMorph).remove('khaki');
    var oDict = q('#morph-dict');
    empty(oDict);
    var oHelp = cre('div');
    classes(oHelp).add('morph-help');
    var text = require('./help.txt');
    var rows = text.split('\n');
    rows.forEach(function(row) {
        var oStr = cre('p');
        oStr.textContent = row;
        oHelp.appendChild(oStr);
    });
    oDict.appendChild(oHelp);
}

function drawPopup(res, popup) {
    var oEd = q('#akshara');
    oEd.contentEditable = true;
    oEd.textContent = res.query;

    akshara.lang('sa').anchor(oEd).enable();
    if (res.morph) drawPdchs(res.morph, popup);
    else {
        oEd.focus();
        var oDict = q('#morph-dict');
        oDict.textContent = 'too long, please break it with space and select with double-click';
    }
}

function drawPdchs(morph, popup) {
    var oPdch = q('#morph-pdch');
    var oUl = cre('ul');
    classes(oUl).add('morph-popup');
    oPdch.appendChild(oUl);
    if (typeof(morph) == 'string') {
        var oLi = cre('li');
        oLi.textContent = morph;
        classes(oLi).add('morph-popup');
        oUl.appendChild(oLi);
        return;
    }
    var pdchs = morph.pdchs;
    if (pdchs.length == 0) {
        var oLi = cre('li');
        oLi.textContent = 'no result';
        classes(oLi).add('morph-popup');
        oUl.appendChild(oLi);
        return;
    }
    pdchs.forEach(function(pdch) {
        var oLi = cre('li');
        classes(oLi).add('morph-pdch-line');
        var chain = pdch.join(' - ');
        var oPadas = pdch.map(function(pada) { return sa(pada); });
        var size = oPadas.length - 1;
        oPadas.forEach(function(oPada, idx) {
            oLi.appendChild(oPada);
            var defis = cret(' - ');
            if (idx < size) oLi.appendChild(defis);
        });
        oUl.appendChild(oLi);
    });
}

// coords from selection
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

function placePopup(coords, popup) {
    var top = [coords.top, 'px'].join('');
    var left = [coords.left, 'px'].join('');
    popup.style.top = top;
    popup.style.left = left;
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

function cret(str) {
    return document.createTextNode(str);
}

function sa(str) {
    var oSa = cre('span');
    classes(oSa).add('nagari');
    oSa.textContent = str;
    return oSa;
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
    var popups = qs('.morph-popup');
    var arr = [].slice.call(popups);
    arr.forEach(function(popup) {
        popup.parentElement.removeChild(popup);
    });
    var oTip = q('#tip');
    if (oTip) oTip.parentElement.removeChild(oTip);
    // window.getSelection().removeAllRanges();
    // FIXME: нельзя - после закрытия мне нужен getCoords
}

document.onkeyup = function(e) {
    if (e.which === 27) { //Esc
        closeAll();
        window.getSelection().removeAllRanges();
    }
}

var translit = new Translit();
function Translit() {
    this.events = events(document, this);
    this.events.bind('mouseover span.nagari', 'show');
    this.events.bind('mouseover span.morphtext', 'showmorph');
    this.events.bind('mouseout span', 'hide');
    this.events.bind('mouseover #akshara', 'show');
    this.events.bind('mouseout #akshara', 'hide');
}

Translit.prototype.show = function(ev){
    if (ev.shiftKey != true) return;
     let span = ev.target;
    let text = span.textContent;
    let tiptext = salita.sa2iast(text);
    showTip(ev, tiptext);
}

Translit.prototype.showmorph = function(ev){
    if (ev.shiftKey != true) return;
    let span = ev.target;
    let text = span.textContent;
    let tiptext = sanote.toeu(text);
    showTip(ev, tiptext);
}

function showTip(ev, tiptext) {
    let span = ev.target;
    let bodyScrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    let off = {};
    let rect = span.getBoundingClientRect();
    off.left  = rect.left;
    off.top = rect.top + bodyScrollTop;
    if (!off.left) return;

    let oTip = q('#tip');
    if (oTip) oTip.parentElement.removeChild(oTip);
    oTip = cre('div');
    oTip.id = 'tip';
    classes(oTip).add('translit');

    oTip.textContent = tiptext;
    q('body').appendChild(oTip);
    let coords = {top: off.top, left: off.left};
    coords.top = coords.top - 50;
    placePopup(coords, oTip);
}

Translit.prototype.hide = function(ev){
     let oTip = q('#tip');
    if (!oTip) return;
    oTip.parentElement.removeChild(oTip);
}

var pdch = new Pdch();

function Pdch() {
    this.events = events(document, this);
    this.events.bind('click #morph-pdch span.nagari', 'morph');
    this.events.bind('click #morph-morph span.nagari', 'dict');
    // this.events.bind('mouseout span', 'hide');
}

Pdch.prototype.dict = function(ev){
    var span = ev.target;
    if (span.nodeName != 'SPAN') return;
    var stem = span.textContent;
    // var slp = salita.sa2slp(stem);
    var idx = span.parentNode.getAttribute('idx');
    morph.ids = morph.qcleans[idx].dicts; // idxs только для данного morph

    if (morph.alldicts) {
        drawDicts();
    } else {
        // to get dicts only when morph row is clicked:
        var dict_ids = [];
        morph.queries.forEach(function(q) {
            dict_ids = dict_ids.concat(q.dicts);
        });
        var unics = unique(dict_ids);
        var message = {dicts: unics};
        messToBack(message);
    }
}

function unique(arr){
    var u = {}, a = [];
    for(var i = 0, l = arr.length; i < l; ++i){
        if(u.hasOwnProperty(arr[i])) {
            continue;
        }
        a.push(arr[i]);
        u[arr[i]] = 1;
    }
    return a;
}

function drawDicts() {
    var oDict = q('#morph-dict');
    remove(oDict);
    oDict = cre('div');
    oDict.id = 'morph-dict';
    classes(oDict).add('morph-dict-line');
    var oInner = q('#morph-inner');
    oInner.appendChild(oDict);

    var tree = new Tree(oDict);
    var data = treeData();
    tree.data(data);
    // collapse(tree);
}

function treeData() {
    var arr = [];
    var dicts = [];
    morph.alldicts.forEach(function(d) {
        morph.ids.forEach(function(id) {
            if (d._id == id) dicts.push(d);
        });
    });
    let tsdicts = [];
    let bgdicts = [];
    let apdicts = [];
    let mwdicts = [];
    dicts.forEach(function(dict) {
        if (dict.type == 'term') tsdicts.push(dict);
        else if (dict.type == 'BG') bgdicts.push(dict);
        else if (dict.type == 'Apte') apdicts.push(dict);
        else if (dict.type == 'MW') mwdicts.push(dict);
    });
    let ordered = tsdicts.concat(bgdicts).concat(apdicts).concat(mwdicts);

    ordered.forEach(function(d, idx) {
        var id = [d.type, idx].join('-');
        let soname = (d.type == 'term') ? 'pron' : d.type;
        let name = (d.gend) ? [soname, d.gend].join(' - ') : soname;
        var obj = {text: name, id: id};
        var children;
        if (d.verb && d.trn) d.trns = d.trn.split('; '); // FIXME: преобразовать в DICT MW Apte
        obj.children = d.trns.map(function(line) { return {text: removeXML(line)}; });
        arr.push(obj);
    });
    return arr;
}

function removeXML(line) {
    let clean = line.replace(/<span/gm, 'SPAN').replace(/<\/span>/gm, 'NAPS');
    clean = clean.replace(/<[^>]+>/gm, '');
    clean = clean.replace(/SPAN/gm, '<span').replace(/NAPS/gm, '</span>');
    clean = clean.trim();
    return clean;
}

    var span = ev.target;
    if (span.nodeName != 'SPAN') return;
    var flake = span.textContent;
    var oMorph = q('#morph-morph');
    empty(oMorph);
    var oDict = q('#morph-dict');
    empty(oDict);
    // var dict_ids = []; //
    var qcleans = [];
    morph.queries.forEach(function(q) {
        if (q.flake == flake || q.query == flake) qcleans.push(q); // FIXME: в avyaya , terms etc запрос равен flake, и flake не добавлен
    });
    morph.qcleans = qcleans;
    drawMorphs(qcleans);
    //
}

function drawMorphs(qcleans) {
    var oMorph = q('#morph-morph');
    // empty(oMorph);
    classes(oMorph).add('khaki');
    var oUl = cre('ul');
    var oDefis = cret(' - ');
    classes(oUl).add('morph-popup');
    oMorph.appendChild(oUl);
    qcleans.forEach(function(q, idx) {
        var oLi = cre('li');
        classes(oLi).add('morph-popup');
        oLi.setAttribute('idx', idx);
        if (q.name && !q.plain) {
            let oDict = sa(q.pada);
            oLi.appendChild(oDict);
            let morph = {noun: true, gend: q.gend, sups: q.sups};
            appendOMorph(oLi, morph);
        } else if (q.verb) {
            let oRoot = cret(c.root);
            oLi.appendChild(oRoot);
            let oDict = sa(q.dhatu);
            classes(oDict).add('dict-root');
            oLi.appendChild(oDict);
            let morph = {verb: true, gana: q.gana, la: q.la, pada: q.pada, tips: q.tips};
            appendOMorph(oLi, morph);
        } else if (q.pos == 'pron') {
            let oDict = sa(q.dict);
            // classes(oDict).add('dict-root');
            oLi.appendChild(oDict);
            let morph = {pron: true, var: q.var, gend: q.gend, sups: q.sups};
            appendOMorph(oLi, morph);
        } else if (q.plain) {
            let oDict = sa(q.pada);
            // classes(oDict).add('dict-root');
            oLi.appendChild(oDict);
            let morph = {plain: true};
            appendOMorph(oLi, morph);
        } else if (q.ind) {
            let oDict = sa(q.query);
            oLi.appendChild(oDict);
            let morph = (q.type == 'BG') ? {bg: true} : {ind: true};
            appendOMorph(oLi, morph);

        } else {
            let oFlake = sa(q.flake);
            oLi.appendChild(oFlake);
        }
        oUl.appendChild(oLi);
    });
}

function appendOMorph(oLi, morph) {
  classes(oMstr).remove('nagari');
    let mstr = sanote.tohi(morph);
    let oMstr = sa(mstr);
    classes(oMstr).add('morphtext');
    let oDefis = cret(' - ');
    oLi.appendChild(oDefis);
    oLi.appendChild(oMstr);
}


function groupGend(orig) {
    if (!orig) return [];
    var newArr = [],
        gends = {},
        newItem, i, j, cur;
    for (i = 0, j = orig.length; i < j; i++) {
      cur = orig[i];
        if (!(cur.gend in gends)) {
            gends[cur.gend] = {gend: cur.gend, keys: []};
            newArr.push(gends[cur.gend]);
        }
        gends[cur.gend].keys.push(cur.key);
    }
    return newArr;
}



function log() { console.log.apply(console, arguments); }

function inc(arr, item) {
    return (arr.indexOf(item) > -1) ? true : false;
}

function showmorph() {

}
// дальше
