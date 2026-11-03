import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as sass from "sass";
import autoprefixer from "autoprefixer";
import postcss from "postcss";
import { SYSTEM_SCSS } from "./constants.mjs";
import { ensureDir, globFiles, log, resolveFromRoot } from "./utils.mjs";

const LOAD_PATHS = [resolveFromRoot("src/styles")];

/**
 * Check whether an SCSS file is an entry point (not a partial starting with "_").
 * @param {string} filePath   SCSS file path.
 * @returns {boolean}         True if the file should be compiled on its own.
 */
function isEntryPoint(filePath) {
	return !path.basename(filePath).startsWith("_");
}

/**
 * Compile SCSS entry points to autoprefixed CSS in dist/styles, mirroring the
 * src/styles tree. Development builds emit expanded, source-mapped CSS; the
 * compressed style is reserved for production, whose builds ship no maps.
 * @param {object} [options]
 * @param {boolean} [options.prod=false]  Whether this is a production build.
 * @returns {Promise<void>}
 */
export async function compileScss({ prod = false } = {}) {
	const files = (await globFiles(SYSTEM_SCSS)).filter(isEntryPoint);
	const outDir = resolveFromRoot("dist/styles");

	if (fs.existsSync(outDir)) {
		fs.rmSync(outDir, { recursive: true, force: true });
	}
	ensureDir(outDir);

	let compiled = 0;
	let failed = 0;

	for (const file of files) {
		const relativePath = path.relative(resolveFromRoot("src/styles"), file);
		const outFile = path.join(outDir, relativePath.replace(/\.scss$/, ".css"));
		ensureDir(path.dirname(outFile));

		let result;
		try {
			result = sass.compile(file, {
				// Compressed output is a single line, and postcss composes source
				// maps against it with off-by-one source lines once autoprefixer's
				// insertions shift the line's columns. Expanded output keeps one
				// generated line per declaration, which composes exactly - and is
				// the nicer devtools view anyway. Compression only matters for
				// production, which ships no maps.
				style: prod ? "compressed" : "expanded",
				sourceMap: !prod,
				sourceMapIncludeSources: true,
				loadPaths: LOAD_PATHS,
				silenceDeprecations: ["legacy-js-api", "import"]
			});
		}
		catch (error) {
			failed += 1;
			log("scss", error.toString());
			continue;
		}

		// Chain the sass source map through postcss as `prev`, so mappings are
		// composed through autoprefixing instead of being invalidated by it, and
		// so postcss appends the sourceMappingURL annotation that makes DevTools
		// load the map. Production builds compile without a map, leaving nothing
		// to chain.
		const prefixed = await postcss([autoprefixer({ cascade: false })]).process(
			result.css,
			{
				from: file,
				to: outFile,
				map: result.sourceMap
					? { inline: false, annotation: true, prev: result.sourceMap }
					: undefined
			}
		);

		fs.writeFileSync(outFile, prefixed.css);

		if (prefixed.map) {
			const map = prefixed.map.toJSON();
			// PostCSS emits sources for imported partials as absolute file URLs;
			// normalize everything to paths relative to the map itself so the map
			// stays resolvable and portable. Mappings reference sources by index,
			// so rewriting the strings in place is safe.
			const mapDir = path.dirname(outFile);
			map.sources = map.sources.map((source) => (source.startsWith("file://")
				? path.relative(mapDir, fileURLToPath(source)).replaceAll("\\", "/")
				: source));
			fs.writeFileSync(`${outFile}.map`, JSON.stringify(map));
		}

		compiled += 1;
	}

	const summary = failed
		? `compiled ${compiled} files (${failed} failed)`
		: `compiled ${compiled} files`;
	log("scss", summary);
}
