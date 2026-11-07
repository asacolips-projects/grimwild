import { createApp, markRaw, reactive } from "../../../lib/vue.esm-browser.js";

/* -------------------------------------------- */
/*  Context synchronization helpers             */
/* -------------------------------------------- */

/**
 * Determine whether a context value should be passed into the reactive store by
 * reference. Documents, data fields, and DOM nodes keep their identity; plain
 * objects and arrays (including live DataModels such as `system`) are
 * shallow-cloned by syncVueContext so that a new identity triggers reactivity
 * on every render.
 * @param {*} value  The value to test.
 * @returns {boolean} Whether the value passes through by reference.
 */
function passesByReference(value) {
	if ((value === null) || (typeof value !== "object")) return false;
	if (value instanceof Node) return true;
	if (value instanceof foundry.abstract.Document) return true;
	if (value instanceof foundry.data.fields.DataField) return true;
	return false;
}

/**
 * Synchronize a reactive store with a freshly prepared render context.
 *
 * Keys absent from the new context are removed, and every key of the new
 * context is (re)assigned. Plain objects, arrays, and Map/Set collections are
 * shallow-cloned on assignment so that live references which are identical
 * across renders (for example `context.system`, or a Foundry Collection such
 * as `context.items`) still produce a new identity and propagate document
 * updates to the mounted components. Spreading a Map or Set into a plain
 * object would silently discard its contents, so collections are copied into
 * a new Map or Set instead.
 *
 * @param {object} store     The reactive store backing the Vue application.
 * @param {object} context   The newly prepared render context.
 */
function syncVueContext(store, context) {
	for (const key of Object.keys(store)) {
		if (!(key in context)) delete store[key];
	}
	for (const [key, value] of Object.entries(context)) {
		if (passesByReference(value)) {
			// Documents, DataFields, and DOM nodes keep their identity across
			// renders; markRaw keeps Vue from deep-proxying them.
			store[key] = markRaw(value);
		}
		else if ((value === null) || (typeof value !== "object")) {
			store[key] = value;
		}
		else if (value instanceof Map) {
			store[key] = new Map(value);
		}
		else if (value instanceof Set) {
			store[key] = new Set(value);
		}
		else if (Array.isArray(value)) {
			store[key] = [...value];
		}
		else {
			store[key] = { ...value };
		}
	}
}

/**
 * Vue rendering mixin for ApplicationV2.
 *
 * The mixin relies on the ApplicationV2 renderer contract: `_renderHTML` is
 * awaited with the prepared context on every render, and `_replaceHTML` is
 * invoked afterwards with the application's content element. The first
 * `_replaceHTML` mounts a Vue application into the content element; every
 * subsequent render only synchronizes the reactive store, leaving the mounted
 * components (and anything they host, such as ProseMirror editors) untouched.
 *
 * @param {Constructor} BaseApplication
 * @returns {VueApplication}
 */
export default function VueRenderingMixin(BaseApplication) {

	class VueApplication extends BaseApplication {

		/** Vue application instance created with createApp(). */
		vueApp = null;

		/** The mounted root component instance. */
		vueRoot = null;

		/** Reactive store shared with the mounted components as `context`. */
		vueContext = null;

		/** Context prepared by the current render, pending the first mount. */
		#pendingContext = null;

		/**
		 * Object to store vue parts.
		 *
		 * @example
		 * vueParts = {
		 *   'document-sheet': {
		 *     component: DocumentSheetVue,
		 *     template: `<document-sheet :context="context">Failed to render</document-sheet>`
		 *   },
		 *   'foobar': {
		 *     component: Foobar,
		 *     template: `<foobar :context="context"/>`
		 *   }
		 * }
		 */
		vueParts = {};

		/**
		 * Getter for vueComponents
		 *
		 * Retrieves an object of component tags to component instances from the vueParts property.
		 *
		 * @example
		 * {
		 *   'document-sheet': DocumentSheetVue,
		 *   'foobar': FoobarVue,
		 * }
		 *
		 * @returns {object} Object with component tags mapped to components.
		 */
		get vueComponents() {
			const components = {};
			for (let [key, part] of Object.entries(this.vueParts)) {
				if (part?.component) {
					components[key] = part.component;
				}
			}
			return components;
		}

		/**
		 * Getter for vueTemplates
		 *
		 * Retrieves an array of template part strings to render.
		 *
		 * @example
		 * [
		 *   '<document-sheet :context="context">Failed to render</document-sheet>',
		 *   '<foobar :context="context"/>'
		 * ]
		 *
		 * @returns {Array} Array of vue template mount points.
		 */
		get vueTemplates() {
			return Object.values(this.vueParts).map((part) => part.template);
		}

		/**
		 * Prepare the render context and route it to the Vue store.
		 *
		 * On the first render the context is stashed until `_replaceHTML` mounts
		 * the application; on subsequent renders the store is synchronized so the
		 * mounted components update reactively.
		 *
		 * @param {ApplicationRenderContext} context
		 * @param {RenderOptions} options
		 * @returns {Promise<void>}
		 *
		 * @protected
		 * @override
		 */
		async _renderHTML(context, options) {
			if (this.vueContext) {
				syncVueContext(this.vueContext, context);
			}
			else {
				this.#pendingContext = context;
			}
		}

		/**
		 * Mount the Vue application into the content element on first render.
		 *
		 * Subsequent renders are handled entirely by the store synchronization in
		 * `_renderHTML`, so the mounted DOM is left untouched.
		 *
		 * @param {*} result            The result of `_renderHTML` (unused).
		 * @param {HTMLElement} content  The application's content element.
		 * @param {RenderOptions} options
		 *
		 * @protected
		 * @override
		 */
		_replaceHTML(result, content, options) {
			if (this.vueApp) return;

			try {
				// Render our mount points and create the reactive store.
				content.innerHTML = this.vueTemplates.join("");
				const context = reactive({});
				syncVueContext(context, this.#pendingContext);
				this.#pendingContext = null;

				// Create the Vue application instance.
				const app = createApp({
					setup: () => ({ context }),
					components: this.vueComponents
				});

				// Expose global Foundry variables.
				app.config.globalProperties.game = game;
				app.config.globalProperties.CONFIG = CONFIG;
				app.config.globalProperties.CONST = CONST;
				app.config.globalProperties.foundry = foundry;

				// Expose the document.
				app.provide("rawDocument", this.document);

				// Mount the vue application. The instance is only kept once
				// mounting has succeeded, so a failed first render resets instead
				// of wedging every later render into an empty frame.
				this.vueRoot = app.mount(content);
				this.vueApp = app;
				this.vueContext = context;
			}
			catch (error) {
				// Reset any partial state so the next render can retry the mount.
				this.vueApp = null;
				this.vueRoot = null;
				this.vueContext = null;
				this.#pendingContext = null;
				throw error;
			}
		}

		/**
		 * Unmount the Vue application when the application frame is torn down.
		 *
		 * This is the authoritative cleanup point on the close path: a render
		 * queued while the close sequence is running (e.g. from submitOnClose
		 * triggering a document update) may otherwise mount a new Vue instance
		 * onto the closing frame after close() has already cleaned up, leaving
		 * state behind that would block the next mount when the sheet is
		 * reopened.
		 *
		 * @param {ApplicationClosingOptions} options
		 * @protected
		 * @override
		 */
		_tearDown(options) {
			this.vueApp?.unmount();
			this.vueApp = null;
			this.vueRoot = null;
			this.vueContext = null;
			super._tearDown(options);
		}

		/**
		 * Closes the application and unmounts the vue application instance.
		 *
		 * @param {ApplicationClosingOptions} options
		 * @returns {Promise<BaseApplication>}
		 *
		 * @override
		 */
		async close(options = {}) {
			try {
				// Only submit on close if the document still exists in its collection. Core treats a
				// submission for a missing document as a creation request, which document sheets don't
				// support - this occurs when a document is deleted while its sheet is open.
				if (this.options.form.submitOnClose && this.isEditable
					&& this.document?.collection?.has(this.document.id)) {
					await this.submit();
				}
			}
			finally {
				// Unmount the vue instance even if submission failed.
				this.vueApp?.unmount();
				this.vueApp = null;
				this.vueRoot = null;
				this.vueContext = null;
				await super.close(options);
			}
		}
	}

	return VueApplication;
}
