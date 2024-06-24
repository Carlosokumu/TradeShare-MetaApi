/* jscs:disable */
/* eslint-disable */

'use strict';

function createNewNode_(key) {
  return {
    key: key,
    weight: 1,
    height: 0,
    left: null,
    right: null
  };
}

var comparer_ = function(a, b) {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

function height_(p) {
  return p ? p.height : 0;
}

function weight_(p) {
  return p ? p.weight : 0;
}

function bFactor_(p) {
  return height_(p.right) - height_(p.left);
}

function countHeightAndWeight_(p) {
  var hl = height_(p.left);
  var hr = height_(p.right);
  p.height = (hl > hr ? hl : hr) + 1;

  var wl = weight_(p.left);
  var wr = weight_(p.right);
  p.weight = wl + wr + 1;
}

function rotateRight_(p) {
  var q = p.left;
  p.left = q.right;
  q.right = p;
  countHeightAndWeight_(p);
  countHeightAndWeight_(q);
  return q;
}

function rotateLeft_(q) {
  var p = q.right;
  q.right = p.left;
  p.left = q;
  countHeightAndWeight_(q);
  countHeightAndWeight_(p);
  return p;
}

function balance_(p) {
  countHeightAndWeight_(p);
  if (bFactor_(p) === 2) {
    if (bFactor_(p.right) < 0)
      p.right = rotateRight_(p.right);
    return rotateLeft_(p);
  }
  if (bFactor_(p) === -2) {
    if (bFactor_(p.left) > 0)
      p.left = rotateLeft_(p.left);
    return rotateRight_(p);
  }
  return p;
}

function count_(p, k) {
  return upperBound_(p, k) - lowerBound_(p, k);
}

function at_(p, k) {
  if (!p) return null;
  var wl = weight_(p.left);
  if (wl <= k && k < wl + 1) return p.key;
  else if (k < wl) return at_(p.left, k);
  else return at_(p.right, k - wl - 1);
}

function getMinimum_(p) {
  if (!p) return null;
  return p.left ? getMinimum_(p.left) : p;
}

function getMaximum_(p) {
  if (!p) return null;
  return p.right ? getMaximum_(p.right) : p;
}

function removeMinimun_(p) {
  if (!p.left) return p.right;
  p.left = removeMinimun_(p.left);
  return balance_(p);
}

function toArray_(p) {
  var arr = [];
  if (p.left) arr = arr.concat(toArray_(p.left));
  arr.push(p.key);
  if (p.right) arr = arr.concat(toArray_(p.right));
  return arr;
}

var AVLTree = function(comparer) {
  if (!comparer) comparer = comparer_;
  var AVL = {
    root: null,
    comparer_: comparer,

    size: function() {
      return weight_(AVL.root);
    },

    min: function() {
      var p = getMinimum_(AVL.root);
      if (p) return p.key;
      return null;
    },

    max: function() {
      var p = getMaximum_(AVL.root);
      if (p) return p.key;
      return null;
    },

    lowerBound: function(k) {
      return AVL.lowerBound_(AVL.root, k);
    },
    lowerBound_(p, k) {
      if (!p) return 0;
      var cmp = AVL.comparer_(k, p.key);

      if (cmp <= 0) return AVL.lowerBound_(p.left, k);
      else if (cmp > 0) return weight_(p.left) + AVL.lowerBound_(p.right, k) + 1;
    },

    upperBound: function(k) {
      return AVL.upperBound_(AVL.root, k);
    },

    upperBound_(p, k) {
      if (!p) return 0;
      var cmp = AVL.comparer_(k, p.key);

      if (cmp < 0) return AVL.upperBound_(p.left, k);
      else if (cmp >= 0) return weight_(p.left) + AVL.upperBound_(p.right, k) + 1;
    },

    count: function(k) {
      return count_(AVL.root, k);
    },

    at: function(k) {
      return at_(AVL.root, k);
    },

    insert: function(k) {
      AVL.root = AVL.insert_(AVL.root, k);
    },

    insert_(p, k) {
      if (!p) return createNewNode_(k);
      var cmp = AVL.comparer_(k, p.key);

      if (cmp < 0) p.left = AVL.insert_(p.left, k);
      else if (cmp >= 0) p.right = AVL.insert_(p.right, k);
      return balance_(p);
    },

    remove: function(k) {
      AVL.root = AVL.remove_(AVL.root, k);
    },

    remove_(p, k) {
      if (!p) return null;
      var cmp = AVL.comparer_(k, p.key);

      if (cmp < 0) p.left = AVL.remove_(p.left, k);
      else if (cmp > 0) p.right = AVL.remove_(p.right, k);
      else {
        var q = p.left;
        var r = p.right;
        if (!r) return q;

        var min = getMinimum_(r);
        min.right = removeMinimun_(r);
        min.left = q;
        return balance_(min);
      }
      return balance_(p);
    },

    removeAt: function(k) {
      var val = AVL.at(k);
      AVL.root = AVL.remove_(AVL.root, val);
    },

    toArray: function() {
      if (AVL.root === null) return [];
      return toArray_(AVL.root);
    }
  }
  return AVL;
}

module.exports = AVLTree;
