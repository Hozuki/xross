# xross

A TypeScript implementation of the implementation of [Bentley-Ottmann algorithm](https://en.wikipedia.org/wiki/Bentley%E2%80%93Ottmann_algorithm#Faster_algorithms),
ported from [CompGeom](//github.com/bkiers/CompGeom/blob/master/src/main/compgeom/algorithms/BentleyOttmann.java).

The project uses ECMAScript 2015 (ECMAScript 6/Harmony) syntax. Please make sure
you have modern browsers, or Node.js >=v0.11.\* installed.

The implementation has not been tested yet.

## Building from the Source

Install TypeScript compiler first:

```
npm install -g typescript
```

Compile TypeScript sources:

```
tsc -p .
```

Run the commands in shell:

```
npm install
```

## Testing

Use [Electron](http://electron.atom.io/) or [nw.js](http://nwjs.io/) to load
the test page `test/index.html` and access xross from the object `xross`.
