//import {IEquatable, IComparer, IComparable, ArgumentError, NotImplementedError} from "./xcommon";
//import {TreeSet, TreeMap, arrayFromSet, keySet} from "./xcollection";

//import * as xcommon from "./xcommon";
//import * as xcollection from "./xcollection";
import xcommon = require("./xcommon");
import xcollection = require("./xcollection");
import xgeom = require("./xgeom");

export module xross {

    "use strict";

    import ISet = xcollection.xross.ISet;
    import IMap = xcollection.xross.IMap;
    import XSet = xcollection.xross.XSet;
    import XMap = xcollection.xross.XMap;
    import arrayFromSet = xcollection.xross.arrayFromSet;
    import keySet = xcollection.xross.keySet;
    import Point2D = xgeom.xross.Point2D;
    import Line2D = xgeom.xross.Line2D;
    import LineSegment2D = xgeom.xross.LineSegment2D;
    import SweepLine = xgeom.xross.SweepLine;
    import FutureEventType = xgeom.xross.FutureEventType;
    import FutureEvent = xgeom.xross.FutureEvent;
    import EventQueue = xgeom.xross.EventQueue;

    export class BentleyOttmann {

        public static intersections(segments: ISet<LineSegment2D>): ISet<Point2D> {
            return keySet(BentleyOttmann.intersectionsMap(segments));
        }

        public static intersectionsMap(segments: ISet<LineSegment2D>): IMap<Point2D, ISet<LineSegment2D>> {
            if (segments.size() < 2) {
                return new XMap<Point2D, ISet<LineSegment2D>>();
            }
            var sweepLine: SweepLine = new SweepLine();
            var queue: EventQueue = new EventQueue(segments, sweepLine);
            while (!queue.isEmpty()) {
                var events: ISet<FutureEvent> = queue.poll();
                sweepLine.handle(events);
            }
            return sweepLine.getIntersections();
        }

        public static intersectionsNaive(segments: ISet<LineSegment2D>): ISet<Point2D> {
            var array: Array<LineSegment2D> = arrayFromSet(segments);
            var intersections: ISet<Point2D> = new XSet<Point2D>();
            var p: Point2D;
            for (var i: number = 0; i < array.length - 1; i++) {
                for (var j: number = i + 1; j < array.length; j++) {
                    p = array[i].intersection(array[j]);
                    if (p === null) {
                        continue;
                    } else {
                        intersections.set(p);
                    }
                }
            }
            return intersections;
        }

    }

}
