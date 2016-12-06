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
// main

let server = 'http://admin:kjre4317@localhost:5984/';
let view = 'panini-rules/_design/panini-rules/_view/byForm?key=%22';
let tail = '%22&include_docs=true';

// let server = 'http://localhost:3002';
// var server = 'http://sa.diglossa.org:3002';

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    // message.form = 'kodayanti';
    message.form = 'कोदयति';
    console.log('QUERY', message.form);
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
            if (response.error) {
                console.log('no doc');
                return;
            }
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

}, {}]}, {}, {"1":""})