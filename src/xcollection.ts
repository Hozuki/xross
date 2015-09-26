//import {IComparable, IComparer, DefaultComparer, NotImplementedError} from "./xcommon";

//import * as xcommon from "./xcommon";
import xcommon = require("./xcommon");

export module xross {

    "use strict";

    import ArgumentError = xcommon.xross.ArgumentError;
    import NotImplementedError = xcommon.xross.NotImplementedError;
    import IComparer = xcommon.xross.IComparer;

    export interface ISet<T> {

        clear(): void;
        delete(item: T): boolean;
        forEach(callbackfn: (item: T, key?: T, set?: ISet<T>) => void): void;
        get(item: T): T;
        has(item: T): boolean;
        set(item: T): void;
        size(): number;
        isEmpty(): boolean;

    }

    export interface IMap<K, V> {

        clear(): void;
        delete(key: K): boolean;
        forEach(callbackfn: (value: V, key?: K, map?: IMap<K, V>) => void): void;
        get(key: K): V;
        has(key: K): boolean;
        set(key: K, value: V): void;
        size(): number;
        isEmpty(): boolean;

    }

    export interface IHashCodeProvider {

        getHashCode(): number;

    }

    // Naive (too young too simple, sometimes naive)
    interface NHashCodeProvider<T> {

        getHashCode(o: T): number;

    }

    // X
    class XHashCodeProvider<T> implements NHashCodeProvider<T> {

        public getHashCode(o: T): number {
            return (<any>o).getHashCode();
        }

    }

    // Primitives
    class PHashCodeProvider<T> implements NHashCodeProvider<T> {

        public getHashCode(o: T): number {
            return <number><any>o;
        }

    }

    class NSet<T> implements ISet<T>{

        public constructor(provider: NHashCodeProvider<T>) {
            this._p = provider;
            this._o = Object.create(null);
            this._count = 0;
        }

        public clear(): void {
            for (var key in this._o) {
                delete this._o[key];
            }
            this._count = 0;
        }

        public delete(item: T): boolean {
            var hashCode: number = this._p.getHashCode(item);
            var b = this.hasHashCode(hashCode);
            if (b) {
                delete this._o[hashCode];
                this._count--;
            }
            return b;
        }

        public forEach(callbackfn: (item: T, index?: T, set?: ISet<T>) => void): void {
            for (var key in this._o) {
                callbackfn(this._o[key], this._o[key], this);
            }
        }

        public get(item: T): T {
            return this._o[this._p.getHashCode(item)];
        }

        public has(item: T): boolean {
            return this._o[this._p.getHashCode(item)] !== undefined;
        }

        protected hasHashCode(hashCode: number): boolean {
            return this._o[hashCode] !== undefined;
        }

        public set(item: T): void {
            var hashCode: number = this._p.getHashCode(item);
            var b = this.hasHashCode(hashCode);
            if (!b) {
                this._o[hashCode] = item;
                this._count++;
            }
        }

        public size(): number {
            return this._count;
        }

        public isEmpty(): boolean {
            return this._count > 0;
        }

        protected _p: NHashCodeProvider<T>;
        protected _o: any;
        protected _count: number;

    }

    class NMap<K, V> implements IMap<K, V>{

        public constructor(provider: NHashCodeProvider<K>) {
            this._p = provider;
            this._o = Object.create(null);
            this._count = 0;
        }

        public clear(): void {
            for (var key in this._o) {
                delete this._o[key];
            }
            this._count = 0;
        }

        public delete(key: K): boolean {
            var hashCode: number = this._p.getHashCode(key);
            var b = this.hasHashCode(hashCode);
            if (b) {
                delete this._o[hashCode];
                this._count--;
            }
            return b;
        }

        public forEach(callbackfn: (value: V, index?: K, map?: IMap<K, V>) => void): void {
            for (var key in this._o) {
                callbackfn(this._o[key].value, this._o[key].key, this);
            }
        }

        public get(key: K): V {
            return this._o[this._p.getHashCode(key)].value;
        }

        public has(key: K): boolean {
            return this._o[this._p.getHashCode(key)] !== undefined;
        }

        protected hasHashCode(hashCode: number): boolean {
            return this._o[hashCode] !== undefined;
        }

        public set(key: K, value: V): void {
            var hashCode: number = this._p.getHashCode(key);
            var b = this.hasHashCode(hashCode);
            //var v: V = null;
            if (!b) {
                //v = this._o[hashCode].value;
                this._o[hashCode] = { key: key, value: value };
                this._count++;
            }
            //return v;
        }

        public size(): number {
            return this._count;
        }

        public isEmpty(): boolean {
            return this._count > 0;
        }

        protected _p: NHashCodeProvider<K>;
        protected _o: any;
        protected _count: number;

    }

    interface RBNode<K, V> {

        key: K;
        value: V;
        left: RBNode<K, V>;
        right: RBNode<K, V>;
        parent: RBNode<K, V>;
        color: boolean;

    }

    const RED: boolean = false, BLACK: boolean = true;
    var RB = {
        create: function <K, V>(key: K, value: V, parent: RBNode<K, V>, color: boolean = BLACK,
            left: RBNode<K, V> = null, right: RBNode<K, V> = null): RBNode<K, V> {
            return { key: key, value: value, parent: parent, color: color, left: left, right: right };
        }
    };

    function setColor<K, V>(n: RBNode<K, V>, color: boolean): void {
        if (n !== null) {
            n.color = color;
        }
    }

    function colorOf<K, V>(n: RBNode<K, V>): boolean {
        return n === null ? BLACK : n.color;
    }

    class NTreeBase<K, V>{

        public constructor(comparer: IComparer<K>) {
            this._comparer = comparer;
            this._root = null;
            this._size = 0;
            this._modCount = 0;
        }

        public clear(): void {
            this._root = null;
            this._modCount = 0;
            this._size = 0;
        }

        public delete(key: K): boolean {
            var node: RBNode<K, V> = this.findNodeByKey(key);
            if (node === null) {
                return false;
            } else {
                this.deleteNode(node);
                this._size--;
                this._modCount++;
                return true;
            }
        }

        public get(key: K): V {
            var node: RBNode<K, V> = this.findNodeByKey(key);
            return node === null ? null : node.value;
        }

        public has(key: K): boolean {
            return this.findNodeByKey(key) !== null;
        }

        public set(key: K, value: V): void {
            return this.addOrSetNode(key, value);
        }

        public size(): number {
            return this._size;
        }

        public isEmpty(): boolean {
            return this._size > 0;
        }

        public pollFirstEntry(): V {
            // TODO: Better workaround is caching the left-most node
            if (this._root !== null) {
                var n: RBNode<K, V> = this._root;
                while (n.left !== null) {
                    n = n.left;
                }
                var v: V = n.value;
                this.deleteNode(n);
                this._size--;
                this._modCount++;
                return v;
            } else {
                return null;
            }
        }

        public pollLastEntry(): V {
            // TODO: Better workaround is caching the right-most node
            if (this._root !== null) {
                var n: RBNode<K, V> = this._root;
                while (n.right !== null) {
                    n = n.right;
                }
                var v: V = n.value;
                this.deleteNode(n);
                this._size--;
                this._modCount++;
                return v;
            } else {
                return null;
            }
        }

        protected fixAfterInsertion(node: RBNode<K, V>): void {
            node.color = RED;
            var y: RBNode<K, V>;
            // The root of red-black tree is always black, so accessing node.parent.parent is always all right.
            while (node !== null && node !== this._root && colorOf(node.parent) === RED) {
                if (node.parent === node.parent.parent.left) {
                    y = node.parent.parent.right;
                    if (colorOf(y) === RED) {
                        setColor(node.parent, BLACK);
                        setColor(y, BLACK);
                        setColor(node.parent.parent, RED);
                        node = node.parent.parent;
                    } else {
                        if (node === node.parent.right) {
                            node = node.parent;
                            this.rotateLeft(node);
                        }
                        setColor(node.parent, BLACK);
                        setColor(node.parent.parent, RED);
                        this.rotateRight(node.parent.parent);
                    }
                } else {
                    y = node.parent.parent.left;
                    if (colorOf(y) === RED) {
                        setColor(node.parent, BLACK);
                        setColor(y, BLACK);
                        setColor(node.parent.parent, RED);
                        node = node.parent.parent;
                    } else {
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
        }

        protected successor(t: RBNode<K, V>): RBNode<K, V> {
            var p: RBNode<K, V>, ch: RBNode<K, V>;
            if (t === null) {
                return null;
            } else if (t.right !== null) {
                p = t.right;
                while (p.left !== null) {
                    p = p.left;
                }
                return p;
            } else {
                p = t.parent;
                ch = t;
                while (p !== null && ch === p.right) {
                    ch = p;
                    p = p.parent;
                }
                return p;
            }
        }

        protected rotateLeft(node: RBNode<K, V>): void {
            if (node !== null) {
                var r: RBNode<K, V> = node.right;
                node.right = r.left;
                if (r.left !== null) {
                    r.left.parent = node;
                }
                r.parent = node.parent;
                if (node.parent === null) {
                    this._root = r;
                } else if (node.parent.left === node) {
                    node.parent.left = r;
                } else {
                    node.parent.right = r;
                }
                r.left = node;
                node.parent = r;
            }
        }

        protected rotateRight(node: RBNode<K, V>): void {
            if (node !== null) {
                var l: RBNode<K, V> = node.left;
                node.left = l.right;
                if (l.right !== null) {
                    l.right.parent = node;
                }
                l.parent = node.parent;
                if (node.parent === null) {
                    this._root = l;
                } else if (node.parent.right === node) {
                    node.parent.right = l;
                } else {
                    node.parent.left = l;
                }
                l.right = node;
                node.parent = l;
            }
        }

        protected deleteNode(p: RBNode<K, V>): void {
            if (p.left === null && p.right !== null) {
                var s: RBNode<K, V> = this.successor(p);
                p.key = s.key;
                p.value = s.value;
                p = s;
            }
            var replacement: RBNode<K, V> = (p.left !== null ? p.left : p.right);
            if (replacement !== null) {
                replacement.parent = p.parent;
                if (p.parent === null) {
                    this._root = replacement;
                } else if (p === p.parent.left) {
                    p.parent.left = replacement;
                } else {
                    p.parent.right = replacement;
                }
                p.left = p.right = p.parent = null;
                if (colorOf(p) === BLACK) {
                    this.fixAfterDeletion(replacement);
                }
            } else if (p.parent === null) {
                this._root = null;
            } else {
                if (colorOf(p) === BLACK) {
                    this.fixAfterDeletion(p);
                }
                if (p.parent !== null) {
                    if (p === p.parent.left) {
                        p.parent.left = null;
                    } else if (p === p.parent.right) {
                        p.parent.right = null;
                    }
                    p.parent = null;
                }
            }
        }

        protected findNodeByKey(key: K): RBNode<K, V> {
            var cmp: number;
            if (this._root === null) {
                return null;
            }
            var n: RBNode<K, V> = this._root;
            if (this._comparer !== null) {
                while (n !== null) {
                    cmp = this._comparer.compare(n.key, key);
                    if (cmp === 0) {
                        return n;
                    } else if (cmp > 0) {
                        n = n.left;
                    } else {
                        n = n.right;
                    }
                }
                return null;
            } else {
                while (n !== null) {
                    cmp = n.key > key ? 1 : (n.key < key ? -1 : 0);
                    if (cmp === 0) {
                        return n;
                    } else if (cmp > 0) {
                        n = n.left;
                    } else {
                        n = n.right;
                    }
                }
                return null;
            }
        }

        protected fixAfterDeletion(x: RBNode<K, V>): void {
            var sib: RBNode<K, V>;
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
                    } else {
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
                } else {
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
                    } else {
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
        }

        protected buildQueryQueue(mid: RBNode<K, V>): Array<RBNode<K, V>> {
            var ql: Array<RBNode<K, V>>, qr: Array<RBNode<K, V>>;
            if (mid.left === null) {
                ql = [];
            } else {
                ql = this.buildQueryQueue(mid.left);
            }
            if (mid.right === null) {
                qr = [];
            } else {
                qr = this.buildQueryQueue(mid.right);
            }
            return ql.concat(mid, <any>qr);
        }

        protected addOrSetNode(key: K, value: V): void {
            var t: RBNode<K, V> = this._root;
            if (t === null) {
                //this._comparer.compare(key, key);
                this._root = RB.create(key, value, null);
                this._size = 1;
                this._modCount++;
                return null;
            }
            var cmp: number;
            var parent: RBNode<K, V>;
            if (this._comparer !== null) {
                do {
                    parent = t;
                    cmp = this._comparer.compare(key, t.key);
                    if (cmp < 0) {
                        t = t.left;
                    } else if (cmp > 0) {
                        t = t.right;
                    } else {
                        var v = t.value;
                        t.value = value;
                        //return v;
                        return;
                    }
                } while (t !== null);
            } else {
                if (key == null) {
                    throw new ArgumentError("Key should not be null");
                }
                do {
                    parent = t;
                    cmp = key > t.key ? 1 : (key < t.key ? -1 : 0);
                    if (cmp < 0) {
                        t = t.left;
                    } else if (cmp > 0) {
                        t = t.right;
                    } else {
                        var v = t.value;
                        t.value = value;
                        //return v;
                        return;
                    }
                } while (t !== null);
            }
            var e: RBNode<K, V> = RB.create(key, value, parent);
            if (cmp < 0) {
                parent.left = e;
            } else {
                parent.right = e;
            }
            this.fixAfterInsertion(e);
            this._size++;
            this._modCount++;
            //return null;
        }

        protected getHigherEntry(key: K): RBNode<K, V> {
            var node: RBNode<K, V> = this._root;
            var cmp: number;
            var parent: RBNode<K, V>, ch: RBNode<K, V>;
            if (this._comparer !== null) {
                while (node !== null) {
                    cmp = this._comparer.compare(key, node.key);
                    if (cmp < 0) {
                        if (node.left !== null) {
                            node = node.left;
                        } else {
                            return node;
                        }
                    } else {
                        if (node.right !== null) {
                            node = node.right;
                        } else {
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
            } else {
                while (node !== null) {
                    cmp = key > node.key ? 1 : (key < node.key ? -1 : 0);
                    if (cmp < 0) {
                        if (node.left !== null) {
                            node = node.left;
                        } else {
                            return node;
                        }
                    } else {
                        if (node.right !== null) {
                            node = node.right;
                        } else {
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
        }

        protected getLowerEntry(key: K): RBNode<K, V> {
            var node: RBNode<K, V> = this._root;
            var cmp: number;
            var parent: RBNode<K, V>, ch: RBNode<K, V>;
            if (this._comparer !== null) {
                while (node !== null) {
                    cmp = this._comparer.compare(key, node.key);
                    if (cmp > 0) {
                        if (node.right !== null) {
                            node = node.right;
                        } else {
                            return node;
                        }
                    } else {
                        if (node.left !== null) {
                            node = node.left;
                        } else {
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
            } else {
                while (node !== null) {
                    cmp = key > node.key ? 1 : (key < node.key ? -1 : 0);
                    if (cmp > 0) {
                        if (node.right !== null) {
                            node = node.right;
                        } else {
                            return node;
                        }
                    } else {
                        if (node.left !== null) {
                            node = node.left;
                        } else {
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
        }

        protected _comparer: IComparer<K>;
        protected _root: RBNode<K, V>;
        protected _size: number;
        protected _modCount: number;

    }

    class NTreeSet<T> extends NTreeBase<T, T> implements ISet<T>{

        public constructor(comparer: IComparer<T>) {
            super(comparer);
        }

        public delete(item: T): boolean {
            return super.delete(item);
        }

        public forEach(callbackfn: (item: T, index?: T, set?: ISet<T>) => void): void {
            var queue: Array<RBNode<T, T>> = this.buildQueryQueue(this._root);
            var len: number = queue.length;
            for (var i: number = 0; i < len; i++) {
                callbackfn(queue[i].value, queue[i].key, this);
            }
        }

        public set(item: T): void {
            return super.set(item, item);
        }

        public higher(item: T): T {
            var node: RBNode<T, T> = this.getHigherEntry(item);
            if (node !== null) {
                return node.value;
            } else {
                return null;
            }
        }

        public lower(item: T): T {
            var node: RBNode<T, T> = this.getLowerEntry(item);
            if (node !== null) {
                return node.value;
            } else {
                return null;
            }
        }

        protected _comparer: IComparer<T>;

    }

    class NTreeMap<K, V> extends NTreeBase<K, V> implements IMap<K, V>{

        public constructor(comparer: IComparer<K>) {
            super(comparer);
        }

        public forEach(callbackfn: (value: V, index?: K, map?: IMap<K, V>) => void): void {
            var queue: Array<RBNode<K, V>> = this.buildQueryQueue(this._root);
            var len: number = queue.length;
            for (var i: number = 0; i < len; i++) {
                callbackfn(queue[i].value, queue[i].key, this);
            }
        }

    }

    export class XSet<T> extends NSet<T> {

        public constructor() {
            super(new XHashCodeProvider<T>());
        }

    }

    export class XMap<K, V> extends NMap<K, V> {

        public constructor() {
            super(new XHashCodeProvider<K>());
        }

    }

    export class PSet<T> extends NSet<T> {

        public constructor() {
            super(new PHashCodeProvider<T>());
        }

    }

    export class PMap<K, V> extends NMap<K, V> {

        public constructor() {
            super(new PHashCodeProvider<K>());
        }

    }

    export class XTreeSet<T> extends NTreeSet<T> {

        public constructor(comparer: IComparer<T> = null) {
            super(comparer);
        }

    }

    export class XTreeMap<K, V> extends NTreeMap<K, V> {

        public constructor(comparer: IComparer<K> = null) {
            super(comparer);
        }

    }

    export class PTreeSet<T> extends NTreeSet<T> {

        public constructor(comparer: IComparer<T> = null) {
            super(comparer);
        }

    }

    export class PTreeMap<K, V> extends NTreeMap<K, V> {

        public constructor(comparer: IComparer<K> = null) {
            super(comparer);
        }

    }

    export function keySet<K, V>(m: IMap<K, V>): ISet<K> {
        var ret: ISet<K> = new XSet<K>();
        m.forEach((v, k) => {
            ret.set(k);
        });
        return ret;
    }

    export function arrayFromSet<T>(set: ISet<T>): Array<T> {
        var array: Array<T> = [];
        set.forEach((v) => {
            array.push(v);
        });
        return array;
    }

    export function arrayToSet<T>(array: Array<T>, set: ISet<T>): void {
        array.forEach((v) => {
            set.set(v);
        });
    }

}
