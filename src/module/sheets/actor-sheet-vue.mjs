import VueRenderingMixin from "./_vue/_vue-application-mixin.mjs";
import { GrimwildBaseVueActorSheet } from "./_vue/_base-vue-actor-sheet.mjs";
import { DocumentSheetVue } from '../../vue/components.vue.es.mjs';

const { DOCUMENT_OWNERSHIP_LEVELS } = CONST;

export class GrimwildActorSheetVue extends VueRenderingMixin(GrimwildBaseVueActorSheet) {
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
		window: {
			resizable: true,
		},
		tag: "form",
		actions: {
			onEditImage: this._onEditImage,
			viewDoc: this._viewDoc,
			createDoc: this._createDoc,
			deleteDoc: this._deleteDoc,
			editEffect: this._viewEffect,
			createEffect: this._createEffect,
			deleteEffect: this._deleteEffect,
			toggleEffect: this._toggleEffect,
			roll: this._onRoll
		},
		// Custom property that's merged into `this.options`
		dragDrop: [{ dragSelector: "[data-drag]", dropSelector: null }],
		form: {
			submitOnChange: true,
			submitOnClose: true,
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
			actor: this.actor.toObject(),
			// Add the actor's data to context.data for easier access, as well as flags.
			system: this.actor.system,
			flags: this.actor.flags,
			// Roll data.
			rollData: this.actor.getRollData() ?? {},
			// Adding a pointer to CONFIG.GRIMWILD
			config: CONFIG.GRIMWILD,
			// Force re-renders. Defined in the vue mixin.
			_renderKey: this._renderKey ?? 0,
			// tabs: this._getTabs(options.parts),
			// Necessary for formInput and formFields helpers
			fields: this.document.schema.fields,
			systemFields: this.document.system.schema.fields
		};

		// Handle tabs.
		this._prepareTabs(context);

		// Handle enriched fields.
		const enrichmentOptions = {
			// Whether to show secret blocks in the finished html
			secrets: this.document.isOwner,
			// Data to fill in for inline rolls
			rollData: this.actor.getRollData() ?? {},
			// Relative UUID resolution
			relativeTo: this.actor
		};

		const editorOptions = {
			toggled: true,
			collaborate: true,
			documentUUID: this.document.uuid,
			height: 300,
		};

		// Handle enriching fields.
		context.editors = {};
		await this._enrichFields(context, enrichmentOptions, editorOptions);

		// Make another pass through the editors to fix the element contents.
		for (let [field, editor] of Object.entries(context.editors)) {
			if (context.editors[field].element) {
				context.editors[field].element.innerHTML = context.editors[field].enriched;
			}
		}

		// Character context.
		if (this.document.type === "character") {
			context.classes = CONFIG.GRIMWILD.classes;
		}

		return context;
	}

	/**
	 * Enrich values for action fields.
	 * 
	 * @param {object} context 
	 * @param {object} enrichmentOptions 
	 * @param {object} editorOptions 
	 */
	async _enrichFields(context, enrichmentOptions, editorOptions) {
		// Enrich other fields.
		const fields = [
			'biography',
		];

		for (let field of fields) {
			context.editors[`system.${field}`] = {

				enriched: await TextEditor.enrichHTML(this.actor.system[field], enrichmentOptions),
				element: foundry.applications.elements.HTMLProseMirrorElement.create({
					...editorOptions,
					name: `system.${field}`,
					value: context.system?.[field] ?? '',
				}),
			};
		}
	}

	/**
	 * Prepare tabs for Vue.
	 * 
	 * @param {object} context 
	 */
	_prepareTabs(context) {
		// Initialize tabs.
		context.tabs = {
			primary: {},
		};

		// Tabs available to all actors.
		context.tabs.primary.details = {
			key: 'details',
			label: game.i18n.localize('GRIMWILD.Actor.Tabs.Details'),
			active: false,
		};

		// Tabs limited to NPCs.
		if (this.actor.type === 'character') {
			context.tabs.primary.talents = {
				key: 'talents',
				label: game.i18n.localize('GRIMWILD.Actor.Tabs.Talents'),
				active: true,
			};
		}

		// More tabs available to all actors.
		context.tabs.primary.effects = {
			key: 'effects',
			label: game.i18n.localize('GRIMWILD.Actor.Tabs.Effects'),
			active: false,
		};

		// Ensure we have a default tab.
		if (this.actor.type !== 'character') {
			context.tabs.primary.details.active = true;
		}
	}

	/* -------------------------------------------- */

	/** ************
	 *
	 *   ACTIONS
	 *
	 **************/
	
	/**
	 * Handle clickable rolls.
	 *
	 * @this GrimwildActorSheet
	 * @param {PointerEvent} event   The originating click event
	 * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
	 * @returns {Promise|void} The roll object, or void.
	 * @protected
	 */
	static async _onRoll(event, target) {
		event.preventDefault();
		const dataset = target.dataset;
		let item = null;

		console.log("foobar");

		// Handle item rolls.
		switch (dataset.rollType) {
			case "item":
				item = this._getEmbeddedDocument(target);
				if (item) return item.roll();
				break;
			case "stat":
				await this.document.system.roll({ stat: dataset.stat });
				break;
		}

		// Handle rolls that supply the formula directly.
		if (dataset.roll) {
			let label = dataset.label ? `[ability] ${dataset.label}` : "";
			let roll = new Roll(dataset.roll, this.actor.getRollData());
			await roll.toMessage({
				speaker: ChatMessage.getSpeaker({ actor: this.actor }),
				flavor: label,
				rollMode: game.settings.get("core", "rollMode")
			});
			return roll;
		}
	}
}