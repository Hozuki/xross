# xross

A TypeScript implementation of [Bentley-Ottmann algorithm](https://en.wikipedia.org/wiki/Bentley%E2%80%93Ottmann_algorithm#Faster_algorithms),
ported from [CompGeom](//github.com/bkiers/CompGeom/blob/master/src/main/compgeom/algorithms/BentleyOttmann.java).

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

## Testing

Use [Electron](http://electron.atom.io/) or [nw.js](http://nwjs.io/) to load
the test page `test/index.html` and access xross from the object `xross`.
