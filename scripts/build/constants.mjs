import path from "node:path";

export const ROOT = process.cwd();

export const PACKAGE_ID = "grimwild";

export const PACK_SRC = path.join(ROOT, "src/packs");
export const PACK_DEST = path.join(ROOT, "dist/packs");

export const SYSTEM_SCSS = ["src/styles/**/*.scss"];

export const SYSTEM_YAML = [
	"src/**/*.{yaml,yml}",
	"!src/packs/**/*.{yaml,yml}"
];

export const SYSTEM_COPY = [
	"src/module/**/*",
	"src/assets/**/*",
	"src/lib/**/*",
	"src/templates/**/*"
];

// The Vue runtime is vendored into dist/lib. The compiled Vue bundle's import
// of it is rewritten per build mode by vite (see vite.config.mjs), and the
// prod copy step rewrites module imports the same way (see copy.mjs), so the
// destination file name is mode-dependent: exactly one runtime ships per
// build.
export const VUE_RUNTIME_DEST_DEVELOPMENT = path.join("dist", "lib", "vue.esm-browser.js");
export const VUE_RUNTIME_DEST_PRODUCTION = path.join("dist", "lib", "vue.esm-browser.prod.js");
export const VUE_RUNTIME_DEVELOPMENT = "node_modules/vue/dist/vue.esm-browser.js";
export const VUE_RUNTIME_PRODUCTION = "node_modules/vue/dist/vue.esm-browser.prod.js";

// dist paths removed by the clean task. The vite bundle output (dist/vue) is
// managed by vite itself.
export const CLEAN_PATHS = [
	"assets",
	"lang",
	"lib",
	"module",
	"packs",
	"styles",
	"templates",
	"system.json"
];

export const WATCH_GLOBS = {
	scss: SYSTEM_SCSS,
	yaml: SYSTEM_YAML,
	copy: SYSTEM_COPY
};
