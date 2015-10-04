
import xcommon = require("./xcommon");

export module xross {

    "use strict";

    import ArgumentError = xcommon.xross.ArgumentError;
    import NotImplementedError = xcommon.xross.NotImplementedError;
    import InvalidOperationError = xcommon.xross.InvalidOperationError;
    import CollectionChangedError = xcommon.xross.CollectionChangedError;
    import IComparer = xcommon.xross.IComparer;
    import IHashCodeProvider = xcommon.xross.IHashCodeProvider;
    import IEquatable = xcommon.xross.IEquatable;

    /**
     * Bucket size: 50 ~ 200
     */
    const BUCKET_SIZE: number = 73;

    export interface IMap<K, V> {

        clear(): void;
        delete(key: K): boolean;
        forEach(callbackfn: (value: V, key?: K, map?: IMap<K, V>) => void): void;
        get(key: K): V;
        has(key: K): boolean;
        set(key: K, value: V): void;
        size(): number;
        isEmpty(): boolean;
        toString(): string;

    }

    export interface ISet<T> extends IMap<T, T> {

        forEach(callbackfn: (item: T, key?: T, set?: ISet<T>) => void): void;
        set(item: T): void;

    }

    interface KVPair<K, V> {

        key: K;
        value: V;

    }

    // Naive (too young too simple, sometimes naive)
    interface INaiveHashCodeProvider<T> {

        // Must return a non-negative number
        getHashCode(o: T): number;

    }

    interface INaiveEqualityComparer<T> {

        equals(a: T, b: T): boolean;

    }

    // For Objects
    class ObjectHashCodeProvider<T> implements INaiveHashCodeProvider<T> {

        public getHashCode(o: T): number {
            return (<IHashCodeProvider><any>o).getHashCode();
        }

    }

    class ObjectEqualityComparer<T> {

        public equals(a: T, b: T): boolean {
            if (a === null || a === undefined) {
                if (b === null || b === undefined) {
                    return true;
                } else {
                    return false;
                }
            } else {
                if (b === null || b === undefined) {
                    return false;
                } else {
                    return (<IEquatable<T>><any>a).equals(b);
                }
            }
        }

    }

    // For Primitives
    class PrimitiveHashCodeProvider<T> implements INaiveHashCodeProvider<T> {

        public getHashCode(o: T): number {
            return <number><any>o;
        }

    }

    class PrimitiveEqualityComparer<T> {

        public equals(a: T, b: T): boolean {
            if (a === null || a === undefined) {
                if (b === null || b === undefined) {
                    return true;
                } else {
                    return false;
                }
            } else {
                if (b === null || b === undefined) {
                    return false;
                } else {
                    return a === b;
                }
            }
        }

    }

    class MapBase<K, V> implements IMap<K, V> {

        public constructor(provider: INaiveHashCodeProvider<K>, eq: INaiveEqualityComparer<K>) {
            this._p = provider;
            this._c = eq;
            this._modCount = -1;
            this.clear();
        }

        public clear(): void {
            this._buckets = new Array<Array<KVPair<K, V>>>(BUCKET_SIZE);
            this._count = 0;
            this._modCount++;
        }

        public delete(key: K): boolean {
            var hashCode: number = this._p.getHashCode(key);
            var bucketIndex: number = this.getBucketIndexByHashCode(hashCode);
            var bucket: Array<KVPair<K, V>> = this._buckets[bucketIndex];
            var b: boolean = false;
            if (bucket !== undefined) {
                for (var i: number = 0; i < bucket.length; i++) {
                    if (this._c.equals(key, bucket[i].key)) {
                        b = true;
                        bucket.splice(i, 1);
                        break;
                    }
                }
                this._count--;
                // Now we don't delete the array (`delete this._buckets[bucketIndex]`).
                // However, tests show that whether delete it or not (`splice()` only), the performances
                // are close.
            }
            if (b) {
                this._modCount++;
            }
            return b;
        }

        public forEach(callbackfn: (value: V, index?: K, map?: IMap<K, V>) => void): void {
            var modCount: number = this._modCount;
            for (var i: number = 0; i < this._buckets.length; i++) {
                var bucket: Array<KVPair<K, V>> = this._buckets[i];
                if (bucket !== undefined && bucket.length > 0) {
                    for (var j: number = 0; j < bucket.length; j++) {
                        callbackfn(bucket[j].value, bucket[j].key, this);
                    }
                }
                if (this._modCount !== modCount) {
                    throw new CollectionChangedError();
                }
            }
        }

        public get(key: K): V {
            var hashCode: number = this._p.getHashCode(key);
            var bucketIndex: number = this.getBucketIndexByHashCode(hashCode);
            var bucket: Array<KVPair<K, V>> = this._buckets[bucketIndex];
            if (bucket !== undefined) {
                for (var i: number = 0; i < bucket.length; i++) {
                    if (this._c.equals(key, bucket[i].key)) {
                        return bucket[i].value;
                    }
                }
                // WARN: sometimes you will get NULL...
                return null;
            } else {
                // HACK: should return undefined
                return null;
            }
        }

        public has(key: K): boolean {
            var hashCode: number = this._p.getHashCode(key);
            var bucketIndex: number = this.getBucketIndexByHashCode(hashCode);
            var bucket: Array<KVPair<K, V>> = this._buckets[bucketIndex];
            if (bucket !== undefined) {
                for (var i: number = 0; i < bucket.length; i++) {
                    if (this._c.equals(key, bucket[i].key)) {
                        return true;
                    }
                }
                return false;
            } else {
                return false;
            }
        }

        public set(key: K, value: V): void {
            var hashCode: number = this._p.getHashCode(key);
            var bucketIndex = this.getBucketIndexByHashCode(hashCode);
            var bucket: Array<KVPair<K, V>> = this._buckets[bucketIndex];
            if (bucket !== undefined) {
                for (var i: number = 0; i < bucket.length; i++) {
                    if (this._c.equals(key, bucket[i].key)) {
                        return;
                    }
                }
                bucket.push({ key: key, value: value });
            } else {
                // Only created the array when needed.
                // Replacing it with a full array creation when class instantiated shows great efficiency loss.
                bucket = [{ key: key, value: value }];
                this._buckets[bucketIndex] = bucket;
            }
            this._count++;
            this._modCount++;
        }

        public size(): number {
            return this._count;
        }

        public isEmpty(): boolean {
            return this._count <= 0;
        }

        protected getBucketIndexByHashCode(hashCode: number): number {
            return (hashCode >>> 0) % BUCKET_SIZE;
        }

        protected _p: INaiveHashCodeProvider<K>;
        protected _c: INaiveEqualityComparer<K>;
        protected _buckets: Array<Array<KVPair<K, V>>>;
        protected _count: number;
        private _modCount: number;

        public toString(): string {
            var s: string = "";
            this.forEach((v) => {
                s += v.toString() + " ";
            });
            return s;
        }

    }

    class SetBase<T> extends MapBase<T, T> implements ISet<T> {

        public constructor(provider: INaiveHashCodeProvider<T>, eq: INaiveEqualityComparer<T>) {
            super(provider, eq);
        }

        public forEach(callbackfn: (item: T, index?: T, set?: ISet<T>) => void): void {
            super.forEach(callbackfn);
        }

        public set(item: T): void {
            return super.set(item, item);
        }

    }

    interface LinkedKVPair<K, V> extends KVPair<K, V> {

        order: number;

    }

    class LinkedMapBase<K, V> implements IMap<K, V> {

        public constructor(provider: INaiveHashCodeProvider<K>, eq: INaiveEqualityComparer<K>) {
            this._p = provider;
            this._c = eq;
            this._modCount = -1;
            this.clear();
        }

        public clear(): void {
            this._buckets = new Array<Array<LinkedKVPair<K, V>>>(BUCKET_SIZE);
            // Initialize with a buffer
            this._insertedItemsWithOrder = new Array<LinkedKVPair<K, V>>(this._insertBufferInitSize);
            this._insertOperationCount = 0;
            this._count = 0;
            this._modCount++;
        }

        public delete(key: K): boolean {
            var hashCode: number = this._p.getHashCode(key);
            var bucketIndex: number = this.getBucketIndexByHashCode(hashCode);
            var bucket: Array<LinkedKVPair<K, V>> = this._buckets[bucketIndex];
            var b: boolean = false;
            if (bucket !== undefined) {
                for (var i: number = 0; i < bucket.length; i++) {
                    if (this._c.equals(key, bucket[i].key)) {
                        b = true;
                        delete this._insertedItemsWithOrder[bucket[i].order];
                        bucket.splice(i, 1);
                        break;
                    }
                }
                this._count--;
            }
            if (b) {
                this._modCount++;
            }
            return b;
        }

        public forEach(fn: (value: V, key?: K, set?: IMap<K, V>) => void): void {
            var arr: Array<LinkedKVPair<K, V>> = this._insertedItemsWithOrder;
            // TODO: More deletions, more time for traversal.
            // Design a compact method to minimize the needed traversal array
            for (var i = 0; i < arr.length; i++) {
                if (arr[i] !== undefined) {
                    fn(arr[i].value, arr[i].key, this);
                }
            }
        }

        public get(key: K): V {
            var hashCode: number = this._p.getHashCode(key);
            var bucketIndex: number = this.getBucketIndexByHashCode(hashCode);
            var bucket: Array<LinkedKVPair<K, V>> = this._buckets[bucketIndex];
            if (bucket !== undefined) {
                for (var i: number = 0; i < bucket.length; i++) {
                    if (this._c.equals(key, bucket[i].key)) {
                        return bucket[i].value;
                    }
                }
                // WARN: sometimes you will get NULL...
                return null;
            } else {
                // HACK: should return undefined
                return null;
            }
        }

        public has(key: K): boolean {
            var hashCode: number = this._p.getHashCode(key);
            var bucketIndex: number = this.getBucketIndexByHashCode(hashCode);
            var bucket: Array<LinkedKVPair<K, V>> = this._buckets[bucketIndex];
            if (bucket !== undefined) {
                for (var i: number = 0; i < bucket.length; i++) {
                    if (this._c.equals(key, bucket[i].key)) {
                        return true;
                    }
                }
                return false;
            } else {
                return false;
            }
        }

        public set(key: K, value: V): void {
            var hashCode: number = this._p.getHashCode(key);
            var bucketIndex = this.getBucketIndexByHashCode(hashCode);
            var bucket: Array<LinkedKVPair<K, V>> = this._buckets[bucketIndex];
            var kv: LinkedKVPair<K, V>;
            if (bucket !== undefined) {
                for (var i: number = 0; i < bucket.length; i++) {
                    if (this._c.equals(key, bucket[i].key)) {
                        return;
                    }
                }
                kv = { key: key, value: value, order: this._insertOperationCount };
                this._insertedItemsWithOrder[kv.order] = kv;
                bucket.push(kv);
            } else {
                kv = { key: key, value: value, order: this._insertOperationCount };
                this._insertedItemsWithOrder[kv.order] = kv;
                bucket = [kv];
                this._buckets[bucketIndex] = bucket;
            }
            this._insertOperationCount++;
            if (this._insertOperationCount >= this._insertedItemsWithOrder.length) {
                this._insertedItemsWithOrder = this._insertedItemsWithOrder.concat(new Array<LinkedKVPair<K, V>>(this._insertBufferInitSize));
            }
            this._count++;
            this._modCount++;
        }

        public size(): number {
            return this._count;
        }

        public isEmpty(): boolean {
            return this._count <= 0;
        }

        protected getBucketIndexByHashCode(hashCode: number): number {
            return (hashCode >>> 0) % BUCKET_SIZE;
        }

        protected _p: INaiveHashCodeProvider<K>;
        protected _c: INaiveEqualityComparer<K>;
        protected _buckets: Array<Array<LinkedKVPair<K, V>>>;
        protected _insertedItemsWithOrder: Array<LinkedKVPair<K, V>>;
        protected _insertOperationCount: number;
        protected _count: number;
        private _modCount: number;
        private _insertBufferInitSize = 100;

    }

    class LinkedSetBase<T> extends LinkedMapBase<T, T> implements ISet<T> {

        public constructor(provider: INaiveHashCodeProvider<T>, eq: INaiveEqualityComparer<T>) {
            super(provider, eq);
        }

        public forEach(fn: (value: T, key?: T, set?: ISet<T>) => void): void {
            super.forEach(fn);
        }

        public set(item: T): void {
            return super.set(item, item);
        }

    }

    interface RBNode<K, V> extends KVPair<K, V> {

        left: RBNode<K, V>;
        right: RBNode<K, V>;
        parent: RBNode<K, V>;
        color: boolean;

    }

    const RED: boolean = false, BLACK: boolean = true;
    const RB = {
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

    // TreeSet and TreeMap does not allow item collision. Replacing is the only operation when
    // a collision appears.
    class TreeCollectionBase<K, V> {

        public constructor(comparer: IComparer<K>) {
            this._comparer = comparer;
            this._modCount = -1;
            this.clear();
        }

        public clear(): void {
            this._root = null;
            this._size = 0;
            this._modCount++;
        }

        public delete(key: K): boolean {
            var node: RBNode<K, V> = this.findNodeByKey(key);
            if (node === null) {
                return false;
            } else {
                this.deleteNode(node);
                return true;
            }
        }

        public forEach(callbackfn: (value: V, index?: K, map?: IMap<K, V>) => void): void {
            var queue: Array<RBNode<K, V>> = TreeCollectionBase.buildQueryQueue(this._root);
            var len: number = queue.length;
            var modCount: number = this._modCount;
            for (var i: number = 0; i < len; i++) {
                callbackfn(queue[i].value, queue[i].key, this);
                if (this._modCount !== modCount) {
                    throw new CollectionChangedError();
                }
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
            return this._size <= 0;
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
                return v;
            } else {
                return null;
            }
        }

        protected static successor<K, V>(t: RBNode<K, V>): RBNode<K, V> {
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

        protected rotateLeft(p: RBNode<K, V>): void {
            if (p !== null) {
                var r: RBNode<K, V> = p.right;
                p.right = r.left;
                if (r.left !== null) {
                    r.left.parent = p;
                }
                r.parent = p.parent;
                if (p.parent === null) {
                    this._root = r;
                } else if (p.parent.left === p) {
                    p.parent.left = r;
                } else {
                    p.parent.right = r;
                }
                r.left = p;
                p.parent = r;
            }
        }

        protected rotateRight(p: RBNode<K, V>): void {
            if (p !== null) {
                var l: RBNode<K, V> = p.left;
                p.left = l.right;
                if (l.right !== null) {
                    l.right.parent = p;
                }
                l.parent = p.parent;
                if (p.parent === null) {
                    this._root = l;
                } else if (p.parent.right === p) {
                    p.parent.right = l;
                } else {
                    p.parent.left = l;
                }
                l.right = p;
                p.parent = l;
            }
        }

        protected deleteNode(p: RBNode<K, V>): void {
            if (p === null) {
                return;
            }
            this._size--;
            this._modCount++;
            if (p.left !== null && p.right !== null) {
                var s: RBNode<K, V> = TreeCollectionBase.successor(p);
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
            var comparer: IComparer<K> = this._comparer;
            if (comparer !== null) {
                while (n !== null) {
                    cmp = comparer.compare(key, n.key);
                    if (cmp === 0) {
                        return n;
                    } else if (cmp < 0) {
                        n = n.left;
                    } else {
                        n = n.right;
                    }
                }
                return null;
            } else {
                while (n !== null) {
                    cmp = key > n.key ? 1 : (key < n.key ? -1 : 0);
                    if (cmp === 0) {
                        return n;
                    } else if (cmp < 0) {
                        n = n.left;
                    } else {
                        n = n.right;
                    }
                }
                return null;
            }
        }

        protected fixAfterInsertion(x: RBNode<K, V>): void {
            x.color = RED;
            var y: RBNode<K, V>;
            // The root of red-black tree is always black, so accessing node.parent.parent is always all right.
            while (x !== null && x !== this._root && colorOf(x.parent) === RED) {
                if (x.parent === x.parent.parent.left) {
                    y = x.parent.parent.right;
                    if (colorOf(y) === RED) {
                        setColor(x.parent, BLACK);
                        setColor(y, BLACK);
                        setColor(x.parent.parent, RED);
                        x = x.parent.parent;
                    } else {
                        if (x === x.parent.right) {
                            x = x.parent;
                            this.rotateLeft(x);
                        }
                        setColor(x.parent, BLACK);
                        setColor(x.parent.parent, RED);
                        this.rotateRight(x.parent.parent);
                    }
                } else {
                    y = x.parent.parent.left;
                    if (colorOf(y) === RED) {
                        setColor(x.parent, BLACK);
                        setColor(y, BLACK);
                        setColor(x.parent.parent, RED);
                        x = x.parent.parent;
                    } else {
                        if (x === x.parent.left) {
                            x = x.parent;
                            this.rotateRight(x);
                        }
                        setColor(x.parent, BLACK);
                        setColor(x.parent.parent, RED);
                        this.rotateLeft(x.parent.parent);
                    }
                }
            }
            this._root.color = BLACK;
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

        protected static buildQueryQueue<K, V>(mid: RBNode<K, V>): Array<RBNode<K, V>> {
            var ql: Array<RBNode<K, V>>, qr: Array<RBNode<K, V>>;
            if (mid.left === null) {
                ql = [];
            } else {
                ql = TreeCollectionBase.buildQueryQueue(mid.left);
            }
            if (mid.right === null) {
                qr = [];
            } else {
                qr = TreeCollectionBase.buildQueryQueue(mid.right);
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
                //return null;
                return;
            }
            var cmp: number;
            var parent: RBNode<K, V>;
            var comparer: IComparer<K> = this._comparer;
            if (comparer !== null) {
                do {
                    parent = t;
                    cmp = comparer.compare(key, t.key);
                    if (cmp < 0) {
                        t = t.left;
                    } else if (cmp > 0) {
                        t = t.right;
                    } else {
                        //var v: V = t.value;
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

        protected getHigherNode(key: K): RBNode<K, V> {
            var p: RBNode<K, V> = this._root;
            var cmp: number;
            var parent: RBNode<K, V>, ch: RBNode<K, V>;
            var comparer: IComparer<K> = this._comparer;
            if (comparer !== null) {
                while (p !== null) {
                    cmp = comparer.compare(key, p.key);
                    if (cmp < 0) {
                        if (p.left !== null) {
                            p = p.left;
                        } else {
                            return p;
                        }
                    } else {
                        if (p.right !== null) {
                            p = p.right;
                        } else {
                            parent = p.parent;
                            ch = p;
                            while (parent !== null && ch === parent.right) {
                                ch = parent;
                                parent = parent.parent;
                            }
                            return parent;
                        }
                    }
                }
                return null;
            } else {
                while (p !== null) {
                    cmp = key > p.key ? 1 : (key < p.key ? -1 : 0);
                    if (cmp < 0) {
                        if (p.left !== null) {
                            p = p.left;
                        } else {
                            return p;
                        }
                    } else {
                        if (p.right !== null) {
                            p = p.right;
                        } else {
                            parent = p.parent;
                            ch = p;
                            while (parent !== null && ch === parent.right) {
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

        protected getLowerNode(key: K): RBNode<K, V> {
            var p: RBNode<K, V> = this._root;
            var cmp: number;
            var parent: RBNode<K, V>, ch: RBNode<K, V>;
            var comparer: IComparer<K> = this._comparer;
            if (comparer !== null) {
                while (p !== null) {
                    cmp = comparer.compare(key, p.key);
                    if (cmp > 0) {
                        if (p.right !== null) {
                            p = p.right;
                        } else {
                            return p;
                        }
                    } else {
                        if (p.left !== null) {
                            p = p.left;
                        } else {
                            parent = p.parent;
                            ch = p;
                            while (parent !== null && ch === parent.left) {
                                ch = parent;
                                parent = parent.parent;
                            }
                            return parent;
                        }
                    }
                }
                return null;
            } else {
                while (p !== null) {
                    cmp = key > p.key ? 1 : (key < p.key ? -1 : 0);
                    if (cmp > 0) {
                        if (p.right !== null) {
                            p = p.right;
                        } else {
                            return p;
                        }
                    } else {
                        if (p.left !== null) {
                            p = p.left;
                        } else {
                            parent = p.parent;
                            ch = p;
                            while (parent !== null && ch === parent.left) {
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

        public toString(): string {
            var s: string = "";
            this.forEach((v) => {
                s += v.toString() + " ";
            });
            return s;
        }

    }

    class TreeMapBase<K, V> extends TreeCollectionBase<K, V> implements IMap<K, V> {

        public constructor(comparer: IComparer<K>) {
            super(comparer);
        }

    }

    class TreeSetBase<T> extends TreeCollectionBase<T, T> implements ISet<T> {

        public constructor(comparer: IComparer<T>) {
            super(comparer);
        }

        public forEach(callbackfn: (item: T, index?: T, set?: ISet<T>) => void): void {
            super.forEach(callbackfn);
        }

        public set(item: T): void {
            return super.set(item, item);
        }

        public higher(item: T): T {
            var node: RBNode<T, T> = this.getHigherNode(item);
            if (node !== null) {
                return node.value;
            } else {
                return null;
            }
        }

        public lower(item: T): T {
            var node: RBNode<T, T> = this.getLowerNode(item);
            if (node !== null) {
                return node.value;
            } else {
                return null;
            }
        }

    }

    export class ObjectSet<T> extends SetBase<T> {

        public constructor() {
            super(new ObjectHashCodeProvider<T>(), new ObjectEqualityComparer<T>());
        }

    }

    export class ObjectMap<K, V> extends MapBase<K, V> {

        public constructor() {
            super(new ObjectHashCodeProvider<K>(), new ObjectEqualityComparer<K>());
        }

    }

    export class PrimitiveSet<T> extends SetBase<T> {

        public constructor() {
            super(new PrimitiveHashCodeProvider<T>(), new PrimitiveEqualityComparer<T>());
        }

    }

    export class PrimitiveMap<K, V> extends MapBase<K, V> {

        public constructor() {
            super(new PrimitiveHashCodeProvider<K>(), new PrimitiveEqualityComparer<K>());
        }

    }

    export class LinkedObjectSet<T> extends LinkedSetBase<T> {

        public constructor() {
            super(new ObjectHashCodeProvider(), new ObjectEqualityComparer<T>());
        }

    }

    export class LinkedPrimitiveSet<T> extends LinkedSetBase<T> {

        public constructor() {
            super(new PrimitiveHashCodeProvider(), new PrimitiveEqualityComparer<T>());
        }

    }

    export class ObjectTreeSet<T> extends TreeSetBase<T> {

        public constructor(comparer: IComparer<T> = null) {
            super(comparer);
        }

    }

    export class ObjectTreeMap<K, V> extends TreeMapBase<K, V> {

        public constructor(comparer: IComparer<K> = null) {
            super(comparer);
        }

    }

    export class PrimitiveTreeSet<T> extends TreeSetBase<T> {

        public constructor(comparer: IComparer<T> = null) {
            super(comparer);
        }

    }

    export class PrimitiveTreeMap<K, V> extends TreeMapBase<K, V> {

        public constructor(comparer: IComparer<K> = null) {
            super(comparer);
        }

    }

    export function keySet<K, V>(m: IMap<K, V>): ISet<K> {
        var ret: ISet<K> = new ObjectSet<K>();
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
        for (var i: number = 0; i < array.length; i++) {
            set.set(array[i]);
        }
    }

}
