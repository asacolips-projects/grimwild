# AGENTS.md

## Setup commands
- Install: `npm install` (may require `nvm use` or `fnm use` depending on developer machine)
- Build: `npm run build:dev` run vite build
- Lint: `npm run lint`
- Tests are not included due to the nature of FoundryVTT. Relay relevant testing instructions to the user depending on what changes were made (such as open Foundry instance, open character sheet, test stat rolls).

## Code style
- Comply with linting rules in eslint.config.json
- New classes and functions should have a JSDoc comment on them
- Don't overly comment code, but do add brief comments in code to clarify what's happening
- Always ensure new strings are in src/lang/en.yml rather than hardcoding them
- Avoid overly terse code. Ternaries are fine, but code should always be straightforward to understand at a glance
- In general, err towards how the code is currently written in the codebase and be consistent with that
- Always localize strings in the UI. These are translated with `game.i18n.localize('GRIMWILD.Some.key', {someVar: 'foo'});`. Do NOT attempt to string concatenate variables in directly; grammar is different in each language, so something like `Some string ${someVar}` is incorrect; it MUST go through game.i18n.localize(). Localization strings support variable placeholders, such as if the 'GRIMWILD.Some.key' example above had 'Some string {someVar}' as its value. Exception: purely data structure concatenation is fine, like `Label: ${value} / ${maxValue}` or `Label: ${value}`. What you want to avoid is concenation in sentence/phrase format.

## Repo structure
- dist/ for the final build
- src/ for the working code
- src/module/ for most JS
- src/lang/ for localization files
- src/packs/ for compendium content
- src/styles/ for scss. Vue <style> tags are used sparingly, preferring these global css files instead
- src/templates/ handlebars templates. Typically used in locations where we're not using Vue, such as chat cards.
- src/vue/ for vue components
- release-notes/{tag}.md for markdown release notes associated with new releases
- scripts/ and tools/ for build tooling
- foundry/ for a symlinked copy of the current Foundry version API. Use this as your source of truth when you need to understand something about Foundry specifically
- .github/ for actions workflow

## Foundry API
The `foundry/` directory is a symlinked copy of the current Foundry version (v14) and is the source of truth for Foundry APIs - read it rather than guessing or citing outdated web references. Layout and the pieces this project touches most:

- foundry/client/config.mjs documents the `CONFIG` and `CONST` globals. `CONFIG.GRIMWILD` is our system's entry there
- foundry/client/applications/api/application.mjs - ApplicationV2 base class: DEFAULT_OPTIONS merging, the render pipeline (`_prepareContext` → `_renderHTML` → `_replaceHTML`), actions and header controls, the form submission pipeline, and the close/`_tearDown` lifecycle. Our Vue mixin builds on this contract; see VUE-RENDERER.md
- foundry/client/applications/api/document-sheet.mjs - DocumentSheetV2, the base class for document sheets (form tag, ownership checks, sheet config)
- foundry/client/applications/sheets/ - core sheet classes we extend or reference, e.g. actor-sheet.mjs (ActorSheetV2) and item-sheet.mjs (ItemSheetV2)
- foundry/client/applications/ux/ - UI helpers: DragDrop, TextEditor (`enrichHTML` for inline enrichment), ContextMenu, SearchFilter
- foundry/client/applications/elements/ - custom elements our sheets use directly: HTMLProseMirrorElement and HTMLColorPickerElement, plus FilePicker and others
- foundry/client/documents/ - client-side document classes (Actor, Item, ActiveEffect, ChatMessage, RollTable...); foundry/common/documents/ holds the isomorphic base classes they extend
- foundry/common/abstract/ - Document, DataModel, and EmbeddedCollection. Document updates flow through DataModel validation here; embedded collections (`actor.items`, `actor.effects`) are Map-backed (Collection extends Map, see foundry/common/utils/collection.mjs)
- foundry/common/data/fields.mjs - schema field classes (StringField, NumberField, ArrayField, SchemaField...). Our system data schemas are declared with these; `_shared-actions.mjs` derives default values from field constructors
- foundry/common/utils/helpers.mjs - the `foundry.utils` helpers (getProperty, setProperty, mergeObject, deepClone, etc.)
- foundry/client/dice/roll.mjs - Roll and dice terms; our die-pool classes subclass these
- foundry/client/hooks.mjs - the Hooks registry (`Hooks.on`, `Hooks.callAll`); document updates fire lifecycle hooks that drive sheet re-renders
- foundry/lang/ - core English localization, for checking whether a core string key exists

Globals available at runtime without imports: `game`, `ui`, `canvas`, `Hooks`, `CONFIG`, `CONST`, and the `foundry` namespace (`foundry.utils`, `foundry.applications`, `foundry.documents`, `foundry.data`). Our Vue templates additionally get `game`, `CONFIG`, `CONST`, and `foundry` as global properties from the mixin (see VUE-RENDERER.md).

## Project Quirks
- This project takes advantage of how Foundry supports custom rendering engines for its character sheets, only including Handlebars in core by default. This project uses a clientside build of Vue to allow Vue to be used as the sheet renderer. See VUE-RENDERER.md for reference on the implementation
- Foundry uses JSON for its manifests and localization, but I prefer YAML, and so our files are written in YAML and converted during build time