# Illustrated landscape polygon operations

`polygon-clipping-0.15.7.js` is the unmodified UMD browser distribution from
the npm package `polygon-clipping@0.15.7` (Mike Fogel and contributors, MIT).
Source and API: https://github.com/mfogel/polygon-clipping

It is used only by the illustrated-landscape standalone test to join MVT
polygon fragments while preserving holes. No runtime CDN is required.

The bundled notices in the JavaScript are preserved. Additional licenses:

- `polygon-clipping-LICENSE.md`: polygon-clipping, MIT.
- `splaytree-LICENSE.txt`: splaytree 3.1.2, Alexander Milevski, MIT; extracted
  verbatim from that npm package's Readme.md License section.
- `robust-predicates-LICENSE.txt`: robust-predicates 3.0.2, Unlicense.
- `tslib-LICENSE.txt`: the Microsoft TypeScript helper notice embedded in the
  UMD file uses Apache License 2.0; copyright remains in the JavaScript header.

The distribution's optional source-map comment is retained; maps are not
needed for the renderer to execute.
