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
// Will fail, usually
t.testRandom(1000, 1000, 63, 1, true);
console.log("-------- /test r --------");
