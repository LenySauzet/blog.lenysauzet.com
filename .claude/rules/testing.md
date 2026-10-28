---
paths:
  - "**/*.test.ts"
  - "**/*.test.tsx"
  - "vitest.config.*"
  - "vitest-setup.ts"
  - "test/**"
---

# Testing in detail

Vitest + React Testing Library, colocated as `Component.test.tsx`. Three constraints
shape almost every test here:

- **jsdom gives every element a zero-sized box**, so Motion's layout projection never
  settles and a subtree animating out via a shared `layoutId` never unmounts. Assert
  dismissal on the component that owns the dialog, not the one that owns the morph.
  Animation fidelity belongs in a real browser.
- **`server-only` is aliased to a stub** (`test/stubs/`) because Vitest does not set the
  react-server condition. The guard still holds in the real build.
- **Collapse Motion's transitions where a test waits for an unmount.** `vitest-setup`
  forces reduced motion, but Motion caches that at module scope, so whether it takes
  effect depends on import order: the Lightbox exit measured either 20ms or a full
  300ms tween across runs, and on a loaded runner the tween outlived `waitFor`'s one
  second default about one run in three. Wrapping the harness in
  `<MotionConfig transition={{ duration: 0 }}>` settles it at 19-25ms. Raising the
  timeout only widens the window the race runs in.

`vitest-setup.ts` polyfills `PointerEvent` and forces `prefers-reduced-motion` for
determinism.

**jsdom tracks the Node floor**, which `.nvmrc` and `engines.node` set to 24. jsdom 30
declares `^22.22.2 || ^24.15.0 || >=26.0.0`, so dropping below any of those brings back
the `ERR_REQUIRE_ESM` that every test file threw under the old 22.9 floor.

That coupling is why **CI pins Node via `.nvmrc`**. Vitest spawns Node, not bun, so an
unpinned runner tests against a different runtime than anyone develops on: a jsdom bump
once went green in CI while failing locally. If you change `.nvmrc`, the workflow follows
it automatically, but run `nvm install` and re-run the suite before trusting it.

**`@types/node` tracks the runtime, never the registry.** It stays on the major
`.nvmrc` names, currently 24. Types describing APIs the runtime has not got will
happily typecheck code that crashes, so a bump here waits for the floor to move first.

**Do not assert on serialised CSS.** A parser may rewrite what it stores: jsdom 30 drops
`to bottom` from a gradient, being the default direction, so a test looking for it broke
on a component that had not changed. Assert the non-default direction, or its absence.
