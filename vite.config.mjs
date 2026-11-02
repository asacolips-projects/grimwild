import path from "node:path";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { foundrySystemBuild } from "./vite/plugins/foundry-system-build.mjs";

const ROOT = import.meta.dirname;

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
	const prod = mode === "production";
	const packs = process.env.BUILD_PACKS === "1";

	return {
		plugins: [
			vue({
				template: {
					compilerOptions: {
						isCustomElement: (tag) => ["prose-mirror"].includes(tag)
					}
				}
			}),
			foundrySystemBuild({ prod, packs })
		],
		resolve: {
			alias: {
				"@/": `${path.resolve(ROOT, "src/vue")}/`,
				"@src/": `${path.resolve(ROOT, "src")}/`
			}
		},
		build: {
			sourcemap: true,
			minify: prod,
			outDir: "./dist/vue",
			lib: {
				entry: path.resolve(ROOT, "src/vue/index.mjs"),
				name: "vueComponents",
				fileName: "components.vue.es"
			},
			rollupOptions: {
				external: [
					"vue"
				],
				output: {
					globals: {
						vue: "Vue"
					},
					// Map the external dependency to the vendored copy of the Vue 3
					// browser runtime that scripts/build copies into dist/lib. The
					// development build carries runtime warnings; production ships
					// the minified runtime.
					paths: {
						vue: prod ? "../lib/vue.esm-browser.prod.js" : "../lib/vue.esm-browser.js"
					}
				}
			}
		}
	};
});
