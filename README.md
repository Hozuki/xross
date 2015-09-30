# xross

A TypeScript implementation of [Bentley-Ottmann algorithm](https://en.wikipedia.org/wiki/Bentley%E2%80%93Ottmann_algorithm#Faster_algorithms),
ported from [CompGeom](//github.com/bkiers/CompGeom/blob/master/src/main/compgeom/algorithms/BentleyOttmann.java).

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

## How-To

Run `test/boot.js`:

```
cd /path/to/project/
node test/boot.js
```

## Current Result

1. Common lines (PASSED)
2. Vertical and horizontal lines only (PASSED)
3. Overlapped lines (PASSED)
4. Lines whose slopes are very close (FAILED)
5. Random lines (FAILED) \**(Notice that the failing cases are matched with test #4.)*
