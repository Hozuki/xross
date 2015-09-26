//import {IEquatable, IComparer, IComparable, ArgumentError, NotImplementedError} from "./xcommon";
//import {TreeSet, TreeMap, arrayFromSet, keySet} from "./xcollection";
var xcollection = require("./xcollection");
var xgeom = require("./xgeom");
var xross;
(function (xross) {
    "use strict";
    var XSet = xcollection.xross.XSet;
    var XMap = xcollection.xross.XMap;
    var arrayFromSet = xcollection.xross.arrayFromSet;
    var keySet = xcollection.xross.keySet;
    var SweepLine = xgeom.xross.SweepLine;
    var EventQueue = xgeom.xross.EventQueue;
    var BentleyOttmann = (function () {
        function BentleyOttmann() {
        }
        BentleyOttmann.intersections = function (segments) {
            return keySet(BentleyOttmann.intersectionsMap(segments));
        };
        BentleyOttmann.intersectionsMap = function (segments) {
            if (segments.size() < 2) {
                return new XMap();
            }
            var sweepLine = new SweepLine();
            var queue = new EventQueue(segments, sweepLine);
            while (!queue.isEmpty()) {
                var events = queue.poll();
                sweepLine.handle(events);
            }
            return sweepLine.getIntersections();
        };
        BentleyOttmann.intersectionsNaive = function (segments) {
            var array = arrayFromSet(segments);
            var intersections = new XSet();
            var p;
            for (var i = 0; i < array.length - 1; i++) {
                for (var j = i + 1; j < array.length; j++) {
                    p = array[i].intersection(array[j]);
                    if (p === null) {
                        continue;
                    }
                    else {
                        intersections.set(p);
                    }
                }
            }
            return intersections;
        };
        return BentleyOttmann;
    })();
    xross.BentleyOttmann = BentleyOttmann;
})(xross = exports.xross || (exports.xross = {}));
//# sourceMappingURL=xross.js.map