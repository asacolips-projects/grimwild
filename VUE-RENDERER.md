# Vue Renderer

Grimwild renders its document sheets with Vue 3 instead of Foundry's Handlebars. Foundry supports custom render engines through the ApplicationV2 rendering contract, so the system ships a small mixin (`VueRenderingMixin`) that implements that contract with a mounted Vue application. This document describes how Foundry sheets work, how the Vue layer is built on top of them, and how the build produces the pieces.

## How Foundry sheets render (ApplicationV2)

Source of truth: `foundry/client/applications/api/application.mjs` and `foundry/client/applications/api/document-sheet.mjs` (symlinked under `foundry/`).

Every render runs the same pipeline:

1. `_prepareContext(options)` — build the render context (plain data for templates).
2. `_renderHTML(context, options)` — awaited on every render; core's Handlebars mixin returns HTML strings here.
3. `_replaceHTML(result, content, options)` — receives the application's content element; Handlebars swaps `innerHTML` on every render.

The first render additionally builds the window frame (`_renderFrame`), attaches frame listeners (`_attachFrameListeners`), and registers the app in `foundry.applications.instances`. `render()` and `close()` both queue through the application's semaphore, so they execute serially. Closing runs `_tearDown(options)` after the minimize animation; anything cleaned up in `close()` should also be idempotent for `_tearDown`.

Document sheets are `<form>` elements by default (`tag: "form"`). Core's form pipeline is driven by options:

- `form.submitOnChange` — a `change` listener submits the whole form; submission collects every **named** element into `FormData` and hands it to the form handler, which calls `document.update()`. Unnamed elements are ignored.
- `form.submitOnClose` — submits when the sheet closes.

Core provides other machinery the Vue layer leans on:

- `ActorSheetV2` exposes a cached `_dragDrop` getter (a single DragDrop bound in `_onRender`); `DragDrop.bind()` assigns `ondragstart`/`ondrop` properties, so re-binding the same elements is safe.
- `HTMLProseMirrorElement.create({ name, value, enriched, ... })` creates a ProseMirror editor element. The `enriched` HTML is captured at creation to populate the collapsed preview — setting innerHTML afterwards does nothing. `collaborate: true` keeps an open editor synced with document updates.
- Custom elements participate in form submission through their `name` attribute.

## The Vue rendering mixin

`src/module/sheets/_vue/_vue-application-mixin.mjs` — wraps any ApplicationV2 base class and implements the renderer contract with Vue:

- **Mount once.** `_renderHTML` synchronizes the fresh context into a `reactive({})` store (`syncVueContext`); `_replaceHTML` mounts a Vue app into the content element only if `this.vueApp` is null. Every later render updates the store, and Vue's reactivity updates the DOM — the mounted DOM is never replaced. This is the core design property: ProseMirror editors, focus, and component-local state all survive re-renders.
- **Context sync rules** (`syncVueContext`): keys removed from the context are deleted from the store; plain objects, arrays, Maps, and Sets are shallow-cloned so a fresh identity triggers reactivity even when the source reference is unchanged (spreading a Map/Set would destroy its contents, hence new `Map(value)`/`Set(value)`); Documents, DataFields, and DOM nodes pass through by reference wrapped in `markRaw` (identity stays stable, Vue skips deep-proxying); primitives pass as-is.
- **Mount failure recovery.** The Vue app instance is only assigned after `mount()` succeeds; on failure the catch resets all instance state and rethrows. Core tears the frame down, and the next render retries from scratch instead of every later render no-oping into an empty frame.
- **Teardown.** `_tearDown` unmounts the Vue app (authoritative cleanup on the close path); `close()` additionally submits the form when `form.submitOnClose` is set — guarded so a document deleted while its sheet is open doesn't submit — and unmounts in a `finally` even if submission fails.
- The sheet declares its Vue surface through `vueParts`: a map of custom-element tag → `{ component, template }`. In practice each sheet registers one root component (e.g. `<document-sheet :context="context">`) and the component tree lives in `src/vue/`.
- `game`, `CONFIG`, `CONST`, and `foundry` are exposed as global properties, so templates can use them directly (e.g. `CONST.DocumentTypes`); the raw document instance is available to components via `inject("rawDocument")`.

Because the store is a clone-and-sync model, **the context is a read model**: components should never treat mutations of `context.*` as persistence. v-model'd inputs persist through the form pipeline (below); anything else must write documents explicitly.

## Sheet classes and the input contract

- `src/module/sheets/_vue/_base-vue-actor-sheet.mjs` / `_base-vue-item-sheet.mjs` — shared actions (embedded item/effect view, create, delete, toggle; image editing; compendium import). The actor base overrides the `_dragDrop` getter to drag `[data-drag]` elements (Vue markup) using core's drag handlers, and tracks item expansion state in `activeItems` (a full re-render syncs it).
- `src/module/sheets/_vue/_shared-actions.mjs` — `createArrayEntry`/`deleteArrayEntry` push/splice a schema-declared array field and update the document in one step (driven by `data-field`/`data-field-type`/`data-key` dataset attributes), plus `rollPoolDice` for die-pool rolls with Dice So Nice waiting.
- Concrete sheets: `actor-sheet-vue.mjs` (characters), `actor-monster-sheet-vue.mjs` (monsters, linked challenges), `item-sheet-vue.mjs` (talent, challenge, arcana). They set `form: { submitOnChange: true, submitOnClose: true }` and are registered type-scoped in `src/module/grimwild.mjs`; the legacy Handlebars sheets remain registered as non-default alternatives.
- Each `_prepareContext` builds the context (document data, `system`, roll data, `CONFIG.GRIMWILD`, schema `fields`, enriched `editors`, `tabs`) and fires a `...PrepareContext` hook (`grimwildActorSheetVuePrepareContext`, `grimwildActorMonsterSheetVuePrepareContext`, `grimwildItemSheetVuePrepareContext`) for external mutation.

**Input persistence has two paths, and mixing them causes double-writes:**

1. **Form submission.** Inputs carry both `v-model` (into the cloned context, for instant UI) and a `name="system.path"` attribute. Core's whole-form submit collects named elements and updates the document; the subsequent re-render syncs the store with saved data.
2. **Direct writes.** Inputs that write documents themselves — trackers, checkboxes — have **no `name`** so the form ignores them. Number/select inputs use `data-action-change="<action>"` (a delegated `change` listener installed in `_attachFrameListeners`, dispatched through `options.changeActions`); click toggles use `data-action="<action>"` (core's click delegation). Checkbox display uses one-way `:checked` plus a change action that writes `target.checked`.

## Editors and custom elements

- `context.editors` maps field paths to enriched HTML prepared in `_enrichFields` (document fields for biography/notes; item fields for talent/arcana descriptions). Editable viewers additionally get `name`/`value`/`height` for editor creation.
- `src/vue/components/parts/Prosemirror.vue` owns the editor element: created once per sheet via `HTMLProseMirrorElement.create()` (passing `enriched` so the collapsed preview renders), recreated when its enriched preview changes while collapsed, left untouched while open (`collaborate` keeps it synced), removed when the sheet loses edit permission or unmounts. Non-editable viewers get static enriched HTML via `v-html`.
- Monster sensory color pickers follow the same ownership pattern: the context provides plain `{ name, value }` metadata under `context.customElements`, and `ColorPicker.vue` creates the real `HTMLColorPickerElement` once on mount.

## UI state that must survive re-renders

Anything Vue keeps in the context would be reset by a sync, so durable UI state is component-local:

- Tabs: `src/vue/composables/useTabs.mjs` copies `context.tabs` into a local reactive object; `Tabs.vue`/`Tab.vue` manage the active tab from there.
- Item expansion (`activeItems`) lives on the sheet instance and is re-synced by the explicit `render()` in `_toggleItem`.
- Shared item rows (`ItemRow.vue`) render talents/arcana via a `#description` slot; components are keyed by document `id`, never by array index.

## Build

`vite.config.mjs` + `vite/plugins/foundry-system-build.mjs` + `scripts/build/`. See also `CONTRIBUTING.md` for the command list.

- **Vue bundle.** Vite lib mode builds `src/vue/index.mjs` → `dist/vue/components.vue.es.mjs` (ES only). Module code is **not** bundled — it is copied verbatim into `dist/module/`, so source import paths are written to resolve in the dist layout (e.g. `../../vue/components.vue.es.mjs` from `src/module/sheets/`).
- **Vue runtime is vendored, not bundled.** `vue` is external; the runtime file is copied verbatim from `node_modules` into `dist/lib/` — `vue.esm-browser.js` (dev, with warnings) or `vue.esm-browser.prod.js` (prod, minified). The bundle's import is rewritten per mode (`output.paths`), and the prod copy step rewrites the mixin's import to the prod filename. Both entry points therefore resolve to the **same file** — exactly one Vue instance per build, which the reactive store depends on.
- **Non-Vue tasks** run through the plugin's build hooks (and incrementally via chokidar in watch mode): SCSS compile, YAML → JSON (`src/system.yml`, `src/lang/en.yml`, pack templates), static copy, Vue runtime copy. Compendium packs compile on full builds and are skipped by the watch loop (`BUILD_PACKS=1`/`0` forces a behavior).
- **Mode differences.** Dev: expanded CSS with working source maps (sass map chained through postcss/autoprefixer with a `sourceMappingURL` annotation), unminified Vue bundle with maps, dev Vue runtime. Prod: compressed CSS and bundle, no source maps, minified Vue runtime.
- After building, symlink or copy `dist/` into Foundry's `systems/grimwild` and reload the client — JS and Vue changes need a client reload even though CSS/lang/templates hot reload (see `CONTRIBUTING.md`).
