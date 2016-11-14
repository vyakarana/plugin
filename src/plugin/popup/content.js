(function outer(modules, cache, entries){

  /**
   * Global
   */

  var global = (function(){ return this; })();

  /**
   * Require `name`.
   *
   * @param {String} name
   * @api public
   */

  function require(name){
    if (cache[name]) return cache[name].exports;
    if (modules[name]) return call(name, require);
    throw new Error('cannot find module "' + name + '"');
  }

  /**
   * Call module `id` and cache it.
   *
   * @param {Number} id
   * @param {Function} require
   * @return {Function}
   * @api private
   */

  function call(id, require){
    var m = cache[id] = { exports: {} };
    var mod = modules[id];
    var name = mod[2];
    var fn = mod[0];
    var threw = true;

    try {
      fn.call(m.exports, function(req){
        var dep = modules[id][1][req];
        return require(dep || req);
      }, m, m.exports, outer, modules, cache, entries);
      threw = false;
    } finally {
      if (threw) {
        delete cache[id];
      } else if (name) {
        // expose as 'name'.
        cache[name] = cache[id];
      }
    }

    return cache[id].exports;
  }

  /**
   * Require all entries exposing them on global if needed.
   */

  for (var id in entries) {
    if (entries[id]) {
      global[entries[id]] = require(id);
    } else {
      require(id);
    }
  }

  /**
   * Duo flag.
   */

  require.duo = true;

  /**
   * Expose cache.
   */

  require.cache = cache;

  /**
   * Expose modules
   */

  require.modules = modules;

  /**
   * Return newest require.
   */

   return require;
})({
1: [function(require, module, exports) {
//
'use strict';

// log('===START===');

var classes = require('component/classes');
var salita = require('mbykov/salita');
var events = require('component/events');
var draggable = require('./draggable');

function messToBack(message) {
    log('MESS to back  start', message);
    chrome.runtime.sendMessage(message, function(response) {
        // cb(response);
    });
}

chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
    if (msg.action != 'morph_result') return;
    if (!msg.res.data) return;
    showPopup(msg.res);
});


document.addEventListener('dblclick', function(ev) {
    let selection = window.getSelection();
    let nagari = selection.toString().split(' ')[0];
    nagari = nagari.trim();
    nagari = cleanNagari(nagari);

    if (!nagari || nagari == '') return;
    log('CLICKED', nagari);
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
        log('STRANGE NAGARI', nagari);
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
        showPopup(res);
    } else if (nagari.length > 22) {
        let res = {query: nagari, target: target};
        showPopup(res);
    } else {
        let message = {form: nagari, next: next, target: target};
        messToBack(message);
    }
    // let res = {query: nagari, data: {a:1}, target: target};
    // showPopup(res);

}, false);


function showPopup(res) {
    closeAll();
    let popup = createPopup();
    q('body').appendChild(popup);
    // log('SHOW POPUP DATA', res.data);
    // log('TARGET... should be false', res.target);

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
        let oLi = cre('li');
        let nagaris = r.i.map(function(iform) {
            let parts = iform.split('+');
            return parts.map(function(part) { return salita.slp2sa(part); }).join(' + ');
        });
        let iforms = nagaris.join(', ');
        let rule = [r.r, iforms].join(': ');
        oLi.textContent = rule;
        oRules.appendChild(oLi);
    });
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
    var oEd = cre('div');
    oEd.id = 'morph-editor';
    classes(oEd).add('morph-editor');
    oEd.setAttribute('type', 'text');
    head.appendChild(oEd);
    var oVersion = cre('div');
    oVersion.id = 'version';
    classes(oVersion).add('version');
    var oVersionText = cre('span');
    oVersionText.textContent = 'पाणिनि   v.0.1';
    oVersion.appendChild(oVersionText);
    head.appendChild(oVersion);

    let oX = cre('div');
    oX.id = 'morph-x';
    oX.textContent = '[x]';
    classes(oX).add('morph-x');
    oVersion.appendChild(oX);
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
    // log('COORDS', top, left);
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
    // log('INDICATOR', coords.top, coords.left);
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

}, {"component/classes":2,"mbykov/salita":3,"component/events":4,"./draggable":5}],
2: [function(require, module, exports) {
/**
 * Module dependencies.
 */

try {
  var index = require('indexof');
} catch (err) {
  var index = require('component-indexof');
}

/**
 * Whitespace regexp.
 */

var re = /\s+/;

/**
 * toString reference.
 */

var toString = Object.prototype.toString;

/**
 * Wrap `el` in a `ClassList`.
 *
 * @param {Element} el
 * @return {ClassList}
 * @api public
 */

module.exports = function(el){
  return new ClassList(el);
};

/**
 * Initialize a new ClassList for `el`.
 *
 * @param {Element} el
 * @api private
 */

function ClassList(el) {
  if (!el || !el.nodeType) {
    throw new Error('A DOM element reference is required');
  }
  this.el = el;
  this.list = el.classList;
}

/**
 * Add class `name` if not already present.
 *
 * @param {String} name
 * @return {ClassList}
 * @api public
 */

ClassList.prototype.add = function(name){
  // classList
  if (this.list) {
    this.list.add(name);
    return this;
  }

  // fallback
  var arr = this.array();
  var i = index(arr, name);
  if (!~i) arr.push(name);
  this.el.className = arr.join(' ');
  return this;
};

/**
 * Remove class `name` when present, or
 * pass a regular expression to remove
 * any which match.
 *
 * @param {String|RegExp} name
 * @return {ClassList}
 * @api public
 */

ClassList.prototype.remove = function(name){
  if ('[object RegExp]' == toString.call(name)) {
    return this.removeMatching(name);
  }

  // classList
  if (this.list) {
    this.list.remove(name);
    return this;
  }

  // fallback
  var arr = this.array();
  var i = index(arr, name);
  if (~i) arr.splice(i, 1);
  this.el.className = arr.join(' ');
  return this;
};

/**
 * Remove all classes matching `re`.
 *
 * @param {RegExp} re
 * @return {ClassList}
 * @api private
 */

ClassList.prototype.removeMatching = function(re){
  var arr = this.array();
  for (var i = 0; i < arr.length; i++) {
    if (re.test(arr[i])) {
      this.remove(arr[i]);
    }
  }
  return this;
};

/**
 * Toggle class `name`, can force state via `force`.
 *
 * For browsers that support classList, but do not support `force` yet,
 * the mistake will be detected and corrected.
 *
 * @param {String} name
 * @param {Boolean} force
 * @return {ClassList}
 * @api public
 */

ClassList.prototype.toggle = function(name, force){
  // classList
  if (this.list) {
    if ("undefined" !== typeof force) {
      if (force !== this.list.toggle(name, force)) {
        this.list.toggle(name); // toggle again to correct
      }
    } else {
      this.list.toggle(name);
    }
    return this;
  }

  // fallback
  if ("undefined" !== typeof force) {
    if (!force) {
      this.remove(name);
    } else {
      this.add(name);
    }
  } else {
    if (this.has(name)) {
      this.remove(name);
    } else {
      this.add(name);
    }
  }

  return this;
};

/**
 * Return an array of classes.
 *
 * @return {Array}
 * @api public
 */

ClassList.prototype.array = function(){
  var className = this.el.getAttribute('class') || '';
  var str = className.replace(/^\s+|\s+$/g, '');
  var arr = str.split(re);
  if ('' === arr[0]) arr.shift();
  return arr;
};

/**
 * Check if class `name` is present.
 *
 * @param {String} name
 * @return {ClassList}
 * @api public
 */

ClassList.prototype.has =
ClassList.prototype.contains = function(name){
  return this.list
    ? this.list.contains(name)
    : !! ~index(this.array(), name);
};

}, {"indexof":6,"component-indexof":6}],
6: [function(require, module, exports) {
module.exports = function(arr, obj){
  if (arr.indexOf) return arr.indexOf(obj);
  for (var i = 0; i < arr.length; ++i) {
    if (arr[i] === obj) return i;
  }
  return -1;
};
}, {}],
3: [function(require, module, exports) {
// salita.js module
var c = require('./lib/constants');

module.exports = salita();

function salita() {
    if (!(this instanceof salita)) return new salita();
}

salita.prototype.slp2sa = function(str) {
    if (!str) return '';
    str = str.replace('/', '');
    str = str.replace('-', '');
    var arr = str.split('');
    var sk = [];
    arr.forEach(function(letr, idx) {
        var prev = arr[idx-1];
        if (idx == 0 && letr in Vowels) sk[0] = Vowels[letr];
        if (prev in consonants) {
            if (letr in vowels) {
                sk[idx-1] = consonants[prev];
                sk[idx] = vowels[letr];
            } else if (letr in consonants) {
                sk[idx-1] = consonants[prev] + '्';
            }
        }
        if (idx == (arr.length-1) && letr in consonants) sk[idx] = consonants[letr] + '्';
        if (arr[idx] in signs) { sk[idx] = signs[letr]; }
        if (arr[idx] in numbers) { sk[idx] = numbers[letr]; }
    });
    return sk.join('');
}

salita.prototype.sa2slp = function(str) {
    if (!str) return '';
    var consonants_ = invert(consonants);
    var  vowels_ = invert(vowels);
    var  Vowels_ = invert(Vowels);
    var  signs_ = invert(signs);
    var  numbers_ = invert(numbers);
    var arr = str.split('');
    var slp = [];
    arr.forEach(function(letr, idx) {
        var prev = arr[idx-1];
        if (idx == 0 && letr in Vowels_) slp[0] = Vowels_[letr];
        if (prev in consonants_) {
            if (letr in vowels_) {
                slp[idx-1] = consonants_[prev];
                slp[idx] = vowels_[letr];
            } else if (letr in consonants_ || letr in signs_) {
                slp[idx-1] = consonants_[prev] + 'a';
            } else if (letr == '्') {
                slp[idx-1] = consonants_[prev];
            }
        }
        if (idx == (arr.length-1) && letr in consonants_) slp[idx] = consonants_[letr] + 'a';
        if (arr[idx] in signs_) { slp[idx] = signs_[letr]; }
        if (arr[idx] in numbers_) { slp[idx] = numbers_[letr]; }
    });
    return slp.join('');
}

salita.prototype.sa2iast = function(str) {
    if (!str) return '';
    str = clean(str);
    var cons = invert(c.consIAST);
    var  ligas = invert(c.ligaIAST);
    var  vowels = invert(c.vowelIAST);
    var  signs = invert(c.signsIAST);
    var  numbers_ = invert(numbers);
    var arr = str.split('');
    var iast = [];
    arr.forEach(function(sym, idx) {
        var prev = arr[idx-1];
        var next = arr[idx+1];
        if (sym in cons) {
            iast.push(cons[sym]);
            if (next in cons) {
                iast.push('a');
            } else if (next in ligas) {
                iast.push(ligas[next]);
            } else if (!next) {
                iast.push('a');
            }
        } else if (sym in signs) {
            if (prev in cons) iast.push('a');
            iast.push(signs[sym]);
        } else if (sym in vowels) {
            iast.push(vowels[sym]);
        } else if (sym in numbers_) {
            iast.push(numbers_[sym]);
        }
    });
    return iast.join('');
}

salita.prototype.iast2sa = function(str) {
    if (!str) return '';
    str = clean(str);
    var cons = c.consIAST;
    var  ligas = c.ligaIAST;
    var  vowels = c.vowelIAST;
    var  signs = c.signsIAST;
    var arr = str.split('');
    var mixed = [];
    var sa = [];
    arr.forEach(function(sym, idx) {
        var prev = arr[idx-1];
        if (sym == 'h' && c.aspIAST.indexOf(prev) > -1) {
            mixed.pop();
            var asp = [prev, 'h'].join('');
            mixed.push(c.virama);
            mixed.push(cons[asp]);
        } else if (inc(['i', 'u'], sym) && prev == 'a') {
            mixed.pop();
            var diph = ['a', sym].join('');
            var vow = (idx == 0) ? vowels[diph] : ligas[diph];
            mixed.push(vow);
        } else {
            mixed.push(sym);
        }
    });

    mixed.forEach(function(sym, idx) {
        var prev = mixed[idx-1];
        var next = mixed[idx+1];
        if (sym in cons) {
            sa.push(cons[sym]);
            if ((next in cons) || !next) {
                sa.push(c.virama);
            }
        } else if (idx != 0 && sym in ligas) {
            sa.push(ligas[sym]);
        } else if (idx == 0 && sym in vowels) {
            sa.push(vowels[sym]);
        } else if (sym in signs) {
            sa.push(signs[sym]);
        } else if (sym in numbers) {
            sa.push(numbers[sym]);
        } else {
            sa.push(sym);
        }
    });
    return sa.join('');
}

var signs = {
    "'": "ऽ",
    "!": "ँ",
    "/": "́",
    "H": "ः",
    "M": "ं",
    "-": "-",
    ".": "."
}

var Vowels = {
    "a": "अ",
    "A": "आ",
    "i": "इ",
    "I": "ई",
    "u": "उ",
    "U": "ऊ",
    "e": "ए",
    "E": "ऐ",
    "o": "ओ",
    "O": "औ",
    "f": "ऋ",
    "F": "ॠ",
    "x": "ऌ",
    "X": "ॡ"
};

var vowels = {
    "a": "",
    "A": "ा",
    "i": "ि",
    "I": "ी",
    "u": "ु",
    "U": "ू",
    "e": "े",
    "E": "ै",
    "o": "ो",
    "O": "ौ",
    "f": "ृ",
    "F": "ॄ",
    "x": "ॢ",
};

var consonants = {
    "k": "क", // == is for bolnagri
    "K": "ख",
    "g": "ग",
    "G": "घ",
    "c": "च",
    "C": "छ",
    "j": "ज",
    "J": "झ",
    "w": "ट", // टठ-tT == टठ-fF // cerebral
    "W": "ठ",
    "q": "ड", // डढ-dD == डढ-vV
    "Q": "ढ",
    "t": "त", // तथ-wW == तथ-tT
    "T": "थ",
    "d": "द", // दध-xX == दध-dD
    "D": "ध",
    "n": "न",
    "R": "ण", // == N
    "N": "ङ", // == M
    "p": "प",
    "P": "फ",
    "b": "ब",
    "B": "भ",
    "m": "म",
    "y": "य",
    "Y": "ञ",
    "r": "र",
    "l": "ल",
    "v": "व", // वॐ == wW
    "S": "श", // श ॅ == zZ
    "z": "ष",
    "s": "स",
    "h": "ह",
    "": "",
};

// ०१२३४५६७८९
var numbers = {
    "0": "०",
    "1": "१",
    "2": "२",
    "3": "३",
    "4": "४",
    "5": "५",
    "6": "६",
    "7": "७",
    "8": "८",
    "9": "९"
}



salita.prototype.hk2sa = function(str) {
    str = clean(str);
    var sa;

    for (var hk in signs) {
        sa = signs[hk];
        str = str.split(hk).join(sa);
    }
    for (var hk in consonantsHK) {
        if (hk.length == 1) continue;
        sa = consonantsHK[hk];
        str = str.split(hk).join(sa);
    }
    for (var hk in consonantsHK) {
        if (hk.length == 2) continue;
        sa = consonantsHK[hk];
        str = str.split(hk).join(sa);
    }
    for (var hk in VowelsHK) {
        if (hk.length == 1) continue;
        sa = VowelsHK[hk];
        var reHK = new RegExp('^' + hk);
        str = str.replace(reHK, sa);
    }
    for (var hk in VowelsHK) {
        if (hk.length == 2) continue;
        sa = VowelsHK[hk];
        var reHK = new RegExp('^' + hk);
        str = str.replace(reHK, sa);
    }
    for (var hk in vowelsHK) {
        if (hk.length == 1) continue;
        sa = vowelsHK[hk];
        str = str.split(hk).join(sa);
    }
    for (var hk in vowelsHK) {
        if (hk.length == 2) continue;
        sa = vowelsHK[hk];
        str = str.split(hk).join(sa);
    }
    var sk = [];
    var arr = str.split('');
    var prev;
    var iconsHK = invert(consonantsHK);
    arr.forEach(function(letr, idx) {
        prev = arr[idx-1];
        if (prev && (letr in iconsHK) && (prev in iconsHK)) {
            letr = c.virama + letr;
        }
        sk.push(letr);
    });
    str = sk.join('');
    if (str.slice(-1) in iconsHK) str = [str, c.virama].join('');
    str = str.split('|').join('');
    return str;
}

function clean(str) {
    str = str.trim();
    str = str.split('/').join('');
    str = str.split('|').join('');
    return str;
}

function invert(obj) {
    var new_obj = {};
    for (var prop in obj) {
        if(obj.hasOwnProperty(prop)) {
            new_obj[obj[prop]] = prop;
        }
    }
    return new_obj;
};

function log() { console.log.apply(console, arguments) }

function inc(arr, item) {
    return (arr.indexOf(item) > -1) ? true : false;
}

}, {"./lib/constants":7}],
7: [function(require, module, exports) {
//

var c = {};
c.virama = '्',

c.vowelIAST = {
    "a": "अ",
    "ā": "आ",
    "i": "इ",
    "ī": "ई",
    "u": "उ",
    "ū": "ऊ",
    "e": "ए",
    "ai": "ऐ",
    "o": "ओ",
    "au": "औ",
    "ṛ": "ऋ",
    "ṝ": "ॠ",
    "ḷ": "ऌ",
    "ḹ": "ॡ"
};

c.ligaIAST = {
    "a": "",
    "ā": "ा",
    "i": "ि",
    "ī": "ी",
    "u": "ु",
    "ū": "ू",
    "e": "े",
    "ai": "ै",
    "o": "ो",
    "au": "ौ",
    "ṛ": "ृ",
    "ṝ": "ॄ",
    "ḷ": "ॢ",
};

c.consIAST = {
    "k": "क",
    "kh": "ख",
    "g": "ग",
    "gh": "घ",
    "c": "च",
    "ch": "छ",
    "j": "ज",
    "jh": "झ",
    "ṭ": "ट",
    "ṭh": "ठ",
    "ḍ": "ड",
    "ḍh": "ढ",
    "t": "त",
    "th": "थ",
    "d": "द",
    "dh": "ध",
    "n": "न",
    "ṇ": "ण",
    "ṅ": "ङ",
    "p": "प",
    "ph": "फ",
    "b": "ब",
    "bh": "भ",
    "m": "म",
    "y": "य",
    "ñ": "ञ",
    "r": "र",
    "l": "ल",
    "v": "व",
    "ś": "श",
    "ṣ": "ष",
    "s": "स",
    "h": "ह"
};

c.signsIAST = {
    "ṃ": "ं",
    "ḥ": "ः",
    "'": "ऽ",
}

c.aspIAST = ['k', 'c', 'ṭ', 't', 'p', 'g', 'j', 'ḍ', 'd', 'b'];

module.exports = c;

// Harvard-Kioto (based on)
var VowelsHK = {
    "a": "अ",
    "aa": "आ",
    "A": "आ",
    "i": "इ",
    "ii": "ई",
    "I": "ई",
    "u": "उ",
    "uu": "ऊ",
    "U": "ऊ",
    "e": "ए",
    "ai": "ऐ",
    "o": "ओ",
    "au": "औ",
    "R": "ऋ",
    "RR": "ॠ",
    "lR": "ऌ",
    "lRR": "ॡ"
}

var vowelsHK = {
    "a": "|", // '|' is for 'non virama' sign only
    "aa": "ा",
    "A": "ा",
    "i": "ि",
    "ii": "ी",
    "I": "ी",
    "u": "ु",
    "uu": "ू",
    "U": "ू",
    "e": "े",
    "ai": "ै",
    "o": "ो",
    "au": "ौ",
    "R": "ृ",
    "RR": "ॄ",
    "lRR": "ॢ",
}

var consonantsHK = {
    "k": "क",
    "kh": "ख",
    "g": "ग",
    "gh": "घ",
    "G": "ङ",
    "c": "च",
    "ch": "छ",
    "j": "ज",
    "jh": "झ",
    "J": "ञ",
    "T": "ट",
    "Th": "ठ",
    "D": "ड",
    "Dh": "ढ",
    "N": "ण",
    "t": "त",
    "th": "थ",
    "d": "द",
    "dh": "ध",
    "n": "न",
    "p": "प",
    "ph": "फ",
    "b": "ब",
    "bh": "भ",
    "m": "म",
    "y": "य",
    "r": "र",
    "l": "ल",
    "v": "व",
    "z": "श",
    "S": "ष",
    "s": "स",
    "h": "ह",
    "": "",
};

}, {}],
4: [function(require, module, exports) {

/**
 * Module dependencies.
 */

try {
  var events = require('event');
} catch(err) {
  var events = require('component-event');
}

try {
  var delegate = require('delegate');
} catch(err) {
  var delegate = require('component-delegate');
}

/**
 * Expose `Events`.
 */

module.exports = Events;

/**
 * Initialize an `Events` with the given
 * `el` object which events will be bound to,
 * and the `obj` which will receive method calls.
 *
 * @param {Object} el
 * @param {Object} obj
 * @api public
 */

function Events(el, obj) {
  if (!(this instanceof Events)) return new Events(el, obj);
  if (!el) throw new Error('element required');
  if (!obj) throw new Error('object required');
  this.el = el;
  this.obj = obj;
  this._events = {};
}

/**
 * Subscription helper.
 */

Events.prototype.sub = function(event, method, cb){
  this._events[event] = this._events[event] || {};
  this._events[event][method] = cb;
};

/**
 * Bind to `event` with optional `method` name.
 * When `method` is undefined it becomes `event`
 * with the "on" prefix.
 *
 * Examples:
 *
 *  Direct event handling:
 *
 *    events.bind('click') // implies "onclick"
 *    events.bind('click', 'remove')
 *    events.bind('click', 'sort', 'asc')
 *
 *  Delegated event handling:
 *
 *    events.bind('click li > a')
 *    events.bind('click li > a', 'remove')
 *    events.bind('click a.sort-ascending', 'sort', 'asc')
 *    events.bind('click a.sort-descending', 'sort', 'desc')
 *
 * @param {String} event
 * @param {String|function} [method]
 * @return {Function} callback
 * @api public
 */

Events.prototype.bind = function(event, method){
  var e = parse(event);
  var el = this.el;
  var obj = this.obj;
  var name = e.name;
  var method = method || 'on' + name;
  var args = [].slice.call(arguments, 2);

  // callback
  function cb(){
    var a = [].slice.call(arguments).concat(args);
    obj[method].apply(obj, a);
  }

  // bind
  if (e.selector) {
    cb = delegate.bind(el, e.selector, name, cb);
  } else {
    events.bind(el, name, cb);
  }

  // subscription for unbinding
  this.sub(name, method, cb);

  return cb;
};

/**
 * Unbind a single binding, all bindings for `event`,
 * or all bindings within the manager.
 *
 * Examples:
 *
 *  Unbind direct handlers:
 *
 *     events.unbind('click', 'remove')
 *     events.unbind('click')
 *     events.unbind()
 *
 * Unbind delegate handlers:
 *
 *     events.unbind('click', 'remove')
 *     events.unbind('click')
 *     events.unbind()
 *
 * @param {String|Function} [event]
 * @param {String|Function} [method]
 * @api public
 */

Events.prototype.unbind = function(event, method){
  if (0 == arguments.length) return this.unbindAll();
  if (1 == arguments.length) return this.unbindAllOf(event);

  // no bindings for this event
  var bindings = this._events[event];
  if (!bindings) return;

  // no bindings for this method
  var cb = bindings[method];
  if (!cb) return;

  events.unbind(this.el, event, cb);
};

/**
 * Unbind all events.
 *
 * @api private
 */

Events.prototype.unbindAll = function(){
  for (var event in this._events) {
    this.unbindAllOf(event);
  }
};

/**
 * Unbind all events for `event`.
 *
 * @param {String} event
 * @api private
 */

Events.prototype.unbindAllOf = function(event){
  var bindings = this._events[event];
  if (!bindings) return;

  for (var method in bindings) {
    this.unbind(event, method);
  }
};

/**
 * Parse `event`.
 *
 * @param {String} event
 * @return {Object}
 * @api private
 */

function parse(event) {
  var parts = event.split(/ +/);
  return {
    name: parts.shift(),
    selector: parts.join(' ')
  }
}

}, {"event":8,"component-event":8,"delegate":9,"component-delegate":9}],
8: [function(require, module, exports) {
var bind = window.addEventListener ? 'addEventListener' : 'attachEvent',
    unbind = window.removeEventListener ? 'removeEventListener' : 'detachEvent',
    prefix = bind !== 'addEventListener' ? 'on' : '';

/**
 * Bind `el` event `type` to `fn`.
 *
 * @param {Element} el
 * @param {String} type
 * @param {Function} fn
 * @param {Boolean} capture
 * @return {Function}
 * @api public
 */

exports.bind = function(el, type, fn, capture){
  el[bind](prefix + type, fn, capture || false);
  return fn;
};

/**
 * Unbind `el` event `type`'s callback `fn`.
 *
 * @param {Element} el
 * @param {String} type
 * @param {Function} fn
 * @param {Boolean} capture
 * @return {Function}
 * @api public
 */

exports.unbind = function(el, type, fn, capture){
  el[unbind](prefix + type, fn, capture || false);
  return fn;
};
}, {}],
9: [function(require, module, exports) {
/**
 * Module dependencies.
 */

try {
  var closest = require('closest');
} catch(err) {
  var closest = require('component-closest');
}

try {
  var event = require('event');
} catch(err) {
  var event = require('component-event');
}

/**
 * Delegate event `type` to `selector`
 * and invoke `fn(e)`. A callback function
 * is returned which may be passed to `.unbind()`.
 *
 * @param {Element} el
 * @param {String} selector
 * @param {String} type
 * @param {Function} fn
 * @param {Boolean} capture
 * @return {Function}
 * @api public
 */

exports.bind = function(el, selector, type, fn, capture){
  return event.bind(el, type, function(e){
    var target = e.target || e.srcElement;
    e.delegateTarget = closest(target, selector, true, el);
    if (e.delegateTarget) fn.call(el, e);
  }, capture);
};

/**
 * Unbind event `type`'s callback `fn`.
 *
 * @param {Element} el
 * @param {String} type
 * @param {Function} fn
 * @param {Boolean} capture
 * @api public
 */

exports.unbind = function(el, type, fn, capture){
  event.unbind(el, type, fn, capture);
};

}, {"closest":10,"component-closest":10,"event":11,"component-event":11}],
10: [function(require, module, exports) {
/**
 * Module Dependencies
 */

try {
  var matches = require('matches-selector')
} catch (err) {
  var matches = require('component-matches-selector')
}

/**
 * Export `closest`
 */

module.exports = closest

/**
 * Closest
 *
 * @param {Element} el
 * @param {String} selector
 * @param {Element} scope (optional)
 */

function closest (el, selector, scope) {
  scope = scope || document.documentElement;

  // walk up the dom
  while (el && el !== scope) {
    if (matches(el, selector)) return el;
    el = el.parentNode;
  }

  // check scope for match
  return matches(el, selector) ? el : null;
}

}, {"matches-selector":12,"component-matches-selector":12}],
12: [function(require, module, exports) {
/**
 * Module dependencies.
 */

try {
  var query = require('query');
} catch (err) {
  var query = require('component-query');
}

/**
 * Element prototype.
 */

var proto = Element.prototype;

/**
 * Vendor function.
 */

var vendor = proto.matches
  || proto.webkitMatchesSelector
  || proto.mozMatchesSelector
  || proto.msMatchesSelector
  || proto.oMatchesSelector;

/**
 * Expose `match()`.
 */

module.exports = match;

/**
 * Match `el` to `selector`.
 *
 * @param {Element} el
 * @param {String} selector
 * @return {Boolean}
 * @api public
 */

function match(el, selector) {
  if (!el || el.nodeType !== 1) return false;
  if (vendor) return vendor.call(el, selector);
  var nodes = query.all(selector, el.parentNode);
  for (var i = 0; i < nodes.length; ++i) {
    if (nodes[i] == el) return true;
  }
  return false;
}

}, {"query":13,"component-query":13}],
13: [function(require, module, exports) {
function one(selector, el) {
  return el.querySelector(selector);
}

exports = module.exports = function(selector, el){
  el = el || document;
  return one(selector, el);
};

exports.all = function(selector, el){
  el = el || document;
  return el.querySelectorAll(selector);
};

exports.engine = function(obj){
  if (!obj.one) throw new Error('.one callback required');
  if (!obj.all) throw new Error('.all callback required');
  one = obj.one;
  exports.all = obj.all;
  return exports;
};

}, {}],
11: [function(require, module, exports) {
var bind, unbind, prefix;

function detect () {
  bind = window.addEventListener ? 'addEventListener' : 'attachEvent';
  unbind = window.removeEventListener ? 'removeEventListener' : 'detachEvent';
  prefix = bind !== 'addEventListener' ? 'on' : '';
}

/**
 * Bind `el` event `type` to `fn`.
 *
 * @param {Element} el
 * @param {String} type
 * @param {Function} fn
 * @param {Boolean} capture
 * @return {Function}
 * @api public
 */

exports.bind = function(el, type, fn, capture){
  if (!bind) detect();
  el[bind](prefix + type, fn, capture || false);
  return fn;
};

/**
 * Unbind `el` event `type`'s callback `fn`.
 *
 * @param {Element} el
 * @param {String} type
 * @param {Function} fn
 * @param {Boolean} capture
 * @return {Function}
 * @api public
 */

exports.unbind = function(el, type, fn, capture){
  if (!unbind) detect();
  el[unbind](prefix + type, fn, capture || false);
  return fn;
};

}, {}],
5: [function(require, module, exports) {
module.exports = draggable;

function draggable(element, options) {
	if (!(this instanceof draggable)) return new draggable(element);
	this.element = element;
	this._defaults = {
		contained: false,
		pens: false,
		vertical: true,
		horizontal: true,
		disabled: false
	};
	var extend = function (a, b) {
		for(var key in b) {
			if (b.hasOwnProperty(key)) {
				a[key] = b[key];
			}
		}
		return a;
	}
	this._options = extend(this._defaults, options);
	this._parent = (this._options.contained) ? this.element.parentNode: window;
	this._roam = (this._options.roam  !== undefined) ? this._options.roam : true;
	this._contained = (this._options.contained !== undefined) ? this._options.contained : false;
	this._pens = this._options.pens;
	this._disabled = (this._options.disabled !== undefined) ? this._options.disabled : true;
	this._vertical = (this._options.vertical !== undefined) ? this._options.vertical : true;
	this._horizontal = (this._options.horizontal !== undefined) ? this._options.horizontal : true;
	this._ghosting = (this._options.ghosting !== undefined) ? this._options.ghosting : false;
	this._create();
}
draggable.prototype.setPens = function (pens) {
	if (pens) {
		this._pens = pens;
	}
}
draggable.prototype.setDisabled = function (disabled) {
	if (disabled !== undefined) {
		this._disabled = disabled;
	}
}
draggable.prototype.setContained = function (contained) {
	if (contained !== undefined) {
		this._contained = contained;
	}
}
draggable.prototype.setRoam = function (roam) {
	if (roam !== undefined) {
		this._roam = roam;
	}
}
draggable.prototype.setVertical = function (vertical) {
	if (vertical !== undefined) {
		this._vertical = vertical;
	}
}
draggable.prototype.setHorizontal = function (horizontal) {
	if (horizontal !== undefined) {
		this._horizontal = horizontal;
	}
}
draggable.prototype.setGhosting = function (ghosting) {
	if (ghosting !== undefined) {
		this._ghosting = ghosting;
	}
}
draggable.prototype._create = function () {
	var draggable = this,
		ghost,
		drag = function (event) {
			//TODO: really cool that on move here you could almost make online paint, didn't even think of that.
			// ghost = draggable.element.cloneNode();
			// ghost.style.opacity = 0.5;
			// document.querySelector('body').appendChild(ghost);
			draggable.element.style.position = 'absolute';
			draggable._newY = event.clientY - draggable._offY;
			draggable._newX = event.clientX - draggable._offX;
			if (draggable._contained) {	
				if (draggable._newX < draggable._boundsXL) {
					draggable._newX = draggable._boundsXL;
				}
				if (draggable._newX > draggable._boundsXR) {
					draggable._newX = draggable._boundsXR;
				}
				if (draggable._newY > draggable._boundsXB) {
					draggable._newY = draggable._boundsXB;
				}
				if (draggable._newY < draggable._boundsXT) {
					draggable._newY = draggable._boundsXT;
				}
			}
			if (draggable._horizontal) {
				draggable.element.style.left = draggable._newX + 'px';
			}
			if (draggable._vertical) {
				draggable.element.style.top = draggable._newY + 'px';
			}
			draggable._parent.addEventListener('dblclick', endDrag);
		},
		endDrag = function () {
			if (draggable._disabled) {
				return false;
			} else {
				if (ghost !== undefined) {
					ghost.remove();
				}
				draggable._parent.removeEventListener('mousemove', drag, true);
				if (draggable._pens && draggable._pens.length > 0) {
					var penned = false,
						currentPen = draggable.element.parentNode,
						isAPen = function (element) {
							for (var i = 0; i <= draggable._pens.length - 1; i++) {
								if (currentPen === draggable._pens[i]) {
									return true;
								}
							};
						};
					for (var i = 0; i < draggable._pens.length; i++) {
						if (draggable._newX < (draggable._pens[i].offsetLeft + draggable._pens[i].offsetWidth) && draggable._newX > (draggable._pens[i].offsetLeft - draggable.element.offsetWidth) && draggable._newY > (draggable._pens[i].offsetTop - draggable.element.offsetHeight) && draggable._newY < (draggable._pens[i].offsetTop + draggable._pens[i].offsetHeight + draggable.element.offsetHeight)) {
							penned = true;
							draggable.element.style.position = '';
							draggable._pens[i].appendChild(draggable.element);
							break;
						}
					};
					if (!penned) {
						if (draggable._roam) {
							document.querySelector('body').appendChild(draggable.element);
						} else {
							if (isAPen(currentPen)) {
								currentPen.appendChild(draggable.element);
								draggable.element.style.position = '';
							}
						}
					}
				}
			}
		},
		startDrag = function (event) {
			if (draggable._disabled) {
				return false;
			} else {
				draggable._offY = event.clientY - parseInt(draggable.element.offsetTop);
				draggable._offX = event.clientX - parseInt(draggable.element.offsetLeft);
				draggable._boundsXR = (draggable._parent.offsetLeft + draggable._parent.offsetWidth) - draggable.element.offsetWidth;
				draggable._boundsXL = draggable._parent.offsetLeft;
				draggable._boundsXT = draggable._parent.offsetTop;
				draggable._boundsXB = (draggable._parent.offsetTop + draggable._parent.offsetHeight) - draggable.element.offsetHeight;
				if (draggable._ghosting) {
					ghost = draggable.element.cloneNode();
					draggable.element.parentNode.appendChild(ghost);
					ghost.style.opacity = 0.2;
					ghost.style.position = 'absolute';
					ghost.style.left = draggable.element.offsetLeft + 'px';
					ghost.style.top = draggable.element.offsetTop + 'px';
				}	
				draggable._parent.addEventListener('mousemove', drag, true);
			}
		};
	draggable.element.addEventListener('mousedown', startDrag, false);
    	draggable.element.addEventListener('mouseup', endDrag, false);
}

}, {}]}, {}, {"1":""})