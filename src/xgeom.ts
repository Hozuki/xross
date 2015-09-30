
import xcommon = require("./xcommon");
import xcollection = require("./xcollection");

export module xross {

    "use strict";

    import IEquatable = xcommon.xross.IEquatable;
    import IComparable = xcommon.xross.IComparable;
    import IComparer = xcommon.xross.IComparer;
    import ArgumentError = xcommon.xross.ArgumentError;
    import NotImplementedError = xcommon.xross.NotImplementedError;
    import IHashCodeProvider = xcollection.xross.IHashCodeProvider;
    import ISet = xcollection.xross.ISet;
    import IMap = xcollection.xross.IMap;
    import ObjectSet = xcollection.xross.ObjectSet;
    import ObjectMap = xcollection.xross.ObjectMap;
    import ObjectTreeMap = xcollection.xross.ObjectTreeMap;
    import ObjectTreeSet = xcollection.xross.ObjectTreeSet;
    import PrimitiveTreeSet = xcollection.xross.PrimitiveTreeSet;
    import LinkedObjectSet = xcollection.xross.LinkedObjectSet;
    import arrayFromSet = xcollection.xross.arrayFromSet;
    import arrayToSet = xcollection.xross.arrayToSet;
    import keySet = xcollection.xross.keySet;

    function bkdrHash(s: string): number {
        var r: number = 0;
        for (var i: number = 0; i < s.length; i++) {
            r = (r * 131 + s.charCodeAt(i)) & 0xffffffff;
        }
        return r;
    }

    export class Point2D implements IEquatable<Point2D>, IHashCodeProvider {

        public static ORIGIN: Point2D = new Point2D(0, 0);

        public constructor(x: number = 0, y: number = 0) {
            this.x = x;
            this.y = y;
            this._hashCode = bkdrHash(this.x.toString() + " " + this.y.toString());
        }

        public x: number;
        public y: number;

        public equals(p: Point2D): boolean {
            if (this === p) {
                return true;
            }
            if (p == null) {
                return false;
            }
            return this.x === p.x && this.y === p.y;
        }

        public isRightOf(o: Line2D|Point2D): boolean {
            if (o instanceof Point2D) {
                var point = <Point2D>o;
                return this.x > point.x;
            } else if (o instanceof Line2D) {
                var line = <Line2D>o;
                if (line.contains(this)) {
                    return false;
                }
                if (line.isHorizontal()) {
                    return this.y < line.yIntercept();
                }
                if (line.isVertical()) {
                    return this.x > line.xIntercept();
                }
                var linePoint: Point2D = line.intersection(Line2D.verticalLine(0));
                var temp: Line2D = new Line2D(this, linePoint);
                if (this.y < linePoint.y) {
                    if (line.slope < 0) {
                        return temp.slope < 0 && temp.slope > line.slope;
                    } else {
                        return temp.slope < 0 || temp.slope > line.slope;
                    }
                } else if (this.y > linePoint.y) {
                    if (line.slope < 0) {
                        return temp.slope > 0 || temp.slope < line.slope;
                    } else {
                        return temp.slope > 0 && temp.slope < line.slope;
                    }
                } else {
                    return this.isRightOf(linePoint);
                }
            } else {
                throw new ArgumentError("What is the type?")
            }
        }

        public translate(dx: number, dy: number): Point2D {
            return new Point2D(this.x + dx, this.y + dy);
        }

        public getHashCode(): number {
            // We do not use a rational type as the original does.
            // So we make use of the feature that a double can also
            // be used as a key. However the hash function must avoid
            // most of the collision. Since we cannot split the
            // doubles into numerators and denumerators, we cannot
            // use the bitwise exclusive or (XOR) to manipulate them,
            // since the integers are 32-bit and roughly do a bitwise
            // or (OR) will truncate the tails and lead to a bunch of
            // data loss in order to compute a hash. After several
            // tests I chose the following function (simple adding)
            // as the hash function. Quite simple but works well in
            // most conditions.
            //return this.x * 2147483647 + this.y;
            return this._hashCode;
        }

        public toString(): string {
            return "(" + this.x + "," + this.y + ")";
        }

        private _hashCode: number;

    }

    export class Line2D implements IHashCodeProvider {

        public constructor(p1OrSlope: Point2D|number, p2: Point2D) {
            if (<any>p1OrSlope instanceof Point2D) {
                if ((<Point2D>p1OrSlope).equals(p2)) {
                    throw new ArgumentError("Cannot create a line made of 2 same points.")
                }
                this.slope = Line2D.calculateSlope(<Point2D>p1OrSlope, p2);
                this.constant = this.calculateConstant(<Point2D>p1OrSlope);
            } else {
                this.slope = !isFinite(<number>p1OrSlope) ? +Infinity : <number>p1OrSlope;
                this.constant = this.calculateConstant(p2);
            }
            this._hashCode = bkdrHash(this.slope.toString() + " " + this.constant.toString());
        }

        public slope: number;
        public constant: number;

        public intersection(that: Line2D): Point2D {
            if (this.slope === that.slope) {
                return null;
            }
            var xInt: number = this.xIntercept(that);
            if (this.isVertical()) {
                return new Point2D(xInt, that.yIntercept(xInt));
            } else {
                return new Point2D(xInt, this.yIntercept(xInt));
            }
        }

        public contains(p: Point2D): boolean {
            if (this.isVertical()) {
                return this.constant === p.x;
            } else {
                return (this.slope * p.x + this.constant) === p.y;
            }
        }

        public isVertical(): boolean {
            return !isFinite(this.slope);
        }

        public isHorizontal(): boolean {
            return this.slope === 0;
        }

        private calculateConstant(p: Point2D): number {
            if (this.isVertical()) {
                return p.x;
            } else {
                return -(this.slope * p.x) + p.y;
            }
        }

        public xIntercept(that?: Line2D): number {
            if (that === undefined) {
                return this.isHorizontal() ? null : (this.isVertical() ? this.constant : -this.constant / this.slope);
            } else {
                if (this.isVertical()) {
                    return this.constant;
                } else if (that.isVertical()) {
                    return that.constant;
                } else {
                    return (that.constant - this.constant) / (this.slope - that.slope);
                }
            }
        }

        public yIntercept(xInt?: number): number {
            if (xInt === undefined) {
                return this.isVertical() ? null : this.constant;
            } else {
                return this.slope * xInt + this.constant;
            }
        }

        public getHashCode(): number {
            // Infinty hash code: 2146435072 (from Java, {Double.POSITIVE_INFINITY}.hashCode())
            //var xs: number;
            //xs = isFinite(this.slope) ? this.slope : 2147483648;
            //return xs * 2147483647 + this.constant;
            return this._hashCode;
        }

        private static calculateSlope(p1: Point2D, p2: Point2D): number {
            if (p1.x === p2.x) {
                return +Infinity;
            } else {
                return (p2.y - p1.y) / (p2.x - p1.x);
            }
        }

        public static verticalLine(x: number): Line2D {
            var p: Point2D = new Point2D(x, 0);
            return new Line2D(p, p.translate(0, 1));
        }

        public toString(): string {
            var s: string = "f(x) -> ";
            if (this.isVertical()) {
                s += " x = " + this.constant;
            } else if (this.isHorizontal()) {
                s += this.constant;
            } else {
                if (this.slope === 1) {
                    s += "x";
                } else if (this.slope === -1) {
                    s += "-x"
                } else {
                    s += this.slope + "*x";
                }
                if (this.constant !== 0) {
                    if (this.constant > 0) {
                        s += " + " + this.constant;
                    } else {
                        s += " - " + (-this.constant);
                    }
                }
            }
            return s;
        }

        private _hashCode: number;

    }

    class Extremal {

        private static LEFT: number = 0;
        private static RIGHT: number = 1;
        private static UPPER: number = 2;
        private static LOWER: number = 3;

        public static UPPER_LEFT: Extremal = new Extremal(Extremal.UPPER, Extremal.LEFT);
        public static UPPER_RIGHT: Extremal = new Extremal(Extremal.UPPER, Extremal.RIGHT);
        public static LOWER_LEFT: Extremal = new Extremal(Extremal.LOWER, Extremal.LEFT);
        public static LOWER_RIGHT: Extremal = new Extremal(Extremal.LOWER, Extremal.RIGHT);
        public static LEFT_UPPER: Extremal = new Extremal(Extremal.LEFT, Extremal.UPPER);
        public static LEFT_LOWER: Extremal = new Extremal(Extremal.LEFT, Extremal.LOWER);
        public static RIGHT_UPPER: Extremal = new Extremal(Extremal.RIGHT, Extremal.UPPER);
        public static RIGHT_LOWER: Extremal = new Extremal(Extremal.RIGHT, Extremal.LOWER);

        public constructor(primary: number, secondary: number) {
            this._primary = primary;
            this._secondary = secondary;
        }

        public moreExtremeThan(p1: Point2D, p2: Point2D) {
            if ((this._primary === Extremal.UPPER && p1.y > p2.y) ||
                (this._primary === Extremal.LOWER && p1.y < p2.y) ||
                (this._primary === Extremal.LEFT && p1.x < p2.x) ||
                (this._primary === Extremal.RIGHT && p1.x > p2.x)) {
                return true;
            } else if (((this._primary === Extremal.UPPER || this._primary === Extremal.LOWER) && p1.y === p2.y) ||
                ((this._primary === Extremal.LEFT || this._primary === Extremal.RIGHT) && p1.x === p2.x)) {
                if ((this._secondary === Extremal.UPPER && p1.y > p2.y) ||
                    (this._secondary === Extremal.LOWER && p1.y < p2.y) ||
                    (this._secondary === Extremal.LEFT && p1.x < p2.x) ||
                    (this._secondary === Extremal.RIGHT && p1.x > p2.x)) {
                    return true;
                }
            }
            return false;
        }

        private _primary: number;
        private _secondary: number;

    }

    export class LineSegment2D implements IEquatable<LineSegment2D>, IHashCodeProvider {

        public constructor(pa: Point2D, pb: Point2D) {
            if (pa.equals(pb)) {
                throw new ArgumentError("pa and pb must not be the same");
            }
            this.p1 = Extremal.LEFT_LOWER.moreExtremeThan(pa, pb) ? pa : pb;
            this.p2 = (this.p1 === pa ? pb : pa);
            this.maxX = this.p1.x > this.p2.x ? this.p1.x : this.p2.x;
            this.maxY = this.p1.y > this.p2.y ? this.p1.y : this.p2.y;
            this.minX = this.p1.x < this.p2.x ? this.p1.x : this.p2.x;
            this.minY = this.p1.y < this.p2.y ? this.p1.y : this.p2.y;
            this.line = new Line2D(this.p1, this.p2);
        }

        public equals(o: LineSegment2D): boolean {
            if (this === o) {
                return true;
            }
            if (o == null) {
                return false;
            }
            return this.p1.equals(o.p1) && this.p2.equals(o.p2);
        }

        public intersection(that: LineSegment2D|Line2D): Point2D {
            var p: Point2D;
            if (that instanceof LineSegment2D) {
                if (this.p1.equals(that.p2)) {
                    return this.p1;
                } else if (this.p2.equals(that.p1)) {
                    return this.p2;
                } else if (this.p1.equals(that.p1)) {
                    return this.line.slope === that.line.slope ? null : this.p1;
                } else if (this.p2.equals(that.p2)) {
                    return this.line.slope === that.line.slope ? null : this.p2;
                } else {
                    p = this.line.intersection(that.line);
                    if (p === null || !this.contains(p) || !that.contains(p)) {
                        return null;
                    } else {
                        return p;
                    }
                }
            } else if (that instanceof Line2D) {
                p = this.line.intersection(that);
                if (p === null || !this.contains(p)) {
                    return null;
                } else {
                    return p;
                }
            } else {
                throw new ArgumentError("What is the type?");
            }
        }

        public intersects(that: LineSegment2D|Line2D): boolean {
            return this.intersection(that) !== null;
        }

        public contains(p: Point2D): boolean {
            return (this.p1.equals(p) || this.p2.equals(p)) ||
                (this.line.contains(p) &&
                    (p.x >= this.minX && p.x <= this.maxX && p.y >= this.minY && p.y <= this.maxY));
        }

        public hasEnding(p: Point2D): boolean {
            return this.p1.equals(p) || this.p2.equals(p);
        }

        public getHashCode(): number {
            return (this.p1.getHashCode() * 13) ^ (this.p2.getHashCode() * 37);
        }

        public p1: Point2D;
        public p2: Point2D;
        public line: Line2D;
        public maxX: number;
        public minX: number;
        public maxY: number;
        public minY: number;

        public toString(): string {
            return this.p1.toString() + "~" + this.p2.toString();
        }

    }

    export enum FutureEventType {

        START = 0,
        END = 1,
        INTERSECTION = 2

    }

    export class FutureEvent implements IComparable<FutureEvent>, IHashCodeProvider {

        public constructor(t: FutureEventType, p: Point2D, s: LineSegment2D, sl: SweepLine) {
            this.type = t;
            this.point = p;
            this.segment = s;
            this.sweepLine = sl;
        }

        public compareTo(that: FutureEvent): number {
            if (this === that || this.equals(that)) {
                return 0;
            }
            var ipThis: Point2D = this.sweepLine.intersection(this);
            var ipThat: Point2D = this.sweepLine.intersection(that);
            var deltaY: number = ipThis.y - ipThat.y;
            if (deltaY !== 0) {
                return deltaY < 0 ? -1 : 1;
            } else {
                var thisSlope: number = this.segment.line.slope;
                var thatSlope: number = that.segment.line.slope;
                if (thisSlope !== thatSlope) {
                    if (this.sweepLine.isBefore()) {
                        return thisSlope > thatSlope ? -1 : 1;
                    } else {
                        return thisSlope > thatSlope ? 1 : -1;
                    }
                }
                var deltaXP1: number = this.segment.p1.x - that.segment.p1.x;
                if (deltaXP1 !== 0) {
                    return deltaXP1 < 0 ? -1 : 1;
                }
                var deltaXP2: number = this.segment.p2.x - that.segment.p2.x;
                return deltaXP2 < 0 ? -1 : 1;
            }
        }

        public equals(o: FutureEvent): boolean {
            if (this === o) {
                return true;
            }
            if (o == null) {
                return false;
            }
            if ((this.type === FutureEventType.INTERSECTION && o.type !== FutureEventType.INTERSECTION) ||
                (this.type !== FutureEventType.INTERSECTION && o.type === FutureEventType.INTERSECTION)) {
                return false;
            } else if (this.type === FutureEventType.INTERSECTION && o.type === FutureEventType.INTERSECTION) {
                return this.point.equals(o.point);
            } else {
                return this.segment.equals(o.segment);
            }
        }

        public getHashCode(): number {
            return this.type === FutureEventType.INTERSECTION ? this.point.getHashCode() : this.segment.getHashCode();
        }

        public type: FutureEventType;
        public point: Point2D;
        public segment: LineSegment2D;
        protected sweepLine: SweepLine;

        public toString(): string {
            return "{" + this.type + ", " + this.point.toString() + ", " + this.segment.toString() + "}";
        }

    }

    export class EventQueue {

        public constructor(segments: ISet<LineSegment2D>, line: SweepLine) {
            if (segments.size() <= 0) {
                throw new ArgumentError("Segments cannot be empty.");
            }
            this._events = new ObjectTreeMap<Point2D, Array<FutureEvent>>({
                compare: function(a: Point2D, b: Point2D): number {
                    var dx: number = a.x > b.x ? 1 : (a.x < b.x ? -1 : 0);
                    return dx !== 0 ? dx : (a.y > b.y ? 1 : (a.y < b.y ? -1 : 0));
                }
            });
            this.init(segments, line);
        }

        public isEmpty(): boolean {
            return this._events.isEmpty();
        }

        public poll(): ISet<FutureEvent> {
            if (this.isEmpty()) {
                throw new Error("Oops, I'm empty.");
            }
            // 这里应该使用有序的 Set<>（迭代按照输入顺序）
            // http://www.cnblogs.com/Terry-greener/archive/2011/12/02/2271707.html
            // 原语句：return new LinkedHashSet<Event>(entry.getValue());
            var set: ISet<FutureEvent> = new LinkedObjectSet<FutureEvent>();
            arrayToSet(this._events.pollFirstEntry(), set);
            return set;
        }

        public offer(p: Point2D, e: FutureEvent) {
            var existing: Array<FutureEvent> = this._events.get(p);
            this._events.delete(p);
            if (existing === null || existing === undefined) {
                existing = new Array<FutureEvent>();
            }
            if (e.type === FutureEventType.END) {
                existing.splice(0, 0, e);
            } else {
                existing.push(e);
            }
            this._events.set(p, existing);
        }

        private init(segments: ISet<LineSegment2D>, line: SweepLine): void {
            var minY: number = +Infinity, maxY: number = -Infinity;
            var minDeltaX: number = +Infinity;
            var xs: PrimitiveTreeSet<number> = new PrimitiveTreeSet<number>();
            segments.forEach((s) => {
                xs.set(s.p1.x);
                xs.set(s.p2.x);
                if (s.minY < minY) {
                    minY = s.minY;
                }
                if (s.maxY > maxY) {
                    maxY = s.maxY;
                }
                this.offer(s.p1, new FutureEvent(FutureEventType.START, s.p1, s, line));
                this.offer(s.p2, new FutureEvent(FutureEventType.END, s.p2, s, line));
            });
            var xsArray: Array<number> = arrayFromSet(xs);
            for (var i = 1; i < xsArray.length; i++) {
                var tempDeltaX: number = xsArray[i] - xsArray[i - 1];
                if (tempDeltaX < minDeltaX) {
                    minDeltaX = tempDeltaX;
                }
            }
            var deltaY: number = maxY - minY;
            // TODO: WTF?
            var slope: number = deltaY / minDeltaX * (-1000);
            line.setLine(new Line2D(slope, Point2D.ORIGIN));
            line.setQueue(this);
        }

        private _events: ObjectTreeMap<Point2D, Array<FutureEvent>>;

    }

    export class SweepLine {

        public constructor(ignoreEndings: boolean = false) {
            this._events = new ObjectTreeSet<FutureEvent>({
                compare: function(a: FutureEvent, b: FutureEvent): number {
                    return a.compareTo(b);
                }
            });
            this._intersections = new ObjectMap<Point2D, ISet<FutureEvent>>();
            this._sweepLine = null;
            this._currentEventPoint = null;
            this._before = true;
            this._ignoreSegmentEndings = ignoreEndings;
        }

        public handle(aev: ISet<FutureEvent>|FutureEvent): void {
            if (aev instanceof FutureEvent) {
                return this.handleSingleEvent(<FutureEvent>aev);
            } else {
                var events = <ISet<FutureEvent>>aev;
                if (events.size() === 0) {
                    return;
                }
                var array: Array<FutureEvent> = arrayFromSet(events);
                this.sweepTo(array[0]);
                if (!this._ignoreSegmentEndings && events.size() > 1) {
                    for (var i: number = 0; i < array.length - 1; i++) {
                        for (var j: number = i + 1; j < array.length; j++) {
                            this.checkIntersection(array[i], array[j]);
                        }
                    }
                }
                events.forEach((e) => {
                    this.handleSingleEvent(e);
                });
            }
        }

        private handleSingleEvent(event: FutureEvent): void {
            switch (event.type) {
                case FutureEventType.START:
                    this._before = false;
                    this.insert(event);
                    this.checkIntersection(event, this.above(event));
                    this.checkIntersection(event, this.below(event));
                    break;
                case FutureEventType.END:
                    this._before = true;
                    this.remove(event);
                    this.checkIntersection(this.above(event), this.below(event));
                    break;
                case FutureEventType.INTERSECTION:
                    this._before = true;
                    var set: ISet<FutureEvent> = this._intersections.get(event.point);
                    var toInsert: Array<FutureEvent> = [];
                    set.forEach((e) => {
                        if (this.remove(e)) {
                            toInsert.push(e);
                        }
                    });
                    this._before = false;
                    for (var i = toInsert.length; i > 0; i--) {
                        var ev: FutureEvent = toInsert.pop();
                        this.insert(ev);
                        this.checkIntersection(ev, this.above(ev));
                        this.checkIntersection(ev, this.below(ev));
                    }
                    break;
            }
        }

        public getIntersections(): IMap<Point2D, ISet<LineSegment2D>> {
            var segments: IMap<Point2D, ISet<LineSegment2D>> = new ObjectMap<Point2D, ISet<LineSegment2D>>();
            this._intersections.forEach((v, k) => {
                var set: ISet<LineSegment2D> = new ObjectSet<LineSegment2D>();
                v.forEach((e) => {
                    set.set(e.segment);
                });
                segments.set(k, set);
            });
            return segments;
        }

        public intersection(e: FutureEvent): Point2D {
            if (e.type === FutureEventType.INTERSECTION) {
                return e.point;
            } else {
                return e.segment.intersection(this._sweepLine);
            }
        }

        public isBefore(): boolean {
            return this._before;
        }

        public setLine(line: Line2D): void {
            this._sweepLine = line;
        }

        public setQueue(q: EventQueue): void {
            this._queue = q;
        }

        private checkIntersection(a: FutureEvent, b: FutureEvent): void {
            if (a === null || b === null || a.type === FutureEventType.INTERSECTION || b.type === FutureEventType.INTERSECTION) {
                return;
            }
            var p: Point2D = a.segment.intersection(b.segment);
            if (p === null) {
                return;
            }
            if (this._ignoreSegmentEndings && a.segment.hasEnding(p) && b.segment.hasEnding(p)) {
                return;
            }
            var existing: ISet<FutureEvent> = this._intersections.get(p);
            this._intersections.delete(p);
            if (existing === null || existing === undefined) {
                existing = new ObjectSet<FutureEvent>();
            }
            existing.set(a);
            existing.set(b);
            this._intersections.set(p, existing);
            if (p.isRightOf(this._sweepLine) || (this._sweepLine.contains(p) && p.y > this._currentEventPoint.y)) {
                var intersection: FutureEvent = new FutureEvent(FutureEventType.INTERSECTION, p, null, this);
                this._queue.offer(p, intersection);
            }
        }

        private insert(e: FutureEvent): void {
            return this._events.set(e);
        }

        private remove(e: FutureEvent): boolean {
            return this._events.delete(e);
        }

        private above(e: FutureEvent): FutureEvent {
            return this._events.higher(e);
        }

        private below(e: FutureEvent): FutureEvent {
            return this._events.lower(e);
        }

        private sweepTo(e: FutureEvent): void {
            this._currentEventPoint = e.point;
            this._sweepLine = new Line2D(this._sweepLine.slope, this._currentEventPoint);
        }

        private _events: ObjectTreeSet<FutureEvent>;
        private _intersections: IMap<Point2D, ISet<FutureEvent>>;
        private _sweepLine: Line2D;
        private _currentEventPoint: Point2D;
        private _before: boolean;
        protected _queue: EventQueue;
        private _ignoreSegmentEndings: boolean;

        public toString(): string {
            var s: string = "SweepLine {\n";
            s += "  line          = " + this._sweepLine.toString() + "\n";
            s += "  intersections = " + this.getIntersections().toString() + "\n";
            var reserved: Array<FutureEvent> = arrayFromSet(this._events);
            reserved.forEach((e) => {
                s += "  " + e.toString() + "\n";
            });
            s += "}";
            return s;
        }

    }

}
