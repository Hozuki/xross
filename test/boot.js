/**
 * Created by MIC on 2015/9/25.
 */

var t = require("../src/xross-test").xross.TestBentleyOttmann;

t.test1();
console.log("-------- /test 1 --------");
t.test2();
console.log("-------- /test 2 --------");
// Will fail when deviations are less than 0.001
//t.testSimilarSlopes();
console.log("-------- /test s --------");
//t.testRandom(100000, 5000, 80, 1, false); // works well
//t.testRandom(100000, 2000, 80, 1, false); // works well
//t.testRandom(100000, 5000, 50, 1, false); // works well
//t.testRandom(1000, 5000, 80, 1, false); // crash, definitely
//t.testRandom(1000, 2000, 80, 1, false); // crash, usually
//t.testRandom(1000, 5000, 50, 1, false); // crash, usually
//t.testRandom(1000, 1000, 50, 1, false); // works, and the ballance point moved to ~50 (in Node without debugger)
//t.testRandom(100, 10, 50, 1, true); // infinite loop, or crash
//t.testRandom(1000, 1000, 50, 1, true); // crash, definitely
t.testRandom(1000, 1000, 50, 1, false);
console.log("-------- /test r --------");
