import fs from "fs-extra";
import gulp from "gulp";
import prefix from "gulp-autoprefixer";
import sass from "gulp-dart-sass";
import sourcemaps from "gulp-sourcemaps";
import yaml from "gulp-yaml";
import buffer from "vinyl-buffer";
import source from "vinyl-source-stream";
import path from 'path';
import shell from 'gulp-shell';
import mergeStream from 'merge-stream';

import rollupStream from "@rollup/stream";

import rollupConfig from "./rollup.config.mjs";

/** ******************/
/*  CONFIGURATION    */
/** ******************/

const packageId = "grimwild";
const sourceDirectory = "./src";
const distDirectory = "./dist";
const stylesDirectory = `${sourceDirectory}/styles`;
const stylesExtension = "scss";
const sourceFileExtension = "mjs";
const staticFiles = ["module", "lib", "assets", "templates"];
const systemYaml = ["src/**/*.{yml, yaml}"];

// Constants.
const PACK_SRC = `${sourceDirectory}/packs`;
const PACK_DEST = `${distDirectory}/packs`;

/* ----------------------------------------- */
/*  Compile Compendia
/* ----------------------------------------- */

/**
 * Gulp Task: Compile packs from the yaml source content to .db files.
 */
function compilePacks() {
  // Every folder in the src dir will become a compendium.
  const folders = fs.readdirSync(PACK_SRC).filter((file) => {
    return fs.statSync(path.join(PACK_SRC, file)).isDirectory();
  });

  const packs = folders.map((folder) => {
	console.log(folder);
    return gulp.src(path.join(PACK_SRC, folder))
      .pipe(shell([
        `fvtt package --id grimwild --type System pack <%= file.stem %> -c --yaml --in "<%= file.path %>" --out ${PACK_DEST}`
      ]))
  })

  return mergeStream.call(null, packs);
}

/* ----------------------------------------- */
/*  Export Compendia
/* ----------------------------------------- */

/**
 * Gulp Task: Export Packs
 *
 * This gulp task will load all compendium .db files from the dest directory,
 * load them into memory, and then export them to a human-readable YAML format.
 */
function extractPacks() {
  // Start a stream for all db files in the packs dir.
  const packs = gulp.src(`${PACK_DEST}/*`)
    .pipe(shell([
      `fvtt package --id grimwild --type System unpack <%= file.stem %> -c --yaml --in ${PACK_DEST} --out ${PACK_SRC}/<%= file.stem %>`
    ]));

  // Call the streams.
  return mergeStream.call(null, packs);
}


/** ******************/
/*      BUILD       */
/** ******************/

let cache;

/**
 * Build the distributable JavaScript code
 */
function buildCode() {
	return rollupStream({ ...rollupConfig(), cache })
		.on("bundle", (bundle) => {
			cache = bundle;
		})
		.pipe(source(`${packageId}.js`))
		.pipe(buffer())
		.pipe(sourcemaps.init({ loadMaps: true }))
		.pipe(sourcemaps.write("."))
		.pipe(gulp.dest(`${distDirectory}/module`));
}

/**
 * Build style sheets
 */
function buildStyles() {
	return gulp.src([`${stylesDirectory}/**/*.${stylesExtension}`], { base: `${stylesDirectory}/src` })
		.pipe(sourcemaps.init({ loadMaps: true }))
		.pipe(sass({
			outputStyle: "compressed",
			silenceDeprecations: ['legacy-js-api', 'import'],
		}).on("error", sass.logError))
		.pipe(prefix({
			cascade: false
		}))
		.pipe(sourcemaps.write("."))
		.pipe(gulp.dest(`${distDirectory}/styles/dist`));
}

/**
 *
 */
function buildYaml() {
	return gulp.src(systemYaml)
		.pipe(yaml({ space: 2 }))
		.pipe(gulp.dest("./dist"));
}

/**
 * Copy static files
 */
async function copyFiles() {
	for (const file of staticFiles) {
		if (fs.existsSync(`${sourceDirectory}/${file}`)) {
			await fs.copy(`${sourceDirectory}/${file}`, `${distDirectory}/${file}`);
		}
	}
	if (fs.existsSync(`node_modules/vue/dist/vue.esm-browser.js`)) {
		await fs.copy(`node_modules/vue/dist/vue.esm-browser.js`, `${distDirectory}/lib/vue.esm-browser.js`);
	}
}

/**
 * Watch for changes for each build step
 */
export function watch() {
	gulp.watch(`${sourceDirectory}/**/*.{yml, yaml}`, { ignoreInitial: false }, buildYaml);
	// gulp.watch(`${sourceDirectory}/**/*.${sourceFileExtension}`, { ignoreInitial: false }, buildCode);
	gulp.watch(`${stylesDirectory}/**/*.${stylesExtension}`, { ignoreInitial: false }, buildStyles);
	gulp.watch(
		staticFiles.map((file) => `${sourceDirectory}/${file}`),
		{ ignoreInitial: false },
		copyFiles,
	);
}

export const build = gulp.series(clean, gulp.parallel(compilePacks, buildYaml, /*buildCode,*/ buildStyles, copyFiles));

export const pack = gulp.series(compilePacks);
export const unpack = gulp.series(extractPacks);

/** ******************/
/*      CLEAN       */
/** ******************/

/**
 * Remove built files from `dist` folder while ignoring source files
 */
export async function clean() {
	const files = [...staticFiles, "assets", "lib", "module", "packs", "lang", "styles", "templates", "system.json"];

	// if (fs.existsSync(`${stylesDirectory}/src/${packageId}.${stylesExtension}`)) {
	// 	files.push("styles");
	// }

	// console.log(" ", "Files to clean:");
	// console.log("   ", files.sort().join("\n    "));

	for (const filePath of files) {
		await fs.remove(`${distDirectory}/${filePath}`);
	}
}
