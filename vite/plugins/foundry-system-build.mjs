import path from "node:path";
import chokidar from "chokidar";
import { WATCH_GLOBS } from "../../scripts/build/constants.mjs";
import { runBuildTasks, runDevTasks } from "../../scripts/build/index.mjs";
import { copyChangedPaths } from "../../scripts/build/copy.mjs";
import { compileScss } from "../../scripts/build/scss.mjs";
import { compileYaml } from "../../scripts/build/yaml.mjs";
import { destPathFor, log, matchesGlobs, removeFile, resolveFromRoot } from "../../scripts/build/utils.mjs";

const DEBOUNCE_MS = 150;

/**
 * Create a debounced wrapper that delays calling `fn` until `wait` ms have passed without another call.
 * @param {Function} fn     Function to debounce.
 * @param {number} wait     Delay in milliseconds.
 * @returns {Function}      Debounced function.
 */
function debounce(fn, wait) {
	let timeout;
	return (...args) => {
		clearTimeout(timeout);
		timeout = setTimeout(() => fn(...args), wait);
	};
}

/**
 * The vite plugin: builds the system via the scripts/build tasks, and in
 * watch mode incrementally re-runs them as source files change.
 *
 * @param {object} [options]
 * @param {boolean} [options.prod=false]   Whether this is a production build.
 * @param {boolean} [options.packs=false]  Whether to also clean and compile compendium packs.
 * @returns {import("vite").Plugin}        The Vite plugin.
 */
export function foundrySystemBuild(options = {}) {
	const { prod = false, packs = false } = options;
	let watcher;
	let initialBuildDone = false;
	let isWatch = false;

	/** Run the full build once, packs included when configured. */
	async function runInitialBuild() {
		if (packs) {
			await runBuildTasks({ prod, packs: true });
		}
		else {
			await runDevTasks({ prod });
		}
		initialBuildDone = true;
	}

	/** Start (once) the chokidar watchers that re-run build tasks on change. */
	function startWatchers() {
		if (watcher) return;

		const runScss = debounce(async () => {
			try {
				await compileScss({ prod });
			}
			catch (error) {
				log("watch:scss", error.message);
			}
		}, DEBOUNCE_MS);

		const runYaml = debounce(async () => {
			try {
				await compileYaml();
			}
			catch (error) {
				log("watch:yaml", error.message);
			}
		}, DEBOUNCE_MS);

		const pendingCopy = new Set();
		const runCopy = debounce(async () => {
			const changed = [...pendingCopy];
			pendingCopy.clear();
			try {
				await copyChangedPaths(changed, { prod });
			}
			catch (error) {
				log("watch:copy", error.message);
			}
		}, DEBOUNCE_MS);

		// chokidar 4+ no longer expands globs, so watching the glob patterns from
		// WATCH_GLOBS directly matches nothing. Watch the src tree instead and let
		// matchesGlobs below decide which task (if any) a change belongs to.
		watcher = chokidar.watch([resolveFromRoot("src")], {
			ignoreInitial: true
		});

		watcher.on("all", (event, filePath) => {
			const relativePath = path.relative(resolveFromRoot("."), filePath).replaceAll("\\", "/");

			// Directory events have no dist artifact of their own; leftover empty
			// directories in dist are harmless, so skip them.
			if (event === "addDir" || event === "unlinkDir") return;

			if (matchesGlobs(relativePath, WATCH_GLOBS.scss)) {
				// compileScss wipes dist/styles and recompiles every entry point on
				// each run, so deletions need no extra handling.
				runScss();
				return;
			}

			if (matchesGlobs(relativePath, WATCH_GLOBS.yaml)) {
				// compileYaml mirrors the src tree into dist with a .json extension,
				// so a deleted yaml leaves a stale json behind.
				if (event === "unlink") {
					removeFile(destPathFor(filePath).replace(/\.(yaml|yml)$/, ".json"));
					return;
				}
				runYaml();
				return;
			}

			if (matchesGlobs(relativePath, WATCH_GLOBS.copy)) {
				// unlink paths are queued too: copyChangedPaths removes the dist
				// copy when the source no longer exists.
				pendingCopy.add(filePath);
				runCopy();
			}
		});

		log("watch", "watching non-Vue source files");
	}

	return {
		name: "foundry-system-build",
		apply: "build",

		configResolved(config) {
			isWatch = Boolean(config.build.watch);
		},

		async buildStart() {
			if (!initialBuildDone) {
				await runInitialBuild();
			}

			if (isWatch) {
				startWatchers();
			}
		},

		buildEnd() {
			if (!isWatch && watcher) {
				watcher.close();
				watcher = null;
			}
		}
	};
}
