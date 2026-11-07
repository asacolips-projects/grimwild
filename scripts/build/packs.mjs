import fs from "node:fs";
import path from "node:path";
import { compilePack, extractPack } from "@foundryvtt/foundryvtt-cli";
import { PACK_DEST, PACK_SRC } from "./constants.mjs";
import { log } from "./utils.mjs";

/**
 * Delete the compiled compendium packs in dist/packs.
 * @returns {Promise<void>}
 */
export async function cleanPacks() {
	if (fs.existsSync(PACK_DEST)) {
		fs.rmSync(PACK_DEST, { recursive: true, force: true });
	}
	log("packs", "cleaned dist/packs");
}

/**
 * Compile each YAML pack folder in src/packs into a LevelDB pack in dist/packs.
 *
 * Uses the foundryvtt-cli API directly instead of shelling out to the fvtt
 * binary. Recursion is required so that foldered packs (subdirectories with
 * _Folder.yml files, e.g. the gwce packs) pick up their entries.
 * @returns {Promise<void>}
 */
export async function compilePacks() {
	const folders = fs.readdirSync(PACK_SRC).filter((entry) => {
		return fs.statSync(path.join(PACK_SRC, entry)).isDirectory();
	});

	for (const folder of folders) {
		await compilePack(path.join(PACK_SRC, folder), path.join(PACK_DEST, folder), {
			yaml: true,
			recursive: true,
			log: true
		});
	}

	log("packs", `compiled ${folders.length} compendia`);
}

/**
 * Extract each compiled pack in dist/packs back to YAML in src/packs.
 *
 * The destination is cleaned first so removed entries don't linger, and the
 * extracted directory structure mirrors the compendium folders.
 * @returns {Promise<void>}
 */
export async function extractPacks() {
	const entries = fs.readdirSync(PACK_DEST);

	for (const entry of entries) {
		const stem = path.parse(entry).name;
		await extractPack(path.join(PACK_DEST, entry), path.join(PACK_SRC, stem), {
			yaml: true,
			clean: true,
			folders: true,
			log: true
		});
	}

	log("packs", `extracted ${entries.length} compendia`);
}
