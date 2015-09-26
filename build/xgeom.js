var xcommon = require("./xcommon");
var xcollection = require("./xcollection");
var xross;
(function (xross) {
    "use strict";
    var ArgumentError = xcommon.xross.ArgumentError;
    var XSet = xcollection.xross.XSet;
    var XMap = xcollection.xross.XMap;
    var XTreeMap = xcollection.xross.XTreeMap;
    var XTreeSet = xcollection.xross.XTreeSet;
    var PTreeSet = xcollection.xross.PTreeSet;
    var arrayFromSet = xcollection.xross.arrayFromSet;
    var arrayToSet = xcollection.xross.arrayToSet;
    var Point2D = (function () {
        function Point2D(x, y) {
            if (x === void 0) { x = 0; }
            if (y === void 0) { y = 0; }
            this.x = x;
            this.y = y;
        }
        Point2D.prototype.equals = function (p) {
            if (this === p) {
                return true;
            }
            if (p == null) {
                return false;
            }
            return this.x === p.x && this.y === p.y;
        };
        Point2D.prototype.isRightOf = function (o) {
            if (o instanceof Point2D) {
                var point = o;
                return this.x > point.x;
            }
            else if (o instanceof Line2D) {
                var line = o;
                if (line.contains(this)) {
                    return true;
                }
                if (line.isHorizontal()) {
                    return this.y < line.yIntercept();
                }
                if (line.isVertical()) {
                    return this.x > line.xIntercept();
                }
                var linePoint = line.intersection(Line2D.verticalLine(0));
                var temp = new Line2D(this, linePoint);
                if (this.y < linePoint.y) {
                    if (line.slope < 0) {
                        return temp.slope < 0 && temp.slope > line.slope;
                    }
                    else {
                        return temp.slope < 0 || temp.slope > line.slope;
                    }
                }
                else if (this.y > linePoint.y) {
                    if (line.slope < 0) {
                        return temp.slope > 0 || temp.slope < line.slope;
                    }
                    else {
                        return temp.slope > 0 && temp.slope < line.slope;
                    }
                }
                else {
                    return this.isRightOf(linePoint);
                }
            }
            else {
                throw new ArgumentError("What is the type?");
            }
        };
        Point2D.prototype.translate = function (dx, dy) {
            return new Point2D(this.x + dx, this.y + dy);
        };
        Point2D.prototype.getHashCode = function () {
            return (this.x * 23000) ^ (this.y * 17000);
        };
        return Point2D;
    })();
    xross.Point2D = Point2D;
    var Line2D = (function () {
        function Line2D(p1, p2) {
            if (p1 instanceof Point2D) {
                this.slope = Line2D.calculateSlope(p1, p2);
                this.constant = this.calculateConstant(p1);
            }
            else {
                this.slope = !isFinite(p1) ? +Infinity : p1;
                this.constant = this.calculateConstant(p2);
            }
        }
        Line2D.prototype.intersection = function (that) {
            if (this.slope === that.slope) {
                return null;
            }
            var xInt = this.xIntercept(that);
            if (this.isVertical()) {
                return new Point2D(xInt, that.yIntercept(xInt));
            }
            else {
                return new Point2D(xInt, this.yIntercept(xInt));
            }
        };
        Line2D.prototype.contains = function (p) {
            if (this.isVertical()) {
                return this.constant === p.x;
            }
            else {
                return (this.slope * p.x + this.constant) === p.y;
            }
        };
        Line2D.prototype.isVertical = function () {
            return !isFinite(this.slope);
        };
        Line2D.prototype.isHorizontal = function () {
            return this.slope === 0;
        };
        Line2D.prototype.calculateConstant = function (p) {
            if (this.isVertical()) {
                return p.x;
            }
            else {
                return -(this.slope * p.x) + p.y;
            }
        };
        Line2D.prototype.xIntercept = function (that) {
            if (that === undefined) {
                return this.isHorizontal() ? null : (this.isVertical() ? this.constant : -this.constant / this.slope);
            }
            else {
                if (this.isVertical()) {
                    return this.constant;
                }
                else if (that.isVertical()) {
                    return that.constant;
                }
                else {
                    return (that.constant - this.constant) / (this.slope - that.slope);
                }
            }
        };
        Line2D.prototype.yIntercept = function (xInt) {
            if (xInt === undefined) {
                return this.isVertical() ? null : this.constant;
            }
            else {
                return this.slope * xInt + this.constant;
            }
        };
        Line2D.prototype.getHashCode = function () {
            return (this.slope * 23000) ^ (this.constant * 37000);
        };
        Line2D.calculateSlope = function (p1, p2) {
            if (p1.x === p2.x) {
                return +Infinity;
            }
            else {
                return (p2.y - p1.y) / (p2.x - p1.x);
            }
        };
        Line2D.verticalLine = function (x) {
            var p = new Point2D(x, 0);
            return new Line2D(p, p.translate(0, 1));
        };
        return Line2D;
    })();
    xross.Line2D = Line2D;
    var Extremal = (function () {
        function Extremal(primary, secondary) {
            this._primary = primary;
            this._secondary = secondary;
        }
        Extremal.prototype.moreExtremeThan = function (p1, p2) {
            if ((this._primary === Extremal.UPPER && p1.y > p2.y) ||
                (this._primary === Extremal.LOWER && p1.y < p2.y) ||
                (this._primary === Extremal.LEFT && p1.x < p2.x) ||
                (this._primary === Extremal.RIGHT && p1.x > p2.x)) {
                return true;
            }
            else if (((this._primary === Extremal.UPPER || this._primary === Extremal.LOWER) && p1.y === p2.y) ||
                ((this._primary === Extremal.LEFT || this._primary === Extremal.RIGHT) && p1.x === p2.x)) {
                if ((this._secondary === Extremal.UPPER && p1.y > p2.y) ||
                    (this._secondary === Extremal.LOWER && p1.y < p2.y) ||
                    (this._secondary === Extremal.LEFT && p1.x < p2.x) ||
                    (this._secondary === Extremal.RIGHT && p1.x > p2.x)) {
                    return true;
                }
            }
            return false;
        };
        Extremal.LEFT = 0;
        Extremal.RIGHT = 1;
        Extremal.UPPER = 2;
        Extremal.LOWER = 3;
        Extremal.UPPER_LEFT = new Extremal(Extremal.UPPER, Extremal.LEFT);
        Extremal.UPPER_RIGHT = new Extremal(Extremal.UPPER, Extremal.RIGHT);
        Extremal.LOWER_LEFT = new Extremal(Extremal.LOWER, Extremal.LEFT);
        Extremal.LOWER_RIGHT = new Extremal(Extremal.LOWER, Extremal.RIGHT);
        Extremal.LEFT_UPPER = new Extremal(Extremal.LEFT, Extremal.UPPER);
        Extremal.LEFT_LOWER = new Extremal(Extremal.LEFT, Extremal.LOWER);
        Extremal.RIGHT_UPPER = new Extremal(Extremal.RIGHT, Extremal.UPPER);
        Extremal.RIGHT_LOWER = new Extremal(Extremal.RIGHT, Extremal.LOWER);
        return Extremal;
    })();
    var LineSegment2D = (function () {
        function LineSegment2D(pa, pb) {
            if (pa.equals(pb)) {
                throw new ArgumentError("pa and pb must not be the same");
            }
            this.p1 = Extremal.LEFT_LOWER.moreExtremeThan(pa, pb) ? pa : pb;
            this.p2 = (this.p1 === pa ? pb : pa);
            this.maxX = Math.max(this.p1.x, this.p2.x);
            this.maxY = Math.max(this.p1.y, this.p2.y);
            this.minX = Math.min(this.p1.x, this.p2.x);
            this.minY = Math.min(this.p1.y, this.p2.y);
            this.line = new Line2D(this.p1, this.p2);
        }
        LineSegment2D.prototype.equals = function (o) {
            if (this === o) {
                return true;
            }
            if (o == null) {
                return false;
            }
            if (this === o) {
                return true;
            }
            return this.p1.equals(o.p1) && this.p2.equals(o.p2);
        };
        LineSegment2D.prototype.intersection = function (that) {
            var p;
            if (that instanceof LineSegment2D) {
                if (this.p1.equals(that.p2)) {
                    return this.p1;
                }
                else if (this.p2.equals(that.p1)) {
                    return this.p2;
                }
                else if (this.p1.equals(that.p1)) {
                    return this.line.slope === that.line.slope ? null : this.p1;
                }
                else if (this.p2.equals(that.p2)) {
                    return this.line.slope === that.line.slope ? null : this.p2;
                }
                else {
                    p = this.line.intersection(that.line);
                    if (p == null || !this.contains(p) || !that.contains(p)) {
                        return null;
                    }
                    else {
                        return p;
                    }
                }
            }
            else if (that instanceof Line2D) {
                p = this.line.intersection(that);
                if (p === null || !this.contains(p)) {
                    return null;
                }
                else {
                    return p;
                }
            }
            else {
                return null;
            }
        };
        LineSegment2D.prototype.intersects = function (that) {
            return this.intersection(that) !== null;
        };
        LineSegment2D.prototype.contains = function (p) {
            return (this.p1.equals(p) || this.p2.equals(p) ||
                (this.line.contains(p) &&
                    (p.x >= this.minX && p.x <= this.maxX && p.y >= this.minY && p.y <= this.maxY)));
        };
        LineSegment2D.prototype.hasEnding = function (p) {
            return this.p1.equals(p) || this.p2.equals(p);
        };
        LineSegment2D.prototype.getHashCode = function () {
            return (this.p1.getHashCode() * 13) ^ (this.p2.getHashCode() * 37);
        };
        return LineSegment2D;
    })();
    xross.LineSegment2D = LineSegment2D;
    (function (FutureEventType) {
        FutureEventType[FutureEventType["START"] = 0] = "START";
        FutureEventType[FutureEventType["END"] = 1] = "END";
        FutureEventType[FutureEventType["INTERSECTION"] = 2] = "INTERSECTION";
    })(xross.FutureEventType || (xross.FutureEventType = {}));
    var FutureEventType = xross.FutureEventType;
    var FutureEvent = (function () {
        function FutureEvent(t, p, s, sl) {
            this.type = t;
            this.point = p;
            this.segment = s;
            this.sweepLine = sl;
        }
        FutureEvent.prototype.compareTo = function (that) {
            if (this === that || this.equals(that)) {
                return 0;
            }
            var ipThis = this.sweepLine.intersection(this);
            var ipThat = this.sweepLine.intersection(that);
            var deltaY = ipThis.y - ipThat.y;
            if (deltaY !== 0) {
                return deltaY < 0 ? -1 : 1;
            }
            else {
                var thisSlope = this.segment.line.slope;
                var thatSlope = that.segment.line.slope;
                if (thisSlope !== thatSlope) {
                    if (this.sweepLine.isBefore()) {
                        return thisSlope > thatSlope ? 1 : -1;
                    }
                    else {
                        return thisSlope > thatSlope ? -1 : 1;
                    }
                }
                var deltaXP1 = this.segment.p1.x - that.segment.p1.x;
                if (deltaXP1 !== 0) {
                    return deltaXP1 < 0 ? -1 : 1;
                }
                var deltaXP2 = this.segment.p2.x - that.segment.p2.x;
                return deltaXP2 < 0 ? -1 : 1;
            }
        };
        FutureEvent.prototype.equals = function (o) {
            if (this === o) {
                return true;
            }
            if (o == null) {
                return false;
            }
            if ((this.type === FutureEventType.INTERSECTION && o.type !== FutureEventType.INTERSECTION) ||
                (this.type !== FutureEventType.INTERSECTION && o.type === FutureEventType.INTERSECTION)) {
                return false;
            }
            else if (this.type === FutureEventType.INTERSECTION && o.type === FutureEventType.INTERSECTION) {
                return this.point.equals(o.point);
            }
            else {
                return this.segment.equals(o.segment);
            }
        };
        FutureEvent.prototype.getHashCode = function () {
            return this.type === FutureEventType.INTERSECTION ? this.point.getHashCode() : this.segment.getHashCode();
        };
        return FutureEvent;
    })();
    xross.FutureEvent = FutureEvent;
    var EventQueue = (function () {
        function EventQueue(segments, line) {
            if (segments.size() <= 0) {
                throw new ArgumentError("Segments cannot be empty.");
            }
            this._events = new XTreeMap({
                compare: function (a, b) {
                    var dx = a.x > b.x ? 1 : (a.x < b.x ? -1 : 0);
                    return dx !== 0 ? dx : (a.y > b.y ? 1 : (a.y < b.y ? -1 : 0));
                }
            });
            this.init(segments, line);
        }
        EventQueue.prototype.isEmpty = function () {
            return this._events.isEmpty();
        };
        EventQueue.prototype.poll = function () {
            if (this.isEmpty()) {
                throw new Error("Oops, I'm empty.");
            }
            var set = new XSet();
            arrayToSet(this._events.pollFirstEntry(), set);
            return set;
        };
        EventQueue.prototype.offer = function (p, e) {
            var existing = this._events.get(p);
            this._events.delete(p);
            if (existing === null || existing === undefined) {
                existing = new Array();
            }
            if (e.type === FutureEventType.END) {
                existing.splice(0, 0, e);
            }
            else {
                existing.push(e);
            }
            this._events.set(p, existing);
        };
        EventQueue.prototype.init = function (segments, line) {
            var _this = this;
            var minY = +Infinity, maxY = -Infinity;
            var minDeltaX = +Infinity;
            var xs = new PTreeSet();
            segments.forEach(function (s, k, set) {
                xs.set(s.p1.x);
                xs.set(s.p2.x);
                if (s.minY < minY) {
                    minY = s.minY;
                }
                if (s.maxY > maxY) {
                    maxY = s.maxY;
                }
                _this.offer(s.p1, new FutureEvent(FutureEventType.START, s.p1, s, line));
                _this.offer(s.p2, new FutureEvent(FutureEventType.END, s.p2, s, line));
            });
            var xsArray = arrayFromSet(xs);
            for (var i = 1; i < xsArray.length; i++) {
                var tempDeltaX = xsArray[i] - xsArray[i - 1];
                if (tempDeltaX < minDeltaX) {
                    minDeltaX = tempDeltaX;
                }
            }
            var deltaY = maxY - minY;
            var slope = deltaY / minDeltaX * (-1000);
            line.setLine(new Line2D(slope, new Point2D()));
            line.setQueue(this);
        };
        return EventQueue;
    })();
    xross.EventQueue = EventQueue;
    var SweepLine = (function () {
        function SweepLine(ignoreEndings) {
            if (ignoreEndings === void 0) { ignoreEndings = false; }
            this._events = new XTreeSet({
                compare: function (a, b) {
                    if (a === b || a.equals(b)) {
                        return 0;
                    }
                    return a.compareTo(b);
                }
            });
            this._intersections = new XMap();
            this._sweepLine = null;
            this._currentEventPoint = null;
            this._before = true;
            this._ignoreSegmentEndings = ignoreEndings;
        }
        SweepLine.prototype.handle = function (aev) {
            var _this = this;
            if (aev instanceof FutureEvent) {
                return this.handleSingleEvent(aev);
            }
            else {
                var events = aev;
                var array = arrayFromSet(events);
                this.sweepTo(array[0]);
                if (!this._ignoreSegmentEndings && events.size() > 1) {
                    for (var i = 0; i < array.length - 1; i++) {
                        for (var j = i + 1; j < array.length; j++) {
                            this.checkIntersection(array[i], array[j]);
                        }
                    }
                }
                events.forEach(function (e) {
                    _this.handleSingleEvent(e);
                });
            }
        };
        SweepLine.prototype.handleSingleEvent = function (event) {
            var _this = this;
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
                    var set = this._intersections.get(event.point);
                    var toInsert = [];
                    set.forEach(function (e) {
                        if (_this.remove(e)) {
                            toInsert.push(e);
                        }
                    });
                    this._before = false;
                    for (var i = toInsert.length; i > 0; i--) {
                        var ev = toInsert.pop();
                        this.insert(ev);
                        this.checkIntersection(ev, this.above(ev));
                        this.checkIntersection(ev, this.below(ev));
                    }
                    break;
            }
        };
        SweepLine.prototype.getIntersections = function () {
            var segments = new XMap();
            this._intersections.forEach(function (v, k, map) {
                var set = new XSet();
                v.forEach(function (e) {
                    set.set(e.segment);
                });
                segments.set(k, set);
            });
            return segments;
        };
        SweepLine.prototype.intersection = function (e) {
            if (e.type === FutureEventType.INTERSECTION) {
                return e.point;
            }
            else {
                return e.segment.intersection(this._sweepLine);
            }
        };
        SweepLine.prototype.isBefore = function () {
            return this._before;
        };
        SweepLine.prototype.setLine = function (line) {
            this._sweepLine = line;
        };
        SweepLine.prototype.setQueue = function (q) {
            this._queue = q;
        };
        SweepLine.prototype.checkIntersection = function (a, b) {
            if (a === null || b === null || a.type === FutureEventType.INTERSECTION || b.type === FutureEventType.INTERSECTION) {
                return;
            }
            var p = a.segment.intersection(b.segment);
            if (p === null) {
                return;
            }
            if (this._ignoreSegmentEndings && a.segment.hasEnding(p) && b.segment.hasEnding(p)) {
                return;
            }
            var existing = this._intersections.get(p);
            this._intersections.delete(p);
            if (existing === null || existing === undefined) {
                existing = new XSet();
            }
            existing.set(a);
            existing.set(b);
            this._intersections.set(p, existing);
            if (p.isRightOf(this._sweepLine) || (this._sweepLine.contains(p) && p.y > this._currentEventPoint.y)) {
                var intersection = new FutureEvent(FutureEventType.INTERSECTION, p, null, this);
                this._queue.offer(p, intersection);
            }
        };
        SweepLine.prototype.insert = function (e) {
            return this._events.set(e);
        };
        SweepLine.prototype.remove = function (e) {
            return this._events.delete(e);
        };
        SweepLine.prototype.above = function (e) {
            return this._events.higher(e);
        };
        SweepLine.prototype.below = function (e) {
            return this._events.lower(e);
        };
        SweepLine.prototype.sweepTo = function (e) {
            this._currentEventPoint = e.point;
            this._sweepLine = new Line2D(this._sweepLine.slope, this._currentEventPoint);
        };
        return SweepLine;
    })();
    xross.SweepLine = SweepLine;
})(xross = exports.xross || (exports.xross = {}));
//# sourceMappingURL=xgeom.js.map