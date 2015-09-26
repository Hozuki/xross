export module xross {

    "use strict";

    export interface IComparer<T> {

        compare(a: T, b: T): number;

    }

    export interface IEquatable<T> {

        equals(o: T): boolean;

    }

    export interface IComparable<T> {

        compareTo(o: T): number;

    }

    export class NotImplementedError implements Error {

        public constructor(message: string = "Not implemented") {
            this._message = message;
        }

        public get name(): string {
            return "NotImplementedError";
        }

        public get message(): string {
            return this._message;
        }

        private _message: string;

    }

    export class ArgumentError implements Error {

        public constructor(message: string = "Argument invalid") {
            this._message = message;
        }

        public get name(): string {
            return "NotImplementedError";
        }

        public get message(): string {
            return this._message;
        }

        private _message: string;

    }

}
