
import xrossns = require("./xross");
import xgeom = require("./xgeom");
import xcollection = require("./xcollection");

import BentleyOttmann = xrossns.xross.BentleyOttmann;
import LineSegment2D = xgeom.xross.LineSegment2D;
import Point2D = xgeom.xross.Point2D;
import ISet = xcollection.xross.ISet;
import ObjectSet = xcollection.xross.ObjectSet;
import PrimitiveSet = xcollection.xross.PrimitiveSet;
import PrimitiveTreeSet = xcollection.xross.PrimitiveTreeSet;
import LinkedPrimitiveSet = xcollection.xross.LinkedPrimitiveSet;
import arrayToSet = xcollection.xross.arrayToSet;
import arrayFromSet = xcollection.xross.arrayFromSet;

export module xross {

	"use strict";

	class CGUtil {

		public static createPoint2DList(data: string): Array<Point2D> {
			if (/^\s*$/.test(data)) {
				return [];
			}
			var numbers: Array<number> = [];
			var points: Array<Point2D> = [];
			var tokens: Array<string> = data.trim().split(/\s+/);
			tokens.forEach((value: string) => {
				numbers.push(parseFloat(value));
			});
			if (numbers.length <= 0) {
				throw new Error("There is no yummy data.");
			}
			if (numbers.length % 2 === 1) {
				throw new Error("Why are there some single numbers?");
			}
			for (var i: number = 1; i < numbers.length; i += 2) {
				points.push(new Point2D(numbers[i - 1], numbers[i]));
			}
			return points;
		}

		public static createLineSegment2DList(data: string): Array<LineSegment2D> {
			if (/^\s*$/.test(data)) {
				return [];
			}
			var segments: Array<LineSegment2D> = [];
			var points: Array<Point2D> = CGUtil.createPoint2DList(data);
			if (points.length % 2 === 1) {
				throw new Error("Is there any one-pointed line?");
			}
			for (var i: number = 1; i < points.length; i += 2) {
				segments.push(new LineSegment2D(points[i - 1], points[i]));
			}
			return segments;
		}

	}

	export class TestBentleyOttmann {

		public static test1(): void {
			// Normal data
			var data: string = "-5 -5 5 5   -5 5 5 -5   -1 0 1 0   -1 0 6 0   0 0 0 6   4 1 4 -5";
			var segs: ISet<LineSegment2D> = new ObjectSet<LineSegment2D>();
			arrayToSet(CGUtil.createLineSegment2DList(data), segs);
			console.time("naive t1");
			var naive: ISet<Point2D> = BentleyOttmann.intersectionsNaive(segs);
			console.timeEnd("naive t1");
			console.time("quick t1");
			var quick: ISet<Point2D> = BentleyOttmann.intersections(segs);
			console.timeEnd("quick t1");
			console.log(naive);
			console.log(quick);
		}

		public static test2(): void {
			// All are vertical and horizontal
			var data: string = "2 0 2 5   1 1 6 1   0 3 6 3   4 -1 4 7   3 6 6 6   6 6 6 3   5 5 8 5   8 5 8 3";
			var segs: ISet<LineSegment2D> = new ObjectSet<LineSegment2D>();
			arrayToSet(CGUtil.createLineSegment2DList(data), segs);
			console.time("naive t2");
			var naive: ISet<Point2D> = BentleyOttmann.intersectionsNaive(segs);
			console.timeEnd("naive t2");
			console.time("quick t2");
			var quick: ISet<Point2D> = BentleyOttmann.intersections(segs);
			console.timeEnd("quick t2");
			console.log(naive);
			console.log(quick);
		}

		public static testSimilarSlopes(): void {
			// Two nearly collinear ilnes
			// 大概的最高容许精度在 0.001/6 左右，但是实际随机测试时很可能遇到比这个值要小的，导致相交计算异常
			// 很可能是因为使用了原生的数字进行运算而不是 Rational
			var data: string = "-6 -3 6 3   -6.001 -3.001 6.001 3.001";
			var segs: ISet<LineSegment2D> = new ObjectSet<LineSegment2D>();
			arrayToSet(CGUtil.createLineSegment2DList(data), segs);
			console.time("naive ts");
			var naive: ISet<Point2D> = BentleyOttmann.intersectionsNaive(segs);
			console.timeEnd("naive ts");
			console.time("quick ts");
			var quick: ISet<Point2D> = BentleyOttmann.intersections(segs);
			console.timeEnd("quick ts");
			console.log(naive);
			console.log(quick);
		}

		public static testImpossible(): void {
			// Two collinear ilnes
			var data: string = "-6 -3 6 3   1 2 2 4";
			var segs: ISet<LineSegment2D> = new ObjectSet<LineSegment2D>();
			arrayToSet(CGUtil.createLineSegment2DList(data), segs);
			console.time("naive ti");
			var naive: ISet<Point2D> = BentleyOttmann.intersectionsNaive(segs);
			console.timeEnd("naive ti");
			console.time("quick ti");
			var quick: ISet<Point2D> = BentleyOttmann.intersections(segs);
			console.timeEnd("quick ti");
			console.log(naive);
			console.log(quick);
		}

		public static testRandom(box: number = 1000, numSegments: number = 1000, maxSizeSegments: number = 200, testsToPerform: number = 1, strictRandom: boolean = true): void {
			function nextInt(upperBound: number): number {
				return (Math.random() * upperBound) | 0;
			}
			function nextBoolean(): boolean {
				return Math.random() >= 0.5;
			}
			var segs: ISet<LineSegment2D>;

			for (var i: number = 0; i < testsToPerform; i++) {
				segs = new ObjectSet<LineSegment2D>();
				while (segs.size() < numSegments) {
					var x1: number = nextInt(box) - box / 2;
					var y1: number = nextInt(box) - box / 2;
					if (strictRandom) {
						var deltaX: number = nextInt(maxSizeSegments) + 1;
						var deltaY: number = nextInt(maxSizeSegments) + 1;
					} else {
						var deltaX: number = maxSizeSegments, deltaY: number = maxSizeSegments;
					}
					console.log("dx: " + deltaX + ", dy: " + deltaY);
					var x2: number = x1 + (nextBoolean() ? -deltaX : deltaX);
					var y2: number = y1 + (nextBoolean() ? -deltaY : deltaY);
					var p1: Point2D = new Point2D(x1, y1), p2: Point2D = new Point2D(x2, y2);
					if (!p1.equals(p2)) {
						var s: LineSegment2D = new LineSegment2D(p1, p2);
						segs.set(s);
					}
				}
				console.time("naive #" + i.toString());
				var naive: ISet<Point2D> = BentleyOttmann.intersectionsNaive(segs);
				console.timeEnd("naive #" + i.toString());
				console.time("quick #" + i.toString());
				var quick: ISet<Point2D> = BentleyOttmann.intersections(segs);
				console.timeEnd("quick #" + i.toString());
				//console.log(naive);
				//console.log(quick);

				if (i % 100 === 0) {
					console.log("Test Bentley-Ottmann: testRandom() #" + i.toString());
				}
			}
		}

		public static testPSet(): void {
			var set: ISet<number> = new PrimitiveSet<number>();
			var array: Array<number> = [49, 39, 9, 2, 6, 1, 5, 6, 7, 9, 10, 32];
			arrayToSet(array, set);
			array = arrayFromSet(set);
			console.log(array);
		}

		public static testPTSet(): void {
			var set: ISet<number> = new PrimitiveTreeSet<number>();
			var array: Array<number> = [49, 39, 9, 2, 6, 1, 5, 6, 7, 9, 10, 32];
			arrayToSet(array, set);
			array = arrayFromSet(set);
			console.log(array);
		}

		public static testPSetRandom(): void {
			var set: ISet<number> = new PrimitiveSet<number>();

			var array: Array<number> = [];
			for (var i: number = 0; i < 50; i++) {
				array.push((300 * Math.random()) | 0);
			}
			console.log(array);
			arrayToSet(array, set);
			array = arrayFromSet(set);
			console.log(array);
		}

		public static testLPSet(): void {
			var set: ISet<number> = new LinkedPrimitiveSet<number>();
			var array: Array<number> = [49, 39, 9, 2, 6, 1, 5, 6, 7, 9, 10, 32];
			arrayToSet(array, set);
			array = arrayFromSet(set);
			console.log(array);
		}

	}

}
