var xross;
(function (xross) {
    "use strict";
    var NotImplementedError = (function () {
        function NotImplementedError(message) {
            if (message === void 0) { message = "Not implemented"; }
            this._message = message;
        }
        Object.defineProperty(NotImplementedError.prototype, "name", {
            get: function () {
                return "NotImplementedError";
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(NotImplementedError.prototype, "message", {
            get: function () {
                return this._message;
            },
            enumerable: true,
            configurable: true
        });
        return NotImplementedError;
    })();
    xross.NotImplementedError = NotImplementedError;
    var ArgumentError = (function () {
        function ArgumentError(message) {
            if (message === void 0) { message = "Argument invalid"; }
            this._message = message;
        }
        Object.defineProperty(ArgumentError.prototype, "name", {
            get: function () {
                return "NotImplementedError";
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ArgumentError.prototype, "message", {
            get: function () {
                return this._message;
            },
            enumerable: true,
            configurable: true
        });
        return ArgumentError;
    })();
    xross.ArgumentError = ArgumentError;
})(xross = exports.xross || (exports.xross = {}));
//# sourceMappingURL=xcommon.js.map