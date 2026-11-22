# Solid 2 migration guide

Status: **implemented on branch `feat/solid-2-migration` (2026-11-22) — uncommitted, ready for
review**. Verified against `solid-js@2.0.3`, `@solidjs/router@2.0.1`,
`@solidjs/vite-plugin@3.0.1`, `@lucide/solid@1.77.0`.

Decision log:

- 2026-11-22 — `@kobalte/core` alpha accepted for the single `Select`.
- 2026-11-22 — `lucide-solid` replaced by `@lucide/solid`, the official Solid 2 package
  (published 2026-11-20). The earlier "defer lucide" decision is reversed.
- 2026-11-22 — migration implemented in one branch and verified (unit, e2e, build, lint).

PR #730 (`@solidjs/router` 1.0.3 → 2.0.0) cannot be merged on its own: router 2 is part of
the Solid 2 line and declares `solid-js ^2.0.0` + `@solidjs/web ^2.0.0` as required peers.
Its lockfile resolves router 2.0.0 while `node_modules/solid-js` stays at 1.9.19, which is
an unsupported combination.

## Verdict

Everything needed for the move is published. `@kobalte/core` is the only alpha, and it is
accepted for a single component. The icon dependency is a rename, not a rebuild: lucide ships
`@lucide/solid` for Solid 2, so nothing has to be vendored or waited on.

## What landed

- **Runtime**: `solid-js` + `@solidjs/web` `2.0.3`; router `2.0.1`; `@solidjs/vite-plugin`
  `3.0.1` replacing `vite-plugin-solid`; `@lucide/solid` `1.77.0` replacing `lucide-solid`;
  `@kobalte/core` `2.0.0-alpha.5` (pinned); `solid-sonner` `1.0.0`.
- **Router**: `createRouter` factory in `App.tsx`; `SectionSwitch` uses a plain `<a>` with a
  manual `aria-current` (the `end` prop and `<A>` are gone).
- **Icons**: 13 files renamed `lucide-solid` → `@lucide/solid`; same named exports.
- **Effects**: 5 call sites converted to compute/apply. The search-params sync writes in the
  apply phase; the mentor-expansion pruning became a derived memo (`requestedExpanded` →
  `manualExpanded`) because an effect that writes its own source tears the frame. One-time
  mount reads (`location.search`, the retained catalog snapshot) are wrapped in `untrack` to
  state the intent and keep the dev console clean.
- **Lifecycle**: 3 `onMount` → `onSettled`, with cleanup returned from the callback.
- **Context**: 3 `.Provider` usages replaced by context-as-provider; `useLanguage` is a direct
  `useContext` (the manual undefined check is dead in 2.0).
- **Props/types**: 18 `splitProps` → `omit`; intrinsic `ComponentProps` from `@solidjs/web`;
  `JSX.Element` imports moved off `solid-js`.
- **Resource**: `createResource` replaced by a signal plus a `loading` accessor. The initial
  fetch starts from an effect's apply phase (a component-body write is an owned-scope write in
  2.0); retry, error retention, generation guards and analytics are preserved. One deliberate
  tightening: a superseded request no longer overwrites `loadError` (the 1.x resource set it
  outside the generation guard).
- **History**: the query-string sync preserves `history.state` instead of replacing it with
  `{}`. Router 2 keeps `_depth` there to track back/forward entries; clobbering it corrupted
  that bookkeeping (and `useBeforeLeave`, if ever used). Covered by a permanent e2e test.
- **Entrypoint**: dropped the `/** @refresh reload */` marker from `index.tsx`; the v3 plugin
  hard-reloads the entry on its own and never read the marker.
- **DOM attributes**: `tabIndex`/`colSpan` lowercased; boolean `aria-*` values emit
  `"true"`/`"false"` strings. `spellcheck={false}` became `spellcheck="false"`: in 2.0 a
  literal `false` means "remove the attribute", which would have re-enabled spell-checking.
- **Tests**: `flush()` at the boundaries where a test asserts immediately after a setter;
  vitest resolves the browser build through `ssr.resolve.conditions` (the SSR pipeline
  otherwise pulls `solid-js`' server build and effects never flush). New e2e coverage: the
  Kobalte `Select` by mouse and keyboard, a download-failure toast, a hard load of `/mentors`,
  deep-linked filter controls, router history state across back/forward, theme cycling, the
  select's outside-click dismissal, and DOM attribute casing/enumerated values.

| Area | Effort | Risk |
| --- | --- | --- |
| Tooling + entry point | small | low |
| Router shell (`App.tsx`, `SectionSwitch.tsx`) | small | low |
| Props helpers + JSX types (5 UI files, 3 context/type files) | medium (mechanical) | low |
| Effects/lifecycle (`createEffect` split, `onMount`) | medium (5 effects, 3 mounts) | **medium** — two effects write signals while tracking |
| `createResource` replacement | medium | **high** — custom retry/error-retention behaviour |
| Icons (`lucide-solid` → `@lucide/solid`) | small (import rename) | low |
| Kobalte `Select` | small | accepted alpha — pin + smoke-test |

## Target versions

Verified against the npm registry on 2026-11-22.

| Package | Now | Target | Solid 2 status |
| --- | --- | --- | --- |
| `solid-js` | `^1.9.19` | `2.0.3` | stable |
| `@solidjs/web` | — | `2.0.3` | stable (required; owns `render` + JSX runtime) |
| `@solidjs/router` | `^1.0.3` | `2.0.1` | stable |
| `vite-plugin-solid` | `^2.11.16` | **rename** → `@solidjs/vite-plugin@3.0.1` | stable |
| `@kobalte/core` | `^0.13.14` | `2.0.0-alpha.5` | **alpha only** |
| `solid-sonner` | `^0.3.3` | `1.0.0` | stable |
| `lucide-solid` | `^1.74.0` | **replace** → `@lucide/solid@1.77.0` | stable (Solid 2 package) |
| `vite` | `^8.3.8` | unchanged | plugin peers `^8 \|\| ^9` |
| Node | >= 22.12 | unchanged | `@solidjs/web` / plugin engines |

Notes:

- `vite-plugin-solid@3.0.0-next.27` is a **rename shim** that only re-exports
  `@solidjs/vite-plugin`; it declares no peers, so it will not enforce Vite/Solid
  compatibility. Use the new package name.
- `solid-js@2.0.3` has no `./web`, `./store` or `./jsx-runtime` export. `solid-js/web` imports
  fail resolution, and `createStore`/`reconcile`/`snapshot` come from `solid-js` directly.
- `@solidjs/router@2.0.1` lists `filesystem-routing` as an **optional** peer. This app writes
  its route table by hand, so it is not needed.
- Local Node is v26.12.1 and CI uses `lts/*`, so the `>= 22.12.0` engine floor is satisfied.

## Dependency notes

### `lucide-solid` → `@lucide/solid`

`lucide-solid` (the Solid 1 package) cannot run on Solid 2: its dist imports `splitProps` from
`solid-js` and `createComponent`/`mergeProps` from `solid-js/web`, neither of which resolves on
2.0.3. It has been superseded by **`@lucide/solid@1.77.0`** — "Lucide icon library for Solid 2
applications" — published 2026-11-20, peer `solid-js ^2.0.0-rc.0`, maintained as
`packages/solid` in the lucide monorepo and documented at `lucide.dev/guide/solid`.

The swap is a pure import rename — same named exports, same props:

```diff
-import { RefreshCw, TriangleAlert } from 'lucide-solid';
+import { RefreshCw, TriangleAlert } from '@lucide/solid';
```

All 18 icons the app uses were verified present in `@lucide/solid@1.77.0`: `RefreshCw`,
`TriangleAlert`, `Check`, `ChevronDown`, `Globe`, `ArrowUp`, `Monitor`, `Moon`, `Sun`,
`FilterX`, `Search`, `X`, `ChevronRight`, `Download`, `LoaderCircle`, `Link`, `ArrowDown`,
`ArrowUpDown`. The two renamed in the 1.77 line (`triangle-exclamation-point`, `funnel-x`) still
ship aliases under the old export names.

The 13 files importing `lucide-solid`: `MentorsPage`, `LanguageSelect`, `BackToTop`,
`ThemeToggle`, `YearChart`, `MentorsToolbar`, `MentorsSearchInput`, `MentorRow`,
`MentorMobileCard`, `ThesisExtras`, `DownloadButton`, `DiplomaDetailsTable`, `SortIcon`.

This cannot land before the runtime move — the package peers `solid-js ^2.0.0-rc.0` — so it
ships in the same PR.

### Decision: `@kobalte/core` alpha accepted

`0.13.14` peers `solid-js ^1.9.8`, so it blocks Solid 2 at install time; `2.0.0-alpha.5`
(2026-11-20) peers `solid-js ^2` + `@solidjs/web ^2`. The alpha is accepted for the single
`Select` in `LanguageSelect.tsx`, so this is no longer a blocker.

Mitigations:

- Pin the exact version (no `^`) and bump deliberately when a new alpha lands.
- The public `Select` surface is unchanged — same import path, same anatomy, same
  `<Select.Value<Language>>` generic — but there is no v2 documentation or migration guide.
- The open Solid 2 issue that touches `Select` (`kobaltedev/kobalte#772`) is **dev warnings
  only**; behaviour is correct. Alpha.5 fixed the `merge`-keeps-`undefined` bug class in
  Accordion/Breadcrumbs/Resizable, and every prop `LanguageSelect` passes is defined, so it is
  not exposed to that class.
- Cadence is roughly monthly (alpha.4 Oct 20 → alpha.5 Nov 20) with the upgrade epic
  (`#653`) open since May. Expect churn; the fallback if it misbehaves is the `NativeSelect`
  already present in `web/src/components/ui/input.tsx`.

## Migration order

The runtime move is **atomic**: once `solid-js` is 2.x, the app does not compile until every
1.x API use is converted, so there is no green intermediate PR. Plan one PR with ordered
commits — runtime → router → icons → core API → resource → deps — reviewed commit-by-commit,
rather than a stack of individually mergeable PRs.

1. **Runtime + tooling** — bump `solid-js`, add `@solidjs/web`, swap the Vite plugin, update
   `tsconfig.json` and `vitest.config.ts`, move `render` to `@solidjs/web`.
2. **Router shell** — `createRouter` in `App.tsx`, `<a>` in `SectionSwitch.tsx`.
3. **Icons** — `lucide-solid` → `@lucide/solid` across 13 files.
4. **Core API sweep** — effects, lifecycle, context, props helpers, JSX types.
5. **Resource rewrite** — `createResource` → explicit async state.
6. **Dependency bump** — Kobalte `2.0.0-alpha.5` (pinned), sonner 1.0.
7. **Test sweep** — `flush()` in unit tests, router assertions in e2e.

Keep #730 open or close it and track this document; either way the router bump must not merge
alone.

## Change inventory

### Tooling and entry

| File | Line | Change |
| --- | --- | --- |
| `web/package.json` | deps | `@solidjs/router` `^2.0.1`; `solid-js` `2.0.3`; add `@solidjs/web` `2.0.3`; `vite-plugin-solid` → `@solidjs/vite-plugin` `^3.0.1`; `solid-sonner` `^1.0.0`; `lucide-solid` → `@lucide/solid` `1.77.0` |
| `web/tsconfig.json` | 11 | `"jsxImportSource": "@solidjs/web"` |
| `web/vite.config.ts` | 6 | `import solid from '@solidjs/vite-plugin'` (call shape unchanged) |
| `web/vitest.config.ts` | 12 | add `'solid'` to `resolve.conditions` (currently `['development','browser']`, which suppresses the plugin's default condition injection — verify against the plugin source before relying on it) |
| `web/src/index.tsx` | 4 | `import { render } from '@solidjs/web'` |

```diff
-import { render } from 'solid-js/web';
+import { render } from '@solidjs/web';
```

### Router

`<Router>/<Route>/<A>` are gone. Router 2 is a factory plus plain anchors; state is exposed
through `aria-current` / `data-active`.

`web/src/App.tsx` (current lines 1–29):

```tsx
import { createRouter } from '@solidjs/router';

const routes = [
  { path: '/', component: DiplomasPage },
  { path: '/mentors', component: DiplomasPage },
  { path: '/masters', component: MastersPage },
];

const Router = createRouter({ routes });

export default function App() {
  return (
    <LanguageProvider>
      <Router />
      <Toaster position="bottom-right" />
    </LanguageProvider>
  );
}
```

The instance is the provider component; `children` is an optional render prop receiving the
matched content, for the rare case where a layout must wrap the outlet. This app has no
layout, so `<Router />` is enough. There is exactly one router instance per app; do not nest
one inside another.

`web/src/features/mentors/components/SectionSwitch.tsx` (current lines 1, 51–69):

```diff
-import { A } from '@solidjs/router';
+// no router import needed

-            <A aria-current={isActive() ? 'page' : undefined} end href={...}>
+            <a aria-current={isActive() ? 'page' : undefined} href={...}>
               …
-            </A>
+            </a>
```

- `end` disappears. The router sets `aria-current="page"` for exact path+query and
  `data-active` for prefix matches; an `aria-current` written in JSX is left alone, so the
  existing manual attribute keeps working and the e2e assertion
  (`web/e2e/smoke.spec.ts:102`) still passes.
- Prop renames if they were used: `noScroll` → `noscroll`; `replace`, `state`, `preload`
  become lowercase anchor attributes.
- There is no `<Link>`/`<A>` component to replace; `<a>` is the API. For component-library
  links use `useLinkState(() => href)` → `{ active, current, pending }`.
- Hover/focus preloading is now opt-in (`preloadLinks: intentPreload()`); the app does not
  rely on it.

`useLocation`, `useParams`, `useNavigate`, `useSearchParams`, `useMatch`, `useBeforeLeave`
keep their names and import path. `useLocation()` still returns `{ pathname, search, hash,
query, state, key }`, so `web/src/pages/MentorsPage.tsx:34` needs no change. Two behaviour
deltas worth knowing: params arrive already decoded, and under a non-empty `base` a string
starting with `/` is a full path (there is no base here).

### Effects — split compute/apply

`createEffect` takes two arguments in 2.0: a tracking compute function and an untracked apply
function. The single-function form is gone, and the apply phase is where side effects and
cleanup belong. Five call sites:

| File | Line | Current body |
| --- | --- | --- |
| `web/src/pages/MentorsPage.tsx` | 39 | `updatePageMetadata(language(), …)` |
| `web/src/lib/search-analytics.ts` | 130 | reads four options, schedules analytics |
| `web/src/features/mentors/hooks/useMentorsPageState.ts` | 270 | `syncMentorsSearchParams(...)` |
| `web/src/features/mentors/hooks/createMentorExpansion.ts` | 47 | debounce → `setSettledSearch`, `setDismissedAuto` |
| `web/src/features/mentors/hooks/createMentorExpansion.ts` | 83 | `setManualExpanded(stillVisible)` while tracking |

```tsx
// 1.x
createEffect(() => {
  updatePageMetadata(language(), props.config.id, document);
});

// 2.0
createEffect(
  () => [language(), props.config.id] as const,
  ([language], section) => {
    updatePageMetadata(language, section, document);
  },
);
```

Three of these need care:

- `createMentorExpansion.ts:83` **writes a signal inside the tracking phase**. Solid 2 throws
  on writes in an owned scope in dev (`REACTIVE_WRITE_IN_OWNED_SCOPE`). The effect must become
  a derivation plus an apply-phase write, or move the pruning into the event that changes the
  inputs.
- `createMentorExpansion.ts:47` writes inside a `setTimeout`, which is outside tracking, so it
  can move to the apply phase with the timer returned as cleanup.
- `useMentorsPageState.ts:270` and `search-analytics.ts:130` are pure side effects: compute
  returns the values, apply does the work. Do not read signals inside the apply function —
  it is untracked.

### Lifecycle — `onMount` → `onSettled`

| File | Line |
| --- | --- |
| `web/src/components/BackToTop.tsx` | 20 |
| `web/src/components/ThemeToggle.tsx` | 73 |
| `web/src/features/mentors/components/MentorsSearchInput.tsx` | 39 |

`onSettled` runs after render settles (refs are assigned) and may return its cleanup, which
is the 2.0 shape:

```ts
// 1.x
onMount(() => {
  addEventListener('scroll', onScroll, { passive: true });
  onCleanup(() => removeEventListener('scroll', onScroll));
});

// 2.0
onSettled(() => {
  addEventListener('scroll', onScroll, { passive: true });
  return () => removeEventListener('scroll', onScroll);
});
```

`onCleanup` still exists, but 2.0 reserves it for reactive cleanup inside computations; owned
component setup/teardown belongs in `onSettled`'s return value. Ref callbacks are now
**unowned** — `getOwner()` is `null` inside `ref={el => …}`, so no `onCleanup` there. The one
ref callback in the app (`LanguageSelect.tsx:67`) only captures an element, so it is fine.

### Context — the context object is the provider

| File | Line | Change |
| --- | --- | --- |
| `web/src/lib/LanguageProvider.tsx` | 42–44 | `<LanguageContext.Provider value={value}>` → `<LanguageContext value={value}>` |
| `web/src/features/mentors/components/HighlightedText.tsx` | 21–23 | `<SearchQueryContext.Provider …>` → `<SearchQueryContext …>` |
| `web/src/features/mentors/components/mentors-list/MentorYearProfile.tsx` | 43–47 | same |

Also in `LanguageProvider.tsx:48–52`: `useContext` on a default-less context now returns `T`
and throws `ContextNotFoundError` when unprovided, so the manual `if (!context) throw` wrapper
can be deleted. `undefined` can never be a context value; use `null` if an optional context is
ever needed.

### Props helpers and JSX types

`splitProps` → `omit` (18 call sites), and intrinsic-element `ComponentProps<'div'>` comes
from `@solidjs/web`, not `solid-js`.

| File | `splitProps` sites | Type sites |
| --- | --- | --- |
| `web/src/components/ui/button.tsx` | 44 | 38 (`ComponentProps<'button'>`) |
| `web/src/components/ui/card.tsx` | 8, 24, 40, 53, 66, 79 | 5, 21, 37, 50, 63, 76 |
| `web/src/components/ui/input.tsx` | 11, 24 | 8, 21 |
| `web/src/components/ui/skeleton.tsx` | 8 | 5 |
| `web/src/components/ui/table.tsx` | 12, 27, 40, 53, 69, 85, 101, 117 | 5, 24, 37, 50, 66, 82, 98, 114 |

```tsx
// 1.x — button.tsx
const [local, rest] = splitProps(props, ['class', 'size', 'type', 'variant']);
<button class={buttonVariants({ class: local.class, size: local.size, variant: local.variant })}
        type={local.type ?? 'button'} {...rest} />;

// 2.0
const rest = omit(props, 'class', 'size', 'type', 'variant');
<button class={buttonVariants({ class: props.class, size: props.size, variant: props.variant })}
        type={props.type ?? 'button'} {...rest} />;
```

`omit(props, ...keys)` returns a reactive proxy with those keys hidden; reads of the omitted
keys go through `props` directly. `mergeProps` → `merge`, with one behavioural trap:
`undefined` is a real value that overrides, rather than "skip this key".

`JSX.Element` no longer comes from `solid-js`:
`HighlightedText.tsx:16`, `MentorsStatsCards.tsx:26`, `MentorYearProfile.tsx:33`. Either
`import type { JSX } from '@solidjs/web'` or, for renderer-neutral children,
`import type { Element } from 'solid-js'`.

### `createResource` — the riskiest item

`web/src/features/mentors/hooks/useMentorsPageState.ts:6, 58–115, 154, 252, 261` uses
`createResource` with custom behaviour that must be preserved:

- generation/request counters and a `disposed` flag;
- analytics for initial/retry/stale/error outcomes, with `info.value !== undefined` on failure;
- errors are captured into a separate `loadError` signal and the last data is retained
  (`return info.value ?? []`), so the UI shows stale rows plus a retry alert;
- `refetch` is wrapped to flag a retry;
- `diplomas.loading` gates "ready" and the skeleton (`lines 252, 261`).

Solid 2 removes `createResource`; the documented replacement is an async `createMemo` plus a
`<Loading>` boundary, with `isPending`/`refresh`. That does not map cleanly onto
"swallow the error, keep the old rows, and expose `loadError`", so the recommended port is an
explicit async state machine rather than a literal `createMemo(async …)`:

```ts
const [diplomas, setDiplomas] = createSignal<Diploma[] | undefined>();
const [loading, setLoading] = createSignal(true);
// keep loadError / isStale / lastUpdatedAt exactly as they are today
const load = async (isRetry: boolean) => { /* fetch, guards, analytics, retain on error */ };

createEffect(() => config.id, () => { void load(false); });
const refetch = () => load(true);
```

If the fetch later needs transition coordination (navigation-blocking writes, optimistic
state), it can be wrapped in `action()`, which takes generator/async-generator functions; a
plain async function is fine while the UI only needs a loading flag.

The alternative is the idiomatic 2.0 shape — `createMemo(async () => …)` under a `<Loading>`
boundary with `isPending`/`refresh` — but that changes the contract: a thrown fetch error
reaches `<Errored>` instead of being retained as stale rows beside a retry alert. Pick one
before starting; this is a product decision, not a syntax change.

### Batching and tests

Setters no longer update reads synchronously: `setX(v); x()` returns the previous value until
the microtask batch flushes, or `flush()` is called. Consequences:

- `web/src/features/mentors/hooks/useMentorsPageState.test.ts:52` uses `createRoot`; a root
  created inside another owner is now disposed with its parent, which is fine here because
  the test root is top-level.
- Any test that sets a signal and immediately asserts on a read needs `flush()` (import from
  `solid-js`) or `await Promise.resolve()`. There are 15 unit test files under `web/src`.
- `batch` is removed; nothing in the app imports it.
- Writing to a signal from a memo/effect compute now throws in dev (see the effects section).

### DOM/JSX details that can bite

- Event handlers must be camelCase; lowercase `on*` is an HTML attribute in 2.0. The app
  already uses `onClick`/`onInput`/`onKeyDown`, so no change.
- `classList` is a compile error; use `class={{…}}` or `class={[…]}`. The app does not use it.
- `on:`, `attr:`, `bool:`, `use:`, `/*@once*/` are removed. None are used.
- `<For>` default still passes the raw item (unchanged). `<Show>`/`<Match>` non-keyed function
  children still receive an **accessor**; the app already uses the accessor form throughout
  (`YearChart.tsx:211-217`, `MentorYearProfile.tsx:93-146` use `entry()`, `count()`, `value()`),
  so no change is needed. Keep calling them — do not switch to `keyed`.

### Unchanged

`createSignal`, `createMemo`, `createUniqueId`, `createContext`, `useContext`, `onCleanup`,
`Show`, `For`, `Switch`, `Match`, `createRoot`/`runWithOwner` keep their names and imports
(only the setter-timing change above applies). `Portal` moved to `@solidjs/web` but is not
used. All of `web/src/features/mentors/*` pure logic (`selectors`, `query-state`, `year-stats`,
`highlight`, `format`, `i18n`) is framework-free and unchanged. `splitProps` is the one helper
that changes name (`omit`), covered above.

`solid-sonner@1.0.0` needs **no code change**: same `Toaster`/`toast` exports, same
`./styles.css`. One test-visible delta: a toast reaches the DOM a microtask after `toast()`
instead of synchronously. `DownloadButton.test.ts` mocks the module, so it is unaffected.

## Verification

Results on `feat/solid-2-migration` (2026-11-22):

| Command | Result |
| --- | --- |
| `npm run check:web` | pass |
| `npm run lint:web` | pass |
| `npm run build` | pass — 2733 modules transformed |
| `npm test` | pass — web 84 passed / 2 skipped; bachelors-api 29; masters-api 19 |
| `cd web && npx playwright test` | pass — 36 tests (18 × desktop + mobile) |
| Dev build under `vite dev` (temporary Playwright config) | pass — deep links, filters, chart, sort, keyboard, back-to-top, retry, toast, `/mentors`, back/forward and SVG casing; no Solid diagnostics |
| Docker build stage on `node:26-alpine` (`npm ci --ignore-scripts` + web build) | pass — Alpine/musl native compiler works (final nginx pull not completed locally) |
| `npm ci` from a clean tree, normal and `--ignore-scripts` | pass — lockfile reproducible |

Reproduce with:

```sh
npm ci
npm run check:web
npm run lint:web
npm test
npm run build
```

End-to-end (router behaviour, aria-current, query sync, download/toast paths):

```sh
cd web
npx playwright install chromium
npm run test:e2e
```

CI runs `npm ci --ignore-scripts` and `node scripts/build-revision.mjs` before Playwright
(`.github/workflows/e2e-web.yaml:34-39`); keep that working — the build imports the generated
revision file.

Worth adding while the migration is open:

- a smoke test that opens the Kobalte `Select`, selects a language, and asserts the document
  language changed — **added** (`web/e2e/smoke.spec.ts`, "changes the interface language from
  the Kobalte select");
- a smoke test that hard-navigates to `/masters` (fresh load, not client-side click) to
  confirm the router still matches the path.

## Risks and open questions

1. **`@lucide/solid` tracks the same 1.77 release line as `lucide-solid`.** Remove the old
   package in the same commit; keeping both installed resolves two Solid runtimes' worth of
   icon code and doubles the bundle.
2. **Kobalte 2.0.0-alpha.5 is accepted but undocumented.** The Select API is identical by
   `.d.ts` comparison; runtime behaviour under Solid 2's batching still needs the smoke test
   listed above.
3. **`@solidjs/vite-plugin` and an explicit `resolve.conditions`.** The plugin injects the
   `solid` condition only when the array is unset; this repo sets it explicitly in
   `vitest.config.ts`. Whether the plugin merges or the explicit list wins is not documented —
   add `'solid'` and verify that Kobalte/sonner resolve from their `solid` entry.
4. **`createResource` replacement is a behaviour change**, not a rename. The retry/error
   retention path needs a deliberate decision.
5. **Router 2.0.1 changelog is not published**; 2.0.0 → 2.0.1 delta is undocumented. Expect
   patch churn.
6. **`@solidjs/web` peer-pins `solid-js ^2.0.3`**, so bump both to exactly `2.0.3` in the
   same commit to avoid a split install.
7. **Manual expansion pruning is now derived, not written back.** A manually expanded mentor
   disappears from the URL while filtered out, but returns if the filter is cleared. The 1.x
   effect pruned it permanently; Solid 2 flags that write-back as `EFFECT_WRITES_OWN_SOURCE`.
   Worth a UX decision before merge.

## Sources

- Solid 2 migration guide: https://github.com/solidjs/solid/blob/main/documentation/solid-2.0/MIGRATION.md
- Solid cheatsheet: https://github.com/solidjs/solid/blob/main/packages/solid/CHEATSHEET.md
- Official migration page: https://docs.solidjs.com/migration/from-solid-1
- Solid Router migration: https://docs.solidjs.com/migration/from-solid-router
- Router README (links, config, typed paths): https://github.com/solidjs/solid-router#readme
- Vite plugin: https://github.com/solidjs/solid-vite-plugin#readme
- Kobalte Select: https://kobalte.dev/docs/core/components/select
- solid-sonner: https://github.com/wobsoriano/solid-sonner#readme
- lucide-solid package source: https://cdn.jsdelivr.net/npm/lucide-solid@1.77.0/dist/source/Icon.jsx
- `@lucide/solid` (Solid 2 package): https://www.npmjs.com/package/@lucide/solid
- lucide monorepo package: https://github.com/lucide-icons/lucide/tree/main/packages/solid
