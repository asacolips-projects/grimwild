import { nodeResolve } from "@rollup/plugin-node-resolve";

export default () => ({
	input: "src/module/grimwild.mjs",
	output: {
		dir: "dist/module",
		format: "es",
		sourcemap: true
	},
	plugins: [nodeResolve()]
});
