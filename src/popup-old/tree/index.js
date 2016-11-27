// var domify = require ('component/domify');
var events = require('component/events');
var classes = require('component/classes');
// var movearound = require('chemzqm/movearound');
var Emitter = require('component/emitter');
// var tmpl = require('./template.html');
var query = require('component/query');


/**
 * Init tree with parent node
 * @param {Node} parent
 * @api public
 */

function createTreeElement() {
    var oTree = cre('div');
    classes(oTree).add('tree');
    var oList = cre('ul');
    classes(oList).add('tree-list');
    var oLeaf = cre('li');
    classes(oLeaf).add('tree-leaf');
    var oBranch = cre('li');
    classes(oBranch).add('tree-branch');
    var oText = cre('div');
    classes(oText).add('tree-text');
    var oList2 = cre('ul');
    classes(oList2).add('tree-list');
    oBranch.appendChild(oText);
    oBranch.appendChild(oList2);
    oList.appendChild(oLeaf);
    oList.appendChild(oBranch);
    oTree.appendChild(oList);
    return oTree;
}

function Tree(parent) {
  if (! this instanceof Tree) return new Tree(parent);
  this.el = parent;
  this.events = events(this.el, this);
  this.events.bind('click', 'onclick');
    // var el = domify(tmpl);
    var el = createTreeElement();

  parent.appendChild(el);
  this.root = query('.tree', parent);
  this.leafNode = query('.tree-leaf', parent);
  this.branchNode = query('.tree-branch', parent);
  var list = query('.tree-list', this.root);
  clear(list);
}

Emitter(Tree.prototype);

/**
 * Add leaf with text and config
 * @param {String} text
 * @param {Object} config
 * @api public
 */
Tree.prototype.leaf = function(text, o) {
  o = o || {};
  var parent = o.parent || this.last || this.root;
  if (typeof parent === 'string') {
    parent = this.find(parent);
  }
  var node = this.leafNode.cloneNode(true);
  for (var i in o) {
    i === 'parent' || node.setAttribute('data-' + i, o[i]);
  }
    // node.innerHTML = text;
    pseudoHtmlLeaf(node, text);
    var ul = query('.tree-list', parent);
    ul.appendChild(node);
    return this;
}

function pseudoHtmlLeaf(node, html) {
    var parts = html.split('<span class=');
    parts.forEach(function (part) {
        let el, tel, nagari, text;
        if (/^"nagari">/.test(part)) {
            text = part.replace('"nagari">', '');
            let parts1 = text.split('</span>');
            nagari = parts1[0];
            text = parts1[1];
            el = cre('span');
            el.textContent = nagari;
            classes(el).add('nagari');
            node.appendChild(el);
            tel = cret(text);
        } else if (/^"greek">/.test(part)) {
            text = part.replace('"greek">', '');
            let parts1 = text.split('</span>');
            nagari = parts1[0];
            text = parts1[1];
            el = cre('span');
            el.textContent = nagari;
            // classes(el).add('nagari');
            node.appendChild(el);
            tel = cret(text);
        } else {
            tel = cret(part);
        }
        node.appendChild(tel);
    });
    return;
}

/**
 * Add branch with text and config
 * @param {String} text
 * @param {Object} config
 * @api public
 */
Tree.prototype.branch = function(text, o) {
  o = o || {};
  var parent = o.parent || this.last || this.root;
  if (typeof parent === 'string') {
    parent = this.find(parent);
  }
  var node = this.branchNode.cloneNode(true);
  for (var i in o) {
    i === 'parent' || node.setAttribute('data-' + i, o[i]);
  }
    // query('.tree-text', node).innerHTML = text;
    var el = query('.tree-text', node);
    pseudoHtmlBranch(el, text);

  var ul = query('.tree-list', parent);
  ul.appendChild(node);
  this.last = node;
  return this;
}

function pseudoHtmlBranch(node, html) {
    var text = html.replace('<span class="dict-pos">', '');
    text = text.replace('</span>', '');
    text = text.trim();
    var el = cre('span');
    el.textContent = text;
    classes(el).add('dict-pos');
    node.appendChild(el);
    return;
}

Tree.prototype.parents = function (el) {
  if (typeof el === 'string') {
    el = this.find(el);
  }
  var res = [];
  while (el !== this.root) {
    el = el.parentNode;
    if (classes(el).has('tree-branch')) res.unshift(el);
  }
  return res;
}
/**
 *
 * @param {Event} e
 * @api private
 */
Tree.prototype.onclick = function(e) {
  var el = e.target;
  var node = within(el, 'tree-leaf', this.el);
  if (node) {
    //active leaf
    var active = query('.active', this.el);
    if (active) {
      classes(active).remove('active');
    }
    var id = node.getAttribute('data-id');
    classes(node).add('active');
    this.emit('active', node);
  } else {
    node = within(el, 'tree-text', this.el);
    if (node) {
      classes(node.parentNode).toggle('tree-collapse');
    }
  }
}

Tree.prototype.collapse = function(el) {
  if( typeof el === 'string' ) {
    el = this.find(el);
  }
  classes(el).add('tree-collapse');
  return this;
}

/**
 * Get the node by identifier
 * @param {String} id
 * @api public
 */
Tree.prototype.find = function(id) {
  return query('[data-id="' + id + '"]', this.el);
}

/**
 * Expend the element branch recursive
 * @param {String} el
 * @api public
 */
Tree.prototype.show = function(el) {
  if (typeof el === 'string') el = this.find(el);
  var parent = el.parentNode;
  if (parent !== this.root) {
    classes(parent).remove('tree-collapse');
    this.show(parent);
  }
  return this;
}

/**
 * Remove element by reference/id or remove all the nodes.
 * @param {String} el
 * @api public
 */
Tree.prototype.remove = function(el) {
  if (arguments.length === 0) {
    this.events.unbind();
    clear(this.el);
    // this.movearound && this.movearound.remove();
    return;
  }
  if (typeof el === 'string') el = this.find(el);
  el.parentNode.removeChild(el);
  var id = el.getAttribute('data-id');
  this.emit('remove', el);
  return this;
}

/**
 * Make leaves draggable
 * @api public
 */
// Tree.prototype.draggable = function() {
//   // this.movearound = movearound(this.el, 'tree-list');
//   // this.movearound.bind();
//   // this.movearound.on('update', function() {
//     this.emit('update');
//   }.bind(this));
//   return this;
// }

/**
 * build the tree with obj, optional configured with `text` and `children` attribute.
 *
 * @param {String} obj data source
 * @param {String} config [optional] config object
 * @api public
 */
Tree.prototype.data = function(obj, config) {
  config = config || {};
  var textAttr = config.text || 'text';
  var childrenAttr = config.children || 'children';
  obj.forEach(function (o) {
    o = clone(o);
    o.parent = o.parent || this.root;
    var text = o[textAttr];
    var children = o[childrenAttr];
    delete o[textAttr];
    delete o[childrenAttr];
    if (children) {
      this.branch(text, o);
      children.forEach(function (child) {
        child.parent = this.last;
      }.bind(this))
      this.data(children, config);
    } else {
      this.leaf(text, o);
    }
  }.bind(this))
}

/**
 * return the json string format of the tree
 * @api public
 */
Tree.prototype.toJSON = function() {
  var res = [];
  var list = query('.tree-list', this.root).childNodes;
  if (list) {
    for (var i = 0; i < list.length; i++) {
      var node = list[i];
      node.nodeType === 1 && res.push(toObject(node));
    }
  }
  return JSON.stringify(res);
}

module.exports = Tree;

function toObject(node) {
  var res = {}, i;
  var attrs = node.attributes;
  for ( i = 0; i < attrs.length; i++) {
    var name = attrs[i].nodeName;
    if (/^data-/.test(name)) {
      res[name.replace(/^data-/, '')] = node.getAttribute(name);
    }
  }
  if (classes(node).has('tree-leaf')) {
    res.text = node.textContent;
  }
  else if (classes(node).has('tree-branch')){
    res.text = query('.tree-text', node).textContent;
    res.children = [];
    var list = query('.tree-list', node).childNodes;
    for ( i = 0; i < list.length; i++) {
      node = list[i];
      node.nodeType === 1 && res.children.push(toObject(node));
    }
  }
  return res;
}

function clone(o) {
  var res = {};
  for (var i in o) {
    res[i] = o[i];
  }
  return res;
}

function clear(node) {
  while (node.firstChild) {
    node.removeChild(node.firstChild);
  }
}
function within(el, className, root) {
  while(el && el !== root) {
    if (classes(el).has(className)) return el;
    el = el.parentNode;
  }
  return null;
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
