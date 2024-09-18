import VueRenderingMixin from "./_vue-application-mixin.mjs";
import { DocumentSheetVue } from '../../vue/components.vue.es.mjs';

const { api, sheets } = foundry.applications;
const { DOCUMENT_OWNERSHIP_LEVELS } = CONST;

export class GrimwildActorSheetVue extends VueRenderingMixin(sheets.ActorSheetV2) {
	vueParts = {
		'document-sheet': {
			component: DocumentSheetVue,
			template: `<document-sheet :context="context">Vue rendering for sheet failed.</document-sheet>`
		}
	}

	/** @override */
	static DEFAULT_OPTIONS = {
		classes: ["grimwild", "actor"],
		document: null,
		viewPermission: DOCUMENT_OWNERSHIP_LEVELS.LIMITED,
		editPermission: DOCUMENT_OWNERSHIP_LEVELS.OWNER,
		position: {
			width: 600,
			height: 600
		},
		// actions: {
		// 	onEditImage: this._onEditImage,
		// 	viewDoc: this._viewDoc,
		// 	createDoc: this._createDoc,
		// 	deleteDoc: this._deleteDoc,
		// 	toggleEffect: this._toggleEffect,
		// 	roll: this._onRoll
		// },
		// Custom property that's merged into `this.options`
		dragDrop: [{ dragSelector: "[data-drag]", dropSelector: null }],
		form: {
			submitOnChange: true
		}
	};

	async _prepareContext(options) {
		// Output initialization
		const context = {
			// Validates both permissions and compendium status
			editable: this.isEditable,
			owner: this.document.isOwner,
			limited: this.document.limited,
			// Add the actor document.
			actor: this.actor,
			// Add the actor's data to context.data for easier access, as well as flags.
			system: this.actor.system,
			flags: this.actor.flags,
			// Adding a pointer to CONFIG.GRIMWILD
			config: CONFIG.GRIMWILD,
			// tabs: this._getTabs(options.parts),
			// Necessary for formInput and formFields helpers
			fields: this.document.schema.fields,
			systemFields: this.document.system.schema.fields
		};

		context.editors = {
			'system.biography': {
				enriched: await TextEditor.enrichHTML(
					this.actor.system.biography,
					{
						// Whether to show secret blocks in the finished html
						secrets: this.document.isOwner,
						// Data to fill in for inline rolls
						rollData: this.actor.getRollData(),
						// Relative UUID resolution
						relativeTo: this.actor
					}
				),
				element: context.systemFields.biography.toInput({
					name: 'system.biography',
					value: context.system.biography,
					documentUUID: this.document.uuid,
					toggled: true,
					collaborate: true,
					height: 300,
				}),
				// element: foundry.applications.elements.HTMLProseMirrorElement.create({
				// 	name: 'system.biography',
				// 	toggled: true,
				// 	collaborate: true,
				// 	documentUUID: this.document.uuid,
				// 	height: 300,
				// 	value: context.system.biography,
				// }),
			},
		};

		for (let [field, editor] of Object.entries(context.editors)) {
			context.editors[field].element.innerHTML = context.editors[field].enriched;
		}

		// Character context.
		if (this.document.type === "character") {
			context.classes = CONFIG.GRIMWILD.classes;
		}

		console.log('context', context);

		return context;
	}

	/** ******************
	 *
	 * Actor Override Handling
	 *
	 ********************/

	/**
	 * Submit a document update based on the processed form data.
	 * @param {SubmitEvent} event                   The originating form submission event
	 * @param {HTMLFormElement} form                The form element that was submitted
	 * @param {object} submitData                   Processed and validated form data to be used for a document update
	 * @returns {Promise<void>}
	 * @protected
	 * @override
	 */
	async _processSubmitData(event, form, submitData) {
		const overrides = foundry.utils.flattenObject(this.actor.overrides);
		for (let k of Object.keys(overrides)) delete submitData[k];
		await this.document.update(submitData);
	}

	/**
	 * Disables inputs subject to active effects
	 */
	#disableOverrides() {
		const flatOverrides = foundry.utils.flattenObject(this.actor.overrides);
		for (const override of Object.keys(flatOverrides)) {
			const input = this.element.querySelector(`[name="${override}"]`);
			if (input) {
				input.disabled = true;
			}
		}
	}
}