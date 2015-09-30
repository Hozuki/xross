# xross

A TypeScript implementation of [Bentley-Ottmann algorithm](https://en.wikipedia.org/wiki/Bentley%E2%80%93Ottmann_algorithm#Faster_algorithms),
ported from [CompGeom](//github.com/bkiers/CompGeom/blob/master/src/main/compgeom/algorithms/BentleyOttmann.java).

The implementation has not been tested yet.

## Building from the Source

Install TypeScript compiler:

```
npm install -g typescript
```

Compile TypeScript sources:

```
tsc -p .
```

## Testing

Run `test/boot.js`:

```
cd /path/to/project/
node test/boot.js
```
