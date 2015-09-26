"use strict";
var xrossns = require("./xross");
var xgeom = require("./xgeom");
var xcollection = require("./xcollection");
var BentleyOttmann = xrossns.xross.BentleyOttmann;
var LineSegment2D = xgeom.xross.LineSegment2D;
var Point2D = xgeom.xross.Point2D;
var XSet = xcollection.xross.XSet;
var arrayToSet = xcollection.xross.arrayToSet;
var xross;
(function (xross) {
    var CGUtil = (function () {
        function CGUtil() {
        }
        CGUtil.createPoint2DList = function (data) {
            if (/^\s*$/.test(data)) {
                return [];
            }
            var numbers = [];
            var points = [];
            var tokens = data.trim().split(/\s+/);
            tokens.forEach(function (value) {
                numbers.push(parseFloat(value));
            });
            if (numbers.length <= 0) {
                throw new Error("There is no yummy data.");
            }
            if (numbers.length % 2 === 1) {
                throw new Error("Why are there some single numbers?");
            }
            for (var i = 1; i < numbers.length; i += 2) {
                points.push(new Point2D(numbers[i - 1], numbers[i]));
            }
            return points;
        };
        CGUtil.createLineSegment2DList = function (data) {
            if (/^\s*$/.test(data)) {
                return [];
            }
            var segments = [];
            var points = CGUtil.createPoint2DList(data);
            if (points.length % 2 === 1) {
                throw new Error("Is there any one-pointed line?");
            }
            for (var i = 1; i < points.length; i += 2) {
                segments.push(new LineSegment2D(points[i - 1], points[i]));
            }
            return segments;
        };
        return CGUtil;
    })();
    var TestBentleyOttmann = (function () {
        function TestBentleyOttmann() {
        }
        TestBentleyOttmann.test1 = function () {
            var data = "-5 -5 5 5   -5 5 5 -5   -1 0 1 0   -1 0 6 0   0 0 0 6   4 1 4 -5";
            var segs = new XSet();
            arrayToSet(CGUtil.createLineSegment2DList(data), segs);
            console.time("naive t1");
            var naive = BentleyOttmann.intersectionsNaive(segs);
            console.timeEnd("naive t1");
            console.time("quick t1");
            var quick = BentleyOttmann.intersections(segs);
            console.timeEnd("quick t1");
            console.log(naive);
            console.log(quick);
        };
        TestBentleyOttmann.test2 = function () {
            var data = "2 0 2 5   1 1 6 1   0 3 6 3   4 -1 4 7   3 6 6 6   6 6 6 3   5 5 8 5   8 5 8 3";
            var segs = new XSet();
            arrayToSet(CGUtil.createLineSegment2DList(data), segs);
            console.time("naive t2");
            var naive = BentleyOttmann.intersectionsNaive(segs);
            console.timeEnd("naive t2");
            console.time("quick t2");
            var quick = BentleyOttmann.intersections(segs);
            console.timeEnd("quick t2");
            console.log(naive);
            console.log(quick);
        };
        TestBentleyOttmann.testRandom = function () {
            function nextInt(upperBound) {
                return (Math.random() * upperBound) | 0;
            }
            function nextBoolean() {
                return Math.random() >= 0.5;
            }
            var box = 1000, numSegments = 10000, maxSizeSegments = 200, testsToPerform = 1;
            var segs;
            try {
                for (var i = 0; i < testsToPerform; i++) {
                    segs = new XSet();
                    while (segs.size() < numSegments) {
                        var x1 = nextInt(box) - box / 2;
                        var y1 = nextInt(box) - box / 2;
                        var deltaX = nextInt(maxSizeSegments) + 1;
                        var deltaY = nextInt(maxSizeSegments) + 1;
                        var x2 = x1 + (nextBoolean() ? -deltaX : deltaX);
                        var y2 = y1 + (nextBoolean() ? -deltaY : deltaY);
                        var p1 = new Point2D(x1, y1), p2 = new Point2D(x2, y2);
                        if (!p1.equals(p2)) {
                            var s = new LineSegment2D(p1, p2);
                            segs.set(s);
                        }
                    }
                    console.log(segs);
                    console.time("naive #" + i.toString());
                    var naive = BentleyOttmann.intersectionsNaive(segs);
                    console.timeEnd("naive #" + i.toString());
                    console.time("quick #" + i.toString());
                    var quick = BentleyOttmann.intersections(segs);
                    console.timeEnd("quick #" + i.toString());
                    console.log(naive);
                    console.log(quick);
                    if (i % 100 === 0) {
                        console.log("Test Bentley-Ottmann: testRandom() #" + i.toString());
                    }
                }
            }
            catch (ex) {
                console.log(ex.message);
            }
        };
        return TestBentleyOttmann;
    })();
    xross.TestBentleyOttmann = TestBentleyOttmann;
})(xross = exports.xross || (exports.xross = {}));
//# sourceMappingURL=xross-test.js.map