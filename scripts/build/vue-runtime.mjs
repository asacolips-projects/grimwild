import fs from "node:fs";
import path from "node:path";
import { ROOT, VUE_RUNTIME_DEVELOPMENT, VUE_RUNTIME_DEST_DEVELOPMENT, VUE_RUNTIME_DEST_PRODUCTION, VUE_RUNTIME_PRODUCTION } from "./constants.mjs";
import { ensureDir, log, resolveFromRoot } from "./utils.mjs";

/**
 * Copy the Vue browser runtime from node_modules into dist/lib. The
 * development build carries runtime warnings and is used for development
 * builds; production builds ship the minified runtime, and the prod copy step
 * rewrites module imports to match its file name.
 *
 * @param {object} [options]
 * @param {boolean} [options.prod=false]  Whether this is a production build.
 * @returns {Promise<void>}
 */
export async function copyVueRuntime({ prod = false } = {}) {
	const source = path.join(ROOT, prod ? VUE_RUNTIME_PRODUCTION : VUE_RUNTIME_DEVELOPMENT);
	const dest = resolveFromRoot(prod ? VUE_RUNTIME_DEST_PRODUCTION : VUE_RUNTIME_DEST_DEVELOPMENT);
	ensureDir(path.dirname(dest));
	fs.copyFileSync(source, dest);
	log("vue-runtime", `copied ${path.basename(source)}`);
}
