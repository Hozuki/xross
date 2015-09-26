//import {IComparable, IComparer, DefaultComparer, NotImplementedError} from "./xcommon";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var xcommon = require("./xcommon");
var xross;
(function (xross) {
    "use strict";
    var ArgumentError = xcommon.xross.ArgumentError;
    var XHashCodeProvider = (function () {
        function XHashCodeProvider() {
        }
        XHashCodeProvider.prototype.getHashCode = function (o) {
            return o.getHashCode();
        };
        return XHashCodeProvider;
    })();
    var PHashCodeProvider = (function () {
        function PHashCodeProvider() {
        }
        PHashCodeProvider.prototype.getHashCode = function (o) {
            return o;
        };
        return PHashCodeProvider;
    })();
    var NSet = (function () {
        function NSet(provider) {
            this._p = provider;
            this._o = Object.create(null);
            this._count = 0;
        }
        NSet.prototype.clear = function () {
            for (var key in this._o) {
                delete this._o[key];
            }
            this._count = 0;
        };
        NSet.prototype.delete = function (item) {
            var hashCode = this._p.getHashCode(item);
            var b = this.hasHashCode(hashCode);
            if (b) {
                delete this._o[hashCode];
                this._count--;
            }
            return b;
        };
        NSet.prototype.forEach = function (callbackfn) {
            for (var key in this._o) {
                callbackfn(this._o[key], this._o[key], this);
            }
        };
        NSet.prototype.get = function (item) {
            return this._o[this._p.getHashCode(item)];
        };
        NSet.prototype.has = function (item) {
            return this._o[this._p.getHashCode(item)] !== undefined;
        };
        NSet.prototype.hasHashCode = function (hashCode) {
            return this._o[hashCode] !== undefined;
        };
        NSet.prototype.set = function (item) {
            var hashCode = this._p.getHashCode(item);
            var b = this.hasHashCode(hashCode);
            if (!b) {
                this._o[hashCode] = item;
                this._count++;
            }
        };
        NSet.prototype.size = function () {
            return this._count;
        };
        NSet.prototype.isEmpty = function () {
            return this._count > 0;
        };
        return NSet;
    })();
    var NMap = (function () {
        function NMap(provider) {
            this._p = provider;
            this._o = Object.create(null);
            this._count = 0;
        }
        NMap.prototype.clear = function () {
            for (var key in this._o) {
                delete this._o[key];
            }
            this._count = 0;
        };
        NMap.prototype.delete = function (key) {
            var hashCode = this._p.getHashCode(key);
            var b = this.hasHashCode(hashCode);
            if (b) {
                delete this._o[hashCode];
                this._count--;
            }
            return b;
        };
        NMap.prototype.forEach = function (callbackfn) {
            for (var key in this._o) {
                callbackfn(this._o[key].value, this._o[key].key, this);
            }
        };
        NMap.prototype.get = function (key) {
            return this._o[this._p.getHashCode(key)].value;
        };
        NMap.prototype.has = function (key) {
            return this._o[this._p.getHashCode(key)] !== undefined;
        };
        NMap.prototype.hasHashCode = function (hashCode) {
            return this._o[hashCode] !== undefined;
        };
        NMap.prototype.set = function (key, value) {
            var hashCode = this._p.getHashCode(key);
            var b = this.hasHashCode(hashCode);
            if (!b) {
                this._o[hashCode] = { key: key, value: value };
                this._count++;
            }
        };
        NMap.prototype.size = function () {
            return this._count;
        };
        NMap.prototype.isEmpty = function () {
            return this._count > 0;
        };
        return NMap;
    })();
    var RED = false, BLACK = true;
    var RB = {
        create: function (key, value, parent, color, left, right) {
            if (color === void 0) { color = BLACK; }
            if (left === void 0) { left = null; }
            if (right === void 0) { right = null; }
            return { key: key, value: value, parent: parent, color: color, left: left, right: right };
        }
    };
    function setColor(n, color) {
        if (n !== null) {
            n.color = color;
        }
    }
    function colorOf(n) {
        return n === null ? BLACK : n.color;
    }
    var NTreeBase = (function () {
        function NTreeBase(comparer) {
            this._comparer = comparer;
            this._root = null;
            this._size = 0;
            this._modCount = 0;
        }
        NTreeBase.prototype.clear = function () {
            this._root = null;
            this._modCount = 0;
            this._size = 0;
        };
        NTreeBase.prototype.delete = function (key) {
            var node = this.findNodeByKey(key);
            if (node === null) {
                return false;
            }
            else {
                this.deleteNode(node);
                this._size--;
                this._modCount++;
                return true;
            }
        };
        NTreeBase.prototype.get = function (key) {
            var node = this.findNodeByKey(key);
            return node === null ? null : node.value;
        };
        NTreeBase.prototype.has = function (key) {
            return this.findNodeByKey(key) !== null;
        };
        NTreeBase.prototype.set = function (key, value) {
            return this.addOrSetNode(key, value);
        };
        NTreeBase.prototype.size = function () {
            return this._size;
        };
        NTreeBase.prototype.isEmpty = function () {
            return this._size > 0;
        };
        NTreeBase.prototype.pollFirstEntry = function () {
            if (this._root !== null) {
                var n = this._root;
                while (n.left !== null) {
                    n = n.left;
                }
                var v = n.value;
                this.deleteNode(n);
                this._size--;
                this._modCount++;
                return v;
            }
            else {
                return null;
            }
        };
        NTreeBase.prototype.pollLastEntry = function () {
            if (this._root !== null) {
                var n = this._root;
                while (n.right !== null) {
                    n = n.right;
                }
                var v = n.value;
                this.deleteNode(n);
                this._size--;
                this._modCount++;
                return v;
            }
            else {
                return null;
            }
        };
        NTreeBase.prototype.fixAfterInsertion = function (node) {
            node.color = RED;
            var y;
            while (node !== null && node !== this._root && colorOf(node.parent) === RED) {
                if (node.parent === node.parent.parent.left) {
                    y = node.parent.parent.right;
                    if (colorOf(y) === RED) {
                        setColor(node.parent, BLACK);
                        setColor(y, BLACK);
                        setColor(node.parent.parent, RED);
                        node = node.parent.parent;
                    }
                    else {
                        if (node === node.parent.right) {
                            node = node.parent;
                            this.rotateLeft(node);
                        }
                        setColor(node.parent, BLACK);
                        setColor(node.parent.parent, RED);
                        this.rotateRight(node.parent.parent);
                    }
                }
                else {
                    y = node.parent.parent.left;
                    if (colorOf(y) === RED) {
                        setColor(node.parent, BLACK);
                        setColor(y, BLACK);
                        setColor(node.parent.parent, RED);
                        node = node.parent.parent;
                    }
                    else {
                        if (node === node.parent.left) {
                            node = node.parent;
                            this.rotateRight(node);
                        }
                        setColor(node.parent, BLACK);
                        setColor(node.parent.parent, RED);
                        this.rotateLeft(node.parent.parent);
                    }
                }
            }
            this._root.color = BLACK;
        };
        NTreeBase.prototype.successor = function (t) {
            var p, ch;
            if (t === null) {
                return null;
            }
            else if (t.right !== null) {
                p = t.right;
                while (p.left !== null) {
                    p = p.left;
                }
                return p;
            }
            else {
                p = t.parent;
                ch = t;
                while (p !== null && ch === p.right) {
                    ch = p;
                    p = p.parent;
                }
                return p;
            }
        };
        NTreeBase.prototype.rotateLeft = function (node) {
            if (node !== null) {
                var r = node.right;
                node.right = r.left;
                if (r.left !== null) {
                    r.left.parent = node;
                }
                r.parent = node.parent;
                if (node.parent === null) {
                    this._root = r;
                }
                else if (node.parent.left === node) {
                    node.parent.left = r;
                }
                else {
                    node.parent.right = r;
                }
                r.left = node;
                node.parent = r;
            }
        };
        NTreeBase.prototype.rotateRight = function (node) {
            if (node !== null) {
                var l = node.left;
                node.left = l.right;
                if (l.right !== null) {
                    l.right.parent = node;
                }
                l.parent = node.parent;
                if (node.parent === null) {
                    this._root = l;
                }
                else if (node.parent.right === node) {
                    node.parent.right = l;
                }
                else {
                    node.parent.left = l;
                }
                l.right = node;
                node.parent = l;
            }
        };
        NTreeBase.prototype.deleteNode = function (p) {
            if (p.left === null && p.right !== null) {
                var s = this.successor(p);
                p.key = s.key;
                p.value = s.value;
                p = s;
            }
            var replacement = (p.left !== null ? p.left : p.right);
            if (replacement !== null) {
                replacement.parent = p.parent;
                if (p.parent === null) {
                    this._root = replacement;
                }
                else if (p === p.parent.left) {
                    p.parent.left = replacement;
                }
                else {
                    p.parent.right = replacement;
                }
                p.left = p.right = p.parent = null;
                if (colorOf(p) === BLACK) {
                    this.fixAfterDeletion(replacement);
                }
            }
            else if (p.parent === null) {
                this._root = null;
            }
            else {
                if (colorOf(p) === BLACK) {
                    this.fixAfterDeletion(p);
                }
                if (p.parent !== null) {
                    if (p === p.parent.left) {
                        p.parent.left = null;
                    }
                    else if (p === p.parent.right) {
                        p.parent.right = null;
                    }
                    p.parent = null;
                }
            }
        };
        NTreeBase.prototype.findNodeByKey = function (key) {
            var cmp;
            if (this._root === null) {
                return null;
            }
            var n = this._root;
            if (this._comparer !== null) {
                while (n !== null) {
                    cmp = this._comparer.compare(n.key, key);
                    if (cmp === 0) {
                        return n;
                    }
                    else if (cmp > 0) {
                        n = n.left;
                    }
                    else {
                        n = n.right;
                    }
                }
                return null;
            }
            else {
                while (n !== null) {
                    cmp = n.key > key ? 1 : (n.key < key ? -1 : 0);
                    if (cmp === 0) {
                        return n;
                    }
                    else if (cmp > 0) {
                        n = n.left;
                    }
                    else {
                        n = n.right;
                    }
                }
                return null;
            }
        };
        NTreeBase.prototype.fixAfterDeletion = function (x) {
            var sib;
            while (x !== null && x !== this._root && colorOf(x) === BLACK) {
                if (x === x.parent.left) {
                    sib = x.parent.right;
                    if (colorOf(sib) === RED) {
                        setColor(sib, BLACK);
                        setColor(x.parent, RED);
                        this.rotateLeft(x.parent);
                        sib = x.parent.right;
                    }
                    if (colorOf(sib.left) === BLACK && colorOf(sib.right) === BLACK) {
                        setColor(sib, RED);
                        x = x.parent;
                    }
                    else {
                        if (colorOf(sib.right) === BLACK) {
                            setColor(sib.left, BLACK);
                            setColor(sib, RED);
                            this.rotateRight(sib);
                            sib = x.parent.right;
                        }
                        setColor(sib, colorOf(x.parent));
                        setColor(x.parent, BLACK);
                        setColor(sib.right, BLACK);
                        this.rotateLeft(x.parent);
                        x = this._root;
                    }
                }
                else {
                    sib = x.parent.left;
                    if (colorOf(sib) === RED) {
                        setColor(sib, BLACK);
                        setColor(x.parent, RED);
                        this.rotateRight(x.parent);
                        sib = x.parent.left;
                    }
                    if (colorOf(sib.right) === BLACK && colorOf(sib.left) === BLACK) {
                        setColor(sib, RED);
                        x = x.parent;
                    }
                    else {
                        if (colorOf(sib.left) === BLACK) {
                            setColor(sib.right, BLACK);
                            setColor(sib, RED);
                            this.rotateLeft(sib);
                            sib = x.parent.left;
                        }
                        setColor(sib, colorOf(x.parent));
                        setColor(x.parent, BLACK);
                        setColor(sib.left, BLACK);
                        this.rotateRight(x.parent);
                        x = this._root;
                    }
                }
            }
            setColor(x, BLACK);
        };
        NTreeBase.prototype.buildQueryQueue = function (mid) {
            var ql, qr;
            if (mid.left === null) {
                ql = [];
            }
            else {
                ql = this.buildQueryQueue(mid.left);
            }
            if (mid.right === null) {
                qr = [];
            }
            else {
                qr = this.buildQueryQueue(mid.right);
            }
            return ql.concat(mid, qr);
        };
        NTreeBase.prototype.addOrSetNode = function (key, value) {
            var t = this._root;
            if (t === null) {
                this._root = RB.create(key, value, null);
                this._size = 1;
                this._modCount++;
                return null;
            }
            var cmp;
            var parent;
            if (this._comparer !== null) {
                do {
                    parent = t;
                    cmp = this._comparer.compare(key, t.key);
                    if (cmp < 0) {
                        t = t.left;
                    }
                    else if (cmp > 0) {
                        t = t.right;
                    }
                    else {
                        var v = t.value;
                        t.value = value;
                        return;
                    }
                } while (t !== null);
            }
            else {
                if (key == null) {
                    throw new ArgumentError("Key should not be null");
                }
                do {
                    parent = t;
                    cmp = key > t.key ? 1 : (key < t.key ? -1 : 0);
                    if (cmp < 0) {
                        t = t.left;
                    }
                    else if (cmp > 0) {
                        t = t.right;
                    }
                    else {
                        var v = t.value;
                        t.value = value;
                        return;
                    }
                } while (t !== null);
            }
            var e = RB.create(key, value, parent);
            if (cmp < 0) {
                parent.left = e;
            }
            else {
                parent.right = e;
            }
            this.fixAfterInsertion(e);
            this._size++;
            this._modCount++;
        };
        NTreeBase.prototype.getHigherEntry = function (key) {
            var node = this._root;
            var cmp;
            var parent, ch;
            if (this._comparer !== null) {
                while (node !== null) {
                    cmp = this._comparer.compare(key, node.key);
                    if (cmp < 0) {
                        if (node.left !== null) {
                            node = node.left;
                        }
                        else {
                            return node;
                        }
                    }
                    else {
                        if (node.right !== null) {
                            node = node.right;
                        }
                        else {
                            parent = node.parent;
                            ch = node;
                            while (parent !== null && ch !== parent.right) {
                                ch = parent;
                                parent = parent.parent;
                            }
                            return parent;
                        }
                    }
                }
                return null;
            }
            else {
                while (node !== null) {
                    cmp = key > node.key ? 1 : (key < node.key ? -1 : 0);
                    if (cmp < 0) {
                        if (node.left !== null) {
                            node = node.left;
                        }
                        else {
                            return node;
                        }
                    }
                    else {
                        if (node.right !== null) {
                            node = node.right;
                        }
                        else {
                            parent = node.parent;
                            ch = node;
                            while (parent !== null && ch !== parent.right) {
                                ch = parent;
                                parent = parent.parent;
                            }
                            return parent;
                        }
                    }
                }
                return null;
            }
        };
        NTreeBase.prototype.getLowerEntry = function (key) {
            var node = this._root;
            var cmp;
            var parent, ch;
            if (this._comparer !== null) {
                while (node !== null) {
                    cmp = this._comparer.compare(key, node.key);
                    if (cmp > 0) {
                        if (node.right !== null) {
                            node = node.right;
                        }
                        else {
                            return node;
                        }
                    }
                    else {
                        if (node.left !== null) {
                            node = node.left;
                        }
                        else {
                            parent = node.parent;
                            ch = node;
                            while (parent !== null && ch !== parent.right) {
                                ch = parent;
                                parent = parent.parent;
                            }
                            return parent;
                        }
                    }
                }
                return null;
            }
            else {
                while (node !== null) {
                    cmp = key > node.key ? 1 : (key < node.key ? -1 : 0);
                    if (cmp > 0) {
                        if (node.right !== null) {
                            node = node.right;
                        }
                        else {
                            return node;
                        }
                    }
                    else {
                        if (node.left !== null) {
                            node = node.left;
                        }
                        else {
                            parent = node.parent;
                            ch = node;
                            while (parent !== null && ch !== parent.right) {
                                ch = parent;
                                parent = parent.parent;
                            }
                            return parent;
                        }
                    }
                }
                return null;
            }
        };
        return NTreeBase;
    })();
    var NTreeSet = (function (_super) {
        __extends(NTreeSet, _super);
        function NTreeSet(comparer) {
            _super.call(this, comparer);
        }
        NTreeSet.prototype.delete = function (item) {
            return _super.prototype.delete.call(this, item);
        };
        NTreeSet.prototype.forEach = function (callbackfn) {
            var queue = this.buildQueryQueue(this._root);
            var len = queue.length;
            for (var i = 0; i < len; i++) {
                callbackfn(queue[i].value, queue[i].key, this);
            }
        };
        NTreeSet.prototype.set = function (item) {
            return _super.prototype.set.call(this, item, item);
        };
        NTreeSet.prototype.higher = function (item) {
            var node = this.getHigherEntry(item);
            if (node !== null) {
                return node.value;
            }
            else {
                return null;
            }
        };
        NTreeSet.prototype.lower = function (item) {
            var node = this.getLowerEntry(item);
            if (node !== null) {
                return node.value;
            }
            else {
                return null;
            }
        };
        return NTreeSet;
    })(NTreeBase);
    var NTreeMap = (function (_super) {
        __extends(NTreeMap, _super);
        function NTreeMap(comparer) {
            _super.call(this, comparer);
        }
        NTreeMap.prototype.forEach = function (callbackfn) {
            var queue = this.buildQueryQueue(this._root);
            var len = queue.length;
            for (var i = 0; i < len; i++) {
                callbackfn(queue[i].value, queue[i].key, this);
            }
        };
        return NTreeMap;
    })(NTreeBase);
    var XSet = (function (_super) {
        __extends(XSet, _super);
        function XSet() {
            _super.call(this, new XHashCodeProvider());
        }
        return XSet;
    })(NSet);
    xross.XSet = XSet;
    var XMap = (function (_super) {
        __extends(XMap, _super);
        function XMap() {
            _super.call(this, new XHashCodeProvider());
        }
        return XMap;
    })(NMap);
    xross.XMap = XMap;
    var PSet = (function (_super) {
        __extends(PSet, _super);
        function PSet() {
            _super.call(this, new PHashCodeProvider());
        }
        return PSet;
    })(NSet);
    xross.PSet = PSet;
    var PMap = (function (_super) {
        __extends(PMap, _super);
        function PMap() {
            _super.call(this, new PHashCodeProvider());
        }
        return PMap;
    })(NMap);
    xross.PMap = PMap;
    var XTreeSet = (function (_super) {
        __extends(XTreeSet, _super);
        function XTreeSet(comparer) {
            if (comparer === void 0) { comparer = null; }
            _super.call(this, comparer);
        }
        return XTreeSet;
    })(NTreeSet);
    xross.XTreeSet = XTreeSet;
    var XTreeMap = (function (_super) {
        __extends(XTreeMap, _super);
        function XTreeMap(comparer) {
            if (comparer === void 0) { comparer = null; }
            _super.call(this, comparer);
        }
        return XTreeMap;
    })(NTreeMap);
    xross.XTreeMap = XTreeMap;
    var PTreeSet = (function (_super) {
        __extends(PTreeSet, _super);
        function PTreeSet(comparer) {
            if (comparer === void 0) { comparer = null; }
            _super.call(this, comparer);
        }
        return PTreeSet;
    })(NTreeSet);
    xross.PTreeSet = PTreeSet;
    var PTreeMap = (function (_super) {
        __extends(PTreeMap, _super);
        function PTreeMap(comparer) {
            if (comparer === void 0) { comparer = null; }
            _super.call(this, comparer);
        }
        return PTreeMap;
    })(NTreeMap);
    xross.PTreeMap = PTreeMap;
    function keySet(m) {
        var ret = new XSet();
        m.forEach(function (v, k) {
            ret.set(k);
        });
        return ret;
    }
    xross.keySet = keySet;
    function arrayFromSet(set) {
        var array = [];
        set.forEach(function (v) {
            array.push(v);
        });
        return array;
    }
    xross.arrayFromSet = arrayFromSet;
    function arrayToSet(array, set) {
        array.forEach(function (v) {
            set.set(v);
        });
    }
    xross.arrayToSet = arrayToSet;
})(xross = exports.xross || (exports.xross = {}));
//# sourceMappingURL=xcollection.js.map