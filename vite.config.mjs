import path from "path";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
// import { viteStaticCopy } from 'vite-plugin-static-copy'

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		vue({
			template: {
				compilerOptions: {
					isCustomElement: (tag) => ["prose-mirror"].includes(tag)
				}
			}
		})
	],
	resolve: {
		alias: {
			"@/": `${path.resolve(__dirname, "src/vue")}/`,
			"@src/": `${path.resolve(__dirname, "src")}/`,
			"@dist/": `${path.resolve(__dirname, "dist")}/`
		}
	},
	css: {},
	build: {
		sourcemap: true,
		outDir: "./dist/vue",
		lib: {
			entry: path.resolve(__dirname, "src/vue/index.mjs"),
			name: "vueComponents",
			fileName: "components.vue.es"
		},
		rollupOptions: {
			external: [
				"vue"
			],
			input: {
				vueApp: "src/vue/index.mjs"
			},
			output: [
				{
					// dir: 'dist',
					// Provide global variables to use in the UMD build
					// Add external deps here
					globals: {
						vue: "Vue"
					},
					// Map the external dependency to a local copy of Vue 3 esm.
					paths: {
						vue: "../lib/vue.esm-browser.js"
					},
					assetFileNames: (assetInfo) => {
						if (assetInfo.name == "style.css") return "styles.vue.css";
						return assetInfo.name;
					}
				}
			]
		}
	}
});
