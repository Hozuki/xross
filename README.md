# xross

A TypeScript implementation of the implementation of [Bentley-Ottmann algorithm](https://en.wikipedia.org/wiki/Bentley%E2%80%93Ottmann_algorithm#Faster_algorithms),
ported from [CompGeom](//github.com/bkiers/CompGeom/blob/master/src/main/compgeom/algorithms/BentleyOttmann.java).

The project uses ECMAScript 2015 (ECMAScript 6/Harmony) syntax. Please make sure you have modern browsers,
or Node.js >=v0.11.\* installed.

## Building from the Source

Install TypeScript compiler first:

```
npm install -g typescript
```

Compile TypeScript sources:

```
tsc --target es6 --sourcemap --noImplicitAny --removeComments --noEmitOnError --outDir ./build/ ./src/xcommon.ts ./src/xcollection.ts ./src/xross.ts
```

Run the commands in shell:

```
npm install
gulp build
```
