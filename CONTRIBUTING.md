# Contributing

## Requirements

- Node v20.14.0 (see `.nvmrc`). Use nvm or fnm to select it:

  ```bash
  nvm use    # or: fnm use
  ```

- npm dependencies:

  ```bash
  npm install
  ```

## Building

The build compiles everything into `dist/` — this is the directory Foundry loads as the system.

| Command | What it does |
| --- | --- |
| `npm run dev` | Development watch. Builds everything except compendium packs and re-runs the relevant task when source files change (SCSS, YAML, module code, templates, assets). |
| `npm run build` | Full production build, including compendium packs. This is what CI runs. |
| `npm run build:dev` | Full build in development mode (readable Vue bundle, dev Vue runtime with warnings). |
| `npm run clean` | Remove built files from `dist/`. |
| `npm run content:pack` | Compile `src/packs/` YAML into `dist/packs/` LevelDB packs. |
| `npm run content:unpack` | Extract `dist/packs/` packs back into `src/packs/` YAML. |
| `npm run lint` | ESLint over `.js`, `.cjs`, `.mjs`, and `.vue` files (`lint:fix`, `lint:errors`, and `lint:warnings` variants exist). |

Notes:

- Development mode ships the Vue development runtime (includes warnings); production builds ship the minified runtime.
- Compendium packs are only compiled when requested (full builds set `BUILD_PACKS=1` internally) because packing is slow relative to everything else. If you are editing pack content, run `npm run content:unpack` first to make sure `src/packs/` matches what is in dist, edit the YAML, then `npm run content:pack`.
- The system manifest enables Foundry's hot reload for `styles/`, `lang/`, and `templates/` — CSS, HTML/HBS, and JSON changes show up without a client reload. JavaScript and Vue component changes require reloading the Foundry client.

## Connecting to Foundry

Symlink `dist/` into your Foundry install's `systems/` directory so Foundry loads your local build:

```bash
ln -s /path/to/this/repo/dist /path/to/foundry/Data/systems/grimwild
```

Optionally, make Foundry's client API available to your editor for typedefs and API referencing:

1. Copy `example.foundry-config.yaml` to `foundry-config.yaml` and set `installPath` to your Foundry install location.
2. Run `npm run symlinks:create`. This creates a `foundry/` directory in the repo containing symlinks into the install (`client/`, `common/`, `lang/`, and its `tsconfig.json`). It handles both Node installs and Electron installs where the app is nested under `resources/app`.
3. Copy `example.jsconfig.json` to `jsconfig.json`. This wires up editor intellisense against those symlinked sources and the type stubs in `tools/foundry.d.ts`.

Both `foundry-config.yaml` and `jsconfig.json` are gitignored — they are local-only developer settings.

## AI/LLM Assistance

This project follows a policy similar to [Foundry's AI policy](https://foundryvtt.com/article/ai-policy/): AI assistance is allowed for code. However, the developer **must** understand anything they submit and **must** be prepared to explain it if questioned during code review.
