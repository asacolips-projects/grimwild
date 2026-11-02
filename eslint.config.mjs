import js from "@eslint/js";
import stylistic from "@stylistic/eslint-plugin";
import foundryConfig from "@typhonjs-fvtt/eslint-config-foundry.js/0.8.0.js";
import eslintPluginVue from "eslint-plugin-vue";
import globals from "globals";
import jsdoc from "eslint-plugin-jsdoc";

// ESLint 10 removed the core formatting rules; their @stylistic equivalents
// are used instead.
export default [
	// Flat config does not ignore dot-directories by default; keep CI helper
	// scripts out of the lint surface as before.
	{ ignores: [".github/**", "dist/**", "foundry/**", "node_modules/**", "src/presets/**", "src/scripts/**", "src/module/forms/codemirror.toml.js", "update-build-tags.js"] },

	// Shared base: recommended rules + browser/es globals + Foundry globals.
	js.configs.recommended,
	{
		languageOptions: {
			ecmaVersion: "latest",
			sourceType: "module",
			globals: {
				...globals.browser,
				...globals.jquery,
				...foundryConfig.globals,
				AdaptiveLightingShader: "readonly",
				CodeMirror: "readonly",
				Color: "readonly",
				DetectionMode: "readonly",
				DocumentSheetConfig: "readonly",
				fromUuidSync: "readonly",
				globalThis: "readonly",
				toml: "readonly",
				Tagify: "readonly",
				grimwild: "readonly"
			}
		},
		plugins: {
			"@stylistic": stylistic,
			jsdoc
		},
		settings: {
			jsdoc: {
				mode: "typescript",
				preferredTypes: {
					".<>": "<>",
					Object: "object"
				},
				tagNamePreference: {
					augments: "extends"
				}
			}
		},
		rules: {
			// New additions to eslint 10's recommended set; defer adoption so the
			// migration doesn't change enforcement of existing code.
			"no-useless-assignment": "off",
			"no-unused-private-class-members": "off",

			"array-callback-return": "warn",
			"constructor-super": "error",
			"default-param-last": "warn",
			"dot-notation": "warn",
			eqeqeq: ["warn", "smart"],
			"getter-return": "warn",
			"no-alert": "warn",
			"no-array-constructor": "warn",
			"no-class-assign": "warn",
			"no-compare-neg-zero": "warn",
			"no-cond-assign": "warn",
			"no-const-assign": "error",
			"no-constant-condition": "warn",
			"no-constructor-return": "warn",
			"no-delete-var": "warn",
			"no-dupe-args": "warn",
			"no-dupe-class-members": "warn",
			"no-dupe-keys": "warn",
			"no-duplicate-case": "warn",
			"no-duplicate-imports": ["warn", { includeExports: true }],
			"no-else-return": "warn",
			"no-empty": ["warn", { allowEmptyCatch: true }],
			"no-empty-character-class": "warn",
			"no-empty-pattern": "warn",
			"no-func-assign": "warn",
			"no-global-assign": "warn",
			"no-implicit-coercion": ["warn", { allow: ["!!"] }],
			"no-implied-eval": "warn",
			"no-import-assign": "warn",
			"no-invalid-regexp": "warn",
			"no-irregular-whitespace": "warn",
			"no-iterator": "warn",
			"no-lone-blocks": "warn",
			"no-lonely-if": "warn",
			"no-misleading-character-class": "warn",
			"no-new-symbol": "warn",
			"no-new-wrappers": "warn",
			"no-nonoctal-decimal-escape": "warn",
			"no-obj-calls": "warn",
			"no-octal": "warn",
			"no-octal-escape": "warn",
			"no-object-constructor": "warn",
			"no-promise-executor-return": "warn",
			"no-proto": "warn",
			"no-regex-spaces": "warn",
			"no-script-url": "warn",
			"no-self-assign": "warn",
			"no-self-compare": "warn",
			"no-setter-return": "warn",
			"no-sequences": "warn",
			"no-template-curly-in-string": "warn",
			"no-this-before-super": "error",
			"no-unexpected-multiline": "warn",
			"no-unmodified-loop-condition": "warn",
			"no-unneeded-ternary": "warn",
			"no-unreachable": "warn",
			"no-unreachable-loop": "warn",
			"no-unsafe-negation": ["warn", { enforceForOrderingRelations: true }],
			"no-unsafe-optional-chaining": ["warn", { disallowArithmeticOperators: true }],
			"no-unused-expressions": "warn",
			"no-useless-backreference": "warn",
			"no-useless-call": "warn",
			"no-useless-catch": "warn",
			"no-useless-computed-key": ["warn", { enforceForClassMembers: true }],
			"no-useless-concat": "warn",
			"no-useless-constructor": "warn",
			"no-useless-rename": "warn",
			"no-useless-return": "warn",
			"no-var": "warn",
			"no-void": "warn",
			"prefer-numeric-literals": "warn",
			"prefer-object-spread": "warn",
			"prefer-regex-literals": "warn",
			"prefer-spread": "warn",
			"symbol-description": "warn",
			"use-isnan": ["warn", { enforceForSwitchCase: true, enforceForIndexOf: true }],
			"valid-typeof": ["warn", { requireStringLiterals: true }],

			"no-throw-literal": "error",
			"no-unused-vars": ["warn", {
				args: "none",
				destructuredArrayIgnorePattern: "^."
			}],

			"@stylistic/array-bracket-spacing": ["warn", "never"],
			"@stylistic/arrow-parens": ["warn", "always"],
			"@stylistic/arrow-spacing": "warn",
			"@stylistic/brace-style": ["warn", "stroustrup"],
			"@stylistic/comma-dangle": ["warn", "never"],
			"@stylistic/comma-spacing": "warn",
			"@stylistic/comma-style": "warn",
			"@stylistic/computed-property-spacing": "warn",
			"@stylistic/dot-location": ["warn", "property"],
			"@stylistic/eol-last": ["error", "always"],
			"func-call-spacing": "warn",
			"@stylistic/indent": ["warn", "tab", { SwitchCase: 1 }],
			"@stylistic/key-spacing": "warn",
			"@stylistic/keyword-spacing": ["warn", { overrides: { catch: { before: true, after: false } } }],
			"@stylistic/lines-between-class-members": "warn",
			"@stylistic/max-len": [
				"warn",
				{
					code: 120,
					ignoreComments: true,
					ignoreTrailingComments: true,
					ignoreUrls: true,
					ignoreStrings: true,
					ignoreTemplateLiterals: true,
					ignoreRegExpLiterals: true
				}
			],
			"@stylistic/multiline-ternary": "off",
			"@stylistic/new-parens": ["warn", "always"],
			"@stylistic/newline-per-chained-call": "warn",
			"no-extra-boolean-cast": ["warn", { enforceForLogicalOperands: true }],
			"@stylistic/no-extra-semi": "warn",
			"@stylistic/no-mixed-operators": "warn",
			"@stylistic/no-multi-spaces": ["warn", { ignoreEOLComments: true }],
			"no-multi-str": "warn",
			"@stylistic/no-multiple-empty-lines": ["warn", { max: 1 }],
			"@stylistic/no-trailing-spaces": "warn",
			"@stylistic/no-whitespace-before-property": "warn",
			"@stylistic/nonblock-statement-body-position": ["warn", "beside"],
			"@stylistic/object-curly-spacing": ["warn", "always"],
			"@stylistic/operator-linebreak": [
				"warn",
				"before",
				{
					overrides: { "=": "after", "+=": "after", "-=": "after" }
				}
			],
			"@stylistic/padded-blocks": "off",
			"@stylistic/quote-props": ["warn", "as-needed", { keywords: false }],
			"@stylistic/quotes": ["warn", "double", { avoidEscape: true, allowTemplateLiterals: "never" }],
			"@stylistic/rest-spread-spacing": ["warn", "never"],
			"@stylistic/semi": "warn",
			"@stylistic/semi-spacing": "warn",
			"@stylistic/semi-style": ["warn", "last"],
			"@stylistic/space-before-blocks": ["warn", "always"],
			"@stylistic/space-before-function-paren": [
				"warn",
				{
					anonymous: "always",
					named: "never",
					asyncArrow: "always"
				}
			],
			"@stylistic/space-in-parens": "warn",
			"@stylistic/space-unary-ops": ["warn", { words: true, nonwords: false }],
			"@stylistic/spaced-comment": "warn",
			"@stylistic/switch-colon-spacing": "warn",
			"@stylistic/template-curly-spacing": ["warn", "never"],
			"unicode-bom": ["warn", "never"],
			"@stylistic/wrap-iife": ["warn", "inside"],

			"jsdoc/check-access": "warn",
			"jsdoc/check-alignment": "warn",
			"jsdoc/check-indentation": "off",
			"jsdoc/check-line-alignment": "off",
			"jsdoc/check-param-names": "warn",
			"jsdoc/check-property-names": "warn",
			"jsdoc/check-tag-names": "warn",
			"jsdoc/check-types": "warn",
			"jsdoc/check-values": "warn",
			"jsdoc/empty-tags": "off",
			"jsdoc/implements-on-classes": "warn",
			"jsdoc/match-description": "off",
			"jsdoc/no-bad-blocks": "warn",
			"jsdoc/no-defaults": "off",
			"jsdoc/no-types": "off",
			"jsdoc/no-undefined-types": "off",
			"jsdoc/require-description": "warn",
			"jsdoc/require-description-complete-sentence": "off",
			"jsdoc/require-example": "off",
			"jsdoc/require-file-overview": "off",
			"jsdoc/require-hyphen-before-param-description": ["warn", "never"],
			"jsdoc/require-jsdoc": "warn",
			"jsdoc/require-param": "warn",
			"jsdoc/require-param-description": "off",
			"jsdoc/require-param-name": "warn",
			"jsdoc/require-param-type": "warn",
			"jsdoc/require-property": "warn",
			"jsdoc/require-property-description": "off",
			"jsdoc/require-property-name": "warn",
			"jsdoc/require-property-type": "warn",
			"jsdoc/require-returns": "warn",
			"jsdoc/require-returns-check": "warn",
			"jsdoc/require-returns-description": "off",
			"jsdoc/require-returns-type": "warn",
			"jsdoc/require-throws": "off",
			"jsdoc/require-yields": "warn",
			"jsdoc/require-yields-check": "warn"
		}
	},

	// Node execution context for build tooling.
	{
		files: ["./*.js", "./*.cjs", "./*.mjs", "scripts/**/*.mjs", "vite/**/*.mjs", "tools/**/*.mjs"],
		languageOptions: {
			globals: globals.node
		}
	},

	// Vue SFCs.
	...eslintPluginVue.configs["flat/essential"].map((config) => ({
		...config,
		files: ["**/*.vue"],
		rules: {
			...config.rules,
			// defineProps results are consumed by the template, not the script.
			"no-unused-vars": ["warn", { args: "none", destructuredArrayIgnorePattern: "^.", varsIgnorePattern: "^props$" }],
			// Tab state and sheet-owned objects like activeItems are mutated
			// through props by design.
			"vue/no-mutating-props": "off",
			// Tabs/Tab/Prosemirror predate this config; renaming their tags is
			// not worth the churn.
			"vue/multi-word-component-names": "off",
			// Template attribute lists get long; the rule is style-only.
			"@stylistic/max-len": "off"
		}
	}))
];
